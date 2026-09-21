-- Forward-only reconciliation for billing functionality absent from the verified remote schema.
-- The billing foundation tables and foundation indexes, triggers, RLS, and policies
-- already exist remotely and are intentionally preserved.

-- Final payment/order functions from the workflow, phase 1A, and hardening migrations.
-- CREATE OR REPLACE is scoped to these exact signatures, preserves function identity,
-- and is safe for the verified remote state where these functions are absent.
create or replace function public.create_billing_order(
  p_company_id uuid,
  p_plan_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
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
$function$;

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
as $function$
declare
  existing_event public.billing_events%rowtype;
  event_id uuid;
  normalized_payload jsonb := coalesce(p_payload, '{}'::jsonb);
  normalized_signature_verified boolean := coalesce(p_signature_verified, false);
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Trusted billing processing is required';
  end if;

  if p_order_id is not null and not exists (
    select 1 from public.billing_orders where id = p_order_id
  ) then
    raise exception 'Billing order not found';
  end if;

  if p_transaction_id is not null and not exists (
    select 1
    from public.billing_transactions
    where id = p_transaction_id
      and (p_order_id is null or order_id = p_order_id)
  ) then
    raise exception 'Billing transaction is not linked to the billing order';
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
$function$;

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
as $function$
declare
  billing_order public.billing_orders%rowtype;
  existing_transaction public.billing_transactions%rowtype;
  normalized_provider_transaction_id text := nullif(btrim(p_provider_transaction_id), '');
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
    normalized_provider_transaction_id,
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

  if transaction_id is null and normalized_provider_transaction_id is not null then
    select *
    into existing_transaction
    from public.billing_transactions
    where provider = p_provider
      and provider_transaction_id = normalized_provider_transaction_id
    for update;

    if existing_transaction.order_id <> billing_order.id
       or existing_transaction.amount is distinct from billing_order.amount
       or existing_transaction.currency is distinct from billing_order.currency then
      raise exception 'Provider transaction identity is already linked to another billing order';
    end if;

    if existing_transaction.status = 'succeeded' then
      return existing_transaction.id;
    end if;

    if p_status = 'succeeded' and existing_transaction.status in ('pending', 'failed') then
      update public.billing_transactions
      set provider_reference = p_provider_reference,
          provider_status = p_provider_status,
          status = 'succeeded',
          failure_code = null,
          failure_message = null,
          paid_at = p_paid_at
      where id = existing_transaction.id;
    end if;

    transaction_id := existing_transaction.id;
  end if;

  return transaction_id;
end;
$function$;

revoke all on function public.record_billing_transaction(uuid, text, numeric, text, text, text, text, text, text, text, timestamptz) from public;
revoke all on function public.record_billing_transaction(uuid, text, numeric, text, text, text, text, text, text, text, timestamptz) from authenticated;
grant execute on function public.record_billing_transaction(uuid, text, numeric, text, text, text, text, text, text, text, timestamptz) to service_role;

create or replace function public.activate_billing_entitlement(p_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $function$
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
$function$;

revoke all on function public.activate_billing_entitlement(uuid) from public;
revoke all on function public.activate_billing_entitlement(uuid) from authenticated;
grant execute on function public.activate_billing_entitlement(uuid) to service_role;

comment on function public.create_billing_order(uuid, uuid) is
'Creates a company-owned unpaid order from an active employer plan. Amount, currency, and package terms come only from the plan.';

comment on function public.record_billing_event(text, text, text, jsonb, boolean, uuid, uuid) is
'Idempotently records a provider event and rejects conflicting reuse of its provider event ID. Signature verification must occur in trusted server code.';

comment on function public.record_billing_transaction(uuid, text, numeric, text, text, text, text, text, text, text, timestamptz) is
'Idempotently records a provider transaction after trusted verification. Amount and currency must match the order; successful records require a provider transaction ID and paid_at.';

comment on function public.activate_billing_entitlement(uuid) is
'Activates an entitlement only after a matching successful transaction and signature-verified provider event exist. Restricted to service_role.';

-- Add the hardening constraint only if it is not already present.
do $migration$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.billing_transactions'::regclass
      and conname = 'billing_transactions_success_terms_valid'
  ) then
    alter table public.billing_transactions
      add constraint billing_transactions_success_terms_valid
      check (
        status <> 'succeeded'
        or (provider_transaction_id is not null and paid_at is not null)
      );
  end if;
end;
$migration$;

-- Ensure the introductory plan is present with exactly the intended terms.
do $migration$
declare
  existing_plan public.employer_plans%rowtype;
begin
  select * into existing_plan
  from public.employer_plans
  where code = 'introductory-free';

  if found then
    if existing_plan.price <> 0
       or existing_plan.currency <> 'ZAR'
       or existing_plan.billing_model <> 'one_time'
       or existing_plan.job_posting_allowance <> 4
       or existing_plan.active_job_limit is not null
       or existing_plan.duration_days is not null
       or not existing_plan.is_active then
      raise exception 'The introductory-free employer plan has conflicting terms';
    end if;
  else
    insert into public.employer_plans (
      code,
      name,
      description,
      price,
      currency,
      billing_model,
      job_posting_allowance,
      active_job_limit,
      duration_days,
      is_active
    )
    values (
      'introductory-free',
      'Introductory free postings',
      'Four lifetime job postings included for newly registered employers.',
      0,
      'ZAR',
      'one_time',
      4,
      null,
      null,
      true
    );
  end if;
end;
$migration$;

-- Do not silently modify existing usage rows if they violate the intended rule.
do $migration$
begin
  if exists (
    select job_id
    from public.billing_entitlement_usage
    where released_at is null
    group by job_id
    having count(*) > 1
  ) then
    raise exception 'Cannot create active job usage uniqueness: duplicate active usage rows already exist';
  end if;
end;
$migration$;

-- Preserve the one-introductory-entitlement-per-company invariant without
-- imposing uniqueness on paid or other employer plans.
do $migration$
begin
  if exists (
    select 1
    from public.billing_entitlements e
    join public.employer_plans p on p.id = e.plan_id
    where p.code = 'introductory-free'
    group by e.company_id
    having count(*) > 1
  ) then
    raise exception 'Cannot enforce one introductory entitlement per company: conflicting rows already exist';
  end if;
end;
$migration$;

create unique index if not exists billing_entitlement_usage_active_job_unique
  on public.billing_entitlement_usage(job_id)
  where released_at is null;

-- Final introductory allowance protection functions from the allowance migration.
create or replace function public.prevent_job_company_reassignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if tg_op = 'UPDATE' and new.company_id is distinct from old.company_id then
    raise exception 'A job cannot be reassigned to another company';
  end if;
  return new;
end;
$function$;

revoke all on function public.prevent_job_company_reassignment() from public;
revoke all on function public.prevent_job_company_reassignment() from authenticated;

create or replace function public.lock_company_for_job_posting()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  perform 1
  from public.companies
  where id = new.company_id
  for update;

  if not found then
    raise exception 'Cannot publish job: company does not exist';
  end if;

  return new;
end;
$function$;

revoke all on function public.lock_company_for_job_posting() from public;
revoke all on function public.lock_company_for_job_posting() from authenticated;

create or replace function public.initialize_company_introductory_allowance()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  free_plan public.employer_plans%rowtype;
  free_order_id uuid;
begin
  if new.created_by is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = new.created_by
      and user_type = 'employer'
  ) then
    return new;
  end if;

  select * into free_plan
  from public.employer_plans
  where code = 'introductory-free'
    and is_active;

  if not found then
    raise exception 'Introductory free posting plan is not configured';
  end if;

  if free_plan.job_posting_allowance <> 4 then
    raise exception 'Introductory free posting plan must grant exactly four postings';
  end if;

  insert into public.billing_orders (
    company_id,
    plan_id,
    created_by_user_id,
    status,
    amount,
    currency,
    plan_snapshot,
    paid_at
  )
  values (
    new.id,
    free_plan.id,
    new.created_by,
    'paid',
    0,
    free_plan.currency,
    jsonb_build_object(
      'code', free_plan.code,
      'name', free_plan.name,
      'description', free_plan.description,
      'price', free_plan.price,
      'currency', free_plan.currency,
      'billing_model', free_plan.billing_model,
      'job_posting_allowance', free_plan.job_posting_allowance,
      'active_job_limit', free_plan.active_job_limit,
      'duration_days', free_plan.duration_days
    ),
    now()
  )
  returning id into free_order_id;

  insert into public.billing_entitlements (
    company_id,
    order_id,
    plan_id,
    granted_quantity,
    consumed_quantity,
    active_job_limit,
    starts_at,
    expires_at,
    status
  )
  values (
    new.id,
    free_order_id,
    free_plan.id,
    free_plan.job_posting_allowance,
    0,
    null,
    now(),
    null,
    'active'
  );

  return new;
end;
$function$;

revoke all on function public.initialize_company_introductory_allowance() from public;

create or replace function public.consume_job_posting_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  entitlement record;
  published_job_count integer;
  consumed boolean := false;
begin
  if new.status <> 'published' then
    return new;
  end if;

  if tg_op = 'update' and old.status = 'published' then
    return new;
  end if;

  if exists (
    select 1 from public.billing_entitlement_usage
    where job_id = new.id and released_at is null
  ) then
    return new;
  end if;

  select count(*)::integer into published_job_count
  from public.jobs
  where company_id = new.company_id
    and status = 'published'
    and (expires_at is null or expires_at > now());

  for entitlement in
    select e.id,
           e.granted_quantity,
           e.consumed_quantity,
           e.active_job_limit,
           p.code
    from public.billing_entitlements e
    join public.employer_plans p on p.id = e.plan_id
    where e.company_id = new.company_id
      and e.status = 'active'
      and e.starts_at <= now()
      and (e.expires_at is null or e.expires_at > now())
      and e.consumed_quantity < e.granted_quantity
    order by case when p.code = 'introductory-free' then 0 else 1 end,
             e.starts_at,
             e.created_at,
             e.id
    for update
  loop
    if entitlement.active_job_limit is not null
       and published_job_count > entitlement.active_job_limit then
      continue;
    end if;

    update public.billing_entitlements
    set consumed_quantity = consumed_quantity + 1,
        status = case
          when consumed_quantity + 1 >= granted_quantity then 'exhausted'
          else 'active'
        end
    where id = entitlement.id;

    insert into public.billing_entitlement_usage (
      entitlement_id,
      company_id,
      job_id,
      quantity
    )
    values (
      entitlement.id,
      new.company_id,
      new.id,
      1
    );

    consumed := true;
    exit;
  end loop;

  if not consumed then
    raise exception 'No free job postings or active paid job package remains for this company';
  end if;

  return new;
end;
$function$;

revoke all on function public.consume_job_posting_entitlement() from public;

create or replace function public.enforce_single_introductory_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if not exists (
    select 1
    from public.employer_plans
    where id = new.plan_id
      and code = 'introductory-free'
  ) then
    return new;
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended('careersnap:introductory-free:' || new.company_id::text, 0)
  );

  if exists (
    select 1
    from public.billing_entitlements e
    where e.company_id = new.company_id
      and e.plan_id = new.plan_id
      and e.id is distinct from new.id
  ) then
    raise exception 'A company can have at most one introductory-free entitlement';
  end if;

  return new;
end;
$function$;

revoke all on function public.enforce_single_introductory_entitlement() from public;
revoke all on function public.enforce_single_introductory_entitlement() from authenticated;

-- Install allowance triggers only when absent; existing unrelated triggers remain intact.
do $migration$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'jobs_company_reassignment_guard'
      and tgrelid = 'public.jobs'::regclass
      and not tgisinternal
  ) then
    create trigger jobs_company_reassignment_guard
    before insert or update of company_id on public.jobs
    for each row execute function public.prevent_job_company_reassignment();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'jobs_lock_company'
      and tgrelid = 'public.jobs'::regclass
      and not tgisinternal
  ) then
    create trigger jobs_lock_company
    before insert or update of status, company_id on public.jobs
    for each row execute function public.lock_company_for_job_posting();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'companies_initialize_introductory_allowance'
      and tgrelid = 'public.companies'::regclass
      and not tgisinternal
  ) then
    create trigger companies_initialize_introductory_allowance
    after insert on public.companies
    for each row execute function public.initialize_company_introductory_allowance();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'jobs_consume_posting_entitlement'
      and tgrelid = 'public.jobs'::regclass
      and not tgisinternal
  ) then
    create trigger jobs_consume_posting_entitlement
    after insert or update of status on public.jobs
    for each row execute function public.consume_job_posting_entitlement();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'billing_entitlements_single_introductory'
      and tgrelid = 'public.billing_entitlements'::regclass
      and not tgisinternal
  ) then
    create trigger billing_entitlements_single_introductory
    before insert or update of company_id, plan_id on public.billing_entitlements
    for each row execute function public.enforce_single_introductory_entitlement();
  end if;
end;
$migration$;

comment on function public.consume_job_posting_entitlement() is
'Atomically consumes one company posting entitlement only when a job is first published. Drafts, edits, closures, and republishing an already-consumed job do not consume additional allowance.';
