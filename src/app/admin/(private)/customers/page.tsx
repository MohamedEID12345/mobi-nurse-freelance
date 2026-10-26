'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApi } from '@/client/hooks';
import { Pager, qs, Table } from '@/components/admin';
import { ErrorBox, StatusBadge } from '@/components/ui';
import { dateTime } from '@/lib/shared/labels';

interface Row { id: string; name: string; phone: string; status: string; address: string; createdAt: string; lastLoginAt: string | null }

export default function Customers() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const { data, error, reload } = useApi<{ total: number; items: Row[] }>(`/api/v1/admin/customers${qs({ q, page })}`);
  return (
    <>
      <div className="admin-top"><h1>العملاء</h1></div>
      <div className="filters"><input placeholder="بحث بالاسم أو الموبايل" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} /></div>
      <ErrorBox error={error} onRetry={reload} />
      <Table rows={data?.items ?? []} onRow={(r) => router.push(`/admin/customers/${r.id}`)} columns={[
        { label: 'الاسم', render: (r) => r.name },
        { label: 'الموبايل', render: (r) => <span className="ltr">{r.phone}</span> },
        { label: 'الحالة', render: (r) => <StatusBadge status={r.status} labels={{ ACTIVE: 'نشط', SUSPENDED: 'موقوف' }} /> },
        { label: 'العنوان', render: (r) => r.address.slice(0, 40) },
        { label: 'التسجيل', render: (r) => dateTime(r.createdAt) },
        { label: 'آخر دخول', render: (r) => dateTime(r.lastLoginAt) },
      ]} />
      <Pager page={page} total={data?.total ?? 0} onPage={setPage} />
    </>
  );
}
