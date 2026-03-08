import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { useAuthStore }     from './stores/authStore';
import Landing              from './pages/Landing';
import AuthPage             from './pages/AuthPage';
import ChatLayout           from './pages/ChatLayout';
import ProgressMap          from './pages/ProgressMap';
import SubjectSelect        from './pages/SubjectSelect';

// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, message: err.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0D1117', color: '#F0F6FC', gap: 12, padding: 24 }}>
          <div style={{ fontSize: 32, color: '#F0A04B' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <p style={{ fontSize: 16, fontWeight: 600 }}>Something went wrong</p>
          <p style={{ fontSize: 13, color: '#8B949E', textAlign: 'center', maxWidth: 400 }}>{this.state.message}</p>
          <button
            onClick={() => { this.setState({ hasError: false, message: '' }); window.location.href = '/'; }}
            style={{ marginTop: 8, padding: '8px 20px', background: '#238636', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
          >
            Return to home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthed, loading } = useAuthStore();
  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D1117' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[0, 0.15, 0.3].map((d) => (
            <div key={d} style={{ width: 8, height: 8, borderRadius: '50%', background: '#58A6FF', animation: `pulse 0.9s ${d}s infinite` }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:.3;transform:translateY(0)} 50%{opacity:1;transform:translateY(-4px)} }`}</style>
      </div>
    );
  }
  return isAuthed ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <LanguageProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/"         element={<Landing />} />
            <Route path="/login"    element={<AuthPage />} />
            <Route
              path="/subjects"
              element={
                <ProtectedRoute>
                  <SubjectSelect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatLayout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <ProgressMap />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    </LanguageProvider>
  );
}
