"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MediaKind = "audio" | "video";

interface UseMediaRecorderOptions {
  kind: MediaKind;
}

interface UseMediaRecorderResult {
  status: "idle" | "requesting" | "ready" | "recording" | "stopped" | "error";
  error: string | null;
  stream: MediaStream | null;
  blob: Blob | null;
  previewUrl: string | null;
  mimeType: string | null;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
  ensurePermission: () => Promise<boolean>;
}

function pickMimeType(kind: MediaKind): string | undefined {
  const candidates =
    kind === "video"
      ? ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]
      : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

  if (typeof MediaRecorder === "undefined") return undefined;
  return candidates.find((t) => MediaRecorder.isTypeSupported(t));
}

/**
 * Browser MediaRecorder wrapper for exercise takes.
 * Cleans up tracks + object URLs on reset/unmount.
 */
export function useMediaRecorder({
  kind,
}: UseMediaRecorderOptions): UseMediaRecorderResult {
  const [status, setStatus] = useState<UseMediaRecorderResult["status"]>("idle");
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const reset = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    recorderRef.current = null;
    chunksRef.current = [];
    stopTracks();
    setBlob(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setMimeType(null);
    setError(null);
    setStatus("idle");
  }, [stopTracks]);

  useEffect(() => () => reset(), [reset]);

  const ensurePermission = useCallback(async () => {
    setError(null);
    setStatus("requesting");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("unsupported");
      }
      const constraints: MediaStreamConstraints =
        kind === "video"
          ? { audio: true, video: { facingMode: "user", width: { ideal: 1280 } } }
          : { audio: true, video: false };

      const media = await navigator.mediaDevices.getUserMedia(constraints);
      stopTracks();
      streamRef.current = media;
      setStream(media);
      setStatus("ready");
      return true;
    } catch (err) {
      console.error("[media]", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "permission_denied");
      return false;
    }
  }, [kind, stopTracks]);

  const start = useCallback(async () => {
    setError(null);
    setBlob(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    let media = streamRef.current;
    if (!media || media.getTracks().some((t) => t.readyState === "ended")) {
      const ok = await ensurePermission();
      if (!ok) return;
      media = streamRef.current;
    }
    if (!media) return;

    const mime = pickMimeType(kind);
    chunksRef.current = [];

    try {
      const recorder = mime
        ? new MediaRecorder(media, { mimeType: mime })
        : new MediaRecorder(media);
      setMimeType(recorder.mimeType || mime || null);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mime || (kind === "video" ? "video/webm" : "audio/webm");
        const file = new Blob(chunksRef.current, { type });
        setBlob(file);
        setPreviewUrl(URL.createObjectURL(file));
        setStatus("stopped");
      };
      recorder.onerror = () => {
        setError("recorder_error");
        setStatus("error");
      };

      recorderRef.current = recorder;
      recorder.start(250);
      setStatus("recording");
    } catch (err) {
      console.error("[recorder]", err);
      setError(err instanceof Error ? err.message : "recorder_error");
      setStatus("error");
    }
  }, [ensurePermission, kind]);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
    // Keep stream alive for retake preview camera; tracks stopped on reset.
  }, []);

  return {
    status,
    error,
    stream,
    blob,
    previewUrl,
    mimeType,
    start,
    stop,
    reset,
    ensurePermission,
  };
}
