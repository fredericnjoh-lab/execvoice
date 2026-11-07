import { exercisesFromSeed } from "@/lib/seed/as-exercises";
import { createClient } from "@/lib/supabase/server";
import type { Exercise } from "@/lib/types/database";

/**
 * Resolve an exercise by id from Supabase, then seed fallback (stable ids).
 */
export async function getExerciseById(id: string): Promise<Exercise | null> {
  const supabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (supabaseConfigured) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!error && data) return data as Exercise;
    } catch (err) {
      console.error("[getExerciseById]", err);
    }
  }

  return exercisesFromSeed().find((e) => e.id === id) ?? null;
}

export async function listExercises(language?: string): Promise<Exercise[]> {
  const supabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (supabaseConfigured) {
    try {
      const supabase = await createClient();
      let query = supabase.from("exercises").select("*");
      if (language) query = query.eq("language", language);
      const { data, error } = await query;
      if (!error && data && data.length > 0) return data as Exercise[];
    } catch (err) {
      console.error("[listExercises]", err);
    }
  }

  const seed = exercisesFromSeed();
  return language ? seed.filter((e) => e.language === language) : seed;
}
