import { useState, type FormEvent } from 'react';
import { useNavigate, Link }        from 'react-router-dom';
import { motion, AnimatePresence }  from 'framer-motion';
import { supabase }                 from '../lib/supabase';
import { useLang }                  from '../contexts/LanguageContext';

type Tab  = 'login' | 'register';
type View = 'form' | 'check-email' | 'forgot-password' | 'reset-sent';

function InputField({
  label, type, value, onChange, placeholder, required, error,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  required?: boolean; error?: boolean;
}) {
  const { isAr } = useLang();
  return (
    <div className="space-y-1.5">
      <label
        className="block text-xs font-medium tracking-wide uppercase"
        style={{ color: 'var(--color-muted)', letterSpacing: '0.06em' }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        dir={isAr ? 'rtl' : 'ltr'}
        className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
        style={{
          background: 'var(--color-surface-2)',
          border:     `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
          color:      'var(--color-text)',
          fontFamily: isAr ? 'var(--font-arabic)' : 'var(--font-sans)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-primary)';
          e.currentTarget.style.background  = 'var(--color-surface)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-border)';
          e.currentTarget.style.background  = 'var(--color-surface-2)';
        }}
      />
    </div>
  );
}

export default function AuthPage() {
  const [tab,      setTab]      = useState<Tab>('login');
  const [view,     setView]     = useState<View>('form');
  const [email,    setEmail]    = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const navigate         = useNavigate();
  const { isAr, toggle } = useLang();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Full name validation
    if (tab === 'register' && !fullName.trim()) {
      setError(isAr ? 'الاسم الكامل مطلوب' : 'Full name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (tab === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        navigate('/chat', { replace: true });
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (err) throw err;
        // With email confirmation ON, session is null — show check-inbox screen
        setView('check-email');
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      setError(msg ?? (isAr ? 'تحقق من بياناتك وحاول مجدداً.' : 'Check your details and try again.'));
    } finally {
      setLoading(false);
    }
  };

  // ── Check-email screen ─────────────────────────────────────────────────────
  if (view === 'check-email') {
    return (
      <div
        className="min-h-dvh grid"
        style={{ background: 'var(--color-ink)', gridTemplateColumns: '1fr' }}
      >
        <div className="flex items-center justify-between px-8 pt-7 absolute top-0 left-0 right-0">
          <Link to="/" className="font-semibold text-sm tracking-tight no-underline"
            style={{ color: 'var(--color-text)' }}>
            CALM
          </Link>
        </div>

        <div className="flex items-center justify-center px-6 py-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm text-center"
          >
            {/* Envelope icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>

            <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: 'var(--color-text)' }}>
              {isAr ? 'تحقق من بريدك' : 'Check your inbox'}
            </h1>

            <p className="text-sm mb-2" style={{ color: 'var(--color-muted)' }}>
              {isAr
                ? 'أرسلنا رابط تفعيل الحساب إلى'
                : 'We sent a verification link to'}
            </p>
            <p className="text-sm font-semibold mb-6" style={{ color: 'var(--color-text)' }}>
              {email}
            </p>
            <p className="text-xs mb-8" style={{ color: 'var(--color-subtle)' }}>
              {isAr
                ? 'انقر على الرابط في رسالة البريد لتفعيل حسابك، ثم سجل الدخول.'
                : 'Click the link in the email to activate your account, then sign in.'}
            </p>

            <button
              onClick={() => { setView('form'); setTab('login'); setPassword(''); setError(''); }}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
              style={{
                background: 'var(--color-primary)',
                color:      'var(--color-ink)',
                border:     'none',
              }}
            >
              {isAr ? 'العودة لتسجيل الدخول' : 'Back to sign in'}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Password reset views
  if (view === 'forgot-password') {
    const handleReset = async (e: FormEvent) => {
      e.preventDefault();
      setLoading(true); setError('');
      try {
        const redirectTo = window.location.origin + '/login';
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (err) throw err;
        setView('reset-sent');
      } catch (err: unknown) {
        setError((err as { message?: string })?.message ?? 'Failed to send reset email.');
      } finally {
        setLoading(false);
      }
    };
    return (
      <div className="min-h-dvh grid" style={{ background: 'var(--color-ink)', gridTemplateColumns: '1fr' }}>
        <div className="flex items-center justify-between px-8 pt-7 absolute top-0 left-0 right-0">
          <Link to="/" className="font-semibold text-sm tracking-tight no-underline" style={{ color: 'var(--color-text)' }}>CALM</Link>
        </div>
        <div className="flex items-center justify-center px-6 py-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
              {isAr ? 'استعادة كلمة المرور' : 'Reset your password'}
            </h1>
            <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
              {isAr ? 'سنرسل رابط إعادة التعيين.' : "Enter your email and we'll send a reset link."}
            </p>
            <form onSubmit={handleReset} className="space-y-4">
              <InputField
                label={isAr ? 'البريد الإلكتروني' : 'Email'}
                type="email" value={email} onChange={setEmail}
                placeholder="you@example.com" required error={!!error}
              />
              {error && (
                <p className="text-xs" style={{ color: 'var(--color-danger)' }}>{error}</p>
              )}
              <button
                type="submit" disabled={loading}
                className="w-full py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
                style={{
                  background: loading ? 'var(--color-primary-dim)' : 'var(--color-primary)',
                  color: 'var(--color-ink)', border: 'none',
                }}
              >
                {loading ? (isAr ? 'جارٍ...' : 'Sending...') : (isAr ? 'إرسال رابط الإعادة' : 'Send reset link')}
              </button>
              <button
                type="button" onClick={() => { setView('form'); setError(''); }}
                className="w-full py-2 text-xs cursor-pointer"
                style={{ color: 'var(--color-muted)', background: 'none', border: 'none' }}
              >
                {isAr ? 'العودة' : 'Back to sign in'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  if (view === 'reset-sent') {
    return (
      <div className="min-h-dvh grid" style={{ background: 'var(--color-ink)', gridTemplateColumns: '1fr' }}>
        <div className="flex items-center justify-between px-8 pt-7 absolute top-0 left-0 right-0">
          <Link to="/" className="font-semibold text-sm tracking-tight no-underline" style={{ color: 'var(--color-text)' }}>CALM</Link>
        </div>
        <div className="flex items-center justify-center px-6 py-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
              {isAr ? 'تم الإرسال!' : 'Email sent!'}
            </h1>
            <p className="text-sm mb-2" style={{ color: 'var(--color-muted)' }}>
              {isAr ? 'أرسلنا رابط إعادة التعيين إلى' : 'We sent a reset link to'}
            </p>
            <p className="text-sm font-semibold mb-8" style={{ color: 'var(--color-text)' }}>{email}</p>
            <button
              onClick={() => { setView('form'); setTab('login'); setError(''); }}
              className="w-full py-2.5 rounded-lg text-sm font-semibold cursor-pointer"
              style={{ background: 'var(--color-primary)', color: 'var(--color-ink)', border: 'none' }}
            >
              {isAr ? 'العودة لتسجيل الدخول' : 'Back to sign in'}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-dvh grid"
      style={{ background: 'var(--color-ink)', gridTemplateColumns: '1fr' }}
    >
      <div className="flex items-center justify-between px-8 pt-7 absolute top-0 left-0 right-0">
        <Link to="/" className="font-semibold text-sm tracking-tight no-underline"
          style={{ color: 'var(--color-text)' }}>
          CALM
        </Link>
        <button
          onClick={toggle}
          className="text-xs font-medium cursor-pointer"
          style={{ color: 'var(--color-subtle)', background: 'none', border: 'none', padding: 0 }}
        >
          {isAr ? 'English' : 'عربي'}
        </button>
      </div>

      <div className="flex items-center justify-center px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8" dir={isAr ? 'rtl' : 'ltr'}>
            <h1
              className="text-2xl font-bold tracking-tight mb-1.5"
              style={{ color: 'var(--color-text)' }}
            >
              {tab === 'login'
                ? (isAr ? 'أهلاً بعودتك' : 'Welcome back')
                : (isAr ? 'إنشاء حساب' : 'Create account')}
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              {tab === 'login'
                ? (isAr ? 'أدخل بيانات حسابك للمتابعة' : 'Enter your credentials to continue')
                : (isAr ? 'ابدأ رحلة الإتقان في الحساب' : 'Start your calculus mastery journey')}
            </p>
          </div>

          <div className="flex gap-5 mb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className="pb-2.5 text-sm font-medium cursor-pointer transition-colors relative"
                style={{
                  color:      tab === t ? 'var(--color-text)' : 'var(--color-muted)',
                  background: 'none',
                  border:     'none',
                  padding:    '0 0 10px 0',
                }}
              >
                {t === 'login'
                  ? (isAr ? 'تسجيل الدخول' : 'Sign in')
                  : (isAr ? 'حساب جديد' : 'Sign up')}
                {tab === t && (
                  <motion.div
                    layoutId="auth-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: 'var(--color-primary)' }}
                  />
                )}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
            <AnimatePresence initial={false}>
              {tab === 'register' && (
                <motion.div
                  key="fullname-field"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                <InputField
                    label={isAr ? 'الاسم الكامل' : 'Full name'}
                    type="text" value={fullName} onChange={setFullName}
                    placeholder={isAr ? 'اسمك الكامل' : 'Your full name'}
                    required error={tab === 'register' && !!error && !fullName.trim()}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <InputField
              label={isAr ? 'البريد الإلكتروني' : 'Email'}
              type="email" value={email} onChange={setEmail}
              placeholder="you@example.com" required error={!!error}
            />

            <InputField
              label={isAr ? 'كلمة المرور' : 'Password'}
              type="password" value={password} onChange={setPassword}
              placeholder="••••••••" required error={!!error}
            />

            {tab === 'login' && (
              <div className={`flex ${isAr ? 'justify-start' : 'justify-end'}`}>
                <button
                  type="button"
                  onClick={() => { setView('forgot-password'); setError(''); }}
                  className="text-xs cursor-pointer"
                  style={{ color: 'var(--color-primary)', background: 'none', border: 'none', padding: 0 }}
                >
                  {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </button>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.p
                  key="err"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs"
                  style={{ color: 'var(--color-danger)' }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ opacity: loading ? 1 : 0.9 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer"
              style={{
                background: loading ? 'var(--color-primary-dim)' : 'var(--color-primary)',
                color:      loading ? 'var(--color-primary)'      : 'var(--color-ink)',
                border:     'none',
                marginTop:  '8px',
              }}
            >
              {loading
                ? (isAr ? 'جارٍ المعالجة...' : 'Processing...')
                : tab === 'login'
                  ? (isAr ? 'دخول' : 'Sign in')
                  : (isAr ? 'إنشاء الحساب' : 'Create account')}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
