-- Company-owned billing foundation for employer job-posting packages.
-- Payment verification and entitlement activation are implemented in later phases.

create table public.employer_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  price numeric(12, 2) not null default 0,
  currency text not null default 'ZAR',
  billing_model text not null default 'one_time',
  job_posting_allowance integer not null default 0,
  active_job_limit integer,
  duration_days integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employer_plans_price_valid check (price >= 0),
  constraint employer_plans_currency_valid check (currency = upper(currency) and length(currency) = 3),
  constraint employer_plans_billing_model_valid check (billing_model in ('one_time', 'recurring')),
  constraint employer_plans_allowance_valid check (job_posting_allowance >= 0),
  constraint employer_plans_active_limit_valid check (active_job_limit is null or active_job_limit >= 0),
  constraint employer_plans_duration_valid check (duration_days is null or duration_days > 0)
);

create table public.billing_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  plan_id uuid not null references public.employer_plans(id) on delete restrict,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'created',
  amount numeric(12, 2) not null,
  currency text not null default 'ZAR',
  plan_snapshot jsonb not null default '{}'::jsonb,
  checkout_url text,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_orders_amount_valid check (amount >= 0),
  constraint billing_orders_currency_valid check (currency = upper(currency) and length(currency) = 3),
  constraint billing_orders_status_valid check (status in ('created', 'pending', 'paid', 'failed', 'cancelled', 'expired', 'refunded', 'partially_refunded'))
);

create table public.billing_transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.billing_orders(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  provider text not null,
  provider_transaction_id text,
  provider_reference text,
  provider_status text,
  status text not null default 'pending',
  amount numeric(12, 2) not null,
  currency text not null default 'ZAR',
  failure_code text,
  failure_message text,
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_transactions_provider_valid check (provider in ('payfast', 'ozow')),
  constraint billing_transactions_status_valid check (status in ('pending', 'succeeded', 'failed', 'cancelled', 'refunded', 'partially_refunded')),
  constraint billing_transactions_amount_valid check (amount >= 0),
  constraint billing_transactions_currency_valid check (currency = upper(currency) and length(currency) = 3)
);

create table public.billing_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  order_id uuid references public.billing_orders(id) on delete set null,
  transaction_id uuid references public.billing_transactions(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  signature_verified boolean not null default false,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,
  attempt_count integer not null default 0,
  constraint billing_events_provider_valid check (provider in ('payfast', 'ozow')),
  constraint billing_events_attempt_count_valid check (attempt_count >= 0),
  constraint billing_events_provider_event_unique unique (provider, provider_event_id)
);

create table public.billing_entitlements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  order_id uuid not null references public.billing_orders(id) on delete restrict,
  plan_id uuid not null references public.employer_plans(id) on delete restrict,
  granted_quantity integer not null,
  consumed_quantity integer not null default 0,
  active_job_limit integer,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint billing_entitlements_granted_quantity_valid check (granted_quantity >= 0),
  constraint billing_entitlements_consumed_quantity_valid check (consumed_quantity >= 0 and consumed_quantity <= granted_quantity),
  constraint billing_entitlements_active_limit_valid check (active_job_limit is null or active_job_limit >= 0),
  constraint billing_entitlements_status_valid check (status in ('pending', 'active', 'exhausted', 'expired', 'revoked'))
);

create table public.billing_entitlement_usage (
  id uuid primary key default gen_random_uuid(),
  entitlement_id uuid not null references public.billing_entitlements(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  job_id uuid not null references public.jobs(id) on delete restrict,
  quantity integer not null default 1,
  consumed_at timestamptz not null default now(),
  released_at timestamptz,
  constraint billing_entitlement_usage_quantity_valid check (quantity > 0)
);

create unique index billing_transactions_provider_transaction_idx
  on public.billing_transactions(provider, provider_transaction_id)
  where provider_transaction_id is not null;
create index billing_orders_company_id_idx on public.billing_orders(company_id);
create index billing_orders_status_idx on public.billing_orders(status);
create index billing_orders_created_at_idx on public.billing_orders(created_at desc);
create index billing_transactions_order_id_idx on public.billing_transactions(order_id);
create index billing_transactions_company_id_idx on public.billing_transactions(company_id);
create index billing_transactions_provider_idx on public.billing_transactions(provider);
create index billing_transactions_created_at_idx on public.billing_transactions(created_at desc);
create index billing_events_provider_idx on public.billing_events(provider);
create index billing_events_order_id_idx on public.billing_events(order_id);
create index billing_events_received_at_idx on public.billing_events(received_at desc);
create index billing_entitlements_company_id_idx on public.billing_entitlements(company_id);
create index billing_entitlements_status_idx on public.billing_entitlements(status);
create index billing_entitlements_expires_at_idx on public.billing_entitlements(expires_at);
create index billing_entitlement_usage_entitlement_id_idx on public.billing_entitlement_usage(entitlement_id);
create index billing_entitlement_usage_job_id_idx on public.billing_entitlement_usage(job_id);
create index billing_entitlement_usage_company_id_idx on public.billing_entitlement_usage(company_id);
create unique index billing_entitlement_usage_active_job_idx
  on public.billing_entitlement_usage(entitlement_id, job_id)
  where released_at is null;

create trigger employer_plans_updated_at
before update on public.employer_plans
for each row execute function public.set_updated_at();

create trigger billing_orders_updated_at
before update on public.billing_orders
for each row execute function public.set_updated_at();

create trigger billing_transactions_updated_at
before update on public.billing_transactions
for each row execute function public.set_updated_at();

create trigger billing_entitlements_updated_at
before update on public.billing_entitlements
for each row execute function public.set_updated_at();

alter table public.employer_plans enable row level security;
alter table public.billing_orders enable row level security;
alter table public.billing_transactions enable row level security;
alter table public.billing_events enable row level security;
alter table public.billing_entitlements enable row level security;
alter table public.billing_entitlement_usage enable row level security;

create policy "Authenticated users view active employer plans"
  on public.employer_plans for select to authenticated
  using (is_active);

create policy "Company managers view billing orders"
  on public.billing_orders for select to authenticated
  using (public.can_manage_company(company_id));

create policy "Company managers view billing transactions"
  on public.billing_transactions for select to authenticated
  using (public.can_manage_company(company_id));

create policy "Company managers view billing entitlements"
  on public.billing_entitlements for select to authenticated
  using (public.can_manage_company(company_id));

create policy "Company managers view entitlement usage"
  on public.billing_entitlement_usage for select to authenticated
  using (public.can_manage_company(company_id));