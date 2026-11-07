import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Prefer loading via tsx when available; fallback: duplicate path via dynamic import of compiled none.
// This script is invoked with: npx tsx scripts/generate-exercise-seed.mjs
// but we keep .mjs and import .ts through tsx runner.

async function main() {
  const { EXERCISE_SEEDS } = await import("../src/lib/seed/exercises.ts");

  const esc = (s) => s.replace(/'/g, "''");

  const rows = EXERCISE_SEEDS.map(
    (e) =>
      `  ('${e.type}', '${esc(e.title)}', '${esc(e.prompt)}', ${e.duration_s}, ${e.prep_s}, ${e.difficulty}, '${e.language}', '${esc(e.tips)}')`
  ).join(",\n");

  const sql = `-- ExecVoice exercise seed (${EXERCISE_SEEDS.length} rows)
-- Idempotent: clears library then re-inserts (safe for empty / seed-only tables).

truncate table public.exercises restart identity cascade;

insert into public.exercises
  (type, title, prompt, duration_s, prep_s, difficulty, language, tips)
values
${rows};
`;

  writeFileSync(new URL("../supabase/seed/exercises.sql", import.meta.url), sql);
  console.log(`Wrote ${EXERCISE_SEEDS.length} exercises → supabase/seed/exercises.sql`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
