"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Tilt from "react-parallax-tilt";
import { Mic2, Brain, LineChart, Sparkles } from "lucide-react";
import { VoiceSphereScene } from "@/components/landing/voice-sphere-scene";
import { PhoneScene } from "@/components/landing/phone-scene";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

function useCountUp(target: number, active: boolean, duration = 1.6) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const obj = { n: 0 };
    const tween = gsap.to(obj, {
      n: target,
      duration,
      ease: "power2.out",
      onUpdate: () => setValue(Math.round(obj.n)),
    });
    return () => {
      tween.kill();
    };
  }, [active, target, duration]);
  return value;
}

function ProofStat({
  value,
  suffix,
  label,
  active,
}: {
  value: number;
  suffix?: string;
  label: string;
  active: boolean;
}) {
  const n = useCountUp(value, active);
  return (
    <div className="text-center">
      <p className="font-display text-4xl tracking-tight text-[#F5F1E8] sm:text-5xl">
        {n}
        {suffix}
      </p>
      <p className="mt-2 text-sm text-[#F5F1E8]/55">{label}</p>
    </div>
  );
}

export function LandingPage() {
  const t = useTranslations("Landing");
  const tNav = useTranslations("Nav");

  const morphRef = useRef(0);
  const phoneProgress = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const [proofActive, setProofActive] = useState(false);
  const [sphereBlur, setSphereBlur] = useState(false);
  const [tiltEnabled, setTiltEnabled] = useState(false);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTiltEnabled(!coarse && !reduce);
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    // Native scroll feels better on phones; Lenis can fight rubber-banding.
    const useLenis = !reduceMotion && !coarsePointer;

    let lenis: Lenis | null = null;
    let rafId = 0;
    let removeNativeScroll: (() => void) | null = null;

    if (useLenis) {
      lenis = new Lenis({
        duration: 1.1,
        smoothWheel: true,
        touchMultiplier: 1.4,
      });
      lenis.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    } else {
      const onScroll = () => ScrollTrigger.update();
      window.addEventListener("scroll", onScroll, { passive: true });
      removeNativeScroll = () => window.removeEventListener("scroll", onScroll);
    }

    // Drive particle morph 0→1 across the full page scroll
    const stMorph = ScrollTrigger.create({
      trigger: rootRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: reduceMotion ? false : 0.6,
      onUpdate: (self) => {
        morphRef.current = self.progress;
      },
    });

    const stProof = ScrollTrigger.create({
      trigger: "#proof",
      start: "top 70%",
      onEnter: () => {
        setProofActive(true);
        setSphereBlur(true);
      },
      onLeaveBack: () => setSphereBlur(false),
      onLeave: () => setSphereBlur(false),
      onEnterBack: () => setSphereBlur(true),
    });

    const stPhone = ScrollTrigger.create({
      trigger: "#demo",
      start: "top 80%",
      end: "bottom 20%",
      scrub: !reduceMotion,
      onUpdate: (self) => {
        phoneProgress.current = self.progress;
      },
    });

    // Fade-up sections
    const sections = gsap.utils.toArray<HTMLElement>("[data-reveal]");
    sections.forEach((el) => {
      if (reduceMotion) {
        gsap.set(el, { opacity: 1, y: 0 });
        return;
      }
      gsap.fromTo(
        el,
        { opacity: 0, y: coarsePointer ? 20 : 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
          },
        }
      );
    });

    // Before/after crossfade emphasis
    if (!reduceMotion) {
      gsap.fromTo(
        "#after-card",
        { opacity: 0.35, x: coarsePointer ? 12 : 24 },
        {
          opacity: 1,
          x: 0,
          ease: "none",
          scrollTrigger: {
            trigger: "#before-after",
            start: "top 60%",
            end: "center center",
            scrub: true,
          },
        }
      );
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      stMorph.kill();
      stProof.kill();
      stPhone.kill();
      ScrollTrigger.getAll().forEach((s) => s.kill());
      lenis?.destroy();
      removeNativeScroll?.();
    };
  }, []);

  const methodIcons = [Mic2, Brain, LineChart, Sparkles];

  return (
    <div
      ref={rootRef}
      className="landing relative bg-[#0B1020] text-[#F5F1E8] antialiased"
    >
      {/* Persistent sphere backdrop */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <VoiceSphereScene
          scrollProgress={morphRef}
          blurred={sphereBlur}
          className="h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1020]/40 via-transparent to-[#0B1020]/85" />
      </div>

      {/* Top nav */}
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between safe-px pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 sm:px-8">
        <Link href="/" className="font-display text-xl tracking-tight">
          Exec<span className="text-[#C9A861]">Voice</span>
        </Link>
        <div className="flex items-center gap-2 text-sm sm:gap-4">
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center px-2 text-[#F5F1E8]/70 transition hover:text-[#F5F1E8]"
          >
            {tNav("login")}
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-[44px] items-center rounded-full bg-[#C9A861] px-4 py-2 font-medium text-[#0B1020] transition hover:bg-[#d4b56f]"
          >
            {tNav("signup")}
          </Link>
        </div>
      </header>

      {/* 1. Hero */}
      <section className="relative z-10 flex min-h-[100svh] flex-col justify-center safe-px pb-28 pt-8 sm:px-8 sm:pb-24 sm:pt-10">
        <div className="mx-auto w-full max-w-3xl" data-reveal>
          <p className="mb-4 text-xs uppercase tracking-[0.22em] text-[#C9A861]">
            ExecVoice
          </p>
          <h1 className="font-display text-[2.15rem] leading-[1.08] tracking-[-0.02em] text-[#F5F1E8] sm:text-5xl md:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[#F5F1E8]/70 sm:text-lg">
            {t("hero.sub")}
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex w-full min-h-[48px] items-center justify-center rounded-full bg-[#C9A861] px-7 py-3.5 text-sm font-semibold text-[#0B1020] shadow-[0_0_40px_rgba(201,168,97,0.25)] transition hover:bg-[#d4b56f] sm:w-auto"
          >
            {t("hero.cta")}
          </Link>
        </div>
      </section>

      {/* 2. Proof */}
      <section
        id="proof"
        className="relative z-10 mx-auto grid w-full max-w-5xl grid-cols-1 gap-8 safe-px py-16 sm:grid-cols-3 sm:gap-10 sm:px-8 sm:py-24"
      >
        <ProofStat
          value={30}
          suffix="j"
          label={t("proof.days")}
          active={proofActive}
        />
        <ProofStat
          value={6}
          label={t("proof.axes")}
          active={proofActive}
        />
        <ProofStat
          value={2}
          suffix=" min"
          label={t("proof.eval")}
          active={proofActive}
        />
      </section>

      {/* 3. Before / After */}
      <section
        id="before-after"
        className="relative z-10 mx-auto w-full max-w-5xl safe-px py-16 sm:px-8 sm:py-20"
      >
        <h2
          className="font-display text-3xl tracking-tight text-[#F5F1E8] sm:text-4xl"
          data-reveal
        >
          {t("beforeAfter.title")}
        </h2>
        <p className="mt-3 max-w-xl text-[#F5F1E8]/60" data-reveal>
          {t("beforeAfter.sub")}
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <article
            className="rounded-2xl border border-white/10 bg-[#1E2A4A]/55 p-6 backdrop-blur-md"
            data-reveal
          >
            <p className="text-xs uppercase tracking-widest text-[#F5F1E8]/40">
              {t("beforeAfter.beforeLabel")}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[#F5F1E8]/75">
              {t("beforeAfter.beforeText")}
            </p>
          </article>
          <article
            id="after-card"
            className="rounded-2xl border border-[#C9A861]/35 bg-[#1E2A4A]/70 p-6 backdrop-blur-md"
            data-reveal
          >
            <p className="text-xs uppercase tracking-widest text-[#C9A861]">
              {t("beforeAfter.afterLabel")}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[#F5F1E8]">
              {t("beforeAfter.afterText")}
            </p>
          </article>
        </div>
      </section>

      {/* 4. Method */}
      <section className="relative z-10 mx-auto w-full max-w-5xl safe-px py-16 sm:px-8 sm:py-20">
        <h2
          className="font-display text-3xl tracking-tight sm:text-4xl"
          data-reveal
        >
          {t("method.title")}
        </h2>
        <p className="mt-3 max-w-xl text-[#F5F1E8]/60" data-reveal>
          {t("method.sub")}
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((step, i) => {
            const Icon = methodIcons[i]!;
            const card = (
              <div
                className="h-full rounded-2xl border border-white/10 bg-[#1E2A4A]/60 p-5 backdrop-blur-md sm:p-6"
                data-reveal
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#C9A861]/30 text-[#C9A861]">
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </div>
                <p className="text-xs uppercase tracking-widest text-[#C9A861]/80">
                  {t("method.step", { n: step })}
                </p>
                <h3 className="mt-2 font-display text-xl tracking-tight">
                  {t(`method.steps.${step}.title`)}
                </h3>
                <p className="mt-2 text-sm text-[#F5F1E8]/60">
                  {t(`method.steps.${step}.body`)}
                </p>
              </div>
            );
            if (!tiltEnabled) {
              return (
                <div key={step} className="rounded-2xl">
                  {card}
                </div>
              );
            }
            return (
              <Tilt
                key={step}
                tiltMaxAngleX={8}
                tiltMaxAngleY={8}
                glareEnable
                glareMaxOpacity={0.12}
                glareColor="#C9A861"
                glarePosition="all"
                scale={1.02}
                transitionSpeed={1200}
                className="rounded-2xl"
              >
                {card}
              </Tilt>
            );
          })}
        </div>
      </section>

      {/* 5. Demo phone */}
      <section
        id="demo"
        className="relative z-10 mx-auto grid w-full max-w-5xl items-center gap-8 safe-px py-16 md:grid-cols-2 sm:gap-10 sm:px-8 sm:py-20"
      >
        <div data-reveal>
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            {t("demo.title")}
          </h2>
          <p className="mt-4 text-[#F5F1E8]/65">{t("demo.sub")}</p>
          <ul className="mt-6 space-y-3 text-sm text-[#F5F1E8]/70">
            <li className="flex gap-2">
              <span className="text-[#C9A861]">—</span>
              {t("demo.b1")}
            </li>
            <li className="flex gap-2">
              <span className="text-[#C9A861]">—</span>
              {t("demo.b2")}
            </li>
            <li className="flex gap-2">
              <span className="text-[#C9A861]">—</span>
              {t("demo.b3")}
            </li>
          </ul>
        </div>
        <div className="h-[360px] sm:h-[480px] md:h-[560px]" data-reveal>
          <PhoneScene progress={phoneProgress} className="h-full w-full" />
        </div>
      </section>

      {/* 6. Testimonials */}
      <section className="relative z-10 overflow-hidden py-16 sm:py-20">
        <div className="mx-auto max-w-5xl safe-px sm:px-8" data-reveal>
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            {t("testimonials.title")}
          </h2>
        </div>
        <div className="mt-8 flex gap-4 overflow-x-auto safe-px pb-4 no-scrollbar snap-x snap-mandatory sm:mt-10 sm:px-8">
          {[1, 2, 3].map((i) => (
            <figure
              key={i}
              className="min-w-[min(85%,20rem)] snap-center rounded-2xl border border-white/10 bg-[#1E2A4A]/65 p-6 backdrop-blur-md sm:min-w-[340px]"
            >
              <blockquote className="text-sm leading-relaxed text-[#F5F1E8]/80">
                “{t(`testimonials.items.${i}.quote`)}”
              </blockquote>
              <figcaption className="mt-5">
                <p className="text-sm font-medium text-[#F5F1E8]">
                  {t(`testimonials.items.${i}.name`)}
                </p>
                <p className="text-xs text-[#F5F1E8]/45">
                  {t(`testimonials.items.${i}.role`)}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 7. Final CTA — ordered luminous sphere behind */}
      <section className="relative z-10 flex min-h-[70svh] flex-col items-center justify-center safe-px py-20 text-center sm:min-h-[80svh] sm:px-8 sm:py-28">
        <div
          className={cn(
            "pointer-events-none absolute inset-0 opacity-40",
            "bg-[radial-gradient(ellipse_at_center,rgba(201,168,97,0.28),transparent_60%)]"
          )}
        />
        <div className="relative w-full max-w-2xl" data-reveal>
          <h2 className="font-display text-[2.15rem] tracking-tight text-[#F5F1E8] sm:text-5xl">
            {t("final.title")}
          </h2>
          <p className="mt-4 text-[#F5F1E8]/65">{t("final.sub")}</p>
          <Link
            href="/signup"
            className="mt-8 inline-flex w-full min-h-[48px] items-center justify-center rounded-full bg-[#C9A861] px-8 py-4 text-sm font-semibold text-[#0B1020] shadow-[0_0_60px_rgba(201,168,97,0.35)] transition hover:bg-[#d4b56f] sm:w-auto"
          >
            {t("final.cta")}
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 safe-px py-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-center text-xs text-[#F5F1E8]/35 sm:px-8">
        © {new Date().getFullYear()} ExecVoice
      </footer>
    </div>
  );
}
