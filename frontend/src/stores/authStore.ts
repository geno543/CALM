import { create } from 'zustand';
import type { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthStore {
  user:     User | null;
  isAuthed: boolean;
  loading:  boolean;
  setUser:  (user: User | null) => void;
  logout:   () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  (set) => ({
    user:     null,
    isAuthed: false,
    loading:  true,

    setUser: (user) => set({ user, isAuthed: !!user, loading: false }),

    logout: async () => {
      await supabase.auth.signOut();
      set({ user: null, isAuthed: false, loading: false });
    },
  })
);

// Initialize immediately from cached session (resolves from localStorage — no network round-trip)
supabase.auth.getSession().then(({ data: { session } }) => {
  const u = session?.user;
  useAuthStore.getState().setUser(
    u ? { id: u.id, username: u.email ?? u.id, email: u.email ?? '', full_name: u.user_metadata?.full_name ?? '' } : null
  );
});

// Keep in sync on sign-in / sign-out / token refresh.
// IMPORTANT: only clear the user on an explicit SIGNED_OUT event.
// TOKEN_REFRESHED fires with a null session momentarily between old and new
// tokens — treating that as a logout would kick the user out mid-stream.
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || (event as string) === 'USER_DELETED') {
    useAuthStore.getState().setUser(null);
  } else if (session?.user) {
    const u = session.user;
    useAuthStore.getState().setUser(
      { id: u.id, username: u.email ?? u.id, email: u.email ?? '', full_name: u.user_metadata?.full_name ?? '' }
    );
}
});

// Safety fallback: if getSession() never resolves (e.g. network issue), stop blocking after 3s
setTimeout(() => {
  if (useAuthStore.getState().loading) {
    useAuthStore.getState().setUser(null);
  }
}, 3000);
