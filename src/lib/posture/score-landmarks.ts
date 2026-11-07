import type { PostureFeedback } from "@/lib/types/database";

/** MediaPipe Pose landmark indices we care about. */
export const POSE = {
  nose: 0,
  leftEye: 2,
  rightEye: 5,
  leftShoulder: 11,
  rightShoulder: 12,
  leftWrist: 15,
  rightWrist: 16,
} as const;

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface FrameScores {
  head_shoulder_alignment: number;
  eye_contact: number;
  hands_visible: number;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function visible(lm: Landmark | undefined, threshold = 0.45): boolean {
  if (!lm) return false;
  if (lm.visibility == null) return lm.x >= 0 && lm.x <= 1 && lm.y >= 0 && lm.y <= 1;
  return lm.visibility >= threshold;
}

function inFrame(lm: Landmark, margin = 0.04): boolean {
  return (
    lm.x >= margin &&
    lm.x <= 1 - margin &&
    lm.y >= margin &&
    lm.y <= 1 - margin
  );
}

/**
 * Score one pose (+ optional face) frame.
 * Coordinates are normalized [0,1] as returned by MediaPipe.
 */
export function scoreFrame(
  pose: Landmark[],
  opts?: {
    faceCenter?: { x: number; y: number } | null;
    /** Head yaw proxy from face matrix / blendshapes, degrees-ish −1..1 */
    gazeForward?: number | null;
  }
): FrameScores | null {
  const nose = pose[POSE.nose];
  const lShoulder = pose[POSE.leftShoulder];
  const rShoulder = pose[POSE.rightShoulder];
  const lWrist = pose[POSE.leftWrist];
  const rWrist = pose[POSE.rightWrist];

  if (!visible(nose) || !visible(lShoulder) || !visible(rShoulder)) {
    return null;
  }

  // --- Alignment: level shoulders + head above midpoint ---
  const shoulderTilt = Math.abs(lShoulder!.y - rShoulder!.y);
  const midX = (lShoulder!.x + rShoulder!.x) / 2;
  const headOffset = Math.abs(nose!.x - midX);
  const headAbove =
    nose!.y < Math.min(lShoulder!.y, rShoulder!.y) - 0.02 ? 1 : 0.6;
  const alignment = clamp(
    (100 - shoulderTilt * 550) * 0.55 +
      (100 - headOffset * 420) * 0.35 +
      headAbove * 10
  );

  // --- Eye contact / camera gaze ---
  let eye = 55;
  if (opts?.faceCenter) {
    const dx = Math.abs(opts.faceCenter.x - 0.5);
    const dy = Math.abs(opts.faceCenter.y - 0.42); // slight upper-third for webcam
    eye = clamp(100 - dx * 220 - dy * 180);
  } else {
    // Fallback: nose near horizontal center
    eye = clamp(100 - Math.abs(nose!.x - 0.5) * 200);
  }
  if (opts?.gazeForward != null) {
    // blend toward forward-looking score
    const gazeScore = clamp(100 - Math.abs(opts.gazeForward) * 120);
    eye = clamp(eye * 0.55 + gazeScore * 0.45);
  }

  // --- Hands visible in frame ---
  const leftOk = visible(lWrist, 0.4) && inFrame(lWrist!);
  const rightOk = visible(rWrist, 0.4) && inFrame(rWrist!);
  let hands = 35;
  if (leftOk && rightOk) hands = 95;
  else if (leftOk || rightOk) hands = 72;

  return {
    head_shoulder_alignment: alignment,
    eye_contact: eye,
    hands_visible: hands,
  };
}

/** Average sampled frame scores into PostureFeedback. */
export function aggregatePosture(
  frames: FrameScores[],
  language: "fr" | "en" = "fr"
): PostureFeedback | null {
  if (frames.length === 0) return null;

  const avg = (key: keyof FrameScores) =>
    Math.round(
      frames.reduce((s, f) => s + f[key], 0) / frames.length
    );

  const head_shoulder_alignment = avg("head_shoulder_alignment");
  const eye_contact = avg("eye_contact");
  const hands_visible = avg("hands_visible");
  const overall =
    (head_shoulder_alignment + eye_contact + hands_visible) / 3;

  const notes =
    language === "fr"
      ? overall >= 80
        ? "Posture exécutive solide : alignement stable et regard caméra."
        : eye_contact < 65
          ? "Gardez le regard sur la lentille, pas sur votre propre image."
          : hands_visible < 65
            ? "Gardez les mains visibles dans le cadre — gestes ouverts."
            : "Redressez les épaules et centrez la tête au-dessus du buste."
      : overall >= 80
        ? "Strong executive posture: stable alignment and camera gaze."
        : eye_contact < 65
          ? "Keep your eyes on the lens, not your self-view."
          : hands_visible < 65
            ? "Keep hands visible in frame — open gestures."
            : "Square your shoulders and center your head above your torso.";

  return {
    head_shoulder_alignment,
    eye_contact,
    hands_visible,
    notes,
  };
}
