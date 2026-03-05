import { useEffect }            from 'react';
import { useNavigate, Link }   from 'react-router-dom';
import { motion }               from 'framer-motion';
import { useStudentStore }      from '../stores/studentStore';
import { useLang }              from '../contexts/LanguageContext';
import { CHAPTERS, LEVEL_COLORS } from '../types';

/** Mini arc ring for a single chapter card */
function MiniArc({ pct }: { pct: number }) {
  const r     = 22;
  const circ  = 2 * Math.PI * r;
  const dash  = (pct / 100) * circ;
  const color = pct >= 65 ? '#3DDC97' : pct >= 35 ? '#F0A04B' : '#8B949E';
  return (
    <svg viewBox="0 0 54 54" width="54" height="54" className="-rotate-90">
      <circle cx="27" cy="27" r={r} fill="none" stroke="var(--color-border)" strokeWidth="5" />
      <motion.circle
        cx="27" cy="27" r={r}
        fill="none" stroke={color}
        strokeWidth="5" strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </svg>
  );
}

function masteryToLevel(m: number) {
  const thresholds: [number, number, string][] = [
    [0.20, 1, 'Intuitive Primitive'],
    [0.35, 2, 'Formal Axiomatic'],
    [0.50, 3, 'Visualization'],
    [0.65, 4, 'Heuristic Deconstruction'],
    [0.80, 5, 'Heavyweight Synthesis'],
    [0.92, 6, 'Theoretical Convergence'],
    [1.01, 7, 'Frontier Research'],
  ];
  for (const [threshold, lvl, label] of thresholds) {
    if (m < threshold) return { level: lvl, label };
  }
  return { level: 7, label: 'Frontier Research' };
}

export default function ProgressMap() {
  const navigate = useNavigate();
  const { state, refresh } = useStudentStore();
  const { isAr }   = useLang();
  const { chapter_mastery, current_chapter, streak_days, total_hints } = state;

  // Fetch fresh data whenever the progress page is visited
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); }, []);

  const openChapter = (file: string) => {
    state.current_chapter === file
      ? navigate('/chat')
      : navigate('/chat', { state: { startChapter: file } });
  };

  return (
    <div
      className="min-h-dvh"
      style={{ background: 'var(--color-ink)', color: 'var(--color-text)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <Link to="/chat" className="flex items-center gap-2 text-sm font-medium no-underline" style={{ color: 'var(--color-muted)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
          </svg>
          {isAr ? 'العودة للدردشة' : 'Back to Chat'}
        </Link>
        <h1 className="text-base font-semibold">{isAr ? 'خريطة التقدم' : 'Progress Map'}</h1>
        {/* Streak + hints badge */}
        <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--color-muted)' }}>
          <span>🔥 <strong style={{ color: 'var(--color-text)' }}>{streak_days ?? 1}</strong> {isAr ? 'يوم' : 'day streak'}</span>
          <span>{isAr ? 'تلميح:' : 'Hints:'} <strong style={{ color: 'var(--color-accent)' }}>{total_hints ?? 0}</strong></span>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
          {isAr
            ? 'استعرض مستوى إتقانك في كل فصل وابدأ التعلم من حيث وقفت.'
            : 'Review your mastery across chapters and continue where you left off.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CHAPTERS.map((ch, idx) => {
            const concept   = chapter_mastery?.[ch.file] ?? { P_mastery: 0.10, P_guess: 0.25, P_slip: 0.10 };
            const pct       = Math.round(concept.P_mastery * 100);
            const { level, label } = masteryToLevel(concept.P_mastery);
            const colors    = LEVEL_COLORS[level] ?? LEVEL_COLORS[1];
            const isActive  = ch.file === current_chapter;

            return (
              <motion.div
                key={ch.file}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                className="rounded-2xl p-5 flex flex-col gap-4 cursor-pointer transition-all"
                style={{
                  background: isActive ? colors.bg : 'var(--color-surface)',
                  border: `1px solid ${isActive ? colors.border : 'var(--color-border)'}`,
                }}
                onClick={() => openChapter(ch.file)}
              >
                {/* Top row — icon + mastery ring */}
                <div className="flex items-center justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold"
                    style={{
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                    }}
                  >
                    {ch.icon}
                  </div>
                  <div className="relative">
                    <MiniArc pct={pct} />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: colors.text }}>
                      {pct}%
                    </div>
                  </div>
                </div>

                {/* Chapter name */}
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {isAr ? ch.labelAr : ch.label}
                  </p>
                  <div
                    className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium"
                    style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
                  >
                    Lv {level} · {label}
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={(e) => { e.stopPropagation(); openChapter(ch.file); }}
                  className="mt-auto w-full py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  style={{
                    background: isActive ? colors.border : 'var(--color-surface-2)',
                    border: `1px solid ${isActive ? colors.border : 'var(--color-border)'}`,
                    color: isActive ? colors.text : 'var(--color-muted)',
                  }}
                >
                  {isActive
                    ? (isAr ? '✓ الفصل الحالي' : '✓ Current Chapter')
                    : (isAr ? 'ابدأ الفصل' : 'Start Chapter')}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
