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
        .select("*, exercises(id, title, type)")
        .eq("id", id)
        .maybeSingle();

      if (data?.scores && data?.feedback && data?.transcript) {
        const fb = data.feedback as SessionFeedback & {
          analysis_source?: string;
          transcript_source?: string;
          exercise_snapshot?: { id: string; title: string; type: string };
        };
        const exJoin = data.exercises as
          | { id: string; title: string; type: string }
          | null
          | undefined;

        initial = {
          session_id: data.id,
          transcript: data.transcript,
          scores: data.scores as SessionScores,
          feedback: fb,
          analysis_source: fb.analysis_source,
          transcript_source: fb.transcript_source,
          exercise: exJoin ?? fb.exercise_snapshot,
        };
      }
    } catch (err) {
      console.error("[session page]", err);
    }
  }

  return <SessionLoader sessionId={id} initial={initial} />;
}
