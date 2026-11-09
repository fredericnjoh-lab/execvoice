import { differenceInCalendarDays, parseISO, format } from "date-fns";
import { getExerciseById, listExercises } from "@/lib/exercises/get-exercise";
import { exercisesFromSeed } from "@/lib/seed/as-exercises";
import { createClient } from "@/lib/supabase/server";
import {
  computeMilestoneProgress,
  type MilestoneProgress,
} from "@/lib/progress/milestones";
import type {
  AppLanguage,
  Exercise,
  Plan,
  PlanDay,
  Profile,
  Session,
  SessionScores,
  Streak,
} from "@/lib/types/database";

export interface AxisPoint {
  date: string;
  label: string;
  scores: SessionScores;
}

export interface DashboardData {
  authenticated: boolean;
  profile: Profile | null;
  streak: Streak;
  plan: Plan | null;
  planDay: PlanDay | null;
  dayNumber: number;
  todayExercise: Exercise | null;
  overallScore: number | null;
  axisAverages: SessionScores | null;
  recentSessions: Array<
    Session & { exercise_title?: string | null }
  >;
  axisHistory: AxisPoint[];
  sessionsCompleted: number;
  milestones: MilestoneProgress;
}

const EMPTY_STREAK: Streak = {
  user_id: "",
  current: 0,
  best: 0,
  last_session_date: null,
};

function averageScores(sessions: Session[]): SessionScores | null {
  const scored = sessions.filter((s) => s.scores);
  if (scored.length === 0) return null;
  const keys: (keyof SessionScores)[] = [
    "clarity",
    "structure",
    "concision",
    "vocabulary",
    "confidence",
    "impact",
    "overall",
  ];
  const acc = Object.fromEntries(keys.map((k) => [k, 0])) as Record<
    keyof SessionScores,
    number
  >;
  for (const s of scored) {
    for (const k of keys) acc[k] += s.scores![k];
  }
  const n = scored.length;
  return {
    clarity: Math.round(acc.clarity / n),
    structure: Math.round(acc.structure / n),
    concision: Math.round(acc.concision / n),
    vocabulary: Math.round(acc.vocabulary / n),
    confidence: Math.round(acc.confidence / n),
    impact: Math.round(acc.impact / n),
    overall: Math.round(acc.overall / n),
  };
}

function planDayIndex(startDate: string, today = new Date()): number {
  const start = parseISO(startDate);
  const diff = differenceInCalendarDays(today, start);
  return Math.min(29, Math.max(0, diff));
}

async function demoDashboard(language: AppLanguage): Promise<DashboardData> {
  const catalog = await listExercises(language);
  const pool = catalog.length > 0 ? catalog : exercisesFromSeed().filter((e) => e.language === language);
  const dayNumber = (new Date().getDate() % 30) + 1;
  const todayExercise = pool[(dayNumber - 1) % pool.length] ?? null;

  return {
    authenticated: false,
    profile: null,
    streak: { ...EMPTY_STREAK, current: 0, best: 0 },
    plan: null,
    planDay: todayExercise
      ? {
          day: dayNumber,
          title: todayExercise.title,
          focus: todayExercise.tips || todayExercise.type,
          exercise_ids: [todayExercise.id],
          minutes: 10,
        }
      : null,
    dayNumber,
    todayExercise,
    overallScore: null,
    axisAverages: null,
    recentSessions: [],
    axisHistory: [],
    sessionsCompleted: 0,
    milestones: computeMilestoneProgress(0),
  };
}

/**
 * Loads dashboard + progress payloads for the current user.
 * Falls back to a demo "exercise of the day" when unauthenticated / no Supabase.
 */
export async function getDashboardData(
  language: AppLanguage = "fr"
): Promise<DashboardData> {
  const supabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseConfigured) {
    return demoDashboard(language);
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return demoDashboard(language);
    }

    const [
      { data: profile },
      { data: streak },
      { data: plan },
      { data: sessions },
      { count: sessionCount },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("streaks").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("plans").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    const typedSessions = (sessions as Session[] | null) ?? [];
    const sessionsCompleted = sessionCount ?? typedSessions.length;
    const typedPlan = plan as Plan | null;
    const typedProfile = profile as Profile | null;
    const lang = typedProfile?.language ?? language;

    let dayNumber = 1;
    let planDay: PlanDay | null = null;
    let todayExercise: Exercise | null = null;

    if (typedPlan?.days?.length) {
      const idx = planDayIndex(typedPlan.start_date);
      dayNumber = idx + 1;
      planDay = typedPlan.days[idx] ?? typedPlan.days[0] ?? null;
      const firstId = planDay?.exercise_ids?.[0];
      if (firstId) {
        todayExercise = await getExerciseById(firstId);
      }
    }

    if (!todayExercise) {
      const pool = await listExercises(lang);
      todayExercise = pool[(dayNumber - 1) % Math.max(pool.length, 1)] ?? null;
      if (todayExercise && !planDay) {
        planDay = {
          day: dayNumber,
          title: todayExercise.title,
          focus: todayExercise.tips || todayExercise.type,
          exercise_ids: [todayExercise.id],
          minutes: typedProfile?.minutes_per_day ?? 10,
        };
      }
    }

    // Enrich recent sessions with titles from feedback snapshot or join.
    const recentSessions = await Promise.all(
      typedSessions.slice(0, 10).map(async (s) => {
        let exercise_title: string | null = null;
        const snap = (
          s.feedback as { exercise_snapshot?: { title?: string } } | null
        )?.exercise_snapshot?.title;
        if (snap) exercise_title = snap;
        else if (s.exercise_id) {
          const ex = await getExerciseById(s.exercise_id);
          exercise_title = ex?.title ?? null;
        }
        return { ...s, exercise_title };
      })
    );

    const axisHistory: AxisPoint[] = [...typedSessions]
      .filter((s) => s.scores)
      .reverse()
      .map((s) => ({
        date: s.created_at,
        label: format(parseISO(s.created_at), "dd/MM"),
        scores: s.scores!,
      }));

    const axisAverages = averageScores(typedSessions);

    return {
      authenticated: true,
      profile: typedProfile,
      streak: (streak as Streak | null) ?? {
        user_id: user.id,
        current: 0,
        best: 0,
        last_session_date: null,
      },
      plan: typedPlan,
      planDay,
      dayNumber,
      todayExercise,
      overallScore: axisAverages?.overall ?? null,
      axisAverages,
      recentSessions,
      axisHistory,
      sessionsCompleted,
      milestones: computeMilestoneProgress(sessionsCompleted),
    };
  } catch (err) {
    console.error("[getDashboardData]", err);
    return demoDashboard(language);
  }
}
