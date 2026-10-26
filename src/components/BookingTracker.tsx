'use client';
import { useState } from 'react';
import { ActionButton, Card, KV, Money, Stars, StatusBadge } from './ui';
import { BOOKING_STATUS, CUSTOMER_STEPS, dateTime } from '@/lib/shared/labels';
import { whatsappLink, toInternational } from '@/lib/shared/phone';

export interface CustomerBooking {
  id: string; code: string; status: string; serviceName: string; patientName: string; address: string; mapsLink: string;
  description: string; notes: string; isUrgent: boolean; scheduledAt: string | null; createdAt: string;
  price: { servicePrice: number; travelFee: number; total: number }; paymentStatus: string; paymentMethod: string | null;
  cancelReason: string | null; cancelledBy: string | null;
  nurse: null | { id: string; name: string; phone: string | null; rating: number; ratingCount: number; completed: number; yearsExperience: number; photoUrl: string | null };
  nurseLocation: null | { at: string | null; distanceKm: number; etaMinutes: number; mapsLink: string };
  timeline: Array<{ from: string | null; to: string; actor: string; reason: string | null; at: string }>;
  canCancel: boolean; canPay: boolean; canReview: boolean; review: { rating: number } | null;
}

export function BookingTracker({ b, onAction, complaintHref }: {
  b: CustomerBooking;
  onAction: (action: string, body?: unknown) => Promise<unknown>;
  complaintHref?: string;
}) {
  const [rating, setRating] = useState(5);
  const [cats, setCats] = useState({ punctuality: 5, professionalism: 5, communication: 5, quality: 5 });
  const [comment, setComment] = useState('');
  const stepIndex = CUSTOMER_STEPS.indexOf(b.status as (typeof CUSTOMER_STEPS)[number]);
  const effective = b.status === 'SERVICE_COMPLETED' ? CUSTOMER_STEPS.indexOf('WAITING_FOR_PAYMENT') : stepIndex;

  return (
    <div className="stack">
      <Card>
        <div className="row between">
          <h2 style={{ margin: 0 }}>{b.serviceName}</h2>
          <StatusBadge status={b.status} />
        </div>
        <p className="muted small">طلب رقم <span className="ltr">{b.code}</span> • {dateTime(b.createdAt)}{b.isUrgent ? ' • 🚨 عاجل' : ''}</p>
        {b.status === 'SEARCHING' && <div className="alert info pulse">جارٍ البحث عن أقرب ممرض متاح... سيتم إشعارك فور القبول.</div>}
        {b.status === 'CANCELLED' && <div className="alert danger">تم إلغاء الطلب{b.cancelReason ? `: ${b.cancelReason}` : ''}</div>}
        {b.status === 'DISPUTED' && <div className="alert warn">الطلب قيد المراجعة من الإدارة.</div>}
        {b.status !== 'CANCELLED' && b.status !== 'DISPUTED' && (
          <ul className="steps" style={{ marginTop: '.5rem' }}>
            {CUSTOMER_STEPS.map((s, i) => (
              <li key={s} className={i < effective ? 'done' : i === effective ? 'current' : ''}><span className="dot" />{BOOKING_STATUS[s]}</li>
            ))}
          </ul>
        )}
      </Card>

      {b.nurse && (
        <Card>
          <div className="row">
            {b.nurse.photoUrl ? <img className="avatar" src={b.nurse.photoUrl} alt="" /> : <span className="avatar">👩‍⚕️</span>}
            <div style={{ flex: 1 }}>
              <strong>{b.nurse.name}</strong>
              <div className="small muted">⭐ {b.nurse.rating ? b.nurse.rating.toFixed(1) : 'جديد'} ({b.nurse.ratingCount}) • {b.nurse.completed} خدمة • خبرة {b.nurse.yearsExperience} سنة</div>
            </div>
          </div>
          {b.nurseLocation && (
            <div className="alert info" style={{ marginTop: '.75rem' }}>
              🚗 على بعد حوالي {b.nurseLocation.distanceKm} كم • الوصول خلال ~{b.nurseLocation.etaMinutes} دقيقة
              <div><a href={b.nurseLocation.mapsLink} target="_blank" rel="noreferrer">📍 موقع الممرض على خرائط جوجل</a></div>
            </div>
          )}
          {b.nurse.phone && (
            <div className="grid2" style={{ marginTop: '.75rem' }}>
              <a className="btn secondary" href={`tel:${b.nurse.phone}`}>📞 اتصال</a>
              <a className="btn whatsapp" href={whatsappLink(toInternational(b.nurse.phone))} target="_blank" rel="noreferrer">واتساب</a>
            </div>
          )}
        </Card>
      )}

      <Card>
        <KV k="المريض" v={b.patientName} />
        <KV k="العنوان" v={b.address} />
        <KV k="الموقع" v={<a href={b.mapsLink} target="_blank" rel="noreferrer">فتح على خرائط جوجل</a>} />
        {b.scheduledAt && <KV k="الموعد" v={dateTime(b.scheduledAt)} />}
        {b.description && <KV k="وصف الحالة" v={b.description} />}
        <KV k="سعر الخدمة" v={<Money v={b.price.servicePrice} />} />
        {b.price.travelFee > 0 && <KV k="رسوم الانتقال" v={<Money v={b.price.travelFee} />} />}
        <KV k="الإجمالي" v={<span className="total"><Money v={b.price.total} /></span>} />
        {b.paymentStatus === 'PAID' && <KV k="الدفع" v={b.paymentMethod === 'NURSE_PAID_ON_BEHALF' ? 'دفعه الممرض نيابة عنك' : 'تم الدفع إلكترونياً ✅'} />}
      </Card>

      {b.canPay && (
        <Card className="stack">
          <h3>💳 الخدمة انتهت — برجاء الدفع</h3>
          <p className="muted small">الدفع آمن عبر كاشير بالبطاقة أو المحفظة الإلكترونية.</p>
          <ActionButton className="block lg ok" onClick={async () => {
            const r = (await onAction('pay')) as { url: string };
            window.location.href = r.url;
          }}>ادفع <Money v={b.price.total} /></ActionButton>
        </Card>
      )}

      {b.canReview && (
        <Card className="stack">
          <h3>قيّم الخدمة</h3>
          <Stars value={rating} onChange={setRating} />
          {([['punctuality', 'الالتزام بالموعد'], ['professionalism', 'الاحترافية'], ['communication', 'التواصل'], ['quality', 'جودة الخدمة']] as const).map(([k, l]) => (
            <div key={k} className="row between"><span className="small">{l}</span><Stars value={cats[k]} onChange={(v) => setCats({ ...cats, [k]: v })} size={20} /></div>
          ))}
          <textarea placeholder="تعليقك (اختياري)" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
          <ActionButton className="block" onClick={() => onAction('review', { rating, ...cats, comment })}>إرسال التقييم</ActionButton>
        </Card>
      )}
      {b.review && <div className="alert ok">شكراً لتقييمك ({b.review.rating} ★)</div>}

      {b.canCancel && (
        <ActionButton className="block ghost" confirm="هل تريد إلغاء الطلب؟" onClick={() => onAction('cancel', { reason: 'ألغاه العميل' })}>
          إلغاء الطلب
        </ActionButton>
      )}
      {complaintHref && <a className="btn block ghost" href={complaintHref}>تقديم شكوى بخصوص هذا الطلب</a>}

      <Card>
        <h3>سجل الطلب</h3>
        {b.timeline.map((t, i) => (
          <div key={i} className="kv"><span className="k">{BOOKING_STATUS[t.to] ?? t.to}{t.reason ? ` — ${t.reason}` : ''}</span><span className="v small">{dateTime(t.at)}</span></div>
        ))}
      </Card>
    </div>
  );
}
