import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { PLAN_GENERATION_SYSTEM, PLAN_GENERATION_USER } from "@/lib/prompts";
import { buildDeterministicPlan } from "@/lib/plan/build-deterministic-plan";
import type {
  Exercise,
  OnboardingAnswers,
  PlanDay,
} from "@/lib/types/database";

export interface GeneratedPlan {
  summary: string;
  days: PlanDay[];
  source: "openai" | "anthropic" | "deterministic";
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fence?.[1]?.trim() ?? trimmed;
  return JSON.parse(raw);
}

function isValidPlan(data: unknown, minutes: number): data is { summary: string; days: PlanDay[] } {
  if (!data || typeof data !== "object") return false;
  const obj = data as { summary?: unknown; days?: unknown };
  if (typeof obj.summary !== "string" || !Array.isArray(obj.days)) return false;
  if (obj.days.length < 28 || obj.days.length > 31) return false;
  return obj.days.every((d) => {
    if (!d || typeof d !== "object") return false;
    const day = d as PlanDay;
    return (
      typeof day.day === "number" &&
      typeof day.title === "string" &&
      typeof day.focus === "string" &&
      Array.isArray(day.exercise_ids) &&
      typeof (day.minutes ?? minutes) === "number"
    );
  });
}

function normalizeDays(days: PlanDay[], minutes: number, catalogIds: Set<string>): PlanDay[] {
  return days.slice(0, 30).map((d, i) => ({
    day: i + 1,
    title: d.title,
    focus: d.focus,
    minutes: d.minutes || minutes,
    exercise_ids: (d.exercise_ids || []).filter((id) => catalogIds.has(id)).slice(0, 3),
  }));
}

async function generateWithOpenAI(
  answers: OnboardingAnswers,
  catalog: Array<{ id: string; type: string; title: string; difficulty: number }>
): Promise<GeneratedPlan | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const client = new OpenAI({ apiKey: key });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_PLAN_MODEL || "gpt-4o",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: PLAN_GENERATION_SYSTEM },
      {
        role: "user",
        content: PLAN_GENERATION_USER({
          goal: answers.goal,
          level: answers.level,
          language: answers.language,
          fears: [answers.primaryFear, ...answers.fears],
          minutes_per_day: answers.minutes_per_day,
          exercise_catalog: catalog,
        }),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) return null;
  const parsed = extractJson(content);
  if (!isValidPlan(parsed, answers.minutes_per_day)) return null;

  const catalogIds = new Set(catalog.map((c) => c.id));
  return {
    summary: parsed.summary,
    days: normalizeDays(parsed.days, answers.minutes_per_day, catalogIds),
    source: "openai",
  };
}

async function generateWithAnthropic(
  answers: OnboardingAnswers,
  catalog: Array<{ id: string; type: string; title: string; difficulty: number }>
): Promise<GeneratedPlan | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const client = new Anthropic({ apiKey: key });
  const message = await client.messages.create({
    model: process.env.ANTHROPIC_PLAN_MODEL || "claude-sonnet-4-5-20250929",
    max_tokens: 8192,
    system: PLAN_GENERATION_SYSTEM,
    messages: [
      {
        role: "user",
        content: PLAN_GENERATION_USER({
          goal: answers.goal,
          level: answers.level,
          language: answers.language,
          fears: [answers.primaryFear, ...answers.fears],
          minutes_per_day: answers.minutes_per_day,
          exercise_catalog: catalog,
        }),
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") return null;
  const parsed = extractJson(block.text);
  if (!isValidPlan(parsed, answers.minutes_per_day)) return null;

  const catalogIds = new Set(catalog.map((c) => c.id));
  return {
    summary: parsed.summary,
    days: normalizeDays(parsed.days, answers.minutes_per_day, catalogIds),
    source: "anthropic",
  };
}

/**
 * Generate a 30-day plan: prefer configured AI provider, fall back to deterministic.
 */
export async function generateExecutivePlan(
  answers: OnboardingAnswers,
  exercises: Exercise[]
): Promise<GeneratedPlan> {
  const catalog = exercises
    .filter((e) => e.language === answers.language)
    .map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      difficulty: e.difficulty,
    }));

  // Prefer explicit AI_PROVIDER, else try OpenAI then Anthropic.
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();

  try {
    if (provider === "anthropic") {
      const plan =
        (await generateWithAnthropic(answers, catalog)) ||
        (await generateWithOpenAI(answers, catalog));
      if (plan && plan.days.every((d) => d.exercise_ids.length > 0)) return plan;
    } else {
      const plan =
        (await generateWithOpenAI(answers, catalog)) ||
        (await generateWithAnthropic(answers, catalog));
      if (plan && plan.days.every((d) => d.exercise_ids.length > 0)) return plan;
    }
  } catch (err) {
    console.error("[generateExecutivePlan] AI failed, using deterministic fallback", err);
  }

  // Fill any empty AI days / full fallback.
  const fallback = buildDeterministicPlan(answers, exercises);
  return { ...fallback, source: "deterministic" };
}
