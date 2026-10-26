import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { Markdown } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function PolicyPage({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string; embed?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  let page: Record<string, string> | null = null;
  try {
    const { data } = await db().from('content_pages').select('*').eq('slug', slug).eq('is_published', true).maybeSingle();
    page = data;
  } catch { /* not configured */ }
  if (!page) notFound();
  const en = sp.lang === 'en';
  return (
    <>
      {!sp.embed && <SiteHeader />}
      <div className="section">
        <article className="prose" dir={en ? 'ltr' : 'rtl'}>
          <div className="row between">
            <h1>{en ? page.title_en : page.title_ar}</h1>
            <a className="small" href={`/policies/${slug}?lang=${en ? 'ar' : 'en'}${sp.embed ? '&embed=1' : ''}`}>{en ? 'العربية' : 'English'}</a>
          </div>
          <Markdown text={en ? page.body_en : page.body_ar} />
          <p className="muted small">آخر تحديث: {new Date(page.updated_at).toLocaleDateString('ar-EG')}</p>
        </article>
      </div>
      {!sp.embed && <SiteFooter />}
    </>
  );
}
