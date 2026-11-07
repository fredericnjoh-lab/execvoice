"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";

/**
 * Lightweight procedural phone (< procedural, no heavy GLTF download).
 * Screen shows a baked canvas texture mimicking AI feedback.
 */
function FeedbackScreen() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0B1020";
    ctx.fillRect(0, 0, 512, 1024);

    // Header
    ctx.fillStyle = "#C9A861";
    ctx.font = "600 28px system-ui, sans-serif";
    ctx.fillText("ExecVoice", 36, 70);

    ctx.fillStyle = "#F5F1E8";
    ctx.font = "600 40px Georgia, serif";
    ctx.fillText("Score global", 36, 150);
    ctx.font = "700 96px Georgia, serif";
    ctx.fillStyle = "#C9A861";
    ctx.fillText("84", 36, 250);
    ctx.fillStyle = "rgba(245,241,232,0.45)";
    ctx.font = "400 32px system-ui";
    ctx.fillText("/100", 180, 250);

    // Axis bars
    const axes = [
      ["Clarté", 88],
      ["Structure", 82],
      ["Concision", 79],
      ["Vocabulaire", 86],
      ["Confiance", 80],
      ["Impact", 85],
    ] as const;
    let y = 320;
    axes.forEach(([label, score]) => {
      ctx.fillStyle = "rgba(245,241,232,0.55)";
      ctx.font = "500 22px system-ui";
      ctx.fillText(label, 36, y);
      ctx.fillStyle = "#1E2A4A";
      ctx.fillRect(36, y + 12, 440, 10);
      ctx.fillStyle = "#C9A861";
      ctx.fillRect(36, y + 12, 440 * (score / 100), 10);
      y += 70;
    });

    // Tip card
    ctx.fillStyle = "#1E2A4A";
    roundRect(ctx, 36, 780, 440, 160, 18);
    ctx.fill();
    ctx.fillStyle = "#C9A861";
    ctx.font = "600 20px system-ui";
    ctx.fillText("Conseil", 56, 820);
    ctx.fillStyle = "#F5F1E8";
    ctx.font = "400 22px system-ui";
    wrapText(
      ctx,
      "Ouvrez par la conclusion — Pyramid Principle — dès la première phrase.",
      56,
      860,
      400,
      28
    );

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);

  return (
    <mesh position={[0, 0, 0.09]}>
      <planeGeometry args={[1.82, 3.72]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

function Phone({ progress }: { progress: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current) return;
    const p = progress.current ?? 0;
    group.current.rotation.y = -0.45 + p * 1.1;
    group.current.rotation.x = 0.18 - p * 0.12;
    group.current.position.y = Math.sin(p * Math.PI) * 0.08;
  });

  return (
    <group ref={group} position={[0, -0.1, 0]} scale={1.05}>
      {/* Body */}
      <RoundedBox args={[2.05, 4.15, 0.18]} radius={0.18} smoothness={4}>
        <meshStandardMaterial
          color="#121826"
          metalness={0.7}
          roughness={0.35}
        />
      </RoundedBox>
      {/* Bezel */}
      <RoundedBox
        args={[1.92, 3.95, 0.04]}
        radius={0.14}
        smoothness={4}
        position={[0, 0, 0.08]}
      >
        <meshStandardMaterial color="#0B1020" roughness={0.8} />
      </RoundedBox>
      <FeedbackScreen />
      {/* Side button */}
      <mesh position={[1.05, 0.6, 0]}>
        <boxGeometry args={[0.04, 0.35, 0.08]} />
        <meshStandardMaterial color="#2a3348" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

export function PhoneMockupCanvas({
  progress,
  className,
}: {
  progress: React.RefObject<number>;
  className?: string;
}) {
  return (
    <div className={className}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 7.2], fov: 35 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 3]} intensity={1.1} color="#F5F1E8" />
        <directionalLight position={[-3, -2, 2]} intensity={0.35} color="#C9A861" />
        <Phone progress={progress} />
      </Canvas>
    </div>
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let yy = y;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = word + " ";
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, yy);
}

export default PhoneMockupCanvas;
