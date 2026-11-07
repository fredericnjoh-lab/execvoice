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

export interface Profile {
  id: string;
  name: string | null;
  goal: UserGoal | null;
  level: UserLevel | null;
  language: AppLanguage;
  minutes_per_day: 5 | 10 | 20 | null;
  fears: Fear[];
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
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

/** Supabase Database typing shape used by the JS client. */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      plans: {
        Row: Plan;
        Insert: Omit<Plan, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Plan>;
        Relationships: [];
      };
      exercises: {
        Row: Exercise;
        Insert: Omit<Exercise, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Exercise>;
        Relationships: [];
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Session>;
        Relationships: [];
      };
      streaks: {
        Row: Streak;
        Insert: Partial<Streak> & { user_id: string };
        Update: Partial<Streak>;
        Relationships: [];
      };
    };
    Enums: {
      exercise_type: ExerciseType;
      app_language: AppLanguage;
      user_goal: UserGoal;
      user_level: UserLevel;
    };
  };
};
