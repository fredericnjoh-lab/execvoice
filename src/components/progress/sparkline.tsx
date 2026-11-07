"use client";

import { cn } from "@/lib/utils";

interface SparklineProps {
  values: number[];
  className?: string;
  stroke?: string;
  /** Show filled area under the line */
  fill?: boolean;
}

/** Lightweight SVG sparkline — no chart library. */
export function Sparkline({
  values,
  className,
  stroke = "#c9a227",
  fill = true,
}: SparklineProps) {
  if (values.length === 0) {
    return (
      <div className={cn("flex h-16 items-center text-xs text-navy/40", className)}>
        —
      </div>
    );
  }

  const w = 240;
  const h = 64;
  const pad = 4;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 100);
  const range = Math.max(1, max - min);

  const points = values.map((v, i) => {
    const x =
      values.length === 1
        ? w / 2
        : pad + (i / (values.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return { x, y };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `M ${points[0]!.x},${h} L ${line.replace(/ /g, " L ")} L ${points[points.length - 1]!.x},${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-16 w-full overflow-visible", className)}
      preserveAspectRatio="none"
      role="img"
      aria-hidden
    >
      {fill ? (
        <path d={area} fill={stroke} opacity="0.12" />
      ) : null}
      <polyline
        points={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {points.length > 0 ? (
        <circle
          cx={points[points.length - 1]!.x}
          cy={points[points.length - 1]!.y}
          r="3.5"
          fill="#0b1f3a"
          stroke={stroke}
          strokeWidth="2"
        />
      ) : null}
    </svg>
  );
}
