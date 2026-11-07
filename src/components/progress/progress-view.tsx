"use client";

import { useMemo, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { BottomNav } from "@/components/layout/bottom-nav";
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
        <h1 className="font-display text-3xl font-semibold text-navy">
          {labels.title}
        </h1>
        <p className="mt-2 text-sm text-navy/60">{labels.subtitle}</p>
        <p className="mt-1 text-xs text-navy/40">
          {labels.sessions.replace("{n}", String(data.sessionsCompleted))}
        </p>
      </section>

      {data.axisHistory.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="py-8 text-center text-sm text-navy/55">
            {labels.empty}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mt-6 animate-fade-up [animation-delay:60ms]">
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
            <div className="flex flex-wrap gap-2">
              {AXIS_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActive(key)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-colors",
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
                    className="flex items-center justify-between rounded-xl border border-navy/10 bg-white px-4 py-3 hover:border-gold/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy">
                        {s.exercise_title || "Session"}
                      </p>
                      <p className="text-xs text-navy/45">
                        {new Date(s.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
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

      <BottomNav />
    </main>
  );
}
