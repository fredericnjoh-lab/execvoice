"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type RefObject } from "react";
import { VoiceSphereFallback } from "@/components/landing/voice-sphere-fallback";
import { shouldUseVoiceSphere } from "@/lib/landing/capabilities";

const VoiceSphere = dynamic(
  () =>
    import("@/components/landing/voice-sphere").then((m) => m.VoiceSphere),
  {
    ssr: false,
    loading: () => <VoiceSphereFallback />,
  }
);

interface VoiceSphereSceneProps {
  scrollProgress: RefObject<number>;
  blurred?: boolean;
  className?: string;
}

/**
 * Capability-aware Voice Sphere: poster fallback for no-WebGL,
 * reduced-motion, or low-RAM devices.
 */
export function VoiceSphereScene({
  scrollProgress,
  blurred,
  className,
}: VoiceSphereSceneProps) {
  const [mode, setMode] = useState<"loading" | "3d" | "fallback">("loading");

  useEffect(() => {
    setMode(shouldUseVoiceSphere() ? "3d" : "fallback");
  }, []);

  if (mode !== "3d") {
    return <VoiceSphereFallback className={className} blurred={blurred} />;
  }

  return (
    <VoiceSphere
      scrollProgress={scrollProgress}
      blurred={blurred}
      className={className}
    />
  );
}
