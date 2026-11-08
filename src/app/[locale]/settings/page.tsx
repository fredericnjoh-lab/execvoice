import { setRequestLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { AppShell } from "@/components/layout/app-shell";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

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
        <LanguageSwitcher tone="light" size="md" />
      </div>
    </AppShell>
  );
}
