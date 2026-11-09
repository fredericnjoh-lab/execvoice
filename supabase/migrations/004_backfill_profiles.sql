-- Backfill profiles + streaks for auth users created before handle_new_user
-- (or when the trigger was missing). Safe to re-run.
-- Also re-assert the signup trigger so new accounts always get a profile.

insert into public.profiles (id, name)
select
  u.id,
  coalesce(
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  )
from auth.users u
on conflict (id) do nothing;

insert into public.streaks (user_id)
select p.id
from public.profiles p
on conflict (user_id) do nothing;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'language')::public.app_language, 'fr')
  )
  on conflict (id) do nothing;

  insert into public.streaks (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
