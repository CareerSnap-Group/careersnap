-- Secure general-discovery resume access without changing application-linked access.

create or replace function public.can_access_discoverable_resume(storage_object_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_discover_candidates()
    and exists (
      select 1
      from public.resumes r
      join public.profiles p on p.id = r.user_id
      where r.storage_path = storage_object_path
        and p.user_type = 'job_seeker'
        and p.allow_employer_discovery = true
    );
$$;

revoke all on function public.can_access_discoverable_resume(text) from public;
grant execute on function public.can_access_discoverable_resume(text) to authenticated;

drop policy if exists "Employers view discoverable candidate resumes" on storage.objects;
create policy "Employers view discoverable candidate resumes" on storage.objects
for select to authenticated using (
  bucket_id = 'resumes'
  and public.can_access_discoverable_resume(name)
);

revoke all on function public.get_discoverable_resume_path(uuid, uuid) from public;
