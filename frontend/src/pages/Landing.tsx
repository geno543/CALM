import { useNavigate } from 'react-router-dom';
import { motion }      from 'framer-motion';
import { useLang }     from '../contexts/LanguageContext';
import { useAuthStore } from '../stores/authStore';

// â”€â”€ Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
    en: { title: 'RAG Grounding', desc: 'Every explanation is retrieved directly from Thomas\'s Calculus â€” grounded in verified knowledge, never hallucinated.' },
    ar: { title: 'ØªØ£Ø³ÙŠØ³ Ø¨Ø§Ù„Ø§Ø³ØªØ±Ø¬Ø§Ø¹', desc: 'ÙƒÙ„ Ø´Ø±Ø­ Ù…Ø³ØªÙ†Ø¯ Ø¥Ù„Ù‰ Ù…ØµØ§Ø¯Ø± Ù…ÙˆØ«Ù‘Ù‚Ø© Ù…Ù† ÙƒØªØ§Ø¨ Thomas\'s Calculus â€” Ù„Ø§ ØªÙˆÙ‡Ù…Ø§ØªØŒ ÙÙ‚Ø· Ù…Ø¹Ø±ÙØ© Ø¯Ù‚ÙŠÙ‚Ø©.' },
  },
  {
    num: '02',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    color: 'var(--color-accent)',
    en: { title: 'Bayesian Learner Model', desc: 'Your knowledge state is tracked in real-time across 7 mastery levels using Bayesian Knowledge Tracing â€” adapting to you at every step.' },
    ar: { title: 'Ù†Ù…ÙˆØ°Ø¬ Ø§Ù„Ù…ØªØ¹Ù„Ù… Ø§Ù„Ø¨Ø§ÙŠØ²ÙŠ', desc: 'ÙŠØªØªØ¨Ø¹ Ø§Ù„Ù†Ø¸Ø§Ù… Ø­Ø§Ù„Ø© Ù…Ø¹Ø±ÙØªÙƒ Ø¹Ø¨Ø± 7 Ù…Ø³ØªÙˆÙŠØ§Øª Ø¥ØªÙ‚Ø§Ù† Ùˆ ÙŠÙƒÙŠÙ‘Ù Ø§Ù„Ø¬Ù„Ø³Ø© Ù„Ùƒ Ø¨Ø´ÙƒÙ„ ÙÙˆØ±ÙŠ.' },
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
    ar: { title: 'Ø§Ù„Ù…Ø­Ø±Ùƒ Ø§Ù„Ø³Ù‚Ø±Ø§Ø·ÙŠ', desc: 'Ù„Ø§ Ø¥Ø¬Ø§Ø¨Ø§Øª Ù…Ø¨Ø§Ø´Ø±Ø© â€” ÙŠØ·Ø±Ø­ CALM Ø£Ø³Ø¦Ù„Ø© Ù…ÙˆØ¬Ù‘Ù‡Ø© ØªØ¨Ù†ÙŠ ÙÙ‡Ù…Ùƒ Ù…Ù† Ø§Ù„Ù…Ø¨Ø§Ø¯Ø¦ Ø§Ù„Ø£ÙˆÙ„Ù‰ Ø­ØªÙ‰ Ø§Ù„Ø¥ØªÙ‚Ø§Ù†.' },
  },
];

const STATS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
      </svg>
    ),
    value: '1.2â€“1.8',
    unit: 'd',
    en: 'Target Effect Size',
    ar: 'Ø­Ø¬Ù… Ø§Ù„Ø£Ø«Ø± Ø§Ù„Ù…Ø³ØªÙ‡Ø¯Ù',
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
    ar: 'Ù…Ø³ØªÙˆÙŠØ§Øª Ø§Ù„Ø¥ØªÙ‚Ø§Ù†',
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
    ar: 'Ù…Ø¹Ø¯Ù„ Ø§Ù„ØªÙˆÙ‡Ù…Ø§Øª',
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
    ar: 'Ø«Ù†Ø§Ø¦ÙŠ Ø§Ù„Ù„ØºØ©',
  },
];

const COMPARE = [
  {
    en: ['Generic answers with no grounding', 'No memory of what you know', 'Gives you the answer directly', 'One language, one style'],
    ar: ['Ø¥Ø¬Ø§Ø¨Ø§Øª Ø¹Ø§Ù…Ø© Ø¨Ø¯ÙˆÙ† Ù…ØµØ§Ø¯Ø±', 'Ù„Ø§ Ø°Ø§ÙƒØ±Ø© Ù„Ù…Ø¹Ø±ÙØªÙƒ', 'ØªØ¬ÙŠØ¨ Ù…Ø¨Ø§Ø´Ø±Ø© Ø¯ÙˆÙ† ØªÙˆØ¬ÙŠÙ‡', 'Ù„ØºØ© ÙˆØ§Ø­Ø¯Ø© ÙˆØ£Ø³Ù„ÙˆØ¨ ÙˆØ§Ø­Ø¯'],
  },
  {
    en: ['RAG-grounded in Thomas\'s Calculus', 'Bayesian model of your knowledge state', 'Guides you with Socratic questions', 'Fully bilingual â€” Arabic & English'],
    ar: ['Ù…Ø±ØªÙƒØ² Ø¹Ù„Ù‰ ÙƒØªØ§Ø¨ Thomas\'s Calculus', 'Ù†Ù…ÙˆØ°Ø¬ Ø¨Ø§ÙŠØ²ÙŠ Ù„Ù…Ø¹Ø±ÙØªÙƒ Ø§Ù„Ø´Ø®ØµÙŠØ©', 'ÙŠÙˆØ¬Ù‘Ù‡Ùƒ Ø¨Ø£Ø³Ø¦Ù„Ø© Ø³Ù‚Ø±Ø§Ø·ÙŠØ©', 'Ø«Ù†Ø§Ø¦ÙŠ Ø§Ù„Ù„ØºØ©: Ø¹Ø±Ø¨ÙŠ ÙˆØ¥Ù†Ø¬Ù„ÙŠØ²ÙŠ'],
  },
];

const ARCH = [
  { key: 'RAG',  color: 'var(--color-primary)',  label: 'RAG Layer',     labelAr: 'Ø·Ø¨Ù‚Ø© Ø§Ù„Ø§Ø³ØªØ±Ø¬Ø§Ø¹' },
  { key: 'BKT',  color: 'var(--color-accent)',   label: 'BKT Tracker',   labelAr: 'Ù…ØªØªØ¨Ø¹ BKT' },
  { key: 'CTRL', color: 'var(--color-warning)',  label: 'Controller',    labelAr: 'Ø§Ù„Ù…ØªØ­ÙƒÙ…' },
  { key: 'MCSE', color: '#D2A8FF',              label: 'MCSE Engine',   labelAr: 'Ù…Ø­Ø±Ùƒ MCSE' },
];

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function Landing() {
  const navigate        = useNavigate();
  const { isAr, toggle } = useLang();
  const { isAuthed }    = useAuthStore();

  const go = () => navigate(isAuthed ? '/chat' : '/login');

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-ink)', color: 'var(--color-text)' }}>

      {/* â”€â”€ Nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
            {isAr ? 'Ù„Ù„Ø·Ù„Ø§Ø¨' : 'For Students'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)' }}
          >
            {isAr ? 'EN' : 'Ø¹Ø±Ø¨ÙŠ'}
          </button>
          <button
            onClick={go}
            className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
            style={{ background: 'var(--color-primary)', color: 'var(--color-ink)', boxShadow: '0 0 16px rgba(88,166,255,0.25)' }}
          >
            {isAuthed ? (isAr ? 'Ø§Ø³ØªÙ…Ø± Ø§Ù„ØªØ¹Ù„Ù…' : 'Continue Learning') : (isAr ? 'Ø§Ø¨Ø¯Ø£ Ù…Ø¬Ø§Ù†Ø§Ù‹' : 'Get Started Free')}
          </button>
        </div>
      </nav>

      {/* â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
              {isAr ? 'Ù†Ø¸Ø§Ù… Ø§Ù„ØªØ¯Ø±ÙŠØ³ Ø§Ù„Ù…Ø¹Ø±ÙÙŠ' : 'Cognitive Apprenticeship System'}
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
                Ù…Ø§Ø°Ø§ Ù„Ùˆ ØªØ¹Ù„Ù‘Ù… ÙƒÙ„ Ø·Ø§Ù„Ø¨
                <br />
                <span style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Ø¨Ù…Ø³ØªÙˆÙ‰ Ø£ÙØ¶Ù„ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§ØªØŸ
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
              ? 'CALM Ù†Ø¸Ø§Ù… ØªØ¯Ø±ÙŠØ³ Ø°ÙƒØ§Ø¡ Ø§ØµØ·Ù†Ø§Ø¹ÙŠ Ø¹ØµØ¨ÙŠ-Ø±Ù…Ø²ÙŠ ÙŠÙÙ‚Ù„Ù‘Øµ Ø§Ù„ÙØ¬ÙˆØ© Ø§Ù„ØªØ¹Ù„ÙŠÙ…ÙŠØ© ÙÙŠ Ù…Ø¬Ø§Ù„Ø§Øª STEM Ù…Ù† Ø®Ù„Ø§Ù„ ØªØ¹Ù„ÙŠÙ… Ø´Ø®ØµÙŠ Ø¹Ù„Ù‰ Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø¯ÙƒØªÙˆØ±Ø§Ù‡.'
              : 'CALM is a neuro-symbolic AI tutoring system that closes the STEM achievement gap through PhD-level personalized mentorship â€” built for under-resourced students worldwide.'}
          </motion.p>

          <motion.p
            custom={3} variants={fadeUp}
            className="text-xs mb-10"
            style={{ color: 'var(--color-subtle, #484f58)' }}
          >
            {isAr
              ? 'Ù…Ø¨Ù†ÙŠÙ‘ Ø¹Ù„Ù‰ Thomas\'s Calculus Â· Ù…Ø¯Ø¹ÙˆÙ… Ø¨Ù€ K2-Think Â· Ø«Ù†Ø§Ø¦ÙŠ Ø§Ù„Ù„ØºØ©'
              : "Built on Thomas's Calculus Â· Powered by K2-Think AI Â· Bilingual EN / AR"}
          </motion.p>

          <motion.div custom={4} variants={fadeUp} className="flex flex-wrap justify-center gap-3">
            <motion.button
              onClick={go}
              whileHover={{ scale: 1.03, boxShadow: '0 0 32px rgba(88,166,255,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 rounded-xl text-base font-semibold transition-all cursor-pointer"
              style={{ background: 'var(--color-primary)', color: 'var(--color-ink)' }}
            >
              {isAr ? 'Ø§Ø¨Ø¯Ø£ Ø§Ù„ØªØ¹Ù„Ù… Ø§Ù„Ø¢Ù†' : 'Start Learning Now'}
            </motion.button>
            <motion.button
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 rounded-xl text-base font-medium cursor-pointer"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            >
              {isAr ? 'ÙƒÙŠÙ ÙŠØ¹Ù…Ù„ØŸ' : 'How it works'}
            </motion.button>
          </motion.div>
        </motion.section>
      </div>

      {/* â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

      {/* â”€â”€ How it works â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="how" className="max-w-5xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-primary)' }}>
            {isAr ? 'Ø¢Ù„ÙŠØ© Ø§Ù„Ø¹Ù…Ù„' : 'How It Works'}
          </p>
          <h2 className="text-3xl font-bold tracking-tight">
            {isAr ? 'Ø«Ù„Ø§Ø« Ø·Ø¨Ù‚Ø§Øª Ù…Ù† Ø§Ù„Ø°ÙƒØ§Ø¡' : 'Three Layers of Intelligence'}
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

      {/* â”€â”€ Comparison â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-accent)' }}>
            {isAr ? 'Ù„Ù…Ø§Ø°Ø§ CALMØŸ' : 'Why CALM?'}
          </p>
          <h2 className="text-3xl font-bold tracking-tight">
            {isAr ? 'Ù„ÙŠØ³ Ù…Ø¬Ø±Ø¯ Ù†Ù…ÙˆØ°Ø¬ Ù„ØºÙˆÙŠ Ø¢Ø®Ø±' : 'Not just another chatbot'}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 gap-4"
        >
          {/* Left â€” generic AI */}
          <div
            className="rounded-2xl p-6 space-y-3"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-muted)' }}>
              {isAr ? 'Ø¯Ø±Ø¯Ø´Ø© Ø°ÙƒØ§Ø¡ Ø§ØµØ·Ù†Ø§Ø¹ÙŠ Ø¹Ø§Ù…Ø©' : 'Generic AI Chat'}
            </p>
            {COMPARE[0][isAr ? 'ar' : 'en'].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--color-muted)' }}>
                <span className="mt-0.5 font-bold" style={{ color: 'var(--color-danger)', flexShrink: 0 }}>âœ•</span>
                {item}
              </div>
            ))}
          </div>

          {/* Right â€” CALM */}
          <div
            className="rounded-2xl p-6 space-y-3"
            style={{ background: 'var(--color-primary-dim)', border: '1px solid var(--color-primary)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--color-primary)' }}>
              CALM
            </p>
            {COMPARE[1][isAr ? 'ar' : 'en'].map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--color-text)' }}>
                <span className="mt-0.5 font-bold" style={{ color: 'var(--color-accent)', flexShrink: 0 }}>âœ“</span>
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* â”€â”€ Architecture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-warning)' }}>
            {isAr ? 'Ø§Ù„Ø¨Ù†ÙŠØ© Ø§Ù„ØªÙ‚Ù†ÙŠØ©' : 'Under the Hood'}
          </p>
          <h2 className="text-3xl font-bold tracking-tight">
            {isAr ? 'Ø¨Ù†ÙŠØ© Ø§Ù„Ù†Ø¸Ø§Ù…' : 'System Architecture'}
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
                {isAr ? 'Ø¥Ø¯Ø®Ø§Ù„ Ø§Ù„Ø·Ø§Ù„Ø¨' : 'Student Input'}
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
                  {isAr ? 'Ø§Ù„Ø§Ø³ØªØ¬Ø§Ø¨Ø©' : 'Response'}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* â”€â”€ CTA Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div style={{ background: 'linear-gradient(135deg, rgba(31,59,94,0.6) 0%, rgba(61,220,151,0.08) 100%)', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto px-6 py-20 text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--color-primary)' }}>
            {isAr ? 'Ø§Ù„ÙØ±ØµØ© Ù„Ù„Ø¬Ù…ÙŠØ¹' : 'Equal Access'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight">
            {isAr
              ? 'Ø§Ù„Ø°ÙƒØ§Ø¡ Ù…ÙˆØ¬ÙˆØ¯ ÙÙŠ ÙƒÙ„ Ù…ÙƒØ§Ù†.'
              : 'Intelligence is everywhere.'}
            <br />
            <span style={{ color: 'var(--color-accent)' }}>
              {isAr ? 'Ø§Ù„ÙØ±ØµØ© ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† ÙƒØ°Ù„Ùƒ.' : 'Opportunity should be too.'}
            </span>
          </h2>
          <p className="mb-8 text-sm max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--color-muted)' }}>
            {isAr
              ? 'Ø§Ù†Ø¶Ù… Ø¥Ù„Ù‰ CALM ÙˆØ§Ø¨Ø¯Ø£ Ø±Ø­Ù„ØªÙƒ Ù†Ø­Ùˆ Ø¥ØªÙ‚Ø§Ù† Ø§Ù„Ø±ÙŠØ§Ø¶ÙŠØ§Øª Ø¨Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø¬Ø§Ù…Ø¹Ø§Øª Ø§Ù„Ø¹Ø§Ù„Ù…ÙŠØ© â€” Ø¨Ù„ØºØªÙƒØŒ ÙˆØ¨ÙˆØªÙŠØ±ØªÙƒ Ø§Ù„Ø®Ø§ØµØ©.'
              : 'Join CALM and begin your journey to world-class calculus mastery â€” at your own pace, in your own language.'}
          </p>
          <motion.button
            onClick={go}
            whileHover={{ scale: 1.04, boxShadow: '0 0 40px rgba(88,166,255,0.4)' }}
            whileTap={{ scale: 0.96 }}
            className="px-12 py-3.5 rounded-xl text-base font-semibold cursor-pointer"
            style={{ background: 'var(--color-primary)', color: 'var(--color-ink)' }}
          >
            {isAr ? 'Ø§Ø¨Ø¯Ø£ Ù…Ø¬Ø§Ù†Ø§Ù‹' : 'Start for Free'}
          </motion.button>
        </motion.section>
      </div>

      {/* â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <footer style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-ink)' }}>
        <div className="max-w-5xl mx-auto px-6 py-12 grid sm:grid-cols-3 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md flex items-center justify-center font-extrabold text-xs" style={{ background: 'var(--color-primary)', color: 'var(--color-ink)' }}>C</div>
              <span className="font-bold tracking-tight">CALM</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--color-muted)' }}>
              {isAr
                ? 'Ù†Ø¸Ø§Ù… ØªØ¯Ø±ÙŠØ³ Ù…Ø¹Ø±ÙÙŠ Ø¨Ø§Ù„Ø°ÙƒØ§Ø¡ Ø§Ù„Ø§ØµØ·Ù†Ø§Ø¹ÙŠ Ù„Ù„Ø·Ù„Ø§Ø¨ Ø­ÙˆÙ„ Ø§Ù„Ø¹Ø§Ù„Ù….'
                : 'Cognitive Apprenticeship via Large Language Models â€” built for students worldwide.'}
            </p>
          </div>
          <div>
            <p className="font-semibold mb-3 text-xs uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              {isAr ? 'Ø±ÙˆØ§Ø¨Ø· Ø³Ø±ÙŠØ¹Ø©' : 'Quick Links'}
            </p>
            <ul className="space-y-2 text-xs" style={{ color: 'var(--color-muted)' }}>
              <li><button onClick={go} className="hover:text-[var(--color-primary)] transition-colors cursor-pointer">{isAr ? 'Ø§Ù„Ø¯Ø±Ø¯Ø´Ø©' : 'Start Chat'}</button></li>
              <li><button onClick={() => navigate('/progress')} className="hover:text-[var(--color-primary)] transition-colors cursor-pointer">{isAr ? 'Ø®Ø±ÙŠØ·Ø© Ø§Ù„ØªÙ‚Ø¯Ù…' : 'Progress Map'}</button></li>
              <li><button onClick={() => navigate('/login')} className="hover:text-[var(--color-primary)] transition-colors cursor-pointer">{isAr ? 'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„' : 'Sign In'}</button></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold mb-3 text-xs uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              {isAr ? 'Ù…Ø¨Ù†ÙŠÙ‘ Ø¨Ù€' : 'Built With'}
            </p>
            <ul className="space-y-2 text-xs" style={{ color: 'var(--color-muted)' }}>
              <li>K2-Think-v2 (MBZUAI-IFM)</li>
              <li>Supabase Auth</li>
              <li>Thomas's Calculus RAG</li>
            </ul>
          </div>
        </div>
        <div className="text-center pb-6 text-xs" style={{ color: 'var(--color-subtle, #484f58)' }}>
          CALM â€” 2026
        </div>
      </footer>
    </div>
  );
}

