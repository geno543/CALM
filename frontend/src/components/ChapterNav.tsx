import { motion } from 'framer-motion';
import { useStudentStore } from '../stores/studentStore';
import { useLang }         from '../contexts/LanguageContext';
import { CHAPTERS } from '../types';

interface Props {
  onChapterClick?: (suggestion: string) => void;
}

const CHAPTER_SUGGESTIONS: Record<string, { en: string; ar: string }> = {
  'functions.pdf':       { en: 'Explain the concept of functions and domain/range', ar: 'اشرح مفهوم الدوال والمجال والمدى' },
  'limits.pdf':          { en: 'Explain limits and how to evaluate them',            ar: 'اشرح النهايات وكيفية حسابها' },
  'derivatives.pdf':     { en: 'Explain the derivative and its geometric meaning',   ar: 'اشرح المشتقة ومعناها الهندسي' },
  'derivative_apps.pdf': { en: 'Show me applications of derivatives',                ar: 'أرني تطبيقات المشتقة' },
  'integrals.pdf':       { en: 'Explain integration and the antiderivative',         ar: 'اشرح التكامل والدالة الأصلية' },
  'integrals_apps.pdf':  { en: 'Show me applications of integrals',                  ar: 'أرني تطبيقات التكامل' },
};

export default function ChapterNav({ onChapterClick }: Props) {
  const { state } = useStudentStore();
  const { isAr }  = useLang();
  const current   = state.current_chapter;

  return (
    <div
      className="rounded-xl p-4 space-y-2"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-primary)' }} />
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--color-muted)' }}>
          {isAr ? 'الفصول' : 'Chapters'}
        </span>
      </div>

      <div className="space-y-1.5">
        {CHAPTERS.map((ch: typeof CHAPTERS[number], idx: number) => {
          const isActive = current === ch.file;
          return (
            <motion.button
              key={ch.file}
              onClick={() => onChapterClick?.(
                isAr
                  ? CHAPTER_SUGGESTIONS[ch.file].ar
                  : CHAPTER_SUGGESTIONS[ch.file].en
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer"
              style={{
                background:  isActive ? 'var(--color-primary-dim)' : 'transparent',
                border:      `1px solid ${isActive ? 'var(--color-primary)' : 'transparent'}`,
                color:       isActive ? 'var(--color-primary)'      : 'var(--color-muted)',
                textAlign:   isAr ? 'right' : 'left',
              }}
            >
              <span
                className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-mono font-bold shrink-0"
                style={{
                  background: isActive ? 'var(--color-primary)' : 'var(--color-surface-2)',
                  color:      isActive ? 'var(--color-ink)'     : 'var(--color-muted)',
                }}
              >
                {ch.icon}
              </span>
              <span className="flex-1 font-medium">
                {isAr ? ch.labelAr : ch.label}
              </span>
              <span
                className="text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: isActive ? 'var(--color-primary)' : 'var(--color-border)',
                  color:      isActive ? 'var(--color-ink)'     : 'var(--color-subtle)',
                }}
              >
                {idx + 1}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
