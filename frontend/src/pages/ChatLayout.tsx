import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown             from 'react-markdown';
import remarkMath               from 'remark-math';
import rehypeKatex              from 'rehype-katex';
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
import DesmosPanel               from '../components/DesmosPanel';
import type { ChatMessage }      from '../types';
import { genId }                 from '../stores/chatStore';
import { LEVEL_COLORS, CHAPTERS } from '../types';

// ── Streaming bubble (live token accumulation) ───────────────────────────────
// Memoized so that the full message list does not re-render on every token.
const StreamingBubble = memo(function StreamingBubble({ content }: { content: string }) {
  const fakeMsg: ChatMessage = {
    id: '_streaming', role: 'assistant', content, timestamp: '',
  };
  return <MessageBubble message={fakeMsg} streaming />;
});

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
    <div className="space-y-0">
      {/* Active chapter */}
      <div className="py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <p className="text-[10px] font-black tracking-widest uppercase mb-1" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
          {isAr ? '// الفصل الحالي' : '// active chapter'}
        </p>
        <p className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
          {state.current_chapter.replace('.pdf', '').replace(/_/g, ' ')}
        </p>
      </div>

      {/* Level badge */}
      <div className="py-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div
          className="w-9 h-9 flex items-center justify-center font-black text-base"
          style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text, fontFamily: 'var(--font-mono)' }}
        >
          {state.level}
        </div>
        <div>
          <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: colors.text, fontFamily: 'var(--font-mono)' }}>
            {isAr ? 'مستوى' : 'LVL'} {state.level}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{state.level_label}</p>
        </div>
      </div>

      {/* Reset */}
      <div className="pt-3">
        <p className="text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)' }}>
          {isAr ? '// الجلسة' : '// session'}
        </p>
        <button
          onClick={handleReset}
          className="w-full py-2 text-[10px] font-black tracking-widest uppercase transition-all cursor-pointer"
          style={{
            background:  confirm ? '#2B1A1A' : 'transparent',
            border:      `1px solid ${confirm ? 'var(--color-danger)' : 'var(--color-border)'}`,
            color:       confirm ? 'var(--color-danger)' : 'var(--color-muted)',
            fontFamily:  'var(--font-mono)',
          }}
        >
          {confirm
            ? (isAr ? 'تأكيد الإعادة' : 'Confirm Reset')
            : (isAr ? 'إعادة الجلسة' : 'Reset Session')}
        </button>
        {confirm && (
          <button
            onClick={() => setConfirm(false)}
            className="w-full mt-1.5 py-1.5 text-[10px] font-bold tracking-widest uppercase cursor-pointer"
            style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}
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
  const { messages, streamingContent, isStreaming, isReasoning, historyLoaded, levelUpToasts, dismissLevelUpToast, openDesmos, setMessages, clearHistory, setHistoryLoaded } = useChatStore();
  const { refresh, setMode } = useStudentStore();
  const learningMode = useStudentStore(s => s.state.learning_mode);
  const masteryPct   = useStudentStore(s => Math.round((s.state.bkt?.P_mastery ?? 0) * 100));
  const { isAr, toggle, lang }     = useLang();
  const { send }     = useStream();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollRafRef    = useRef<number | null>(null);

  // Scroll the messages container to the bottom.
  // Uses direct scrollTo on the container (never scrollIntoView which can
  // accidentally scroll the page itself, causing the layout to collapse).
  const scrollToBottom = useCallback((instant = false) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (instant) {
      el.scrollTop = el.scrollHeight;
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  // Track lg breakpoint reactively to avoid stale window.innerWidth snapshot
  const [isLg, setIsLg] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent) => setIsLg(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [rightOpen,     setRightOpen]     = useState(false);
  const [draft,         setDraft]         = useState('');
  const [summaryOpen,   setSummaryOpen]   = useState(false);
  const [summaryMd,     setSummaryMd]     = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  const openSummary = useCallback(async () => {
    setSummaryOpen(true);
    if (summaryMd) return; // already fetched this session
    setSummaryLoading(true);
    try {
      const { data } = await chatApi.summary();
      setSummaryMd(data.summary ?? '');
    } catch {
      setSummaryMd('Failed to generate summary. Please try again.');
    } finally {
      setSummaryLoading(false);
    }
  }, [summaryMd]);

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

  // Auto-scroll when a message is finalized — smooth scroll.
  useEffect(() => {
    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current);
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      scrollToBottom(false);
    });
  }, [messages, scrollToBottom]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll during streaming — RAF-throttled instant scroll.
  // One scroll per paint frame at most; never creates competing smooth animations.
  useEffect(() => {
    if (!isStreaming) return;
    if (scrollRafRef.current) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      scrollToBottom(true);
    });
  }, [streamingContent, isStreaming, scrollToBottom]);

  const handleSend = useCallback((text: string) => {
    scrollToBottom(true);
    send(text);
  }, [send, scrollToBottom]);

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
        <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <Link to="/" className="flex items-center gap-1 no-underline">
            <span
              className="font-black tracking-widest text-sm"
              style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}
            >
              &gt;_CALM
            </span>
          </Link>
          <button
            onClick={toggle}
            className="text-[10px] font-black tracking-widest px-2 py-1 cursor-pointer"
            style={{
              border:     '1px solid var(--color-border)',
              color:      'var(--color-muted)',
              background: 'transparent',
              fontFamily: 'var(--font-mono)',
            }}
          >
            [{lang.toUpperCase()}]
          </button>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 px-2 py-2.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div
            className="w-8 h-8 flex items-center justify-center font-black text-sm shrink-0"
            style={{
              background:  'var(--color-primary-dim)',
              border:      '1px solid var(--color-primary)',
              color:       'var(--color-primary)',
              fontFamily:  'var(--font-mono)',
            }}
          >
            {user?.username?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: 'var(--color-text)' }}>{user?.full_name || user?.username}</p>
            <p className="text-[10px] font-bold truncate" style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>
              // {user?.username}
            </p>
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
            className="flex items-center gap-2 w-full py-2 px-3 text-[10px] font-black tracking-widest uppercase no-underline transition-colors"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', background: 'transparent' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            {isAr ? 'خريطة التقدم' : 'Progress Map'}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full py-2 text-[10px] font-black tracking-widest uppercase transition-colors cursor-pointer"
            style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', background: 'transparent' }}
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
              className="lg:hidden w-8 h-8 flex items-center justify-center cursor-pointer"
              style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <rect y="0" width="14" height="1.5" rx="1"/>
                <rect y="6" width="14" height="1.5" rx="1"/>
                <rect y="12" width="14" height="1.5" rx="1"/>
              </svg>
            </button>
            <div>
              <h1 className="text-xs font-black tracking-wider uppercase" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>
                &gt;_ MCSE
              </h1>
              <p className="text-[10px] font-bold" style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>
                {isAr ? '// المحرك السقراطي · توماس 14' : '// Socratic Engine · Thomas Cal.'}
              </p>
            </div>
          </div>

          {/* Mode toggle */}
          <button
            onClick={() => setMode(!learningMode)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black tracking-widest uppercase cursor-pointer transition-all"
            style={{
              background: learningMode ? 'var(--color-primary-dim)' : 'transparent',
              border:     `1px solid ${learningMode ? 'var(--color-primary)' : 'var(--color-border)'}`,
              color:      learningMode ? 'var(--color-primary)' : 'var(--color-muted)',
              fontFamily: 'var(--font-mono)',
            }}
            title={learningMode
              ? (isAr ? 'وضع التعلم السقراطي — انقر للتبديل إلى الإجابات المباشرة' : 'Socratic mode — click for direct answers')
              : (isAr ? 'وضع الإجابات المباشرة — انقر للعودة للتعلم' : 'Direct mode — click to return to Socratic')}
          >
            {learningMode ? (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            )}{' '}
            {isAr ? (learningMode ? 'تعلم' : 'مباشر') : (learningMode ? 'Learn' : 'Direct')}
          </button>

          {/* Graph / Desmos button */}
          <button
            onClick={() => openDesmos()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black tracking-widest uppercase cursor-pointer transition-all"
            style={{
              background: 'transparent',
              border:     '1px solid var(--color-primary)',
              color:      'var(--color-primary)',
              fontFamily: 'var(--font-mono)',
            }}
            title={isAr ? 'الآلة الحاسبة الرسومية (Desmos)' : 'Graphing Calculator (Desmos)'}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            {isAr ? 'رسم' : 'Graph'}
          </button>

          {/* Export Summary — moved before Panel */}
          {messages.length > 0 && (
            <button
              onClick={openSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black tracking-widest uppercase cursor-pointer transition-all"
              style={{
                background: 'transparent',
                border:     '1px solid var(--color-accent)',
                color:      'var(--color-accent)',
                fontFamily: 'var(--font-mono)',
              }}
              title={isAr ? 'ملخص الجلسة بالذكاء الاصطناعي' : 'AI Session Summary'}
            >
              &gt;_ {isAr ? 'ملخص' : 'Summary'}
            </button>
          )}

          {/* Right panel toggle */}
          <button
            onClick={() => setRightOpen((v) => !v)}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black tracking-widest uppercase cursor-pointer"
            style={{
              background:  rightOpen ? 'var(--color-primary-dim)' : 'transparent',
              border:      `1px solid ${rightOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
              color:       rightOpen ? 'var(--color-primary)' : 'var(--color-muted)',
              fontFamily:  'var(--font-mono)',
            }}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 2h12v1H2zm0 5h8v1H2zm0 5h10v1H2z"/>
            </svg>
            {isAr ? 'التفاصيل' : 'Panel'}
          </button>
        </div>

        {/* Mastery progress bar — 3px animated strip beneath topbar */}
        <div className="shrink-0 relative" style={{ height: 3, background: 'var(--color-surface-2)' }}>
          <motion.div
            className="absolute inset-y-0 left-0"
            animate={{ width: `${masteryPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ background: masteryPct >= 80 ? 'var(--color-accent)' : 'var(--color-primary)' }}
          />
        </div>

        {/* Level-up toast stack — fixed bottom-right */}
        <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          <AnimatePresence>
            {levelUpToasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 60, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                onAnimationComplete={() => {
                  // auto-dismiss after 4s
                  setTimeout(() => dismissLevelUpToast(toast.id), 4000);
                }}
                className="pointer-events-auto px-4 py-3 flex items-center gap-3"
                style={{
                  background:   'var(--color-ink)',
                  border:       '1px solid var(--color-accent)',
                  borderLeft:   '3px solid var(--color-accent)',
                  minWidth:     220,
                  fontFamily:   'var(--font-mono)',
                  cursor:       'pointer',
                }}
                onClick={() => dismissLevelUpToast(toast.id)}
              >
                <span className="text-base font-black" style={{ color: 'var(--color-accent)' }}>↑</span>
                <div>
                  <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--color-accent)' }}>
                    {isAr ? 'ارتقاء المستوى' : 'level up'}
                  </p>
                  <p className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>
                    {isAr ? 'مستوى' : 'Level'} {toast.level} — {toast.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Messages area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
          {/* Mode banner — shown only in direct answer mode */}
          {!learningMode && (
            <div
              className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold mb-3"
              style={{
                background:  'transparent',
                borderLeft:  '3px solid var(--color-warning)',
                borderTop:   '1px solid var(--color-border)',
                borderRight: '1px solid var(--color-border)',
                borderBottom:'1px solid var(--color-border)',
                color:       'var(--color-warning)',
                fontFamily:  'var(--font-mono)',
              }}
            >
              // {isAr
                ? 'وضع الإجابات المباشرة — إجابات كاملة بدون السقراطي'
                : 'direct mode — full answers, no Socratic guidance'}
            </div>
          )}
          {messages.length === 0 && !isStreaming && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center py-12"
            >
              <div
                className="flex items-center justify-center font-black text-2xl mb-6"
                style={{
                  width: 72, height: 72,
                  border:     '1px solid var(--color-border)',
                  color:      'var(--color-primary)',
                  fontFamily: 'var(--font-mono)',
                  background: 'var(--color-surface)',
                }}
              >
                &gt;_
              </div>
              <h2
                className="text-sm font-black tracking-widest uppercase mb-2"
                style={{ color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}
              >
                {isAr ? 'مرحباً في CALM' : 'Welcome to CALM'}
              </h2>
              <p className="text-xs max-w-xs" style={{ color: 'var(--color-muted)' }}>
                {isAr
                  ? '// اسأل عن أي موضوع في الحساب. سيرشدك المحرك السقراطي خطوة بخطوة.'
                  : '// Ask any calculus topic. The Socratic Engine guides without giving direct answers.'}
              </p>
            </motion.div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onGraph={msg.role === 'assistant' ? (exprs) => openDesmos(exprs) : undefined}
            />
          ))}

          {isStreaming && streamingContent && (
            <StreamingBubble content={streamingContent} />
          )}

          {isStreaming && !streamingContent && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex mb-2"
            >
              <div
                className="shrink-0 self-start pt-2 pr-2 select-none"
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 900,
                  color: 'var(--color-accent)', width: 38, textAlign: 'right',
                }}
              >
                [C]
              </div>
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{
                  background:   'var(--color-surface)',
                  borderTop:    '1px solid var(--color-border)',
                  borderRight:  '1px solid var(--color-border)',
                  borderBottom: '1px solid var(--color-border)',
                  borderLeft:   '3px solid var(--color-accent)',
                }}
              >
                {isReasoning ? (
                  <>
                    <motion.span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--color-accent)' }}
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                    />
                    <span
                      className="text-[10px] font-black tracking-wider uppercase"
                      style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}
                    >
                      {isAr ? 'K2-Think-v2 يفكر...' : 'K2-Think-v2 is reasoning...'}
                    </span>
                  </>
                ) : (
                  [0, 0.18, 0.36].map((delay) => (
                    <motion.div
                      key={delay}
                      className="w-1.5 h-4"
                      style={{ background: 'var(--color-accent)' }}
                      animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 0.75, delay }}
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}

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
              <p className="text-[10px] font-black tracking-widest uppercase mb-4" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                &gt;_ {isAr ? 'الجلسة' : 'Session'}
              </p>
              <SessionPanel />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
      {/* ── Desmos Graphing Calculator Modal ───────────────────────────── */}
      <DesmosPanel />
      {/* ── Summary Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {summaryOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(2px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setSummaryOpen(false); }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              className="relative flex flex-col w-full sm:w-auto overflow-hidden"
              style={{
                background: 'var(--color-ink)',
                border: '1px solid var(--color-border)',
                width: '100%',
                maxWidth: 700,
                maxHeight: '92vh',
                borderRadius: 0,
              }}
            >
              {/* Top accent line */}
              <div style={{ height: 2, background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))', flexShrink: 0 }} />

              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-3 shrink-0"
                style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
              >
                <div className="flex items-center gap-4">
                  <span
                    className="text-[10px] font-black tracking-widest uppercase"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {isAr ? '>_ ملخص الجلسة' : '>_ Session Summary'}
                  </span>
                  <span
                    className="text-[10px] font-bold tracking-widest uppercase"
                    style={{ color: 'var(--color-subtle, #484f58)' }}
                  >
                    {isAr ? '// منشأ بالذكاء الاصطناعي' : '// ai-generated'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setSummaryMd(''); openSummary(); }}
                    className="text-[10px] font-black tracking-widest uppercase px-3 py-1.5 cursor-pointer transition-all"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)', background: 'transparent' }}
                    title="Regenerate"
                  >
                    {isAr ? 'إعادة' : 'Regen'}
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="text-[10px] font-black tracking-widest uppercase px-3 py-1.5 cursor-pointer transition-colors"
                    style={{ border: '1px solid var(--color-primary)', color: 'var(--color-primary)', background: 'var(--color-primary-dim)' }}
                  >
                    {isAr ? 'PDF / طباعة' : 'Print / PDF'}
                  </button>
                  <button
                    onClick={() => setSummaryOpen(false)}
                    className="w-7 h-7 flex items-center justify-center cursor-pointer transition-colors"
                    style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)', background: 'transparent' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div id="summary-print-area" className="flex-1 overflow-y-auto" style={{ color: 'var(--color-text)' }}>
                {summaryLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-5">
                    <div className="flex items-center gap-1.5">
                      {[0, 0.18, 0.36].map((d) => (
                        <motion.div
                          key={d}
                          className="w-1.5 h-5"
                          style={{ background: 'var(--color-primary)' }}
                          animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: d }}
                        />
                      ))}
                    </div>
                    <p className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-muted)' }}>
                      {isAr ? 'جاري التحليل...' : 'Analyzing session...'}
                    </p>
                  </div>
                ) : (
                  <div className="px-6 py-6 summary-content">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {summaryMd}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
