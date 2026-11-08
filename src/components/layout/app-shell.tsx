import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  /** Show fixed bottom tab bar (dashboard / progress / settings). */
  withNav?: boolean;
  className?: string;
  /** Center content vertically (auth screens). */
  centered?: boolean;
  /** Narrower column (auth). */
  narrow?: boolean;
}

/**
 * Mobile-first page shell: safe-area insets, readable column width,
 * and reserved space above the bottom nav / home indicator.
 */
export function AppShell({
  children,
  withNav = false,
  className,
  centered = false,
  narrow = false,
}: AppShellProps) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full flex-col",
        "min-h-dvh min-h-[100svh]",
        narrow ? "max-w-md" : "max-w-lg",
        "px-5 sm:px-6",
        "pt-[max(1.25rem,env(safe-area-inset-top))]",
        withNav
          ? "pb-[calc(5.75rem+env(safe-area-inset-bottom))]"
          : "pb-[max(1.75rem,env(safe-area-inset-bottom))]",
        centered && "justify-center",
        className
      )}
    >
      {children}
      {withNav ? <BottomNav /> : null}
    </main>
  );
}
