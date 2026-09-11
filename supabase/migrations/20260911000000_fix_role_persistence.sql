-- Role is authoritative in profiles. New accounts without an explicit role
-- must complete onboarding instead of silently becoming job seekers.
alter table public.profiles
  alter column user_type drop default,
  alter column user_type drop not null;

create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.user_type is distinct from old.user_type
     and old.user_type is not null then
    raise exception 'Account role cannot be changed';
  end if;
  if tg_op = 'UPDATE' and old.role_initialized and not new.role_initialized then
    raise exception 'Account role cannot be reset';
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role public.user_type;
  has_requested_role boolean;
begin
  has_requested_role = new.raw_user_meta_data ? 'user_type'
    and new.raw_user_meta_data ->> 'user_type' in ('job_seeker', 'employer');
  requested_role = case
    when new.raw_user_meta_data ->> 'user_type' = 'employer' then 'employer'::public.user_type
    when new.raw_user_meta_data ->> 'user_type' = 'job_seeker' then 'job_seeker'::public.user_type
    else null
  end;

  insert into public.profiles (id, full_name, email, user_type, role_initialized)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', trim(concat_ws(' ', new.raw_user_meta_data ->> 'first_name', new.raw_user_meta_data ->> 'last_name'))),
    new.email,
    requested_role,
    has_requested_role
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;