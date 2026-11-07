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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-navy/10 bg-cream/95 backdrop-blur-md">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map(({ href, key, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-3 text-xs transition-colors",
                  active ? "text-navy" : "text-navy/40 hover:text-navy/70"
                )}
              >
                <Icon
                  className={cn("h-5 w-5", active && "text-gold")}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span className={cn(active && "font-medium")}>{t(key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
