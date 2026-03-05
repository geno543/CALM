import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath  from 'remark-math';
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

const MarkdownSection = memo(({ content }: { content: string }) => (
  <div className="prose-calm">
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ children }) => <p className="font-bold text-base mt-3 mb-1" style={{ color: 'var(--color-text)' }}>{children}</p>,
        h2: ({ children }) => <p className="font-semibold text-sm mt-2 mb-1" style={{ color: 'var(--color-text)' }}>{children}</p>,
        h3: ({ children }) => <p className="font-medium text-sm mt-2 mb-0.5" style={{ color: 'var(--color-text-2)' }}>{children}</p>,
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
));
MarkdownSection.displayName = 'MarkdownSection';

export default function MessageBubble({ message, streaming }: Props) {
  const { role, content } = message;

  // ── System message ─────────────────────────────────────────────────────────
  if (role === 'system') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center my-3"
      >
        <span
          className="px-3 py-1 rounded-full text-xs"
          style={{
            background:  'var(--color-surface-2)',
            border:      '1px solid var(--color-border)',
            color: 'var(--color-muted)',
          }}
        >
          {content}
        </span>
      </motion.div>
    );
  }

  // ── User message ───────────────────────────────────────────────────────────
  if (role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end mb-4"
      >
        <div
          className="max-w-[72%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed"
          style={{
            background: 'var(--color-primary-dim)',
            border:     '1px solid var(--color-primary)',
            color:      'var(--color-text)',
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-3 mb-6 group"
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
      >
        C
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {hasSteps ? (
          // Parsed multi-step layout
          steps.map((step, idx) => (
            <div key={idx}>
              {step.label && (
                <div
                  className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider uppercase mb-2"
                  style={{
                    background: `${step.color}18`,
                    border:     `1px solid ${step.color}`,
                    color:       step.color,
                  }}
                >
                  {step.label}
                </div>
              )}
              {step.body && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm ${step.label ? 'border-l-2' : ''}`}
                  style={{
                    background:  'var(--color-surface)',
                    border:      `1px solid var(--color-border)`,
                    borderLeftColor: step.color || undefined,
                    borderLeftWidth: step.label ? '3px' : '1px',
                  }}
                >
                  <MarkdownSection content={step.body} />
                </div>
              )}
            </div>
          ))
        ) : (
          // Simple single-block response
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <MarkdownSection content={content} />
          </div>
        )}

        {/* Streaming cursor */}
        {streaming && (
          <motion.span
            className="inline-block w-0.5 h-4 ml-1 rounded"
            style={{ background: 'var(--color-primary)' }}
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
          />
        )}
      </div>
    </motion.div>
  );
}
