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
  /** Audio-only copy of a video take, small enough to transcribe. */
  getSpeechBlob: () => Blob | null;
  /** File extension matching the recorded mime (webm | mp4 | m4a). */
  extension: string;
  start: () => Promise<boolean>;
  /** Stops recording and resolves with the final Blob (waits for onstop). */
  stop: () => Promise<Blob | null>;
  reset: () => void;
  ensurePermission: () => Promise<boolean>;
  /** True when this browser can record the requested kind. */
  isSupported: boolean;
}

function pickMimeType(kind: MediaKind): string | undefined {
  const candidates =
    kind === "video"
      ? [
          // Chromium
          "video/webm;codecs=vp9,opus",
          "video/webm;codecs=vp8,opus",
          "video/webm",
          // Safari / iOS
          "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
          "video/mp4",
        ]
      : [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/mp4",
          "audio/aac",
        ];

  if (typeof MediaRecorder === "undefined") return undefined;
  return candidates.find((t) => {
    try {
      return MediaRecorder.isTypeSupported(t);
    } catch {
      return false;
    }
  });
}

/** Stay under the Vercel serverless body limit (4.5 MB) after multipart overhead. */
export const UPLOAD_BYTE_LIMIT = 3_500_000;

const VIDEO_BITS_PER_SECOND = 200_000;
const AUDIO_BITS_PER_SECOND = 64_000;

function pickAudioMime(): string | undefined {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"];
  if (typeof MediaRecorder === "undefined") return undefined;
  return candidates.find((t) => {
    try {
      return MediaRecorder.isTypeSupported(t);
    } catch {
      return false;
    }
  });
}

function extensionForMime(mime: string | null | undefined, kind: MediaKind): string {
  const m = (mime || "").toLowerCase();
  if (m.includes("mp4") || m.includes("avc") || m.includes("aac")) {
    return kind === "video" ? "mp4" : "m4a";
  }
  return "webm";
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
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const speechBlobRef = useRef<Blob | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopResolverRef = useRef<((blob: Blob | null) => void) | null>(null);
  const kindRef = useRef(kind);
  kindRef.current = kind;

  const isSupported =
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia);

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
    if (audioRecorderRef.current && audioRecorderRef.current.state !== "inactive") {
      try {
        audioRecorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    audioRecorderRef.current = null;
    chunksRef.current = [];
    audioChunksRef.current = [];
    speechBlobRef.current = null;
    if (stopResolverRef.current) {
      stopResolverRef.current(null);
      stopResolverRef.current = null;
    }
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

  // Re-acquire media when switching audio ↔ video.
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on kind change
  }, [kind]);

  useEffect(() => () => reset(), [reset]);

  const ensurePermission = useCallback(async () => {
    setError(null);
    setStatus("requesting");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("unsupported");
      }
      if (typeof MediaRecorder === "undefined") {
        throw new Error("recorder_unsupported");
      }

      const constraints: MediaStreamConstraints =
        kind === "video"
          ? {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
              },
              video: {
                facingMode: "user",
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            }
          : {
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
              },
              video: false,
            };

      const media = await navigator.mediaDevices.getUserMedia(constraints);
      stopTracks();
      streamRef.current = media;
      setStream(media);
      setStatus("ready");
      return true;
    } catch (err) {
      console.error("[media]", err);
      setStatus("error");
      const msg = err instanceof Error ? err.message : "permission_denied";
      setError(msg);
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
    const needsVideo = kind === "video";
    const hasVideo = Boolean(media?.getVideoTracks().some((t) => t.readyState === "live"));
    const hasAudio = Boolean(media?.getAudioTracks().some((t) => t.readyState === "live"));
    const stale =
      !media ||
      media.getTracks().some((t) => t.readyState === "ended") ||
      (needsVideo && !hasVideo) ||
      !hasAudio;

    if (stale) {
      const ok = await ensurePermission();
      if (!ok) return false;
      media = streamRef.current;
    }
    if (!media) return false;

    const mime = pickMimeType(kind);
    chunksRef.current = [];
    audioChunksRef.current = [];
    speechBlobRef.current = null;

    try {
      const recorderOptions: MediaRecorderOptions = {};
      if (mime) recorderOptions.mimeType = mime;
      if (kind === "video") {
        recorderOptions.videoBitsPerSecond = VIDEO_BITS_PER_SECOND;
        recorderOptions.audioBitsPerSecond = AUDIO_BITS_PER_SECOND;
      } else {
        recorderOptions.audioBitsPerSecond = AUDIO_BITS_PER_SECOND;
      }
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(
          media,
          Object.keys(recorderOptions).length > 0 ? recorderOptions : undefined
        );
      } catch {
        recorder = mime ? new MediaRecorder(media, { mimeType: mime }) : new MediaRecorder(media);
      }
      const resolvedMime =
        recorder.mimeType || mime || (kind === "video" ? "video/webm" : "audio/webm");
      setMimeType(resolvedMime);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const type =
          recorder.mimeType ||
          mime ||
          (kindRef.current === "video" ? "video/webm" : "audio/webm");
        const file =
          chunksRef.current.length > 0
            ? new Blob(chunksRef.current, { type })
            : null;
        setBlob(file);
        if (file) {
          setPreviewUrl(URL.createObjectURL(file));
        }
        setStatus(file ? "stopped" : "error");
        if (!file) setError("empty_recording");
        stopResolverRef.current?.(file);
        stopResolverRef.current = null;
      };

      recorder.onerror = () => {
        setError("recorder_error");
        setStatus("error");
        stopResolverRef.current?.(null);
        stopResolverRef.current = null;
      };

      recorderRef.current = recorder;

      if (kind === "video") {
        const audioTracks = media.getAudioTracks();
        if (audioTracks.length > 0) {
          try {
            const audioMime = pickAudioMime();
            const audioOptions: MediaRecorderOptions = {
              audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
            };
            if (audioMime) audioOptions.mimeType = audioMime;
            const audioRecorder = new MediaRecorder(new MediaStream(audioTracks), audioOptions);
            audioRecorder.ondataavailable = (e) => {
              if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
            };
            audioRecorder.onstop = () => {
              const type = audioRecorder.mimeType || audioMime || "audio/webm";
              speechBlobRef.current =
                audioChunksRef.current.length > 0
                  ? new Blob(audioChunksRef.current, { type })
                  : null;
            };
            audioRecorderRef.current = audioRecorder;
            audioRecorder.start(1000);
          } catch (err) {
            console.error("[recorder] audio", err);
            audioRecorderRef.current = null;
          }
        }
      }

      // Timeslice keeps Safari/Chrome flushing chunks; 1000ms is safer than 250 on mobile.
      recorder.start(1000);
      setStatus("recording");
      return true;
    } catch (err) {
      console.error("[recorder]", err);
      setError(err instanceof Error ? err.message : "recorder_error");
      setStatus("error");
      return false;
    }
  }, [ensurePermission, kind]);

  const stop = useCallback((): Promise<Blob | null> => {
    const recorder = recorderRef.current;
    const audioRecorder = audioRecorderRef.current;
    const audioStopped =
      audioRecorder && audioRecorder.state !== "inactive"
        ? new Promise<void>((resolve) => {
            let settled = false;
            const finish = () => {
              if (settled) return;
              settled = true;
              if (!speechBlobRef.current && audioChunksRef.current.length > 0) {
                const type = audioRecorder.mimeType || "audio/webm";
                speechBlobRef.current = new Blob(audioChunksRef.current, { type });
              }
              resolve();
            };
            audioRecorder.addEventListener("stop", finish, { once: true });
            window.setTimeout(finish, 2500);
            try {
              if (audioRecorder.state === "recording") audioRecorder.requestData();
            } catch {
              /* optional */
            }
            try {
              audioRecorder.stop();
            } catch {
              finish();
            }
          })
        : Promise.resolve();
    if (!recorder || recorder.state === "inactive") {
      return audioStopped.then(() => blob);
    }

    const videoStopped = new Promise<Blob | null>((resolve) => {
      stopResolverRef.current = resolve;
      try {
        if (recorder.state === "recording") {
          // Flush the current chunk before stop (helps Safari empty blobs).
          try {
            recorder.requestData();
          } catch {
            /* optional */
          }
          recorder.stop();
        } else {
          resolve(blob);
          stopResolverRef.current = null;
        }
      } catch {
        resolve(null);
        stopResolverRef.current = null;
      }
      // Safety timeout if onstop never fires.
      window.setTimeout(() => {
        if (stopResolverRef.current === resolve) {
          const type = mimeType || (kindRef.current === "video" ? "video/webm" : "audio/webm");
          const file =
            chunksRef.current.length > 0
              ? new Blob(chunksRef.current, { type })
              : null;
          if (file) {
            setBlob(file);
            setPreviewUrl(URL.createObjectURL(file));
            setStatus("stopped");
          }
          stopResolverRef.current = null;
          resolve(file);
        }
      }, 2500);
    });
    return Promise.all([videoStopped, audioStopped]).then(([file]) => file);
  }, [blob, mimeType]);

  return {
    status,
    error,
    stream,
    blob,
    previewUrl,
    mimeType,
    getSpeechBlob: () => speechBlobRef.current,
    extension: extensionForMime(mimeType, kind),
    start,
    stop,
    reset,
    ensurePermission,
    isSupported,
  };
}
