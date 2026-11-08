"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/i18n/routing";

const LOCALES: { code: AppLocale; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
];

interface LanguageSwitcherProps {
  /** Landing (dark) vs app (light) surfaces */
  tone?: "dark" | "light";
  className?: string;
  /** Larger segmented control (settings) */
  size?: "sm" | "md";
}

/**
 * Switch locale while staying on the current route.
 * English lives at /en/…, French at /fr/….
 */
export function LanguageSwitcher({
  tone = "light",
  className,
  size = "sm",
}: LanguageSwitcherProps) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const t = useTranslations("Nav");

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn(
        "inline-flex items-center rounded-full border p-0.5",
        tone === "dark"
          ? "border-white/15 bg-white/5"
          : "border-navy/15 bg-white",
        className
      )}
    >
      {LOCALES.map(({ code, label }) => {
        const active = locale === code;
        return (
          <Link
            key={code}
            href={pathname || "/"}
            locale={code}
            hrefLang={code}
            aria-current={active ? "true" : undefined}
            className={cn(
              "inline-flex items-center justify-center rounded-full font-medium transition-colors touch-manipulation",
              size === "sm"
                ? "min-h-[36px] min-w-[40px] px-2.5 text-xs"
                : "min-h-[44px] min-w-[72px] px-4 text-sm",
              tone === "dark"
                ? active
                  ? "bg-[#C9A861] text-[#0B1020]"
                  : "text-[#F5F1E8]/65 hover:text-[#F5F1E8]"
                : active
                  ? "bg-navy text-white"
                  : "text-navy/55 hover:text-navy"
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
