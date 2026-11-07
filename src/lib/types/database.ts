/**
 * Typed mirror of the Supabase schema (Phase 1).
 * Keep in sync with supabase/migrations/001_initial_schema.sql
 */

export type ExerciseType =
  | "impromptu"
  | "pitch"
  | "board_qa"
  | "storytelling"
  | "articulation"
  | "posture";

export type AppLanguage = "fr" | "en";

export type UserGoal =
  | "meetings"
  | "presentations"
  | "investor_pitch"
  | "media";

export type UserLevel = "beginner" | "intermediate" | "advanced";

export type Fear =
  | "stuttering"
  | "losing_thread"
  | "filler_words"
  | "lack_of_authority";

export type SpeakingContext = "board" | "team" | "clients" | "stage";

export type MediaPreference = "audio" | "video" | "both";

export interface Profile {
  id: string;
  name: string | null;
  goal: UserGoal | null;
  level: UserLevel | null;
  language: AppLanguage;
  minutes_per_day: 5 | 10 | 20 | null;
  fears: Fear[];
  speaking_context: SpeakingContext | null;
  media_preference: MediaPreference | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

/** Payload collected by the 10-step onboarding wizard. */
export interface OnboardingAnswers {
  name: string;
  goal: UserGoal;
  level: UserLevel;
  language: AppLanguage;
  primaryFear: Fear;
  fears: Fear[];
  minutes_per_day: 5 | 10 | 20;
  speaking_context: SpeakingContext;
  media_preference: MediaPreference;
}

export interface PlanDay {
  day: number;
  title: string;
  focus: string;
  exercise_ids: string[];
  minutes: number;
}

export interface Plan {
  id: string;
  user_id: string;
  start_date: string;
  days: PlanDay[];
  summary: string | null;
  created_at: string;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  title: string;
  prompt: string;
  duration_s: number;
  prep_s: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  language: AppLanguage;
  tips: string | null;
  created_at: string;
}

/** Six speaking axes + overall (0–100). */
export interface SessionScores {
  clarity: number;
  structure: number;
  concision: number;
  vocabulary: number;
  confidence: number;
  impact: number;
  overall: number;
}

export interface FillerWordCount {
  word: string;
  count: number;
}

export interface WeakWordSuggestion {
  original: string;
  suggestion: string;
}

export interface PostureFeedback {
  head_shoulder_alignment: number;
  eye_contact: number;
  hands_visible: number;
  notes: string;
}

export interface SessionFeedback {
  filler_words: FillerWordCount[];
  wpm: number;
  wpm_target: [number, number];
  weak_words: WeakWordSuggestion[];
  ceo_rewrite: string;
  tip: string;
  posture?: PostureFeedback;
}

export interface Session {
  id: string;
  user_id: string;
  exercise_id: string | null;
  media_url: string | null;
  media_kind: "audio" | "video" | null;
  transcript: string | null;
  scores: SessionScores | null;
  feedback: SessionFeedback | null;
  duration_s: number | null;
  created_at: string;
}

export interface Streak {
  user_id: string;
  current: number;
  best: number;
  last_session_date: string | null;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

/** Supabase Database typing shape used by the JS client. */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          name?: string | null;
          goal?: UserGoal | null;
          level?: UserLevel | null;
          language?: AppLanguage;
          minutes_per_day?: 5 | 10 | 20 | null;
          fears?: Fear[];
          speaking_context?: SpeakingContext | null;
          media_preference?: MediaPreference | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          goal?: UserGoal | null;
          level?: UserLevel | null;
          language?: AppLanguage;
          minutes_per_day?: 5 | 10 | 20 | null;
          fears?: Fear[];
          speaking_context?: SpeakingContext | null;
          media_preference?: MediaPreference | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: Relationship[];
      };
      plans: {
        Row: Plan;
        Insert: {
          id?: string;
          user_id: string;
          start_date?: string;
          days?: PlanDay[] | Json;
          summary?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          start_date?: string;
          days?: PlanDay[] | Json;
          summary?: string | null;
          created_at?: string;
        };
        Relationships: Relationship[];
      };
      exercises: {
        Row: Exercise;
        Insert: {
          id?: string;
          type: ExerciseType;
          title: string;
          prompt: string;
          duration_s: number;
          prep_s?: number;
          difficulty?: number;
          language?: AppLanguage;
          tips?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: ExerciseType;
          title?: string;
          prompt?: string;
          duration_s?: number;
          prep_s?: number;
          difficulty?: number;
          language?: AppLanguage;
          tips?: string | null;
          created_at?: string;
        };
        Relationships: Relationship[];
      };
      sessions: {
        Row: Session;
        Insert: {
          id?: string;
          user_id: string;
          exercise_id?: string | null;
          media_url?: string | null;
          media_kind?: "audio" | "video" | null;
          transcript?: string | null;
          scores?: SessionScores | Json | null;
          feedback?: SessionFeedback | Json | null;
          duration_s?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exercise_id?: string | null;
          media_url?: string | null;
          media_kind?: "audio" | "video" | null;
          transcript?: string | null;
          scores?: SessionScores | Json | null;
          feedback?: SessionFeedback | Json | null;
          duration_s?: number | null;
          created_at?: string;
        };
        Relationships: Relationship[];
      };
      streaks: {
        Row: Streak;
        Insert: {
          user_id: string;
          current?: number;
          best?: number;
          last_session_date?: string | null;
        };
        Update: {
          user_id?: string;
          current?: number;
          best?: number;
          last_session_date?: string | null;
        };
        Relationships: Relationship[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      exercise_type: ExerciseType;
      app_language: AppLanguage;
      user_goal: UserGoal;
      user_level: UserLevel;
    };
    CompositeTypes: Record<string, never>;
  };
};
