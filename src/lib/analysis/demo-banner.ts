export type DemoBannerReason = "no_ai" | "demo_transcript" | "heuristic";

export interface DemoBannerInput {
  demo_reason?: DemoBannerReason | null;
  demo_mode?: boolean;
  ai_configured?: boolean;
  transcript_source?: string;
  analysis_source?: string;
}

function aiRan(source: string | undefined): boolean {
  return source === "openai" || source === "anthropic";
}

/**
 * Which amber banner to show, if any.
 * A missing `ai_configured` must not be read as "no key": a saved session
 * reloads with the analysis source and the transcript source only.
 */
export function resolveDemoBanner(data: DemoBannerInput): DemoBannerReason | null {
  const ran = aiRan(data.analysis_source);

  if (data.demo_reason === "no_ai" && ran) {
    return data.transcript_source === "demo" ? "demo_transcript" : null;
  }
  if (data.demo_reason) return data.demo_reason;

  if (data.transcript_source === "demo") {
    return data.ai_configured === false && !ran ? "no_ai" : "demo_transcript";
  }
  if (data.analysis_source === "heuristic") {
    return data.ai_configured === false ? "no_ai" : "heuristic";
  }
  if (data.ai_configured === false) return "no_ai";
  if (data.demo_mode && !ran && data.ai_configured !== true) return "no_ai";
  return null;
}
