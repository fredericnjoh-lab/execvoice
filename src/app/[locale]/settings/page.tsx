import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { PhaseStub } from "@/components/layout/phase-stub";
import { Link } from "@/i18n/navigation";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Settings");
  const tCommon = await getTranslations("Common");

  return (
    <div>
      <PhaseStub
        title={t("title")}
        description={t("stub")}
        backHref="/dashboard"
        backLabel={tCommon("back")}
      />
      <div className="mx-auto max-w-lg px-6 -mt-8 pb-10">
        <p className="mb-2 text-sm font-medium text-navy">{t("language")}</p>
        <div className="flex gap-3">
          <Link
            href="/settings"
            locale="fr"
            className={`rounded-md px-4 py-2 text-sm ${
              locale === "fr" ? "bg-navy text-white" : "bg-white border border-navy/15"
            }`}
          >
            FR
          </Link>
          <Link
            href="/settings"
            locale="en"
            className={`rounded-md px-4 py-2 text-sm ${
              locale === "en" ? "bg-navy text-white" : "bg-white border border-navy/15"
            }`}
          >
            EN
          </Link>
        </div>
      </div>
    </div>
  );
}
