import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Dashboard");
  const tNav = await getTranslations("Nav");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-6 py-8">
      <header className="mb-10 flex items-center justify-between">
        <Logo />
        <Link href="/settings" className="text-sm text-navy/60 hover:text-navy">
          {tNav("settings")}
        </Link>
      </header>
      <h1 className="font-display text-3xl font-semibold text-navy">{t("title")}</h1>
      <p className="mt-3 text-navy/65">{t("stub")}</p>
      <Button asChild variant="gold" size="lg" className="mt-8 w-full">
        <Link href="/exercise/demo">{t("tryExercise")}</Link>
      </Button>
      <Link
        href="/progress"
        className="mt-4 text-center text-sm text-navy/55 underline-offset-4 hover:underline"
      >
        {tNav("progress")}
      </Link>
    </main>
  );
}
