"use client";

import { cn } from "@/lib/utils";

interface VoiceSphereFallbackProps {
  className?: string;
  blurred?: boolean;
}

/** Static poster while 3D loads, or when WebGL / RAM / reduced-motion block particles. */
export function VoiceSphereFallback({
  className,
  blurred,
}: VoiceSphereFallbackProps) {
  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden bg-[#0B1020]",
        className
      )}
    >
      <picture>
        <source
          srcSet="/landing/voice-sphere-poster.webp"
          type="image/webp"
        />
        <img
          src="/landing/voice-sphere-poster.png"
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-cover object-center",
            blurred && "scale-110 opacity-60 blur-xl"
          )}
          decoding="async"
        />
      </picture>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0B1020]/30 via-transparent to-[#0B1020]/80" />
    </div>
  );
}
