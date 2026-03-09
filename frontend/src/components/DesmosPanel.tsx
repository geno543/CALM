import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../stores/chatStore';
import { useLang }      from '../contexts/LanguageContext';

// Desmos embed base URL — no API key needed
const DESMOS_EMBED = 'https://www.desmos.com/calculator?embed';

export default function DesmosPanel() {
  const { desmosOpen, desmosExprs, closeDesmos } = useChatStore();
  const { isAr } = useLang();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);

  // When expressions are provided, post them into the iframe once it loads
  useEffect(() => {
    if (!desmosOpen) { setReady(false); return; }
  }, [desmosOpen]);

  const handleIframeLoad = () => {
    setReady(true);
    // Inject expressions via postMessage to the Desmos embed
    if (desmosExprs.length > 0 && iframeRef.current?.contentWindow) {
      desmosExprs.forEach((latex, i) => {
        const cleaned = latex
          .replace(/\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}/g, '')
          .replace(/\\\\/g, '')
          .replace(/\\(label|tag|nonumber)\{[^}]*\}/g, '')
          .trim();
        if (!cleaned) return;
        iframeRef.current!.contentWindow!.postMessage({
          type:   'setExpression',
          params: { id: `e${i}`, latex: cleaned },
        }, 'https://www.desmos.com');
      });
    }
  };

  const bodyH = typeof window !== 'undefined'
    ? Math.max(360, Math.floor(window.innerHeight * 0.80) - 52)
    : 480;

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
              padding: '0 20px', height: 50,
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
                {!ready && (
                  <span style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>loading...</span>
                )}
              </div>
              <button onClick={closeDesmos} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', color: 'var(--color-muted)', background: 'transparent', cursor: 'pointer' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Desmos embed iframe — no API key required */}
            <iframe
              ref={iframeRef}
              src={DESMOS_EMBED}
              onLoad={handleIframeLoad}
              style={{
                display: 'block',
                width:   '100%',
                height:  bodyH,
                border:  'none',
              }}
              allow="fullscreen"
              title="Desmos Graphing Calculator"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
