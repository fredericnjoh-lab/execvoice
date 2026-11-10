import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { heuristicAnalyze } from "@/lib/analysis/heuristic";
import { SESSION_ANALYSIS_SYSTEM, SESSION_ANALYSIS_USER } from "@/lib/prompts";
import type { SessionFeedback, SessionScores } from "@/lib/types/database";

export interface AnalysisResult {
  scores: SessionScores;
  feedback: SessionFeedback;
  source: "openai" | "anthropic" | "heuristic";
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(fence?.[1]?.trim() ?? trimmed);
}

const SCORE_KEYS = [
  "clarity",
  "structure",
  "concision",
  "vocabulary",
  "confidence",
  "impact",
  "overall",
] as const;

function asFinite(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return null;
  return n;
}

function asScore(value: unknown): number | null {
  const n = asFinite(value);
  if (n == null) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function isValidAnalysis(data: unknown): data is {
  scores: SessionScores;
  filler_words: SessionFeedback["filler_words"];
  wpm: number;
  wpm_target: [number, number];
  weak_words: SessionFeedback["weak_words"];
  ceo_rewrite: string;
  tip: string;
} {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  if (!o.scores || typeof o.scores !== "object") return false;
  const s = o.scores as Record<string, unknown>;
  const scores = SCORE_KEYS.map((k) => asScore(s[k]));
  if (scores.some((n) => n == null)) return false;
  // The prompt used to ship an all-zero example. Models echo it and the
  // page shows 0/100 even though the call succeeded.
  if (scores.every((n) => n === 0)) return false;
  for (let i = 0; i < SCORE_KEYS.length; i++) s[SCORE_KEYS[i]] = scores[i];

  const wpm = asFinite(o.wpm);
  if (wpm == null || typeof o.ceo_rewrite !== "string" || typeof o.tip !== "string") {
    return false;
  }
  if (!o.ceo_rewrite.trim() || o.ceo_rewrite.trim() === "string") return false;
  if (!o.tip.trim() || o.tip.trim() === "string") return false;
  if (!Array.isArray(o.filler_words) || !Array.isArray(o.weak_words)) return false;
  o.wpm = wpm;
  return true;
}

function toResult(
  data: {
    scores: SessionScores;
    filler_words: SessionFeedback["filler_words"];
    wpm: number;
    wpm_target?: [number, number];
    weak_words: SessionFeedback["weak_words"];
    ceo_rewrite: string;
    tip: string;
  },
  source: AnalysisResult["source"]
): AnalysisResult {
  return {
    scores: {
      clarity: Math.round(data.scores.clarity),
      structure: Math.round(data.scores.structure),
      concision: Math.round(data.scores.concision),
      vocabulary: Math.round(data.scores.vocabulary),
      confidence: Math.round(data.scores.confidence),
      impact: Math.round(data.scores.impact),
      overall: Math.round(data.scores.overall),
    },
    feedback: {
      filler_words: data.filler_words,
      wpm: Math.round(data.wpm),
      wpm_target: data.wpm_target ?? [130, 160],
      weak_words: data.weak_words,
      ceo_rewrite: data.ceo_rewrite,
      tip: data.tip,
    },
    source,
  };
}

async function withOpenAI(input: {
  language: string;
  exercise_type: string;
  exercise_prompt: string;
  duration_s: number;
  transcript: string;
}): Promise<AnalysisResult | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_ANALYSIS_MODEL || "gpt-4o",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SESSION_ANALYSIS_SYSTEM },
      { role: "user", content: SESSION_ANALYSIS_USER(input) },
    ],
  });
  const content = completion.choices[0]?.message?.content;
  if (!content) return null;
  const parsed = extractJson(content);
  if (!isValidAnalysis(parsed)) return null;
  return toResult(parsed, "openai");
}

async function withAnthropic(input: {
  language: string;
  exercise_type: string;
  exercise_prompt: string;
  duration_s: number;
  transcript: string;
}): Promise<AnalysisResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: process.env.ANTHROPIC_ANALYSIS_MODEL || "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: SESSION_ANALYSIS_SYSTEM,
    messages: [{ role: "user", content: SESSION_ANALYSIS_USER(input) }],
  });
  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return null;
  const parsed = extractJson(block.text);
  if (!isValidAnalysis(parsed)) return null;
  return toResult(parsed, "anthropic");
}

/** Analyze a transcript — AI first, heuristic fallback. */
export async function analyzeTranscript(input: {
  language: string;
  exercise_type: string;
  exercise_prompt: string;
  duration_s: number;
  transcript: string;
}): Promise<AnalysisResult> {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();
  try {
    const primary =
      provider === "anthropic"
        ? await withAnthropic(input)
        : await withOpenAI(input);
    if (primary) return primary;
    const secondary =
      provider === "anthropic"
        ? await withOpenAI(input)
        : await withAnthropic(input);
    if (secondary) return secondary;
  } catch (err) {
    console.error("[analyzeTranscript] AI failed", err);
  }

  const h = heuristicAnalyze(input);
  return { ...h, source: "heuristic" };
}
