-- ExecVoice — Phase 1 schema
-- Run in Supabase SQL editor (or via supabase db push).
-- Requires: auth.users (Supabase Auth)

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.exercise_type as enum (
    'impromptu',
    'pitch',
    'board_qa',
    'storytelling',
    'articulation',
    'posture'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.app_language as enum ('fr', 'en');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.user_goal as enum (
    'meetings',
    'presentations',
    'investor_pitch',
    'media'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.user_level as enum (
    'beginner',
    'intermediate',
    'advanced'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  goal public.user_goal,
  level public.user_level,
  language public.app_language not null default 'fr',
  minutes_per_day smallint check (minutes_per_day in (5, 10, 20)),
  fears text[] default '{}',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- plans (30-day executive training plan)
-- ---------------------------------------------------------------------------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  start_date date not null default current_date,
  -- days: [{ day: 1, exercise_ids: [...], focus: "...", title: "..." }, ...]
  days jsonb not null default '[]'::jsonb,
  summary text,
  created_at timestamptz not null default now(),
  unique (user_id)
);

-- ---------------------------------------------------------------------------
-- exercises (seed library — public read)
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  type public.exercise_type not null,
  title text not null,
  prompt text not null,
  duration_s integer not null check (duration_s > 0),
  prep_s integer not null default 0 check (prep_s >= 0),
  difficulty smallint not null default 2 check (difficulty between 1 and 5),
  language public.app_language not null default 'fr',
  tips text,
  created_at timestamptz not null default now()
);

create index if not exists exercises_type_lang_idx
  on public.exercises (type, language);

-- ---------------------------------------------------------------------------
-- sessions
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  exercise_id uuid references public.exercises (id) on delete set null,
  media_url text,
  media_kind text check (media_kind in ('audio', 'video')),
  transcript text,
  -- scores: { clarity, structure, concision, vocabulary, confidence, impact, overall }
  scores jsonb,
  -- feedback: { filler_words, wpm, weak_words, ceo_rewrite, tip, posture? }
  feedback jsonb,
  duration_s integer,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_created_idx
  on public.sessions (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- streaks
-- ---------------------------------------------------------------------------
create table if not exists public.streaks (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  current integer not null default 0,
  best integer not null default 0,
  last_session_date date
);

-- ---------------------------------------------------------------------------
-- Storage bucket for session media (run once)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'session-media',
  'session-media',
  false,
  52428800, -- 50 MB
  array['audio/webm', 'audio/mp4', 'audio/mpeg', 'video/webm', 'video/mp4']
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile + streak row on signup
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

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.plans enable row level security;
alter table public.exercises enable row level security;
alter table public.sessions enable row level security;
alter table public.streaks enable row level security;

-- profiles: own row only
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- plans: own row only
drop policy if exists "plans_select_own" on public.plans;
create policy "plans_select_own"
  on public.plans for select
  using (auth.uid() = user_id);

drop policy if exists "plans_insert_own" on public.plans;
create policy "plans_insert_own"
  on public.plans for insert
  with check (auth.uid() = user_id);

drop policy if exists "plans_update_own" on public.plans;
create policy "plans_update_own"
  on public.plans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "plans_delete_own" on public.plans;
create policy "plans_delete_own"
  on public.plans for delete
  using (auth.uid() = user_id);

-- exercises: authenticated users can read the library
drop policy if exists "exercises_select_authenticated" on public.exercises;
create policy "exercises_select_authenticated"
  on public.exercises for select
  to authenticated
  using (true);

-- sessions: own rows only
drop policy if exists "sessions_select_own" on public.sessions;
create policy "sessions_select_own"
  on public.sessions for select
  using (auth.uid() = user_id);

drop policy if exists "sessions_insert_own" on public.sessions;
create policy "sessions_insert_own"
  on public.sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "sessions_update_own" on public.sessions;
create policy "sessions_update_own"
  on public.sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "sessions_delete_own" on public.sessions;
create policy "sessions_delete_own"
  on public.sessions for delete
  using (auth.uid() = user_id);

-- streaks: own row only
drop policy if exists "streaks_select_own" on public.streaks;
create policy "streaks_select_own"
  on public.streaks for select
  using (auth.uid() = user_id);

drop policy if exists "streaks_update_own" on public.streaks;
create policy "streaks_update_own"
  on public.streaks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "streaks_insert_own" on public.streaks;
create policy "streaks_insert_own"
  on public.streaks for insert
  with check (auth.uid() = user_id);

-- Storage policies: users can manage files under their own folder
drop policy if exists "session_media_select_own" on storage.objects;
create policy "session_media_select_own"
  on storage.objects for select
  using (
    bucket_id = 'session-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "session_media_insert_own" on storage.objects;
create policy "session_media_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'session-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "session_media_update_own" on storage.objects;
create policy "session_media_update_own"
  on storage.objects for update
  using (
    bucket_id = 'session-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "session_media_delete_own" on storage.objects;
create policy "session_media_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'session-media'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
