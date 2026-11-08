import { setRequestLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { AppShell } from "@/components/layout/app-shell";
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
    <AppShell withNav>
      <Logo />
      <h1 className="mt-7 font-display text-[1.85rem] font-semibold leading-tight text-navy sm:mt-8 sm:text-3xl">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-navy/60">{t("stub")}</p>

      <div className="mt-8">
        <p className="mb-3 text-sm font-medium text-navy">{t("language")}</p>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/settings"
            locale="fr"
            className={`flex min-h-[48px] items-center justify-center rounded-xl px-4 text-sm font-medium transition-colors active:scale-[0.98] ${
              locale === "fr"
                ? "bg-navy text-white"
                : "border border-navy/15 bg-white text-navy"
            }`}
          >
            Français
          </Link>
          <Link
            href="/settings"
            locale="en"
            className={`flex min-h-[48px] items-center justify-center rounded-xl px-4 text-sm font-medium transition-colors active:scale-[0.98] ${
              locale === "en"
                ? "bg-navy text-white"
                : "border border-navy/15 bg-white text-navy"
            }`}
          >
            English
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
