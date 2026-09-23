-- Atomically save a Job Seeker profile and replace only that user's skill relationships.

create or replace function public.save_job_seeker_profile(
  p_profile jsonb,
  p_experience jsonb default '[]'::jsonb,
  p_education jsonb default '[]'::jsonb,
  p_skills jsonb default '[]'::jsonb,
  p_certifications jsonb default '[]'::jsonb,
  p_languages jsonb default '[]'::jsonb,
  p_links jsonb default '[]'::jsonb
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile jsonb := coalesce(p_profile, '{}'::jsonb);
  v_full_name text;
  v_skill_name text;
  v_skill_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = v_user_id
      and user_type = 'job_seeker'
  ) then
    raise exception 'Job seeker profile not found';
  end if;

  v_full_name := coalesce(trim(v_profile->>'first_name'), '')
    || case
      when coalesce(trim(v_profile->>'first_name'), '') <> ''
        and coalesce(trim(v_profile->>'last_name'), '') <> '' then ' '
      else ''
    end
    || coalesce(trim(v_profile->>'last_name'), '');
  if trim(v_full_name) = '' then
    v_full_name := null;
  end if;

  update public.profiles
  set
    first_name = nullif(trim(v_profile->>'first_name'), ''),
    last_name = nullif(trim(v_profile->>'last_name'), ''),
    full_name = v_full_name,
    email = coalesce(nullif(trim(v_profile->>'email'), ''), auth.email()),
    phone = nullif(trim(v_profile->>'phone'), ''),
    location = nullif(trim(v_profile->>'location'), ''),
    city = nullif(trim(v_profile->>'city'), ''),
    province = nullif(trim(v_profile->>'province'), ''),
    country = nullif(trim(v_profile->>'country'), ''),
    headline = coalesce(
      nullif(trim(v_profile->>'professional_headline'), ''),
      nullif(trim(v_profile->>'headline'), '')
    ),
    professional_headline = nullif(trim(v_profile->>'professional_headline'), ''),
    bio = nullif(trim(v_profile->>'bio'), ''),
    profile_photo_url = nullif(trim(v_profile->>'profile_photo_url'), ''),
    current_job_title = nullif(trim(v_profile->>'current_job_title'), ''),
    current_employer = nullif(trim(v_profile->>'current_employer'), ''),
    years_experience = case
      when v_profile->>'years_experience' is null
        or trim(v_profile->>'years_experience') = '' then null
      else (v_profile->>'years_experience')::integer
    end,
    employment_status = nullif(trim(v_profile->>'employment_status'), ''),
    desired_job_title = nullif(trim(v_profile->>'desired_job_title'), ''),
    desired_employment_type = nullif(trim(v_profile->>'desired_employment_type'), ''),
    desired_work_arrangement = nullif(trim(v_profile->>'desired_work_arrangement'), ''),
    preferred_locations = case
      when v_profile->'preferred_locations' is null then '{}'::text[]
      else array(
        select trim(value)
        from jsonb_array_elements_text(v_profile->'preferred_locations') as location(value)
        where trim(value) <> ''
      )
    end,
    expected_salary = case
      when v_profile->>'expected_salary' is null
        or trim(v_profile->>'expected_salary') = '' then null
      else (v_profile->>'expected_salary')::numeric
    end,
    availability = case
      when v_profile->>'availability' in ('not_specified', 'immediately', 'notice_period', 'not_available')
        then v_profile->>'availability'
      else 'not_specified'
    end,
    allow_employer_discovery = coalesce((v_profile->>'allow_employer_discovery')::boolean, false),
    updated_at = now()
  where id = v_user_id;

  delete from public.experiences where user_id = v_user_id;
  delete from public.education where user_id = v_user_id;
  delete from public.profile_certifications where user_id = v_user_id;
  delete from public.profile_languages where user_id = v_user_id;
  delete from public.profile_links where user_id = v_user_id;

  with experience_rows as (
    select jsonb_array_elements(
      case when p_experience is null then '[]'::jsonb else p_experience end
    ) as item
  )
  insert into public.experiences (
    user_id, job_title, company_name, location, start_date, end_date, is_current, description
  )
  select
    v_user_id,
    nullif(trim(item->>'job_title'), ''),
    nullif(trim(item->>'company_name'), ''),
    nullif(trim(item->>'location'), ''),
    nullif(item->>'start_date', ''),
    case
      when coalesce((item->>'is_current')::boolean, false) then null
      else nullif(item->>'end_date', '')
    end,
    coalesce((item->>'is_current')::boolean, false),
    nullif(trim(item->>'description'), '')
  from experience_rows
  where coalesce(
    nullif(trim(item->>'job_title'), ''),
    nullif(trim(item->>'company_name'), ''),
    nullif(trim(item->>'location'), '')
  ) is not null;

  with education_rows as (
    select jsonb_array_elements(
      case when p_education is null then '[]'::jsonb else p_education end
    ) as item
  )
  insert into public.education (
    user_id, institution, degree, field_of_study, start_date, end_date, description
  )
  select
    v_user_id,
    nullif(trim(item->>'institution'), ''),
    nullif(trim(item->>'degree'), ''),
    nullif(trim(item->>'field_of_study'), ''),
    nullif(item->>'start_date', ''),
    nullif(item->>'end_date', ''),
    nullif(trim(item->>'description'), '')
  from education_rows
  where coalesce(
    nullif(trim(item->>'institution'), ''),
    nullif(trim(item->>'degree'), ''),
    nullif(trim(item->>'field_of_study'), '')
  ) is not null;

  delete from public.user_skills where user_id = v_user_id;

  for v_skill_name in
    select distinct normalized_name
    from (
      select lower(
        regexp_replace(
          regexp_replace(name, '^[[:space:]]+|[[:space:]]+$', '', 'g'),
          '[[:space:]]+',
          ' ',
          'g'
        )
      ) as normalized_name
      from jsonb_array_elements_text(
        case when p_skills is null then '[]'::jsonb else p_skills end
      ) as skill(name)
    ) normalized_skills
    where normalized_name <> ''
    order by normalized_name
  loop
    v_skill_id := null;

    insert into public.skills (name, user_id, proficiency)
    values (v_skill_name, null, 'Professional')
    on conflict (name) do nothing
    returning id into v_skill_id;

    if v_skill_id is null then
      select id
      into v_skill_id
      from public.skills
      where name = v_skill_name;
    end if;

    if v_skill_id is null then
      raise exception 'Unable to resolve shared skill: %', v_skill_name;
    end if;

    insert into public.user_skills (user_id, skill_id)
    values (v_user_id, v_skill_id)
    on conflict (user_id, skill_id) do nothing;
  end loop;

  with certification_rows as (
    select jsonb_array_elements(
      case when p_certifications is null then '[]'::jsonb else p_certifications end
    ) as item
  )
  insert into public.profile_certifications (
    user_id, name, issuing_organization, issue_date, expiry_date, credential_id, credential_url
  )
  select
    v_user_id,
    nullif(trim(item->>'name'), ''),
    nullif(trim(item->>'issuing_organization'), ''),
    nullif(item->>'issue_date', ''),
    nullif(item->>'expiry_date', ''),
    nullif(trim(item->>'credential_id'), ''),
    nullif(trim(item->>'credential_url'), '')
  from certification_rows
  where coalesce(
    nullif(trim(item->>'name'), ''),
    nullif(trim(item->>'issuing_organization'), '')
  ) is not null;

  with language_rows as (
    select jsonb_array_elements(
      case when p_languages is null then '[]'::jsonb else p_languages end
    ) as item
  )
  insert into public.profile_languages (user_id, name, proficiency)
  select
    v_user_id,
    nullif(trim(item->>'name'), ''),
    coalesce(nullif(trim(item->>'proficiency'), ''), 'Professional')
  from language_rows
  where nullif(trim(item->>'name'), '') is not null;

  with link_rows as (
    select jsonb_array_elements(
      case when p_links is null then '[]'::jsonb else p_links end
    ) as item
  )
  insert into public.profile_links (user_id, label, url)
  select
    v_user_id,
    coalesce(nullif(trim(item->>'label'), ''), 'Professional link'),
    nullif(trim(item->>'url'), '')
  from link_rows
  where nullif(trim(item->>'url'), '') is not null;

  return true;
end;
$$;

revoke execute on function public.save_job_seeker_profile(jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb) from public;
revoke execute on function public.save_job_seeker_profile(jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb) from anon;
grant execute on function public.save_job_seeker_profile(jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb) to authenticated;
