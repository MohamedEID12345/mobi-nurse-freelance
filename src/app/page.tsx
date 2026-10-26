import Link from 'next/link';
import { db } from '@/lib/db';
import { SiteFooter, SiteHeader } from '@/components/SiteChrome';
import { money } from '@/lib/shared/labels';

export const dynamic = 'force-dynamic';

async function loadHome() {
  try {
    const [{ data: services }, { data: wa }] = await Promise.all([
      db().from('services').select('id, name_ar, description_ar, price, image_url').eq('is_active', true).is('deleted_at', null).order('sort_order').limit(12),
      db().from('settings').select('value').eq('key', 'SUPPORT_WHATSAPP').maybeSingle(),
    ]);
    return { services: (services ?? []) as Array<Record<string, string>>, whatsapp: wa?.value as string | undefined };
  } catch {
    return { services: [], whatsapp: undefined };
  }
}

export default async function Home() {
  const { services, whatsapp } = await loadHome();
  const apk = process.env.NEXT_PUBLIC_ANDROID_APK_URL;
  return (
    <>
      <SiteHeader />
      <section className="hero">
        <div className="inner stack">
          <h1>ممرضك الأمين لحد باب بيتك</h1>
          <p style={{ fontSize: '1.1rem' }}>اطلب ممرض/ة معتمد/ة من MOBI-NURSE في دقائق — غيار جروح، حقن بوصفة طبية، قياس ضغط وسكر، رعاية كبار السن وما بعد العمليات.</p>
          <div className="row">
            <Link className="btn lg" style={{ background: '#fff', color: 'var(--brand-dark)' }} href="/app">اطلب خدمة تمريض</Link>
            <Link className="btn lg danger" href="/urgent">🚨 طلب تمريض عاجل</Link>
            {apk && <a className="btn lg secondary" href={apk}>⬇️ تطبيق أندرويد</a>}
          </div>
          <p className="small">متاح حالياً في محافظة الشرقية • الدفع إلكترونياً بالبطاقات والمحافظ</p>
        </div>
      </section>
      <section className="section">
        <div className="inner stack">
          <h2>خدماتنا</h2>
          <div className="grid-auto">
            {services.map((s) => (
              <Link key={s.id} href={`/app/book?service=${s.id}`} className="card service-tile">
                <div className="img" style={s.image_url ? { backgroundImage: `url(${s.image_url})` } : undefined}>{s.image_url ? '' : '🩺'}</div>
                <strong>{s.name_ar}</strong>
                <span className="muted small">{s.description_ar}</span>
                <span className="total">{money(s.price)}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section" style={{ background: '#fff' }}>
        <div className="inner grid3">
          <div className="card flat"><h3>✅ ممرضون معتمدون</h3><p className="muted">نراجع البطاقة وترخيص مزاولة المهنة لكل ممرض قبل التفعيل.</p></div>
          <div className="card flat"><h3>💳 دفع آمن</h3><p className="muted">الدفع بعد الخدمة عبر كاشير بالبطاقات والمحافظ الإلكترونية.</p></div>
          <div className="card flat"><h3>📍 لحد باب بيتك</h3><p className="muted">نرشح لك أقرب ممرض متاح وتتابع وصوله خطوة بخطوة.</p></div>
        </div>
      </section>
      <section className="section">
        <div className="inner card row between">
          <div><h2>هل أنت ممرض/ة؟</h2><p className="muted">انضم لفريق MOBI-NURSE واستقبل طلبات قريبة منك وحقق دخلاً إضافياً.</p></div>
          <Link className="btn" href="/app/register?type=nurse">سجّل كمقدم خدمة</Link>
        </div>
      </section>
      <SiteFooter whatsapp={whatsapp} />
    </>
  );
}
