/**
 * Seed library — 42 executive speaking exercises (21 FR + 21 EN).
 * Used by supabase/seed/exercises.sql generation and local fallbacks.
 */
import type { ExerciseType, AppLanguage } from "@/lib/types/database";

export interface ExerciseSeed {
  type: ExerciseType;
  title: string;
  prompt: string;
  duration_s: number;
  prep_s: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  language: AppLanguage;
  tips: string;
}

export const EXERCISE_SEEDS: ExerciseSeed[] = [
  // ── Impromptu FR ──────────────────────────────────────────────────────────
  {
    type: "impromptu",
    title: "Priorité du trimestre",
    prompt:
      "On vous demande à brûle-pourpoint : quelle est la priorité n°1 de votre équipe ce trimestre, et pourquoi ? Structurez en 3 points.",
    duration_s: 90,
    prep_s: 60,
    difficulty: 2,
    language: "fr",
    tips: "Ouvrez par la conclusion, puis justifiez.",
  },
  {
    type: "impromptu",
    title: "Risque imprévu",
    prompt:
      "Un risque majeur vient d'émerger sur votre projet. En 90 secondes, expliquez le risque, l'impact et votre plan de mitigation.",
    duration_s: 90,
    prep_s: 60,
    difficulty: 3,
    language: "fr",
    tips: "Restez factuel : risque → impact → action.",
  },
  {
    type: "impromptu",
    title: "Décision sous contrainte",
    prompt:
      "Vous devez trancher entre deux options budgétaires contradictoires. Présentez votre décision et vos critères en 90 secondes.",
    duration_s: 90,
    prep_s: 60,
    difficulty: 3,
    language: "fr",
    tips: "Nommez clairement le trade-off.",
  },
  {
    type: "impromptu",
    title: "Feedback difficile",
    prompt:
      "Un collaborateur senior a manqué une échéance critique. Préparez 60 s, puis donnez le feedback oral en 90 s.",
    duration_s: 90,
    prep_s: 60,
    difficulty: 4,
    language: "fr",
    tips: "Fait → Impact → Attente → Soutien.",
  },

  // ── Impromptu EN ──────────────────────────────────────────────────────────
  {
    type: "impromptu",
    title: "Quarter priority",
    prompt:
      "Cold call: what is your team's #1 priority this quarter, and why? Structure your answer in three points.",
    duration_s: 90,
    prep_s: 60,
    difficulty: 2,
    language: "en",
    tips: "Lead with the conclusion, then justify.",
  },
  {
    type: "impromptu",
    title: "Emerging risk",
    prompt:
      "A major risk just surfaced on your project. In 90 seconds, explain the risk, impact, and mitigation plan.",
    duration_s: 90,
    prep_s: 60,
    difficulty: 3,
    language: "en",
    tips: "Stay factual: risk → impact → action.",
  },
  {
    type: "impromptu",
    title: "Constrained decision",
    prompt:
      "You must choose between two conflicting budget options. Present your decision and criteria in 90 seconds.",
    duration_s: 90,
    prep_s: 60,
    difficulty: 3,
    language: "en",
    tips: "Name the trade-off explicitly.",
  },

  // ── Pitch FR ──────────────────────────────────────────────────────────────
  {
    type: "pitch",
    title: "Pitch produit — conclusion d'abord",
    prompt:
      "Résumez votre produit / initiative en 30 secondes avec PREP : Point → Reason → Example → Point. Commencez par la conclusion.",
    duration_s: 30,
    prep_s: 30,
    difficulty: 2,
    language: "fr",
    tips: "Première phrase = le « so what » business.",
  },
  {
    type: "pitch",
    title: "Elevator pitch investisseurs",
    prompt:
      "Vous croisez un investisseur dans un ascenseur. Pitch de 30 s : problème, solution, traction, ask.",
    duration_s: 30,
    prep_s: 45,
    difficulty: 3,
    language: "fr",
    tips: "Un seul chiffre mémorable suffit.",
  },
  {
    type: "pitch",
    title: "Synthèse comex",
    prompt:
      "Le DG vous demande un résumé de 30 s de votre slide deck. Appliquez le Pyramid Principle.",
    duration_s: 30,
    prep_s: 30,
    difficulty: 3,
    language: "fr",
    tips: "Réponse → 2 arguments → preuve.",
  },
  {
    type: "pitch",
    title: "Annonce de changement",
    prompt:
      "Annoncez une réorganisation d'équipe en 30 secondes : décision, raison, prochaine étape.",
    duration_s: 30,
    prep_s: 30,
    difficulty: 4,
    language: "fr",
    tips: "Ton calme, phrases courtes, zéro jargon.",
  },

  // ── Pitch EN ──────────────────────────────────────────────────────────────
  {
    type: "pitch",
    title: "Product pitch — answer first",
    prompt:
      "Summarize your product/initiative in 30 seconds using PREP: Point → Reason → Example → Point. Lead with the conclusion.",
    duration_s: 30,
    prep_s: 30,
    difficulty: 2,
    language: "en",
    tips: "First sentence = the business 'so what'.",
  },
  {
    type: "pitch",
    title: "Investor elevator pitch",
    prompt:
      "You meet an investor in an elevator. 30-second pitch: problem, solution, traction, ask.",
    duration_s: 30,
    prep_s: 45,
    difficulty: 3,
    language: "en",
    tips: "One memorable metric is enough.",
  },
  {
    type: "pitch",
    title: "Exec summary",
    prompt:
      "Your CEO wants a 30-second summary of your deck. Apply the Pyramid Principle.",
    duration_s: 30,
    prep_s: 30,
    difficulty: 3,
    language: "en",
    tips: "Answer → 2 arguments → proof.",
  },

  // ── Board Q&A FR ──────────────────────────────────────────────────────────
  {
    type: "board_qa",
    title: "Pourquoi ce budget ?",
    prompt:
      "Question board : « Pourquoi demander 20 % de budget supplémentaire alors que le ROI n'est pas encore prouvé ? » Répondez en 45 s max.",
    duration_s: 45,
    prep_s: 20,
    difficulty: 4,
    language: "fr",
    tips: "Reconnaissez le point, puis ancrez sur les données.",
  },
  {
    type: "board_qa",
    title: "Échec de lancement",
    prompt:
      "« Votre dernier lancement a sous-performé de 30 %. Que s'est-il passé et que changez-vous ? » 45 s max.",
    duration_s: 45,
    prep_s: 20,
    difficulty: 4,
    language: "fr",
    tips: "Ownership d'abord, excuses ensuite, plan clair.",
  },
  {
    type: "board_qa",
    title: "Concurrence agressive",
    prompt:
      "« Un concurrent vient de baisser ses prix de 40 %. Quelle est votre réponse stratégique ? » 45 s.",
    duration_s: 45,
    prep_s: 20,
    difficulty: 3,
    language: "fr",
    tips: "Ne réagissez pas émotionnellement ; cadrez la différenciation.",
  },
  {
    type: "board_qa",
    title: "Risque réglementaire",
    prompt:
      "« Comment gérez-vous le risque réglementaire sur ce marché ? » Réponse board en 45 s.",
    duration_s: 45,
    prep_s: 20,
    difficulty: 3,
    language: "fr",
    tips: "Cadre → contrôles → propriétaire du risque.",
  },

  // ── Board Q&A EN ──────────────────────────────────────────────────────────
  {
    type: "board_qa",
    title: "Why this budget?",
    prompt:
      "Board question: 'Why ask for 20% more budget when ROI isn't proven yet?' Answer in 45s max.",
    duration_s: 45,
    prep_s: 20,
    difficulty: 4,
    language: "en",
    tips: "Acknowledge the concern, then anchor on data.",
  },
  {
    type: "board_qa",
    title: "Missed launch",
    prompt:
      "'Your last launch underperformed by 30%. What happened and what changes?' 45s max.",
    duration_s: 45,
    prep_s: 20,
    difficulty: 4,
    language: "en",
    tips: "Ownership first, then a clear plan.",
  },
  {
    type: "board_qa",
    title: "Aggressive competitor",
    prompt:
      "'A competitor just cut prices by 40%. What's your strategic response?' 45s.",
    duration_s: 45,
    prep_s: 20,
    difficulty: 3,
    language: "en",
    tips: "Don't react emotionally; frame differentiation.",
  },

  // ── Storytelling FR ───────────────────────────────────────────────────────
  {
    type: "storytelling",
    title: "Décision difficile en 3 actes",
    prompt:
      "Racontez une décision difficile en 3 actes (contexte / tension / résolution). 2 minutes max. Terminez par l'apprentissage.",
    duration_s: 120,
    prep_s: 45,
    difficulty: 3,
    language: "fr",
    tips: "Un personnage, un conflit, une leçon.",
  },
  {
    type: "storytelling",
    title: "Le moment où j'ai changé d'avis",
    prompt:
      "Racontez un moment où une donnée vous a fait changer de stratégie. Structure : avant → insight → après.",
    duration_s: 90,
    prep_s: 40,
    difficulty: 2,
    language: "fr",
    tips: "Montrez l'humilité intellectuelle, pas l'échec.",
  },
  {
    type: "storytelling",
    title: "Victoire d'équipe",
    prompt:
      "Racontez une victoire collective en mettant en avant le rôle des autres, pas le vôtre. 90 s.",
    duration_s: 90,
    prep_s: 30,
    difficulty: 2,
    language: "fr",
    tips: "Les leaders créditent ; ils ne se mettent pas au centre.",
  },
  {
    type: "storytelling",
    title: "Crise gérée",
    prompt:
      "Racontez comment vous avez géré une crise client ou produit. 3 actes, 2 minutes.",
    duration_s: 120,
    prep_s: 45,
    difficulty: 4,
    language: "fr",
    tips: "Tension palpable, résolution nette, leçon actionnable.",
  },

  // ── Storytelling EN ───────────────────────────────────────────────────────
  {
    type: "storytelling",
    title: "Hard decision in 3 acts",
    prompt:
      "Tell a hard decision story in 3 acts (context / tension / resolution). 2 minutes max. End with the lesson.",
    duration_s: 120,
    prep_s: 45,
    difficulty: 3,
    language: "en",
    tips: "One character, one conflict, one lesson.",
  },
  {
    type: "storytelling",
    title: "When data changed my mind",
    prompt:
      "Tell a moment when data made you change strategy. Structure: before → insight → after.",
    duration_s: 90,
    prep_s: 40,
    difficulty: 2,
    language: "en",
    tips: "Show intellectual humility, not failure.",
  },
  {
    type: "storytelling",
    title: "Team win",
    prompt:
      "Tell a collective win while elevating others, not yourself. 90s.",
    duration_s: 90,
    prep_s: 30,
    difficulty: 2,
    language: "en",
    tips: "Leaders credit; they don't center themselves.",
  },

  // ── Articulation FR ───────────────────────────────────────────────────────
  {
    type: "articulation",
    title: "Virelangue exécutif",
    prompt:
      "Lisez à voix haute, clairement, à ~140 mots/min : « Six sociétés stratégiques surveillent sans cesse les cycles successifs de croissance. » Répétez 3 fois, puis paraphrasez le sens en une phrase CEO.",
    duration_s: 60,
    prep_s: 15,
    difficulty: 2,
    language: "fr",
    tips: "Articulez les sibilantes ; posez-vous entre les groupes.",
  },
  {
    type: "articulation",
    title: "Lecture chiffrée",
    prompt:
      "Lisez ce briefing à voix haute : « Le CA a progressé de 12,4 % à 48,7 M€, avec une marge EBITDA de 18,2 % et un churn réduit de 230 points de base. » Puis reformulez sans jargon.",
    duration_s: 60,
    prep_s: 20,
    difficulty: 3,
    language: "fr",
    tips: "Les chiffres se disent lentement, une pause après chaque.",
  },
  {
    type: "articulation",
    title: "Rythme et silences",
    prompt:
      "Prononcez 4 phrases clés sur votre vision. Insérez un silence d'1 seconde après chaque phrase. Objectif : rythme posé, 130–150 mots/min.",
    duration_s: 75,
    prep_s: 30,
    difficulty: 3,
    language: "fr",
    tips: "Le silence = autorité. Ne le comblez pas.",
  },
  {
    type: "articulation",
    title: "Éliminer les tics",
    prompt:
      "Présentez votre rôle en 60 s sans aucun « euh », « du coup », « en fait », « voilà ». Si vous hésitez, silence plutôt que tic.",
    duration_s: 60,
    prep_s: 20,
    difficulty: 4,
    language: "fr",
    tips: "Ralentissez volontairement de 10 %.",
  },

  // ── Articulation EN ───────────────────────────────────────────────────────
  {
    type: "articulation",
    title: "Executive tongue twister",
    prompt:
      "Read clearly at ~140 wpm: 'Strategic stakeholders steadily scrutinize successive cycles of scalable growth.' Repeat 3 times, then paraphrase in one CEO sentence.",
    duration_s: 60,
    prep_s: 15,
    difficulty: 2,
    language: "en",
    tips: "Hit the sibilants; pause between thought groups.",
  },
  {
    type: "articulation",
    title: "Numbers aloud",
    prompt:
      "Read this briefing aloud: 'Revenue grew 12.4% to $48.7M, with 18.2% EBITDA margin and churn down 230 basis points.' Then restate without jargon.",
    duration_s: 60,
    prep_s: 20,
    difficulty: 3,
    language: "en",
    tips: "Say numbers slowly; pause after each.",
  },
  {
    type: "articulation",
    title: "Pace and pauses",
    prompt:
      "Deliver 4 key lines about your vision. Insert a 1-second pause after each. Target: composed pace, 130–150 wpm.",
    duration_s: 75,
    prep_s: 30,
    difficulty: 3,
    language: "en",
    tips: "Silence equals authority. Don't fill it.",
  },

  // ── Posture FR ────────────────────────────────────────────────────────────
  {
    type: "posture",
    title: "Check caméra — alignement",
    prompt:
      "Placez-vous face caméra. Épaules alignées, menton parallèle au sol, regard objectif. Présentez-vous en 45 s en maintenant cette posture.",
    duration_s: 45,
    prep_s: 20,
    difficulty: 1,
    language: "fr",
    tips: "Caméra à hauteur des yeux, pas en plongée.",
  },
  {
    type: "posture",
    title: "Gestes visibles",
    prompt:
      "Présentez 3 priorités en gardant les mains visibles dans le cadre. Gestes ouverts, pas de bras croisés.",
    duration_s: 60,
    prep_s: 15,
    difficulty: 2,
    language: "fr",
    tips: "Gestes au-dessus de la taille, dans le cadre.",
  },
  {
    type: "posture",
    title: "Regard caméra",
    prompt:
      "Parlez 60 s en maintenant le contact visuel avec la lentille (pas l'écran). Comptez mentalement les ruptures de regard.",
    duration_s: 60,
    prep_s: 10,
    difficulty: 3,
    language: "fr",
    tips: "Notes hors caméra si besoin ; yeux sur la lentille.",
  },
  {
    type: "posture",
    title: "Ancrage avant prise de parole",
    prompt:
      "Avant de parler : 3 respirations, pieds ancrés, épaules basses. Puis ouvrez une réunion virtuelle en 45 s.",
    duration_s: 45,
    prep_s: 30,
    difficulty: 2,
    language: "fr",
    tips: "Le corps calme le débit.",
  },

  // ── Posture EN ────────────────────────────────────────────────────────────
  {
    type: "posture",
    title: "Camera check — alignment",
    prompt:
      "Face the camera. Shoulders level, chin parallel to floor, eyes on lens. Introduce yourself in 45s while holding that posture.",
    duration_s: 45,
    prep_s: 20,
    difficulty: 1,
    language: "en",
    tips: "Camera at eye level — never looking down.",
  },
  {
    type: "posture",
    title: "Visible gestures",
    prompt:
      "Present 3 priorities while keeping hands visible in frame. Open gestures, no crossed arms.",
    duration_s: 60,
    prep_s: 15,
    difficulty: 2,
    language: "en",
    tips: "Gesture above the waist, inside the frame.",
  },
  {
    type: "posture",
    title: "Eye contact to lens",
    prompt:
      "Speak for 60s maintaining eye contact with the lens (not the screen). Mentally count gaze breaks.",
    duration_s: 60,
    prep_s: 10,
    difficulty: 3,
    language: "en",
    tips: "Notes off-camera if needed; eyes on the lens.",
  },
];

export const EXERCISE_SEED_COUNT = EXERCISE_SEEDS.length;
