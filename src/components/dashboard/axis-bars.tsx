import { cn } from "@/lib/utils";
import type { SessionScores } from "@/lib/types/database";

const AXES: (keyof Omit<SessionScores, "overall">)[] = [
  "clarity",
  "structure",
  "concision",
  "vocabulary",
  "confidence",
  "impact",
];

interface AxisBarsProps {
  scores: SessionScores;
  labels: Record<(typeof AXES)[number], string>;
}

export function AxisBars({ scores, labels }: AxisBarsProps) {
  return (
    <ul className="space-y-3">
      {AXES.map((axis) => {
        const value = scores[axis];
        return (
          <li key={axis}>
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="text-navy/65">{labels[axis]}</span>
              <span className="font-medium tabular-nums text-navy">{value}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-navy/10">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  value >= 80 ? "bg-gold" : value >= 60 ? "bg-navy" : "bg-navy-muted"
                )}
                style={{ width: `${Math.min(100, value)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
