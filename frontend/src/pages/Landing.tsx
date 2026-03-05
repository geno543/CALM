import { useNavigate } from 'react-router-dom';
import { motion }      from 'framer-motion';
import { useLang }     from '../contexts/LanguageContext';
import { useAuthStore } from '../stores/authStore';

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
