do $$
begin
  if to_regclass('public.notifications') is null
     or to_regclass('public.applications') is null
     or to_regclass('public.jobs') is null
     or to_regclass('public.employer_users') is null
     or to_regclass('public.profiles') is null then
    raise exception 'Apply the application notification and application schema migrations before this migration';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'notifications'
      and column_name in ('recipient_user_id', 'notification_type', 'application_id', 'job_id', 'company_id')
    group by table_name
    having count(distinct column_name) = 5
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'applications'
      and column_name in ('id', 'job_id', 'applicant_id', 'user_id')
    group by table_name
    having count(distinct column_name) = 4
  ) or not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'jobs'
      and column_name in ('id', 'company_id')
    group by table_name
    having count(distinct column_name) = 2
  ) then
    raise exception 'Required notification/application association columns are missing';
  end if;
end;
$$;

drop policy if exists "Users view their own notifications" on public.notifications;

create policy "Users view their own notifications"
  on public.notifications
  for select
  to authenticated
  using (
    recipient_user_id = (select auth.uid())
    and exists (
      select 1
      from public.applications a
      join public.jobs j on j.id = a.job_id
      where a.id = notifications.application_id
        and a.job_id = notifications.job_id
        and j.company_id = notifications.company_id
        and (
          (
            notifications.notification_type = 'new_application'
            and exists (
              select 1
              from public.employer_users eu
              join public.profiles p on p.id = eu.user_id
              where eu.user_id = (select auth.uid())
                and eu.company_id = j.company_id
                and eu.role in ('owner', 'admin', 'member')
                and p.user_type = 'employer'
            )
          )
          or (
            notifications.notification_type <> 'new_application'
            and a.applicant_id = (select auth.uid())
            and a.user_id = (select auth.uid())
            and exists (
              select 1
              from public.profiles p
              where p.id = (select auth.uid())
                and p.user_type = 'job_seeker'
            )
          )
        )
    )
  );
