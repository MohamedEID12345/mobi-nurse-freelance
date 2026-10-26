'use client';
import { use } from 'react';
import Link from 'next/link';
import { api } from '@/client/api';
import { useApi } from '@/client/hooks';
import { Table, useCan } from '@/components/admin';
import { ActionButton, Card, ErrorBox, KV, Money, Spinner, StatusBadge } from '@/components/ui';
import { DOC_TYPES, QUALIFICATIONS, VERIFICATION_STATUS, WITHDRAWAL_STATUS, dateTime } from '@/lib/shared/labels';
import { toInternational, whatsappLink } from '@/lib/shared/phone';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function NurseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const can = useCan();
  const { data: d, error, reload } = useApi<any>(`/api/v1/admin/nurses/${id}`);
  if (!d) return error ? <ErrorBox error={error} onRetry={reload} /> : <Spinner />;
  const p = d.profile;
  const act = async (action: string, needReason = false) => {
    let reason: string | null = '';
    if (needReason) { reason = window.prompt('اكتب السبب (سيظهر للممرض)'); if (!reason) return; }
    await api(`/api/v1/admin/nurses/${id}/${action}`, { body: { reason } });
    await reload();
  };
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
          <StatusBadge status={p.verification_status} labels={VERIFICATION_STATUS} />
          <StatusBadge status={d.user.status} labels={{ ACTIVE: 'نشط', SUSPENDED: 'موقوف' }} />
          {p.is_online && <span className="badge ok">متصل</span>}
        </div>
      </div>
      <div className="row" style={{ marginBottom: '1rem' }}>
        {can('NURSES_VERIFY') && p.verification_status === 'PENDING_VERIFICATION' && <>
          <ActionButton className="ok" confirm="اعتماد هذا الممرض؟" onClick={() => act('approve')}>✅ اعتماد</ActionButton>
          <ActionButton className="warn" onClick={() => act('request-resubmission', true)}>طلب إعادة رفع مستندات</ActionButton>
          <ActionButton className="danger" onClick={() => act('reject', true)}>رفض</ActionButton>
        </>}
        {p.is_online && <ActionButton className="ghost" onClick={() => act('force-offline')}>فصل الاتصال</ActionButton>}
        {d.user.status === 'ACTIVE'
          ? <ActionButton className="danger" onClick={() => userAct('suspend')}>إيقاف الحساب</ActionButton>
          : <ActionButton className="ok" onClick={() => userAct('reactivate')}>إعادة التفعيل</ActionButton>}
        <a className="btn whatsapp" href={whatsappLink(toInternational(d.user.phone))} target="_blank" rel="noreferrer">واتساب</a>
      </div>
      {p.rejection_reason && <div className="alert warn" style={{ marginBottom: '1rem' }}>ملاحظة سابقة: {p.rejection_reason}</div>}
      <div className="grid2">
        <Card>
          <h3>البيانات</h3>
          <KV k="الموبايل" v={<span className="ltr">{d.user.phone}</span>} />
          <KV k="المحافظة / المدينة" v={`${d.user.governorateName ?? ''} / ${d.user.cityName ?? ''}`} />
          <KV k="العنوان" v={d.user.address} />
          <KV k="تاريخ الميلاد" v={p.date_of_birth} />
          <KV k="المؤهل" v={QUALIFICATIONS[p.qualification] ?? p.qualification} />
          <KV k="سنوات الخبرة" v={p.years_experience} />
          <KV k="رسوم التفعيل" v={p.registration_fee_paid_at ? `مدفوعة ${dateTime(p.registration_fee_paid_at)}` : 'غير مدفوعة'} />
          <KV k="إرسال المستندات" v={dateTime(p.documents_submitted_at)} />
          <KV k="الخدمات" v={d.services.map((s: any) => s.name).join('، ')} />
          {p.bio && <KV k="نبذة" v={p.bio} />}
        </Card>
        <Card>
          <h3>الأداء والمحفظة</h3>
          <KV k="التقييم" v={`${Number(p.rating_avg).toFixed(2)} (${p.rating_count})`} />
          <KV k="عروض / مقبولة / مكتملة / ملغاة" v={`${p.offers_received} / ${p.offers_accepted} / ${p.completed_count} / ${p.cancelled_count}`} />
          <KV k="الرصيد" v={<Money v={d.wallet?.balance ?? 0} />} />
          <KV k="إجمالي الأرباح" v={<Money v={d.wallet?.total_earned ?? 0} />} />
          <KV k="إجمالي العمولة" v={<Money v={d.wallet?.total_commission ?? 0} />} />
          <KV k="تم سحبه" v={<Money v={d.wallet?.total_withdrawn ?? 0} />} />
        </Card>
      </div>
      <h2 style={{ marginTop: '1rem' }}>المستندات (روابط مؤقتة 5 دقائق — يتم تسجيل الاطلاع)</h2>
      <div className="grid-auto">
        {d.documents.length === 0 && <p className="muted">لم يتم رفع مستندات</p>}
        {d.documents.map((doc: any) => (
          <div key={doc.id} className="card" style={{ opacity: doc.isCurrent ? 1 : 0.5 }}>
            <strong className="small">{DOC_TYPES[doc.type]}{doc.isCurrent ? '' : ' (قديم)'}</strong>
            {doc.url && (doc.mimeType === 'application/pdf'
              ? <a href={doc.url} target="_blank" rel="noreferrer" className="btn sm secondary block">📄 فتح PDF</a>
              : <a href={doc.url} target="_blank" rel="noreferrer"><img className="doc-thumb" src={doc.url} alt="" /></a>)}
            <div className="small muted">{dateTime(doc.uploadedAt)}</div>
          </div>
        ))}
      </div>
      <h2 style={{ marginTop: '1rem' }}>آخر الطلبات</h2>
      <Table rows={d.bookings} columns={[
        { label: 'الطلب', render: (b: any) => <Link href={`/admin/bookings/${b.id}`}>{b.code}</Link> },
        { label: 'الخدمة', render: (b: any) => b.service_name_ar },
        { label: 'الحالة', render: (b: any) => <StatusBadge status={b.status} /> },
        { label: 'ربح الممرض', render: (b: any) => <Money v={b.nurse_amount} /> },
        { label: 'التاريخ', render: (b: any) => dateTime(b.created_at) },
      ]} />
      <div className="grid2" style={{ marginTop: '1rem' }}>
        <div><h2>طلبات السحب</h2><Table rows={d.withdrawals} columns={[
          { label: 'المبلغ', render: (w: any) => <Money v={w.amount} /> },
          { label: 'الحالة', render: (w: any) => <StatusBadge status={w.status} labels={WITHDRAWAL_STATUS} /> },
          { label: 'التاريخ', render: (w: any) => dateTime(w.created_at) },
        ]} /></div>
        <div><h2>التقييمات</h2><Table rows={d.reviews} columns={[
          { label: 'التقييم', render: (r: any) => `${r.rating} ★` },
          { label: 'تعليق', render: (r: any) => r.comment || '—' },
          { label: 'التاريخ', render: (r: any) => dateTime(r.created_at) },
        ]} /></div>
      </div>
      <h2 style={{ marginTop: '1rem' }}>الشكاوى</h2>
      <Table rows={d.complaints} columns={[
        { label: 'الكود', render: (c: any) => c.code },
        { label: 'الحالة', render: (c: any) => c.status },
        { label: 'الوصف', render: (c: any) => String(c.description).slice(0, 80) },
        { label: 'التاريخ', render: (c: any) => dateTime(c.created_at) },
      ]} />
    </>
  );
}
