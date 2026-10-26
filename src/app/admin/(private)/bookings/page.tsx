'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/client/hooks';
import { Pager, qs, Table } from '@/components/admin';
import { ErrorBox, Money, StatusBadge } from '@/components/ui';
import { BOOKING_STATUS, dateTime } from '@/lib/shared/labels';

interface Row { id: string; code: string; status: string; serviceName: string; customer: string | null; customerPhone: string | null; nurse: string | null; total: number; commission: number; paymentStatus: string; isUrgent: boolean; createdAt: string }

export default function Bookings() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [range, setRange] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const { data, error, reload } = useApi<{ total: number; items: Row[] }>(`/api/v1/admin/bookings${qs({ status, range, q, page })}`, { poll: 30000 });
  return (
    <>
      <div className="admin-top"><h1>الطلبات</h1></div>
      <div className="filters">
        <input placeholder="رقم الطلب / موبايل / اسم المريض" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          <option value="">كل الحالات</option>{Object.entries(BOOKING_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={range} onChange={(e) => { setRange(e.target.value); setPage(0); }}>
          <option value="">كل الأوقات</option><option value="today">اليوم</option><option value="yesterday">أمس</option><option value="week">هذا الأسبوع</option><option value="month">هذا الشهر</option>
        </select>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      <Table rows={data?.items ?? []} onRow={(r) => router.push(`/admin/bookings/${r.id}`)} columns={[
        { label: 'الطلب', render: (r) => `${r.isUrgent ? '🚨 ' : ''}${r.code}` },
        { label: 'العميل', render: (r) => <>{r.customer}<div className="small muted ltr">{r.customerPhone}</div></> },
        { label: 'الممرض', render: (r) => r.nurse ?? '—' },
        { label: 'الخدمة', render: (r) => r.serviceName },
        { label: 'السعر', render: (r) => <Money v={r.total} /> },
        { label: 'العمولة', render: (r) => <Money v={r.commission} /> },
        { label: 'الدفع', render: (r) => (r.paymentStatus === 'PAID' ? '✅' : '—') },
        { label: 'الحالة', render: (r) => <StatusBadge status={r.status} /> },
        { label: 'التاريخ', render: (r) => dateTime(r.createdAt) },
      ]} />
      <Pager page={page} total={data?.total ?? 0} onPage={setPage} />
    </>
  );
}
