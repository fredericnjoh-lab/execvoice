"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";

export function SignupForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsEmailConfirm(false);

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
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim(), language: locale },
          emailRedirectTo: origin
            ? `${origin}/auth/callback?next=/${locale}/dashboard`
            : undefined,
        },
      });

      if (authError) {
        setError(mapAuthError(authError.message, t));
        return;
      }

      // Empty identities = obfuscated response (user may already exist).
      const identities = data.user?.identities ?? [];
      if (data.user && identities.length === 0) {
        setError(t("errorAlreadyRegistered"));
        return;
      }

      if (data.session) {
        // Ensure profile row exists even if DB trigger missed.
        try {
          await supabase.from("profiles").upsert({
            id: data.session.user.id,
            name: name.trim(),
            language: locale,
          });
        } catch {
          /* schema may not be applied yet — still enter cockpit */
        }
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // Email confirmation required — no session yet.
      setNeedsEmailConfirm(true);
    } catch {
      setError(t("errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  if (needsEmailConfirm) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm leading-relaxed text-navy/75">
          {t("confirmEmail", { email })}
        </p>
        <Button asChild variant="gold" className="w-full">
          <Link href="/login">{t("goLoginAfterConfirm")}</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/dashboard">{t("openCockpit")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          type="text"
          autoComplete="given-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
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
          autoComplete="new-password"
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
        {loading ? t("creating") : t("submitSignup")}
      </Button>
      <p className="text-center text-sm text-navy/60">
        {t("hasAccount")}{" "}
        <Link href="/login" className="text-navy underline underline-offset-4">
          {t("submitLogin")}
        </Link>
      </p>
      <p className="text-center text-sm text-navy/45">
        <Link href="/dashboard" className="underline underline-offset-4">
          {t("openCockpit")}
        </Link>
      </p>
    </form>
  );
}

function mapAuthError(
  message: string,
  t: ReturnType<typeof useTranslations<"Auth">>
) {
  const m = message.toLowerCase();
  if (m.includes("already") || m.includes("registered")) {
    return t("errorAlreadyRegistered");
  }
  if (m.includes("invalid") && m.includes("email")) {
    return t("errorInvalidEmail");
  }
  if (m.includes("password")) {
    return t("errorWeakPassword");
  }
  if (m.includes("rate") || m.includes("seconds")) {
    return t("errorRateLimit");
  }
  return message || t("errorGeneric");
}
