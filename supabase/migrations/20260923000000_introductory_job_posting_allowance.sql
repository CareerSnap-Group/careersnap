-- Company-owned, lifetime introductory allowance for companies created after this migration.
-- Existing companies are intentionally not backfilled with free postings.

do $$
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
$$;

do $$
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
$$;

create unique index if not exists billing_entitlement_usage_active_job_unique
  on public.billing_entitlement_usage(job_id)
  where released_at is null;

create or replace function public.prevent_job_company_reassignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.company_id is distinct from old.company_id then
    raise exception 'A job cannot be reassigned to another company';
  end if;
  return new;
end;
$$;

revoke all on function public.prevent_job_company_reassignment() from public;
revoke all on function public.prevent_job_company_reassignment() from authenticated;

create or replace function public.lock_company_for_job_posting()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

revoke all on function public.lock_company_for_job_posting() from public;
revoke all on function public.lock_company_for_job_posting() from authenticated;

drop trigger if exists jobs_company_reassignment_guard on public.jobs;
create trigger jobs_company_reassignment_guard
before insert or update of company_id on public.jobs
for each row execute function public.prevent_job_company_reassignment();

drop trigger if exists jobs_lock_company on public.jobs;
create trigger jobs_lock_company
before insert or update of status, company_id on public.jobs
for each row execute function public.lock_company_for_job_posting();

create or replace function public.initialize_company_introductory_allowance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  free_plan public.employer_plans%rowtype;
  free_order_id uuid;
begin
  if new.created_by is null then
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
$$;

revoke all on function public.initialize_company_introductory_allowance() from public;

 drop trigger if exists companies_initialize_introductory_allowance on public.companies;
create trigger companies_initialize_introductory_allowance
after insert on public.companies
for each row execute function public.initialize_company_introductory_allowance();

create or replace function public.consume_job_posting_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
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
$$;

revoke all on function public.consume_job_posting_entitlement() from public;

drop trigger if exists jobs_consume_posting_entitlement on public.jobs;
create trigger jobs_consume_posting_entitlement
after insert or update of status on public.jobs
for each row execute function public.consume_job_posting_entitlement();

comment on function public.consume_job_posting_entitlement() is
'Atomically consumes one company posting entitlement only when a job is first published. Drafts, edits, closures, and republishing an already-consumed job do not consume additional allowance.';
