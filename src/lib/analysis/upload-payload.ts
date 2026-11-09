/** Stay under typical serverless request limits (Vercel rejects bodies over 4.5 MB). */
export const ANALYSIS_UPLOAD_MAX_BYTES = 3_500_000;

/**
 * Pick the file sent to /api/sessions/analyze.
 * Video takes prefer the small speech track. A full camera file is only used
 * when it already fits; otherwise the request would be rejected before analysis
 * and the client would show a generic failure.
 */
export function selectAnalysisFile(input: {
  kind: "audio" | "video";
  media: Blob | null;
  speech: Blob | null;
  maxBytes?: number;
}): Blob | null {
  const max = input.maxBytes ?? ANALYSIS_UPLOAD_MAX_BYTES;
  const speech = input.speech && input.speech.size > 0 ? input.speech : null;
  if (input.kind === "video" && speech && speech.size <= max) return speech;

  const media = input.media && input.media.size > 0 ? input.media : null;
  if (media && media.size <= max) return media;
  return null;
}

/** Drop `codecs=vp9,opus` so multipart parsers and Whisper see a base mime type. */
export function blobWithoutCodecParameters(blob: Blob): Blob {
  const base = (blob.type || "").split(";")[0].trim();
  if (!base || base === blob.type) return blob;
  return new Blob([blob], { type: base });
}
