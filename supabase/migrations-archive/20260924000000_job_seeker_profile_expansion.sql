-- Expand the existing Job Seeker profile so it covers the detailed information already
-- used across the CareerSnap schema without creating a separate profile system.

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists city text,
  add column if not exists province text,
  add column if not exists country text,
  add column if not exists professional_headline text,
  add column if not exists current_job_title text,
  add column if not exists current_employer text,
  add column if not exists years_experience integer,
  add column if not exists employment_status text,
  add column if not exists desired_job_title text,
  add column if not exists desired_employment_type text,
  add column if not exists desired_work_arrangement text,
  add column if not exists preferred_locations text[],
  add column if not exists expected_salary numeric,
  add column if not exists availability_start_date date;

update public.profiles
set first_name = coalesce(first_name, split_part(coalesce(full_name, ''), ' ', 1)),
    last_name = coalesce(last_name, nullif(trim(substr(coalesce(full_name, ''), length(split_part(coalesce(full_name, ''), ' ', 1)) + 2)), '')),
    professional_headline = coalesce(professional_headline, headline);

alter table public.profiles
  drop constraint if exists profiles_years_experience_valid;

alter table public.profiles
  add constraint profiles_years_experience_valid
  check (years_experience is null or years_experience >= 0);

create table if not exists public.profile_certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  issuing_organization text,
  issue_date date,
  expiry_date date,
  credential_id text,
  credential_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_languages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  proficiency text not null default 'Professional',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_languages_proficiency_valid
    check (proficiency in ('Basic', 'Conversational', 'Professional', 'Fluent', 'Native'))
);

create table if not exists public.profile_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_certifications_user_id_idx on public.profile_certifications(user_id);
create index if not exists profile_languages_user_id_idx on public.profile_languages(user_id);
create index if not exists profile_links_user_id_idx on public.profile_links(user_id);

create trigger profile_certifications_updated_at
before update on public.profile_certifications
for each row execute function public.set_updated_at();

create trigger profile_languages_updated_at
before update on public.profile_languages
for each row execute function public.set_updated_at();

create trigger profile_links_updated_at
before update on public.profile_links
for each row execute function public.set_updated_at();

alter table public.profile_certifications enable row level security;
alter table public.profile_languages enable row level security;
alter table public.profile_links enable row level security;

create policy "Users manage own certifications" on public.profile_certifications
for all using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage own languages" on public.profile_languages
for all using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users manage own profile links" on public.profile_links
for all using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
