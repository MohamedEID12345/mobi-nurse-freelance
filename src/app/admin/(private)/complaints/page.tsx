'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api, errorMessage } from '@/client/api';
import { useApi } from '@/client/hooks';
import { Pager, qs, Table } from '@/components/admin';
import { ErrorBox, Field, Modal, StatusBadge } from '@/components/ui';
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUS, dateTime } from '@/lib/shared/labels';

interface C { id: string; code: string; category: string; description: string; status: string; adminNote: string | null; bookingId: string | null; bookingCode: string | null;
  customer: { full_name: string; phone: string } | null; nurse: { id: string; full_name: string } | null; createdAt: string }

export default function Complaints() {
  const [status, setStatus] = useState('OPEN');
  const [page, setPage] = useState(0);
  const { data, error, reload } = useApi<{ total: number; items: C[] }>(`/api/v1/admin/complaints${qs({ status, page })}`);
  const [sel, setSel] = useState<C | null>(null);
  const [form, setForm] = useState({ status: 'IN_REVIEW', adminNote: '' });
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <div className="admin-top"><h1>الشكاوى</h1></div>
      <div className="tabs">
        {[['OPEN', 'جديدة'], ['IN_REVIEW', 'قيد المراجعة'], ['ESCALATED', 'مُصعّدة'], ['RESOLVED', 'تم الحل'], ['REJECTED', 'مرفوضة'], ['', 'الكل']].map(([k, l]) => (
          <button key={k} className={status === k ? 'on' : ''} onClick={() => { setStatus(k); setPage(0); }}>{l}</button>
        ))}
      </div>
      <ErrorBox error={error} onRetry={reload} />
      <Table rows={data?.items ?? []} onRow={(c) => { setSel(c); setForm({ status: c.status, adminNote: c.adminNote ?? '' }); setErr(null); }} columns={[
        { label: 'الكود', render: (c) => c.code },
        { label: 'النوع', render: (c) => COMPLAINT_CATEGORIES[c.category] },
        { label: 'العميل', render: (c) => c.customer ? `${c.customer.full_name} (${c.customer.phone})` : '—' },
        { label: 'الممرض', render: (c) => c.nurse?.full_name ?? '—' },
        { label: 'الطلب', render: (c) => c.bookingCode ?? '—' },
        { label: 'الوصف', render: (c) => c.description.slice(0, 60) },
        { label: 'الحالة', render: (c) => <StatusBadge status={c.status} labels={COMPLAINT_STATUS} /> },
        { label: 'التاريخ', render: (c) => dateTime(c.createdAt) },
      ]} />
      <Pager page={page} total={data?.total ?? 0} onPage={setPage} />
      <Modal open={Boolean(sel)} onClose={() => setSel(null)} title={`شكوى ${sel?.code ?? ''}`}>
        {sel && (
          <form className="stack" onSubmit={async (e) => {
            e.preventDefault(); setErr(null);
            try { await api(`/api/v1/admin/complaints/${sel.id}`, { method: 'PATCH', body: form }); setSel(null); reload(); }
            catch (e2) { setErr(errorMessage(e2)); }
          }}>
            <p>{sel.description}</p>
            <div className="row">
              {sel.bookingId && <Link className="btn sm secondary" href={`/admin/bookings/${sel.bookingId}`}>فتح الطلب</Link>}
              {sel.nurse && <Link className="btn sm secondary" href={`/admin/nurses/${sel.nurse.id}`}>ملف الممرض (إيقاف عند الحاجة)</Link>}
              {sel.customer && <a className="btn sm whatsapp" href={`https://wa.me/2${sel.customer.phone}`} target="_blank" rel="noreferrer">تواصل مع العميل</a>}
            </div>
            <ErrorBox error={err} />
            <Field label="الحالة">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(COMPLAINT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="رد / ملاحظة الإدارة (تظهر للعميل)"><textarea value={form.adminNote} onChange={(e) => setForm({ ...form, adminNote: e.target.value })} maxLength={2000} /></Field>
            <button className="btn block">حفظ</button>
          </form>
        )}
      </Modal>
    </>
  );
}
