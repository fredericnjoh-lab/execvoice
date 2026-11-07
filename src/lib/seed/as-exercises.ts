import { createHash } from "node:crypto";
import { EXERCISE_SEEDS } from "@/lib/seed/exercises";
import type { Exercise } from "@/lib/types/database";

/** Stable UUID-like id from seed content (so plans stay referencable before SQL seed). */
function stableId(type: string, language: string, title: string): string {
  const hex = createHash("sha256")
    .update(`execvoice:${type}:${language}:${title}`)
    .digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `a${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

/** Convert TypeScript seed library into Exercise rows with stable IDs. */
export function exercisesFromSeed(): Exercise[] {
  return EXERCISE_SEEDS.map((e) => ({
    id: stableId(e.type, e.language, e.title),
    type: e.type,
    title: e.title,
    prompt: e.prompt,
    duration_s: e.duration_s,
    prep_s: e.prep_s,
    difficulty: e.difficulty,
    language: e.language,
    tips: e.tips,
    created_at: new Date(0).toISOString(),
  }));
}
