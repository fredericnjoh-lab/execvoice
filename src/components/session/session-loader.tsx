"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  FeedbackView,
  type FeedbackPayload,
} from "@/components/session/feedback-view";
import { Link } from "@/i18n/navigation";

interface SessionLoaderProps {
  sessionId: string;
  initial: FeedbackPayload | null;
}

export function SessionLoader({ sessionId, initial }: SessionLoaderProps) {
  const t = useTranslations("Session");
  const [data, setData] = useState<FeedbackPayload | null>(initial);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (data) return;
    try {
      const raw =
        sessionStorage.getItem(`execvoice:session:${sessionId}`) ||
        (sessionId.startsWith("local-")
          ? sessionStorage.getItem("execvoice:last-session")
          : null);
      if (raw) {
        const parsed = JSON.parse(raw) as FeedbackPayload & {
          session_id?: string;
        };
        setData({ ...parsed, session_id: parsed.session_id || sessionId });
        return;
      }
    } catch {
      /* ignore */
    }
    setMissing(true);
  }, [data, sessionId]);

  if (data) return <FeedbackView data={data} />;

  if (missing) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
        <h1 className="font-display text-2xl text-navy">{t("notFound")}</h1>
        <Link href="/dashboard" className="mt-4 text-sm text-navy underline">
          {t("backDashboard")}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg items-center justify-center px-6 text-navy/60">
      {t("loading")}
    </main>
  );
}
