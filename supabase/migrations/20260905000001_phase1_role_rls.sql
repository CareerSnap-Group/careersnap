-- Phase 1 authorization corrections for the existing CareerSnap model.

create or replace function public.prevent_profile_role_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.user_type is distinct from old.user_type
     and (old.role_initialized or not new.role_initialized) then
    raise exception 'Account role cannot be changed';
  end if;
  if tg_op = 'UPDATE' and old.role_initialized and not new.role_initialized then
    raise exception 'Account role cannot be reset';
  end if;
  return new;
end;
$$;

create or replace function public.is_company_member(target_company_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.employer_users eu
    join public.profiles p on p.id = eu.user_id
    where eu.company_id = target_company_id and eu.user_id = auth.uid() and p.user_type = 'employer'
  );
$$;

create or replace function public.can_manage_company(target_company_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.employer_users eu
    join public.profiles p on p.id = eu.user_id
    where eu.company_id = target_company_id and eu.user_id = auth.uid()
      and p.user_type = 'employer' and eu.role in ('owner', 'admin')
  );
$$;

drop policy if exists "Employers create managed jobs" on public.jobs;
create policy "Employers create managed jobs" on public.jobs for insert
with check (public.can_manage_company(company_id) and created_by = auth.uid());

drop policy if exists "Employers update managed jobs" on public.jobs;
create policy "Employers update managed jobs" on public.jobs for update
using (public.can_manage_company(company_id))
with check (public.can_manage_company(company_id));

drop policy if exists "Employers delete managed jobs" on public.jobs;
create policy "Employers delete managed jobs" on public.jobs for delete
using (public.can_manage_company(company_id));

drop policy if exists "Users create own applications" on public.applications;
create policy "Job seekers create own applications" on public.applications for insert
with check (auth.uid() = applicant_id and auth.uid() = user_id and exists (select 1 from public.profiles where id = auth.uid() and user_type = 'job_seeker'));

drop policy if exists "Users update own applications" on public.applications;
create policy "Job seekers update own application details" on public.applications for update
using (auth.uid() = applicant_id and exists (select 1 from public.profiles where id = auth.uid() and user_type = 'job_seeker'))
with check (auth.uid() = applicant_id and auth.uid() = user_id);

create or replace function public.prevent_applicant_status_change()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() = old.applicant_id and new.status is distinct from old.status then
    raise exception 'Application status is managed by the employer';
  end if;
  return new;
end;
$$;

drop trigger if exists applications_status_protection on public.applications;
create trigger applications_status_protection before update on public.applications
for each row execute function public.prevent_applicant_status_change();