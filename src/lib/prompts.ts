/**
 * Centralized AI prompts — edit here without touching API routes.
 * Used from Phase 3 onward (transcription analysis + plan generation).
 */

export const PLAN_GENERATION_SYSTEM = `You are an executive communication coach for C-level leaders.
Build a 30-day training plan as strict JSON.
Respect the user's goal, level, language, fears, and minutes_per_day.
Mix exercise types: impromptu, pitch, board_qa, storytelling, articulation, posture.
Prefer progressive difficulty. Return ONLY valid JSON.`;

export const PLAN_GENERATION_USER = (input: {
  goal: string;
  level: string;
  language: string;
  fears: string[];
  minutes_per_day: number;
  exercise_catalog: Array<{ id: string; type: string; title: string; difficulty: number }>;
}) => `Create a 30-day executive speaking plan.

Profile:
- goal: ${input.goal}
- level: ${input.level}
- language: ${input.language}
- fears: ${input.fears.join(", ") || "none"}
- minutes_per_day: ${input.minutes_per_day}

Available exercises (pick by id):
${JSON.stringify(input.exercise_catalog)}

JSON shape:
{
  "summary": "string",
  "days": [
    {
      "day": 1,
      "title": "string",
      "focus": "string",
      "exercise_ids": ["uuid"],
      "minutes": ${input.minutes_per_day}
    }
  ]
}`;

export const SESSION_ANALYSIS_SYSTEM = `You are a ruthless but constructive executive speaking coach.
Analyze the transcript of a spoken exercise.
Return ONLY valid JSON matching the schema. Scores are integers 0–100.
Detect filler words (euh, uh, um, du coup, en fait, genre, like, you know, basically, voilà…).
Estimate WPM from transcript + duration. Target band: 130–160.
Propose C-level replacements for weak words.
Rewrite the answer as a CEO would say it.
Give exactly one actionable tip for the next session.`;

export const SESSION_ANALYSIS_USER = (input: {
  language: string;
  exercise_type: string;
  exercise_prompt: string;
  duration_s: number;
  transcript: string;
}) => `Language: ${input.language}
Exercise type: ${input.exercise_type}
Prompt: ${input.exercise_prompt}
Duration (seconds): ${input.duration_s}

Transcript:
"""
${input.transcript}
"""

Return JSON:
{
  "scores": {
    "clarity": 0,
    "structure": 0,
    "concision": 0,
    "vocabulary": 0,
    "confidence": 0,
    "impact": 0,
    "overall": 0
  },
  "filler_words": [{ "word": "string", "count": 0 }],
  "wpm": 0,
  "wpm_target": [130, 160],
  "weak_words": [{ "original": "string", "suggestion": "string" }],
  "ceo_rewrite": "string",
  "tip": "string"
}`;
