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

// On 401: try refreshing the Supabase session first (token may have just expired).
// Only sign the user out if the refresh itself fails — avoids kicking users out
// during long sessions (e.g. after leveling up, right when the JWT rotates).
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { error: refreshError, data } = await supabase.auth.refreshSession();
      if (!refreshError && data.session?.access_token) {
        // Retry the original request with the fresh token
        originalRequest.headers['Authorization'] = `Bearer ${data.session.access_token}`;
        return api(originalRequest);
      }
      // Refresh failed — session is truly dead
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
  summary: () => api.post('/chat/summary'),
};

export default api;
