import axios from 'axios';
import { supabase } from './supabase';

// In dev the Vite proxy is for SSE only; axios calls the backend directly.
// In production (Vercel) VITE_BACKEND_URL is set to the Railway URL.
const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach Supabase access token to every request
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout if backend returns 401 (deleted user, expired token, etc.)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await supabase.auth.signOut();
    }
    return Promise.reject(error);
  }
);

// ── Student ───────────────────────────────────────────────────────────────────

export const studentApi = {
  getState:    () => api.get('/student/state'),
  resetState:  () => api.post('/student/reset'),
  setChapter:  (chapter: string) => api.patch('/student/chapter', { chapter }),
  setMode:     (learning_mode: boolean) => api.patch('/student/mode', { learning_mode }),
};

// ── Chat ──────────────────────────────────────────────────────────────────────

export const chatApi = {
  history: () => api.get('/chat/history'),
};

export default api;
