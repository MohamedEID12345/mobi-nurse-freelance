'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/session';
import { useApi } from '@/client/hooks';
import { Card, Money, StatusBadge } from '@/components/ui';

interface Service { id: string; nameAr: string; descriptionAr: string; price: number; total: number; imageUrl: string | null }
interface BookingItem { id: string; code: string; status: string; serviceName: string; patientName: string }

export default function CustomerHome() {
  const { me } = useSession();
  const router = useRouter();
  useEffect(() => { if (me.role === 'NURSE') router.replace('/app/nurse'); }, [me.role, router]);
  const services = useApi<Service[]>(me.role === 'CUSTOMER' ? `/api/v1/services?governorateId=${me.governorateId}` : null);
  const active = useApi<BookingItem[]>(me.role === 'CUSTOMER' ? '/api/v1/bookings?scope=active' : null, { poll: 20000 });
  if (me.role === 'NURSE') return null;

  return (
    <>
      <div>
        <h1>أهلاً {me.fullName.split(' ')[0]} 👋</h1>
        <p className="muted">ممرضك الأمين لحد باب بيتك</p>
      </div>
      {!me.governorateActive && <div className="alert warn">الخدمة غير متاحة في محافظتك حالياً، وسنبلغك فور تفعيلها.</div>}
      <Link href="/app/book" className="btn block lg">🩺 اطلب خدمة تمريض</Link>
      <Link href="/app/book?urgent=1" className="btn block lg danger">🚨 طلب عاجل</Link>

      {(active.data ?? []).length > 0 && (
        <Card>
          <h3>طلباتك الجارية</h3>
          {active.data!.map((b) => (
            <Link key={b.id} href={`/app/bookings/${b.id}`} className="list-item">
              <div><strong>{b.serviceName}</strong><div className="small muted">{b.patientName} • {b.code}</div></div>
              <StatusBadge status={b.status} />
            </Link>
          ))}
        </Card>
      )}

      <div className="grid3">
        {[['/app/bookings', '📋', 'حجوزاتي'], ['/app/family', '👨‍👩‍👧', 'الأسرة'], ['/app/payments', '💳', 'المدفوعات'],
          ['/app/notifications', '🔔', 'الإشعارات'], ['/app/complaints', '📝', 'الشكاوى'], ['/app/account', '👤', 'الحساب']].map(([h, i, l]) => (
          <Link key={h} href={h} className="card center" style={{ padding: '.8rem .4rem' }}><div style={{ fontSize: '1.6rem' }}>{i}</div><div className="small">{l}</div></Link>
        ))}
      </div>

      <h2>الخدمات</h2>
      <div className="grid2">
        {(services.data ?? []).map((s) => (
          <Link key={s.id} href={`/app/book?service=${s.id}`} className="card service-tile">
            <div className="img" style={s.imageUrl ? { backgroundImage: `url(${s.imageUrl})` } : undefined}>{s.imageUrl ? '' : '🩺'}</div>
            <strong className="small">{s.nameAr}</strong>
            <span className="total" style={{ fontSize: '1rem' }}><Money v={s.total} /></span>
          </Link>
        ))}
      </div>
      <a className="btn block whatsapp" href="https://wa.me/201062569857">💬 تواصل مع الدعم على واتساب</a>
    </>
  );
}
