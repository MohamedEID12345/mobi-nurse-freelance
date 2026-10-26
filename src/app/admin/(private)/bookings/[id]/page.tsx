'use client';
import { use } from 'react';
import Link from 'next/link';
import { api } from '@/client/api';
import { useApi } from '@/client/hooks';
import { Table, useCan } from '@/components/admin';
import { ActionButton, Card, ErrorBox, KV, Money, Spinner, StatusBadge } from '@/components/ui';
import { BOOKING_STATUS, PAYMENT_STATUS, dateTime } from '@/lib/shared/labels';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function BookingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const can = useCan();
  const { data: d, error, reload } = useApi<any>(`/api/v1/admin/bookings/${id}`, { poll: 20000 });
  if (!d) return error ? <ErrorBox error={error} onRetry={reload} /> : <Spinner />;
  const b = d.booking;
  const act = async (action: string, ask?: string) => {
    let reason: string | null = '';
    if (ask) { reason = window.prompt(ask); if (!reason) return; }
    await api(`/api/v1/admin/bookings/${id}/${action}`, { body: { reason } });
    await reload();
  };
  const final = ['PAID', 'CANCELLED'].includes(b.status);
  return (
    <>
      <div className="admin-top">
        <h1>{b.is_urgent ? '🚨 ' : ''}طلب {b.code}</h1>
        <StatusBadge status={b.status} />
      </div>
      {can('BOOKINGS_MANAGE') && (
        <div className="row" style={{ marginBottom: '1rem' }}>
          {b.status === 'SEARCHING' && <ActionButton className="secondary" onClick={() => act('redispatch')}>إعادة الترشيح الآن</ActionButton>}
          {!final && <ActionButton className="danger" onClick={() => act('cancel', 'سبب الإلغاء (يظهر للعميل والممرض)')}>إلغاء الطلب</ActionButton>}
          {['SERVICE_STARTED', 'SERVICE_COMPLETED', 'WAITING_FOR_PAYMENT', 'PAID'].includes(b.status) && <ActionButton className="warn" onClick={() => act('dispute', 'سبب النزاع')}>تحويل لنزاع</ActionButton>}
          {b.status === 'DISPUTED' && <ActionButton className="ok" onClick={() => act('resolve-dispute', 'ملخص الحل')}>حل النزاع</ActionButton>}
        </div>
      )}
      <div className="grid2">
        <Card>
          <h3>تفاصيل الطلب</h3>
          <KV k="الخدمة" v={b.service_name_ar} />
          <KV k="العميل" v={d.customer ? <Link href={`/admin/customers/${d.customer.id}`}>{d.customer.full_name} — {d.customer.phone}</Link> : `${b.guest_name} — ${b.guest_phone} (بدون حساب)`} />
          <KV k="المريض" v={b.patient_name} />
          <KV k="الممرض" v={d.nurse ? <Link href={`/admin/nurses/${d.nurse.id}`}>{d.nurse.full_name} — {d.nurse.phone}</Link> : '—'} />
          <KV k="العنوان" v={b.address} />
          <KV k="الموقع" v={<a href={b.mapsLink} target="_blank" rel="noreferrer">📍 خرائط جوجل</a>} />
          {b.nurseMapsLink && <KV k="آخر موقع للممرض" v={<a href={b.nurseMapsLink} target="_blank" rel="noreferrer">🚗 خرائط جوجل</a>} />}
          {b.arrival_distance_km != null && <KV k="المسافة عند تسجيل الوصول" v={`${b.arrival_distance_km} كم${Number(b.arrival_distance_km) > 1 ? ' ⚠️' : ''}`} />}
          <KV k="الموعد" v={b.scheduled_at ? dateTime(b.scheduled_at) : 'فوري'} />
          {b.description && <KV k="الوصف" v={b.description} />}
          {b.cancel_reason && <KV k="سبب الإلغاء" v={`${b.cancel_reason} (${b.cancelled_by})`} />}
        </Card>
        <Card>
          <h3>المالية</h3>
          <KV k="سعر الخدمة" v={<Money v={b.service_price} />} />
          <KV k="رسوم الانتقال" v={<Money v={b.travel_fee} />} />
          <KV k="الإجمالي" v={<strong><Money v={b.total_amount} /></strong>} />
          <KV k={`عمولة MOBI (${b.commission_pct}%)`} v={<Money v={b.commission_amount} />} />
          <KV k="صافي الممرض" v={<Money v={b.nurse_amount} />} />
          <KV k="حالة الدفع" v={b.payment_status === 'PAID' ? `مدفوع (${b.payment_method === 'NURSE_PAID_ON_BEHALF' ? 'دفعه الممرض نيابة' : 'إلكتروني'})` : 'غير مدفوع'} />
          {d.due && <KV k="مستحق للممرض على العميل" v={<><Money v={d.due.amount} /> — {d.due.status === 'OPEN' ? 'مفتوح' : 'تمت التسوية'}</>} />}
          {d.review && <KV k="التقييم" v={`${d.review.rating} ★ ${d.review.comment ?? ''}`} />}
        </Card>
      </div>
      <h2 style={{ marginTop: '1rem' }}>السجل الزمني</h2>
      <Table rows={d.timeline} columns={[
        { label: 'من', render: (t: any) => (t.from ? BOOKING_STATUS[t.from] : '—') },
        { label: 'إلى', render: (t: any) => BOOKING_STATUS[t.to] ?? t.to },
        { label: 'بواسطة', render: (t: any) => t.actor },
        { label: 'سبب', render: (t: any) => t.reason ?? '—' },
        { label: 'الوقت', render: (t: any) => dateTime(t.at) },
      ]} />
      <div className="grid2" style={{ marginTop: '1rem' }}>
        <div><h2>العروض المرسلة للممرضين</h2><Table rows={d.offers} columns={[
          { label: 'الممرض', render: (o: any) => <Link href={`/admin/nurses/${o.nurseId}`}>{o.nurseName}</Link> },
          { label: 'المسافة', render: (o: any) => `${o.distanceKm} كم` },
          { label: 'الحالة', render: (o: any) => o.status },
          { label: 'الوقت', render: (o: any) => dateTime(o.createdAt) },
        ]} /></div>
        <div><h2>المدفوعات</h2><Table rows={d.payments} columns={[
          { label: 'المرجع', render: (p: any) => <span className="ltr">{p.merchant_order_id}</span> },
          { label: 'الدافع', render: (p: any) => p.payer_type },
          { label: 'المبلغ', render: (p: any) => <Money v={p.amount} /> },
          { label: 'الحالة', render: (p: any) => <StatusBadge status={p.status} labels={PAYMENT_STATUS} /> },
          { label: 'ملاحظة', render: (p: any) => (p.issue ? <span className="badge danger">{p.issue}</span> : '—') },
        ]} /></div>
      </div>
    </>
  );
}
