"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MediaKind = "audio" | "video";

export interface RecordedTake {
  /** Preview file: video container, or the only file when the take is audio. */
  media: Blob | null;
  /** Speech track split from a camera take. Null for audio-only takes. */
  speech: Blob | null;
}

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
  /** File extension matching the recorded mime (webm | mp4 | m4a). */
  extension: string;
  start: () => Promise<boolean>;
  /** Stops recording and resolves once the preview and speech tracks are flushed. */
  stop: () => Promise<RecordedTake>;
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

export function extensionForMime(mime: string | null | undefined, kind: MediaKind): string {
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
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const stopResolverRef = useRef<((blob: Blob | null) => void) | null>(null);
  const mediaBlobRef = useRef<Blob | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const audioBlobRef = useRef<Blob | null>(null);
  const audioStopResolverRef = useRef<((blob: Blob | null) => void) | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
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

  const releaseSpeechRecorder = useCallback(() => {
    const audioRec = audioRecorderRef.current;
    audioRecorderRef.current = null;
    if (audioRec) {
      audioRec.onstop = null;
      audioRec.ondataavailable = null;
      audioRec.onerror = null;
      if (audioRec.state !== "inactive") {
        try {
          audioRec.stop();
        } catch {
          /* ignore */
        }
      }
    }
    audioChunksRef.current = [];
    audioBlobRef.current = null;
    if (audioStopResolverRef.current) {
      audioStopResolverRef.current(null);
      audioStopResolverRef.current = null;
    }
    const ctx = audioContextRef.current;
    audioContextRef.current = null;
    if (ctx) {
      void ctx.close().catch(() => {
        /* ignore */
      });
    }
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
    mediaBlobRef.current = null;
    if (stopResolverRef.current) {
      stopResolverRef.current(null);
      stopResolverRef.current = null;
    }
    releaseSpeechRecorder();
    stopTracks();
    setBlob(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setMimeType(null);
    setError(null);
    setStatus("idle");
  }, [releaseSpeechRecorder, stopTracks]);

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

  const startSpeechRecorder = useCallback((media: MediaStream) => {
    releaseSpeechRecorder();
    if (media.getAudioTracks().length === 0) return;
    audioChunksRef.current = [];
    audioBlobRef.current = null;
    try {
      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      void ctx.resume().catch(() => {
        /* ignore */
      });
      const source = ctx.createMediaStreamSource(media);
      const dest = ctx.createMediaStreamDestination();
      source.connect(dest);
      const audioMime = pickMimeType("audio");
      const audioRec = audioMime
        ? new MediaRecorder(dest.stream, {
            mimeType: audioMime,
            audioBitsPerSecond: 64_000,
          })
        : new MediaRecorder(dest.stream);
      audioRec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      audioRec.onstop = () => {
        const type = audioRec.mimeType || audioMime || "audio/webm";
        const file =
          audioChunksRef.current.length > 0
            ? new Blob(audioChunksRef.current, { type })
            : null;
        audioBlobRef.current = file;
        audioStopResolverRef.current?.(file);
        audioStopResolverRef.current = null;
      };
      audioRec.onerror = () => {
        audioStopResolverRef.current?.(audioBlobRef.current);
        audioStopResolverRef.current = null;
      };
      audioRecorderRef.current = audioRec;
      audioRec.start(1000);
    } catch (err) {
      console.warn("[recorder] speech track", err);
      releaseSpeechRecorder();
    }
  }, [releaseSpeechRecorder]);

  const start = useCallback(async () => {
    setError(null);
    setBlob(null);
    mediaBlobRef.current = null;
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

    try {
      const recorder = mime
        ? new MediaRecorder(media, {
            mimeType: mime,
            // 800 kbps keeps the on-page preview usable. The speech track,
            // not this container, is what analysis uploads.
            videoBitsPerSecond: kind === "video" ? 800_000 : undefined,
          })
        : new MediaRecorder(media);
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
        mediaBlobRef.current = file;
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
      // Timeslice keeps Safari/Chrome flushing chunks; 1000ms is safer than 250 on mobile.
      recorder.start(1000);
      if (kind === "video") startSpeechRecorder(media);
      setStatus("recording");
      return true;
    } catch (err) {
      console.error("[recorder]", err);
      setError(err instanceof Error ? err.message : "recorder_error");
      setStatus("error");
      return false;
    }
  }, [ensurePermission, kind, startSpeechRecorder]);

  const stopSpeech = useCallback((): Promise<Blob | null> => {
    const audioRec = audioRecorderRef.current;
    if (!audioRec || audioRec.state === "inactive") {
      return Promise.resolve(audioBlobRef.current);
    }
    return new Promise<Blob | null>((resolve) => {
      audioStopResolverRef.current = resolve;
      try {
        if (audioRec.state === "recording") {
          try {
            audioRec.requestData();
          } catch {
            /* optional */
          }
          audioRec.stop();
        } else {
          resolve(audioBlobRef.current);
          audioStopResolverRef.current = null;
        }
      } catch {
        resolve(audioBlobRef.current);
        audioStopResolverRef.current = null;
      }
      window.setTimeout(() => {
        if (audioStopResolverRef.current === resolve) {
          audioStopResolverRef.current = null;
          resolve(audioBlobRef.current);
        }
      }, 2500);
    });
  }, []);

  const stop = useCallback((): Promise<RecordedTake> => {
    const recorder = recorderRef.current;
    const mediaPromise: Promise<Blob | null> =
      !recorder || recorder.state === "inactive"
        ? Promise.resolve(mediaBlobRef.current ?? blob)
        : new Promise<Blob | null>((resolve) => {
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
                resolve(mediaBlobRef.current ?? blob);
                stopResolverRef.current = null;
              }
            } catch {
              resolve(null);
              stopResolverRef.current = null;
            }
            // Safety timeout if onstop never fires.
            window.setTimeout(() => {
              if (stopResolverRef.current === resolve) {
                const type =
                  mimeType || (kindRef.current === "video" ? "video/webm" : "audio/webm");
                const file =
                  chunksRef.current.length > 0
                    ? new Blob(chunksRef.current, { type })
                    : null;
                if (file) {
                  mediaBlobRef.current = file;
                  setBlob(file);
                  setPreviewUrl(URL.createObjectURL(file));
                  setStatus("stopped");
                }
                stopResolverRef.current = null;
                resolve(file);
              }
            }, 2500);
          });

    return Promise.all([mediaPromise, stopSpeech()]).then(([media, speech]) => {
      const ctx = audioContextRef.current;
      audioContextRef.current = null;
      if (ctx) {
        void ctx.close().catch(() => {
          /* ignore */
        });
      }
      return { media, speech };
    });
  }, [blob, mimeType, stopSpeech]);

  return {
    status,
    error,
    stream,
    blob,
    previewUrl,
    mimeType,
    extension: extensionForMime(mimeType, kind),
    start,
    stop,
    reset,
    ensurePermission,
    isSupported,
  };
}
