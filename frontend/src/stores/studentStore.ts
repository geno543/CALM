import { create } from 'zustand';
import type { StudentState } from '../types';
import { studentApi } from '../lib/api';

const DEFAULT_STATE: StudentState = {
  bkt:              { P_mastery: 0.10, P_guess: 0.25, P_slip: 0.10 },
  chapter_mastery:  {},
  level:            1,
  level_label:      'Intuitive Primitive',
  current_chapter:  'functions.pdf',
  following_action: '',
  streak_days:      1,
  total_hints:      0,
  learning_mode:    true,
};

interface StudentStore {
  state:     StudentState;
  loading:   boolean;
  update:    (partial: Partial<Omit<StudentState, 'following_action'>>) => void;
  refresh:   () => Promise<void>;
  reset:     () => Promise<void>;
  setMode:   (v: boolean) => Promise<void>;
}

export const useStudentStore = create<StudentStore>((set) => ({
  state:   DEFAULT_STATE,
  loading: false,

  update: (partial) =>
    set((s) => ({
      state: { ...s.state, ...partial },
    })),

  refresh: async () => {
    try {
      set({ loading: true });
      const { data } = await studentApi.getState();
      set({ state: { ...DEFAULT_STATE, ...data, bkt: data?.bkt ?? DEFAULT_STATE.bkt }, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  reset: async () => {
    await studentApi.resetState();
    set({ state: DEFAULT_STATE });
  },

  setMode: async (v) => {
    const { data } = await studentApi.setMode(v);
    set({ state: { ...DEFAULT_STATE, ...data, bkt: data?.bkt ?? DEFAULT_STATE.bkt } });
  },
}));
