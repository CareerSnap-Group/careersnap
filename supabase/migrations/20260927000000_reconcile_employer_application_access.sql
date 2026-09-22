create or replace function public.can_manage_application_access(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_company_id is not null
    and (select auth.uid()) is not null
    and exists (
      select 1
      from public.profiles p
      join public.employer_users eu on eu.user_id = p.id
      where p.id = (select auth.uid())
        and p.user_type = 'employer'
        and eu.company_id = target_company_id
        and eu.role in ('owner', 'admin')
    );
$$;

revoke all on function public.can_manage_application_access(uuid) from public;
grant execute on function public.can_manage_application_access(uuid) to authenticated;

drop policy if exists "Employers view applications for managed jobs" on public.applications;
create policy "Employers view applications for managed jobs" on public.applications
for select using (
  exists (
    select 1
    from public.jobs j
    where j.id = applications.job_id
      and public.can_manage_application_access(j.company_id)
  )
);

drop policy if exists "Employers update applications for managed jobs" on public.applications;
create policy "Employers update applications for managed jobs" on public.applications
for update using (
  exists (
    select 1
    from public.jobs j
    where j.id = applications.job_id
      and public.can_manage_application_access(j.company_id)
  )
) with check (
  exists (
    select 1
    from public.jobs j
    where j.id = applications.job_id
      and public.can_manage_application_access(j.company_id)
  )
);

drop policy if exists "Users update own applications" on public.applications;
create policy "Users update own applications" on public.applications
for update using (
  (select auth.uid()) = applicant_id
  and (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.user_type = 'job_seeker'
  )
) with check (
  (select auth.uid()) = applicant_id
  and (select auth.uid()) = user_id
  and exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.user_type = 'job_seeker'
  )
);

drop policy if exists "Employers view application resumes" on public.resumes;
create policy "Employers view application resumes" on public.resumes
for select using (
  exists (
    select 1
    from public.applications a
    join public.jobs j on j.id = a.job_id
    where a.resume_id = public.resumes.id
      and a.applicant_id = public.resumes.user_id
      and a.user_id = public.resumes.user_id
      and public.can_manage_application_access(j.company_id)
  )
);

drop policy if exists "Employers view resumes attached to managed applications" on storage.objects;
create policy "Employers view resumes attached to managed applications" on storage.objects
for select to authenticated using (
  bucket_id = 'resumes'
  and exists (
    select 1
    from public.resumes r
    join public.applications a on a.resume_id = r.id
    join public.jobs j on j.id = a.job_id
    where r.storage_path = storage.objects.name
      and r.user_id = a.applicant_id
      and a.applicant_id = a.user_id
      and public.can_manage_application_access(j.company_id)
  )
);

revoke execute on function public.can_discover_candidates() from anon, public;
grant execute on function public.can_discover_candidates() to authenticated;

revoke execute on function public.search_discoverable_candidates(text, text, text, text, text, text, boolean, integer, integer) from anon, public;
grant execute on function public.search_discoverable_candidates(text, text, text, text, text, text, boolean, integer, integer) to authenticated;

revoke execute on function public.get_discoverable_candidate(uuid) from anon, public;
grant execute on function public.get_discoverable_candidate(uuid) to authenticated;

revoke execute on function public.can_access_candidate(uuid) from anon, public;
grant execute on function public.can_access_candidate(uuid) to authenticated;

revoke execute on function public.can_access_discoverable_resume(text) from anon, public;
grant execute on function public.can_access_discoverable_resume(text) to authenticated;
