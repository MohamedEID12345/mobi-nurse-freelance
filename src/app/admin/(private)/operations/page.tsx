'use client';
import Link from 'next/link';
import { useApi } from '@/client/hooks';
import { Table } from '@/components/admin';
import { ErrorBox, Spinner, StatusBadge } from '@/components/ui';
import { dateTime } from '@/lib/shared/labels';

interface Ops {
  onlineNurses: Array<{ id: string; name: string; phone: string; rating: number; lastLocationAt: string | null; mapsLink: string | null; currentBooking: { id: string; code: string; status: string } | null }>;
  activeBookings: Array<{ id: string; code: string; status: string; serviceName: string; patientName: string; guest: boolean; createdAt: string; mapsLink: string; nurseMapsLink: string | null }>;
}

export default function Operations() {
  const { data, error, reload } = useApi<Ops>('/api/v1/admin/operations', { poll: 20000 });
  if (!data) return error ? <ErrorBox error={error} onRetry={reload} /> : <Spinner />;
  return (
    <>
      <div className="admin-top"><h1>التشغيل المباشر</h1><span className="small muted">يتحدث كل 20 ثانية • المواقع تفتح على خرائط جوجل</span></div>
      <h2>ممرضون متصلون ({data.onlineNurses.length})</h2>
      <Table rows={data.onlineNurses} columns={[
        { label: 'الاسم', render: (n) => <Link href={`/admin/nurses/${n.id}`}>{n.name}</Link> },
        { label: 'الموبايل', render: (n) => <span className="ltr">{n.phone}</span> },
        { label: 'التقييم', render: (n) => (n.rating ? n.rating.toFixed(1) : '—') },
        { label: 'الحالة', render: (n) => (n.currentBooking ? <Link href={`/admin/bookings/${n.currentBooking.id}`}><StatusBadge status={n.currentBooking.status} /></Link> : <span className="badge ok">متاح</span>) },
        { label: 'آخر تحديث للموقع', render: (n) => dateTime(n.lastLocationAt) },
        { label: 'الموقع', render: (n) => (n.mapsLink ? <a href={n.mapsLink} target="_blank" rel="noreferrer">📍 خريطة</a> : '—') },
      ]} />
      <h2 style={{ marginTop: '1.5rem' }}>طلبات نشطة ({data.activeBookings.length})</h2>
      <Table rows={data.activeBookings} columns={[
        { label: 'الطلب', render: (b) => <Link href={`/admin/bookings/${b.id}`}>{b.code}</Link> },
        { label: 'الخدمة', render: (b) => b.serviceName },
        { label: 'المريض', render: (b) => `${b.patientName}${b.guest ? ' (عاجل)' : ''}` },
        { label: 'الحالة', render: (b) => <StatusBadge status={b.status} /> },
        { label: 'منذ', render: (b) => dateTime(b.createdAt) },
        { label: 'موقع العميل', render: (b) => <a href={b.mapsLink} target="_blank" rel="noreferrer">📍</a> },
        { label: 'موقع الممرض', render: (b) => (b.nurseMapsLink ? <a href={b.nurseMapsLink} target="_blank" rel="noreferrer">🚗</a> : '—') },
      ]} />
    </>
  );
}
