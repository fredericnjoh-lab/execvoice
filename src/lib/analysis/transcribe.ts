import OpenAI, { toFile } from "openai";

/**
 * Transcribe audio/video via OpenAI Whisper.
 * Returns null when OPENAI_API_KEY is missing (caller should fall back).
 */
export async function transcribeWithWhisper(
  file: Blob,
  filename: string,
  language?: string
): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  // Whisper rejects files over 25 MB. Skipping avoids buffering a camera take
  // that would otherwise fail the whole request.
  if (file.size > 24 * 1024 * 1024) return null;

  const client = new OpenAI({ apiKey: key });
  const type = (file.type || "audio/webm").split(";")[0].trim() || "audio/webm";
  const upload = await toFile(Buffer.from(await file.arrayBuffer()), filename, {
    type,
  });

  const result = await client.audio.transcriptions.create({
    file: upload,
    model: process.env.OPENAI_WHISPER_MODEL || "whisper-1",
    language: language?.startsWith("fr")
      ? "fr"
      : language?.startsWith("en")
        ? "en"
        : undefined,
    response_format: "text",
  });

  // SDK may return string or object depending on response_format.
  if (typeof result === "string") return result.trim();
  if (result && typeof result === "object" && "text" in result) {
    return String((result as { text: string }).text).trim();
  }
  return String(result).trim();
}
