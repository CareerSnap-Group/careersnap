-- Forward-only role and employer monetization model.
-- Existing CareerSnap tables remain the source for profiles, companies, jobs and applications.

create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled', 'expired');
create type public.billing_interval as enum ('month', 'year', 'one_time');

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  price numeric(12, 2) not null default 0 check (price >= 0),
  currency text not null default 'ZAR',
  billing_interval public.billing_interval not null default 'month',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_entitlements (
  plan_id uuid not null references public.subscription_plans(id) on delete cascade,
  feature text not null,
  limit_value integer,
  created_at timestamptz not null default now(),
  primary key (plan_id, feature),
  constraint plan_entitlements_limit_valid check (limit_value is null or limit_value >= 0)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status public.subscription_status not null,
  provider text not null default 'internal',
  provider_customer_id text,
  provider_subscription_id text unique,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists subscriptions_one_current_per_user
  on public.subscriptions(user_id)
  where status in ('trialing', 'active', 'past_due');

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  provider text not null,
  provider_payment_id text not null unique,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null,
  status text not null,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_webhook_events (
  provider text not null,
  event_id text not null,
  event_type text not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (provider, event_id)
);

insert into public.subscription_plans (name, slug, description, price, currency, billing_interval)
values
  ('Free', 'free', 'A practical starting point for occasional hiring.', 0, 'ZAR', 'month'),
  ('Starter', 'starter', 'For growing teams hiring regularly.', 500, 'ZAR', 'month'),
  ('Professional', 'professional', 'For teams running an active recruitment pipeline.', 1500, 'ZAR', 'month'),
  ('Business', 'business', 'For larger hiring teams and advanced recruitment.', 3500, 'ZAR', 'month')
on conflict (slug) do nothing;

insert into public.plan_entitlements (plan_id, feature, limit_value)
select id, feature, limit_value
from public.subscription_plans plans
cross join (values
  ('free', 'job_posting_limit', 1), ('free', 'active_jobs_limit', 1), ('free', 'applicant_management', 1),
  ('starter', 'job_posting_limit', 5), ('starter', 'active_jobs_limit', 5), ('starter', 'applicant_management', 1), ('starter', 'analytics', 1),
  ('professional', 'job_posting_limit', 20), ('professional', 'active_jobs_limit', 20), ('professional', 'applicant_management', 1), ('professional', 'candidate_search', 1), ('professional', 'analytics', 1), ('professional', 'company_branding', 1),
  ('business', 'job_posting_limit', 100), ('business', 'active_jobs_limit', 100), ('business', 'applicant_management', 1), ('business', 'candidate_search', 1), ('business', 'advanced_candidate_search', 1), ('business', 'analytics', 1), ('business', 'company_branding', 1), ('business', 'priority_support', 1)
) as features(slug, feature, limit_value)
where plans.slug = features.slug
on conflict (plan_id, feature) do update set limit_value = excluded.limit_value;

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists plan_entitlements_feature_idx on public.plan_entitlements(feature);

create or replace function public.current_plan_id(target_user_id uuid default auth.uid())
returns uuid
language sql stable security definer set search_path = public
as $$
  select s.plan_id from public.subscriptions s
  where s.user_id = target_user_id
    and s.status in ('trialing', 'active', 'past_due')
    and (s.current_period_end is null or s.current_period_end > now())
  order by s.created_at desc limit 1;
$$;

create or replace function public.has_entitlement(target_user_id uuid, requested_feature text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.plan_entitlements e
    where e.plan_id = public.current_plan_id(target_user_id)
      and e.feature = requested_feature
      and (e.limit_value is null or e.limit_value > 0)
  );
$$;

create or replace function public.get_limit(target_user_id uuid, requested_feature text)
returns integer
language sql stable security definer set search_path = public
as $$
  select coalesce((select e.limit_value from public.plan_entitlements e where e.plan_id = public.current_plan_id(target_user_id) and e.feature = requested_feature), 0);
$$;

create or replace function public.can_manage_employer_account(target_user_id uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = target_user_id and user_type = 'employer')
    and target_user_id = auth.uid();
$$;

create or replace function public.can_create_job(target_user_id uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.can_manage_employer_account(target_user_id)
    and public.get_limit(target_user_id, 'active_jobs_limit') > (
      select count(*)::integer from public.jobs j
      join public.employer_users eu on eu.company_id = j.company_id
      where eu.user_id = target_user_id and j.status in ('draft', 'published')
    );
$$;

create or replace function public.prevent_profile_role_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.user_type is distinct from old.user_type then
    raise exception 'Account role cannot be changed';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_role_immutable on public.profiles;
create trigger profiles_role_immutable before update on public.profiles
for each row execute function public.prevent_profile_role_change();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare requested_role public.user_type;
begin
  requested_role := case when new.raw_user_meta_data ->> 'user_type' = 'employer' then 'employer'::public.user_type else 'job_seeker'::public.user_type end;
  insert into public.profiles (id, full_name, email, user_type)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', trim(concat_ws(' ', new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name'))), new.email, requested_role)
  on conflict (id) do update set email = excluded.email;
  if requested_role = 'employer' then
    insert into public.subscriptions (user_id, plan_id, status, provider)
    select new.id, id, 'active', 'internal' from public.subscription_plans where slug = 'free'
    on conflict (user_id) where status in ('trialing', 'active', 'past_due') do nothing;
  end if;
  return new;
end;
$$;

alter table public.subscription_plans enable row level security;
alter table public.plan_entitlements enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.payment_webhook_events enable row level security;

create policy "Anyone can view active plans" on public.subscription_plans for select to authenticated using (is_active);
create policy "Anyone can view active plan entitlements" on public.plan_entitlements for select to authenticated using (exists (select 1 from public.subscription_plans p where p.id = plan_id and p.is_active));
create policy "Employers view own subscriptions" on public.subscriptions for select to authenticated using (user_id = auth.uid() and public.can_manage_employer_account());
create policy "Employers view own payments" on public.payments for select to authenticated using (user_id = auth.uid() and public.can_manage_employer_account());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile fields" on public.profiles for update
using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "Employers create companies" on public.companies;
create policy "Employers create companies" on public.companies for insert
with check (created_by = auth.uid() and public.can_manage_employer_account());

drop policy if exists "Employers create managed jobs" on public.jobs;
create policy "Employers create managed jobs" on public.jobs for insert
with check (public.can_create_job() and public.can_manage_company(company_id) and created_by = auth.uid());

drop policy if exists "Employers update managed jobs" on public.jobs;
create policy "Employers update managed jobs" on public.jobs for update
using (public.can_manage_company(company_id) and public.can_manage_employer_account())
with check (public.can_manage_company(company_id) and public.can_manage_employer_account());

create or replace function public.add_company_owner()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.employer_users (company_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (company_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists companies_add_owner on public.companies;
create trigger companies_add_owner after insert on public.companies
for each row execute function public.add_company_owner();

insert into public.subscriptions (user_id, plan_id, status, provider)
select p.id, plan.id, 'active', 'internal'
from public.profiles p cross join public.subscription_plans plan
where p.user_type = 'employer' and plan.slug = 'free'
  and not exists (select 1 from public.subscriptions s where s.user_id = p.id and s.status in ('trialing', 'active', 'past_due'));