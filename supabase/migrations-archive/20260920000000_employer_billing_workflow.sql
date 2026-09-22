-- Company-owned order creation and trusted entitlement activation.
-- Paid job publishing and entitlement consumption remain disabled until later phases.

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

-- This function is intentionally restricted to the Supabase service role.
-- A later server-side payment verifier must validate the provider response before
-- calling it. Browser redirects and query parameters must never call this function.
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

comment on function public.create_billing_order(uuid, uuid) is
'Creates a company-owned unpaid order from an active employer plan. Amount, currency, and package terms come only from the plan.';

comment on function public.activate_billing_entitlement(uuid) is
'Trusted service-role transition from a verified paid order to one active entitlement. Must only be called after server-side payment verification.';

-- Accounting policy for the future consumption function:
-- drafts consume no allowance; later publishing consumes one allowance;
-- editing a published job consumes no additional allowance; closing, deleting,
-- or reopening a job creates no automatic credit; refunds and releases are
-- separate future operations. job_posting_allowance remains distinct from
-- active_job_limit. Future consumption must lock the job and entitlement,
-- validate company membership and ownership, enforce expiry and both limits,
-- prevent multi-entitlement charging, and atomically record usage with the
-- allowance increment.