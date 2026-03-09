import { memo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath  from 'remark-math';
import remarkGfm   from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { motion }  from 'framer-motion';
import type { ChatMessage } from '../types';

interface Props {
  message:   ChatMessage;
  streaming?: boolean;
  onGraph?:  (exprs: string[]) => void;
}

/**
 * Extract LaTeX expressions from assistant message content that are
 * graphable in Desmos (equations with = sign, display-math blocks).
 */
function extractGraphableExprs(text: string): string[] {
  const seen    = new Set<string>();
  const results: string[] = [];

  // Patterns that mean the expression is NOT a plottable curve
  const nonGraphable = /\\(text|longrightarrow|Longrightarrow|rightarrow|mapsto|cup|cap|subset|subseteq|supset|supseteq|in|notin|forall|exists|neq|sim|cong|equiv|approx|implies|iff|to|gets|circ|times(?!\s*x))\b|\\text\s*\{|Domain|Range|\\quad|\\qquad/;

  // Only accept equations whose LHS is a plottable function variable
  const graphableLHS = /^\s*(?:[a-zA-Z](?:_[a-zA-Z0-9])?\s*(?:\([^)]*\))?|[a-zA-Z])\s*=/;

  const isGraphable = (latex: string): boolean => {
    const s = latex.trim();
    if (!s.includes('=')) return false;
    // reject if contains set/logic/arrow notation
    if (nonGraphable.test(s)) return false;
    // LHS must look like  y=, f(x)=, g(x)=, h(x)=, P(x)=, r=, etc.
    if (!graphableLHS.test(s)) return false;
    // RHS must contain 'x' so it's actually a curve, not a number assignment
    const rhs = s.slice(s.indexOf('=') + 1);
    if (!/x/.test(rhs)) return false;
    return true;
  };

  const add = (raw: string) => {
    const e = raw
      .trim()
      .replace(/\\(label|tag|nonumber)\{[^}]*\}/g, '')
      .replace(/\\\\\s*$/gm, '')
      .trim();
    if (e && e.length > 2 && e.length < 300 && !seen.has(e) && isGraphable(e)) {
      seen.add(e);
      results.push(e);
    }
  };

  let m: RegExpExecArray | null;

  // 1. Display math:  $$...$$
  const displayDollar = /\$\$([^$]+)\$\$/gs;
  while ((m = displayDollar.exec(text)) !== null) add(m[1]);

  // 2. Display math:  \[...\]
  const displayBracket = /\\\[([\s\S]+?)\\\]/g;
  while ((m = displayBracket.exec(text)) !== null) add(m[1]);

  // 3. Inline math:  $...$ (short, only if it passes isGraphable)
  const inlineDollar = /\$([^$\n]{3,80})\$/g;
  while ((m = inlineDollar.exec(text)) !== null) add(m[1]);

  // 4. Plain-text:  y = ...,  f(x) = ...
  const plainEq = /\b([fghFGH]\s*\(x\)|y|r)\s*=\s*([^,\n<>#{]{4,80})/g;
  while ((m = plainEq.exec(text)) !== null) {
    const full = `${m[1]}=${m[2].trimEnd()}`;
    if (!seen.has(full)) add(full);
  }

  return results.slice(0, 7);
}

// Step colours  (border-left)
const STEP_COLORS: Record<string, string> = {
  'STEP 0': 'var(--color-muted)',
  'STEP 1': 'var(--color-primary)',
  'STEP 2': 'var(--color-accent)',
  'STEP 3': 'var(--color-warning)',
  'STEP 4': 'var(--color-danger)',
  'STEP 5': '#D2A8FF',
  'STEP 6': '#F7C948',
};

function parseSteps(content: string): { label: string; body: string; color: string }[] {
  const stepRegex = /--\s*(STEP\s+\d[^\n]*?)--/g;
  const splits    = content.split(stepRegex);

  if (splits.length <= 1) return [{ label: '', body: content, color: '' }];

  const result: { label: string; body: string; color: string }[] = [];
  for (let i = 0; i < splits.length; i++) {
    if (i % 2 === 0) {
      // body text between step headers
      if (splits[i].trim()) {
        result.push({ label: '', body: splits[i].trim(), color: '' });
      }
    } else {
      const label = splits[i].trim();
      const body  = splits[i + 1]?.trim() ?? '';
      const stepKey = label.match(/STEP\s+\d/)?.[0] ?? '';
      const color   = STEP_COLORS[stepKey] ?? 'var(--color-border)';
      result.push({ label, body, color });
      i++; // skip consumed body
    }
  }
  return result;
}

/** Normalise LaTeX delimiters that the LLM still emits despite prompt rules.
 *  \[...\]  →  $$...$$   (display math)
 *  \(...\)  →  $...$     (inline math)
 */
function normalizeMath(text: string): string {
  // display: \[...\] → $$...$$
  // Negative lookbehind (?<!\\) prevents matching \\[4pt] (LaTeX line-skip
  // inside cases/aligned envs) which must NOT be converted.
  // '$$$$' in replacement = two literal $ signs (JS replace special pattern: $$ → $)
  text = text.replace(/(?<!\\)\\\[/g, '$$$$').replace(/(?<!\\)\\\]/g, '$$$$');
  // inline: \(...\) → $...$
  text = text.replace(/(?<!\\)\\\(/g, '$').replace(/(?<!\\)\\\)/g, '$');
  return text;
}

const MarkdownSection = memo(({ content }: { content: string }) => {
  const safe = normalizeMath(content);
  return (
  <div className="prose-calm">
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ children }) => <p className="font-bold text-base mt-3 mb-1" style={{ color: 'var(--color-text)' }}>{children}</p>,
        h2: ({ children }) => <p className="font-semibold text-sm mt-2 mb-1" style={{ color: 'var(--color-text)' }}>{children}</p>,
        h3: ({ children }) => <p className="font-medium text-sm mt-2 mb-0.5" style={{ color: 'var(--color-text-2)' }}>{children}</p>,
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead style={{ borderBottom: '2px solid var(--color-border)' }}>{children}</thead>,
        th: ({ children }) => (
          <th style={{ padding: '0.35em 0.75em', textAlign: 'left', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.78em', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td style={{ padding: '0.35em 0.75em', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text)', verticalAlign: 'top' }}>
            {children}
          </td>
        ),
        tr: ({ children }) => <tr style={{ borderBottom: '1px solid var(--color-border)' }}>{children}</tr>,
      }}
    >
      {safe}
    </ReactMarkdown>
  </div>
  );
});
MarkdownSection.displayName = 'MarkdownSection';

export default function MessageBubble({ message, streaming, onGraph }: Props) {
  const { role, content } = message;

  // ── System message ─────────────────────────────────────────────────────────
  if (role === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 my-4 px-2"
      >
        <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
        <span
          className="text-[10px] font-black tracking-widest uppercase shrink-0"
          style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}
        >
          {content}
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
      </motion.div>
    );
  }

  // ── User message ───────────────────────────────────────────────────────────
  if (role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.18 }}
        className="flex justify-end mb-2"
      >
        <div
          className="max-w-[74%] px-4 py-2.5 text-sm leading-relaxed"
          style={{
            background:   'var(--color-primary-dim)',
            borderTop:    '1px solid var(--color-border)',
            borderRight:  '1px solid var(--color-border)',
            borderBottom: '1px solid var(--color-border)',
            borderLeft:   '3px solid var(--color-primary)',
            color:        'var(--color-text)',
          }}
        >
          {content}
        </div>
      </motion.div>
    );
  }

  // ── Assistant message (MCSE) ───────────────────────────────────────────────
  const steps     = parseSteps(content);
  const hasSteps  = steps.some((s) => s.label !== '');
  const graphExprs = extractGraphableExprs(content);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="flex mb-2 group"
    >
      {/* [C] monospace avatar tag */}
      <div
        className="shrink-0 self-start pt-2.5 pr-2"
        style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '10px',
          fontWeight:    900,
          color:         'var(--color-accent)',
          letterSpacing: '0.04em',
          width:         38,
          textAlign:     'right',
          userSelect:    'none',
        }}
      >
        [C]
      </div>

      <div className="flex-1 min-w-0 space-y-1.5 relative">
        {/* Copy button — appears on hover, top-right */}
        {!streaming && (
          <button
            onClick={handleCopy}
            title={copied ? 'Copied!' : 'Copy'}
            className="absolute top-0 right-0 z-10 flex items-center gap-1 px-2 py-1 text-[9px] font-black tracking-wider uppercase transition-all opacity-0 group-hover:opacity-100"
            style={{
              fontFamily:  'var(--font-mono)',
              background:  copied ? 'rgba(61,220,151,0.12)' : 'var(--color-surface-2)',
              border:      `1px solid ${copied ? 'var(--color-accent)' : 'var(--color-border)'}`,
              color:       copied ? 'var(--color-accent)' : 'var(--color-subtle)',
            }}
          >
            {copied ? (
              <>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                copied
              </>
            ) : (
              <>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                copy
              </>
            )}
          </button>
        )}
        {hasSteps ? (
          steps.map((step, idx) => (
            <div key={idx}>
              {step.label && (
                <div
                  className="inline-flex items-center px-2 py-0.5 text-[10px] font-black tracking-widest uppercase mb-1"
                  style={{
                    fontFamily:  'var(--font-mono)',
                    background:  `${step.color}12`,
                    borderTop:   `1px solid ${step.color}40`,
                    borderRight: `1px solid ${step.color}40`,
                    borderBottom:`1px solid ${step.color}40`,
                    borderLeft:  `3px solid ${step.color}`,
                    color:        step.color,
                  }}
                >
                  {step.label}
                </div>
              )}
              {step.body && (
                <div
                  className="px-4 py-3 text-sm"
                  style={{
                    background:   step.label ? `${step.color}07` : 'var(--color-surface)',
                    borderTop:    '1px solid var(--color-border)',
                    borderRight:  '1px solid var(--color-border)',
                    borderBottom: '1px solid var(--color-border)',
                    borderLeft:   `3px solid ${step.color || 'var(--color-accent)'}`,
                  }}
                >
                  <MarkdownSection content={step.body} />
                </div>
              )}
            </div>
          ))
        ) : (
          <div
            className="px-4 py-3 text-sm"
            style={{
              background:   'var(--color-surface)',
              borderTop:    '1px solid var(--color-border)',
              borderRight:  '1px solid var(--color-border)',
              borderBottom: '1px solid var(--color-border)',
              borderLeft:   '3px solid var(--color-accent)',
            }}
          >
            <MarkdownSection content={content} />
          </div>
        )}

        {/* Graph chip — shown when graphable expressions detected */}
        {!streaming && graphExprs.length > 0 && onGraph && (
          <button
            onClick={() => onGraph(graphExprs)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-black tracking-widest uppercase transition-all cursor-pointer mt-1"
            style={{
              fontFamily:  'var(--font-mono)',
              background:  'rgba(88,166,255,0.06)',
              border:      '1px solid var(--color-primary)',
              color:       'var(--color-primary)',
              alignSelf:   'flex-start',
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            graph ({graphExprs.length})
          </button>
        )}

        {/* Blinking block cursor */}
        {streaming && (
          <motion.span
            className="inline-block w-2 h-3.5 ml-1"
            style={{ background: 'var(--color-accent)', verticalAlign: 'middle' }}
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.6, ease: 'linear' }}
          />
        )}
      </div>
    </motion.div>
  );
}
