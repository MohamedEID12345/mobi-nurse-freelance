'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useApi } from '@/client/hooks';
import { Pager, qs, Table } from '@/components/admin';
import { ErrorBox, Money, Spinner, StatusBadge } from '@/components/ui';
import { PAYMENT_STATUS, dateTime } from '@/lib/shared/labels';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function Finance() {
  const [range, setRange] = useState('month');
  const [status, setStatus] = useState('');
  const [issues, setIssues] = useState(false);
  const [page, setPage] = useState(0);
  const rep = useApi<any>(`/api/v1/admin/revenue${qs({ range })}`);
  const pays = useApi<{ total: number; items: any[] }>(`/api/v1/admin/payments${qs({ status, issues: issues ? 'true' : null, page })}`);
  const r = rep.data;
  return (
    <>
      <div className="admin-top"><h1>المالية</h1>
        <div className="tabs" style={{ margin: 0 }}>
          {[['today', 'اليوم'], ['week', 'الأسبوع'], ['month', 'الشهر'], ['all', 'الكل']].map(([k, l]) => <button key={k} className={range === k ? 'on' : ''} onClick={() => setRange(k)}>{l}</button>)}
        </div>
      </div>
      <ErrorBox error={rep.error} onRetry={rep.reload} />
      {!r && !rep.error && <Spinner />}
      {r && (
        <div className="grid-auto">
          <div className="stat"><div className="n"><Money v={r.gross_service_value} /></div><div className="l">إجمالي قيمة الخدمات</div></div>
          <div className="stat"><div className="n"><Money v={r.commission} /></div><div className="l">عمولة MOBI (10%)</div></div>
          <div className="stat"><div className="n"><Money v={r.nurse_earnings} /></div><div className="l">أرباح الممرضين</div></div>
          <div className="stat"><div className="n"><Money v={r.registration_fees} /></div><div className="l">رسوم تفعيل الحسابات</div></div>
          <div className="stat"><div className="n"><Money v={r.withdrawals_paid} /></div><div className="l">سحوبات تم تحويلها</div></div>
          <div className="stat"><div className="n"><Money v={r.refunds} /></div><div className="l">استردادات</div></div>
          <div className="stat"><div className="n"><Money v={r.net_platform_revenue} /></div><div className="l">صافي إيراد المنصة</div></div>
          <div className={`stat ${r.payments_needing_refund > 0 ? 'alert-stat' : ''}`}><div className="n">{r.payments_needing_refund}</div><div className="l">مدفوعات تحتاج استرداد يدوي</div></div>
        </div>
      )}
      {r?.daily?.length > 0 && (
        <><h2 style={{ marginTop: '1rem' }}>يومياً</h2>
        <Table rows={r.daily} columns={[
          { label: 'اليوم', render: (x: any) => x.day },
          { label: 'طلبات مدفوعة', render: (x: any) => x.bookings },
          { label: 'القيمة', render: (x: any) => <Money v={x.gross} /> },
          { label: 'العمولة', render: (x: any) => <Money v={x.commission} /> },
        ]} /></>
      )}
      <h2 style={{ marginTop: '1.5rem' }}>المعاملات (كاشير)</h2>
      <div className="filters">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          <option value="">كل الحالات</option>{Object.entries(PAYMENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="check"><input type="checkbox" checked={issues} onChange={(e) => { setIssues(e.target.checked); setPage(0); }} /> مشكلات فقط</label>
      </div>
      <Table rows={pays.data?.items ?? []} columns={[
        { label: 'المرجع', render: (p) => <span className="ltr">{p.reference}</span> },
        { label: 'النوع', render: (p) => (p.purpose === 'REGISTRATION_FEE' ? 'رسوم تفعيل' : p.payerType === 'NURSE' ? 'خدمة (نيابة)' : 'خدمة') },
        { label: 'الطلب', render: (p) => (p.bookingId ? <Link href={`/admin/bookings/${p.bookingId}`}>{p.bookingCode}</Link> : p.nurseId ? <Link href={`/admin/nurses/${p.nurseId}`}>ممرض</Link> : '—') },
        { label: 'المبلغ', render: (p) => <Money v={p.amount} /> },
        { label: 'الحالة', render: (p) => <StatusBadge status={p.status} labels={PAYMENT_STATUS} /> },
        { label: 'رقم عملية كاشير', render: (p) => <span className="ltr small">{p.transactionId ?? '—'}</span> },
        { label: 'ملاحظة', render: (p) => (p.issue ? <span className="badge danger">{p.issue}</span> : '—') },
        { label: 'التاريخ', render: (p) => dateTime(p.createdAt) },
      ]} />
      <Pager page={page} total={pays.data?.total ?? 0} onPage={setPage} />
    </>
  );
}
