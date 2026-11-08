"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";

interface LogoutButtonProps {
  variant?: "outline" | "ghost" | "default";
  className?: string;
  /** After logout, land here (default: home). */
  redirectTo?: "/" | "/login" | "/dashboard";
}

export function LogoutButton({
  variant = "outline",
  className,
  redirectTo = "/",
}: LogoutButtonProps) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    try {
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
      router.push(redirectTo);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      disabled={loading}
      onClick={onLogout}
    >
      {loading ? t("loggingOut") : t("logout")}
    </Button>
  );
}
