'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, errorMessage, newIdempotencyKey } from '@/client/api';
import { useSession } from '@/components/session';
import { Card, ErrorBox, Field, KV, Money, Spinner } from '@/components/ui';
import { LocationPicker } from '@/components/LocationPicker';
import { Gov, GeoSelect } from '@/components/GeoSelect';

interface Service { id: string; nameAr: string; descriptionAr: string; price: number }
interface Family { id: string; name: string; relation: string }

function BookForm() {
  const { me } = useSession();
  const router = useRouter();
  const sp = useSearchParams();
  const urgent = sp.get('urgent') === '1';
  const [govs, setGovs] = useState<Gov[]>([]);
  const [emergency, setEmergency] = useState('123');
  const [services, setServices] = useState<Service[]>([]);
  const [family, setFamily] = useState<Family[]>([]);
  const [serviceId, setServiceId] = useState(sp.get('service') ?? '');
  const [patient, setPatient] = useState('self');
  const [otherName, setOtherName] = useState('');
  const [geo, setGeo] = useState({ governorateId: me.governorateId, cityId: me.cityId });
  const [address, setAddress] = useState(me.address);
  const [loc, setLoc] = useState<{ latitude: number; longitude: number } | null>(null);
  const [when, setWhen] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [quote, setQuote] = useState<{ servicePrice: number; travelFee: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const idem = useMemo(() => newIdempotencyKey(), []);

  useEffect(() => {
    api('/api/v1/meta').then((m) => { setGovs(m.governorates); setEmergency(m.settings.EMERGENCY_NUMBER ?? '123'); }).catch((e) => setError(errorMessage(e)));
    api('/api/v1/services').then(setServices).catch(() => undefined);
    api('/api/v1/family').then(setFamily).catch(() => undefined);
  }, []);

  useEffect(() => {
    setQuote(null);
    if (!serviceId || !geo.governorateId) return;
    api('/api/v1/bookings/quote', { body: { serviceId, governorateId: geo.governorateId } }).then(setQuote).catch((e) => setError(errorMessage(e)));
  }, [serviceId, geo.governorateId]);

  const service = services.find((s) => s.id === serviceId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!loc) { setError('برجاء تحديد الموقع'); return; }
    if (when === 'later' && !scheduledAt) { setError('اختر موعد الخدمة'); return; }
    setBusy(true);
    try {
      const b = await api<{ id: string }>('/api/v1/bookings', { body: {
        serviceId, governorateId: geo.governorateId, cityId: geo.cityId, address, latitude: loc.latitude, longitude: loc.longitude,
        description, notes, isUrgent: urgent, idempotencyKey: idem,
        familyMemberId: patient !== 'self' && patient !== 'other' ? patient : null,
        patientName: patient === 'other' ? otherName : undefined,
        scheduledAt: when === 'later' ? new Date(scheduledAt).toISOString() : null,
      } });
      router.replace(`/app/bookings/${b.id}`);
    } catch (e2) {
      setError(errorMessage(e2));
      setBusy(false);
    }
  };

  if (!services.length && !error) return <Spinner />;
  return (
    <form className="stack" onSubmit={submit}>
      <h1>{urgent ? '🚨 طلب عاجل' : 'اطلب خدمة تمريض'}</h1>
      <div className="alert danger small">الخدمة ليست بديلاً عن الإسعاف. في الحالات الحرجة اتصل فوراً بـ <a href={`tel:${emergency}`}><strong>{emergency}</strong></a></div>
      <ErrorBox error={error} />
      <Card className="stack">
        <Field label="الخدمة">
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
            <option value="">اختر الخدمة</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.nameAr}</option>)}
          </select>
        </Field>
        {service?.descriptionAr && <p className="small muted">{service.descriptionAr}</p>}
        <Field label="المريض">
          <select value={patient} onChange={(e) => setPatient(e.target.value)}>
            <option value="self">أنا ({me.fullName})</option>
            {family.map((f) => <option key={f.id} value={f.id}>{f.name} — {f.relation}</option>)}
            <option value="other">شخص آخر</option>
          </select>
        </Field>
        {patient === 'other' && <Field label="اسم المريض"><input value={otherName} onChange={(e) => setOtherName(e.target.value)} required maxLength={120} /></Field>}
        <Link href="/app/family" className="small">+ إضافة فرد من الأسرة</Link>
        <Field label="وصف الحالة" hint="لا تكتب معلومات طبية غير ضرورية"><textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} /></Field>
      </Card>
      <Card className="stack">
        <GeoSelect governorates={govs} governorateId={geo.governorateId} cityId={geo.cityId} onlyActive onChange={setGeo} />
        <LocationPicker value={loc} onChange={setLoc} />
        <Field label="العنوان بالتفصيل"><input value={address} onChange={(e) => setAddress(e.target.value)} required minLength={3} maxLength={300} /></Field>
      </Card>
      {!urgent && (
        <Card className="stack">
          <div className="choice">
            <label className={when === 'now' ? 'on' : ''} onClick={() => setWhen('now')}>الآن</label>
            <label className={when === 'later' ? 'on' : ''} onClick={() => setWhen('later')}>موعد لاحق</label>
          </div>
          {when === 'later' && <Field label="الموعد"><input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required /></Field>}
          <Field label="ملاحظات إضافية (اختياري)"><input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="مثال: الدور الثالث بدون أسانسير" /></Field>
        </Card>
      )}
      {quote && (
        <Card>
          <h3>تفاصيل السعر</h3>
          <KV k="سعر الخدمة" v={<Money v={quote.servicePrice} />} />
          {quote.travelFee > 0 && <KV k="رسوم الانتقال" v={<Money v={quote.travelFee} />} />}
          <KV k="الإجمالي" v={<span className="total"><Money v={quote.total} /></span>} />
          <p className="small muted">يتم الدفع إلكترونياً بعد انتهاء الخدمة.</p>
        </Card>
      )}
      <button className={`btn block lg ${urgent ? 'danger' : ''}`} disabled={busy || !quote}>{busy ? 'جارٍ إرسال الطلب...' : 'تأكيد الطلب'}</button>
    </form>
  );
}

export default function BookPage() {
  return <Suspense fallback={<Spinner />}><BookForm /></Suspense>;
}
