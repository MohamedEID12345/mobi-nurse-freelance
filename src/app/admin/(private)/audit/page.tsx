'use client';
import { useState } from 'react';
import { useApi } from '@/client/hooks';
import { Pager, qs, Table } from '@/components/admin';
import { ErrorBox } from '@/components/ui';
import { dateTime } from '@/lib/shared/labels';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function Audit() {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(0);
  const { data, error, reload } = useApi<{ total: number; items: any[] }>(`/api/v1/admin/audit${qs({ action, page })}`);
  const short = (v: unknown) => (v ? JSON.stringify(v).slice(0, 90) : '—');
  return (
    <>
      <div className="admin-top"><h1>سجل العمليات</h1><span className="small muted">سجل غير قابل للتعديل أو الحذف</span></div>
      <div className="filters"><input placeholder="الإجراء (مثال: NURSE_APPROVE)" value={action} onChange={(e) => { setAction(e.target.value.toUpperCase()); setPage(0); }} dir="ltr" /></div>
      <ErrorBox error={error} onRetry={reload} />
      <Table rows={data?.items ?? []} columns={[
        { label: 'الوقت', render: (r) => dateTime(r.created_at) },
        { label: 'المنفذ', render: (r) => `${r.actor_type}${r.actor_id ? ` ${String(r.actor_id).slice(0, 8)}` : ''}` },
        { label: 'الإجراء', render: (r) => <span className="ltr">{r.action}</span> },
        { label: 'الهدف', render: (r) => `${r.target_type ?? ''} ${String(r.target_id ?? '').slice(0, 12)}` },
        { label: 'قبل', render: (r) => <span className="small ltr">{short(r.old_value)}</span> },
        { label: 'بعد', render: (r) => <span className="small ltr">{short(r.new_value)}</span> },
        { label: 'IP', render: (r) => <span className="small ltr">{r.ip ?? '—'}</span> },
      ]} />
      <Pager page={page} total={data?.total ?? 0} size={50} onPage={setPage} />
    </>
  );
}
