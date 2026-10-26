'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, errorMessage } from '@/client/api';
import { Card, ErrorBox, Field } from '@/components/ui';
import { LocationPicker } from '@/components/LocationPicker';
import { Gov, GeoSelect } from '@/components/GeoSelect';
import { QUALIFICATIONS } from '@/lib/shared/labels';

function RegisterForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [type, setType] = useState<'CUSTOMER' | 'NURSE'>(sp.get('type') === 'nurse' ? 'NURSE' : 'CUSTOMER');
  const [govs, setGovs] = useState<Gov[]>([]);
  const [services, setServices] = useState<Array<{ id: string; nameAr: string }>>([]);
  const [f, setF] = useState({ fullName: '', phone: '', password: '', password2: '', governorateId: '', cityId: '', address: '',
    dateOfBirth: '', qualification: 'NURSING_DIPLOMA', yearsExperience: '0', bio: '' });
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [loc, setLoc] = useState<{ latitude: number; longitude: number } | null>(null);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/api/v1/meta').then((m) => {
      setGovs(m.governorates);
      const active = (m.governorates as Gov[]).filter((g) => g.active);
      if (active.length === 1) setF((x) => ({ ...x, governorateId: active[0].id }));
    }).catch((e) => setError(errorMessage(e)));
    api('/api/v1/services').then(setServices).catch(() => undefined);
  }, []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (f.password !== f.password2) { setError('كلمتا المرور غير متطابقتين'); return; }
    if (!loc) { setError('برجاء تحديد الموقع'); return; }
    if (type === 'NURSE' && serviceIds.length === 0) { setError('اختر خدمة واحدة على الأقل تقدمها'); return; }
    setBusy(true);
    try {
      const base = { fullName: f.fullName, phone: f.phone, password: f.password, governorateId: f.governorateId, cityId: f.cityId,
        address: f.address, latitude: loc.latitude, longitude: loc.longitude };
      if (type === 'CUSTOMER') {
        await api('/api/v1/auth/register/customer', { body: base });
        router.replace('/app');
      } else {
        await api('/api/v1/auth/register/nurse', { body: { ...base, dateOfBirth: f.dateOfBirth, qualification: f.qualification,
          yearsExperience: Number(f.yearsExperience), serviceIds, bio: f.bio } });
        router.replace('/app/nurse');
      }
    } catch (e2) {
      setError(errorMessage(e2));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="app-content" onSubmit={submit}>
      <h1>حساب جديد</h1>
      <div className="choice">
        <label className={type === 'CUSTOMER' ? 'on' : ''} onClick={() => setType('CUSTOMER')}>🏠 عميل<br /><span className="small muted">أطلب خدمة تمريض</span></label>
        <label className={type === 'NURSE' ? 'on' : ''} onClick={() => setType('NURSE')}>👩‍⚕️ ممرض/ة<br /><span className="small muted">أقدم الخدمة</span></label>
      </div>
      <ErrorBox error={error} />
      <Card className="stack">
        <Field label="الاسم بالكامل"><input value={f.fullName} onChange={set('fullName')} required minLength={3} maxLength={120} autoComplete="name" /></Field>
        <Field label="رقم الموبايل"><input value={f.phone} onChange={set('phone')} required inputMode="tel" placeholder="01xxxxxxxxx" autoComplete="tel" /></Field>
        <div className="grid2">
          <Field label="كلمة المرور" hint="8 أحرف على الأقل بها حروف وأرقام"><input type="password" value={f.password} onChange={set('password')} required minLength={8} maxLength={72} autoComplete="new-password" /></Field>
          <Field label="تأكيد كلمة المرور"><input type="password" value={f.password2} onChange={set('password2')} required autoComplete="new-password" /></Field>
        </div>
      </Card>
      <Card className="stack">
        <GeoSelect governorates={govs} governorateId={f.governorateId} cityId={f.cityId} onlyActive={type === 'CUSTOMER'}
                   onChange={(v) => setF({ ...f, ...v })} />
        {type === 'NURSE' && <span className="hint small">يمكن للممرضين التسجيل من أي محافظة، ويبدأ استقبال الطلبات عند تفعيل الخدمة بها.</span>}
        <Field label="العنوان بالتفصيل"><input value={f.address} onChange={set('address')} required minLength={3} maxLength={300} /></Field>
        <LocationPicker value={loc} onChange={setLoc} />
      </Card>
      {type === 'NURSE' && (
        <Card className="stack">
          <h3>بيانات مقدم الخدمة</h3>
          <div className="grid2">
            <Field label="تاريخ الميلاد"><input type="date" value={f.dateOfBirth} onChange={set('dateOfBirth')} required /></Field>
            <Field label="سنوات الخبرة"><input type="number" min={0} max={60} value={f.yearsExperience} onChange={set('yearsExperience')} required /></Field>
          </div>
          <Field label="المؤهل">
            <select value={f.qualification} onChange={set('qualification')}>
              {Object.entries(QUALIFICATIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="الخدمات التي تقدمها">
            <div>
              {services.map((s) => (
                <label key={s.id} className="check">
                  <input type="checkbox" checked={serviceIds.includes(s.id)}
                         onChange={(e) => setServiceIds(e.target.checked ? [...serviceIds, s.id] : serviceIds.filter((x) => x !== s.id))} />
                  {s.nameAr}
                </label>
              ))}
            </div>
          </Field>
          <Field label="نبذة عنك (اختياري)"><textarea value={f.bio} onChange={set('bio')} maxLength={500} /></Field>
          <div className="alert info small">بعد التسجيل: سداد رسوم التفعيل ورفع البطاقة وترخيص المزاولة، ثم مراجعة الإدارة.</div>
        </Card>
      )}
      <label className="check small">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
        <span>أوافق على <Link href="/policies/terms" target="_blank">الشروط والأحكام</Link> و<Link href="/policies/privacy" target="_blank">سياسة الخصوصية</Link>
          {type === 'NURSE' && <> و<Link href="/policies/nurse-terms" target="_blank">شروط مقدمي الخدمة</Link></>}</span>
      </label>
      <button className="btn block lg" disabled={busy || !agree}>{busy ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}</button>
      <Link className="btn block ghost" href="/app/login">لدي حساب بالفعل</Link>
    </form>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>;
}
