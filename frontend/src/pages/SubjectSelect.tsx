import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLang } from '../contexts/LanguageContext';

const SUBJECTS = [
  {
    id: 'calculus',
    en: 'Calculus',
    ar: 'حساب التفاضل والتكامل',
    book_en: "Thomas's Calculus",
    book_ar: 'كتاب Thomas\'s Calculus',
    tag_en: 'LIVE',
    tag_ar: 'متاح',
    active: true,
    path: '/chat',
    color: 'var(--color-primary)',
  },
  {
    id: 'biology',
    en: 'Biology',
    ar: 'الأحياء',
    book_en: "Campbell Biology",
    book_ar: 'كتاب Campbell Biology',
    tag_en: 'COMING SOON',
    tag_ar: 'قريبا',
    active: false,
    path: null,
    color: 'var(--color-accent)',
  },
  {
    id: 'chemistry',
    en: 'Chemistry',
    ar: 'الكيمياء',
    book_en: 'Zumdahl Chemistry',
    book_ar: 'كتاب Zumdahl Chemistry',
    tag_en: 'COMING SOON',
    tag_ar: 'قريبا',
    active: false,
    path: null,
    color: 'var(--color-warning)',
  },
  {
    id: 'physics',
    en: 'Physics',
    ar: 'الفيزياء',
    book_en: 'Halliday & Resnick',
    book_ar: 'كتاب Halliday & Resnick',
    tag_en: 'COMING SOON',
    tag_ar: 'قريبا',
    active: false,
    path: null,
    color: '#c084fc',
  },
];

// Lock icon SVG
function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

export default function SubjectSelect() {
  const navigate = useNavigate();
  const { isAr, toggle } = useLang();

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: 'var(--color-ink)', color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}
    >
      {/* NAV */}
      <nav
        className="flex items-center justify-between px-6 py-3"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(13,17,23,0.95)' }}
      >
        <span className="font-black tracking-tighter text-base" style={{ letterSpacing: '-0.04em' }}>CALM</span>
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-bold tracking-widest uppercase" style={{ color: 'var(--color-muted)' }}>
            {isAr ? '// اختر المادة' : '// select subject'}
          </span>
          <button
            onClick={toggle}
            className="text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 cursor-pointer transition-colors"
            style={{ color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
          >
            {isAr ? 'EN' : 'عربي'}
          </button>
        </div>
      </nav>

      {/* HEADER */}
      <div className="max-w-4xl mx-auto w-full px-6 pt-16 pb-10" dir={isAr ? 'rtl' : 'ltr'}>
        <p className="text-[11px] font-bold tracking-widest uppercase mb-4" style={{ color: 'var(--color-primary)' }}>
          {isAr ? '>_ مواد CALM' : '>_ CALM Subjects'}
        </p>
        <h1
          className="font-black leading-none mb-3"
          style={{ fontSize: 'clamp(1.8rem, 5vw, 3rem)', letterSpacing: '-0.04em' }}
        >
          {isAr ? 'اختر مادتك' : 'Choose your subject.'}
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          {isAr
            ? 'يعمل الحساب الآن. المواد الأخرى قادمة قريبا.'
            : 'Calculus is live. More subjects coming soon.'}
        </p>
      </div>

      {/* SUBJECT GRID */}
      <div className="max-w-4xl mx-auto w-full px-6 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SUBJECTS.map((s, i) => {
            const isActive = s.active;
            const name = isAr ? s.ar : s.en;
            const book = isAr ? s.book_ar : s.book_en;
            const tag = isAr ? s.tag_ar : s.tag_en;

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={isActive ? () => navigate(s.path!) : undefined}
                style={{
                  borderLeft: isAr ? 'none' : `3px solid ${isActive ? s.color : 'var(--color-border)'}`,
                  borderRight: isAr ? `3px solid ${isActive ? s.color : 'var(--color-border)'}` : 'none',
                  border: `1px solid var(--color-border)`,
                  borderLeftWidth: isAr ? '1px' : '3px',
                  borderRightWidth: isAr ? '3px' : '1px',
                  background: isActive ? 'var(--color-surface)' : 'transparent',
                  opacity: isActive ? 1 : 0.45,
                  cursor: isActive ? 'pointer' : 'not-allowed',
                  padding: '1.5rem',
                  transition: 'box-shadow 0.15s ease',
                }}
                whileHover={isActive ? { boxShadow: `0 0 20px ${s.color}22` } : {}}
                dir={isAr ? 'rtl' : 'ltr'}
              >
                {/* Tag row */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5"
                    style={{
                      color: isActive ? s.color : 'var(--color-muted)',
                      border: `1px solid ${isActive ? s.color : 'var(--color-border)'}`,
                      background: isActive ? `${s.color}18` : 'transparent',
                    }}
                  >
                    {tag}
                  </span>
                  {!isActive && (
                    <span style={{ color: 'var(--color-muted)' }}>
                      <LockIcon />
                    </span>
                  )}
                </div>

                {/* Subject name */}
                <h2
                  className="font-black tracking-tight mb-1"
                  style={{ fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', letterSpacing: '-0.03em', color: isActive ? s.color : 'var(--color-text)' }}
                >
                  {name}
                </h2>

                {/* Textbook */}
                <p className="text-xs font-bold tracking-wide uppercase" style={{ color: 'var(--color-muted)' }}>
                  {book}
                </p>

                {/* CTA for active */}
                {isActive && (
                  <div className="mt-5 flex items-center gap-2 text-xs font-black tracking-widest uppercase" style={{ color: s.color }}>
                    {isAr ? 'ابدأ الآن' : 'Start now'}
                    <span>{isAr ? '→' : '→'}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
