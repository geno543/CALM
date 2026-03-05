// ── API Response Types ────────────────────────────────────────────────────────

export interface BKTState {
  P_mastery: number;
  P_guess:   number;
  P_slip:    number;
}

export interface StudentState {
  bkt:              BKTState;
  chapter_mastery:  Record<string, BKTState>;
  level:            number;
  level_label:      string;
  current_chapter:  string;
  following_action: string;
  streak_days:      number;
  total_hints:      number;
  learning_mode:    boolean;
}

export interface ChatMessage {
  id:        string;
  role:      'user' | 'assistant' | 'system';
  content:   string;
  timestamp: string;
}

export interface TokenPayload {
  access_token: string;
  token_type:   string;
}

export interface User {
  id:        string;
  username:  string;
  email:     string;
  full_name: string;
}

export interface StreamMeta {
  mode:          string;
  eval?: {
    evaluated:      boolean;
    is_correct:     boolean | null;
    mastery_before: number  | null;
    mastery_after:  number  | null;
  };
  student_state: {
    bkt:             BKTState;
    chapter_mastery: Record<string, BKTState>;
    level:           number;
    level_label:     string;
    current_chapter: string;
    streak_days:     number;
    total_hints:     number;
  };
}

// ── Chapter info ──────────────────────────────────────────────────────────────

export const CHAPTERS = [
  { file: 'functions.pdf',      label: 'Functions',          labelAr: 'الدوال',               icon: 'f(x)' },
  { file: 'limits.pdf',         label: 'Limits',             labelAr: 'النهايات',              icon: 'lim' },
  { file: 'derivatives.pdf',    label: 'Derivatives',        labelAr: 'المشتقات',              icon: 'd/dx' },
  { file: 'derivative_apps.pdf',label: 'Derivative Apps',    labelAr: 'تطبيقات المشتقة',      icon: 'f\'(x)' },
  { file: 'integrals.pdf',      label: 'Integrals',          labelAr: 'التكاملات',            icon: '∫' },
  { file: 'integrals_apps.pdf', label: 'Integral Apps',      labelAr: 'تطبيقات التكامل',      icon: '∫dx' },
] as const;

export type ChapterFile = typeof CHAPTERS[number]['file'];

// ── Level colours ─────────────────────────────────────────────────────────────

export const LEVEL_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: '#1A2535', text: '#8B949E', border: '#30363D' },
  2: { bg: '#1A2535', text: '#58A6FF', border: '#1F6FEB' },
  3: { bg: '#1A2B1A', text: '#3DDC97', border: '#238636' },
  4: { bg: '#2B2A1A', text: '#F0A04B', border: '#9E6A03' },
  5: { bg: '#2B1F1A', text: '#F0A04B', border: '#BD561D' },
  6: { bg: '#2B1A2B', text: '#D2A8FF', border: '#8957E5' },
  7: { bg: '#2B1A1A', text: '#FF7B72', border: '#F85149' },
};
