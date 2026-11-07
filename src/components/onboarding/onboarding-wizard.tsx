"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { OptionCard } from "@/components/onboarding/option-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "@/i18n/navigation";
import type {
  Fear,
  MediaPreference,
  OnboardingAnswers,
  SpeakingContext,
  UserGoal,
  UserLevel,
} from "@/lib/types/database";
import type { GeneratedPlan } from "@/lib/plan/generate-plan";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 10;

type StepId =
  | "name"
  | "goal"
  | "level"
  | "language"
  | "primaryFear"
  | "fears"
  | "minutes"
  | "context"
  | "media"
  | "review";

const STEPS: StepId[] = [
  "name",
  "goal",
  "level",
  "language",
  "primaryFear",
  "fears",
  "minutes",
  "context",
  "media",
  "review",
];

interface Draft
  extends Partial<
    Omit<OnboardingAnswers, "fears" | "minutes_per_day">
  > {
  fears: Fear[];
  minutes_per_day?: 5 | 10 | 20;
}

const INITIAL: Draft = {
  fears: [],
};

export function OnboardingWizard() {
  const t = useTranslations("Onboarding");
  const locale = useLocale() as "fr" | "en";
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>({
    ...INITIAL,
    language: locale,
  });
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [pending, startTransition] = useTransition();

  const step = STEPS[stepIndex]!;
  const progress = ((stepIndex + 1) / TOTAL_STEPS) * 100;

  const canContinue = useMemo(() => {
    switch (step) {
      case "name":
        return Boolean(draft.name?.trim());
      case "goal":
        return Boolean(draft.goal);
      case "level":
        return Boolean(draft.level);
      case "language":
        return Boolean(draft.language);
      case "primaryFear":
        return Boolean(draft.primaryFear);
      case "fears":
        return true; // optional multi-select
      case "minutes":
        return Boolean(draft.minutes_per_day);
      case "context":
        return Boolean(draft.speaking_context);
      case "media":
        return Boolean(draft.media_preference);
      case "review":
        return true;
      default:
        return false;
    }
  }, [draft, step]);

  function goBack() {
    setError(null);
    if (stepIndex === 0) {
      router.push("/");
      return;
    }
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function goNext() {
    setError(null);
    if (step === "review") {
      submit();
      return;
    }
    if (!canContinue) return;
    setStepIndex((i) => Math.min(TOTAL_STEPS - 1, i + 1));
  }

  function submit() {
    if (
      !draft.name ||
      !draft.goal ||
      !draft.level ||
      !draft.language ||
      !draft.primaryFear ||
      !draft.minutes_per_day ||
      !draft.speaking_context ||
      !draft.media_preference
    ) {
      setError(t("errorIncomplete"));
      return;
    }

    const payload: OnboardingAnswers = {
      name: draft.name.trim(),
      goal: draft.goal,
      level: draft.level,
      language: draft.language,
      primaryFear: draft.primaryFear,
      fears: draft.fears.filter((f) => f !== draft.primaryFear),
      minutes_per_day: draft.minutes_per_day,
      speaking_context: draft.speaking_context,
      media_preference: draft.media_preference,
    };

    startTransition(async () => {
      try {
        const res = await fetch("/api/onboarding/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok && !data.plan) {
          setError(data.message || t("errorGeneric"));
          return;
        }
        setPlan(data.plan as GeneratedPlan);
      } catch {
        setError(t("errorGeneric"));
      }
    });
  }

  function toggleFear(fear: Fear) {
    setDraft((d) => {
      const has = d.fears.includes(fear);
      return {
        ...d,
        fears: has ? d.fears.filter((f) => f !== fear) : [...d.fears, fear],
      };
    });
  }

  // ── Result screen after plan generation ──────────────────────────────────
  if (plan) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-10 pt-6">
        <Logo />
        <div className="mt-10 animate-fade-up">
          <div className="h-px w-14 origin-left bg-gold animate-gold-line" />
          <h1 className="mt-5 font-display text-3xl font-semibold text-navy">
            {t("planReadyTitle")}
          </h1>
          <p className="mt-3 text-navy/65">{plan.summary}</p>
          <p className="mt-2 text-xs uppercase tracking-wide text-navy/40">
            {t("planSource", { source: plan.source })}
          </p>
        </div>

        <ul className="mt-8 space-y-3">
          {plan.days.slice(0, 5).map((day) => (
            <li
              key={day.day}
              className="rounded-xl border border-navy/10 bg-white px-4 py-3"
            >
              <p className="font-medium text-navy">{day.title}</p>
              <p className="text-sm text-navy/55">{day.focus}</p>
            </li>
          ))}
          <li className="text-center text-sm text-navy/45">
            {t("planMoreDays", { count: Math.max(0, plan.days.length - 5) })}
          </li>
        </ul>

        <Button
          className="mt-auto w-full"
          variant="gold"
          size="lg"
          onClick={() => router.push("/dashboard")}
        >
          {t("goDashboard")}
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-8 pt-4">
      {/* Top bar */}
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          className="flex h-10 w-10 items-center justify-center rounded-full text-navy/70 hover:bg-navy/5"
          aria-label={t("back")}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <Progress value={progress} className="h-1.5" />
          <p className="mt-1.5 text-xs text-navy/45">
            {t("stepOf", { current: stepIndex + 1, total: TOTAL_STEPS })}
          </p>
        </div>
      </header>

      <section className="mt-8 flex flex-1 flex-col">
        <h1 className="font-display text-2xl font-semibold leading-snug text-navy text-balance animate-fade-up sm:text-3xl">
          {t(`steps.${step}.title`)}
        </h1>
        <p className="mt-2 text-sm text-navy/60 animate-fade-up [animation-delay:60ms]">
          {t(`steps.${step}.subtitle`)}
        </p>

        <div className="mt-8 space-y-3 animate-fade-up [animation-delay:120ms]">
          {step === "name" && (
            <Input
              autoFocus
              value={draft.name ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder={t("steps.name.placeholder")}
              maxLength={80}
            />
          )}

          {step === "goal" &&
            (["meetings", "presentations", "investor_pitch", "media"] as UserGoal[]).map(
              (value, i) => (
                <OptionCard
                  key={value}
                  glyph={String(i + 1)}
                  label={t(`options.goal.${value}.label`)}
                  description={t(`options.goal.${value}.description`)}
                  selected={draft.goal === value}
                  onSelect={() => setDraft((d) => ({ ...d, goal: value }))}
                />
              )
            )}

          {step === "level" &&
            (["beginner", "intermediate", "advanced"] as UserLevel[]).map(
              (value, i) => (
                <OptionCard
                  key={value}
                  glyph={String(i + 1)}
                  label={t(`options.level.${value}.label`)}
                  description={t(`options.level.${value}.description`)}
                  selected={draft.level === value}
                  onSelect={() => setDraft((d) => ({ ...d, level: value }))}
                />
              )
            )}

          {step === "language" &&
            (["fr", "en"] as const).map((value) => (
              <OptionCard
                key={value}
                glyph={value.toUpperCase()}
                label={t(`options.language.${value}.label`)}
                description={t(`options.language.${value}.description`)}
                selected={draft.language === value}
                onSelect={() => setDraft((d) => ({ ...d, language: value }))}
              />
            ))}

          {step === "primaryFear" &&
            (
              [
                "stuttering",
                "losing_thread",
                "filler_words",
                "lack_of_authority",
              ] as Fear[]
            ).map((value, i) => (
              <OptionCard
                key={value}
                glyph={String(i + 1)}
                label={t(`options.fear.${value}.label`)}
                description={t(`options.fear.${value}.description`)}
                selected={draft.primaryFear === value}
                onSelect={() => setDraft((d) => ({ ...d, primaryFear: value }))}
              />
            ))}

          {step === "fears" &&
            (
              [
                "stuttering",
                "losing_thread",
                "filler_words",
                "lack_of_authority",
              ] as Fear[]
            )
              .filter((f) => f !== draft.primaryFear)
              .map((value) => (
                <OptionCard
                  key={value}
                  label={t(`options.fear.${value}.label`)}
                  description={t(`options.fear.${value}.description`)}
                  selected={draft.fears.includes(value)}
                  onSelect={() => toggleFear(value)}
                />
              ))}

          {step === "minutes" &&
            ([5, 10, 20] as const).map((value) => (
              <OptionCard
                key={value}
                glyph={`${value}`}
                label={t(`options.minutes.${value}.label`)}
                description={t(`options.minutes.${value}.description`)}
                selected={draft.minutes_per_day === value}
                onSelect={() =>
                  setDraft((d) => ({ ...d, minutes_per_day: value }))
                }
              />
            ))}

          {step === "context" &&
            (["board", "team", "clients", "stage"] as SpeakingContext[]).map(
              (value, i) => (
                <OptionCard
                  key={value}
                  glyph={String(i + 1)}
                  label={t(`options.context.${value}.label`)}
                  description={t(`options.context.${value}.description`)}
                  selected={draft.speaking_context === value}
                  onSelect={() =>
                    setDraft((d) => ({ ...d, speaking_context: value }))
                  }
                />
              )
            )}

          {step === "media" &&
            (["audio", "video", "both"] as MediaPreference[]).map(
              (value, i) => (
                <OptionCard
                  key={value}
                  glyph={String(i + 1)}
                  label={t(`options.media.${value}.label`)}
                  description={t(`options.media.${value}.description`)}
                  selected={draft.media_preference === value}
                  onSelect={() =>
                    setDraft((d) => ({ ...d, media_preference: value }))
                  }
                />
              )
            )}

          {step === "review" && (
            <div className="space-y-3 rounded-xl border border-navy/10 bg-white p-4">
              {(
                [
                  ["name", draft.name],
                  ["goal", draft.goal ? t(`options.goal.${draft.goal}.label`) : "—"],
                  ["level", draft.level ? t(`options.level.${draft.level}.label`) : "—"],
                  [
                    "language",
                    draft.language
                      ? t(`options.language.${draft.language}.label`)
                      : "—",
                  ],
                  [
                    "primaryFear",
                    draft.primaryFear
                      ? t(`options.fear.${draft.primaryFear}.label`)
                      : "—",
                  ],
                  [
                    "minutes",
                    draft.minutes_per_day
                      ? t(`options.minutes.${draft.minutes_per_day}.label`)
                      : "—",
                  ],
                  [
                    "context",
                    draft.speaking_context
                      ? t(`options.context.${draft.speaking_context}.label`)
                      : "—",
                  ],
                  [
                    "media",
                    draft.media_preference
                      ? t(`options.media.${draft.media_preference}.label`)
                      : "—",
                  ],
                ] as const
              ).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-baseline justify-between gap-3 border-b border-navy/5 pb-2 last:border-0 last:pb-0"
                >
                  <span className="text-xs uppercase tracking-wide text-navy/40">
                    {t(`review.${key}`)}
                  </span>
                  <span className="text-right text-sm font-medium text-navy">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-auto pt-8">
          <Button
            type="button"
            variant="gold"
            size="lg"
            className={cn("w-full", !canContinue && step !== "review" && "opacity-50")}
            disabled={!canContinue || pending}
            onClick={goNext}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("generating")}
              </>
            ) : step === "review" ? (
              t("generatePlan")
            ) : (
              t("continue")
            )}
          </Button>
          {step === "fears" ? (
            <p className="mt-2 text-center text-xs text-navy/40">{t("optionalHint")}</p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
