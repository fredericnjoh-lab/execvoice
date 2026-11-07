import { setRequestLocale, getTranslations } from "next-intl/server";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import type { AppLanguage } from "@/lib/types/database";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Dashboard");
  const tSession = await getTranslations("Session");

  const data = await getDashboardData(
    (locale === "en" ? "en" : "fr") as AppLanguage
  );

  return (
    <DashboardView
      data={data}
      labels={{
        greeting: t("greeting"),
        guest: t("guest"),
        dayOf: t("dayOf"),
        todayTitle: t("todayTitle"),
        startExercise: t("startExercise"),
        noExercise: t("noExercise"),
        streak: t("streak"),
        best: t("best"),
        overall: t("overall"),
        noScore: t("noScore"),
        axesTitle: t("axesTitle"),
        axes: {
          clarity: tSession("axes.clarity"),
          structure: tSession("axes.structure"),
          concision: tSession("axes.concision"),
          vocabulary: tSession("axes.vocabulary"),
          confidence: tSession("axes.confidence"),
          impact: tSession("axes.impact"),
        },
        recentTitle: t("recentTitle"),
        noSessions: t("noSessions"),
        viewProgress: t("viewProgress"),
        minutes: t("minutes"),
        demoBadge: t("demoBadge"),
      }}
    />
  );
}
