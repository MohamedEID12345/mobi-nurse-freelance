import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="inner">
        <Link href="/"><img src="/logo.png" alt="MOBI-NURSE" /></Link>
        <nav className="row">
          <Link className="btn sm ghost" href="/app/login">دخول</Link>
          <Link className="btn sm" href="/app/register">حساب جديد</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter({ whatsapp }: { whatsapp?: string }) {
  const wa = whatsapp || '201062569857';
  return (
    <footer className="site-footer">
      <div className="inner" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="row between">
          <div>
            <strong style={{ color: '#fff' }}>MOBI-NURSE</strong>
            <p className="small">ممرضك الأمين لحد باب بيتك</p>
          </div>
          <a className="btn whatsapp sm" href={`https://wa.me/${wa}`}>الدعم على واتساب</a>
        </div>
        <p className="small" style={{ marginTop: '1rem' }}>
          <Link href="/policies/terms">الشروط والأحكام</Link> · <Link href="/policies/privacy">الخصوصية</Link> ·{' '}
          <Link href="/policies/nurse-terms">شروط مقدمي الخدمة</Link> · <Link href="/policies/payment">الدفع</Link> ·{' '}
          <Link href="/policies/cancellation">الإلغاء</Link> · <Link href="/policies/healthcare-disclaimer">إخلاء المسؤولية</Link> ·{' '}
          <Link href="/policies/emergency">الطوارئ</Link>
        </p>
        <p className="small">⚠️ الخدمة ليست بديلاً عن الإسعاف — في الحالات الحرجة اتصل بـ 123</p>
      </div>
    </footer>
  );
}
