do $$
declare
  required_status text;
begin
  if to_regtype('public.application_status') is null then
    raise exception 'Required type public.application_status is missing';
  end if;

  if (
    select a.atttypid
    from pg_attribute a
    where a.attrelid = 'public.applications'::regclass
      and a.attname = 'status'
      and not a.attisdropped
  ) is distinct from 'public.application_status'::regtype then
    raise exception 'public.applications.status must use public.application_status';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'applications'
      and column_name = 'user_id'
  ) then
    raise exception 'Required column public.applications.user_id is missing';
  end if;

  foreach required_status in array array[
    'applied', 'submitted', 'viewed', 'reviewing', 'shortlisted',
    'interview', 'offer', 'hired', 'rejected', 'accepted'
  ]
  loop
    if not exists (
      select 1
      from pg_enum e
      where e.enumtypid = 'public.application_status'::regtype
        and e.enumlabel = required_status
    ) then
      raise exception 'Required application status % is not supported by public.application_status', required_status;
    end if;
  end loop;
end;
$$;

alter table public.notifications
  drop constraint if exists notifications_notification_type_check;

alter table public.notifications
  add constraint notifications_notification_type_check
  check (notification_type in (
    'new_application',
    'application_viewed',
    'application_reviewing',
    'application_shortlisted',
    'application_interview',
    'application_offer',
    'application_hired',
    'application_rejected',
    'application_accepted'
  ));

create unique index if not exists notifications_application_viewed_once_idx
  on public.notifications (recipient_user_id, application_id)
  where notification_type = 'application_viewed';

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
    when 'viewed' then 'application_viewed'
    when 'reviewing' then 'application_reviewing'
    when 'shortlisted' then 'application_shortlisted'
    when 'interview' then 'application_interview'
    when 'offer' then 'application_offer'
    when 'hired' then 'application_hired'
    when 'rejected' then 'application_rejected'
    when 'accepted' then 'application_accepted'
    else null
  end;

  if v_notification_type is null then
    return new;
  end if;

  if new.user_id is distinct from new.applicant_id then
    return new;
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = new.applicant_id
      and p.user_type = 'job_seeker'
  ) then
    return new;
  end if;

  if new.status::text = 'viewed' and exists (
    select 1
    from public.notifications n
    where n.recipient_user_id = new.applicant_id
      and n.application_id = new.id
      and n.notification_type = 'application_viewed'
  ) then
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
    when 'viewed' then 'Application viewed'
    when 'reviewing' then 'Application under review'
    when 'shortlisted' then 'Application shortlisted'
    when 'interview' then 'Interview stage'
    when 'offer' then 'Job offer'
    when 'hired' then 'Marked as hired'
    when 'rejected' then 'Application rejected'
    when 'accepted' then 'Application accepted'
  end;

  v_notification_message := case new.status::text
    when 'viewed' then 'The employer has marked your application for ' || v_job_title || ' at ' || v_company_name || ' as Viewed.'
    when 'reviewing' then 'Your application for ' || v_job_title || ' at ' || v_company_name || ' has moved to Reviewing.'
    when 'shortlisted' then 'Your application for ' || v_job_title || ' at ' || v_company_name || ' has been Shortlisted.'
    when 'interview' then 'Your application for ' || v_job_title || ' at ' || v_company_name || ' has moved to Interview.'
    when 'offer' then 'Your application for ' || v_job_title || ' at ' || v_company_name || ' has moved to Offer.'
    when 'hired' then 'Your application for ' || v_job_title || ' at ' || v_company_name || ' has been marked Hired.'
    when 'rejected' then 'Your application for ' || v_job_title || ' at ' || v_company_name || ' has been marked Rejected.'
    when 'accepted' then 'Your application for ' || v_job_title || ' at ' || v_company_name || ' has been marked Accepted.'
  end;

  insert into public.notifications (
    recipient_user_id, notification_type, title, message,
    application_id, job_id, company_id
  ) values (
    new.applicant_id, v_notification_type, v_notification_title, v_notification_message,
    new.id, new.job_id, v_company_id
  )
  on conflict (recipient_user_id, application_id)
    where notification_type = 'application_viewed' do nothing;

  return new;
end;
$$;

revoke all on function public.create_application_notifications() from public, anon, authenticated;
