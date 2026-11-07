"use client";

import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { SessionFeedback, SessionScores } from "@/lib/types/database";
import { cn } from "@/lib/utils";

export interface FeedbackPayload {
  session_id: string;
  transcript: string;
  scores: SessionScores;
  feedback: SessionFeedback;
  analysis_source?: string;
  transcript_source?: string;
  exercise?: { id: string; title: string; type: string };
}

const AXES: (keyof Omit<SessionScores, "overall">)[] = [
  "clarity",
  "structure",
  "concision",
  "vocabulary",
  "confidence",
  "impact",
];

function scoreColor(n: number) {
  if (n >= 80) return "text-emerald-700";
  if (n >= 60) return "text-navy";
  return "text-amber-700";
}

export function FeedbackView({ data }: { data: FeedbackPayload }) {
  const t = useTranslations("Session");
  const { scores, feedback, transcript, exercise } = data;
  const [low, high] = feedback.wpm_target;
  const inBand = feedback.wpm >= low && feedback.wpm <= high;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-5 px-5 pb-10 pt-4">
      <header className="flex items-center justify-between">
        <Logo />
        <Link href="/dashboard" className="text-sm text-navy/55 hover:text-navy">
          {t("backDashboard")}
        </Link>
      </header>

      <section className="animate-fade-up">
        <p className="text-xs uppercase tracking-wide text-gold">
          {exercise?.title ?? t("title")}
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-navy">
          {t("overallScore")}
        </h1>
        <p className={cn("mt-2 font-display text-5xl font-semibold", scoreColor(scores.overall))}>
          {scores.overall}
          <span className="text-lg text-navy/40">/100</span>
        </p>
        {data.analysis_source ? (
          <p className="mt-1 text-xs text-navy/40">
            {t("source", { source: data.analysis_source })}
          </p>
        ) : null}
      </section>

      {/* Axis scores */}
      <Card className="animate-fade-up [animation-delay:60ms]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{t("axesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          {AXES.map((axis) => (
            <div
              key={axis}
              className="rounded-lg border border-navy/8 bg-cream/60 px-3 py-2"
            >
              <p className="text-xs text-navy/50">{t(`axes.${axis}`)}</p>
              <p className={cn("font-display text-2xl font-semibold", scoreColor(scores[axis]))}>
                {scores[axis]}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* WPM */}
      <Card className="animate-fade-up [animation-delay:100ms]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t("wpmTitle")}</CardTitle>
          <CardDescription>
            {t("wpmTarget", { low, high })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className={cn("font-display text-3xl font-semibold", inBand ? "text-emerald-700" : "text-amber-700")}>
            {feedback.wpm}{" "}
            <span className="text-base font-sans font-normal text-navy/50">
              {t("wpmUnit")}
            </span>
          </p>
        </CardContent>
      </Card>

      {/* Fillers */}
      <Card className="animate-fade-up [animation-delay:140ms]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t("fillersTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {feedback.filler_words.length === 0 ? (
            <p className="text-sm text-navy/60">{t("fillersNone")}</p>
          ) : (
            <ul className="space-y-2">
              {feedback.filler_words.map((f) => (
                <li
                  key={f.word}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium text-navy">« {f.word} »</span>
                  <span className="tabular-nums text-navy/55">×{f.count}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Weak words */}
      <Card className="animate-fade-up [animation-delay:180ms]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t("weakTitle")}</CardTitle>
          <CardDescription>{t("weakSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          {feedback.weak_words.length === 0 ? (
            <p className="text-sm text-navy/60">{t("weakNone")}</p>
          ) : (
            <ul className="space-y-3">
              {feedback.weak_words.map((w) => (
                <li key={w.original} className="text-sm">
                  <span className="text-navy/45 line-through">{w.original}</span>
                  <span className="mx-2 text-navy/30">→</span>
                  <span className="font-medium text-navy">{w.suggestion}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* CEO rewrite */}
      <Card className="animate-fade-up [animation-delay:220ms] border-gold/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t("ceoTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-navy">{feedback.ceo_rewrite}</p>
        </CardContent>
      </Card>

      {/* Tip */}
      <Card className="animate-fade-up [animation-delay:260ms] bg-navy text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-gold">{t("tipTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-white/90">{feedback.tip}</p>
        </CardContent>
      </Card>

      {/* Transcript */}
      <Card className="animate-fade-up [animation-delay:300ms]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t("transcriptTitle")}</CardTitle>
          {data.transcript_source === "demo" ? (
            <CardDescription>{t("transcriptDemo")}</CardDescription>
          ) : null}
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-navy/75">
            {transcript}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 pt-2">
        {exercise?.id ? (
          <Button asChild variant="gold" size="lg" className="w-full">
            <Link href={`/exercise/${exercise.id}`}>{t("retry")}</Link>
          </Button>
        ) : null}
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/dashboard">{t("backDashboard")}</Link>
        </Button>
      </div>
    </main>
  );
}
