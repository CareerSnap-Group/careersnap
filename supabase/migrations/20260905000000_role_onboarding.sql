-- Allow only an uninitialized OAuth profile to choose its account role once.
alter table public.profiles add column if not exists role_initialized boolean not null default true;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare requested_role public.user_type;
declare has_requested_role boolean;
begin
  has_requested_role := new.raw_user_meta_data ? 'user_type' and new.raw_user_meta_data ->> 'user_type' in ('job_seeker', 'employer');
  requested_role := case when new.raw_user_meta_data ->> 'user_type' = 'employer' then 'employer'::public.user_type else 'job_seeker'::public.user_type end;
  insert into public.profiles (id, full_name, email, user_type, role_initialized)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', trim(concat_ws(' ', new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name'))), new.email, requested_role, has_requested_role)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create or replace function public.complete_role_onboarding(selected_role public.user_type)
returns public.user_type
language plpgsql security definer set search_path = public
as $$
declare result_role public.user_type;
begin
  update public.profiles
  set user_type = selected_role, role_initialized = true
  where id = auth.uid() and role_initialized = false
  returning user_type into result_role;
  if result_role is null then raise exception 'Account role is already set'; end if;
  return result_role;
end;
$$;

revoke all on function public.complete_role_onboarding(public.user_type) from public;
grant execute on function public.complete_role_onboarding(public.user_type) to authenticated;