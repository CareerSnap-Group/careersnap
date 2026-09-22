-- Forward-only additions for the production CareerSnap data model.
-- This migration intentionally preserves the original tables and columns.

alter table public.experiences add column if not exists employment_type text;

alter table public.skills alter column user_id drop not null;
alter table public.skills drop constraint if exists skills_user_id_name_key;
alter table public.skills add constraint skills_name_key unique (name);

create table if not exists public.user_skills (
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, skill_id)
);
create index if not exists user_skills_skill_id_idx on public.user_skills(skill_id);

alter table public.resumes add column if not exists file_path text;
alter table public.resumes add column if not exists is_default boolean;
update public.resumes set file_path = coalesce(file_path, storage_path), is_default = coalesce(is_default, is_primary);
alter table public.resumes alter column file_path set not null;
alter table public.resumes alter column is_default set default false;
alter table public.resumes alter column is_default set not null;

alter table public.companies add column if not exists website text;
alter table public.companies add column if not exists industry text;
alter table public.companies add column if not exists location text;
update public.companies set website = coalesce(website, website_url);

alter table public.jobs add column if not exists employment_type text;
alter table public.jobs add column if not exists workplace_type text;
alter table public.jobs add column if not exists application_url text;
update public.jobs
set employment_type = coalesce(employment_type, job_type),
    workplace_type = coalesce(workplace_type, work_location);
alter table public.jobs alter column employment_type set default 'full-time';
alter table public.jobs alter column workplace_type set default 'onsite';
create index if not exists jobs_created_at_idx on public.jobs(created_at desc);
create index if not exists jobs_expires_at_idx on public.jobs(expires_at);
create index if not exists jobs_employment_type_idx on public.jobs(employment_type);

alter type public.application_status add value if not exists 'submitted';
alter type public.application_status add value if not exists 'reviewing';
alter type public.application_status add value if not exists 'shortlisted';
alter type public.application_status add value if not exists 'hired';
alter table public.applications add column if not exists user_id uuid;
update public.applications set user_id = applicant_id where user_id is null;
alter table public.applications alter column user_id set not null;
alter table public.applications add constraint applications_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade;
create index if not exists applications_user_id_idx on public.applications(user_id);

alter table public.user_skills enable row level security;
drop policy if exists "Users manage own user skills" on public.user_skills;
create policy "Users manage own user skills" on public.user_skills for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "Authenticated users view skills" on public.skills;
create policy "Authenticated users view skills" on public.skills for select to authenticated using (true);
drop policy if exists "Users create shared skills" on public.skills;
create policy "Users create shared skills" on public.skills for insert to authenticated with check (user_id is null or user_id = (select auth.uid()));

create policy "Public can view companies for published jobs" on public.companies for select using (exists (select 1 from public.jobs where jobs.company_id = companies.id and jobs.status = 'published'));

create or replace function public.can_manage_membership(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.employer_users
    where company_id = target_company_id
      and user_id = (select auth.uid())
      and role in ('owner', 'admin')
  );
$$;

drop policy if exists "Company managers manage membership" on public.employer_users;
create policy "Company admins manage membership" on public.employer_users for all using (
  public.can_manage_membership(company_id)
) with check (
  public.can_manage_membership(company_id)
);

-- Private resume files and public profile photos use separate buckets.
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false), ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy "Users manage own resume files" on storage.objects for all to authenticated
using (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users manage own profile photos" on storage.objects for all to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', trim(concat_ws(' ', new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name'))),
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  insert into public.employer_users (user_id, company_id, role)
  select new.id, c.id, 'owner'
  from public.companies c
  where c.created_by = new.id
  on conflict do nothing;
  return new;
end;
$$;
