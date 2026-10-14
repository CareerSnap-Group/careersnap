-- Seed the active introductory free plan required by the company-owned billing model.
-- This is the only active package currently defined in the verified repository schema.
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
