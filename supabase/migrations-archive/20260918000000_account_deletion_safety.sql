-- Preserve shared business and financial records when an account is deleted.
-- The deletion endpoint transfers or nulls ownership before deleting profiles.

alter table public.companies
  alter column created_by drop not null;

alter table public.companies
  drop constraint if exists companies_created_by_fkey;
alter table public.companies
  add constraint companies_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.jobs
  alter column created_by drop not null;

alter table public.jobs
  drop constraint if exists jobs_created_by_fkey;
alter table public.jobs
  add constraint jobs_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;
