import type {
  AppLanguage,
  Exercise,
  ExerciseType,
  Fear,
  OnboardingAnswers,
  PlanDay,
  UserGoal,
  UserLevel,
} from "@/lib/types/database";

interface BuiltPlan {
  summary: string;
  days: PlanDay[];
  source: "deterministic";
}

/** Map goals → preferred exercise types (ordered by emphasis). */
const GOAL_TYPES: Record<UserGoal, ExerciseType[]> = {
  meetings: ["impromptu", "board_qa", "articulation", "storytelling", "pitch", "posture"],
  presentations: ["pitch", "storytelling", "articulation", "posture", "impromptu", "board_qa"],
  investor_pitch: ["pitch", "board_qa", "storytelling", "impromptu", "articulation", "posture"],
  media: ["articulation", "posture", "impromptu", "pitch", "storytelling", "board_qa"],
};

/** Map fears → types that train the weakness. */
const FEAR_TYPES: Record<Fear, ExerciseType[]> = {
  stuttering: ["articulation", "impromptu"],
  losing_thread: ["pitch", "storytelling", "board_qa"],
  filler_words: ["articulation", "pitch"],
  lack_of_authority: ["board_qa", "posture", "impromptu"],
};

const LEVEL_DIFFICULTY: Record<UserLevel, { min: number; max: number }> = {
  beginner: { min: 1, max: 3 },
  intermediate: { min: 2, max: 4 },
  advanced: { min: 3, max: 5 },
};

const SUMMARIES: Record<AppLanguage, (a: OnboardingAnswers) => string> = {
  fr: (a) =>
    `Plan 30 jours axé « ${a.goal} », niveau ${a.level}, ${a.minutes_per_day} min/jour. Priorité : ${a.primaryFear.replaceAll("_", " ")}.`,
  en: (a) =>
    `30-day plan focused on “${a.goal}”, ${a.level} level, ${a.minutes_per_day} min/day. Priority: ${a.primaryFear.replaceAll("_", " ")}.`,
};

const DAY_TITLES: Record<AppLanguage, (day: number, type: ExerciseType) => { title: string; focus: string }> = {
  fr: (day, type) => {
    const map: Record<ExerciseType, { title: string; focus: string }> = {
      impromptu: { title: `J${day} · Impromptu`, focus: "Réactivité et structure sous pression" },
      pitch: { title: `J${day} · Pitch exécutif`, focus: "Conclusion d'abord, PREP" },
      board_qa: { title: `J${day} · Board Q&A`, focus: "Réponses courtes, autorité" },
      storytelling: { title: `J${day} · Storytelling`, focus: "Narration en 3 actes" },
      articulation: { title: `J${day} · Articulation`, focus: "Rythme, silences, clarté" },
      posture: { title: `J${day} · Posture caméra`, focus: "Regard, gestes, ancrage" },
    };
    return map[type];
  },
  en: (day, type) => {
    const map: Record<ExerciseType, { title: string; focus: string }> = {
      impromptu: { title: `D${day} · Impromptu`, focus: "Composure and structure under pressure" },
      pitch: { title: `D${day} · Executive pitch`, focus: "Answer-first, PREP" },
      board_qa: { title: `D${day} · Board Q&A`, focus: "Short answers, authority" },
      storytelling: { title: `D${day} · Storytelling`, focus: "Three-act narrative" },
      articulation: { title: `D${day} · Articulation`, focus: "Pace, pauses, clarity" },
      posture: { title: `D${day} · Camera posture`, focus: "Gaze, gestures, presence" },
    };
    return map[type];
  },
};

function rotateTypes(answers: OnboardingAnswers): ExerciseType[] {
  const base = [...GOAL_TYPES[answers.goal]];
  const fearBoost = [
    ...FEAR_TYPES[answers.primaryFear],
    ...answers.fears.flatMap((f) => FEAR_TYPES[f]),
  ];
  // Interleave fear-focused types early in the cycle.
  const merged: ExerciseType[] = [];
  const seen = new Set<ExerciseType>();
  for (const t of [...fearBoost, ...base]) {
    if (!seen.has(t)) {
      seen.add(t);
      merged.push(t);
    }
  }
  return merged;
}

function pickExercise(
  pool: Exercise[],
  type: ExerciseType,
  day: number,
  used: Set<string>,
  level: UserLevel
): Exercise | null {
  const { min, max } = LEVEL_DIFFICULTY[level];
  const candidates = pool
    .filter((e) => e.type === type && e.difficulty >= min && e.difficulty <= max)
    .sort((a, b) => a.difficulty - b.difficulty);

  if (candidates.length === 0) {
    const fallback = pool.filter((e) => e.type === type);
    if (fallback.length === 0) return null;
    return fallback[day % fallback.length]!;
  }

  // Prefer unused, else cycle.
  const fresh = candidates.filter((e) => !used.has(e.id));
  const list = fresh.length > 0 ? fresh : candidates;
  return list[day % list.length]!;
}

/**
 * Builds a 30-day plan without calling an LLM.
 * Used as fallback when AI keys are missing / the model fails,
 * and as a reliable baseline for tests.
 */
export function buildDeterministicPlan(
  answers: OnboardingAnswers,
  exercises: Exercise[]
): BuiltPlan {
  const langPool = exercises.filter((e) => e.language === answers.language);
  const pool = langPool.length > 0 ? langPool : exercises;
  const cycle = rotateTypes(answers);
  const used = new Set<string>();
  const days: PlanDay[] = [];

  // How many exercises fit in the daily budget (rough: ~1 per 5–10 min).
  const slots = answers.minutes_per_day <= 5 ? 1 : answers.minutes_per_day <= 10 ? 1 : 2;

  for (let day = 1; day <= 30; day++) {
    // Progressive difficulty: nudge type index + unlock harder mid-plan.
    const type = cycle[(day - 1) % cycle.length]!;
    const secondary = cycle[day % cycle.length]!;
    const labels = DAY_TITLES[answers.language](day, type);

    const ids: string[] = [];
    const primary = pickExercise(pool, type, day, used, answers.level);
    if (primary) {
      ids.push(primary.id);
      used.add(primary.id);
    }
    if (slots > 1) {
      const extra = pickExercise(pool, secondary, day + 7, used, answers.level);
      if (extra && extra.id !== primary?.id) {
        ids.push(extra.id);
        used.add(extra.id);
      }
    }

    // Prefer video/posture days when user wants camera work.
    if (
      answers.media_preference !== "audio" &&
      day % 6 === 0
    ) {
      const posture = pickExercise(pool, "posture", day, used, answers.level);
      if (posture && !ids.includes(posture.id)) {
        ids[ids.length - 1] = posture.id;
        used.add(posture.id);
      }
    }

    days.push({
      day,
      title: labels.title,
      focus: labels.focus,
      exercise_ids: ids,
      minutes: answers.minutes_per_day,
    });
  }

  return {
    summary: SUMMARIES[answers.language](answers),
    days,
    source: "deterministic",
  };
}
