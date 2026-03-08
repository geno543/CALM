import { useNavigate } from 'react-router-dom';
import { motion }      from 'framer-motion';
import { useLang }     from '../contexts/LanguageContext';
import { useAuthStore } from '../stores/authStore';

// ── Data ──────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6"/>
        <circle cx="17" cy="11" r="3" fill="var(--color-primary)" stroke="none" opacity="0.5"/><path d="M15.5 11l1 1 2-2" stroke="var(--color-primary)" strokeWidth="1.5"/>
      </svg>
    ),
    color: 'var(--color-primary)',
    en: { title: 'RAG Grounding', desc: 'Every explanation is retrieved directly from Thomas\'s Calculus — grounded in verified knowledge, never hallucinated.' },
    ar: { title: 'تأسيس بالاسترجاع', desc: 'كل شرح مستند إلى مصادر موثّقة من كتاب Thomas\'s Calculus — لا توهمات، فقط معرفة دقيقة.' },
  },
  {
    num: '02',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    color: 'var(--color-accent)',
    en: { title: 'Bayesian Learner Model', desc: 'Your knowledge state is tracked in real-time across 7 mastery levels using Bayesian Knowledge Tracing — adapting to you at every step.' },
    ar: { title: 'نموذج المتعلم البايزي', desc: 'يتتبع النظام حالة معرفتك عبر 7 مستويات إتقان و يكيّف الجلسة لك بشكل فوري.' },
  },
  {
    num: '03',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="12" y2="13"/>
      </svg>
    ),
    color: '#D2A8FF',
    en: { title: 'Socratic Engine', desc: 'You are never given direct answers. CALM asks targeted questions that guide your reasoning from first principles to mastery.' },
    ar: { title: 'المحرك السقراطي', desc: 'لا إجابات مباشرة — يطرح CALM أسئلة موجّهة تبني فهمك من المبادئ الأولى حتى الإتقان.' },
  },
];

const STATS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
      </svg>
    ),
    value: '1.2–1.8',
    unit: 'd',
    en: 'Target Effect Size',
    ar: 'حجم الأثر المستهدف',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
      </svg>
    ),
    value: '7',
    unit: '',
    en: 'Mastery Levels',
    ar: 'مستويات الإتقان',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.66 0 3.22.45 4.56 1.24"/>
      </svg>
    ),
    value: '< 5%',
    unit: '',
    en: 'Hallucination Rate',
    ar: 'معدل التوهمات',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>
      </svg>
    ),
    value: '2',
    unit: ' lang',
    en: 'Bilingual EN / AR',
    ar: 'ثنائي اللغة',
  },
];

const COMPARE = [
  {
    en: ['Generic answers with no grounding', 'No memory of what you know', 'Gives you the answer directly', 'One language, one style'],
    ar: ['إجابات عامة بدون مصادر', 'لا ذاكرة لمعرفتك', 'تجيب مباشرة دون توجيه', 'لغة واحدة وأسلوب واحد'],
  },
  {
    en: ['RAG-grounded in Thomas\'s Calculus', 'Bayesian model of your knowledge state', 'Guides you with Socratic questions', 'Fully bilingual — Arabic & English'],
    ar: ['مرتكز على كتاب Thomas\'s Calculus', 'نموذج بايزي لمعرفتك الشخصية', 'يوجّهك بأسئلة سقراطية', 'ثنائي اللغة: عربي وإنجليزي'],
  },
];

const ARCH = [
  { key: 'RAG',  color: 'var(--color-primary)',  label: 'RAG Layer',     labelAr: 'طبقة الاسترجاع' },
  { key: 'BKT',  color: 'var(--color-accent)',   label: 'BKT Tracker',   labelAr: 'متتبع BKT' },
  { key: 'CTRL', color: 'var(--color-warning)',  label: 'Controller',    labelAr: 'المتحكم' },
  { key: 'MCSE', color: '#D2A8FF',              label: 'MCSE Engine',   labelAr: 'محرك MCSE' },
];

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

// ── Component ──────────────────────────────────────────────────────────────────

export default function Landing() {
  const navigate        = useNavigate();
  const { isAr, toggle } = useLang();
  const { isAuthed }    = useAuthStore();

  const go = () => navigate(isAuthed ? '/chat' : '/login');

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-ink)', color: 'var(--color-text)' }}>

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 backdrop-blur-md"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(13,17,23,0.85)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-sm"
            style={{ background: 'var(--color-primary)', color: 'var(--color-ink)' }}
          >
            C
          </div>
          <span className="font-bold tracking-tight text-sm">CALM</span>
          <span
            className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
          >
            {isAr ? 'للطلاب' : 'For Students'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
          >
            {isAr ? 'EN' : 'عربي'}
          </button>
          <button
            onClick={go}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
            style={{ background: 'var(--color-primary)', color: 'var(--color-ink)', boxShadow: '0 0 16px rgba(88,166,255,0.25)' }}
          >
            {isAuthed ? (isAr ? 'استمر التعلم' : 'Continue Learning') : (isAr ? 'ابدأ مجاناً' : 'Get Started Free')}
          </button>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{ background: 'radial-gradient(ellipse 90% 55% at 50% 0%, rgba(31,59,94,0.7) 0%, transparent 70%)' }}>
        <motion.section
          className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div
            custom={0} variants={fadeUp}
            className="flex justify-center mb-6"
          >
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase"
              style={{ background: 'var(--color-primary-dim)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}
            >
              {isAr ? 'نظام التدريس المعرفي' : 'Cognitive Apprenticeship System'}
            </span>
          </motion.div>

          <motion.h1
            custom={1} variants={fadeUp}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight mb-6"
            style={{ letterSpacing: '-0.03em' }}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {isAr ? (
              <>
                ماذا لو تعلّم كل طالب
                <br />
                <span style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  بمستوى أفضل الجامعات؟
                </span>
              </>
            ) : (
              <>
                Every student deserves{' '}
                <br />
                <span style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  world-class mentorship.
                </span>
              </>
            )}
          </motion.h1>

          <motion.p
            custom={2} variants={fadeUp}
            className="text-lg max-w-2xl mx-auto mb-4 leading-relaxed"
            style={{ color: 'var(--color-muted)' }}
          >
            {isAr
              ? 'CALM نظام تدريس ذكاء اصطناعي عصبي-رمزي يُقلّص الفجوة التعليمية في مجالات STEM من خلال تعليم شخصي على مستوى الدكتوراه.'
              : 'CALM is a neuro-symbolic AI tutoring system that closes the STEM achievement gap through PhD-level personalized mentorship — built for under-resourced students worldwide.'}
          </motion.p>

          <motion.p
            custom={3} variants={fadeUp}
            className="text-xs mb-10"
            style={{ color: 'var(--color-subtle, #484f58)' }}
          >
            {isAr
              ? 'مبنيّ على Thomas\'s Calculus · مدعوم بـ K2-Think · ثنائي اللغة'
              : "Built on Thomas's Calculus · Powered by K2-Think AI · Bilingual EN / AR"}
          </motion.p>

          <motion.div custom={4} variants={fadeUp} className="flex flex-wrap justify-center gap-3">
            <motion.button
              onClick={go}
              whileHover={{ scale: 1.03, boxShadow: '0 0 32px rgba(88,166,255,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 rounded-xl text-base font-semibold transition-all cursor-pointer"
              style={{ background: 'var(--color-primary)', color: 'var(--color-ink)' }}
            >
              {isAr ? 'ابدأ التعلم الآن' : 'Start Learning Now'}
            </motion.button>
            <motion.button
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 rounded-xl text-base font-medium cursor-pointer"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            >
              {isAr ? 'كيف يعمل؟' : 'How it works'}
            </motion.button>
          </motion.div>
        </motion.section>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="rounded-xl p-5 flex flex-col gap-3"
              style={{ background: 'linear-gradient(135deg, var(--color-surface), var(--color-surface-2))', border: '1px solid var(--color-border)' }}
            >
              <div style={{ color: 'var(--color-primary)' }}>{s.icon}</div>
              <div>
                <div className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--color-primary)' }}>
                  {s.value}<span className="text-sm font-semibold">{s.unit}</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                  {isAr ? s.ar : s.en}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how" className="max-w-5xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-primary)' }}>
            {isAr ? 'آلية العمل' : 'How It Works'}
          </p>
          <h2 className="text-3xl font-bold tracking-tight">
            {isAr ? 'ثلاث طبقات من الذكاء' : 'Three Layers of Intelligence'}
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-5">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="rounded-2xl p-6 space-y-4"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${step.color}18`, border: `1px solid ${step.color}55`, color: step.color }}
                >
                  {step.icon}
                </div>
                <span className="text-[11px] font-bold tracking-widest" style={{ color: 'var(--color-border)' }}>
                  {step.num}
                </span>
              </div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                {isAr ? step.ar.title : step.en.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                {isAr ? step.ar.desc : step.en.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Comparison ───────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-accent)' }}>
            {isAr ? 'لماذا CALM؟' : 'Why CALM?'}
          </p>
          <h2 className="text-3xl font-bold tracking-tight">
            {isAr ? 'ليس مجرد نموذج لغوي آخر' : 'Not just another chatbot'}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 gap-4"
        >
          {/* Left — generic AI */}
          <div
            className="rounded-2xl p-6 space-y-3"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-muted)' }}>
              {isAr ? 'دردشة ذكاء اصطناعي عامة' : 'Generic AI Chat'}
            </p>
            {COMPARE[0][isAr ? 'ar' : 'en'].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--color-muted)' }}>
                <span className="mt-0.5 font-bold" style={{ color: 'var(--color-danger)', flexShrink: 0 }}>✕</span>
                {item}
              </div>
            ))}
          </div>

          {/* Right — CALM */}
          <div
            className="rounded-2xl p-6 space-y-3"
            style={{ background: 'var(--color-primary-dim)', border: '1px solid var(--color-primary)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-primary)' }}>
              CALM
            </p>
            {COMPARE[1][isAr ? 'ar' : 'en'].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--color-text)' }}>
                <span className="mt-0.5 font-bold" style={{ color: 'var(--color-accent)', flexShrink: 0 }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Architecture ─────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-warning)' }}>
            {isAr ? 'البنية التقنية' : 'Under the Hood'}
          </p>
          <h2 className="text-3xl font-bold tracking-tight">
            {isAr ? 'بنية النظام' : 'System Architecture'}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl p-8"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex flex-wrap justify-center items-center gap-2">
            <div className="text-center">
              <div
                className="px-4 py-2.5 rounded-xl text-xs font-medium"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
              >
                {isAr ? 'إدخال الطالب' : 'Student Input'}
              </div>
            </div>

            {ARCH.map((a) => (
              <div key={a.key} className="flex items-center gap-2">
                <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
                  <path d="M0 6h20M16 1l5 5-5 5" stroke={a.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="text-center">
                  <div
                    className="px-4 py-2.5 rounded-xl text-xs font-bold tracking-tight"
                    style={{ background: `${a.color}15`, border: `1px solid ${a.color}`, color: a.color }}
                  >
                    {a.key}
                  </div>
                  <div className="text-[10px] mt-1.5" style={{ color: 'var(--color-muted)' }}>
                    {isAr ? a.labelAr : a.label}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-2">
              <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
                <path d="M0 6h20M16 1l5 5-5 5" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="text-center">
                <div
                  className="px-4 py-2.5 rounded-xl text-xs font-medium"
                  style={{ background: 'rgba(61,220,151,0.1)', border: '1px solid var(--color-accent)', color: 'var(--color-accent)' }}
                >
                  {isAr ? 'الاستجابة' : 'Response'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── CTA Banner ───────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, rgba(31,59,94,0.6) 0%, rgba(61,220,151,0.08) 100%)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto px-6 py-20 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-primary)' }}>
            {isAr ? 'الفرصة للجميع' : 'Equal Access'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">
            {isAr
              ? 'الذكاء موجود في كل مكان.'
              : 'Intelligence is everywhere.'}
            <br />
            <span style={{ color: 'var(--color-accent)' }}>
              {isAr ? 'الفرصة يجب أن تكون كذلك.' : 'Opportunity should be too.'}
            </span>
          </h2>
          <p className="mb-8 text-sm max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {isAr
              ? 'انضم إلى CALM وابدأ رحلتك نحو إتقان الرياضيات بمستوى الجامعات العالمية — بلغتك، وبوتيرتك الخاصة.'
              : 'Join CALM and begin your journey to world-class calculus mastery — at your own pace, in your own language.'}
          </p>
          <motion.button
            onClick={go}
            whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(88,166,255,0.4)' }}
            whileTap={{ scale: 0.96 }}
            className="px-12 py-3.5 rounded-xl text-base font-semibold cursor-pointer"
            style={{ background: 'var(--color-primary)', color: 'var(--color-ink)' }}
          >
            {isAr ? 'ابدأ مجاناً' : 'Start for Free'}
          </motion.button>
        </motion.section>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-ink)' }}>
        <div className="max-w-5xl mx-auto px-6 py-12 grid sm:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md flex items-center justify-center font-extrabold text-xs" style={{ background: 'var(--color-primary)', color: 'var(--color-ink)' }}>C</div>
              <span className="font-bold tracking-tight">CALM</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              {isAr
                ? 'نظام تدريس معرفي بالذكاء الاصطناعي للطلاب حول العالم.'
                : 'Cognitive Apprenticeship via Large Language Models — built for students worldwide.'}
            </p>
          </div>
          <div>
            <p className="font-semibold mb-3 text-xs uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              {isAr ? 'روابط سريعة' : 'Quick Links'}
            </p>
            <ul className="space-y-2 text-xs" style={{ color: 'var(--color-muted)' }}>
              <li><button onClick={go} className="hover:text-[var(--color-primary)] transition-colors cursor-pointer">{isAr ? 'الدردشة' : 'Start Chat'}</button></li>
              <li><button onClick={() => navigate('/progress')} className="hover:text-[var(--color-primary)] transition-colors cursor-pointer">{isAr ? 'خريطة التقدم' : 'Progress Map'}</button></li>
              <li><button onClick={() => navigate('/login')} className="hover:text-[var(--color-primary)] transition-colors cursor-pointer">{isAr ? 'تسجيل الدخول' : 'Sign In'}</button></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-3 text-xs uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              {isAr ? 'مبنيّ بـ' : 'Built With'}
            </p>
            <ul className="space-y-2 text-xs" style={{ color: 'var(--color-muted)' }}>
              <li>K2-Think-v2 (MBZUAI-IFM)</li>
              <li>Supabase Auth</li>
              <li>Thomas's Calculus RAG</li>
            </ul>
          </div>
        </div>
        <div className="text-center pb-6 text-xs" style={{ color: 'var(--color-subtle, #484f58)' }}>
          CALM — 2026
        </div>
      </footer>
    </div>
  );
}


const FLOW_STEPS = [
  {
    icon: 'RAG',
    en: { title: 'RAG Grounding', desc: 'Every explanation is retrieved from Thomas\'s Calculus — no hallucinations, only verified knowledge.' },
    ar: { title: 'تأسيس بالاسترجاع', desc: 'كل شرح مستند إلى كتاب Thomas\'s Calculus — لا توهمات، فقط معرفة موثقة.' },
  },
  {
    icon: 'BKT',
    en: { title: 'Bayesian Learner Model', desc: 'Your knowledge state is tracked in real-time across 7 mastery levels using Bayesian Knowledge Tracing.' },
    ar: { title: 'نموذج المتعلم البايزي', desc: 'تتبع حالة معرفتك في الوقت الفعلي عبر 7 مستويات إتقان باستخدام تتبع المعرفة البايزي.' },
  },
  {
    icon: 'SQ',
    en: { title: 'Socratic Engine', desc: 'Never given direct answers — MCSE asks targeted questions to build your reasoning from first principles.' },
    ar: { title: 'المحرك السقراطي', desc: 'لا إجابات مباشرة — يطرح MCSE أسئلة موجهة لبناء تفكيرك من المبادئ الأولى.' },
  },
];

const STATS = [
  { value: 'd = 1.2–1.8', en: 'Target Effect Size', ar: 'حجم الأثر المستهدف' },
  { value: '7',           en: 'Mastery Levels',     ar: 'مستويات الإتقان' },
  { value: '< 5%',        en: 'Hallucination Rate', ar: 'معدل التوهمات' },
  { value: '6',           en: 'Calculus Chapters',  ar: 'فصول الحساب' },
];

const ARCH = [
  { key: 'RAG',  color: 'var(--color-primary)',  label: 'RAG Layer',       labelAr: 'طبقة الاسترجاع' },
  { key: 'CRI',  color: 'var(--color-accent)',   label: 'CRI Verifier',    labelAr: 'موثق CRI' },
  { key: 'DLM',  color: 'var(--color-warning)',  label: 'DLM Tracker',     labelAr: 'متتبع DLM' },
  { key: 'MCSE', color: '#D2A8FF',               label: 'MCSE Engine',     labelAr: 'محرك MCSE' },
];

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function Landing() {
  const navigate  = useNavigate();
  const { isAr, toggle } = useLang();
  const { isAuthed } = useAuthStore();

  const go = () => navigate(isAuthed ? '/chat' : '/login');

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-ink)', color: 'var(--color-text)' }}>
      {/* ── Nav ────────────────────────────────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 backdrop-blur-md"
        style={{ borderBottom: '1px solid var(--color-border)', background: '#0D111799' }}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-tight">CALM</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggle}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
          >
            {isAr ? 'EN' : 'عربي'}
          </button>
          <button
            onClick={go}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
            style={{ background: 'var(--color-primary)', color: 'var(--color-ink)' }}
          >
            {isAuthed ? (isAr ? 'استمر التعلم' : 'Continue Learning') : (isAr ? 'ابدأ' : 'Get Started')}
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6">
        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <motion.section
          className="pt-24 pb-20 text-center"
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.div variants={fadeUp} className="flex justify-center mb-6">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase"
              style={{ background: 'var(--color-primary-dim)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}
            >
              {isAr ? 'نظام التدريس المعرفي' : 'Cognitive Apprenticeship System'}
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-5"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {isAr ? (
              <>
                ماذا لو تعلّم كل طالب
                <br />
                <span style={{ color: 'var(--color-primary)' }}>بمستوى أفضل الجامعات؟</span>
              </>
            ) : (
              <>
                What if every student learned at{' '}
                <br />
                <span style={{ color: 'var(--color-primary)' }}>the world&apos;s top schools?</span>
              </>
            )}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'var(--color-muted)' }}
          >
            {isAr
              ? 'CALM هو نظام تدريس ذكاء اصطناعي عصبي-رمزي يُقلّص الفجوة التعليمية في مجالات STEM من خلال تعليم شخصي يصل إلى مستوى الدكتوراه.'
              : 'CALM is a neuro-symbolic AI tutoring system that reduces the STEM achievement gap through PhD-level personalized mentorship — built for under-resourced students worldwide.'}
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3">
            <motion.button
              onClick={go}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="px-8 py-3 rounded-xl text-base font-semibold transition-all cursor-pointer"
              style={{ background: 'var(--color-primary)', color: 'var(--color-ink)' }}
            >
              {isAr ? 'ابدأ التعلم الآن' : 'Start Learning Now'}
            </motion.button>
            <motion.button
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="px-8 py-3 rounded-xl text-base font-medium cursor-pointer"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-2)' }}
            >
              {isAr ? 'كيف يعمل؟' : 'How it works'}
            </motion.button>
          </motion.div>
        </motion.section>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-8 border-y"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {STATS.map((s) => (
            <div key={s.value} className="text-center py-4">
              <div className="text-3xl font-extrabold tracking-tight mb-1" style={{ color: 'var(--color-primary)' }}>
                {s.value}
              </div>
              <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                {isAr ? s.ar : s.en}
              </div>
            </div>
          ))}
        </motion.section>

        {/* ── How it works ───────────────────────────────────────────────── */}
        <section id="how" className="py-20">
          <motion.h2
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-3xl font-bold mb-12 text-center"
          >
            {isAr ? 'كيف يعمل النظام؟' : 'How CALM Works'}
          </motion.h2>

          <div className="grid sm:grid-cols-3 gap-5">
            {FLOW_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl p-6 space-y-3"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div className="text-3xl">{step.icon}</div>
                <h3 className="font-semibold text-base">{isAr ? step.ar.title : step.en.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                  {isAr ? step.ar.desc : step.en.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Architecture pipeline ──────────────────────────────────────── */}
        <section className="py-12 pb-20">
          <motion.h2
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="text-2xl font-bold mb-8 text-center"
          >
            {isAr ? 'بنية النظام' : 'System Architecture'}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-2xl p-8 flex flex-wrap justify-center items-center gap-3"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            {/* Student Input */}
            <div className="text-center">
              <div
                className="px-4 py-2 rounded-lg text-sm font-medium mb-1"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-2)' }}
              >
                {isAr ? 'إدخال الطالب' : 'Student Input'}
              </div>
            </div>

            {ARCH.map((a) => (
              <div key={a.key} className="flex items-center gap-3">
                <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                  <path d="M0 6h16M12 1l5 5-5 5" stroke={a.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div className="text-center">
                  <div
                    className="px-4 py-2 rounded-lg text-sm font-bold tracking-tight"
                    style={{ background: `${a.color}18`, border: `1px solid ${a.color}`, color: a.color }}
                  >
                    {a.key}
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: 'var(--color-muted)' }}>
                    {isAr ? a.labelAr : a.label}
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-3">
              <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
                <path d="M0 6h16M12 1l5 5-5 5" stroke="var(--color-text-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-2)' }}
              >
                {isAr ? 'إخراج للطالب' : 'Output'}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── CTA banner ─────────────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="rounded-2xl p-10 text-center mb-24"
          style={{ background: 'var(--color-primary-dim)', border: '1px solid var(--color-primary)' }}
        >
          <h2 className="text-2xl font-bold mb-3">
            {isAr ? 'الذكاء يوجد في كل مكان. الفرصة يجب أن تكون كذلك.' : 'Intelligence is everywhere. Opportunity should be too.'}
          </h2>
          <p className="mb-7 text-sm" style={{ color: 'var(--color-text-2)' }}>
            {isAr
              ? 'انضم إلى CALM وابدأ رحلتك نحو إتقان الأرياضيات بمستوى الجامعات العالمية.'
              : 'Join CALM and begin your journey to world-class calculus mastery — at your own pace, in your own language.'}
          </p>
          <motion.button
            onClick={go}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="px-10 py-3 rounded-xl text-base font-semibold cursor-pointer"
            style={{ background: 'var(--color-primary)', color: 'var(--color-ink)' }}
          >
            {isAr ? 'ابدأ مجاناً' : 'Start for Free'}
          </motion.button>
        </motion.section>
      </main>

      {/* Footer */}
      <footer
        className="text-center py-6 text-xs"
        style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-subtle)' }}
      >
        CALM — Cognitive Apprenticeship via Large Language Models . 2026
      </footer>
    </div>
  );
}
