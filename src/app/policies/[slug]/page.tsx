import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getLang } from '@/lib/lang';
import { siteChromeData } from '@/lib/site-data';
import { DICT } from '@/lib/shared/i18n';
import { SiteHeader } from '@/components/site/SiteHeader';
import { SiteFooter } from '@/components/site/SiteFooter';
import { Markdown } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function PolicyPage({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string; embed?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const lang = sp.lang === 'en' || sp.lang === 'ar' ? sp.lang : await getLang();
  const t = DICT[lang];
  let page: Record<string, string> | null = null;
  try {
    const { data } = await db().from('content_pages').select('*').eq('slug', slug).eq('is_published', true).maybeSingle();
    page = data;
  } catch { /* not configured */ }
  if (!page) notFound();
  const en = lang === 'en';
  const chrome = sp.embed ? null : await siteChromeData(lang);
  return (
    <div className="site">
      {chrome && <SiteHeader t={t} lang={lang} whatsapp={chrome.whatsapp} home={false} />}
      <div className="policy-page"><div className="container">
        <article className="prose" dir={en ? 'ltr' : 'rtl'}>
          <div className="row between">
            <h1>{en ? page.title_en : page.title_ar}</h1>
            <a className="small" href={`/policies/${slug}?lang=${en ? 'ar' : 'en'}${sp.embed ? '&embed=1' : ''}`}>{en ? 'العربية' : 'English'}</a>
          </div>
          <Markdown text={en ? page.body_en : page.body_ar} />
          <p className="muted small">{t.policies.updated}: {new Date(page.updated_at).toLocaleDateString(en ? 'en-GB' : 'ar-EG')}</p>
        </article>
      </div></div>
      {chrome && <SiteFooter t={t} whatsapp={chrome.whatsapp} services={chrome.services} />}
    </div>
  );
}
