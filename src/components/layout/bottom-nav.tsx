"use client";

import { useTranslations } from "next-intl";
import { LayoutDashboard, TrendingUp, Settings } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", key: "dashboard", Icon: LayoutDashboard },
  { href: "/progress", key: "progress", Icon: TrendingUp },
  { href: "/settings", key: "settings", Icon: Settings },
] as const;

export function BottomNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-navy/10 bg-cream/95 backdrop-blur-md supports-[backdrop-filter]:bg-cream/85"
    >
      <ul className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map(({ href, key, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex min-w-0 flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[44px] w-full flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px] leading-none transition-colors touch-manipulation",
                  "active:bg-navy/[0.04]",
                  active ? "text-navy" : "text-navy/40"
                )}
              >
                {active ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-gold"
                  />
                ) : null}
                <Icon
                  className={cn("h-5 w-5", active && "text-gold")}
                  strokeWidth={active ? 2.25 : 1.75}
                  aria-hidden
                />
                <span className={cn("truncate", active && "font-medium")}>
                  {t(key)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
