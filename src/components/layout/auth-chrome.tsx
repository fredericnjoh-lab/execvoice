"use client";

import { useTranslations } from "next-intl";
import { LogoutButton } from "@/components/auth/logout-button";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

interface AuthChromeProps {
  authenticated: boolean;
  /** Compact header actions for app shell pages. */
  compact?: boolean;
}

/**
 * Simple access strip: home + login/signup OR logout.
 * Keeps landing ↔ cockpit navigation obvious.
 */
export function AuthChrome({ authenticated, compact = true }: AuthChromeProps) {
  const t = useTranslations("Auth");
  const tNav = useTranslations("Nav");

  if (authenticated) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="inline-flex min-h-[40px] items-center px-2 text-xs font-medium text-navy/55 hover:text-navy"
        >
          {tNav("home")}
        </Link>
        <LogoutButton
          variant="ghost"
          className={compact ? "h-9 px-3 text-xs" : undefined}
          redirectTo="/"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/"
        className="inline-flex min-h-[40px] items-center px-2 text-xs font-medium text-navy/55 hover:text-navy"
      >
        {tNav("home")}
      </Link>
      <Button asChild variant="outline" size="sm" className="h-9">
        <Link href="/login">{t("submitLogin")}</Link>
      </Button>
      <Button asChild variant="gold" size="sm" className="h-9">
        <Link href="/signup">{t("saveProgress")}</Link>
      </Button>
    </div>
  );
}
