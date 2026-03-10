import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../stores/chatStore';
import { useLang } from '../contexts/LanguageContext';
import * as math from 'mathjs';
import type { EvalFunction } from 'mathjs';

// â”€â”€â”€ colours for up to 7 curves â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const COLORS = ['#58A6FF', '#3DDC97', '#F0A04B', '#FF6B6B', '#B892FF', '#FFD93D', '#4ECDC4'];
const SAMPLES = 900;

interface Viewport { xMin: number; xMax: number; yMin: number; yMax: number }
const DEFAULT_VP: Viewport = { xMin: -10, xMax: 10, yMin: -7, yMax: 7 };

// â”€â”€â”€ LaTeX â†’ mathjs-parseable string â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function latexToMath(raw: string): string {
  let s = raw;
  // 0. strip LHS  f(x)= / y= etc.
  s = s.replace(/^[a-zA-Z_]\w*\s*(?:\([^)]*\))?\s*=\s*/, '');
  // 1. normalise variant fracs (\dfrac, \tfrac -> \frac)
  s = s.replace(/\\[dt]frac\b/g, '\\frac');
  // 2. \left / \right  before nested brace processing
  s = s.replace(/\\left\s*\(/g, '(').replace(/\\right\s*\)/g, ')');
  s = s.replace(/\\left\s*\[/g, '(').replace(/\\right\s*\]/g, ')');
  s = s.replace(/\\left\s*\|/g, 'abs(').replace(/\\right\s*\|/g, ')');
  s = s.replace(/\\left\s*\{/g, '(').replace(/\\right\s*\}/g, ')');
  // 3. subscripts (remove)
  s = s.replace(/_\{[^}]*\}/g, '').replace(/_[a-zA-Z0-9]/g, '');
  // 4. ^{...} -> ^(...)  MUST run BEFORE \sqrt/\frac
  for (let i = 0; i < 4; i++) s = s.replace(/\^\{([^{}]*)\}/g, '^($1)');
  // 5. \frac{a}{b} -- loop for nesting
  for (let i = 0; i < 4; i++) s = s.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)');
  // 6. \sqrt[n]{x}
  s = s.replace(/\\sqrt\s*\[([^\]]+)\]\s*\{([^{}]*)\}/g, 'nthRoot($2,$1)');
  // 7. \sqrt{x} -- loop for nesting
  for (let i = 0; i < 3; i++) s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, 'sqrt($1)');
  // 8. bare \sqrt
  s = s.replace(/\\sqrt\b/g, 'sqrt');
  // 9. trig / named functions
  s = s.replace(/\\(sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|asin|acos|atan|sinh|cosh|tanh|exp|ln|log)\b/g, '$1');
  s = s.replace(/\\abs\b/g, 'abs');
  // 10. constants
  s = s.replace(/\\pi\b/g, 'pi').replace(/\\infty\b/g, 'Infinity').replace(/\\e\b/g, 'e');
  // 11. operators
  s = s.replace(/\\cdot\b/g, '*').replace(/\\times\b/g, '*').replace(/\\div\b/g, '/');
  s = s.replace(/\\pm\b/g, '+');
  // 12. remove remaining \commands and stray braces
  s = s.replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '');
  // 13. implicit multiplication  2x -> 2*x
  s = s.replace(/(\d)([a-df-wyzA-Z(])/g, '$1*$2');
  s = s.replace(/\)\s*\(/g, ')*(').replace(/(\d)\s*\(/g, '$1*(');
  // 14. strip trailing junk / dangling operators
  s = s.replace(/[.,;:!?\\)\]]+$/, '').replace(/[+\-*/^]+$/, '');
  // 15. t -> x for motion functions
  if (!/x/.test(s) && /\bt\b/.test(s)) s = s.replace(/\bt\b/g, 'x');
  return s.trim();
}

type CompiledExpr = EvalFunction;

export default function DesmosPanel() {
  const { desmosOpen, desmosExprs, closeDesmos } = useChatStore();
  const { isAr } = useLang();
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [vp, setVp]           = useState<Viewport>(DEFAULT_VP);
  const vpRef                  = useRef<Viewport>(DEFAULT_VP);
  vpRef.current                = vp;
  const [hidden, setHidden]   = useState<Set<number>>(new Set());
  const [errors, setErrors]   = useState<Record<number, string>>({});
  const [isPanning, setIsPanning] = useState(false);
  const compiledRef            = useRef<(CompiledExpr | null)[]>([]);
  const panStartRef            = useRef<{ clientX: number; clientY: number; vp: Viewport } | null>(null);

  // compile whenever expressions change
  useEffect(() => {
    if (!desmosOpen) return;
    const fns: (CompiledExpr | null)[] = [];
    const errs: Record<number, string> = {};
    desmosExprs.forEach((raw, i) => {
      try { fns.push(math.compile(latexToMath(raw)) as EvalFunction); }
      catch (e: unknown) { fns.push(null); errs[i] = e instanceof Error ? e.message : String(e); }
    });
    compiledRef.current = fns;
    setErrors(errs);
  }, [desmosExprs, desmosOpen]);

  // draw to canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { xMin, xMax, yMin, yMax } = vpRef.current;
    const W = canvas.width, H = canvas.height;
    if (W === 0 || H === 0) return;

    const toX = (x: number) => ((x - xMin) / (xMax - xMin)) * W;
    const toY = (y: number) => H - ((y - yMin) / (yMax - yMin)) * H;

    ctx.fillStyle = '#0D1117';
    ctx.fillRect(0, 0, W, H);

    const niceStep = (range: number) => {
      const raw = range / 10;
      const mag = Math.pow(10, Math.floor(Math.log10(raw)));
      const n = raw / mag;
      return n < 1.5 ? mag : n < 3.5 ? 2 * mag : n < 7.5 ? 5 * mag : 10 * mag;
    };
    const xs = niceStep(xMax - xMin);
    const ys = niceStep(yMax - yMin);

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xMin / xs) * xs; x <= xMax + 1e-9; x += xs) {
      ctx.beginPath(); ctx.moveTo(toX(x), 0); ctx.lineTo(toX(x), H); ctx.stroke();
    }
    for (let y = Math.ceil(yMin / ys) * ys; y <= yMax + 1e-9; y += ys) {
      ctx.beginPath(); ctx.moveTo(0, toY(y)); ctx.lineTo(W, toY(y)); ctx.stroke();
    }

    // axes
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1.5;
    if (xMin <= 0 && xMax >= 0) { ctx.beginPath(); ctx.moveTo(toX(0), 0); ctx.lineTo(toX(0), H); ctx.stroke(); }
    if (yMin <= 0 && yMax >= 0) { ctx.beginPath(); ctx.moveTo(0, toY(0)); ctx.lineTo(W, toY(0)); ctx.stroke(); }

    // labels
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px "JetBrains Mono", monospace';
    const ayPx = Math.min(H - 14, Math.max(14, toY(0)));
    const axPx = Math.min(W - 30, Math.max(4, toX(0)));
    ctx.textAlign = 'center';
    for (let x = Math.ceil(xMin / xs) * xs; x <= xMax; x += xs) {
      if (Math.abs(x) < xs * 0.01) continue;
      ctx.fillText(Number.isInteger(x) ? String(x) : x.toPrecision(2), toX(x), ayPx + 13);
    }
    ctx.textAlign = 'right';
    for (let y = Math.ceil(yMin / ys) * ys; y <= yMax; y += ys) {
      if (Math.abs(y) < ys * 0.01) continue;
      ctx.fillText(Number.isInteger(y) ? String(y) : y.toPrecision(2), axPx - 4, toY(y) + 3);
    }

    // curves
    compiledRef.current.forEach((fn, i) => {
      if (!fn || hidden.has(i)) return;
      ctx.strokeStyle = COLORS[i % COLORS.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      let penDown = false;
      for (let s = 0; s <= SAMPLES; s++) {
        const x = xMin + (xMax - xMin) * (s / SAMPLES);
        let y: number;
        try { y = Number(fn.evaluate({ x })); } catch { y = NaN; }
        if (!isFinite(y) || isNaN(y)) { penDown = false; continue; }
        const px = toX(x), py = toY(y);
        if (!penDown) { ctx.moveTo(px, py); penDown = true; }
        else           ctx.lineTo(px, py);
      }
      ctx.stroke();
    });
  }, [hidden]);

  useEffect(() => { draw(); }, [draw, vp]);

  // resize observer
  useEffect(() => {
    if (!desmosOpen) return;
    const el = containerRef.current, canvas = canvasRef.current;
    if (!el || !canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width = el.clientWidth; canvas.height = el.clientHeight; draw();
    });
    ro.observe(el);
    canvas.width = el.clientWidth; canvas.height = el.clientHeight; draw();
    return () => ro.disconnect();
  }, [desmosOpen, draw]);

  // wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top)  / rect.height;
    const f  = e.deltaY > 0 ? 1.18 : 1 / 1.18;
    setVp(prev => {
      const cx = prev.xMin + mx * (prev.xMax - prev.xMin);
      const cy = prev.yMax - my * (prev.yMax - prev.yMin);
      return { xMin: cx + (prev.xMin - cx) * f, xMax: cx + (prev.xMax - cx) * f,
               yMin: cy + (prev.yMin - cy) * f, yMax: cy + (prev.yMax - cy) * f };
    });
  }, []);

  // mouse pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    panStartRef.current = { clientX: e.clientX, clientY: e.clientY, vp: vpRef.current };
    setIsPanning(true);
  }, []);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!panStartRef.current || !canvasRef.current) return;
    const { clientWidth: W, clientHeight: H } = canvasRef.current;
    const dx = (e.clientX - panStartRef.current.clientX) / W;
    const dy = (e.clientY - panStartRef.current.clientY) / H;
    const { xMin, xMax, yMin, yMax } = panStartRef.current.vp;
    setVp({ xMin: xMin - dx * (xMax - xMin), xMax: xMax - dx * (xMax - xMin),
            yMin: yMin + dy * (yMax - yMin), yMax: yMax + dy * (yMax - yMin) });
  }, []);
  const handleMouseUp = useCallback(() => { panStartRef.current = null; setIsPanning(false); }, []);

  const toggleHidden = (i: number) => setHidden(prev => {
    const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next;
  });

  return (
    <AnimatePresence>
      {desmosOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(2px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) closeDesmos(); }}
        >
          <motion.div
            initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            exit={{ y: 28, opacity: 0 }} transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ background: 'var(--color-ink)', border: '1px solid var(--color-border)', width: '95vw', maxWidth: 1080, height: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {/* accent bar */}
            <div style={{ height: 2, flexShrink: 0, background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))' }} />

            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', height: 46, flexShrink: 0, borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                <span style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  &gt;_ {isAr ? 'Ø§Ù„Ø¢Ù„Ø© Ø§Ù„Ø­Ø§Ø³Ø¨Ø© Ø§Ù„Ø±Ø³ÙˆÙ…ÙŠØ©' : 'Graph Calculator'}
                </span>
                <span style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', fontSize: 10 }}>// built-in | scroll=zoom | drag=pan</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => setVp(DEFAULT_VP)} style={{ height: 26, padding: '0 10px', fontFamily: 'var(--font-mono)', fontSize: 10, background: 'rgba(88,166,255,0.07)', border: '1px solid var(--color-border)', color: 'var(--color-muted)', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  reset
                </button>
                <button onClick={closeDesmos} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', color: 'var(--color-muted)', background: 'transparent', cursor: 'pointer' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* body */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

              {/* expression sidebar */}
              <div style={{ width: 210, flexShrink: 0, borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)', overflowY: 'auto', padding: '10px 0' }}>
                <p style={{ padding: '0 12px 8px', color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {isAr ? '// Ø§Ù„ØªØ¹Ø¨ÙŠØ±Ø§Øª' : '// expressions'}
                </p>
                {desmosExprs.length === 0 ? (
                  <p style={{ padding: '0 12px', color: 'var(--color-muted)', fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.7 }}>
                    {isAr ? 'Ø§Ø³Ø£Ù„ Ø³Ø¤Ø§Ù„Ø§Ù‹ Ø±ÙŠØ§Ø¶ÙŠØ§Ù‹.' : 'Ask a math question â€” detected equations appear here automatically.'}
                  </p>
                ) : desmosExprs.map((expr, i) => {
                  const color = COLORS[i % COLORS.length];
                  const isHid = hidden.has(i);
                  return (
                    <button key={i} onClick={() => toggleHidden(i)} style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 12px', background: isHid ? 'transparent' : 'rgba(255,255,255,0.02)', border: 'none', borderLeft: `3px solid ${isHid ? '#333' : color}`, cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 2, background: isHid ? 'transparent' : color, border: `2px solid ${isHid ? '#555' : color}` }} />
                      <div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: isHid ? 'var(--color-muted)' : 'var(--color-fg)', wordBreak: 'break-all', lineHeight: 1.4 }}>{expr}</span>
                        {errors[i] && <span style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 9, color: '#FF6B6B', marginTop: 2 }}>{isAr ? 'Ø®Ø·Ø£ ÙÙŠ Ø§Ù„ØªØ­Ù„ÙŠÙ„' : 'parse error'}</span>}
                      </div>
                    </button>
                  );
                })}
                <div style={{ margin: '10px 12px 0', paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
                  <p style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)', fontSize: 9, lineHeight: 1.8 }}>
                    {isAr ? 'ØªÙ…Ø±ÙŠØ±: ØªÙƒØ¨ÙŠØ±/ØªØµØºÙŠØ±\nØ³Ø­Ø¨: ØªØ­Ø±ÙŠÙƒ\nÙ†Ù‚Ø±: Ø¥Ø®ÙØ§Ø¡/Ø¥Ø¸Ù‡Ø§Ø±' : 'Scroll: zoom\nDrag: pan\nClick: toggle curve'}
                  </p>
                </div>
              </div>

              {/* canvas */}
              <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: isPanning ? 'grabbing' : 'crosshair' }}>
                <canvas
                  ref={canvasRef}
                  onWheel={handleWheel}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ display: 'block', width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

