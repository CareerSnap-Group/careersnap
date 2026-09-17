-- Phase 1A trusted billing foundation.
-- Provider verification remains outside the database; these functions only expose
-- trusted server-side recording and activation boundaries.

create or replace function public.create_billing_order(
  p_company_id uuid,
  p_plan_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  selected_plan public.employer_plans%rowtype;
  order_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = current_user_id
      and user_type = 'employer'
  ) then
    raise exception 'An employer account is required';
  end if;

  if not exists (
    select 1
    from public.employer_users
    where company_id = p_company_id
      and user_id = current_user_id
      and role in ('owner', 'admin')
  ) then
    raise exception 'Company owner or administrator access is required';
  end if;

  select *
  into selected_plan
  from public.employer_plans
  where id = p_plan_id
    and is_active;

  if not found then
    raise exception 'The selected employer plan is unavailable';
  end if;

  insert into public.billing_orders (
    company_id,
    plan_id,
    created_by_user_id,
    status,
    amount,
    currency,
    plan_snapshot
  )
  values (
    p_company_id,
    selected_plan.id,
    current_user_id,
    'created',
    selected_plan.price,
    selected_plan.currency,
    jsonb_build_object(
      'code', selected_plan.code,
      'name', selected_plan.name,
      'description', selected_plan.description,
      'price', selected_plan.price,
      'currency', selected_plan.currency,
      'billing_model', selected_plan.billing_model,
      'job_posting_allowance', selected_plan.job_posting_allowance,
      'active_job_limit', selected_plan.active_job_limit,
      'duration_days', selected_plan.duration_days
    )
  )
  returning id into order_id;

  return order_id;
end;
$$;

revoke all on function public.create_billing_order(uuid, uuid) from public;
grant execute on function public.create_billing_order(uuid, uuid) to authenticated;

create or replace function public.record_billing_event(
  p_provider text,
  p_provider_event_id text,
  p_event_type text,
  p_payload jsonb default '{}'::jsonb,
  p_signature_verified boolean default false,
  p_order_id uuid default null,
  p_transaction_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  event_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Trusted billing processing is required';
  end if;

  insert into public.billing_events (
    provider,
    provider_event_id,
    event_type,
    order_id,
    transaction_id,
    payload,
    signature_verified
  )
  values (
    p_provider,
    p_provider_event_id,
    p_event_type,
    p_order_id,
    p_transaction_id,
    coalesce(p_payload, '{}'::jsonb),
    coalesce(p_signature_verified, false)
  )
  on conflict (provider, provider_event_id) do nothing
  returning id into event_id;

  if event_id is null then
    select id
    into event_id
    from public.billing_events
    where provider = p_provider
      and provider_event_id = p_provider_event_id;
  end if;

  return event_id;
end;
$$;

revoke all on function public.record_billing_event(text, text, text, jsonb, boolean, uuid, uuid) from public;
revoke all on function public.record_billing_event(text, text, text, jsonb, boolean, uuid, uuid) from authenticated;
grant execute on function public.record_billing_event(text, text, text, jsonb, boolean, uuid, uuid) to service_role;

create or replace function public.record_billing_transaction(
  p_order_id uuid,
  p_provider text,
  p_amount numeric,
  p_currency text,
  p_provider_transaction_id text default null,
  p_provider_reference text default null,
  p_provider_status text default null,
  p_status text default 'pending',
  p_failure_code text default null,
  p_failure_message text default null,
  p_paid_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  billing_order public.billing_orders%rowtype;
  transaction_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Trusted billing processing is required';
  end if;

  select *
  into billing_order
  from public.billing_orders
  where id = p_order_id;

  if not found then
    raise exception 'Billing order not found';
  end if;

  insert into public.billing_transactions (
    order_id,
    company_id,
    provider,
    provider_transaction_id,
    provider_reference,
    provider_status,
    status,
    amount,
    currency,
    failure_code,
    failure_message,
    paid_at
  )
  values (
    billing_order.id,
    billing_order.company_id,
    p_provider,
    p_provider_transaction_id,
    p_provider_reference,
    p_provider_status,
    p_status,
    p_amount,
    p_currency,
    p_failure_code,
    p_failure_message,
    p_paid_at
  )
  on conflict (provider, provider_transaction_id)
    where provider_transaction_id is not null
  do nothing
  returning id into transaction_id;

  if transaction_id is null and p_provider_transaction_id is not null then
    select id
    into transaction_id
    from public.billing_transactions
    where provider = p_provider
      and provider_transaction_id = p_provider_transaction_id;
  end if;

  return transaction_id;
end;
$$;

revoke all on function public.record_billing_transaction(uuid, text, numeric, text, text, text, text, text, text, text, timestamptz) from public;
revoke all on function public.record_billing_transaction(uuid, text, numeric, text, text, text, text, text, text, text, timestamptz) from authenticated;
grant execute on function public.record_billing_transaction(uuid, text, numeric, text, text, text, text, text, text, text, timestamptz) to service_role;

create or replace function public.activate_billing_entitlement(p_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  billing_order public.billing_orders%rowtype;
  existing_entitlement_id uuid;
  entitlement_id uuid;
  purchased_quantity integer;
  purchased_active_job_limit integer;
  purchased_duration_days integer;
  entitlement_starts_at timestamptz := now();
  entitlement_expires_at timestamptz;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Trusted payment verification is required';
  end if;

  select *
  into billing_order
  from public.billing_orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Billing order not found';
  end if;

  select id
  into existing_entitlement_id
  from public.billing_entitlements
  where order_id = billing_order.id;

  if existing_entitlement_id is not null then
    return existing_entitlement_id;
  end if;

  if not exists (select 1 from public.employer_plans where id = billing_order.plan_id) then
    raise exception 'The billing order plan no longer exists';
  end if;

  if billing_order.status not in ('created', 'pending') then
    raise exception 'Billing order is not eligible for activation';
  end if;

  if jsonb_typeof(billing_order.plan_snapshot -> 'job_posting_allowance') <> 'number'
     or jsonb_typeof(billing_order.plan_snapshot -> 'active_job_limit') not in ('number', 'null')
     or jsonb_typeof(billing_order.plan_snapshot -> 'duration_days') not in ('number', 'null') then
    raise exception 'Billing order plan snapshot is malformed';
  end if;

  purchased_quantity := (billing_order.plan_snapshot ->> 'job_posting_allowance')::integer;
  purchased_active_job_limit := nullif(billing_order.plan_snapshot ->> 'active_job_limit', '')::integer;
  purchased_duration_days := nullif(billing_order.plan_snapshot ->> 'duration_days', '')::integer;

  if purchased_quantity < 0
     or (purchased_active_job_limit is not null and purchased_active_job_limit < 0)
     or (purchased_duration_days is not null and purchased_duration_days <= 0) then
    raise exception 'Billing order plan snapshot contains invalid entitlement terms';
  end if;

  if purchased_duration_days is not null then
    entitlement_expires_at := entitlement_starts_at + make_interval(days => purchased_duration_days);
  end if;

  update public.billing_orders
  set status = 'paid',
      paid_at = coalesce(paid_at, entitlement_starts_at)
  where id = billing_order.id;

  insert into public.billing_entitlements (
    company_id,
    order_id,
    plan_id,
    granted_quantity,
    active_job_limit,
    starts_at,
    expires_at,
    status
  )
  values (
    billing_order.company_id,
    billing_order.id,
    billing_order.plan_id,
    purchased_quantity,
    purchased_active_job_limit,
    entitlement_starts_at,
    entitlement_expires_at,
    'active'
  )
  returning id into entitlement_id;

  return entitlement_id;
exception
  when unique_violation then
    select id
    into existing_entitlement_id
    from public.billing_entitlements
    where order_id = p_order_id;

    if existing_entitlement_id is not null then
      return existing_entitlement_id;
    end if;

    raise;
end;
$$;

revoke all on function public.activate_billing_entitlement(uuid) from public;
revoke all on function public.activate_billing_entitlement(uuid) from authenticated;
grant execute on function public.activate_billing_entitlement(uuid) to service_role;

comment on function public.record_billing_event(text, text, text, jsonb, boolean, uuid, uuid) is
'Idempotently records a provider event. Provider verification must occur in trusted server code before any successful payment is activated.';

comment on function public.record_billing_transaction(uuid, text, numeric, text, text, text, text, text, text, text, timestamptz) is
'Idempotently records a provider transaction using the order company. Provider verification and status decisions belong to trusted server code.';

comment on function public.activate_billing_entitlement(uuid) is
'Trusted service-role transition from a verified paid order to one active company entitlement. Must only be called after server-side payment verification.';
