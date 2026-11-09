"use client";

import { cn } from "@/lib/utils";
import type { MilestoneProgress } from "@/lib/progress/milestones";
import { SESSION_MILESTONES, MILESTONE_TARGET } from "@/lib/progress/milestones";

export interface MilestoneTrackLabels {
  title: string;
  subtitle: string;
  nextLabel: string;
  doneLabel: string;
  milestoneNames: Record<string, string>;
}

interface MilestoneTrackProps {
  progress: MilestoneProgress;
  labels: MilestoneTrackLabels;
  className?: string;
}

export function MilestoneTrack({
  progress,
  labels,
  className,
}: MilestoneTrackProps) {
  const nextName = progress.next
    ? labels.milestoneNames[progress.next.key] ?? progress.next.key
    : null;

  return (
    <section className={cn("animate-fade-up", className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-navy">
            {labels.title}
          </h2>
          <p className="mt-0.5 text-sm text-navy/55">{labels.subtitle}</p>
        </div>
        <p className="shrink-0 font-display text-xl font-semibold tabular-nums text-navy">
          {progress.completed}
          <span className="text-sm font-sans font-normal text-navy/40">
            /{progress.target}
          </span>
        </p>
      </div>

      <div className="relative mt-5 px-1">
        <div className="h-2 overflow-hidden rounded-full bg-navy/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-navy via-navy to-gold transition-[width] duration-700 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>

        <div className="pointer-events-none absolute inset-x-1 top-0 h-2">
          {SESSION_MILESTONES.map((m) => {
            const left = (m.at / MILESTONE_TARGET) * 100;
            const reached = progress.completed >= m.at;
            return (
              <span
                key={m.id}
                className={cn(
                  "absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-colors",
                  reached
                    ? "border-gold bg-gold shadow-[0_0_0_3px_rgba(197,160,89,0.2)]"
                    : "border-navy/25 bg-cream"
                )}
                style={{ left: `${left}%` }}
                aria-hidden
              />
            );
          })}
        </div>

        <ul className="mt-4 grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-6">
          {SESSION_MILESTONES.map((m) => {
            const reached = progress.completed >= m.at;
            return (
              <li key={m.id} className="text-center">
                <p
                  className={cn(
                    "font-display text-sm font-semibold tabular-nums",
                    reached ? "text-navy" : "text-navy/35"
                  )}
                >
                  {m.at}
                </p>
                <p
                  className={cn(
                    "mt-0.5 text-[10px] leading-tight",
                    reached ? "text-navy/70" : "text-navy/35"
                  )}
                >
                  {labels.milestoneNames[m.key] ?? m.key}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="mt-4 text-sm text-navy/60">
        {progress.next && nextName && progress.remainingToNext != null
          ? labels.nextLabel
              .replace("{name}", nextName)
              .replace("{n}", String(progress.remainingToNext))
          : labels.doneLabel}
      </p>
    </section>
  );
}
