"use client";

import { cn } from "@/lib/utils";
import type { FrameScores } from "@/lib/posture/score-landmarks";

interface PostureHudProps {
  live: FrameScores | null;
  status: string;
  labels: {
    title: string;
    loading: string;
    alignment: string;
    eye: string;
    hands: string;
  };
}

function Meter({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  const v = value ?? 0;
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wide text-white/70">
        <span>{label}</span>
        <span className="tabular-nums">{value == null ? "—" : v}</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-white/15">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            v >= 80 ? "bg-gold" : v >= 60 ? "bg-white" : "bg-amber-400"
          )}
          style={{ width: `${value == null ? 0 : Math.min(100, v)}%` }}
        />
      </div>
    </div>
  );
}

/** Live posture meters overlaid on the video preview. */
export function PostureHud({ live, status, labels }: PostureHudProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/90 via-navy/55 to-transparent px-3 pb-3 pt-10">
      <p className="mb-2 text-[10px] uppercase tracking-wide text-gold">
        {status === "loading" ? labels.loading : labels.title}
      </p>
      <div className="flex gap-3">
        <Meter label={labels.alignment} value={live?.head_shoulder_alignment ?? null} />
        <Meter label={labels.eye} value={live?.eye_contact ?? null} />
        <Meter label={labels.hands} value={live?.hands_visible ?? null} />
      </div>
    </div>
  );
}
