# ExecVoice

Mobile-first web app for executive speaking practice (clarity, structure, C-level vocabulary, posture, confidence).

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind · shadcn/ui · Supabase · next-intl (FR/EN)

---

## Phase status

### Phase 1 ✅
- Project scaffold + premium design tokens (navy / white / gold)
- Supabase auth clients + login/signup UI
- Postgres schema with RLS + storage bucket
- Seed library: **42 exercises**
- i18n FR/EN

### Phase 2 ✅
- Onboarding quiz — **10 screens**, 1 question each, progress bar
- Profile persistence (`goal`, `level`, `language`, `fears`, `minutes_per_day`, `speaking_context`, `media_preference`)
- 30-day executive plan generation:
  - AI via OpenAI / Anthropic (`src/lib/prompts.ts`)
  - Deterministic fallback if no API key / model failure
- API: `POST /api/onboarding/complete`
- Result screen → dashboard

### Phase 3 ✅
- Exercise player: consigne + prep/speak timers + MediaRecorder (audio/vidéo)
- `POST /api/sessions/analyze` — Whisper transcription + structured AI feedback
- Heuristic fallback (fillers, WPM, scores) when AI keys missing
- Feedback cards on `/session/[id]` (6 axes, tics, débit, rewrite CEO, tip)
- Demo shortcut: `/[locale]/exercise/demo`

### Phase 4 ✅
- Dashboard: exercice du jour (plan J/30), streak, score global, axes, sessions récentes
- Progress: sparklines par axe + historique
- Bottom nav mobile (dashboard / progress / settings)
- Mode démo sans auth (exercice du jour depuis le seed)

### Phase 5 ✅
- Posture caméra client-side via MediaPipe Pose + FaceLandmarker
- HUD live (alignement tête/épaules, regard caméra, mains visibles)
- Scores posture fusionnés dans le feedback session

---

## Setup

### 1. Install

```bash
cd execvoice
npm install --ignore-scripts
```

(`ignore-scripts` is also set in `.npmrc` for supply-chain safety.)

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in your Supabase project URL + anon key. AI keys are needed from Phase 3.

### 3. Database

In the Supabase SQL editor, run in order:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_onboarding_extras.sql`
3. `supabase/seed/exercises.sql`

Auth redirect URL to allow: `http://localhost:3000/auth/callback`

### 4. Dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → redirects to `/fr`.

---

## Routes

| Path | Phase |
|------|-------|
| `/[locale]` | Landing |
| `/[locale]/login` · `/signup` | Auth (Phase 1) |
| `/[locale]/onboarding` | Phase 2 |
| `/[locale]/dashboard` | Phase 4 |
| `/[locale]/exercise/[id]` | Phase 3 |
| `/[locale]/session/[id]` | Phase 3 |
| `/[locale]/progress` | Phase 4 |
| `/[locale]/settings` | Phase 1 (language switch) |

---

## Regenerating the exercise seed

```bash
npm run seed:generate
```

Source of truth: `src/lib/seed/exercises.ts` → writes `supabase/seed/exercises.sql`.

---

## Posture (Phase 5)

Requires **video** mode (forced for `posture` exercises). Models load from CDN on first use:

- WASM: jsDelivr `@mediapipe/tasks-vision@1.2.2`
- Pose lite + Face Landmarker (Google Storage)

If MediaPipe fails to load, the speaking analysis still completes without posture scores.

---

## Done

Phases 1–5 are complete. Next improvements could include richer dashboard charts, push reminders, or team workspaces.
