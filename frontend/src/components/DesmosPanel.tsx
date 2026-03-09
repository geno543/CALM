import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../stores/chatStore';
import { useLang }      from '../contexts/LanguageContext';

declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (el: HTMLElement, opts?: Record<string, unknown>) => DesmosCalc;
    };
  }
}

interface DesmosCalc {
  setExpression: (expr: { id: string; latex: string; color?: string }) => void;
  resize: () => void;
  destroy: () => void;
}

const COLORS = ['#58A6FF', '#3DDC97', '#F0A04B', '#D2A8FF', '#F7C948', '#FF7B72'];
const HEADER_H = 50; // 2px accent bar + 48px header row

function loadDesmosScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Desmos) { resolve(); return; }
    const existing = document.getElementById('desmos-api');
    if (existing) {
      const poll = setInterval(() => { if (window.Desmos) { clearInterval(poll); resolve(); } }, 50);
      return;
    }
    const s = document.createElement('script');
    s.id      = 'desmos-api';
    s.src     = 'https://www.desmos.com/api/v1.10/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0faa6';
    s.onload  = () => resolve();
    s.onerror = () => reject(new Error('Desmos failed to load'));
    document.head.appendChild(s);
  });
}

function cleanLatex(raw: string): string {
  return raw
    .replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g, '')
    .replace(/\\\\/g, '')
    .replace(/\\(label|tag|nonumber)\{[^}]*\}/g, '')
    .trim();
}

export default function DesmosPanel() {
  const { desmosOpen, desmosExprs, closeDesmos } = useChatStore();
  const { isAr } = useLang();
  const containerRef = useRef<HTMLDivElement>(null);
  const calcRef      = useRef<DesmosCalc | null>(null);

  // Explicit body height in px so Desmos always has a real number to work with
  const bodyH = typeof window !== 'undefined'
    ? Math.max(300, Math.floor(window.innerHeight * 0.82) - HEADER_H)
    : 500;

  useEffect(() => {
    if (!desmosOpen) return;
    let cancelled = false;
    let resizeTimer: ReturnType<typeof setTimeout>;

    async function init() {
      try { await loadDesmosScript(); } catch { return; }
      if (cancelled) return;

      // Double rAF: first frame = React paint, second = Framer Motion moves element into place
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (cancelled || !containerRef.current || !window.Desmos) return;

        const el = containerRef.current;
        // Stamp explicit pixel height directly on the element before Desmos measures
        el.style.height = `${bodyH}px`;
        el.style.width  = '100%';

        calcRef.current?.destroy();
        calcRef.current = window.Desmos.GraphingCalculator(el, {
          keypad:            true,
          expressions:       true,
          settingsMenu:      false,
          zoomButtons:       true,
          lockViewport:      false,
          expressionsTopbar: true,
        });

        desmosExprs.forEach((latex, i) => {
          const cleaned = cleanLatex(latex);
          if (!cleaned) return;
          calcRef.current!.setExpression({ id: `e${i}`, latex: cleaned, color: COLORS[i % COLORS.length] });
        });

        // Tell Desmos to re-measure after it renders
        resizeTimer = setTimeout(() => { if (!cancelled) calcRef.current?.resize(); }, 80);
      }));
    }

    init();
    return () => {
      cancelled = true;
      clearTimeout(resizeTimer);
      calcRef.current?.destroy();
      calcRef.current = null;
    };
  }, [desmosOpen, desmosExprs, bodyH]);

  return (
    <AnimatePresence>
      {desmosOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(2px)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeDesmos(); }}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{    y: 30, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              background: 'var(--color-ink)',
              border:     '1px solid var(--color-border)',
              width:      '95vw',
              maxWidth:   980,
              overflow:   'hidden',
              display:    'block',
            }}
          >
            {/* Accent bar */}
            <div style={{ height: 2, background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))' }} />

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 20px', height: 48,
              borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                <span style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  &gt;_ {isAr ? 'الآلة الحاسبة الرسومية' : 'Graphing Calculator'}
                </span>
                <span style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>// Desmos</span>
                {desmosExprs.length > 0 && (
                  <span style={{ background: 'rgba(88,166,255,0.1)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', padding: '1px 8px', letterSpacing: '0.08em' }}>
                    {desmosExprs.length} {isAr ? 'تعبيرات' : desmosExprs.length === 1 ? 'expr' : 'exprs'}
                  </span>
                )}
              </div>
              <button onClick={closeDesmos} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', color: 'var(--color-muted)', background: 'transparent', cursor: 'pointer' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Desmos mount — explicit block with px height */}
            <div
              ref={containerRef}
              style={{ display: 'block', width: '100%', height: bodyH }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
