"use client";

import dynamic from "next/dynamic";
import type { RefObject } from "react";
import { shouldUseVoiceSphere } from "@/lib/landing/capabilities";
import { useEffect, useState } from "react";

const PhoneMockupCanvas = dynamic(
  () =>
    import("@/components/landing/phone-mockup").then((m) => m.PhoneMockupCanvas),
  { ssr: false, loading: () => <PhonePoster /> }
);

function PhonePoster() {
  return (
    <div className="flex h-full min-h-[420px] items-center justify-center">
      <div className="aspect-[9/18] w-[220px] rounded-[2rem] border border-[#C9A861]/30 bg-[#1E2A4A] p-3 shadow-2xl">
        <div className="flex h-full flex-col rounded-[1.4rem] bg-[#0B1020] p-4">
          <p className="text-xs text-[#C9A861]">ExecVoice</p>
          <p className="mt-4 font-display text-3xl text-[#F5F1E8]">84</p>
          <p className="text-xs text-[#F5F1E8]/50">/100</p>
          <div className="mt-auto space-y-2">
            {[88, 82, 79, 86].map((n) => (
              <div key={n} className="h-1.5 rounded-full bg-[#1E2A4A]">
                <div
                  className="h-full rounded-full bg-[#C9A861]"
                  style={{ width: `${n}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PhoneScene({
  progress,
  className,
}: {
  progress: RefObject<number>;
  className?: string;
}) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    setOk(shouldUseVoiceSphere());
  }, []);

  if (!ok) return <PhonePoster />;
  return <PhoneMockupCanvas progress={progress} className={className} />;
}
