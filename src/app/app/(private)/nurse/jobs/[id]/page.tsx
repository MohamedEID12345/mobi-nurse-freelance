'use client';
import { use, useEffect } from 'react';
import { api } from '@/client/api';
import { useApi } from '@/client/hooks';
import { getLocation } from '@/client/location';
import { ActionButton, Card, ErrorBox, KV, Money, Spinner, StatusBadge } from '@/components/ui';
import { BOOKING_STATUS, dateTime } from '@/lib/shared/labels';
import { toInternational, whatsappLink } from '@/lib/shared/phone';

interface Job {
  id: string; code: string; status: string; serviceName: string; patientName: string; description: string; notes: string;
  isUrgent: boolean; scheduledAt: string | null; address: string | null; mapsLink: string | null; directionsLink: string | null;
  customer: { name: string; phone: string | null };
  price: { servicePrice: number; travelFee: number; total: number; commissionPct: number; commission: number; nurseAmount: number };
  paymentStatus: string; paymentMethod: string | null; due: { id: string; amount: number; status: string } | null;
  timeline: Array<{ to: string; reason: string | null; at: string }>; cancelReason: string | null;
}

async function withLocation(): Promise<{ latitude?: number; longitude?: number }> {
  try { const c = await getLocation(true); return { latitude: c.latitude, longitude: c.longitude }; } catch { return {}; }
}

export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: j, error, reload, setData } = useApi<Job>(`/api/v1/bookings/${id}`, { poll: 10000 });
  const act = async (action: string, body: object = {}) => {
    const r = await api(`/api/v1/bookings/${id}/${action}`, { body });
    if (r && typeof r === 'object' && 'status' in (r as object)) setData(r as Job); else await reload();
    return r;
  };

  // Live location for the customer while heading to them (rate-limited to 20s).
  useEffect(() => {
    if (!j || !['NURSE_ASSIGNED', 'NURSE_ON_THE_WAY'].includes(j.status)) return;
    const send = () => getLocation(true).then((c) => api('/api/v1/nurse/location', { body: { latitude: c.latitude, longitude: c.longitude } })).catch(() => undefined);
    send();
    const t = setInterval(send, 20000);
    return () => clearInterval(t);
  }, [j?.status, j]);

  if (error && !j) return <ErrorBox error={error} onRetry={reload} />;
  if (!j) return <Spinner />;
  const release = (
    <ActionButton className="block ghost" confirm="الاعتذار عن الطلب يؤثر على تقييمك. هل أنت متأكد؟"
                  onClick={async () => { await api(`/api/v1/bookings/${id}/release`, { body: { reason: 'اعتذار الممرض' } }); window.location.href = '/app/nurse'; }}>
      اعتذار عن الطلب
    </ActionButton>
  );

  return (
    <>
      <Card>
        <div className="row between"><h2 style={{ margin: 0 }}>{j.isUrgent ? '🚨 ' : ''}{j.serviceName}</h2><StatusBadge status={j.status} /></div>
        <p className="small muted">طلب <span className="ltr">{j.code}</span>{j.scheduledAt ? ` • موعد: ${dateTime(j.scheduledAt)}` : ''}</p>
        {j.status === 'CANCELLED' && <div className="alert danger">تم إلغاء الطلب{j.cancelReason ? `: ${j.cancelReason}` : ''}</div>}
      </Card>

      <Card>
        <KV k="العميل" v={j.customer.name} />
        <KV k="المريض" v={j.patientName} />
        {j.address && <KV k="العنوان" v={j.address} />}
        {j.description && <KV k="وصف الحالة" v={j.description} />}
        {j.notes && <KV k="ملاحظات" v={j.notes} />}
        {j.customer.phone && (
          <div className="grid2" style={{ marginTop: '.75rem' }}>
            <a className="btn secondary" href={`tel:${j.customer.phone}`}>📞 اتصال</a>
            <a className="btn whatsapp" href={whatsappLink(toInternational(j.customer.phone))} target="_blank" rel="noreferrer">واتساب</a>
          </div>
        )}
        {j.directionsLink && ['NURSE_ASSIGNED', 'NURSE_ON_THE_WAY'].includes(j.status) && (
          <a className="btn block" style={{ marginTop: '.6rem' }} href={j.directionsLink} target="_blank" rel="noreferrer">🧭 الملاحة إلى العميل (خرائط جوجل)</a>
        )}
        {j.mapsLink && <a className="small" href={j.mapsLink} target="_blank" rel="noreferrer">📍 عرض الموقع على الخريطة</a>}
      </Card>

      <Card>
        <KV k="إجمالي الخدمة" v={<Money v={j.price.total} />} />
        <KV k={`عمولة المنصة (${j.price.commissionPct}%)`} v={<Money v={j.price.commission} />} />
        <KV k="صافي ربحك" v={<span className="total"><Money v={j.price.nurseAmount} /></span>} />
      </Card>

      <div className="stack">
        {j.status === 'NURSE_ASSIGNED' && (<>
          <ActionButton className="block lg" onClick={async () => act('on-the-way', await withLocation())}>🚗 انطلقت للعميل</ActionButton>
          <ActionButton className="block secondary" onClick={async () => act('arrived', await withLocation())}>📍 وصلت</ActionButton>
          {release}
        </>)}
        {j.status === 'NURSE_ON_THE_WAY' && (<>
          <ActionButton className="block lg" onClick={async () => act('arrived', await withLocation())}>📍 وصلت</ActionButton>
          {release}
        </>)}
        {j.status === 'NURSE_ARRIVED' && <ActionButton className="block lg" onClick={() => act('start')}>▶️ بدء الخدمة</ActionButton>}
        {j.status === 'SERVICE_STARTED' && (
          <ActionButton className="block lg ok" confirm="تأكيد انتهاء الخدمة وطلب الدفع من العميل؟" onClick={() => act('complete')}>✅ إنهاء الخدمة وطلب الدفع</ActionButton>
        )}
        {j.status === 'WAITING_FOR_PAYMENT' && (
          <Card className="stack">
            <div className="alert warn pulse">في انتظار دفع العميل إلكترونياً ({j.price.total} ج.م)</div>
            <p className="small muted">إذا لم تتوفر وسيلة دفع لدى العميل، يمكنك الدفع نيابة عنه وسيُسجَّل المبلغ مستحقاً لك على العميل.</p>
            <ActionButton className="block warn" confirm="ستدفع قيمة الخدمة كاملة إلكترونياً نيابة عن العميل. متابعة؟"
                          onClick={async () => { const r = await api<{ url: string }>(`/api/v1/bookings/${id}/pay-on-behalf`, { body: {} }); window.location.href = r.url; }}>
              الدفع نيابة عن العميل
            </ActionButton>
          </Card>
        )}
        {j.status === 'PAID' && (
          <div className="alert ok">تم الدفع ✅ — أُضيف <Money v={j.price.nurseAmount} /> إلى محفظتك.{j.paymentMethod === 'NURSE_PAID_ON_BEHALF' ? ' (دفعت نيابة عن العميل)' : ''}</div>
        )}
        {j.due && j.due.status === 'OPEN' && (
          <Card className="stack">
            <p>مبلغ مستحق لك على العميل: <strong><Money v={j.due.amount} /></strong></p>
            <ActionButton className="block secondary" confirm="تأكيد استلام المبلغ من العميل؟" onClick={() => act('due-settled')}>تم تحصيل المبلغ من العميل</ActionButton>
          </Card>
        )}
      </div>

      <Card>
        <h3>سجل الطلب</h3>
        {j.timeline.map((t, i) => <div key={i} className="kv"><span className="k">{BOOKING_STATUS[t.to] ?? t.to}{t.reason ? ` — ${t.reason}` : ''}</span><span className="v small">{dateTime(t.at)}</span></div>)}
      </Card>
    </>
  );
}
