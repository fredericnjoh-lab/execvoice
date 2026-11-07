"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FaceLandmarker, PoseLandmarker } from "@mediapipe/tasks-vision";
import {
  aggregatePosture,
  scoreFrame,
  type FrameScores,
  type Landmark,
} from "@/lib/posture/score-landmarks";
import type { PostureFeedback } from "@/lib/types/database";

const WASM_CDN =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.2/wasm";
const POSE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

type Status = "idle" | "loading" | "ready" | "running" | "error";

interface UsePostureAnalyzerOptions {
  language?: "fr" | "en";
  /** Sampling interval while recording (ms). */
  intervalMs?: number;
}

/**
 * Client-side MediaPipe Pose + FaceMesh sampler for executive posture checks.
 */
export function usePostureAnalyzer({
  language = "fr",
  intervalMs = 450,
}: UsePostureAnalyzerOptions = {}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<FrameScores | null>(null);
  const [result, setResult] = useState<PostureFeedback | null>(null);

  const poseRef = useRef<PoseLandmarker | null>(null);
  const faceRef = useRef<FaceLandmarker | null>(null);
  const framesRef = useRef<FrameScores[]>([]);
  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const loadingRef = useRef<Promise<void> | null>(null);

  const dispose = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    poseRef.current?.close();
    faceRef.current?.close();
    poseRef.current = null;
    faceRef.current = null;
  }, []);

  useEffect(() => () => dispose(), [dispose]);

  const ensureLoaded = useCallback(async () => {
    if (poseRef.current && faceRef.current) return;
    if (loadingRef.current) return loadingRef.current;

    loadingRef.current = (async () => {
      setStatus("loading");
      setError(null);
      try {
        const { FilesetResolver, PoseLandmarker, FaceLandmarker } =
          await import("@mediapipe/tasks-vision");

        const vision = await FilesetResolver.forVisionTasks(WASM_CDN);

        const pose = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: POSE_MODEL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });

        const face = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: FACE_MODEL,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: true,
        });

        poseRef.current = pose;
        faceRef.current = face;
        setStatus("ready");
      } catch (err) {
        console.error("[posture] load failed, retry CPU", err);
        try {
          // GPU can fail on some browsers — retry CPU.
          const { FilesetResolver, PoseLandmarker, FaceLandmarker } =
            await import("@mediapipe/tasks-vision");
          const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
          poseRef.current = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: POSE_MODEL, delegate: "CPU" },
            runningMode: "VIDEO",
            numPoses: 1,
          });
          faceRef.current = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: FACE_MODEL, delegate: "CPU" },
            runningMode: "VIDEO",
            numFaces: 1,
            outputFaceBlendshapes: true,
          });
          setStatus("ready");
        } catch (err2) {
          console.error("[posture] load failed", err2);
          setError(err2 instanceof Error ? err2.message : "posture_load_failed");
          setStatus("error");
          throw err2;
        }
      } finally {
        loadingRef.current = null;
      }
    })();

    return loadingRef.current;
  }, []);

  const sampleOnce = useCallback(() => {
    const video = videoRef.current;
    const pose = poseRef.current;
    const face = faceRef.current;
    if (!video || !pose || video.readyState < 2) return;

    const ts = performance.now();
    try {
      const poseResult = pose.detectForVideo(video, ts);
      const landmarks = (poseResult.landmarks?.[0] ?? []) as Landmark[];
      if (landmarks.length === 0) return;

      let faceCenter: { x: number; y: number } | null = null;
      let gazeForward: number | null = null;

      if (face) {
        try {
          const faceResult = face.detectForVideo(video, ts);
          const fl = faceResult.faceLandmarks?.[0];
          if (fl && fl.length > 0) {
            // Approximate face center from landmark average.
            const cx = fl.reduce((s, p) => s + p.x, 0) / fl.length;
            const cy = fl.reduce((s, p) => s + p.y, 0) / fl.length;
            faceCenter = { x: cx, y: cy };
          }
          const shapes = faceResult.faceBlendshapes?.[0]?.categories;
          if (shapes) {
            const get = (name: string) =>
              shapes.find((c) => c.categoryName === name)?.score ?? 0;
            // Imbalance between look-left/right ≈ head/gaze yaw proxy.
            gazeForward = get("eyeLookOutLeft") - get("eyeLookOutRight");
          }
        } catch {
          /* face optional */
        }
      }

      const scored = scoreFrame(landmarks, { faceCenter, gazeForward });
      if (!scored) return;
      framesRef.current.push(scored);
      setLive(scored);
    } catch (err) {
      console.warn("[posture] sample", err);
    }
  }, []);

  const start = useCallback(
    async (video: HTMLVideoElement) => {
      videoRef.current = video;
      framesRef.current = [];
      setResult(null);
      setLive(null);
      try {
        await ensureLoaded();
      } catch {
        return;
      }
      if (timerRef.current) window.clearInterval(timerRef.current);
      setStatus("running");
      sampleOnce();
      timerRef.current = window.setInterval(sampleOnce, intervalMs);
    },
    [ensureLoaded, intervalMs, sampleOnce]
  );

  const stop = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const aggregated = aggregatePosture(framesRef.current, language);
    setResult(aggregated);
    setStatus(poseRef.current ? "ready" : "idle");
    return aggregated;
  }, [language]);

  const reset = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    framesRef.current = [];
    setLive(null);
    setResult(null);
    setStatus(poseRef.current ? "ready" : "idle");
  }, []);

  return {
    status,
    error,
    live,
    result,
    ensureLoaded,
    start,
    stop,
    reset,
    sampleCount: () => framesRef.current.length,
  };
}
