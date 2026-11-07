import { NextResponse } from "next/server";
import { analyzeTranscript } from "@/lib/analysis/analyze-session";
import { transcribeWithWhisper } from "@/lib/analysis/transcribe";
import { getExerciseById } from "@/lib/exercises/get-exercise";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Accepts multipart form:
 * - file?: Blob (audio/video)
 * - transcript?: string (skip Whisper — useful for demos)
 * - exercise_id: string
 * - duration_s: number
 * - media_kind: audio | video
 */
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const exerciseId = String(form.get("exercise_id") || "");
    const duration_s = Number(form.get("duration_s") || 0);
    const media_kind = String(form.get("media_kind") || "audio") as
      | "audio"
      | "video";
    const providedTranscript = String(form.get("transcript") || "").trim();
    const file = form.get("file");

    if (!exerciseId || !duration_s || duration_s < 1) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const exercise = await getExerciseById(exerciseId);
    if (!exercise) {
      return NextResponse.json({ error: "exercise_not_found" }, { status: 404 });
    }

    let transcript = providedTranscript;
    let transcriptSource: "whisper" | "provided" | "demo" = providedTranscript
      ? "provided"
      : "whisper";

    if (!transcript && file instanceof Blob && file.size > 0) {
      const ext = media_kind === "video" ? "webm" : "webm";
      const filename = `take.${ext}`;
      try {
        const text = await transcribeWithWhisper(file, filename, exercise.language);
        if (text) {
          transcript = text;
          transcriptSource = "whisper";
        }
      } catch (err) {
        console.error("[whisper]", err);
      }
    }

    // Demo fallback so the loop works without Whisper / mic file.
    if (!transcript) {
      transcript =
        exercise.language === "fr"
          ? "Euh donc du coup je pense que notre priorité ce trimestre c'est en fait d'accélérer l'acquisition. On a un peu de retard mais voilà on va essayer de rattraper."
          : "Uh so basically I think our priority this quarter is actually to accelerate acquisition. We're a bit behind but you know we'll try to catch up.";
      transcriptSource = "demo";
    }

    const analysis = await analyzeTranscript({
      language: exercise.language,
      exercise_type: exercise.type,
      exercise_prompt: exercise.prompt,
      duration_s,
      transcript,
    });

    const supabaseConfigured =
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    let sessionId: string | null = null;
    let media_url: string | null = null;
    let persisted = false;

    if (supabaseConfigured) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Optional media upload under user folder.
        if (file instanceof Blob && file.size > 0) {
          const path = `${user.id}/${crypto.randomUUID()}.${media_kind === "video" ? "webm" : "webm"}`;
          const { error: upErr } = await supabase.storage
            .from("session-media")
            .upload(path, file, {
              contentType: file.type || (media_kind === "video" ? "video/webm" : "audio/webm"),
              upsert: false,
            });
          if (!upErr) {
            media_url = path;
          } else {
            console.error("[storage]", upErr);
          }
        }

        // Seed/stable ids may not exist as FK rows yet.
        const { data: exRow } = await supabase
          .from("exercises")
          .select("id")
          .eq("id", exercise.id)
          .maybeSingle();

        const { data: session, error: sessErr } = await supabase
          .from("sessions")
          .insert({
            user_id: user.id,
            exercise_id: exRow?.id ?? null,
            media_url,
            media_kind,
            transcript,
            scores: analysis.scores,
            feedback: {
              ...analysis.feedback,
              analysis_source: analysis.source,
              transcript_source: transcriptSource,
              exercise_snapshot: {
                id: exercise.id,
                type: exercise.type,
                title: exercise.title,
                prompt: exercise.prompt,
              },
            },
            duration_s,
          })
          .select("id")
          .single();

        if (sessErr) {
          console.error("[session insert]", sessErr);
        } else {
          sessionId = session.id;
          persisted = true;

          // Best-effort streak update.
          await bumpStreak(supabase, user.id);
        }
      }
    }

    // Ephemeral id for client navigation when not persisted.
    if (!sessionId) {
      sessionId = `local-${crypto.randomUUID()}`;
    }

    return NextResponse.json({
      ok: true,
      persisted,
      session_id: sessionId,
      transcript,
      transcript_source: transcriptSource,
      scores: analysis.scores,
      feedback: analysis.feedback,
      analysis_source: analysis.source,
      media_url,
      exercise: {
        id: exercise.id,
        title: exercise.title,
        type: exercise.type,
      },
    });
  } catch (err) {
    console.error("[sessions/analyze]", err);
    return NextResponse.json(
      {
        error: "server_error",
        message: err instanceof Error ? err.message : "unknown",
      },
      { status: 500 }
    );
  }
}

async function bumpStreak(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string
) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data) {
      await supabase.from("streaks").upsert({
        user_id: userId,
        current: 1,
        best: 1,
        last_session_date: today,
      });
      return;
    }

    if (data.last_session_date === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.toISOString().slice(0, 10);
    const next = data.last_session_date === y ? data.current + 1 : 1;
    await supabase
      .from("streaks")
      .update({
        current: next,
        best: Math.max(data.best, next),
        last_session_date: today,
      })
      .eq("user_id", userId);
  } catch (err) {
    console.error("[streak]", err);
  }
}
