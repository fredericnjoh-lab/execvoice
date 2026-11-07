import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { PhaseStub } from "@/components/layout/phase-stub";

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Exercise");
  const tCommon = await getTranslations("Common");

  return (
    <PhaseStub
      title={`${t("title")} · ${id.slice(0, 8)}`}
      description={t("stub")}
      backHref="/dashboard"
      backLabel={tCommon("back")}
    />
  );
}
