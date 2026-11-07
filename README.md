# ExecVoice

Mobile-first web app for executive speaking practice (clarity, structure, C-level vocabulary, posture, confidence).

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind · shadcn/ui · Supabase · next-intl (FR/EN)

---

## Phase 1 — status

Delivered:

- Project scaffold + premium design tokens (navy / white / gold)
- Supabase auth clients (browser, server, middleware) + login/signup UI
- Postgres schema with RLS (`profiles`, `plans`, `exercises`, `sessions`, `streaks`) + storage bucket
- Seed library: **42 exercises** (impromptu, pitch, board_qa, storytelling, articulation, posture — FR + EN)
- i18n FR/EN with locale-prefixed routes
- Route stubs for `/onboarding`, `/dashboard`, `/exercise/[id]`, `/session/[id]`, `/progress`, `/settings`
- Editable AI prompts stub in `src/lib/prompts.ts` (used from Phase 2–3)

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
2. `supabase/seed/exercises.sql`

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

## Next

**Phase 2** — onboarding quiz (10 screens) + AI 30-day plan generation.

Awaiting your validation before starting Phase 2.
