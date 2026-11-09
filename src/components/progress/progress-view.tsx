"use client";

import { useMemo, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { AppShell } from "@/components/layout/app-shell";
import { AuthChrome } from "@/components/layout/auth-chrome";
import { MilestoneTrack } from "@/components/progress/milestone-track";
import { Sparkline } from "@/components/progress/sparkline";
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
import { cn } from "@/lib/utils";

type AxisKey = keyof SessionScores;

interface ProgressViewProps {
  data: DashboardData;
  labels: {
    title: string;
    subtitle: string;
    overallTrend: string;
    axesTitle: string;
    historyTitle: string;
    empty: string;
    sessions: string;
    axes: Record<keyof Omit<SessionScores, "overall">, string> & {
      overall: string;
    };
    demoBadge: string;
    milestonesTitle: string;
    milestonesSubtitle: string;
    milestonesNext: string;
    milestonesDone: string;
    milestoneNames: Record<string, string>;
  };
}

const AXIS_KEYS: AxisKey[] = [
  "overall",
  "clarity",
  "structure",
  "concision",
  "vocabulary",
  "confidence",
  "impact",
];

export function ProgressView({ data, labels }: ProgressViewProps) {
  const [active, setActive] = useState<AxisKey>("overall");

  const series = useMemo(
    () => data.axisHistory.map((p) => p.scores[active]),
    [data.axisHistory, active]
  );

  const delta = useMemo(() => {
    if (series.length < 2) return null;
    return series[series.length - 1]! - series[0]!;
  }, [series]);

  return (
    <AppShell withNav>
      <header className="flex items-start justify-between gap-3">
        <Link href="/">
          <Logo />
        </Link>
        <AuthChrome authenticated={data.authenticated} />
      </header>

      <section className="mt-7 animate-fade-up sm:mt-8">
        <h1 className="font-display text-[1.85rem] font-semibold leading-tight text-navy sm:text-3xl">
          {labels.title}
        </h1>
        <p className="mt-2 text-sm text-navy/60">{labels.subtitle}</p>
        <p className="mt-1 text-xs text-navy/40">
          {labels.sessions.replace("{n}", String(data.sessionsCompleted))}
        </p>
      </section>

      <MilestoneTrack
        className="mt-5 sm:mt-6 [animation-delay:40ms]"
        progress={data.milestones}
        labels={{
          title: labels.milestonesTitle,
          subtitle: labels.milestonesSubtitle,
          nextLabel: labels.milestonesNext,
          doneLabel: labels.milestonesDone,
          milestoneNames: labels.milestoneNames,
        }}
      />

      {data.axisHistory.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-8 text-center text-sm text-navy/55">
            {labels.empty}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mt-5 animate-fade-up [animation-delay:60ms] sm:mt-6">
            <CardHeader className="pb-2">
              <CardDescription>{labels.overallTrend}</CardDescription>
              <CardTitle className="flex items-baseline gap-2 font-display text-2xl">
                {labels.axes[active as keyof typeof labels.axes] ?? active}
                {delta != null ? (
                  <span
                    className={cn(
                      "text-sm font-sans font-medium",
                      delta >= 0 ? "text-emerald-700" : "text-amber-700"
                    )}
                  >
                    {delta >= 0 ? "+" : ""}
                    {delta}
                  </span>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Sparkline values={series} />
              <div className="mt-2 flex justify-between text-[10px] text-navy/40">
                <span>{data.axisHistory[0]?.label}</span>
                <span>{data.axisHistory[data.axisHistory.length - 1]?.label}</span>
              </div>
            </CardContent>
          </Card>

          <section className="mt-4 animate-fade-up [animation-delay:100ms]">
            <h2 className="mb-3 font-display text-lg font-semibold text-navy">
              {labels.axesTitle}
            </h2>
            <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 no-scrollbar snap-x snap-mandatory sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
              {AXIS_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActive(key)}
                  className={cn(
                    "snap-start shrink-0 rounded-full border px-3.5 py-2 text-xs transition-colors touch-manipulation min-h-[40px]",
                    active === key
                      ? "border-navy bg-navy text-white"
                      : "border-navy/15 bg-white text-navy/70 hover:border-gold/50"
                  )}
                >
                  {labels.axes[key as keyof typeof labels.axes] ?? key}
                </button>
              ))}
            </div>
          </section>

          <section className="mt-6 animate-fade-up [animation-delay:140ms]">
            <h2 className="mb-3 font-display text-lg font-semibold text-navy">
              {labels.historyTitle}
            </h2>
            <ul className="space-y-2">
              {[...data.recentSessions].map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/session/${s.id}`}
                    className="flex min-h-[56px] items-center justify-between gap-3 rounded-xl border border-navy/10 bg-white px-4 py-3 active:bg-navy/[0.03] hover:border-gold/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy">
                        {s.exercise_title || "Session"}
                      </p>
                      <p className="text-xs text-navy/45">
                        {new Date(s.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-xl font-semibold text-navy">
                        {s.scores?.overall ?? "—"}
                      </p>
                      <p className="text-[10px] text-navy/40">
                        {s.scores?.[active] != null && active !== "overall"
                          ? `${labels.axes[active as keyof typeof labels.axes]} ${s.scores[active]}`
                          : null}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </AppShell>
  );
}
