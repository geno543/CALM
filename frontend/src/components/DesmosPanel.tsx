import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../stores/chatStore';
import { useLang }      from '../contexts/LanguageContext';

// Desmos API types
declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (
        el: HTMLElement,
        options?: Record<string, unknown>,
      ) => DesmosCalc;
    };
  }
}

interface DesmosCalc {
  setExpression: (expr: { id: string; latex: string; color?: string }) => void;
  destroy: () => void;
}

const COLORS = ['#58A6FF', '#3DDC97', '#F0A04B', '#D2A8FF', '#F7C948', '#FF7B72'];

// Dynamically inject the Desmos script once
function loadDesmosScript(): Promise<void> {
  return new Promise((resolve) => {
    if (window.Desmos) { resolve(); return; }
    const existing = document.getElementById('desmos-api');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.id  = 'desmos-api';
    s.src = 'https://www.desmos.com/api/v1.10/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0faa6';
    s.addEventListener('load', () => resolve(), { once: true });
    document.head.appendChild(s);
  });
}

export default function DesmosPanel() {
  const { desmosOpen, desmosExprs, closeDesmos } = useChatStore();
  const { isAr } = useLang();
  const containerRef = useRef<HTMLDivElement>(null);
  const calcRef      = useRef<DesmosCalc | null>(null);

  useEffect(() => {
    if (!desmosOpen) return;

    let cancelled = false;

    const init = async () => {
      await loadDesmosScript();
      if (cancelled || !containerRef.current || !window.Desmos) return;

      // Destroy previous instance
      calcRef.current?.destroy();

      calcRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
        keypad:             true,
        expressions:        true,
        settingsMenu:       false,
        zoomButtons:        true,
        lockViewport:       false,
        backgroundColor:    '#0D1117',
      });

      desmosExprs.forEach((latex, i) => {
        calcRef.current!.setExpression({
          id:    `e${i}`,
          latex: latex.trim(),
          color: COLORS[i % COLORS.length],
        });
      });
    };

    init();

    return () => {
      cancelled = true;
      calcRef.current?.destroy();
      calcRef.current = null;
    };
  }, [desmosOpen, desmosExprs]);

  return (
    <AnimatePresence>
      {desmosOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(2px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeDesmos(); }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0,  opacity: 1, scale: 1    }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="relative flex flex-col overflow-hidden"
            style={{
              background: 'var(--color-ink)',
              border:     '1px solid var(--color-border)',
              width:      '95vw',
              maxWidth:   960,
              height:     '82vh',
            }}
          >
            {/* Rainbow accent bar */}
            <div style={{ height: 2, background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))', flexShrink: 0 }} />

            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3 shrink-0"
              style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
            >
              <div className="flex items-center gap-3">
                {/* Desmos squiggle icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
                  &gt;_ {isAr ? 'الآلة الحاسبة الرسومية' : 'Graphing Calculator'}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>
                  // Desmos
                </span>
                {desmosExprs.length > 0 && (
                  <span
                    className="text-[10px] px-2 py-0.5 font-black tracking-widest uppercase"
                    style={{
                      background:  'rgba(88,166,255,0.1)',
                      border:      '1px solid var(--color-primary)',
                      color:       'var(--color-primary)',
                      fontFamily:  'var(--font-mono)',
                    }}
                  >
                    {desmosExprs.length} {isAr ? 'تعبيرات' : desmosExprs.length === 1 ? 'expr' : 'exprs'}
                  </span>
                )}
              </div>
              <button
                onClick={closeDesmos}
                className="w-7 h-7 flex items-center justify-center cursor-pointer transition-colors"
                style={{ border: '1px solid var(--color-border)', color: 'var(--color-muted)', background: 'transparent' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Desmos mount target */}
            <div ref={containerRef} className="flex-1" style={{ minHeight: 0, background: '#0D1117' }} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
