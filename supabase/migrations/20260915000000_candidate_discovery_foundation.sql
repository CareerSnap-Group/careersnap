-- Candidate discovery is separate from application-linked candidate access.
-- Discovery is opt-in and exposes only approved summary fields through RPCs.

alter table public.profiles
  add column if not exists allow_employer_discovery boolean not null default false,
  add column if not exists availability text not null default 'not_specified';

alter table public.profiles
  drop constraint if exists profiles_availability_valid;
alter table public.profiles
  add constraint profiles_availability_valid
  check (availability in ('not_specified', 'immediately', 'notice_period', 'not_available'));

create index if not exists profiles_discovery_idx
  on public.profiles (allow_employer_discovery, availability)
  where user_type = 'job_seeker' and allow_employer_discovery = true;
create index if not exists experiences_job_title_idx on public.experiences (job_title);
create index if not exists education_field_of_study_idx on public.education (field_of_study);
create index if not exists skills_name_idx on public.skills (name);

create or replace function public.can_discover_candidates()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles requester
    join public.employer_users membership on membership.user_id = requester.id
    where requester.id = auth.uid()
      and requester.user_type = 'employer'
      and membership.role in ('owner', 'admin')
  );
$$;

revoke all on function public.can_discover_candidates() from public;
grant execute on function public.can_discover_candidates() to authenticated;

create or replace function public.search_discoverable_candidates(
  search_keyword text default null,
  search_location text default null,
  search_skill text default null,
  search_job_title text default null,
  search_employment_type text default null,
  search_availability text default null,
  require_cv boolean default null,
  page_size integer default 25,
  page_number integer default 1
)
returns table (
  candidate_id uuid,
  display_name text,
  headline text,
  location text,
  bio text,
  skills text[],
  experience jsonb,
  education jsonb,
  availability text,
  has_cv boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.headline,
    p.location,
    p.bio,
    coalesce(skill_data.skills, '{}'::text[]),
    coalesce(experience_data.experience, '[]'::jsonb),
    coalesce(education_data.education, '[]'::jsonb),
    p.availability,
    exists (select 1 from public.resumes r where r.user_id = p.id)
  from public.profiles p
  left join lateral (
    select array_agg(distinct s.name order by s.name) as skills
    from public.skills s
    where s.user_id = p.id
  ) skill_data on true
  left join lateral (
    select jsonb_agg(jsonb_build_object('job_title', e.job_title, 'company_name', e.company_name, 'location', e.location, 'start_date', e.start_date, 'end_date', e.end_date, 'is_current', e.is_current, 'employment_type', e.employment_type) order by e.start_date desc) as experience
    from public.experiences e
    where e.user_id = p.id
  ) experience_data on true
  left join lateral (
    select jsonb_agg(jsonb_build_object('institution', e.institution, 'degree', e.degree, 'field_of_study', e.field_of_study, 'start_date', e.start_date, 'end_date', e.end_date) order by e.start_date desc nulls last) as education
    from public.education e
    where e.user_id = p.id
  ) education_data on true
  where public.can_discover_candidates()
    and p.user_type = 'job_seeker'
    and p.allow_employer_discovery = true
    and (search_location is null or p.location ilike '%' || search_location || '%')
    and (search_availability is null or p.availability = search_availability)
    and (require_cv is null or (exists (select 1 from public.resumes r where r.user_id = p.id) = require_cv))
    and (search_skill is null or exists (select 1 from public.skills s where s.user_id = p.id and s.name ilike '%' || search_skill || '%'))
    and (search_job_title is null or exists (select 1 from public.experiences e where e.user_id = p.id and e.job_title ilike '%' || search_job_title || '%'))
    and (search_employment_type is null or exists (select 1 from public.experiences e where e.user_id = p.id and e.employment_type ilike '%' || search_employment_type || '%'))
    and (search_keyword is null or concat_ws(' ', p.full_name, p.headline, p.bio) ilike '%' || search_keyword || '%'
      or exists (select 1 from public.skills s where s.user_id = p.id and s.name ilike '%' || search_keyword || '%')
      or exists (select 1 from public.experiences e where e.user_id = p.id and concat_ws(' ', e.job_title, e.company_name, e.description) ilike '%' || search_keyword || '%')
      or exists (select 1 from public.education e where e.user_id = p.id and concat_ws(' ', e.institution, e.degree, e.field_of_study) ilike '%' || search_keyword || '%'))
  order by p.updated_at desc, p.id
  limit least(greatest(coalesce(page_size, 25), 1), 100)
  offset greatest(coalesce(page_number, 1) - 1, 0) * least(greatest(coalesce(page_size, 25), 1), 100);
$$;

revoke all on function public.search_discoverable_candidates(text, text, text, text, text, text, boolean, integer, integer) from public;
grant execute on function public.search_discoverable_candidates(text, text, text, text, text, text, boolean, integer, integer) to authenticated;

create or replace function public.get_discoverable_candidate(candidate_id uuid)
returns table (
  candidate_id uuid,
  display_name text,
  headline text,
  location text,
  bio text,
  skills text[],
  experience jsonb,
  education jsonb,
  availability text,
  has_cv boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.headline,
    p.location,
    p.bio,
    coalesce(skill_data.skills, '{}'::text[]),
    coalesce(experience_data.experience, '[]'::jsonb),
    coalesce(education_data.education, '[]'::jsonb),
    p.availability,
    exists (select 1 from public.resumes r where r.user_id = p.id)
  from public.profiles p
  left join lateral (
    select array_agg(distinct s.name order by s.name) as skills
    from public.skills s where s.user_id = p.id
  ) skill_data on true
  left join lateral (
    select jsonb_agg(jsonb_build_object('job_title', e.job_title, 'company_name', e.company_name, 'location', e.location, 'start_date', e.start_date, 'end_date', e.end_date, 'is_current', e.is_current, 'employment_type', e.employment_type) order by e.start_date desc) as experience
    from public.experiences e where e.user_id = p.id
  ) experience_data on true
  left join lateral (
    select jsonb_agg(jsonb_build_object('institution', e.institution, 'degree', e.degree, 'field_of_study', e.field_of_study, 'start_date', e.start_date, 'end_date', e.end_date) order by e.start_date desc nulls last) as education
    from public.education e where e.user_id = p.id
  ) education_data on true
  where public.can_discover_candidates()
    and p.id = get_discoverable_candidate.candidate_id
    and p.user_type = 'job_seeker'
    and p.allow_employer_discovery = true;
$$;

revoke all on function public.get_discoverable_candidate(uuid) from public;
grant execute on function public.get_discoverable_candidate(uuid) to authenticated;

create or replace function public.get_discoverable_resume_path(candidate_id uuid, requested_resume_id uuid default null)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.storage_path
  from public.resumes r
  where public.can_discover_candidates()
    and exists (select 1 from public.profiles p where p.id = candidate_id and p.user_type = 'job_seeker' and p.allow_employer_discovery = true)
    and r.user_id = candidate_id
    and (requested_resume_id is null and (r.is_primary or r.is_default) or r.id = requested_resume_id)
  order by r.is_primary desc, r.is_default desc, r.created_at desc
  limit 1;
$$;

revoke all on function public.get_discoverable_resume_path(uuid, uuid) from public;
grant execute on function public.get_discoverable_resume_path(uuid, uuid) to authenticated;