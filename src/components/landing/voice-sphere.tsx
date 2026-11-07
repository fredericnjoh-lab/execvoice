"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 20000;

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uMorph;
uniform float uPulse;
uniform vec2 uPointer;
attribute vec3 aChaos;
attribute vec3 aOrder;
attribute float aSeed;

varying float vAlpha;
varying float vMix;

float hash(float n){ return fract(sin(n)*43758.5453); }

void main() {
  float morph = clamp(uMorph, 0.0, 1.0);
  // Ease into ordered form
  float m = morph * morph * (3.0 - 2.0 * morph);

  vec3 chaotic = aChaos;
  // Soft noise drift on chaos positions
  float t = uTime * (0.15 + aSeed * 0.1);
  chaotic += vec3(
    sin(t + aSeed * 6.0),
    cos(t * 1.1 + aSeed * 4.0),
    sin(t * 0.8 + aSeed * 5.0)
  ) * (0.045 * (1.0 - m));

  vec3 pos = mix(chaotic, aOrder, m);

  // Cursor / gyro parallax (stronger when still chaotic)
  float react = (1.0 - m * 0.55);
  pos.xy += uPointer * (0.22 * react) * (0.4 + aSeed);

  // Breathing pulse
  float pulse = 1.0 + sin(uTime * 1.2 + aSeed * 6.2831) * 0.018 * uPulse;
  pos *= pulse;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  float size = mix(2.4, 1.6, m) * (1.0 + aSeed * 0.5);
  size *= (300.0 / -mv.z);
  gl_PointSize = clamp(size, 0.8, 4.5);

  vMix = m;
  vAlpha = mix(0.22, 0.75, m) * (0.55 + aSeed * 0.45);
}
`;

const fragmentShader = /* glsl */ `
precision mediump float;
uniform float uMorph;
varying float vAlpha;
varying float vMix;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float soft = smoothstep(0.5, 0.12, d);

  // Chaos: cool mist · Order: warm gold clarity
  vec3 chaosCol = vec3(0.45, 0.55, 0.85);
  vec3 orderCol = vec3(0.79, 0.66, 0.38); // #C9A861
  vec3 col = mix(chaosCol, orderCol, vMix);

  float alpha = soft * vAlpha * mix(0.55, 0.95, uMorph);
  gl_FragColor = vec4(col, alpha);
}
`;

function fibSphere(i: number, n: number, radius: number): THREE.Vector3 {
  const offset = 2 / n;
  const y = i * offset - 1 + offset / 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const phi = i * Math.PI * (3 - Math.sqrt(5));
  return new THREE.Vector3(
    Math.cos(phi) * r * radius,
    y * radius,
    Math.sin(phi) * r * radius
  );
}

/** Ordered target: crystal octahedron / lens — “discours clair”. */
function orderedPoint(i: number, n: number): THREE.Vector3 {
  // Map fibonacci sphere onto a squashed octahedron shell
  const s = fibSphere(i, n, 1);
  const ax = Math.abs(s.x);
  const ay = Math.abs(s.y);
  const az = Math.abs(s.z);
  const k = ax + ay + az || 1;
  const o = new THREE.Vector3(s.x / k, s.y / k, s.z / k);
  // Tall “voice pillar” bias + slight lens flatten on Z
  o.y *= 1.35;
  o.x *= 1.05;
  o.z *= 0.72;
  return o.multiplyScalar(1.55);
}

function ParticleField({
  scrollProgress,
}: {
  scrollProgress: React.RefObject<number>;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport, gl } = useThree();
  const pointer = useRef(new THREE.Vector2(0, 0));
  const targetPointer = useRef(new THREE.Vector2(0, 0));

  const { positions, chaos, order, seeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const chaos = new Float32Array(COUNT * 3);
    const order = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const seed = Math.random();
      seeds[i] = seed;

      // Chaotic cloud: fib sphere + radial noise
      const base = fibSphere(i, COUNT, 1.35 + seed * 0.55);
      const jitter = 0.35 * seed;
      const cx = base.x + (Math.random() - 0.5) * jitter;
      const cy = base.y + (Math.random() - 0.5) * jitter;
      const cz = base.z + (Math.random() - 0.5) * jitter;
      chaos[i * 3] = cx;
      chaos[i * 3 + 1] = cy;
      chaos[i * 3 + 2] = cz;

      const o = orderedPoint(i, COUNT);
      order[i * 3] = o.x;
      order[i * 3 + 1] = o.y;
      order[i * 3 + 2] = o.z;

      // Start as chaos
      positions[i * 3] = cx;
      positions[i * 3 + 1] = cy;
      positions[i * 3 + 2] = cz;
    }
    return { positions, chaos, order, seeds };
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aChaos", new THREE.BufferAttribute(chaos, 3));
    geo.setAttribute("aOrder", new THREE.BufferAttribute(order, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return geo;
  }, [positions, chaos, order, seeds]);

  useEffect(() => {
    const el = gl.domElement;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetPointer.current.set(x * 0.65, y * 0.45);
    };

    const onOrient = (e: DeviceOrientationEvent) => {
      const g = (e.gamma ?? 0) / 45; // left-right
      const b = (e.beta ?? 0) / 45; // front-back
      targetPointer.current.set(
        THREE.MathUtils.clamp(g, -1, 1) * 0.5,
        THREE.MathUtils.clamp(b - 1, -1, 1) * 0.35
      );
    };

    el.addEventListener("pointermove", onMove);
    window.addEventListener("deviceorientation", onOrient);
    return () => {
      el.removeEventListener("pointermove", onMove);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, [gl]);

  useFrame(({ clock }) => {
    const mat = materialRef.current;
    if (!mat) return;
    const t = clock.getElapsedTime();
    mat.uniforms.uTime.value = t;
    mat.uniforms.uMorph.value = scrollProgress.current ?? 0;
    mat.uniforms.uPulse.value = 1;

    pointer.current.lerp(targetPointer.current, 0.06);
    mat.uniforms.uPointer.value.copy(pointer.current);

    // Gentle auto-rotate that slows as form orders
    if (pointsRef.current) {
      const morph = scrollProgress.current ?? 0;
      pointsRef.current.rotation.y = t * (0.08 - morph * 0.05);
      pointsRef.current.rotation.x = Math.sin(t * 0.2) * 0.06 * (1 - morph);
      // Keep sphere readable across viewport sizes
      const s = Math.min(viewport.width, viewport.height) * 0.22;
      pointsRef.current.scale.setScalar(Math.max(0.85, Math.min(1.35, s)));
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uPulse: { value: 1 },
          uPointer: { value: new THREE.Vector2(0, 0) },
        }}
      />
    </points>
  );
}

export interface VoiceSphereProps {
  /** 0 = chaotic draft, 1 = ordered clarity. Shared ref updated by Lenis/scroll. */
  scrollProgress: React.RefObject<number>;
  className?: string;
  /** When true, apply CSS blur (preuve section backdrop). */
  blurred?: boolean;
}

/**
 * Full-bleed particle Voice Sphere. Must be client-only (dynamic ssr:false).
 */
export function VoiceSphere({
  scrollProgress,
  className,
  blurred,
}: VoiceSphereProps) {
  return (
    <div
      className={className}
      style={{
        filter: blurred ? "blur(18px) saturate(1.1)" : undefined,
        opacity: blurred ? 0.55 : 1,
      }}
    >
      <Canvas
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        camera={{ position: [0, 0, 5.2], fov: 42, near: 0.1, far: 40 }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#0B1020"]} />
        <ParticleField scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}

export default VoiceSphere;
