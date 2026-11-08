"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";

interface LoginFormProps {
  nextPath?: string;
}

export function LoginForm({ nextPath = "/dashboard" }: LoginFormProps) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      setError(t("errorMissingConfig"));
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError(mapLoginError(authError.message, t));
        return;
      }
      if (!data.session) {
        setError(t("errorGeneric"));
        return;
      }

      const dest =
        nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/dashboard";
      // Prefer cockpit; strip absolute locale if middleware already localized Link.
      router.push(dest.replace(/^\/(fr|en)/, "") || "/dashboard");
      router.refresh();
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" variant="gold" disabled={loading}>
        {loading ? t("signingIn") : t("submitLogin")}
      </Button>
      <p className="text-center text-sm text-navy/60">
        {t("noAccount")}{" "}
        <Link href="/signup" className="text-navy underline underline-offset-4">
          {t("submitSignup")}
        </Link>
      </p>
      <p className="text-center text-sm text-navy/45">
        <Link href="/dashboard" className="underline underline-offset-4">
          {t("openCockpit")}
        </Link>
        {" · "}
        <Link href="/" className="underline underline-offset-4">
          {t("backHome")}
        </Link>
      </p>
    </form>
  );
}

function mapLoginError(
  message: string,
  t: ReturnType<typeof useTranslations<"Auth">>
) {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) {
    return t("errorInvalidCredentials");
  }
  if (m.includes("email not confirmed") || m.includes("not confirmed")) {
    return t("errorEmailNotConfirmed");
  }
  if (m.includes("rate") || m.includes("seconds")) {
    return t("errorRateLimit");
  }
  return message || t("errorGeneric");
}
