do $$
declare
  required_column record;
begin
  if to_regtype('public.application_status') is null then
    raise exception 'Required type public.application_status is missing';
  end if;

  if exists (
    select required.status
    from unnest(array['submitted', 'shortlisted', 'rejected']::text[]) as required(status)
    where not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      join pg_namespace n on n.oid = t.typnamespace
      where n.nspname = 'public'
        and t.typname = 'application_status'
        and e.enumlabel = required.status
    )
  ) then
    raise exception 'The live application_status enum is missing a required existing status';
  end if;

  for required_column in
    select * from (values
      ('profiles', 'id'),
      ('profiles', 'full_name'),
      ('profiles', 'user_type'),
      ('applications', 'id'),
      ('applications', 'job_id'),
      ('applications', 'applicant_id'),
      ('applications', 'status'),
      ('jobs', 'id'),
      ('jobs', 'company_id'),
      ('jobs', 'title'),
      ('companies', 'id'),
      ('companies', 'name'),
      ('employer_users', 'company_id'),
      ('employer_users', 'user_id'),
      ('employer_users', 'role')
    ) as required(table_name, column_name)
  loop
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = required_column.table_name
        and column_name = required_column.column_name
    ) then
      raise exception 'Required column public.%.% is missing', required_column.table_name, required_column.column_name;
    end if;
  end loop;
end;
$$;

alter type public.application_status add value if not exists 'accepted';

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null check (notification_type in (
    'new_application',
    'application_shortlisted',
    'application_rejected',
    'application_accepted'
  )),
  title text not null,
  message text not null,
  application_id uuid not null references public.applications(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_created_at_idx
  on public.notifications (recipient_user_id, created_at desc);
create index notifications_unread_recipient_created_at_idx
  on public.notifications (recipient_user_id, created_at desc)
  where read_at is null;
create unique index notifications_new_application_once_idx
  on public.notifications (recipient_user_id, application_id)
  where notification_type = 'new_application';

alter table public.notifications enable row level security;
revoke all on public.notifications from public, anon, authenticated;
grant select on public.notifications to authenticated;

create policy "Users view their own notifications"
  on public.notifications
  for select
  to authenticated
  using (
    recipient_user_id = (select auth.uid())
    and (
      notification_type <> 'new_application'
      or exists (
        select 1
        from public.employer_users eu
        join public.profiles p on p.id = eu.user_id
        where eu.user_id = (select auth.uid())
          and eu.company_id = notifications.company_id
          and eu.role in ('owner', 'admin', 'member')
          and p.user_type = 'employer'
      )
    )
  );

create or replace function public.create_application_notifications()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_job_title text;
  v_company_id uuid;
  v_company_name text;
  v_notification_type text;
  v_notification_title text;
  v_notification_message text;
begin
  if tg_op = 'INSERT' then
    select j.title, j.company_id, c.name
    into v_job_title, v_company_id, v_company_name
    from public.jobs j
    join public.companies c on c.id = j.company_id
    where j.id = new.job_id;

    if not found then
      return new;
    end if;

    insert into public.notifications (
      recipient_user_id, notification_type, title, message,
      application_id, job_id, company_id
    )
    select
      eu.user_id,
      'new_application',
      'New application',
      coalesce(nullif(btrim(p.full_name), ''), 'A Job Seeker') || ' applied for ' || v_job_title || '.',
      new.id,
      new.job_id,
      v_company_id
    from public.employer_users eu
    join public.profiles p on p.id = eu.user_id
    where eu.company_id = v_company_id
      and eu.role in ('owner', 'admin', 'member')
      and p.user_type = 'employer'
    on conflict (recipient_user_id, application_id)
      where notification_type = 'new_application' do nothing;

    return new;
  end if;

  if old.status is not distinct from new.status then
    return new;
  end if;

  v_notification_type := case new.status::text
    when 'shortlisted' then 'application_shortlisted'
    when 'rejected' then 'application_rejected'
    when 'accepted' then 'application_accepted'
    else null
  end;

  if v_notification_type is null then
    return new;
  end if;

  select j.title, j.company_id, c.name
  into v_job_title, v_company_id, v_company_name
  from public.jobs j
  join public.companies c on c.id = j.company_id
  where j.id = new.job_id;

  if not found then
    return new;
  end if;

  v_notification_title := case new.status::text
    when 'shortlisted' then 'Application shortlisted'
    when 'rejected' then 'Application rejected'
    when 'accepted' then 'Application accepted'
  end;
  v_notification_message := 'Your application for ' || v_job_title || ' at ' || v_company_name
    || ' has been ' || new.status::text || '.';

  insert into public.notifications (
    recipient_user_id, notification_type, title, message,
    application_id, job_id, company_id
  ) values (
    new.applicant_id, v_notification_type, v_notification_title, v_notification_message,
    new.id, new.job_id, v_company_id
  );

  return new;
end;
$$;

revoke all on function public.create_application_notifications() from public, anon, authenticated;

create trigger applications_notify_employers_after_insert
  after insert on public.applications
  for each row execute function public.create_application_notifications();

create trigger applications_notify_applicant_after_status_change
  after update of status on public.applications
  for each row execute function public.create_application_notifications();

create or replace function public.mark_notification_read(p_notification_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  update public.notifications
  set read_at = coalesce(read_at, pg_catalog.now())
  where id = p_notification_id
    and recipient_user_id = auth.uid();

  return found;
end;
$$;

revoke all on function public.mark_notification_read(uuid) from public, anon;
grant execute on function public.mark_notification_read(uuid) to authenticated;