-- Phase 2 — extra onboarding fields on profiles
alter table public.profiles
  add column if not exists speaking_context text
    check (speaking_context is null or speaking_context in ('board', 'team', 'clients', 'stage')),
  add column if not exists media_preference text
    check (media_preference is null or media_preference in ('audio', 'video', 'both'));
