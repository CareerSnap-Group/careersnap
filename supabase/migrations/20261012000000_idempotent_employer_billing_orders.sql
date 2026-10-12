-- Reuse an open order for the same company and plan when an employer retries
-- package selection. The company row lock serializes concurrent requests.
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

  perform 1
  from public.companies
  where id = p_company_id
  for update;

  if not found then
    raise exception 'Company not found';
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

  select id
  into order_id
  from public.billing_orders
  where company_id = p_company_id
    and plan_id = selected_plan.id
    and status in ('created', 'pending')
    and (expires_at is null or expires_at > now())
  order by created_at desc
  limit 1;

  if order_id is not null then
    return order_id;
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
