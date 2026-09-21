-- Forward-only reconciliation migration for genuinely missing non-billing schema.
-- This intentionally does not touch historical migration metadata or any billing objects.

alter table public.companies
  add column if not exists facebook_url text,
  add column if not exists instagram_url text,
  add column if not exists linkedin_url text,
  add column if not exists x_url text,
  add column if not exists tiktok_url text,
  add column if not exists youtube_url text;

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists city text,
  add column if not exists province text,
  add column if not exists country text,
  add column if not exists professional_headline text,
  add column if not exists current_job_title text,
  add column if not exists current_employer text,
  add column if not exists years_experience integer,
  add column if not exists employment_status text,
  add column if not exists desired_job_title text,
  add column if not exists desired_employment_type text,
  add column if not exists desired_work_arrangement text,
  add column if not exists preferred_locations text[],
  add column if not exists expected_salary numeric,
  add column if not exists availability_start_date date;

update public.profiles
set first_name = coalesce(first_name, split_part(coalesce(full_name, ''), ' ', 1)),
    last_name = coalesce(last_name, nullif(trim(substr(coalesce(full_name, ''), length(split_part(coalesce(full_name, ''), ' ', 1)) + 2)), '')),
    professional_headline = coalesce(professional_headline, headline)
where first_name is null or last_name is null or professional_headline is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_years_experience_valid'
  ) then
    alter table public.profiles
      add constraint profiles_years_experience_valid
      check (years_experience is null or years_experience >= 0);
  end if;
end $$;

create table if not exists public.profile_certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  issuing_organization text,
  issue_date date,
  expiry_date date,
  credential_id text,
  credential_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_languages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  proficiency text not null default 'Professional',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_languages_proficiency_valid
    check (proficiency in ('Basic', 'Conversational', 'Professional', 'Fluent', 'Native'))
);

create table if not exists public.profile_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_certifications_user_id_idx on public.profile_certifications(user_id);
create index if not exists profile_languages_user_id_idx on public.profile_languages(user_id);
create index if not exists profile_links_user_id_idx on public.profile_links(user_id);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'profile_certifications_updated_at'
      and tgrelid = 'public.profile_certifications'::regclass
  ) then
    create trigger profile_certifications_updated_at
    before update on public.profile_certifications
    for each row execute function public.set_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'profile_languages_updated_at'
      and tgrelid = 'public.profile_languages'::regclass
  ) then
    create trigger profile_languages_updated_at
    before update on public.profile_languages
    for each row execute function public.set_updated_at();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'profile_links_updated_at'
      and tgrelid = 'public.profile_links'::regclass
  ) then
    create trigger profile_links_updated_at
    before update on public.profile_links
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.profile_certifications enable row level security;
alter table public.profile_languages enable row level security;
alter table public.profile_links enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profile_certifications'
      and policyname = 'Users manage own certifications'
  ) then
    create policy "Users manage own certifications"
    on public.profile_certifications
    for all
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profile_languages'
      and policyname = 'Users manage own languages'
  ) then
    create policy "Users manage own languages"
    on public.profile_languages
    for all
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profile_links'
      and policyname = 'Users manage own profile links'
  ) then
    create policy "Users manage own profile links"
    on public.profile_links
    for all
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);
  end if;
end $$;

create table if not exists public.company_ratings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create index if not exists company_ratings_company_id_idx on public.company_ratings(company_id);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'company_ratings_updated_at'
      and tgrelid = 'public.company_ratings'::regclass
  ) then
    create trigger company_ratings_updated_at
    before update on public.company_ratings
    for each row execute function public.set_updated_at();
  end if;
end $$;

alter table public.company_ratings enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'company_ratings'
      and policyname = 'Users can view own company rating'
  ) then
    create policy "Users can view own company rating"
    on public.company_ratings for select
    using (user_id = (select auth.uid()));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'company_ratings'
      and policyname = 'Job seekers create own company ratings'
  ) then
    create policy "Job seekers create own company ratings"
    on public.company_ratings for insert
    with check (
      user_id = (select auth.uid())
      and exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and user_type = 'job_seeker'
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'company_ratings'
      and policyname = 'Job seekers update own company ratings'
  ) then
    create policy "Job seekers update own company ratings"
    on public.company_ratings for update
    using (
      user_id = (select auth.uid())
      and exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and user_type = 'job_seeker'
      )
    )
    with check (
      user_id = (select auth.uid())
      and exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and user_type = 'job_seeker'
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'company_ratings'
      and policyname = 'Job seekers delete own company ratings'
  ) then
    create policy "Job seekers delete own company ratings"
    on public.company_ratings for delete
    using (
      user_id = (select auth.uid())
      and exists (
        select 1 from public.profiles
        where id = (select auth.uid()) and user_type = 'job_seeker'
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'companies'
      and policyname = 'Public can view companies'
  ) then
    create policy "Public can view companies"
    on public.companies for select
    using (true);
  end if;
end $$;

do $$
begin
  if to_regclass('public.company_rating_summaries') is null then
    create view public.company_rating_summaries as
    select company_id,
           round(avg(rating)::numeric, 2) as average_rating,
           count(*)::integer as rating_count
    from public.company_ratings
    group by company_id;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'claim_company_owner'
      and pg_get_function_identity_arguments(p.oid) = 'target_company_id uuid'
  ) then
    create function public.claim_company_owner(target_company_id uuid)
    returns void
    language plpgsql
    security definer
    set search_path = public
    as $$
    begin
      insert into public.employer_users (company_id, user_id, role)
      select c.id, auth.uid(), 'owner'
      from public.companies c
      join public.profiles p on p.id = auth.uid()
      where c.id = target_company_id
        and c.created_by = auth.uid()
        and p.user_type = 'employer'
      on conflict (company_id, user_id) do nothing;
    end;
    $$;

    revoke all on function public.claim_company_owner(uuid) from public;
    grant execute on function public.claim_company_owner(uuid) to authenticated;
  end if;
end $$;

create table if not exists public.job_views (
  job_id uuid not null references public.jobs(id) on delete cascade,
  viewer_key text not null,
  viewed_at timestamptz not null default now(),
  primary key (job_id, viewer_key)
);

create index if not exists job_views_job_id_idx on public.job_views(job_id);

alter table public.job_views enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'job_views'
      and policyname = 'Managers view job views'
  ) then
    create policy "Managers view job views" on public.job_views for select
    using (public.can_manage_company((select company_id from public.jobs where id = job_id)));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'record_job_view'
      and pg_get_function_identity_arguments(p.oid) = 'target_job_id uuid, target_viewer_key text'
  ) then
    create function public.record_job_view(target_job_id uuid, target_viewer_key text)
    returns void
    language plpgsql
    security definer
    set search_path = public
    as $$
    begin
      if target_viewer_key is null or length(target_viewer_key) < 16 then
        return;
      end if;
      insert into public.job_views (job_id, viewer_key)
      select id, target_viewer_key
      from public.jobs
      where id = target_job_id
        and status = 'published'
        and (expires_at is null or expires_at > now())
      on conflict (job_id, viewer_key) do update set viewed_at = now();
    end;
    $$;

    revoke all on function public.record_job_view(uuid, text) from public;
    grant execute on function public.record_job_view(uuid, text) to anon, authenticated;
  end if;
end $$;
