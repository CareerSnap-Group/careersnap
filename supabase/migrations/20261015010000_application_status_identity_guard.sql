do $$
begin
  if to_regclass('public.applications') is null then
    raise exception 'Required table public.applications is missing';
  end if;

  if to_regprocedure('public.prevent_application_identity_change()') is null
     or not exists (
       select 1
       from pg_trigger t
       where t.tgrelid = 'public.applications'::regclass
         and t.tgname = 'applications_identity_protection'
         and t.tgfoid = to_regprocedure('public.prevent_application_identity_change()')
         and not t.tgisinternal
         and t.tgenabled <> 'D'
         and (t.tgtype & 1) = 1
         and (t.tgtype & 2) = 2
         and (t.tgtype & 16) = 16
     ) then
    raise exception 'Apply 20261015000000_application_status_transition_notifications.sql before this migration';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'applications'
      and column_name in ('id', 'job_id', 'applicant_id', 'user_id', 'status')
    group by table_name
    having count(distinct column_name) = 5
  ) then
    raise exception 'Required application identity and status columns are missing';
  end if;
end;
$$;

create or replace function public.prevent_application_identity_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, auth
as $$
declare
  request_role text := auth.role();
begin
  if request_role = 'service_role'
     or (request_role is null and current_user in ('postgres', 'supabase_admin')) then
    return new;
  end if;

  if auth.uid() = old.applicant_id
     and new.status is distinct from old.status then
    raise exception using
      errcode = '42501',
      message = 'Application status is managed by the employer';
  end if;

  if new.id is distinct from old.id
     or new.job_id is distinct from old.job_id
     or new.applicant_id is distinct from old.applicant_id
     or new.user_id is distinct from old.user_id then
    raise exception using
      errcode = '42501',
      message = 'Application identity fields cannot be changed';
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_application_identity_change() from public, anon, authenticated;

drop trigger if exists applications_status_protection on public.applications;
