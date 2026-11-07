"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Simple second-precision countdown. Calls onComplete once when it hits 0.
 */
export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const onCompleteRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      onCompleteRef.current?.();
      return;
    }
    const id = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [running, seconds]);

  const start = useCallback(
    (from?: number, onComplete?: () => void) => {
      onCompleteRef.current = onComplete ?? null;
      setSeconds(from ?? initialSeconds);
      setRunning(true);
    },
    [initialSeconds]
  );

  const pause = useCallback(() => setRunning(false), []);

  const reset = useCallback(
    (to?: number) => {
      setRunning(false);
      setSeconds(to ?? initialSeconds);
    },
    [initialSeconds]
  );

  return { seconds, running, start, pause, reset };
}

export function formatMmSs(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
