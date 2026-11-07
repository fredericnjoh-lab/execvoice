import type { ReactNode } from "react";
import { Flame, Target, Trophy } from "lucide-react";
import { AxisBars } from "@/components/dashboard/axis-bars";
import { Logo } from "@/components/brand/logo";
import { BottomNav } from "@/components/layout/bottom-nav";
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
  };
}

export function DashboardView({ data, labels }: DashboardViewProps) {
  const name = data.profile?.name?.trim() || labels.guest;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-28 pt-5">
      <header className="flex items-center justify-between">
        <Logo />
        {!data.authenticated ? (
          <span className="rounded-full bg-navy/5 px-2.5 py-1 text-[10px] uppercase tracking-wide text-navy/50">
            {labels.demoBadge}
          </span>
        ) : null}
      </header>

      <section className="mt-8 animate-fade-up">
        <p className="text-sm text-navy/55">{labels.greeting}</p>
        <h1 className="font-display text-3xl font-semibold text-navy">{name}</h1>
        <p className="mt-1 text-sm text-navy/45">
          {labels.dayOf.replace("{day}", String(data.dayNumber))}
        </p>
      </section>

      {/* Stats row */}
      <section className="mt-6 grid grid-cols-3 gap-3 animate-fade-up [animation-delay:60ms]">
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

      {/* Today's exercise */}
      <Card className="mt-6 animate-fade-up [animation-delay:120ms] border-gold/25">
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

      {/* Axis averages */}
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

      {/* Recent */}
      <section className="mt-6 animate-fade-up [animation-delay:220ms]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-navy">
            {labels.recentTitle}
          </h2>
          <Link
            href="/progress"
            className="text-xs font-medium text-navy/50 underline-offset-4 hover:underline"
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
                  className="flex items-center justify-between rounded-xl border border-navy/10 bg-white px-4 py-3 transition-colors hover:border-gold/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-navy">
                      {s.exercise_title || "Session"}
                    </p>
                    <p className="text-xs text-navy/45">
                      {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-display text-xl font-semibold text-navy">
                    {s.scores?.overall ?? "—"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <BottomNav />
    </main>
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
    <div className="rounded-xl border border-navy/10 bg-white px-3 py-3 text-center">
      <div className="mb-1 flex justify-center">{icon}</div>
      <p className="font-display text-xl font-semibold tabular-nums text-navy">
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-navy/45">{label}</p>
    </div>
  );
}
