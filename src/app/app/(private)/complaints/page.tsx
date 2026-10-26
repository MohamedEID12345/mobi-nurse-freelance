'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, errorMessage } from '@/client/api';
import { useApi } from '@/client/hooks';
import { Card, Empty, ErrorBox, Field, StatusBadge } from '@/components/ui';
import { COMPLAINT_CATEGORIES, COMPLAINT_STATUS, dateTime } from '@/lib/shared/labels';

interface C { id: string; code: string; category: string; description: string; status: string; adminNote: string | null; createdAt: string }
interface B { id: string; code: string; serviceName: string }

function Complaints() {
  const sp = useSearchParams();
  const list = useApi<C[]>('/api/v1/complaints');
  const bookings = useApi<B[]>('/api/v1/bookings?scope=all');
  const [f, setF] = useState({ bookingId: sp.get('bookingId') ?? '', category: 'SERVICE', description: '' });
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    try {
      const r = await api<{ code: string }>('/api/v1/complaints', { body: { ...f, bookingId: f.bookingId || null } });
      setDone(`تم تسجيل الشكوى رقم ${r.code}، وسنتواصل معك قريباً.`);
      setF({ ...f, description: '' }); list.reload();
    } catch (e2) { setErr(errorMessage(e2)); }
  };

  return (
    <>
      <h1>الشكاوى</h1>
      <form className="card stack" onSubmit={submit}>
        <h3>شكوى جديدة</h3>
        {done && <div className="alert ok">{done}</div>}
        <ErrorBox error={err} />
        <Field label="بخصوص">
          <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            {Object.entries(COMPLAINT_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="الطلب (اختياري)">
          <select value={f.bookingId} onChange={(e) => setF({ ...f, bookingId: e.target.value })}>
            <option value="">بدون</option>
            {(bookings.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.code} — {b.serviceName}</option>)}
          </select>
        </Field>
        <Field label="التفاصيل"><textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} required minLength={10} maxLength={2000} /></Field>
        <button className="btn block">إرسال</button>
      </form>
      <h2>شكاواي</h2>
      {list.data && list.data.length === 0 && <Empty>لا توجد شكاوى</Empty>}
      {(list.data ?? []).map((c) => (
        <Card key={c.id}>
          <div className="row between"><strong>{c.code} • {COMPLAINT_CATEGORIES[c.category]}</strong><StatusBadge status={c.status} labels={COMPLAINT_STATUS} /></div>
          <p className="small">{c.description}</p>
          {c.adminNote && <div className="alert info small">رد الإدارة: {c.adminNote}</div>}
          <p className="small muted">{dateTime(c.createdAt)}</p>
        </Card>
      ))}
    </>
  );
}

export default function ComplaintsPage() {
  return <Suspense><Complaints /></Suspense>;
}
