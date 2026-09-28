create or replace function public.create_employer_company(
  p_name text,
  p_description text default null,
  p_website text default null,
  p_industry text default null,
  p_location text default null,
  p_facebook_url text default null,
  p_instagram_url text default null,
  p_linkedin_url text default null,
  p_x_url text default null,
  p_tiktok_url text default null,
  p_youtube_url text default null
)
returns public.companies
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile_id uuid;
  v_company_id uuid := gen_random_uuid();
  v_slug text;
  v_company public.companies;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  select p.id
  into v_profile_id
  from public.profiles p
  where p.id = v_user_id
    and p.user_type = 'employer'
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'Employer profile required';
  end if;

  if nullif(pg_catalog.btrim(p_name), '') is null then
    raise exception using errcode = '22023', message = 'Company name is required';
  end if;

  v_slug := pg_catalog.btrim(
    pg_catalog.regexp_replace(pg_catalog.lower(pg_catalog.btrim(p_name)), '[^a-z0-9]+', '-', 'g'),
    '-'
  );
  if v_slug = '' then
    v_slug := 'company';
  end if;
  v_slug := v_slug || '-' || pg_catalog.left(v_company_id::text, 8);

  insert into public.companies (
    id, name, slug, description, website, website_url, industry, location,
    logo_url, facebook_url, instagram_url, linkedin_url, x_url, tiktok_url,
    youtube_url, created_by
  ) values (
    v_company_id,
    pg_catalog.btrim(p_name),
    v_slug,
    nullif(pg_catalog.btrim(p_description), ''),
    nullif(pg_catalog.btrim(p_website), ''),
    nullif(pg_catalog.btrim(p_website), ''),
    nullif(pg_catalog.btrim(p_industry), ''),
    nullif(pg_catalog.btrim(p_location), ''),
    null,
    nullif(pg_catalog.btrim(p_facebook_url), ''),
    nullif(pg_catalog.btrim(p_instagram_url), ''),
    nullif(pg_catalog.btrim(p_linkedin_url), ''),
    nullif(pg_catalog.btrim(p_x_url), ''),
    nullif(pg_catalog.btrim(p_tiktok_url), ''),
    nullif(pg_catalog.btrim(p_youtube_url), ''),
    v_user_id
  ) returning * into v_company;

  insert into public.employer_users (company_id, user_id, role)
  values (v_company.id, v_user_id, 'owner');

  return v_company;
end;
$$;

revoke all on function public.create_employer_company(text, text, text, text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.create_employer_company(text, text, text, text, text, text, text, text, text, text, text) to authenticated;

drop function if exists public.claim_company_owner(uuid);

create function public.claim_company_owner(target_company_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile_id uuid;
  v_created_by uuid;
begin
  if v_user_id is null then
    return pg_catalog.jsonb_build_object('success', false, 'reason', 'Authentication required');
  end if;

  select p.id
  into v_profile_id
  from public.profiles p
  where p.id = v_user_id
    and p.user_type = 'employer'
  for update;

  if not found then
    return pg_catalog.jsonb_build_object('success', false, 'reason', 'Employer profile required');
  end if;

  select c.created_by
  into v_created_by
  from public.companies c
  where c.id = target_company_id
  for update;

  if not found or v_created_by is distinct from v_user_id then
    return pg_catalog.jsonb_build_object('success', false, 'reason', 'Company cannot be claimed by this account');
  end if;

  if exists (
    select 1
    from public.employer_users eu
    where eu.company_id = target_company_id
  ) then
    return pg_catalog.jsonb_build_object('success', false, 'reason', 'Company already has memberships');
  end if;

  insert into public.employer_users (company_id, user_id, role)
  values (target_company_id, v_user_id, 'owner');

  return pg_catalog.jsonb_build_object('success', true, 'company_id', target_company_id);
end;
$$;

revoke all on function public.claim_company_owner(uuid) from public, anon;
grant execute on function public.claim_company_owner(uuid) to authenticated;

create or replace function public.can_manage_company(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.employer_users eu
    join public.profiles p on p.id = eu.user_id
    where eu.company_id = target_company_id
      and eu.user_id = (select auth.uid())
      and p.user_type = 'employer'
      and eu.role in ('owner', 'admin', 'member')
  );
$$;

create or replace function public.can_manage_membership(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.employer_users eu
    join public.profiles p on p.id = eu.user_id
    where eu.company_id = target_company_id
      and eu.user_id = (select auth.uid())
      and p.user_type = 'employer'
      and eu.role in ('owner', 'admin')
  );
$$;

create or replace function public.can_edit_company_profile(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.employer_users eu
    join public.profiles p on p.id = eu.user_id
    where eu.company_id = target_company_id
      and eu.user_id = (select auth.uid())
      and p.user_type = 'employer'
      and eu.role in ('owner', 'admin')
  );
$$;

create or replace function public.can_delete_company(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.employer_users eu
    join public.profiles p on p.id = eu.user_id
    where eu.company_id = target_company_id
      and eu.user_id = (select auth.uid())
      and p.user_type = 'employer'
      and eu.role = 'owner'
  );
$$;

create or replace function public.company_has_employer_owner(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.employer_users requester_membership
    join public.profiles requester_profile on requester_profile.id = requester_membership.user_id
    where requester_membership.company_id = target_company_id
      and requester_membership.user_id = (select auth.uid())
      and requester_profile.user_type = 'employer'
      and exists (
        select 1
        from public.employer_users owner_membership
        join public.profiles owner_profile on owner_profile.id = owner_membership.user_id
        where owner_membership.company_id = target_company_id
          and owner_membership.role = 'owner'
          and owner_profile.user_type = 'employer'
      )
  );
$$;

revoke all on function public.can_manage_company(uuid) from public, anon;
revoke all on function public.can_manage_membership(uuid) from public, anon;
revoke all on function public.can_edit_company_profile(uuid) from public, anon;
revoke all on function public.can_delete_company(uuid) from public, anon;
revoke all on function public.company_has_employer_owner(uuid) from public, anon;
grant execute on function public.can_manage_company(uuid) to anon, authenticated;
grant execute on function public.can_manage_membership(uuid) to anon, authenticated;
grant execute on function public.can_edit_company_profile(uuid) to authenticated;
grant execute on function public.can_delete_company(uuid) to authenticated;
grant execute on function public.company_has_employer_owner(uuid) to authenticated;

drop policy if exists "Employers create companies" on public.companies;
drop policy if exists "Members update their companies" on public.companies;
create policy "Employer owners and admins update company profiles"
  on public.companies for update to authenticated
  using (public.can_edit_company_profile(id))
  with check (public.can_edit_company_profile(id));

drop policy if exists "Owners delete their companies" on public.companies;
create policy "Employer owners delete their companies"
  on public.companies for delete to authenticated
  using (public.can_delete_company(id));

revoke insert, update, delete, truncate, trigger on public.companies from public, anon, authenticated;
grant update (
  name, description, website, website_url, industry, location, logo_url,
  facebook_url, instagram_url, linkedin_url, x_url, tiktok_url, youtube_url
) on public.companies to authenticated;
grant delete on public.companies to authenticated;

drop policy if exists "Employers create managed jobs" on public.jobs;
create policy "Employers create managed jobs"
  on public.jobs for insert to authenticated
  with check (
    public.can_manage_company(company_id)
    and public.company_has_employer_owner(company_id)
    and created_by = (select auth.uid())
  );