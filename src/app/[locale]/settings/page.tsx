import { setRequestLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Link } from "@/i18n/navigation";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Settings");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-28 pt-5">
      <Logo />
      <h1 className="mt-8 font-display text-3xl font-semibold text-navy">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-navy/60">{t("stub")}</p>

      <div className="mt-8">
        <p className="mb-2 text-sm font-medium text-navy">{t("language")}</p>
        <div className="flex gap-3">
          <Link
            href="/settings"
            locale="fr"
            className={`rounded-md px-4 py-2 text-sm ${
              locale === "fr"
                ? "bg-navy text-white"
                : "border border-navy/15 bg-white"
            }`}
          >
            FR
          </Link>
          <Link
            href="/settings"
            locale="en"
            className={`rounded-md px-4 py-2 text-sm ${
              locale === "en"
                ? "bg-navy text-white"
                : "border border-navy/15 bg-white"
            }`}
          >
            EN
          </Link>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
