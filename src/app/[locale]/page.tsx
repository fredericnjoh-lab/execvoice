import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Home");
  const tNav = await getTranslations("Nav");

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-lg flex-col px-6 pb-10 pt-8">
      <header className="flex items-center justify-between animate-fade-up">
        <Logo />
        <Link
          href="/login"
          className="text-sm font-medium text-navy/70 underline-offset-4 hover:underline"
        >
          {tNav("login")}
        </Link>
      </header>

      <section className="mt-16 flex flex-1 flex-col justify-center gap-6">
        <div className="h-px w-16 origin-left bg-gold animate-gold-line" />
        <Logo size="lg" className="animate-fade-up [animation-delay:80ms]" />
        <h1 className="font-display text-3xl font-semibold leading-tight text-navy text-balance animate-fade-up [animation-delay:140ms] sm:text-4xl">
          {t("headline")}
        </h1>
        <p className="max-w-md text-base leading-relaxed text-navy/70 animate-fade-up [animation-delay:200ms]">
          {t("sub")}
        </p>
        <div className="mt-4 flex flex-col gap-3 animate-fade-up [animation-delay:280ms]">
          <Button asChild variant="gold" size="lg" className="w-full">
            <Link href="/signup">{t("ctaStart")}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href="/login">{t("ctaLogin")}</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
