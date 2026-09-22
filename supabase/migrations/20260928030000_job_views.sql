-- Record deduplicated public views for published, unexpired jobs.
-- Direct table writes remain unavailable to anon and authenticated callers.

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
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'job_views'
      and policyname = 'Managers view job views'
  ) then
    create policy "Managers view job views"
    on public.job_views for select
    using (public.can_manage_company((select company_id from public.jobs where id = job_id)));
  end if;
end;
$$;

create or replace function public.record_job_view(target_job_id uuid, target_viewer_key text)
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
  on conflict (job_id, viewer_key) do update
    set viewed_at = now();
end;
$$;

revoke all on function public.record_job_view(uuid, text) from public;
grant execute on function public.record_job_view(uuid, text) to anon, authenticated;
