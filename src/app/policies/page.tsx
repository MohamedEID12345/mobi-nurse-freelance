import Link from 'next/link';
import { db } from '@/lib/db';
import { getLang } from '@/lib/lang';
import { siteChromeData } from '@/lib/site-data';
import { DICT } from '@/lib/shared/i18n';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { Icon } from '@/components/site/Icons';

export const dynamic = 'force-dynamic';

export default async function Policies() {
  const lang = await getLang();
  const t = DICT[lang];
  const chrome = await siteChromeData(lang);
  let pages: Array<{ slug: string; title_ar: string; title_en: string }> = [];
  try {
    const { data } = await db().from('content_pages').select('slug, title_ar, title_en').eq('is_published', true).order('sort_order');
    pages = data ?? [];
  } catch { /* not configured */ }
  return (
    <div className="site">
      <SiteHeader t={t} lang={lang} whatsapp={chrome.whatsapp} home={false} />
      <div className="policy-page"><div className="container"><div className="prose stack">
        <h1>{t.policies.title}</h1>
        {pages.map((p) => (
          <Link key={p.slug} className="list-item" href={`/policies/${p.slug}`}>
            {lang === 'en' ? p.title_en : p.title_ar} <Icon name="arrow" size={18} className="flip-rtl" />
          </Link>
        ))}
      </div></div></div>
      <SiteFooter t={t} whatsapp={chrome.whatsapp} services={chrome.services} />
    </div>
  );
}
