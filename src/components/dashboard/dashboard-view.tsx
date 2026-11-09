import type { ReactNode } from "react";
import { Flame, Target, Trophy } from "lucide-react";
import { AxisBars } from "@/components/dashboard/axis-bars";
import { Logo } from "@/components/brand/logo";
import { AppShell } from "@/components/layout/app-shell";
import { AuthChrome } from "@/components/layout/auth-chrome";
import { MilestoneTrack } from "@/components/progress/milestone-track";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import type { DashboardData } from "@/lib/dashboard/get-dashboard-data";
import type { SessionScores } from "@/lib/types/database";

interface DashboardViewProps {
  data: DashboardData;
  labels: {
    greeting: string;
    guest: string;
    dayOf: string;
    todayTitle: string;
    startExercise: string;
    noExercise: string;
    streak: string;
    best: string;
    overall: string;
    noScore: string;
    axesTitle: string;
    axes: Record<keyof Omit<SessionScores, "overall">, string>;
    recentTitle: string;
    noSessions: string;
    viewProgress: string;
    minutes: string;
    demoBadge: string;
    guestBannerTitle: string;
    guestBannerBody: string;
    guestBannerCta: string;
    guestLoginCta: string;
    personalizePlan: string;
    milestonesTitle: string;
    milestonesSubtitle: string;
    milestonesNext: string;
    milestonesDone: string;
    milestoneNames: Record<string, string>;
  };
}

export function DashboardView({ data, labels }: DashboardViewProps) {
  const name = data.profile?.name?.trim() || labels.guest;
  const needsOnboarding =
    data.authenticated && data.profile && !data.profile.onboarding_completed;

  return (
    <AppShell withNav>
      <header className="flex items-start justify-between gap-3">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>
        <AuthChrome authenticated={data.authenticated} />
      </header>

      {!data.authenticated ? (
        <Card className="mt-5 border-gold/30 bg-gold/5 animate-fade-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-navy">
              {labels.guestBannerTitle}
            </CardTitle>
            <CardDescription>{labels.guestBannerBody}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="gold" className="w-full sm:w-auto">
              <Link href="/signup">{labels.guestBannerCta}</Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/login">{labels.guestLoginCta}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {needsOnboarding ? (
        <div className="mt-4">
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/onboarding">{labels.personalizePlan}</Link>
          </Button>
        </div>
      ) : null}

      <section className="mt-7 animate-fade-up sm:mt-8">
        <div className="flex items-center gap-2">
          <p className="text-sm text-navy/55">{labels.greeting}</p>
          {!data.authenticated ? (
            <span className="rounded-full bg-navy/5 px-2.5 py-1 text-[10px] uppercase tracking-wide text-navy/50">
              {labels.demoBadge}
            </span>
          ) : null}
        </div>
        <h1 className="font-display text-[1.85rem] font-semibold leading-tight text-navy sm:text-3xl">
          {name}
        </h1>
        <p className="mt-1 text-sm text-navy/45">
          {labels.dayOf.replace("{day}", String(data.dayNumber))}
        </p>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-2.5 animate-fade-up [animation-delay:60ms] sm:mt-6 sm:gap-3">
        <Stat
          icon={<Flame className="h-4 w-4 text-gold" />}
          label={labels.streak}
          value={String(data.streak.current)}
        />
        <Stat
          icon={<Trophy className="h-4 w-4 text-gold" />}
          label={labels.best}
          value={String(data.streak.best)}
        />
        <Stat
          icon={<Target className="h-4 w-4 text-gold" />}
          label={labels.overall}
          value={
            data.overallScore != null ? String(data.overallScore) : labels.noScore
          }
        />
      </section>

      <MilestoneTrack
        className="mt-5 sm:mt-6 [animation-delay:90ms]"
        progress={data.milestones}
        labels={{
          title: labels.milestonesTitle,
          subtitle: labels.milestonesSubtitle,
          nextLabel: labels.milestonesNext,
          doneLabel: labels.milestonesDone,
          milestoneNames: labels.milestoneNames,
        }}
      />

      <Card className="mt-5 animate-fade-up [animation-delay:120ms] border-gold/25 sm:mt-6">
        <CardHeader className="pb-2">
          <CardDescription>{labels.todayTitle}</CardDescription>
          <CardTitle className="font-display text-xl leading-snug">
            {data.planDay?.title || data.todayExercise?.title || labels.noExercise}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.planDay?.focus ? (
            <p className="text-sm text-navy/60">{data.planDay.focus}</p>
          ) : null}
          {data.planDay?.minutes ? (
            <p className="text-xs uppercase tracking-wide text-navy/40">
              {labels.minutes.replace("{n}", String(data.planDay.minutes))}
            </p>
          ) : null}
          {data.todayExercise ? (
            <Button asChild variant="gold" size="lg" className="w-full">
              <Link href={`/exercise/${data.todayExercise.id}`}>
                {labels.startExercise}
              </Link>
            </Button>
          ) : (
            <Button asChild variant="gold" size="lg" className="w-full">
              <Link href="/exercise/demo">{labels.startExercise}</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {data.axisAverages ? (
        <Card className="mt-4 animate-fade-up [animation-delay:180ms]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{labels.axesTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <AxisBars scores={data.axisAverages} labels={labels.axes} />
          </CardContent>
        </Card>
      ) : null}

      <section className="mt-6 animate-fade-up [animation-delay:220ms]">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-navy">
            {labels.recentTitle}
          </h2>
          <Link
            href="/progress"
            className="min-h-[44px] inline-flex items-center text-xs font-medium text-navy/50 underline-offset-4 hover:underline"
          >
            {labels.viewProgress}
          </Link>
        </div>
        {data.recentSessions.length === 0 ? (
          <p className="text-sm text-navy/50">{labels.noSessions}</p>
        ) : (
          <ul className="space-y-2">
            {data.recentSessions.slice(0, 5).map((s) => (
              <li key={s.id}>
                <Link
                  href={`/session/${s.id}`}
                  className="flex min-h-[56px] items-center justify-between gap-3 rounded-xl border border-navy/10 bg-white px-4 py-3 transition-colors active:bg-navy/[0.03] hover:border-gold/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy">
                      {s.exercise_title || "Session"}
                    </p>
                    <p className="text-xs text-navy/45">
                      {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="shrink-0 font-display text-xl font-semibold text-navy">
                    {s.scores?.overall ?? "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-navy/10 bg-white px-2 py-3 text-center sm:px-3">
      <div className="mb-1 flex justify-center">{icon}</div>
      <p className="font-display text-lg font-semibold tabular-nums text-navy sm:text-xl">
        {value}
      </p>
      <p className="truncate px-0.5 text-[10px] uppercase tracking-wide text-navy/45">
        {label}
      </p>
    </div>
  );
}
