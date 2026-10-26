'use client';
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApi } from '@/client/hooks';
import { Pager, qs, Table } from '@/components/admin';
import { ErrorBox, StatusBadge } from '@/components/ui';
import { VERIFICATION_STATUS, dateTime } from '@/lib/shared/labels';

interface Row { id: string; name: string; phone: string; accountStatus: string; verificationStatus: string; isOnline: boolean; rating: number; completed: number; feePaid: boolean; createdAt: string }

function Nurses() {
  const router = useRouter();
  const sp = useSearchParams();
  const [status, setStatus] = useState(sp.get('status') ?? '');
  const [online, setOnline] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const { data, error, reload } = useApi<{ total: number; items: Row[] }>(`/api/v1/admin/nurses${qs({ status, online, q, page })}`);
  return (
    <>
      <div className="admin-top"><h1>الممرضون</h1></div>
      <div className="filters">
        <input placeholder="بحث بالاسم أو الموبايل" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          <option value="">كل الحالات</option>
          {Object.entries(VERIFICATION_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={online} onChange={(e) => setOnline(e.target.value)}><option value="">الكل</option><option value="true">المتصلون الآن</option></select>
      </div>
      <ErrorBox error={error} onRetry={reload} />
      <Table rows={data?.items ?? []} onRow={(r) => router.push(`/admin/nurses/${r.id}`)} columns={[
        { label: 'الاسم', render: (r) => r.name },
        { label: 'الموبايل', render: (r) => <span className="ltr">{r.phone}</span> },
        { label: 'التحقق', render: (r) => <StatusBadge status={r.verificationStatus} labels={VERIFICATION_STATUS} /> },
        { label: 'الحساب', render: (r) => <StatusBadge status={r.accountStatus} labels={{ ACTIVE: 'نشط', SUSPENDED: 'موقوف' }} /> },
        { label: 'الرسوم', render: (r) => (r.feePaid ? '✅' : '—') },
        { label: 'متصل', render: (r) => (r.isOnline ? '🟢' : '⚪') },
        { label: 'التقييم', render: (r) => (r.rating ? r.rating.toFixed(1) : '—') },
        { label: 'مكتملة', render: (r) => r.completed },
        { label: 'التسجيل', render: (r) => dateTime(r.createdAt) },
      ]} />
      <Pager page={page} total={data?.total ?? 0} onPage={setPage} />
    </>
  );
}

export default function NursesPage() { return <Suspense><Nurses /></Suspense>; }
