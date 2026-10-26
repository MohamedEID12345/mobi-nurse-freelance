'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './Icons';

export function ThemeToggle({ labels }: { labels: { dark: string; light: string } }) {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.dataset.theme === 'dark'); }, []);
  const toggle = () => {
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('mn_theme', next); } catch { /* private mode */ }
    setDark(!dark);
  };
  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={dark ? labels.light : labels.dark} title={dark ? labels.light : labels.dark}>
      <Icon name={dark ? 'sun' : 'moon'} size={19} />
    </button>
  );
}

export function LangToggle({ lang, label }: { lang: 'ar' | 'en'; label: string }) {
  const router = useRouter();
  const toggle = () => {
    const next = lang === 'ar' ? 'en' : 'ar';
    document.cookie = `mn_lang=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next;
    document.documentElement.dir = next === 'ar' ? 'rtl' : 'ltr';
    router.refresh();
  };
  return (
    <button type="button" className="icon-btn lang-btn" onClick={toggle} aria-label={label}>
      <Icon name="globe" size={18} /> <span>{label}</span>
    </button>
  );
}
