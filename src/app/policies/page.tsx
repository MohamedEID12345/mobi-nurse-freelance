import Link from 'next/link';
import { db } from '@/lib/db';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';

export const dynamic = 'force-dynamic';

export default async function Policies() {
  let pages: Array<{ slug: string; title_ar: string }> = [];
  try {
    const { data } = await db().from('content_pages').select('slug, title_ar').eq('is_published', true).order('sort_order');
    pages = data ?? [];
  } catch { /* not configured */ }
  return (
    <>
      <SiteHeader />
      <div className="section"><div className="prose stack">
        <h1>السياسات والشروط</h1>
        {pages.map((p) => <Link key={p.slug} className="list-item" href={`/policies/${p.slug}`}>{p.title_ar} <span>‹</span></Link>)}
      </div></div>
      <SiteFooter />
    </>
  );
}
