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
      className="p-4 space-y-2"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2" style={{ background: 'var(--color-primary)' }} />
        <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>
          {isAr ? '// الفصول' : '// chapters'}
        </span>
      </div>

      <div className="space-y-1">
        {CHAPTERS.map((ch: typeof CHAPTERS[number], idx: number) => {
          const isActive = current === ch.file;
          return (
            <motion.button
              key={ch.file}
              onClick={() => {
                if (!isActive) return;
                onChapterClick?.(
                  isAr
                    ? CHAPTER_SUGGESTIONS[ch.file].ar
                    : CHAPTER_SUGGESTIONS[ch.file].en
                );
              }}
              whileHover={isActive ? { scale: 1.01 } : {}}
              whileTap={isActive ? { scale: 0.98 } : {}}
              disabled={!isActive}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors"
              style={{
                background:  isActive ? 'rgba(88,166,255,0.08)' : 'transparent',
                borderLeft:  `3px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderTop:   '1px solid transparent',
                borderRight: '1px solid transparent',
                borderBottom:'1px solid transparent',
                color:       isActive ? 'var(--color-primary)' : 'var(--color-subtle)',
                cursor:      isActive ? 'pointer' : 'not-allowed',
                opacity:     isActive ? 1 : 0.45,
                textAlign:   isAr ? 'right' : 'left',
              }}
            >
              <span
                className="w-8 h-8 flex items-center justify-center text-xs font-mono font-bold shrink-0"
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
              {isActive ? (
                <span
                  className="text-xs w-5 h-5 flex items-center justify-center shrink-0"
                  style={{
                    background: 'var(--color-primary)',
                    color:      'var(--color-ink)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 900,
                  }}
                >
                  {idx + 1}
                </span>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-subtle)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              )}
            </motion.button>
          );
        })}
      </div>

      <p className="text-[10px] pt-2" style={{ color: 'var(--color-subtle)', fontFamily: 'var(--font-mono)' }}>
        {isAr ? '// غيّر الفصل من خريطة التقدم' : '// change chapter from progress map'}
      </p>
    </div>
  );
}
