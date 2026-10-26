'use client';
import { use } from 'react';
import Link from 'next/link';
import { api } from '@/client/api';
import { useApi } from '@/client/hooks';
import { Table } from '@/components/admin';
import { ActionButton, Card, ErrorBox, KV, Money, Spinner, StatusBadge } from '@/components/ui';
import { COMPLAINT_STATUS, PAYMENT_STATUS, dateTime } from '@/lib/shared/labels';
import { toInternational, whatsappLink } from '@/lib/shared/phone';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: d, error, reload } = useApi<any>(`/api/v1/admin/customers/${id}`);
  if (!d) return error ? <ErrorBox error={error} onRetry={reload} /> : <Spinner />;
  const userAct = async (action: string) => {
    let reason: string | null = '';
    if (action === 'suspend') { reason = window.prompt('سبب الإيقاف'); if (!reason) return; }
    await api(`/api/v1/admin/users/${id}/${action}`, { body: { reason } });
    await reload();
  };
  return (
    <>
      <div className="admin-top">
        <h1>{d.user.fullName}</h1>
        <div className="row">
          <StatusBadge status={d.user.status} labels={{ ACTIVE: 'نشط', SUSPENDED: 'موقوف' }} />
          {d.user.status === 'ACTIVE'
            ? <ActionButton className="sm danger" onClick={() => userAct('suspend')}>إيقاف الحساب</ActionButton>
            : <ActionButton className="sm ok" onClick={() => userAct('reactivate')}>إعادة التفعيل</ActionButton>}
          <a className="btn sm whatsapp" href={whatsappLink(toInternational(d.user.phone))} target="_blank" rel="noreferrer">واتساب</a>
        </div>
      </div>
      <div className="grid2">
        <Card>
          <KV k="الموبايل" v={<span className="ltr">{d.user.phone}</span>} />
          <KV k="العنوان" v={d.user.address} />
          <KV k="تاريخ التسجيل" v={dateTime(d.user.createdAt)} />
          {d.user.suspensionReason && <KV k="سبب الإيقاف" v={d.user.suspensionReason} />}
        </Card>
        <Card>
          <h3>أفراد الأسرة</h3>
          {d.family.length === 0 && <p className="muted small">لا يوجد</p>}
          {d.family.map((f: any) => <KV key={f.id} k={f.relation} v={f.name} />)}
          {d.dues.length > 0 && <><h3>مستحقات لممرضين</h3>{d.dues.map((x: any) => <KV key={x.id} k={x.status === 'OPEN' ? 'مفتوح' : 'تمت التسوية'} v={<Money v={x.amount} />} />)}</>}
        </Card>
      </div>
      <h2 style={{ marginTop: '1rem' }}>الطلبات</h2>
      <Table rows={d.bookings} columns={[
        { label: 'الطلب', render: (b: any) => <Link href={`/admin/bookings/${b.id}`}>{b.code}</Link> },
        { label: 'الخدمة', render: (b: any) => b.service_name_ar },
        { label: 'الحالة', render: (b: any) => <StatusBadge status={b.status} /> },
        { label: 'الإجمالي', render: (b: any) => <Money v={b.total_amount} /> },
        { label: 'التاريخ', render: (b: any) => dateTime(b.created_at) },
      ]} />
      <div className="grid2" style={{ marginTop: '1rem' }}>
        <div><h2>المدفوعات</h2><Table rows={d.payments} columns={[
          { label: 'المرجع', render: (p: any) => <span className="ltr">{p.merchant_order_id}</span> },
          { label: 'المبلغ', render: (p: any) => <Money v={p.amount} /> },
          { label: 'الحالة', render: (p: any) => <StatusBadge status={p.status} labels={PAYMENT_STATUS} /> },
        ]} /></div>
        <div><h2>الشكاوى</h2><Table rows={d.complaints} columns={[
          { label: 'الكود', render: (c: any) => c.code },
          { label: 'الحالة', render: (c: any) => <StatusBadge status={c.status} labels={COMPLAINT_STATUS} /> },
          { label: 'التاريخ', render: (c: any) => dateTime(c.created_at) },
        ]} /></div>
      </div>
    </>
  );
}
