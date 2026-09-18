-- Phase 1A billing hardening.
-- Provider cryptographic verification remains in trusted server code. These
-- functions enforce the database-side prerequisites for trusted activation.

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
  existing_event public.billing_events%rowtype;
  event_id uuid;
  normalized_payload jsonb := coalesce(p_payload, '{}'::jsonb);
  normalized_signature_verified boolean := coalesce(p_signature_verified, false);
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Trusted billing processing is required';
  end if;

  select *
  into existing_event
  from public.billing_events
  where provider = p_provider
    and provider_event_id = p_provider_event_id
  for update;

  if found then
    if existing_event.event_type is distinct from p_event_type
       or existing_event.order_id is distinct from p_order_id
       or existing_event.transaction_id is distinct from p_transaction_id
       or existing_event.payload is distinct from normalized_payload
       or existing_event.signature_verified is distinct from normalized_signature_verified then
      raise exception 'Conflicting provider event reuse detected';
    end if;

    return existing_event.id;
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
    normalized_payload,
    normalized_signature_verified
  )
  on conflict (provider, provider_event_id) do nothing
  returning id into event_id;

  if event_id is null then
    select *
    into existing_event
    from public.billing_events
    where provider = p_provider
      and provider_event_id = p_provider_event_id
    for update;

    if existing_event.event_type is distinct from p_event_type
       or existing_event.order_id is distinct from p_order_id
       or existing_event.transaction_id is distinct from p_transaction_id
       or existing_event.payload is distinct from normalized_payload
       or existing_event.signature_verified is distinct from normalized_signature_verified then
      raise exception 'Conflicting provider event reuse detected';
    end if;

    return existing_event.id;
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
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Billing order not found';
  end if;

  if p_amount is distinct from billing_order.amount then
    raise exception 'Billing transaction amount does not match the order';
  end if;

  if p_currency is distinct from billing_order.currency then
    raise exception 'Billing transaction currency does not match the order';
  end if;

  if p_status = 'succeeded' then
    if p_provider_transaction_id is null or btrim(p_provider_transaction_id) = '' then
      raise exception 'Successful billing transactions require a provider transaction ID';
    end if;
    if p_paid_at is null then
      raise exception 'Successful billing transactions require paid_at';
    end if;
  elsif p_status in ('pending', 'failed', 'cancelled') and p_paid_at is not null then
    raise exception 'Unsuccessful billing transactions cannot have paid_at';
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
    nullif(btrim(p_provider_transaction_id), ''),
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
      and provider_transaction_id = nullif(btrim(p_provider_transaction_id), '');
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
  successful_transaction public.billing_transactions%rowtype;
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

  if billing_order.status not in ('created', 'pending') then
    raise exception 'Billing order is not eligible for activation';
  end if;

  select t.*
  into successful_transaction
  from public.billing_transactions t
  where t.order_id = billing_order.id
    and t.company_id = billing_order.company_id
    and t.status = 'succeeded'
    and t.provider_transaction_id is not null
    and t.amount = billing_order.amount
    and t.currency = billing_order.currency
    and t.paid_at is not null
    and exists (
      select 1
      from public.billing_events e
      where e.provider = t.provider
        and e.transaction_id = t.id
        and e.order_id = billing_order.id
        and e.signature_verified
    )
  order by t.paid_at, t.created_at, t.id
  limit 1;

  if not found then
    raise exception 'A verified successful billing payment is required';
  end if;

  if not exists (select 1 from public.employer_plans where id = billing_order.plan_id) then
    raise exception 'The billing order plan no longer exists';
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
'Idempotently records a provider event and rejects conflicting reuse of its provider event ID. Signature verification must occur in trusted server code.';

comment on function public.record_billing_transaction(uuid, text, numeric, text, text, text, text, text, text, text, timestamptz) is
'Idempotently records a provider transaction after trusted verification. Amount and currency must match the order; successful records require a provider transaction ID and paid_at.';

comment on function public.activate_billing_entitlement(uuid) is
'Activates an entitlement only after a matching successful transaction and signature-verified provider event exist. Restricted to service_role.';
