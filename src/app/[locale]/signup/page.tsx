import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { SignupForm } from "@/components/auth/signup-form";
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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
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
    </main>
  );
}
