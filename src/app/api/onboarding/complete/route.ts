import { NextResponse } from "next/server";
import { onboardingAnswersSchema } from "@/lib/onboarding/schema";
import { generateExecutivePlan } from "@/lib/plan/generate-plan";
import { exercisesFromSeed } from "@/lib/seed/as-exercises";
import { createClient } from "@/lib/supabase/server";
import type { Exercise, Fear } from "@/lib/types/database";

export const runtime = "nodejs";

/**
 * Completes onboarding:
 * 1. Validate answers
 * 2. Upsert profile
 * 3. Generate 30-day plan (AI → deterministic fallback)
 * 4. Upsert plans row
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = onboardingAnswersSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "invalid_payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const answers = parsed.data;
    // Ensure primary fear is included in fears array.
    const fears = Array.from(
      new Set<Fear>([answers.primaryFear, ...answers.fears])
    );

    const supabaseConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    let userId: string | null = null;
    let exercises: Exercise[] = [];

    if (supabaseConfigured) {
      const supabase = await createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      userId = user.id;

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        name: answers.name,
        goal: answers.goal,
        level: answers.level,
        language: answers.language,
        minutes_per_day: answers.minutes_per_day,
        fears,
        speaking_context: answers.speaking_context,
        media_preference: answers.media_preference,
        onboarding_completed: true,
      });

      if (profileError) {
        console.error("[onboarding] profile upsert", profileError);
        return NextResponse.json(
          { error: "profile_save_failed", message: profileError.message },
          { status: 500 }
        );
      }

      const { data: rows, error: exError } = await supabase
        .from("exercises")
        .select("*")
        .eq("language", answers.language);

      if (exError) {
        console.error("[onboarding] exercises fetch", exError);
      }
      exercises = (rows as Exercise[] | null) ?? [];
    }

    if (exercises.length === 0) {
      exercises = exercisesFromSeed().filter((e) => e.language === answers.language);
    }

    const plan = await generateExecutivePlan(
      { ...answers, fears },
      exercises
    );

    if (userId && supabaseConfigured) {
      const supabase = await createClient();
      const { error: planError } = await supabase.from("plans").upsert(
        {
          user_id: userId,
          start_date: new Date().toISOString().slice(0, 10),
          days: plan.days,
          summary: plan.summary,
        },
        { onConflict: "user_id" }
      );

      if (planError) {
        console.error("[onboarding] plan upsert", planError);
        return NextResponse.json(
          {
            error: "plan_save_failed",
            message: planError.message,
            plan, // still return plan so UI can show it
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      persisted: Boolean(userId),
      plan,
    });
  } catch (err) {
    console.error("[onboarding/complete]", err);
    return NextResponse.json(
      { error: "server_error", message: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}
