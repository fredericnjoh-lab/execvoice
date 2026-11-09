import { setRequestLocale, getTranslations } from "next-intl/server";
import { ProgressView } from "@/components/progress/progress-view";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";
import type { AppLanguage } from "@/lib/types/database";

export default async function ProgressPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Progress");
  const tSession = await getTranslations("Session");

  const data = await getDashboardData(
    (locale === "en" ? "en" : "fr") as AppLanguage
  );

  return (
    <ProgressView
      data={data}
      labels={{
        title: t("title"),
        subtitle: t("subtitle"),
        overallTrend: t("overallTrend"),
        axesTitle: t("axesTitle"),
        historyTitle: t("historyTitle"),
        empty: t("empty"),
        sessions: t("sessions"),
        demoBadge: t("demoBadge"),
        axes: {
          overall: t("axisOverall"),
          clarity: tSession("axes.clarity"),
          structure: tSession("axes.structure"),
          concision: tSession("axes.concision"),
          vocabulary: tSession("axes.vocabulary"),
          confidence: tSession("axes.confidence"),
          impact: tSession("axes.impact"),
        },
        milestonesTitle: t("milestonesTitle"),
        milestonesSubtitle: t("milestonesSubtitle"),
        milestonesNext: t("milestonesNext"),
        milestonesDone: t("milestonesDone"),
        milestoneNames: {
          first: t("milestones.first"),
          warmup: t("milestones.warmup"),
          week1: t("milestones.week1"),
          halfway: t("milestones.halfway"),
          rhythm: t("milestones.rhythm"),
          complete: t("milestones.complete"),
        },
      }}
    />
  );
}
