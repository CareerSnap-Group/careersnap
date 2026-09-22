-- Add private Job Seeker company ratings and an aggregate-only public summary view.
-- Ownership transfer is intentionally outside this migration.

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
    select 1 from pg_trigger
    where tgname = 'company_ratings_updated_at'
      and tgrelid = 'public.company_ratings'::regclass
      and not tgisinternal
  ) then
    create trigger company_ratings_updated_at
    before update on public.company_ratings
    for each row execute function public.set_updated_at();
  end if;
end;
$$;

alter table public.company_ratings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'company_ratings'
      and policyname = 'Users can view own company rating'
  ) then
    create policy "Users can view own company rating"
    on public.company_ratings for select
    using (user_id = (select auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
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

  if not exists (
    select 1 from pg_policies
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

  if not exists (
    select 1 from pg_policies
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
end;
$$;

create view public.company_rating_summaries as
select
  company_id,
  round(avg(rating)::numeric, 2) as average_rating,
  count(*)::integer as rating_count
from public.company_ratings
group by company_id;

grant select on public.company_rating_summaries to anon, authenticated;
