'use client';
import Link from 'next/link';
import { useApi } from '@/client/hooks';
import { Empty, ErrorBox, Money, Spinner, StatusBadge } from '@/components/ui';
import { dateTime, PAYMENT_STATUS } from '@/lib/shared/labels';

interface P { id: string; reference: string; purpose: string; bookingId: string | null; amount: number; status: string; createdAt: string }

export default function Payments() {
  const { data, error, loading, reload } = useApi<P[]>('/api/v1/payments');
  return (
    <>
      <h1>المدفوعات</h1>
      <ErrorBox error={error} onRetry={reload} />
      {loading && <Spinner />}
      {data && data.length === 0 && <Empty>لا توجد مدفوعات بعد</Empty>}
      <div className="card">
        {(data ?? []).map((p) => (
          <div key={p.id} className="list-item">
            <div>
              <strong>{p.purpose === 'REGISTRATION_FEE' ? 'رسوم تفعيل الحساب' : 'دفع خدمة'}</strong>
              <div className="small muted"><span className="ltr">{p.reference}</span> • {dateTime(p.createdAt)}</div>
              {p.bookingId && <Link className="small" href={`/app/bookings/${p.bookingId}`}>عرض الطلب</Link>}
            </div>
            <div style={{ textAlign: 'left' }}><Money v={p.amount} /><div><StatusBadge status={p.status} labels={PAYMENT_STATUS} /></div></div>
          </div>
        ))}
      </div>
    </>
  );
}
