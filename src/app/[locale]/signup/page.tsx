import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { SignupForm } from "@/components/auth/signup-form";
import { AppShell } from "@/components/layout/app-shell";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <AppShell narrow centered className="py-6">
      <div className="mb-6 flex justify-end animate-fade-up">
        <LanguageSwitcher tone="light" />
      </div>
      <div className="mb-8 text-center animate-fade-up">
        <Logo />
      </div>
      <Card className="animate-fade-up [animation-delay:100ms]">
        <CardHeader>
          <CardTitle>{t("signupTitle")}</CardTitle>
          <CardDescription>ExecVoice</CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
        </CardContent>
      </Card>
    </AppShell>
  );
}
