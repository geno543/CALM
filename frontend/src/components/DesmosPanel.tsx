import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../stores/chatStore';
import { useLang }      from '../contexts/LanguageContext';

// Full interactive calculator  no API key needed, no ?embed (embed disables zoom/pan)
const DESMOS_URL = 'https://www.desmos.com/calculator';

export default function DesmosPanel() {
  const { desmosOpen, desmosExprs, closeDesmos } = useChatStore();
  const { isAr } = useLang();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady]   = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  const handleCopy = (latex: string, idx: number) => {
    navigator.clipboard.writeText(latex).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const exprPanelH = desmosExprs.length > 0 ? Math.min(desmosExprs.length * 36 + 44, 160) : 0;
  const totalH     = typeof window !== 'undefined' ? Math.max(420, Math.floor(window.innerHeight * 0.82)) : 520;
  const iframeH    = totalH - exprPanelH;

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
                  &gt;_ {isAr ? '????? ??????? ????????' : 'Graphing Calculator'}
                </span>
                <span style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>// Desmos</span>
                {!ready && (
                  <span style={{ color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>loading...</span>
                )}
              </div>
              <button
                onClick={closeDesmos}
                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', color: 'var(--color-muted)', background: 'transparent', cursor: 'pointer' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6"  x2="6"  y2="18"/>
                  <line x1="6"  y1="6"  x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Detected expressions  click-to-copy, paste into Desmos expression list */}
            {desmosExprs.length > 0 && (
              <div style={{
                height: exprPanelH,
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                overflowY: 'auto',
                padding: '8px 16px',
              }}>
                <p style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                  // {isAr ? '???? ???? ???????  ????? ?? ????? Desmos' : 'click to copy  paste into the Desmos expression list'}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {desmosExprs.map((expr, i) => (
                    <button
                      key={i}
                      onClick={() => handleCopy(expr, i)}
                      title={expr}
                      style={{
                        fontFamily:   'var(--font-mono)',
                        fontSize:     11,
                        padding:      '4px 10px',
                        background:   copied === i ? 'rgba(61,220,151,0.12)' : 'rgba(88,166,255,0.06)',
                        border:       `1px solid ${copied === i ? 'var(--color-accent)' : 'var(--color-primary)'}`,
                        color:        copied === i ? 'var(--color-accent)' : 'var(--color-primary)',
                        cursor:       'pointer',
                        maxWidth:     320,
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap',
                      }}
                    >
                      {copied === i ? ' copied' : expr}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Full interactive Desmos calculator  zoom, pan, expression list all enabled */}
            <iframe
              ref={iframeRef}
              src={DESMOS_URL}
              onLoad={() => setReady(true)}
              style={{ display: 'block', width: '100%', height: iframeH, border: 'none' }}
              allow="fullscreen"
              title="Desmos Graphing Calculator"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
