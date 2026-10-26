'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/client/api';
import { useApi } from '@/client/hooks';
import { Pager, qs, Table, useCan } from '@/components/admin';
import { ActionButton, ErrorBox, Money, StatusBadge } from '@/components/ui';
import { WITHDRAWAL_METHODS, WITHDRAWAL_STATUS, dateTime } from '@/lib/shared/labels';

interface W { id: string; nurseId: string; nurseName: string; nursePhone: string; amount: number; method: string; receivingAccount: string; status: string; adminNote: string | null; reference: string | null; createdAt: string }

export default function Withdrawals() {
  const can = useCan();
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(0);
  const { data, error, reload } = useApi<{ total: number; items: W[] }>(`/api/v1/admin/withdrawals${qs({ status, page })}`);
  const act = async (w: W, action: string) => {
    const body: Record<string, string> = {};
    if (action === 'reject') { const n = window.prompt('سبب الرفض'); if (!n) return; body.note = n; }
    if (action === 'mark-paid') { const r = window.prompt('رقم/مرجع التحويل'); if (r === null) return; body.reference = r; }
    await api(`/api/v1/admin/withdrawals/${w.id}/${action}`, { body });
    await reload();
  };
  return (
    <>
      <div className="admin-top"><h1>طلبات السحب</h1></div>
      <div className="tabs">
        {[['PENDING', 'جديدة'], ['APPROVED', 'موافق عليها'], ['PROCESSING', 'جارٍ التحويل'], ['PAID', 'تم التحويل'], ['REJECTED', 'مرفوضة'], ['', 'الكل']].map(([k, l]) => (
          <button key={k} className={status === k ? 'on' : ''} onClick={() => { setStatus(k); setPage(0); }}>{l}</button>
        ))}
      </div>
      <ErrorBox error={error} onRetry={reload} />
      <Table rows={data?.items ?? []} columns={[
        { label: 'الممرض', render: (w) => <Link href={`/admin/nurses/${w.nurseId}`}>{w.nurseName}</Link> },
        { label: 'المبلغ', render: (w) => <strong><Money v={w.amount} /></strong> },
        { label: 'الطريقة', render: (w) => WITHDRAWAL_METHODS[w.method] },
        { label: 'حساب الاستلام', render: (w) => <span className="ltr">{w.receivingAccount}</span> },
        { label: 'التاريخ', render: (w) => dateTime(w.createdAt) },
        { label: 'الحالة', render: (w) => <StatusBadge status={w.status} labels={WITHDRAWAL_STATUS} /> },
        { label: 'ملاحظة/مرجع', render: (w) => w.reference ?? w.adminNote ?? '—' },
        { label: 'إجراء', render: (w) => !can('WITHDRAWALS_MANAGE') ? '—' : (
          <div className="row">
            {w.status === 'PENDING' && <ActionButton className="sm ok" onClick={() => act(w, 'approve')}>موافقة</ActionButton>}
            {w.status === 'APPROVED' && <ActionButton className="sm secondary" onClick={() => act(w, 'processing')}>جارٍ التحويل</ActionButton>}
            {['APPROVED', 'PROCESSING'].includes(w.status) && <ActionButton className="sm ok" onClick={() => act(w, 'mark-paid')}>تم التحويل</ActionButton>}
            {['PENDING', 'APPROVED', 'PROCESSING'].includes(w.status) && <ActionButton className="sm danger" onClick={() => act(w, 'reject')}>رفض</ActionButton>}
          </div>
        ) },
      ]} />
      <Pager page={page} total={data?.total ?? 0} onPage={setPage} />
    </>
  );
}
