import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Lang = 'en' | 'ar';

interface LangCtx {
  lang:   Lang;
  toggle: () => void;
  isAr:   boolean;
}

const LangContext = createContext<LangCtx>({
  lang:   'en',
  toggle: () => {},
  isAr:   false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('calm_lang') as Lang) || 'en';
  });

  useEffect(() => {
    const html = document.documentElement;
    html.dir  = lang === 'ar' ? 'rtl' : 'ltr';
    html.lang = lang;
    localStorage.setItem('calm_lang', lang);
  }, [lang]);

  const toggle = () => setLang((l) => (l === 'en' ? 'ar' : 'en'));

  return (
    <LangContext.Provider value={{ lang, toggle, isAr: lang === 'ar' }}>
      {children}
    </LangContext.Provider>
  );
}

export const useLang = () => useContext(LangContext);
