import { setRequestLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { AppShell } from "@/components/layout/app-shell";
import { AuthChrome } from "@/components/layout/auth-chrome";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Settings");
  const tAuth = await getTranslations("Auth");

  let authenticated = false;
  try {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      authenticated = Boolean(user);
    }
  } catch {
    authenticated = false;
  }

  return (
    <AppShell withNav>
      <header className="flex items-start justify-between gap-3">
        <Link href="/">
          <Logo />
        </Link>
        <AuthChrome authenticated={authenticated} />
      </header>

      <h1 className="mt-7 font-display text-[1.85rem] font-semibold leading-tight text-navy sm:mt-8 sm:text-3xl">
        {t("title")}
      </h1>
      <p className="mt-2 text-sm text-navy/60">{t("stub")}</p>

      <div className="mt-8">
        <p className="mb-3 text-sm font-medium text-navy">{t("language")}</p>
        <LanguageSwitcher tone="light" size="md" />
      </div>

      <div className="mt-8 space-y-3">
        <p className="text-sm font-medium text-navy">{t("account")}</p>
        <p className="text-sm text-navy/60">
          {authenticated ? t("loggedIn") : t("loggedOut")}
        </p>
        {authenticated ? (
          <LogoutButton className="w-full sm:w-auto" redirectTo="/" />
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="gold">
              <Link href="/signup">{tAuth("saveProgress")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/login">{tAuth("submitLogin")}</Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
