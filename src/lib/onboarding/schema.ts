import { z } from "zod";

export const onboardingAnswersSchema = z.object({
  name: z.string().trim().min(1).max(80),
  goal: z.enum(["meetings", "presentations", "investor_pitch", "media"]),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  language: z.enum(["fr", "en"]),
  primaryFear: z.enum([
    "stuttering",
    "losing_thread",
    "filler_words",
    "lack_of_authority",
  ]),
  fears: z
    .array(
      z.enum([
        "stuttering",
        "losing_thread",
        "filler_words",
        "lack_of_authority",
      ])
    )
    .default([]),
  minutes_per_day: z.union([z.literal(5), z.literal(10), z.literal(20)]),
  speaking_context: z.enum(["board", "team", "clients", "stage"]),
  media_preference: z.enum(["audio", "video", "both"]),
});

export type OnboardingAnswersInput = z.infer<typeof onboardingAnswersSchema>;
