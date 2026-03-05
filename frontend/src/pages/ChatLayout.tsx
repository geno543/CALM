import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore }          from '../stores/authStore';
import { useChatStore }          from '../stores/chatStore';
import { useStudentStore }       from '../stores/studentStore';
import { useLang }               from '../contexts/LanguageContext';
import { useStream }             from '../hooks/useStream';
import { chatApi, studentApi }    from '../lib/api';
import MasteryPanel              from '../components/MasteryPanel';
import ChapterNav                from '../components/ChapterNav';
import MessageBubble             from '../components/MessageBubble';
import ChatInput                 from '../components/ChatInput';
import type { ChatMessage }      from '../types';
import { genId }                 from '../stores/chatStore';
import { LEVEL_COLORS, CHAPTERS } from '../types';

// ── Streaming bubble (live token accumulation) ───────────────────────────────
function StreamingBubble({ content }: { content: string }) {
  const fakeMsg: ChatMessage = {
    id: '_streaming', role: 'assistant', content, timestamp: '',
  };
  return <MessageBubble message={fakeMsg} streaming />;
}

// ── Session info panel (right sidebar) ───────────────────────────────────────
function SessionPanel() {
  const { state }   = useStudentStore();
  const { isAr }    = useLang();
  const colors      = LEVEL_COLORS[state.level] ?? LEVEL_COLORS[1];
  const { reset }   = useStudentStore();
  const { clearHistory } = useChatStore();
  const [confirm, setConfirm] = useState(false);

  const handleReset = async () => {
    if (!confirm) { setConfirm(true); return; }
    await reset();
    clearHistory();
    setConfirm(false);
  };

  return (
    <div className="space-y-4">
      {/* Current chapter */}
      <div
        className="rounded-xl p-4 space-y-2"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
          {isAr ? 'الفصل الحالي' : 'Active Chapter'}
        </p>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
          {state.current_chapter.replace('.pdf', '').replace(/_/g, ' ')}
        </p>
      </div>

      {/* Level badge */}
      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{ background: colors.bg, border: `1px solid ${colors.border}` }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base"
          style={{ background: colors.border, color: colors.text }}
        >
          {state.level}
        </div>
        <div>
          <p className="text-xs font-semibold" style={{ color: colors.text }}>
            {isAr ? 'المستوى' : 'Level'} {state.level}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{state.level_label}</p>
        </div>
      </div>

      {/* Reset */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-muted)' }}>
          {isAr ? 'الجلسة' : 'Session'}
        </p>
        <button
          onClick={handleReset}
          className="w-full py-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
          style={{
            background:  confirm ? '#2B1A1A' : 'var(--color-surface-2)',
            border:      `1px solid ${confirm ? 'var(--color-danger)' : 'var(--color-border)'}`,
            color:       confirm ? 'var(--color-danger)' : 'var(--color-muted)',
          }}
        >
          {confirm
            ? (isAr ? 'تأكيد الإعادة' : 'Confirm Reset')
            : (isAr ? 'إعادة الجلسة' : 'Reset Session')}
        </button>
        {confirm && (
          <button
            onClick={() => setConfirm(false)}
            className="w-full mt-2 py-1.5 rounded-lg text-xs cursor-pointer"
            style={{ color: 'var(--color-muted)' }}
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Chat Layout ──────────────────────────────────────────────────────────
export default function ChatLayout() {
  const navigate     = useNavigate();
  const location     = useLocation();
  const { user, logout, isAuthed } = useAuthStore();

  // Lock body scroll while chat is mounted; restore on unmount
  useEffect(() => {
    document.body.classList.add('chat-page');
    return () => document.body.classList.remove('chat-page');
  }, []);
  const { messages, streamingContent, isStreaming, historyLoaded, setMessages, clearHistory, setHistoryLoaded } = useChatStore();
  const { refresh, setMode } = useStudentStore();
  const learningMode = useStudentStore(s => s.state.learning_mode);
  const { isAr, toggle, lang }     = useLang();
  const { send }     = useStream();

  const bottomRef       = useRef<HTMLDivElement>(null);
  // Track lg breakpoint reactively to avoid stale window.innerWidth snapshot
  const [isLg, setIsLg] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsLg(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightOpen,   setRightOpen]   = useState(false);
  const [draft,       setDraft]       = useState('');

  // Load history & student state on mount (runs once, guarded by historyLoaded)
  useEffect(() => {
    if (!isAuthed || historyLoaded) return;
    const loadData = async () => {
      try {
        const { data } = await chatApi.history();
        if (data.history?.length) {
          const parsed: ChatMessage[] = data.history.map((h: { role: string; content: string }) => ({
            id:        genId(),
            role:      h.role as ChatMessage['role'],
            content:   h.content,
            timestamp: new Date().toISOString(),
          }));
          // Only overwrite if no in-session messages exist (prevents wiping optimistic messages on re-mount)
          if (useChatStore.getState().messages.length === 0) {
            // Insert context window marker if history is long
            const CONTEXT_WINDOW = 20;
            if (parsed.length > CONTEXT_WINDOW) {
              const markerIdx = parsed.length - CONTEXT_WINDOW;
              const marker: ChatMessage = {
                id:        genId(),
                role:      'system',
                content:   '─── Context window starts here ───',
                timestamp: parsed[markerIdx].timestamp,
              };
              parsed.splice(markerIdx, 0, marker);
            }
            setMessages(parsed);
          }
        }
      } catch { /* fresh session */ }
      await refresh();
      setHistoryLoaded(true);
    };
    loadData();
  }, [isAuthed, historyLoaded, setMessages, refresh]);

  // Handle chapter switch from ProgressMap — runs whenever location.state changes,
  // works both on fresh mount AND when ChatLayout is already mounted (historyLoaded=true).
  useEffect(() => {
    const startChapter = (location.state as { startChapter?: string } | null)?.startChapter;
    if (!startChapter || !CHAPTERS.some(c => c.file === startChapter)) return;
    // Silently clear location state via the browser history API — avoids triggering
    // a React Router navigation event which can cause ChatLayout to remount and blank the chat.
    window.history.replaceState({}, '', '/chat');
    (async () => {
      try {
        await studentApi.setChapter(startChapter);
        await refresh();
      } catch { /* best-effort */ }
    })();
  }, [location.state]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = useCallback((text: string) => {
    // Snap to bottom instantly before send so the smooth-scroll during streaming doesn't feel jarring
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
    send(text);
  }, [send]);

  const handleLogout = () => {
    logout();
    clearHistory();
    navigate('/', { replace: true });
  };

  const handleChapterClick = (suggestion: string) => {
    setDraft(suggestion);
    setSidebarOpen(false);
  };

  if (!isAuthed) return null;

  return (
    <div
      className="h-dvh flex overflow-hidden"
      style={{ background: 'var(--color-ink)' }}
    >
      {/* ── Mobile sidebar backdrop ────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-30 lg:hidden"
            style={{ background: '#00000088' }}
          />
        )}
      </AnimatePresence>

      {/* ── Left Sidebar ───────────────────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen || isLg ? 0 : -999 }}
        className="fixed lg:relative z-40 lg:z-auto h-full w-72 flex flex-col gap-4 p-4 overflow-y-auto shrink-0"
        style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}
      >
        {/* Brand */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-semibold tracking-tight text-sm">CALM</span>
          </Link>
          <button
            onClick={toggle}
            className="text-xs px-2 py-1 rounded-md cursor-pointer"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
          >
            {lang.toUpperCase()}
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-2)' }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm shrink-0"
            style={{ background: 'var(--color-primary-dim)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}
          >
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{user?.full_name || user?.username}</p>
            <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>{user?.username}</p>
          </div>
        </div>

        {/* BKT Mastery */}
        <MasteryPanel />

        {/* Chapters */}
        <ChapterNav onChapterClick={handleChapterClick} />

        {/* Logout */}
        <div className="mt-auto space-y-2">
          {/* Progress Map link */}
          <Link
            to="/progress"
            className="flex items-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-medium no-underline transition-colors"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            {isAr ? 'خريطة التقدم' : 'Progress Map'}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
          >
            {isAr ? 'تسجيل الخروج' : 'Sign Out'}
          </button>
        </div>
      </motion.aside>

      {/* ── Main Chat Area ────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-ink)' }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect y="0" width="14" height="1.5" rx="1"/>
                <rect y="6" width="14" height="1.5" rx="1"/>
                <rect y="12" width="14" height="1.5" rx="1"/>
              </svg>
            </button>
            <div>
              <h1 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                MCSE — {isAr ? 'المحرك السقراطي' : 'Socratic Engine'}
              </h1>
              <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                {isAr ? 'Thomas\'s Calculus · الطبعة 14' : 'Thomas\'s Calculus · 14th Edition'}
              </p>
            </div>
          </div>

          {/* Mode toggle */}
          <button
            onClick={() => setMode(!learningMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all"
            style={{
              background: learningMode ? 'var(--color-primary-dim)' : 'var(--color-surface)',
              border:     `1px solid ${learningMode ? 'var(--color-primary)' : 'var(--color-border)'}`,
              color:      learningMode ? 'var(--color-primary)' : 'var(--color-muted)',
            }}
            title={learningMode
              ? (isAr ? 'وضع التعلم السقراطي — انقر للتبديل إلى الإجابات المباشرة' : 'Socratic mode — click for direct answers')
              : (isAr ? 'وضع الإجابات المباشرة — انقر للعودة للتعلم' : 'Direct mode — click to return to Socratic')}
          >
            {learningMode ? '🎓' : '💬'}{' '}
            {isAr ? (learningMode ? 'تعلم' : 'مباشر') : (learningMode ? 'Learning' : 'Direct')}
          </button>

          {/* Right panel toggle */}
          <button
            onClick={() => setRightOpen((v) => !v)}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer"
            style={{
              background:  rightOpen ? 'var(--color-primary-dim)' : 'var(--color-surface)',
              border:      `1px solid ${rightOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
              color:       rightOpen ? 'var(--color-primary)' : 'var(--color-muted)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2h12v1H2zm0 5h8v1H2zm0 5h10v1H2z"/>
            </svg>
            {isAr ? 'التفاصيل' : 'Session'}
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {/* Mode banner — shown only in direct answer mode */}
          {!learningMode && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-3"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
            >
              <span style={{ color: '#F0A04B' }}>💬</span>
              <span>
                {isAr
                  ? 'وضع الإجابات المباشرة — ستحصل على إجابات كاملة ومباشرة بدون أسلوب سقراطي.'
                  : 'Direct Answer Mode — full explanations without Socratic questioning.'}
              </span>
            </div>
          )}
          {messages.length === 0 && !isStreaming && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center py-12"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-2xl mb-5"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
              >
                C
              </div>
              <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                {isAr ? 'مرحباً بك في CALM' : 'Welcome to CALM'}
              </h2>
              <p className="text-sm max-w-sm" style={{ color: 'var(--color-muted)' }}>
                {isAr
                  ? 'اسأل عن أي موضوع في الحساب. سيرشدك المحرك السقراطي خطوة بخطوة.'
                  : 'Ask about any calculus topic. The Socratic Engine will guide you step by step without giving direct answers.'}
              </p>
            </motion.div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isStreaming && streamingContent && (
            <StreamingBubble content={streamingContent} />
          )}

          {isStreaming && !streamingContent && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex gap-3 mb-4"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
              >
                C
              </div>
              <div className="flex items-center gap-1.5 px-4 py-3 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                {[0, 0.15, 0.3].map((delay) => (
                  <motion.div
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--color-primary)' }}
                    animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 0.9, delay }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Chat input */}
        <div className="px-4 pb-4 shrink-0">
          <ChatInput
            onSend={handleSend}
            externalDraft={draft}
            onDraftConsumed={() => setDraft('')}
          />
        </div>
      </main>

      {/* ── Right Session Panel ───────────────────────────────────────── */}
      <AnimatePresence>
        {rightOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="hidden xl:flex flex-col h-full overflow-hidden shrink-0"
            style={{ borderLeft: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
          >
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-muted)' }}>
                {isAr ? 'الجلسة' : 'Session Details'}
              </p>
              <SessionPanel />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
