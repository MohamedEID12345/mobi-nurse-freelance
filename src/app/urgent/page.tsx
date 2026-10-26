'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, errorMessage, newIdempotencyKey } from '@/client/api';
import { Card, ErrorBox, Field, Money, Spinner } from '@/components/ui';
import { LocationPicker } from '@/components/LocationPicker';
import { Gov, GeoSelect } from '@/components/GeoSelect';

interface Service { id: string; nameAr: string; price: number; travelFee: number; total: number }

export default function UrgentPage() {
  const router = useRouter();
  const [meta, setMeta] = useState<{ governorates: Gov[]; settings: Record<string, string> } | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState({ name: '', phone: '', patientName: '', serviceId: '', governorateId: '', cityId: '', address: '', description: '' });
  const [loc, setLoc] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const idem = useMemo(() => newIdempotencyKey(), []);

  useEffect(() => {
    api('/api/v1/meta').then((m) => {
      setMeta(m);
      const active = (m.governorates as Gov[]).filter((g) => g.active);
      if (active.length === 1) setForm((f) => ({ ...f, governorateId: active[0].id }));
    }).catch((e) => setError(errorMessage(e)));
  }, []);
  useEffect(() => {
    api(`/api/v1/services${form.governorateId ? `?governorateId=${form.governorateId}` : ''}`).then(setServices).catch(() => undefined);
  }, [form.governorateId]);

  const service = services.find((s) => s.id === form.serviceId);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loc) { setError('برجاء تحديد الموقع أولاً'); return; }
    setBusy(true); setError(null);
    try {
      const r = await api<{ token: string; booking: { code: string } }>('/api/v1/guest/bookings', {
        body: { ...form, latitude: loc.latitude, longitude: loc.longitude, notes: '', idempotencyKey: idem },
      });
      const saved = JSON.parse(localStorage.getItem('mn_guest') ?? '[]') as Array<{ token: string; code: string; at: string }>;
      localStorage.setItem('mn_guest', JSON.stringify([{ token: r.token, code: r.booking.code, at: new Date().toISOString() }, ...saved].slice(0, 10)));
      router.push(`/urgent/track?t=${encodeURIComponent(r.token)}`);
    } catch (e2) {
      setError(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  };

  if (!meta && !error) return <div className="app-shell"><Spinner /></div>;
  if (meta && meta.settings.URGENT_REQUESTS_ENABLED === 'false') {
    return <div className="app-shell"><div className="app-content"><div className="alert warn">الطلب العاجل غير متاح حالياً.</div><Link className="btn" href="/app">اطلب خدمة بحساب</Link></div></div>;
  }

  return (
    <div className="app-shell">
      <div className="app-header"><Link href="/"><img src="/logo.png" alt="MOBI-NURSE" /></Link><Link href="/urgent/track" className="small">متابعة طلب</Link></div>
      <form className="app-content" onSubmit={submit}>
        <h1>🚨 طلب تمريض عاجل</h1>
        <div className="alert danger">
          <strong>ليست بديلاً عن الإسعاف.</strong> في الحالات الحرجة (فقدان وعي، ضيق تنفس شديد، نزيف، ألم صدر) اتصل فوراً بالإسعاف{' '}
          <a href={`tel:${meta?.settings.EMERGENCY_NUMBER ?? '123'}`}><strong>{meta?.settings.EMERGENCY_NUMBER ?? '123'}</strong></a>
        </div>
        <p className="muted small">بدون تسجيل حساب — سنرسل الطلب لأقرب ممرض متاح.</p>
        <ErrorBox error={error} />
        <Card className="stack">
          <Field label="اسمك"><input value={form.name} onChange={set('name')} required minLength={3} maxLength={120} /></Field>
          <Field label="رقم الموبايل"><input value={form.phone} onChange={set('phone')} required inputMode="tel" placeholder="01xxxxxxxxx" /></Field>
          <Field label="اسم المريض (إن اختلف)"><input value={form.patientName} onChange={set('patientName')} maxLength={120} /></Field>
          <Field label="الخدمة المطلوبة">
            <select value={form.serviceId} onChange={set('serviceId')} required>
              <option value="">اختر الخدمة</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.nameAr} — {s.total} ج.م</option>)}
            </select>
          </Field>
          <Field label="وصف الحالة"><textarea value={form.description} onChange={set('description')} maxLength={1000} placeholder="اكتب باختصار حالة المريض وما المطلوب" /></Field>
        </Card>
        <Card className="stack">
          {meta && <GeoSelect governorates={meta.governorates} governorateId={form.governorateId} cityId={form.cityId} onlyActive
                              onChange={(v) => setForm({ ...form, ...v })} />}
          <LocationPicker value={loc} onChange={setLoc} />
          <Field label="العنوان بالتفصيل"><input value={form.address} onChange={set('address')} required minLength={3} maxLength={300} placeholder="الشارع، رقم العمارة، الدور، علامة مميزة" /></Field>
        </Card>
        {service && (
          <Card>
            <div className="kv"><span className="k">سعر الخدمة</span><span className="v"><Money v={service.price} /></span></div>
            {service.travelFee > 0 && <div className="kv"><span className="k">رسوم الانتقال</span><span className="v"><Money v={service.travelFee} /></span></div>}
            <div className="kv"><span className="k">الإجمالي (يُدفع بعد الخدمة)</span><span className="v total"><Money v={service.total} /></span></div>
          </Card>
        )}
        <button className="btn danger block lg" disabled={busy}>{busy ? 'جارٍ الإرسال...' : 'إرسال الطلب العاجل'}</button>
        <p className="small muted center">بإرسال الطلب أنت توافق على <Link href="/policies/terms">الشروط</Link> و<Link href="/policies/privacy">سياسة الخصوصية</Link>.</p>
      </form>
    </div>
  );
}
