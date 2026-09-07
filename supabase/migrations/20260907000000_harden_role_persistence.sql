-- Persist the role selected at signup before any dashboard routing occurs.
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
    else 'job_seeker'::public.user_type
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