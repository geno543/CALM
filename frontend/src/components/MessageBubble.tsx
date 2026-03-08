import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath  from 'remark-math';
import remarkGfm   from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { motion }  from 'framer-motion';
import type { ChatMessage } from '../types';

interface Props {
  message:   ChatMessage;
  streaming?: boolean;
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
  // display: \[...\]
  text = text.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
  // inline: \(...\)
  text = text.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
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

export default function MessageBubble({ message, streaming }: Props) {
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
  const steps = parseSteps(content);
  const hasSteps = steps.some((s) => s.label !== '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="flex mb-2"
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

      <div className="flex-1 min-w-0 space-y-1.5">
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
