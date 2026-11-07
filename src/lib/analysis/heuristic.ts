import type {
  SessionFeedback,
  SessionScores,
} from "@/lib/types/database";

const FILLERS_FR = [
  "euh",
  "heu",
  "du coup",
  "en fait",
  "genre",
  "voilà",
  "bah",
  "ben",
  "donc voilà",
  "en vrai",
];
const FILLERS_EN = [
  "uh",
  "um",
  "erm",
  "like",
  "you know",
  "basically",
  "actually",
  "sort of",
  "kind of",
  "i mean",
];

const WEAK_FR: Record<string, string> = {
  "je pense que": "Je suis convaincu que",
  "peut-être": "Il est probable que",
  "un peu": "légèrement",
  "essayer": "exécuter",
  "problème": "enjeu",
  "truc": "levier",
  "chose": "élément",
};
const WEAK_EN: Record<string, string> = {
  "i think": "I believe",
  maybe: "likely",
  "a bit": "somewhat",
  try: "execute",
  problem: "challenge",
  stuff: "priority",
  thing: "factor",
};

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function countFillers(transcript: string, language: string) {
  const list = language.startsWith("fr") ? FILLERS_FR : FILLERS_EN;
  const lower = transcript.toLowerCase();
  return list
    .map((word) => {
      const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
      const count = (lower.match(re) || []).length;
      return { word, count };
    })
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count);
}

function findWeakWords(transcript: string, language: string) {
  const map = language.startsWith("fr") ? WEAK_FR : WEAK_EN;
  const lower = transcript.toLowerCase();
  const out: { original: string; suggestion: string }[] = [];
  for (const [original, suggestion] of Object.entries(map)) {
    if (lower.includes(original)) out.push({ original, suggestion });
  }
  return out.slice(0, 6);
}

function wordCount(transcript: string) {
  return transcript
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

/**
 * Offline / no-API-key analysis so the exercise loop still works end-to-end.
 */
export function heuristicAnalyze(input: {
  transcript: string;
  duration_s: number;
  language: string;
  exercise_prompt: string;
}): { scores: SessionScores; feedback: SessionFeedback } {
  const { transcript, duration_s, language } = input;
  const words = wordCount(transcript);
  const minutes = Math.max(duration_s / 60, 1 / 60);
  const wpm = Math.round(words / minutes);
  const fillers = countFillers(transcript, language);
  const fillerTotal = fillers.reduce((s, f) => s + f.count, 0);
  const weak = findWeakWords(transcript, language);

  const inBand = wpm >= 130 && wpm <= 160;
  const clarity = clamp(88 - fillerTotal * 6 - (words < 20 ? 15 : 0));
  const structure = clamp(transcript.includes(".") || transcript.includes(",") ? 78 : 55);
  const concision = clamp(
    duration_s > 0 && words / duration_s > 3.5 ? 60 : 82 - Math.max(0, words - 180) / 4
  );
  const vocabulary = clamp(80 - weak.length * 8);
  const confidence = clamp(75 + (inBand ? 12 : -Math.abs(145 - wpm) / 4) - fillerTotal * 4);
  const impact = clamp((clarity + structure + vocabulary + confidence) / 4);
  const overall = clamp(
    clarity * 0.2 +
      structure * 0.2 +
      concision * 0.15 +
      vocabulary * 0.15 +
      confidence * 0.15 +
      impact * 0.15
  );

  const tip =
    fillerTotal > 2
      ? language.startsWith("fr")
        ? "Remplacez chaque hésitation par un silence d'une seconde — l'autorité naît du vide maîtrisé."
        : "Replace every hesitation with a one-second pause — authority lives in controlled silence."
      : !inBand
        ? language.startsWith("fr")
          ? "Visez 140 mots/min : ralentissez les chiffres, accélérez les transitions."
          : "Aim for 140 wpm: slow down on numbers, speed up on transitions."
        : language.startsWith("fr")
          ? "Ouvrez par la conclusion dès la première phrase (Pyramid Principle)."
          : "Lead with the conclusion in your first sentence (Pyramid Principle).";

  const ceo_rewrite = language.startsWith("fr")
    ? `Voici la version resserrée : ${transcript
        .replace(/\b(euh|heu|du coup|en fait|genre|voilà)\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim()}`
    : `Tighter version: ${transcript
        .replace(/\b(uh|um|like|you know|basically|actually)\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim()}`;

  return {
    scores: {
      clarity,
      structure,
      concision,
      vocabulary,
      confidence,
      impact,
      overall,
    },
    feedback: {
      filler_words: fillers,
      wpm,
      wpm_target: [130, 160],
      weak_words: weak,
      ceo_rewrite,
      tip,
    },
  };
}
