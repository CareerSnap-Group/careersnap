-- Narrow candidate access for employers. Candidate data remains inaccessible
-- unless the candidate has applied to a job in a company they manage.

create or replace function public.can_access_candidate(candidate_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.employer_users eu on eu.company_id = j.company_id
    join public.profiles requester on requester.id = auth.uid()
    where a.applicant_id = candidate_id
      and a.user_id = candidate_id
      and eu.user_id = auth.uid()
      and eu.role in ('owner', 'admin')
      and requester.user_type = 'employer'
  );
$$;

drop policy if exists "Employers view applied candidate profiles" on public.profiles;
create policy "Employers view applied candidate profiles" on public.profiles
for select using (public.can_access_candidate(id));

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
      and public.can_manage_company(j.company_id)
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
    where r.storage_path = name
      and r.user_id = a.applicant_id
      and a.applicant_id = a.user_id
      and public.can_manage_company(j.company_id)
  )
);