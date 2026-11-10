import { setRequestLocale } from "next-intl/server";
import { SessionLoader } from "@/components/session/session-loader";
import type { FeedbackPayload } from "@/components/session/feedback-view";
import { createClient } from "@/lib/supabase/server";
import type { SessionFeedback, SessionScores } from "@/lib/types/database";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  let initial: FeedbackPayload | null = null;

  const supabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (supabaseConfigured && !id.startsWith("local-")) {
    try {
      const supabase = await createClient();
      const { data } = await supabase
        .from("sessions")
        .select("*, exercises(id, title, type, language, prompt)")
        .eq("id", id)
        .maybeSingle();

      if (data?.scores && data?.feedback && data?.transcript) {
        const fb = data.feedback as SessionFeedback & {
          analysis_source?: string;
          transcript_source?: string;
          demo_reason?: FeedbackPayload["demo_reason"];
          exercise_snapshot?: {
            id: string;
            title: string;
            type: string;
            language?: string;
            prompt?: string;
          };
        };
        const exJoin = data.exercises as
          | {
              id: string;
              title: string;
              type: string;
              language?: string;
              prompt?: string;
            }
          | null
          | undefined;

        initial = {
          session_id: data.id,
          transcript: data.transcript,
          scores: data.scores as SessionScores,
          feedback: fb,
          duration_s: data.duration_s ?? undefined,
          analysis_source: fb.analysis_source,
          transcript_source: fb.transcript_source,
          demo_reason: fb.demo_reason,
          demo_mode: Boolean(fb.demo_reason),
          // The row exists only for the signed-in owner, so this reload is saved.
          persisted: true,
          authenticated: true,
          ai_configured: fb.analysis_source === "openai" || fb.analysis_source === "anthropic"
            ? true
            : fb.demo_reason === "no_ai"
              ? false
              : undefined,
          exercise: exJoin ?? fb.exercise_snapshot,
        };
      }
    } catch (err) {
      console.error("[session page]", err);
    }
  }

  return <SessionLoader sessionId={id} initial={initial} />;
}
