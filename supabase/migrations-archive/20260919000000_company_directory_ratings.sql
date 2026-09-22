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

drop trigger if exists company_ratings_updated_at on public.company_ratings;
create trigger company_ratings_updated_at
before update on public.company_ratings
for each row execute function public.set_updated_at();

alter table public.company_ratings enable row level security;

drop policy if exists "Public can view company ratings" on public.company_ratings;
create policy "Users can view own company rating"
on public.company_ratings for select
using (user_id = (select auth.uid()));

create or replace view public.company_rating_summaries as
select company_id, round(avg(rating)::numeric, 2) as average_rating, count(*)::integer as rating_count
from public.company_ratings
group by company_id;

grant select on public.company_rating_summaries to anon, authenticated;

drop policy if exists "Job seekers create own company ratings" on public.company_ratings;
create policy "Job seekers create own company ratings"
on public.company_ratings for insert
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and user_type = 'job_seeker'
  )
);

drop policy if exists "Job seekers update own company ratings" on public.company_ratings;
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

drop policy if exists "Job seekers delete own company ratings" on public.company_ratings;
create policy "Job seekers delete own company ratings"
on public.company_ratings for delete
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and user_type = 'job_seeker'
  )
);

drop policy if exists "Public can view companies" on public.companies;
create policy "Public can view companies"
on public.companies for select
using (true);

create or replace function public.claim_company_owner(target_company_id uuid)
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