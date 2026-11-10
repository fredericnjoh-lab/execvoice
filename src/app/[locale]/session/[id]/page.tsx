import { setRequestLocale } from "next-intl/server";
import { SessionLoader } from "@/components/session/session-loader";
import type { FeedbackPayload } from "@/components/session/feedback-view";
import { resolveDemoBanner } from "@/lib/analysis/demo-banner";
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
          demo_reason?: FeedbackPayload["demo_reason"];
          exercise_snapshot?: { id: string; title: string; type: string };
        };
        const exJoin = data.exercises as
          | { id: string; title: string; type: string }
          | null
          | undefined;
        const analysisSource = fb.analysis_source;
        const transcriptSource = fb.transcript_source;
        const aiConfigured =
          analysisSource === "openai" || analysisSource === "anthropic"
            ? true
            : analysisSource === "heuristic" && transcriptSource === "demo"
              ? false
              : undefined;
        const demoReason = resolveDemoBanner({
          demo_reason: fb.demo_reason,
          ai_configured: aiConfigured,
          transcript_source: transcriptSource,
          analysis_source: analysisSource,
        });

        initial = {
          session_id: data.id,
          transcript: data.transcript,
          scores: data.scores as SessionScores,
          feedback: fb,
          analysis_source: analysisSource,
          transcript_source: transcriptSource,
          demo_reason: demoReason,
          demo_mode: demoReason !== null,
          ai_configured: aiConfigured,
          persisted: true,
          authenticated: true,
          exercise: exJoin ?? fb.exercise_snapshot,
        };
      }
    } catch (err) {
      console.error("[session page]", err);
    }
  }

  return <SessionLoader sessionId={id} initial={initial} />;
}
