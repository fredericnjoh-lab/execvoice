"use client";

import { formatMmSs } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";

interface TimerRingProps {
  seconds: number;
  total: number;
  label: string;
  variant?: "prep" | "record";
}

export function TimerRing({
  seconds,
  total,
  label,
  variant = "record",
}: TimerRingProps) {
  const pct = total > 0 ? Math.min(1, Math.max(0, seconds / total)) : 0;
  const r = 54;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);

  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-navy/10"
          strokeWidth="6"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="currentColor"
          className={cn(
            "transition-[stroke-dashoffset] duration-1000 linear",
            variant === "prep" ? "text-navy-muted" : "text-gold"
          )}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="relative text-center">
        <p className="font-display text-3xl font-semibold tabular-nums text-navy">
          {formatMmSs(seconds)}
        </p>
        <p className="text-xs uppercase tracking-wide text-navy/45">{label}</p>
      </div>
    </div>
  );
}
