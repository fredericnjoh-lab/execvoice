"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Mic, Square, Video, RotateCcw, Send } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { PostureHud } from "@/components/exercise/posture-hud";
import { TimerRing } from "@/components/exercise/timer-ring";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { useCountdown } from "@/hooks/use-countdown";
import { useMediaRecorder, type MediaKind } from "@/hooks/use-media-recorder";
import { usePostureAnalyzer } from "@/hooks/use-posture-analyzer";
import { Link, useRouter } from "@/i18n/navigation";
import type { Exercise, PostureFeedback } from "@/lib/types/database";
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
  const locale = useLocale() as "fr" | "en";
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [kind, setKind] = useState<MediaKind>(preferredKind);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const recordedSecondsRef = useRef(0);
  const postureResultRef = useRef<PostureFeedback | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);

  const prep = useCountdown(exercise.prep_s);
  const speak = useCountdown(exercise.duration_s);
  const recorder = useMediaRecorder({ kind });
  const posture = usePostureAnalyzer({ language: locale });
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Attach live preview + kick play() (required on iOS).
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !recorder.stream || kind !== "video") return;
    el.srcObject = recorder.stream;
    el.muted = true;
    el.playsInline = true;
    const play = el.play();
    if (play && typeof play.catch === "function") {
      play.catch(() => {
        /* autoplay race — user gesture already happened upstream */
      });
    }
  }, [recorder.stream, kind, phase]);

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

  async function finishRecording(elapsed: number) {
    recordedSecondsRef.current = elapsed;
    if (kind === "video") {
      postureResultRef.current = posture.stop();
    }
    const file = await recorder.stop();
    recordedBlobRef.current = file;
    if (!file) {
      setError(t("errors.emptyRecording"));
    }
    setPhase("review");
  }

  async function begin() {
    setError(null);
    postureResultRef.current = null;
    recordedBlobRef.current = null;
    posture.reset();

    if (!recorder.isSupported) {
      setError(t("errors.unsupported"));
      return;
    }

    const ok = await recorder.ensurePermission();
    if (!ok) {
      setError(
        recorder.error === "recorder_unsupported"
          ? t("errors.unsupported")
          : t("errors.permission")
      );
      return;
    }
    if (kind === "video") {
      void posture.ensureLoaded().catch(() => {
        /* non-blocking — analysis becomes optional */
      });
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
    recordedBlobRef.current = null;
    const started = await recorder.start();
    if (!started) {
      setError(t("errors.recorder"));
      return;
    }
    setPhase("recording");

    // Wait a tick so the live <video> is mounted with the stream.
    requestAnimationFrame(() => {
      if (kind === "video" && videoRef.current) {
        void posture.start(videoRef.current);
      }
    });

    speak.start(exercise.duration_s, () => {
      void finishRecording(exercise.duration_s);
    });
  }

  function stopEarly() {
    const elapsed = Math.max(3, exercise.duration_s - speak.seconds);
    speak.pause();
    void finishRecording(elapsed);
  }

  function retake() {
    posture.reset();
    postureResultRef.current = null;
    recordedBlobRef.current = null;
    recorder.reset();
    prep.reset(exercise.prep_s);
    speak.reset(exercise.duration_s);
    setPhase("intro");
    setError(null);
  }

  function chooseKind(next: MediaKind) {
    if (next === kind) return;
    setKind(next);
    setError(null);
  }

  function submit() {
    setPhase("uploading");
    setError(null);

    const posturePayload = postureResultRef.current || posture.result;
    const file = recordedBlobRef.current || recorder.blob;

    startTransition(async () => {
      try {
        // If stop() raced, wait briefly for blob.
        let upload = file;
        if (!upload) {
          await new Promise((r) => setTimeout(r, 400));
          upload = recordedBlobRef.current || recorder.blob;
        }

        const form = new FormData();
        form.set("exercise_id", exercise.id);
        form.set(
          "duration_s",
          String(recordedSecondsRef.current || exercise.duration_s)
        );
        form.set("media_kind", kind);
        if (upload && upload.size > 0) {
          const ext = recorder.extension || (kind === "video" ? "webm" : "webm");
          form.set("file", upload, `take.${ext}`);
        }
        if (kind === "video" && posturePayload) {
          form.set("posture", JSON.stringify(posturePayload));
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

  const showVideoShell =
    kind === "video" || (phase === "review" && Boolean(recorder.previewUrl));

  const livePreview =
    kind === "video" &&
    phase !== "review" &&
    phase !== "uploading" &&
    (phase === "intro" ? false : true);

  return (
    <AppShell>
      <header className="flex items-center justify-between gap-3">
        <Logo />
        <Link
          href="/dashboard"
          className="inline-flex min-h-[44px] items-center text-sm text-navy/55 hover:text-navy"
        >
          {t("exit")}
        </Link>
      </header>

      <div className="mt-5 sm:mt-6">
        <p className="text-xs uppercase tracking-wide text-gold">
          {t(`types.${exercise.type}`)}
        </p>
        <h1 className="mt-1 font-display text-[1.55rem] font-semibold leading-snug text-navy sm:text-2xl">
          {exercise.title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-navy/70">
          {exercise.prompt}
        </p>
        {exercise.tips ? (
          <p className="mt-2 text-xs text-navy/45">{exercise.tips}</p>
        ) : null}
        {kind === "video" ? (
          <p className="mt-2 text-xs text-navy/50">{t("postureHint")}</p>
        ) : null}
      </div>

      {phase === "intro" && exercise.type !== "posture" ? (
        <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:flex sm:gap-2">
          <Button
            type="button"
            size="default"
            className="w-full sm:w-auto"
            variant={kind === "audio" ? "default" : "outline"}
            onClick={() => chooseKind("audio")}
          >
            <Mic className="h-4 w-4" />
            {t("audio")}
          </Button>
          <Button
            type="button"
            size="default"
            className="w-full sm:w-auto"
            variant={kind === "video" ? "default" : "outline"}
            onClick={() => chooseKind("video")}
          >
            <Video className="h-4 w-4" />
            {t("video")}
          </Button>
        </div>
      ) : null}

      <section className="mt-6 flex flex-1 flex-col items-center sm:mt-8">
        {showVideoShell && (
          <div className="relative mb-5 w-full overflow-hidden rounded-xl border border-navy/10 bg-navy/95 aspect-[4/3] max-h-[42svh] sm:mb-6 sm:aspect-video sm:max-h-none">
            {phase === "review" && recorder.previewUrl ? (
              kind === "video" ? (
                <video
                  src={recorder.previewUrl}
                  controls
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
                  <audio src={recorder.previewUrl} controls className="w-full" />
                </div>
              )
            ) : kind === "video" && (livePreview || recorder.stream) ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full scale-x-[-1] object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gold/80">
                {kind === "video" ? (
                  <Video className="h-10 w-10 opacity-60" />
                ) : (
                  <Mic
                    className={cn(
                      "h-10 w-10",
                      phase === "recording" && "animate-pulse"
                    )}
                  />
                )}
              </div>
            )}

            {kind === "video" &&
            (phase === "recording" ||
              phase === "prep" ||
              phase === "ready" ||
              posture.status === "loading") ? (
              <PostureHud
                live={posture.live}
                status={posture.status}
                labels={{
                  title: t("posture.title"),
                  loading: t("posture.loading"),
                  alignment: t("posture.alignment"),
                  eye: t("posture.eye"),
                  hands: t("posture.hands"),
                }}
              />
            ) : null}

            {phase === "review" && kind === "video" && postureResultRef.current ? (
              <div className="absolute inset-x-0 bottom-0 bg-navy/80 px-3 py-2 text-xs text-white/85">
                {postureResultRef.current.notes}
              </div>
            ) : null}
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
        {recorder.error && !error ? (
          <p className="mt-4 text-center text-sm text-red-700" role="alert">
            {t("errors.recorder")}
          </p>
        ) : null}
      </section>

      <div className="sticky-actions flex flex-col gap-3">
        {phase === "intro" && (
          <Button variant="gold" size="lg" className="w-full" onClick={begin}>
            {exercise.prep_s > 0 ? t("startPrep") : t("startRecord")}
          </Button>
        )}
        {phase === "ready" && (
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            onClick={startRecording}
          >
            {kind === "video" ? (
              <Video className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            {t("startRecord")}
          </Button>
        )}
        {phase === "recording" && (
          <Button
            variant="default"
            size="lg"
            className="w-full"
            onClick={stopEarly}
          >
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
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={retake}
            >
              <RotateCcw className="h-4 w-4" />
              {t("retake")}
            </Button>
          </>
        )}
      </div>
    </AppShell>
  );
}
