import { motion, AnimatePresence } from 'framer-motion';
import { useStudentStore } from '../stores/studentStore';
import { useLang }         from '../contexts/LanguageContext';
import { CHAPTERS, LEVEL_COLORS } from '../types';

const LEVEL_NAMES_AR: Record<number, string> = {
  1: 'بدائي حدسي',
  2: 'قواعد رسمية',
  3: 'تصوير بياني',
  4: 'تفكيك إرشادي',
  5: 'تركيب متعمق',
  6: 'تقارب نظري',
  7: 'بحث متقدم',
};

function Arc({ pct }: { pct: number }) {
  const r   = 44;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-border)" strokeWidth="8" />
      <motion.circle
        cx="50" cy="50" r={r}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs" style={{ color: 'var(--color-muted)' }}>
        <span>{label}</span>
        <span style={{ color }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1 rounded-full" style={{ background: 'var(--color-border)' }}>
        <motion.div
          className="h-1 rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/** Mini mastery bar for a single chapter */
function ChapterBar({ label, mastery, active }: { label: string; mastery: number; active: boolean }) {
  const pct = Math.round(mastery * 100);
  // Color from green (high) → orange (mid) → red (low)
  const color = mastery >= 0.65 ? '#3DDC97' : mastery >= 0.35 ? '#F0A04B' : '#8B949E';
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs" style={{ color: active ? 'var(--color-accent)' : 'var(--color-muted)' }}>
        <span className="truncate max-w-[70%]">{label}</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div className="h-1 rounded-full" style={{ background: 'var(--color-border)' }}>
        <motion.div
          className="h-1 rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

export default function MasteryPanel() {
  const { state } = useStudentStore();
  const { isAr }  = useLang();
  const { bkt: bktRaw, level, level_label, chapter_mastery, current_chapter, streak_days, total_hints } = state;
  const bkt   = bktRaw ?? { P_mastery: 0.10, P_guess: 0.25, P_slip: 0.10 };
  const pct   = Math.round(bkt.P_mastery * 100);
  const colors = LEVEL_COLORS[level] ?? LEVEL_COLORS[1];

  return (
    <div
      className="rounded-xl p-4 space-y-4"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ background: 'var(--color-accent)' }}
        />
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--color-muted)' }}>
          {isAr ? 'مستوى الإتقان' : 'Mastery Level'}
        </span>
      </div>

      {/* Ring + level badge */}
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <Arc pct={pct} />
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={pct}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-lg font-bold"
                style={{ color: 'var(--color-accent)' }}
              >
                {pct}%
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={level}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
            >
              <div
                className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold mb-1"
                style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
              >
                Level {level}
              </div>
              <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                {isAr ? LEVEL_NAMES_AR[level] : level_label}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Streak + hints row */}
      <div
        className="flex items-center justify-between rounded-lg px-3 py-2 text-xs"
        style={{ background: 'var(--color-surface-2, #161b22)', border: '1px solid var(--color-border-2)' }}
      >
        <span style={{ color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--color-warning)" style={{ flexShrink: 0 }}><path d="M12 2c0 6-6 8-6 14a6 6 0 0 0 12 0c0-6-6-8-6-14z"/></svg>
          <span className="font-semibold">{streak_days ?? 1}</span>{' '}
          <span style={{ color: 'var(--color-muted)' }}>{isAr ? 'يوم متتالي' : 'day streak'}</span>
        </span>
        <span style={{ color: 'var(--color-muted)' }}>
          {isAr ? 'تلميحات:' : 'Hints:'}{' '}
          <span className="font-semibold" style={{ color: 'var(--color-accent)' }}>{total_hints ?? 0}</span>
        </span>
      </div>

      {/* BKT stats */}
      <div className="space-y-2 pt-1 border-t" style={{ borderColor: 'var(--color-border-2)' }}>
        <StatBar
          label={isAr ? 'الإتقان' : 'P(Mastery)'}
          value={bkt.P_mastery}
          color="var(--color-accent)"
        />
        <StatBar
          label={isAr ? 'التخمين' : 'P(Guess)'}
          value={bkt.P_guess}
          color="var(--color-warning)"
        />
        <StatBar
          label={isAr ? 'الزلق' : 'P(Slip)'}
          value={bkt.P_slip}
          color="var(--color-danger)"
        />
      </div>

      {/* Per-chapter mastery */}
      {chapter_mastery && Object.keys(chapter_mastery).length > 0 && (
        <div className="space-y-2 pt-1 border-t" style={{ borderColor: 'var(--color-border-2)' }}>
          <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--color-muted)' }}>
            {isAr ? 'إتقان الفصول' : 'Chapter Mastery'}
          </p>
          {CHAPTERS.map(ch => {
            const concept = chapter_mastery[ch.file];
            if (!concept) return null;
            return (
              <ChapterBar
                key={ch.file}
                label={isAr ? ch.labelAr : ch.label}
                mastery={concept.P_mastery}
                active={ch.file === current_chapter}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
