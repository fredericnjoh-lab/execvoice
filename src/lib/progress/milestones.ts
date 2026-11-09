export interface Milestone {
  id: string;
  at: number;
  /** i18n key under Progress.milestones.* / Dashboard.milestones.* */
  key: string;
}

/** Session-count milestones on the 30-day executive track. */
export const SESSION_MILESTONES: Milestone[] = [
  { id: "first", at: 1, key: "first" },
  { id: "warmup", at: 3, key: "warmup" },
  { id: "week1", at: 7, key: "week1" },
  { id: "halfway", at: 14, key: "halfway" },
  { id: "rhythm", at: 21, key: "rhythm" },
  { id: "complete", at: 30, key: "complete" },
];

export const MILESTONE_TARGET = 30;

export interface MilestoneProgress {
  completed: number;
  target: number;
  percent: number;
  reached: Milestone[];
  next: Milestone | null;
  remainingToNext: number | null;
}

export function computeMilestoneProgress(
  sessionsCompleted: number
): MilestoneProgress {
  const completed = Math.max(0, sessionsCompleted);
  const percent = Math.min(100, Math.round((completed / MILESTONE_TARGET) * 100));
  const reached = SESSION_MILESTONES.filter((m) => completed >= m.at);
  const next =
    SESSION_MILESTONES.find((m) => completed < m.at) ?? null;
  return {
    completed,
    target: MILESTONE_TARGET,
    percent,
    reached,
    next,
    remainingToNext: next ? next.at - completed : null,
  };
}
