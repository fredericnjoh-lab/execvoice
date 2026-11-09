import { heuristicAnalyze } from "@/lib/analysis/heuristic";
import type { SessionFeedback, SessionScores } from "@/lib/types/database";

const AXES = [
  "clarity",
  "structure",
  "concision",
  "vocabulary",
  "confidence",
  "impact",
  "overall",
] as const;

export type DemoReason = "no_ai" | "demo_transcript" | "heuristic";

export interface PresentableFeedback {
  transcript: string;
  scores: SessionScores;
  feedback: SessionFeedback;
  analysis_source?: string;
  transcript_source?: string;
  demo_mode?: boolean;
  demo_reason?: DemoReason | null;
  ai_configured?: boolean;
  duration_s?: number;
  exercise?: { id: string; title: string; type: string; language?: string; prompt?: string };
}

function blankScores(scores: SessionScores | null | undefined): boolean {
  if (!scores) return true;
  return AXES.every((key) => !scores[key]);
}

/**
 * A successful Claude/GPT call must not be labeled "no API key".
 * Missing flags (session reloaded from the database) are not the same as a missing key.
 */
export function resolveDemoReason(data: PresentableFeedback): DemoReason | null {
  const source = data.analysis_source;
  if (source === "openai" || source === "anthropic") {
    if (data.demo_reason === "demo_transcript" || data.transcript_source === "demo") {
      return "demo_transcript";
    }
    if (data.demo_reason === "heuristic") return "heuristic";
    return null;
  }

  if (
    data.demo_reason === "no_ai" ||
    data.demo_reason === "demo_transcript" ||
    data.demo_reason === "heuristic"
  ) {
    return data.demo_reason;
  }

  if (data.ai_configured === false) return "no_ai";
  if (data.transcript_source === "demo") return "demo_transcript";
  if (source === "heuristic") return "heuristic";
  return null;
}

/** Replace an all-zero grid (schema echo) with the local transcript scoring. */
export function presentFeedback<T extends PresentableFeedback>(data: T): T {
  if (!blankScores(data.scores) || !data.transcript?.trim()) return data;

  const language =
    data.exercise?.language ||
    (/[àâçéèêëîïôùûüœ]/i.test(data.transcript) ? "fr" : "en");
  const repaired = heuristicAnalyze({
    transcript: data.transcript,
    duration_s: data.duration_s && data.duration_s > 0 ? data.duration_s : 60,
    language,
    exercise_prompt: data.exercise?.prompt || data.exercise?.title || "",
  });

  return {
    ...data,
    scores: repaired.scores,
    feedback: {
      ...data.feedback,
      ...repaired.feedback,
      posture: data.feedback?.posture,
    },
    analysis_source: "heuristic",
    demo_mode: true,
    demo_reason: data.ai_configured === false || data.demo_reason === "no_ai" ? "no_ai" : "heuristic",
  };
}
