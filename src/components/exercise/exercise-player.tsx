"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Mic, Square, Video, RotateCcw, Send } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { TimerRing } from "@/components/exercise/timer-ring";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/hooks/use-countdown";
import { useMediaRecorder, type MediaKind } from "@/hooks/use-media-recorder";
import { Link, useRouter } from "@/i18n/navigation";
import type { Exercise } from "@/lib/types/database";
import { cn } from "@/lib/utils";

type Phase = "intro" | "prep" | "ready" | "recording" | "review" | "uploading";

interface ExercisePlayerProps {
  exercise: Exercise;
  preferredKind?: MediaKind;
}

const LOCAL_SESSION_KEY = "execvoice:last-session";

export function ExercisePlayer({
  exercise,
  preferredKind = exercise.type === "posture" ? "video" : "audio",
}: ExercisePlayerProps) {
  const t = useTranslations("Exercise");
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [kind, setKind] = useState<MediaKind>(preferredKind);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const recordedSecondsRef = useRef(0);

  const prep = useCountdown(exercise.prep_s);
  const speak = useCountdown(exercise.duration_s);
  const recorder = useMediaRecorder({ kind });
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Attach live preview
  useEffect(() => {
    if (videoRef.current && recorder.stream && kind === "video") {
      videoRef.current.srcObject = recorder.stream;
    }
  }, [recorder.stream, kind]);

  const phaseLabel = useMemo(() => {
    switch (phase) {
      case "prep":
        return t("phase.prep");
      case "recording":
        return t("phase.recording");
      case "review":
        return t("phase.review");
      case "uploading":
        return t("phase.uploading");
      default:
        return t("phase.ready");
    }
  }, [phase, t]);

  async function begin() {
    setError(null);
    const ok = await recorder.ensurePermission();
    if (!ok) {
      setError(t("errors.permission"));
      return;
    }
    if (exercise.prep_s > 0) {
      setPhase("prep");
      prep.start(exercise.prep_s, () => setPhase("ready"));
    } else {
      setPhase("ready");
    }
  }

  async function startRecording() {
    setError(null);
    recordedSecondsRef.current = 0;
    await recorder.start();
    setPhase("recording");
    speak.start(exercise.duration_s, () => {
      recorder.stop();
      recordedSecondsRef.current = exercise.duration_s;
      setPhase("review");
    });
  }

  function stopEarly() {
    const elapsed = exercise.duration_s - speak.seconds;
    recordedSecondsRef.current = Math.max(3, elapsed);
    speak.pause();
    recorder.stop();
    setPhase("review");
  }

  function retake() {
    recorder.reset();
    prep.reset(exercise.prep_s);
    speak.reset(exercise.duration_s);
    setPhase("intro");
    setError(null);
  }

  function submit() {
    if (!recorder.blob && phase === "review") {
      // Allow submit without blob — API will use demo transcript.
    }
    setPhase("uploading");
    setError(null);

    startTransition(async () => {
      try {
        const form = new FormData();
        form.set("exercise_id", exercise.id);
        form.set(
          "duration_s",
          String(recordedSecondsRef.current || exercise.duration_s)
        );
        form.set("media_kind", kind);
        if (recorder.blob) {
          form.set(
            "file",
            recorder.blob,
            `take.${kind === "video" ? "webm" : "webm"}`
          );
        }

        const res = await fetch("/api/sessions/analyze", {
          method: "POST",
          body: form,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || t("errors.analyze"));
          setPhase("review");
          return;
        }

        // Cache for local-* session ids (no DB).
        try {
          sessionStorage.setItem(
            LOCAL_SESSION_KEY,
            JSON.stringify({ ...data, cached_at: Date.now() })
          );
          sessionStorage.setItem(
            `execvoice:session:${data.session_id}`,
            JSON.stringify(data)
          );
        } catch {
          /* private mode */
        }

        router.push(`/session/${data.session_id}`);
      } catch {
        setError(t("errors.analyze"));
        setPhase("review");
      }
    });
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-8 pt-4">
      <header className="flex items-center justify-between gap-3">
        <Logo />
        <Link
          href="/dashboard"
          className="text-sm text-navy/55 hover:text-navy"
        >
          {t("exit")}
        </Link>
      </header>

      <div className="mt-6">
        <p className="text-xs uppercase tracking-wide text-gold">
          {t(`types.${exercise.type}`)}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-navy">
          {exercise.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-navy/70">
          {exercise.prompt}
        </p>
        {exercise.tips ? (
          <p className="mt-2 text-xs text-navy/45">{exercise.tips}</p>
        ) : null}
      </div>

      {/* Media kind toggle (except forced posture video) */}
      {phase === "intro" && exercise.type !== "posture" ? (
        <div className="mt-6 flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={kind === "audio" ? "default" : "outline"}
            onClick={() => setKind("audio")}
          >
            <Mic className="h-4 w-4" />
            {t("audio")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant={kind === "video" ? "default" : "outline"}
            onClick={() => setKind("video")}
          >
            <Video className="h-4 w-4" />
            {t("video")}
          </Button>
        </div>
      ) : null}

      <section className="mt-8 flex flex-1 flex-col items-center">
        {/* Live / playback preview */}
        {(kind === "video" || recorder.previewUrl) && (
          <div className="mb-6 w-full overflow-hidden rounded-xl border border-navy/10 bg-navy/95 aspect-video">
            {phase === "review" && recorder.previewUrl ? (
              kind === "video" ? (
                <video
                  src={recorder.previewUrl}
                  controls
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
                  <audio src={recorder.previewUrl} controls className="w-full" />
                </div>
              )
            ) : kind === "video" ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full scale-x-[-1] object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gold/80">
                <Mic className={cn("h-10 w-10", phase === "recording" && "animate-pulse")} />
              </div>
            )}
          </div>
        )}

        {phase === "prep" && (
          <TimerRing
            seconds={prep.seconds}
            total={exercise.prep_s}
            label={phaseLabel}
            variant="prep"
          />
        )}
        {phase === "recording" && (
          <TimerRing
            seconds={speak.seconds}
            total={exercise.duration_s}
            label={phaseLabel}
            variant="record"
          />
        )}
        {phase === "ready" && (
          <p className="font-display text-xl text-navy">{t("readyPrompt")}</p>
        )}
        {phase === "uploading" && (
          <div className="flex flex-col items-center gap-3 text-navy/70">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p>{t("phase.uploading")}</p>
          </div>
        )}

        {error ? (
          <p className="mt-4 text-center text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <div className="mt-6 flex flex-col gap-3">
        {phase === "intro" && (
          <Button variant="gold" size="lg" className="w-full" onClick={begin}>
            {exercise.prep_s > 0 ? t("startPrep") : t("startRecord")}
          </Button>
        )}
        {phase === "ready" && (
          <Button variant="gold" size="lg" className="w-full" onClick={startRecording}>
            <Mic className="h-4 w-4" />
            {t("startRecord")}
          </Button>
        )}
        {phase === "recording" && (
          <Button variant="default" size="lg" className="w-full" onClick={stopEarly}>
            <Square className="h-4 w-4" />
            {t("stop")}
          </Button>
        )}
        {phase === "review" && (
          <>
            <Button
              variant="gold"
              size="lg"
              className="w-full"
              onClick={submit}
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t("getFeedback")}
            </Button>
            <Button variant="outline" size="lg" className="w-full" onClick={retake}>
              <RotateCcw className="h-4 w-4" />
              {t("retake")}
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
