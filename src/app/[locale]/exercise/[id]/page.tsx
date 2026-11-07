import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { ExercisePlayer } from "@/components/exercise/exercise-player";
import { getExerciseById, listExercises } from "@/lib/exercises/get-exercise";
import { Link } from "@/i18n/navigation";

export default async function ExercisePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  // Support "demo" alias → first exercise in locale.
  let exercise =
    id === "demo"
      ? (await listExercises(locale === "en" ? "en" : "fr"))[0] ?? null
      : await getExerciseById(id);

  if (!exercise && id === "demo") {
    exercise = (await listExercises())[0] ?? null;
  }

  if (!exercise) {
    const t = await getTranslations("Exercise");
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6">
        <h1 className="font-display text-2xl text-navy">{t("notFound")}</h1>
        <Link href="/dashboard" className="mt-4 text-sm underline">
          Dashboard
        </Link>
      </main>
    );
  }

  return <ExercisePlayer exercise={exercise} />;
}
