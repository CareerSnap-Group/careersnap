-- Enforce the existing candidate_search entitlement at the shared discovery boundary.
-- Membership, employer role, and Job Seeker discoverability checks remain unchanged
-- in the discovery functions that call can_discover_candidates().

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
      and public.has_entitlement(auth.uid(), 'candidate_search')
  );
$$;

revoke all on function public.can_discover_candidates() from public;
grant execute on function public.can_discover_candidates() to authenticated;
