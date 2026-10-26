'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useApi } from '@/client/hooks';
import { Empty, ErrorBox, Money, Spinner, StatusBadge } from '@/components/ui';
import { dateTime } from '@/lib/shared/labels';

interface Item { id: string; code: string; status: string; serviceName: string; patientName: string; total: number; createdAt: string; scheduledAt: string | null }

export default function Bookings() {
  const [scope, setScope] = useState<'active' | 'history'>('active');
  const { data, error, loading, reload } = useApi<Item[]>(`/api/v1/bookings?scope=${scope}`, { poll: scope === 'active' ? 15000 : undefined });
  return (
    <>
      <h1>طلباتي</h1>
      <div className="tabs">
        <button className={scope === 'active' ? 'on' : ''} onClick={() => setScope('active')}>الجارية</button>
        <button className={scope === 'history' ? 'on' : ''} onClick={() => setScope('history')}>السابقة</button>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      {loading && <Spinner />}
      {data && data.length === 0 && <Empty>لا توجد طلبات<br /><Link className="btn" href="/app/book" style={{ marginTop: '1rem' }}>اطلب خدمة</Link></Empty>}
      <div className="card">
        {(data ?? []).map((b) => (
          <Link key={b.id} href={`/app/bookings/${b.id}`} className="list-item">
            <div>
              <strong>{b.serviceName}</strong>
              <div className="small muted">{b.patientName} • {b.code} • {dateTime(b.scheduledAt ?? b.createdAt)}</div>
            </div>
            <div style={{ textAlign: 'left' }}><StatusBadge status={b.status} /><div className="small"><Money v={b.total} /></div></div>
          </Link>
        ))}
      </div>
    </>
  );
}
