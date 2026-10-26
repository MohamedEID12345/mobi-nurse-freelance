import Link from 'next/link';
import { Icon } from './Icons';
import type { Dict } from '@/lib/shared/i18n';

export function SiteFooter({ t, whatsapp, services = [] }: { t: Dict; whatsapp: string; services?: Array<{ id: string; name: string }> }) {
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <img src="/logo-dark.png" alt="MOBI-NURSE" className="footer-logo" />
          <p>{t.footer.about}</p>
          <a className="btn-wa" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer"><Icon name="chat" size={18} /> <span className="ltr">+{whatsapp}</span></a>
        </div>
        <div>
          <h4>{t.footer.links}</h4>
          <a href="/#about">{t.nav.about}</a>
          <a href="/#services">{t.nav.services}</a>
          <a href="/#how">{t.nav.how}</a>
          <a href="/#join">{t.nav.nurses}</a>
          <Link href="/urgent">{t.hero.urgent}</Link>
          <Link href="/app/login">{t.nav.login}</Link>
        </div>
        <div>
          <h4>{t.footer.services}</h4>
          {services.slice(0, 6).map((s) => <Link key={s.id} href={`/app/book?service=${s.id}`}>{s.name}</Link>)}
        </div>
        <div>
          <h4>{t.footer.policies}</h4>
          {Object.entries(t.footer.policyNames).map(([slug, name]) => <Link key={slug} href={`/policies/${slug}`}>{name}</Link>)}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {year} MOBI-NURSE — {t.footer.rights}</span>
        <span className="footer-emergency"><Icon name="siren" size={16} /> {t.footer.emergency}</span>
      </div>
    </footer>
  );
}
