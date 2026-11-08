"use client";

import { cn } from "@/lib/utils";

interface OptionCardProps {
  label: string;
  description?: string;
  selected?: boolean;
  onSelect: () => void;
  /** Optional visual accent letter / icon glyph */
  glyph?: string;
}

/** Large touch-friendly selection card for quiz answers. */
export function OptionCard({
  label,
  description,
  selected,
  onSelect,
  glyph,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group flex w-full items-start gap-3 rounded-xl border bg-white px-4 py-3.5 text-left transition-all duration-200 touch-manipulation sm:py-4",
        "hover:border-gold/50 hover:shadow-sm active:scale-[0.985]",
        "min-h-[56px]",
        selected
          ? "border-gold bg-gold/5 ring-2 ring-gold/40"
          : "border-navy/10"
      )}
    >
      {glyph ? (
        <span
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
            selected ? "bg-navy text-gold" : "bg-navy/5 text-navy/70"
          )}
        >
          {glyph}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-navy">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-sm text-navy/55">{description}</span>
        ) : null}
      </span>
      <span
        className={cn(
          "mt-1 h-4 w-4 shrink-0 rounded-full border transition-colors",
          selected ? "border-gold bg-gold" : "border-navy/25"
        )}
      />
    </button>
  );
}
