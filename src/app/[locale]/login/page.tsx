import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const { next } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center animate-fade-up">
        <Logo />
      </div>
      <Card className="animate-fade-up [animation-delay:100ms]">
        <CardHeader>
          <CardTitle>{t("loginTitle")}</CardTitle>
          <CardDescription>ExecVoice</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm nextPath={next || "/dashboard"} />
        </CardContent>
      </Card>
    </main>
  );
}
