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

alter table public.subscriptions
  alter column user_id drop not null;

alter table public.subscriptions
  drop constraint if exists subscriptions_user_id_fkey;
alter table public.subscriptions
  add constraint subscriptions_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;

alter table public.payments
  alter column user_id drop not null;

alter table public.payments
  drop constraint if exists payments_user_id_fkey;
alter table public.payments
  add constraint payments_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete set null;
