import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Large hero wordmark vs compact nav mark */
  size?: "sm" | "lg";
}

/** ExecVoice wordmark — brand-first signal, not a generic eyebrow. */
export function Logo({ className, size = "sm" }: LogoProps) {
  return (
    <span
      className={cn(
        "font-display tracking-tight text-navy",
        size === "lg" ? "text-4xl sm:text-5xl" : "text-xl",
        className
      )}
    >
      Exec<span className="text-gold">Voice</span>
    </span>
  );
}
