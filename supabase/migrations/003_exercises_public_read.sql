-- Allow reading the exercise library without being logged in
-- (guests can still train; persistence requires auth).
drop policy if exists "exercises_select_authenticated" on public.exercises;
drop policy if exists "exercises_select_public" on public.exercises;

create policy "exercises_select_public"
  on public.exercises for select
  to anon, authenticated
  using (true);
