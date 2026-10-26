'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Icon } from './Icons';
import { LangToggle, ThemeToggle } from './Toggles';
import type { Dict, Lang } from '@/lib/shared/i18n';

export function SiteHeader({ t, lang, whatsapp, home = true }: { t: Dict; lang: Lang; whatsapp: string; home?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const h = (id: string) => (home ? `#${id}` : `/#${id}`);
  const links: Array<[string, string]> = [
    [h('hero'), t.nav.home], [h('about'), t.nav.about], [h('services'), t.nav.services],
    [h('how'), t.nav.how], [h('join'), t.nav.nurses], [h('faq'), t.nav.faq], [h('contact'), t.nav.contact],
  ];
  return (
    <>
      <div className="topbar">
        <div className="container topbar-in">
          <span className="hide-sm"><Icon name="mapPin" size={15} /> {t.topbar.area}</span>
          <span className="hide-sm"><Icon name="clock" size={15} /> {t.topbar.hours}</span>
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer"><Icon name="chat" size={15} /> {t.topbar.support} <span className="ltr">+{whatsapp}</span></a>
        </div>
      </div>
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container header-in">
          <Link href="/" className="brand-link" aria-label="MOBI-NURSE"><Logo height={56} /></Link>
          <nav className={`main-nav ${open ? 'open' : ''}`} onClick={() => setOpen(false)}>
            {links.map(([href, label], i) => <a key={href} href={href} className={i >= 5 ? 'nav-extra' : undefined}>{label}</a>)}
            <Link href="/app/login" className="nav-login"><Icon name="login" size={16} /> {t.nav.login}</Link>
          </nav>
          <div className="header-actions">
            <ThemeToggle labels={t.toggles} />
            <LangToggle lang={lang} label={t.toggles.lang} />
            <Link href="/app/book" className="btn-glow hide-sm">{t.nav.book}</Link>
            <button type="button" className="icon-btn menu-btn" onClick={() => setOpen(!open)} aria-label="menu">
              <Icon name={open ? 'close' : 'menu'} size={22} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
