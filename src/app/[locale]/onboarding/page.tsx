import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { PhaseStub } from "@/components/layout/phase-stub";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Onboarding");
  const tCommon = await getTranslations("Common");

  return (
    <PhaseStub
      title={t("title")}
      description={t("stub")}
      backHref="/"
      backLabel={tCommon("back")}
    />
  );
}
