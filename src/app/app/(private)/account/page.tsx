'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, errorMessage } from '@/client/api';
import { useSession } from '@/components/session';
import { ActionButton, Card, ErrorBox, Field } from '@/components/ui';
import { LocationPicker } from '@/components/LocationPicker';
import { Gov, GeoSelect } from '@/components/GeoSelect';
import { isAndroidApp, syncBackgroundOnline } from '@/client/native';

export default function Account() {
  const { me, reload } = useSession();
  const [govs, setGovs] = useState<Gov[]>([]);
  const [f, setF] = useState({ fullName: me.fullName, address: me.address, governorateId: me.governorateId, cityId: me.cityId });
  const [loc, setLoc] = useState<{ latitude: number; longitude: number } | null>(me.latitude != null && me.longitude != null ? { latitude: me.latitude, longitude: me.longitude } : null);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { api('/api/v1/meta').then((m) => setGovs(m.governorates)).catch(() => undefined); }, []);

  const saveProfile = async () => {
    setErr(null); setMsg(null);
    try {
      await api('/api/v1/me', { method: 'PATCH', body: { ...f, ...(loc ?? {}) } });
      await reload(); setMsg('تم حفظ البيانات');
    } catch (e) { setErr(errorMessage(e)); }
  };
  const changePassword = async () => {
    setErr(null); setMsg(null);
    try { await api('/api/v1/me/password', { body: pw }); setPw({ currentPassword: '', newPassword: '' }); setMsg('تم تغيير كلمة المرور'); }
    catch (e) { setErr(errorMessage(e)); }
  };

  return (
    <>
      <h1>حسابي</h1>
      <p className="muted"><span className="ltr">{me.phone}</span> • {me.role === 'NURSE' ? 'مقدم خدمة' : 'عميل'}</p>
      {msg && <div className="alert ok">{msg}</div>}
      <ErrorBox error={err} />
      <Card className="stack">
        <h3>البيانات الشخصية</h3>
        <Field label="الاسم"><input value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} /></Field>
        <GeoSelect governorates={govs} governorateId={f.governorateId} cityId={f.cityId} onlyActive={me.role === 'CUSTOMER'} onChange={(v) => setF({ ...f, ...v })} />
        <Field label="العنوان"><input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
        <LocationPicker value={loc} onChange={setLoc} auto={false} />
        <ActionButton className="block" onClick={saveProfile}>حفظ</ActionButton>
      </Card>
      <Card className="stack">
        <h3>تغيير كلمة المرور</h3>
        <Field label="كلمة المرور الحالية"><input type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
        <Field label="كلمة المرور الجديدة"><input type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
        <ActionButton className="block secondary" onClick={changePassword}>تغيير</ActionButton>
      </Card>
      <Card>
        {me.role === 'CUSTOMER' && <Link className="list-item" href="/app/complaints">📝 الشكاوى <span>‹</span></Link>}
        {me.role === 'NURSE' && <Link className="list-item" href="/app/nurse/documents">📄 مستنداتي <span>‹</span></Link>}
        <Link className="list-item" href="/app/payments">💳 المدفوعات <span>‹</span></Link>
        <Link className="list-item" href="/app/notifications">🔔 الإشعارات <span>‹</span></Link>
        <a className="list-item" href="https://wa.me/201062569857">💬 الدعم على واتساب <span>‹</span></a>
        <Link className="list-item" href="/policies/terms?embed=1">الشروط والأحكام <span>‹</span></Link>
        <Link className="list-item" href="/policies/privacy?embed=1">سياسة الخصوصية <span>‹</span></Link>
        {me.role === 'NURSE' && <Link className="list-item" href="/policies/nurse-terms?embed=1">شروط مقدمي الخدمة <span>‹</span></Link>}
        <Link className="list-item" href="/policies/payment?embed=1">سياسة الدفع <span>‹</span></Link>
        <Link className="list-item" href="/policies/cancellation?embed=1">سياسة الإلغاء <span>‹</span></Link>
        <Link className="list-item" href="/policies/healthcare-disclaimer?embed=1">إخلاء المسؤولية الطبية <span>‹</span></Link>
        <Link className="list-item" href="/policies/emergency?embed=1">تنبيه الحالات الطارئة <span>‹</span></Link>
      </Card>
      <ActionButton className="block danger" onClick={async () => {
        if (me.role === 'NURSE') {
          await api('/api/v1/nurse/status', { body: { online: false } }).catch(() => undefined);
          await syncBackgroundOnline(false);
        }
        await api('/api/v1/auth/logout', { body: {} });
        window.location.href = '/app/login';
      }}>تسجيل الخروج</ActionButton>
      <p className="small muted center">لحذف الحساب تواصل مع الدعم على واتساب.{isAndroidApp() ? ` • إصدار التطبيق ${window.MobiNurseNative?.getAppVersion()}` : ''}</p>
    </>
  );
}
