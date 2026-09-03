create extension if not exists "pgcrypto";

create type public.user_type as enum ('job_seeker', 'employer');
create type public.application_status as enum ('applied', 'viewed', 'interview', 'offer', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  location text,
  headline text,
  bio text,
  profile_photo_url text,
  user_type public.user_type not null default 'job_seeker',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_title text not null,
  company_name text not null,
  location text,
  start_date date not null,
  end_date date,
  is_current boolean not null default false,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experiences_dates_valid check (end_date is null or end_date >= start_date)
);

create table public.education (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  institution text not null,
  degree text,
  field_of_study text,
  start_date date,
  end_date date,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint education_dates_valid check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  proficiency text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  file_url text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, storage_path)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  website_url text,
  logo_url text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employer_users (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  slug text not null unique,
  description text not null,
  responsibilities text[] not null default '{}',
  requirements text[] not null default '{}',
  benefits text[] not null default '{}',
  location text not null,
  work_location text not null,
  job_type text not null,
  experience_level text not null,
  salary_min numeric,
  salary_max numeric,
  salary_currency text,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_salary_valid check (salary_max is null or salary_min is null or salary_max >= salary_min)
);

create table public.job_skills (
  job_id uuid not null references public.jobs(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (job_id, skill_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  resume_id uuid references public.resumes(id) on delete set null,
  cover_letter text,
  status public.application_status not null default 'applied',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);

create table public.saved_jobs (
  user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create index experiences_user_id_idx on public.experiences(user_id);
create index education_user_id_idx on public.education(user_id);
create index skills_user_id_idx on public.skills(user_id);
create index resumes_user_id_idx on public.resumes(user_id);
create index employer_users_user_id_idx on public.employer_users(user_id);
create index jobs_company_id_idx on public.jobs(company_id);
create index jobs_status_published_at_idx on public.jobs(status, published_at desc);
create index jobs_location_idx on public.jobs(location);
create index job_skills_skill_id_idx on public.job_skills(skill_id);
create index applications_applicant_id_idx on public.applications(applicant_id);
create index applications_job_id_idx on public.applications(job_id);
create index saved_jobs_job_id_idx on public.saved_jobs(job_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['profiles', 'experiences', 'education', 'skills', 'resumes', 'companies', 'employer_users', 'jobs', 'applications'] loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end;
$$;

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
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.employer_users
    where company_id = target_company_id and user_id = (select auth.uid())
  );
$$;

create or replace function public.can_manage_company(target_company_id uuid)
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
      and role in ('owner', 'admin', 'member')
  );
$$;

alter table public.profiles enable row level security;
alter table public.experiences enable row level security;
alter table public.education enable row level security;
alter table public.skills enable row level security;
alter table public.resumes enable row level security;
alter table public.companies enable row level security;
alter table public.employer_users enable row level security;
alter table public.jobs enable row level security;
alter table public.job_skills enable row level security;
alter table public.applications enable row level security;
alter table public.saved_jobs enable row level security;

create policy "Users can view own profile" on public.profiles for select using ((select auth.uid()) = id);
create policy "Users can update own profile" on public.profiles for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Users manage own experiences" on public.experiences for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own education" on public.education for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own skills" on public.skills for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users manage own resumes" on public.resumes for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Members view their companies" on public.companies for select using (public.is_company_member(id) or created_by = (select auth.uid()));
create policy "Employers create companies" on public.companies for insert with check (created_by = (select auth.uid()));
create policy "Members update their companies" on public.companies for update using (public.can_manage_company(id)) with check (public.can_manage_company(id));
create policy "Owners delete their companies" on public.companies for delete using (created_by = (select auth.uid()));

create policy "Members view company membership" on public.employer_users for select using (user_id = (select auth.uid()) or public.is_company_member(company_id));
create policy "Company managers manage membership" on public.employer_users for all using (public.can_manage_company(company_id)) with check (public.can_manage_company(company_id));

create policy "Public can view active jobs" on public.jobs for select using (status = 'published' and (expires_at is null or expires_at > now()));
create policy "Employers view managed jobs" on public.jobs for select using (public.can_manage_company(company_id));
create policy "Employers create managed jobs" on public.jobs for insert with check (public.can_manage_company(company_id) and created_by = (select auth.uid()));
create policy "Employers update managed jobs" on public.jobs for update using (public.can_manage_company(company_id)) with check (public.can_manage_company(company_id));
create policy "Employers delete managed jobs" on public.jobs for delete using (public.can_manage_company(company_id));

create policy "Public can view skills for active jobs" on public.job_skills for select using (exists (select 1 from public.jobs where jobs.id = job_id and jobs.status = 'published'));
create policy "Employers manage job skills" on public.job_skills for all using (exists (select 1 from public.jobs where jobs.id = job_id and public.can_manage_company(jobs.company_id))) with check (exists (select 1 from public.jobs where jobs.id = job_id and public.can_manage_company(jobs.company_id)));

create policy "Users view own applications" on public.applications for select using ((select auth.uid()) = applicant_id);
create policy "Users create own applications" on public.applications for insert with check ((select auth.uid()) = applicant_id);
create policy "Users update own applications" on public.applications for update using ((select auth.uid()) = applicant_id) with check ((select auth.uid()) = applicant_id);
create policy "Users delete own applications" on public.applications for delete using ((select auth.uid()) = applicant_id);
create policy "Employers view applications for managed jobs" on public.applications for select using (exists (select 1 from public.jobs where jobs.id = job_id and public.can_manage_company(jobs.company_id)));
create policy "Employers update applications for managed jobs" on public.applications for update using (exists (select 1 from public.jobs where jobs.id = job_id and public.can_manage_company(jobs.company_id))) with check (exists (select 1 from public.jobs where jobs.id = job_id and public.can_manage_company(jobs.company_id)));

create policy "Users manage own saved jobs" on public.saved_jobs for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
