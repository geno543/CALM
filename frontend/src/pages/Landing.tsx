import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLang } from '../contexts/LanguageContext';
import { useAuthStore } from '../stores/authStore';

//  Ticker 
const TICKER_EN = [
  '7 MASTERY LEVELS',
  '< 5% HALLUCINATION RATE',
  'RAG-GROUNDED KNOWLEDGE',
  'BAYESIAN KNOWLEDGE TRACING',
  'SOCRATIC METHOD',
  'BILINGUAL EN / AR',
  'THOMAS\'S CALCULUS',
  'K2-THINK POWERED',
  'CALCULUS — LIVE NOW',
  'BIOLOGY — COMING SOON',
  'CHEMISTRY — COMING SOON',
  'PHYSICS — COMING SOON',
];
const TICKER_AR = [
  '7 مستويات إتقان',
  'أقل من 5% توهمات',
  'معرفة موثقة بالاسترجاع',
  'تتبع بايزي للمعرفة',
  'الأسلوب السقراطي',
  'ثنائي اللغة',
  'كتاب Thomas\'s Calculus',
  'مدعوم بـ K2-Think',
  'الحساب — متاح الآن',
  'الأحياء — قريبا',
  'الكيمياء — قريبا',
  'الفيزياء — قريبا',
];

function Ticker({ isAr }: { isAr: boolean }) {
  const items = isAr ? TICKER_AR : TICKER_EN;
  const doubled = [...items, ...items];
  return (
    <div
      className="overflow-hidden py-3 border-y"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: isAr ? ['0%', '50%'] : ['0%', '-50%'] }}
        transition={{ duration: 22, ease: 'linear', repeat: Infinity }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-3 text-[11px] font-bold tracking-widest uppercase shrink-0" style={{ color: 'var(--color-muted)' }}>
            <span style={{ color: 'var(--color-primary)', opacity: 0.5 }}>/</span>
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

//  Pipeline steps 
const PIPELINE_EN = [
  { num: '01', title: 'QUESTION RECEIVED', desc: 'You ask anything about your subject — Calculus, Biology, Chemistry, or Physics. CALM identifies the concept, maps it to the curriculum, and runs RAG retrieval from the verified textbook.' },
  { num: '02', title: 'RAG RETRIEVAL', desc: 'Relevant verified passages are pulled from authoritative textbooks. Every explanation is grounded — no hallucinated science or mathematics.' },
  { num: '03', title: 'BKT UPDATE', desc: 'Bayesian Knowledge Tracing updates your mastery estimate across the concept tree in real time. 7 levels. Continuous adaptation.' },
  { num: '04', title: 'SOCRATIC RESPONSE', desc: 'You never get the answer. You get a question that makes you find it. The engine guides you from first principles to mastery.' },
];
const PIPELINE_AR = [
  { num: '01', title: 'استقبال السؤال', desc: 'تطرح أي سؤال في مادتك — الحساب أو الأحياء أو الكيمياء أو الفيزياء. يعرف CALM المفهوم ويضعه على خريطة المنهج ويستعيد المعلومات من الكتاب الموثوق.' },
  { num: '02', title: 'استرجاع المعرفة', desc: 'تسحب مقاطع موثقة من كتب مرجعية معتمدة. كل شرح مرتكز على مصادر — لا علوم ولا رياضيات متوهمة.' },
  { num: '03', title: 'تحديث BKT', desc: 'يحدث تتبع المعرفة البايزي تقدير إتقانك عبر شجرة المفاهيم في الوقت الفعلي. 7 مستويات. تكيف مستمر.' },
  { num: '04', title: 'الاستجابة السقراطية', desc: 'لا تحصل على الجواب أبدا. تحصل على سؤال يجعلك تجده بنفسك. يقودك المحرك من المبادئ الأولى إلى الإتقان.' },
];

//  Compare 
const COMPARE = {
  bad: {
    en: ['Generic answers with no source grounding', 'No model of what you actually know', 'Gives you the answer directly', 'One language, one style, no adaptation'],
    ar: ['إجابات عامة بدون مصادر', 'لا نموذج لما تعرفه فعلا', 'تعطيك الجواب مباشرة', 'لغة واحدة بدون تكيف'],
  },
  good: {
    en: ['RAG-grounded in verified textbooks — no hallucinations', 'Bayesian model of your personal knowledge state', 'Guides you with Socratic questions to build real understanding', 'Fully bilingual Arabic + English, adapts to you'],
    ar: ['مرتكز على كتب موثوقة — لا توهمات', 'نموذج بايزي لحالة معرفتك الشخصية', 'يوجهك بأسئلة سقراطية لبناء فهم حقيقي', 'ثنائي اللغة عربي + إنجليزي يتكيف معك'],
  },
};

//  Component 
export default function Landing() {
  const navigate = useNavigate();
  const { isAr, toggle } = useLang();
  const { isAuthed, logout } = useAuthStore();
  const pipeline = isAr ? PIPELINE_AR : PIPELINE_EN;

  const go = () => navigate(isAuthed ? '/subjects' : '/login');

  return (
    <div className="min-h-dvh" style={{ background: 'var(--color-ink)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>

      {/* NAV */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'rgba(13,17,23,0.92)', backdropFilter: 'blur(8px)' }}
      >
        <div className="flex items-center gap-3">
          <span className="font-black tracking-tighter text-base" style={{ letterSpacing: '-0.04em' }}>CALM</span>
          <span
            className="hidden sm:inline text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded"
            style={{ background: 'var(--color-primary-dim)', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' }}
          >
            {isAr ? 'للطلاب' : 'Beta'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 cursor-pointer transition-colors"
            style={{ color: 'var(--color-muted)', border: '1px solid var(--color-border)' }}
          >
            {isAr ? 'EN' : 'عربي'}
          </button>
          <button
            onClick={go}
            className="text-xs font-black tracking-wider uppercase px-4 py-1.5 cursor-pointer transition-all"
            style={{ background: 'var(--color-primary)', color: 'var(--color-ink)' }}
          >
            {isAuthed ? (isAr ? 'استمر' : 'Continue ') : (isAr ? 'ابدأ' : 'Start ')}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section
        className="px-6 pt-20 pb-0 max-w-5xl mx-auto"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p
            className="text-[11px] font-bold tracking-widest uppercase mb-6"
            style={{ color: 'var(--color-primary)' }}
          >
            {isAr ? '>_ نظام التدريس المعرفي' : '>_ Cognitive Apprenticeship System'}
          </p>

          <h1
            className="font-black leading-none mb-8"
            style={{ fontSize: 'clamp(2.8rem, 8vw, 5.5rem)', letterSpacing: '-0.04em', color: 'var(--color-text)' }}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {isAr ? (
              <>
                كل طالب يستحق<br />
                <span style={{ color: 'var(--color-primary)' }}>مدرسا من الدرجة الأولى.</span>
              </>
            ) : (
              <>
                Stop memorizing.<br />
                <span style={{ color: 'var(--color-primary)' }}>Start understanding.</span>
              </>
            )}
          </h1>

          <p
            className="text-base leading-relaxed mb-8 max-w-2xl"
            style={{ color: 'var(--color-muted)', lineHeight: 1.7 }}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {isAr
              ? 'CALM هو نظام تدريس ذكاء اصطناعي عصبي-رمزي يقلص الفجوة التعليمية في STEM من خلال تعليم شخصي على مستوى الدكتوراه  يغطي الحساب والأحياء والكيمياء والفيزياء. مبني للطلاب في كل مكان حول العالم.'
              : 'CALM is a neuro-symbolic AI tutor that closes the STEM achievement gap through PhD-level personalized mentorship — covering Calculus, Biology, Chemistry, and Physics. Built for under-resourced students worldwide.'}
          </p>

          <div className="flex flex-wrap items-center gap-4 pb-12">
            <motion.button
              onClick={go}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="font-black tracking-wider uppercase text-sm px-8 py-3 cursor-pointer transition-all"
              style={{ background: 'var(--color-primary)', color: 'var(--color-ink)', boxShadow: '0 0 24px rgba(88,166,255,0.3)' }}
            >
              {isAr ? 'ابدأ التعلم الآن ' : 'Start Learning Now '}
            </motion.button>
            <button
              onClick={() => document.getElementById('pipeline')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm font-bold tracking-wider uppercase cursor-pointer transition-colors"
              style={{ color: 'var(--color-muted)', textDecoration: 'underline', textUnderlineOffset: 4 }}
            >
              {isAr ? 'كيف يعمل' : 'How it works'}
            </button>
            <span className="text-xs" style={{ color: 'var(--color-subtle, #484f58)' }}>
              {isAr ? '// مجاني تماما' : '// free to use. no credit card.'}
            </span>
          </div>
        </motion.div>
      </section>

      {/* TICKER */}
      <Ticker isAr={isAr} />

      {/* STATS BAR */}
      <section
        className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-0"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        {[
          { val: '1.21.8', unit: 'd', label: isAr ? 'حجم الأثر المستهدف' : 'Target Effect Size' },
          { val: '7', unit: '', label: isAr ? 'مستويات الإتقان' : 'Mastery Levels' },
          { val: '< 5%', unit: '', label: isAr ? 'معدل التوهمات' : 'Hallucination Rate' },
          { val: '2', unit: ' lang', label: isAr ? 'ثنائي اللغة' : 'Bilingual EN / AR' },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="py-6 px-4"
            style={{ borderRight: i < 3 ? '1px solid var(--color-border)' : 'none' }}
          >
            <div
              className="font-black tracking-tighter mb-1"
              style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', color: 'var(--color-primary)', letterSpacing: '-0.04em' }}
            >
              {s.val}<span className="text-sm">{s.unit}</span>
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
              {s.label}
            </div>
          </motion.div>
        ))}
      </section>

      {/* PIPELINE */}
      <section id="pipeline" className="max-w-5xl mx-auto px-6 py-20" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--color-primary)' }}>
            {isAr ? '>_ آلية العمل' : '>_ The Pipeline'}
          </p>
          <h2
            className="font-black leading-tight"
            style={{ fontSize: 'clamp(1.6rem, 5vw, 2.8rem)', letterSpacing: '-0.03em' }}
          >
            {isAr ? 'كيف يعمل CALM' : 'How CALM Works.'}
          </h2>
        </motion.div>

        <div className="space-y-0">
          {pipeline.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: isAr ? 20 : -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-8 py-8"
              style={{ borderTop: '1px solid var(--color-border)' }}
              dir={isAr ? 'rtl' : 'ltr'}
            >
              <div
                className="font-black shrink-0 leading-none"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', color: 'var(--color-border)', letterSpacing: '-0.05em', minWidth: '3rem' }}
              >
                {step.num}
              </div>
              <div className="pt-1">
                <h3
                  className="font-black tracking-tight mb-2"
                  style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)', letterSpacing: '-0.02em' }}
                >
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)', maxWidth: '560px' }}>
                  {step.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* COMPARISON */}
      <section className="max-w-5xl mx-auto px-6 py-20" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
          dir={isAr ? 'rtl' : 'ltr'}
        >
          <p className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--color-accent)' }}>
            {isAr ? '>_ لماذا CALM' : '>_ Why CALM?'}
          </p>
          <h2
            className="font-black leading-tight"
            style={{ fontSize: 'clamp(1.6rem, 5vw, 2.8rem)', letterSpacing: '-0.03em' }}
          >
            {isAr ? 'ليس مجرد نموذج لغوي.' : 'Not just another chatbot.'}
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-0">
          {/* Bad */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8"
            style={{ border: '1px solid var(--color-border)' }}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <p className="text-[11px] font-bold tracking-widest uppercase mb-6" style={{ color: 'var(--color-muted)' }}>
              {isAr ? 'دردشة ذكاء اصطناعي عامة' : 'Generic AI Chat'}
            </p>
            <div className="space-y-4">
              {COMPARE.bad[isAr ? 'ar' : 'en'].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--color-muted)' }}>
                  <span className="font-black text-base leading-tight shrink-0" style={{ color: 'var(--color-danger)' }}></span>
                  {item}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Good */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-8"
            style={{ border: '1px solid var(--color-primary)', background: 'var(--color-primary-dim)' }}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            <p className="text-[11px] font-bold tracking-widest uppercase mb-6" style={{ color: 'var(--color-primary)' }}>
              CALM
            </p>
            <div className="space-y-4">
              {COMPARE.good[isAr ? 'ar' : 'en'].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--color-text)' }}>
                  <span className="font-black text-base leading-tight shrink-0" style={{ color: 'var(--color-accent)' }}>+</span>
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-[11px] font-bold tracking-widest uppercase mb-6" style={{ color: 'var(--color-primary)' }}>
            {isAr ? '>_ الفرصة للجميع' : '>_ Equal Access'}
          </p>
          <h2
            className="font-black leading-none mb-6"
            style={{ fontSize: 'clamp(2rem, 7vw, 4.5rem)', letterSpacing: '-0.04em' }}
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {isAr ? (
              <>الذكاء في كل مكان.<br /><span style={{ color: 'var(--color-accent)' }}>الفرصة يجب أن تكون كذلك.</span></>
            ) : (
              <>Intelligence is everywhere.<br /><span style={{ color: 'var(--color-accent)' }}>Opportunity should be too.</span></>
            )}
          </h2>
          <p className="text-sm mb-10 max-w-lg mx-auto" style={{ color: 'var(--color-muted)', lineHeight: 1.7 }}>
            {isAr
              ? 'انضم إلى CALM وابدأ رحلتك نحو إتقان العلوم بمستوى الجامعات العالمية — بلغتك وبوتيرتك الخاصة.'
              : 'Join CALM and begin your journey to world-class STEM mastery — at your own pace, in your own language.'}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <motion.button
              onClick={go}
              whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(88,166,255,0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="font-black tracking-wider uppercase text-sm px-10 py-3.5 cursor-pointer"
              style={{ background: 'var(--color-primary)', color: 'var(--color-ink)' }}
            >
              {isAr ? 'ابدأ مجانا ' : 'Start for Free '}
            </motion.button>
            {!isAuthed && (
              <button
                onClick={() => navigate('/login')}
                className="text-sm font-bold tracking-wider uppercase cursor-pointer transition-colors"
                style={{ color: 'var(--color-muted)', textDecoration: 'underline', textUnderlineOffset: 4 }}
              >
                {isAr ? 'لدي حساب  تسجيل الدخول' : 'Already a student? Login'}
              </button>
            )}
          </div>
          <p className="mt-4 text-xs" style={{ color: 'var(--color-subtle, #484f58)' }}>
            {isAr ? '// مجاني تماما. لا يطلب بطاقة ائتمان.' : '// free forever. no credit card.'}
          </p>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <span className="font-black tracking-tighter text-sm" style={{ letterSpacing: '-0.04em' }}>CALM</span>
            <span className="text-xs ml-2" style={{ color: 'var(--color-muted)' }}>v1.0</span>
            <p className="text-xs mt-1" style={{ color: 'var(--color-subtle, #484f58)' }}>
              POWERED BY K2-THINK x MBZUAI  {isAr ? 'مبني للطلاب' : 'built for students'}
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--color-muted)' }}>
            <button onClick={go} className="cursor-pointer hover:text-[var(--color-primary)] transition-colors">
              {isAr ? 'الدردشة' : 'Chat'}
            </button>
            <button onClick={() => navigate('/progress')} className="cursor-pointer hover:text-[var(--color-primary)] transition-colors">
              {isAr ? 'التقدم' : 'Progress'}
            </button>
            {isAuthed ? (
              <button onClick={() => { logout(); navigate('/'); }} className="cursor-pointer hover:text-[var(--color-primary)] transition-colors">
                {isAr ? 'خروج' : 'Logout'}
              </button>
            ) : (
              <button onClick={() => navigate('/login')} className="cursor-pointer hover:text-[var(--color-primary)] transition-colors">
                {isAr ? 'دخول' : 'Login'}
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}