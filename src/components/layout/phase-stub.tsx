import { Logo } from "@/components/brand/logo";
import { Link } from "@/i18n/navigation";

interface PhaseStubProps {
  title: string;
  description: string;
  backHref?: string;
  backLabel?: string;
}

/** Placeholder screen until the matching phase lands. */
export function PhaseStub({
  title,
  description,
  backHref = "/",
  backLabel = "←",
}: PhaseStubProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-6 py-8">
      <header className="mb-10 flex items-center justify-between">
        <Logo />
        <Link href={backHref} className="text-sm text-navy/60 hover:text-navy">
          {backLabel}
        </Link>
      </header>
      <h1 className="font-display text-3xl font-semibold text-navy">{title}</h1>
      <p className="mt-3 text-navy/65">{description}</p>
    </main>
  );
}
