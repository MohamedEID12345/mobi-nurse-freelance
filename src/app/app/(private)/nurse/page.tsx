'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, errorMessage } from '@/client/api';
import { useApi } from '@/client/hooks';
import { getLocation } from '@/client/location';
import { isAndroidApp } from '@/client/native';
import { useSession } from '@/components/session';
import { ActionButton, Card, ErrorBox, KV, Money, Spinner, StatusBadge } from '@/components/ui';
import { DOC_TYPES, VERIFICATION_STATUS, dateTime } from '@/lib/shared/labels';

interface Profile {
  verificationStatus: string; rejectionReason: string | null; registrationFee: number; feePaid: boolean;
  documentsSubmitted: boolean; missingDocuments: string[]; isOnline: boolean; rating: number; ratingCount: number;
  completed: number; acceptanceRate: number | null;
}
interface Offer {
  bookingId: string; code: string; serviceName: string; patientName: string; description: string; isUrgent: boolean;
  scheduledAt: string | null; cityName?: string; distanceKm: number; total: number; nurseAmount: number; expiresAt: string;
}
interface Live { isOnline: boolean; offers: Offer[]; activeJobs: Array<{ id: string; code: string; status: string; serviceName: string; patientName: string; scheduledAt: string | null }> }

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.25, 0.5].forEach((t) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.25, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.2);
    });
  } catch { /* sound optional */ }
}

function Onboarding({ p, reload }: { p: Profile; reload: () => void }) {
  const docsDone = p.missingDocuments.length === 0;
  return (
    <>
      <h1>تفعيل حسابك</h1>
      <div className="alert info">الحالة: <strong>{VERIFICATION_STATUS[p.verificationStatus]}</strong></div>
      {p.rejectionReason && ['REJECTED', 'RESUBMISSION_REQUESTED'].includes(p.verificationStatus) && (
        <div className="alert danger">ملاحظة الإدارة: {p.rejectionReason}</div>
      )}
      <Card className="stack">
        <div className="row between"><h3>1) رسوم تفعيل الحساب</h3>{p.feePaid ? <span className="badge ok">تم ✅</span> : <span className="badge warn">مطلوب</span>}</div>
        {!p.feePaid && (
          <>
            <p className="small muted">رسوم إدارية لمرة واحدة للتحقق وتفعيل الحساب، منفصلة عن عمولة الخدمات.</p>
            <ActionButton className="block ok" onClick={async () => {
              const r = await api<{ url: string }>('/api/v1/nurse/registration-fee', { body: {} });
              window.location.href = r.url;
            }}>ادفع <Money v={p.registrationFee} /></ActionButton>
          </>
        )}
      </Card>
      <Card className="stack">
        <div className="row between"><h3>2) المستندات</h3>{p.documentsSubmitted ? <span className="badge ok">تم الإرسال ✅</span> : docsDone ? <span className="badge brand">جاهزة للإرسال</span> : <span className="badge warn">ناقصة</span>}</div>
        {!docsDone && <p className="small">المطلوب: {p.missingDocuments.map((d) => DOC_TYPES[d]).join('، ')}</p>}
        <Link className="btn block secondary" href="/app/nurse/documents">رفع / مراجعة المستندات</Link>
      </Card>
      <Card className="stack">
        <div className="row between"><h3>3) مراجعة الإدارة</h3>{p.verificationStatus === 'PENDING_VERIFICATION' ? <span className="badge warn pulse">قيد المراجعة</span> : <span className="badge">بانتظار الخطوات السابقة</span>}</div>
        <p className="small muted">نراجع البطاقة وترخيص المزاولة عادةً خلال 24–48 ساعة، وستصلك رسالة فور الاعتماد.</p>
        <a className="btn block whatsapp" href="https://wa.me/201062569857?text=%D8%A7%D8%B3%D8%AA%D9%81%D8%B3%D8%A7%D8%B1%20%D8%B9%D9%86%20%D8%AA%D9%81%D8%B9%D9%8A%D9%84%20%D8%AD%D8%B3%D8%A7%D8%A8%20%D9%85%D9%85%D8%B1%D8%B6">تواصل مع الإدارة</a>
        <button className="btn block ghost" onClick={reload}>تحديث الحالة</button>
      </Card>
    </>
  );
}

function Dashboard({ p }: { p: Profile }) {
  const { me } = useSession();
  const [live, setLive] = useState<Live | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const seen = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  const load = useCallback(async () => {
    try {
      const d = await api<Live>('/api/v1/nurse/offers');
      const fresh = d.offers.filter((o) => !seen.current.has(o.bookingId));
      if (fresh.length && initialized.current) beep();
      initialized.current = true;
      d.offers.forEach((o) => seen.current.add(o.bookingId));
      setLive(d); setError(null);
    } catch (e) { setError(errorMessage(e)); }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 6000);
    return () => clearInterval(t);
  }, [load]);

  // Location heartbeat while online (only while the app is open).
  useEffect(() => {
    if (!live?.isOnline) return;
    const send = () => getLocation(false).then((c) => api('/api/v1/nurse/location', { body: { latitude: c.latitude, longitude: c.longitude } })).catch(() => undefined);
    const t = setInterval(send, 60000);
    return () => clearInterval(t);
  }, [live?.isOnline]);

  const toggle = async () => {
    setToggling(true); setError(null);
    try {
      if (live?.isOnline) {
        await api('/api/v1/nurse/status', { body: { online: false } });
      } else {
        const c = await getLocation(true);
        await api('/api/v1/nurse/status', { body: { online: true, latitude: c.latitude, longitude: c.longitude } });
      }
      await load();
    } catch (e) { setError(errorMessage(e)); } finally { setToggling(false); }
  };

  if (!live && !error) return <Spinner />;
  return (
    <>
      <Card className={live?.isOnline ? 'brand' : ''}>
        <div className="row between">
          <div>
            <h2 style={{ margin: 0 }}>{live?.isOnline ? '🟢 متصل' : '⚪ غير متصل'}</h2>
            <p className="small muted" style={{ margin: 0 }}>{live?.isOnline ? 'تستقبل الطلبات القريبة منك الآن' : 'اتصل لتبدأ استقبال الطلبات'}</p>
          </div>
          <button className={`toggle ${live?.isOnline ? 'on' : ''}`} onClick={toggle} disabled={toggling} aria-label="تبديل الاتصال" />
        </div>
      </Card>
      {!me.governorateActive && <div className="alert warn">الخدمة غير مفعّلة في محافظتك بعد، ولا يمكن الاتصال حالياً.</div>}
      <ErrorBox error={error} onRetry={load} />
      {live?.isOnline && !isAndroidApp() && <div className="alert info small">اترك هذه الصفحة مفتوحة لاستقبال الطلبات، أو استخدم تطبيق الأندرويد لتصلك الإشعارات.</div>}

      {(live?.activeJobs ?? []).map((j) => (
        <Link key={j.id} href={`/app/nurse/jobs/${j.id}`} className="card card-link">
          <div className="row between"><strong>مهمة جارية: {j.serviceName}</strong><StatusBadge status={j.status} /></div>
          <p className="small muted">{j.patientName} • {j.code}{j.scheduledAt ? ` • ${dateTime(j.scheduledAt)}` : ''}</p>
          <span className="btn sm">فتح المهمة</span>
        </Link>
      ))}

      {live?.isOnline && (
        <>
          <h2>الطلبات الجديدة {live.offers.length ? `(${live.offers.length})` : ''}</h2>
          {live.offers.length === 0 && <div className="empty pulse">في انتظار طلبات قريبة منك...</div>}
          {live.offers.map((o) => (
            <div key={o.bookingId} className={`card offer ${o.isUrgent ? 'urgent' : ''} stack`}>
              <div className="row between">
                <strong>{o.isUrgent ? '🚨 ' : ''}{o.serviceName}</strong>
                <span className="badge brand">{o.distanceKm.toFixed(1)} كم</span>
              </div>
              <KV k="المنطقة" v={o.cityName ?? '—'} />
              <KV k="الموعد" v={o.scheduledAt ? dateTime(o.scheduledAt) : 'الآن'} />
              {o.description && <p className="small">{o.description}</p>}
              <KV k="السعر" v={<Money v={o.total} />} />
              <KV k="ربحك" v={<span className="total"><Money v={o.nurseAmount} /></span>} />
              <p className="small muted">ينتهي العرض {new Date(o.expiresAt).toLocaleTimeString('ar-EG')}</p>
              <div className="grid2">
                <ActionButton className="ok lg" onClick={async () => {
                  await api(`/api/v1/bookings/${o.bookingId}/accept`, { body: {} });
                  window.location.href = `/app/nurse/jobs/${o.bookingId}`;
                }}>قبول</ActionButton>
                <ActionButton className="ghost lg" onClick={async () => { await api(`/api/v1/bookings/${o.bookingId}/reject`, { body: {} }); await load(); }}>رفض</ActionButton>
              </div>
            </div>
          ))}
        </>
      )}

      <div className="grid3">
        <div className="card center"><div className="total">{p.rating ? p.rating.toFixed(1) : '—'} ★</div><div className="small muted">{p.ratingCount} تقييم</div></div>
        <div className="card center"><div className="total">{p.completed}</div><div className="small muted">خدمة مكتملة</div></div>
        <div className="card center"><div className="total">{p.acceptanceRate ?? '—'}{p.acceptanceRate != null ? '%' : ''}</div><div className="small muted">نسبة القبول</div></div>
      </div>
      <div className="grid2">
        <Link className="btn secondary" href="/app/nurse/wallet">💰 المحفظة</Link>
        <Link className="btn secondary" href="/app/nurse/jobs">📋 سجل المهام</Link>
      </div>
    </>
  );
}

export default function NurseHome() {
  const { me } = useSession();
  const profile = useApi<Profile>(me.role === 'NURSE' ? '/api/v1/nurse/profile' : null);
  if (me.role !== 'NURSE') return <div className="alert warn">هذه الصفحة لمقدمي الخدمة فقط. <Link href="/app">الرئيسية</Link></div>;
  if (profile.error && !profile.data) return <ErrorBox error={profile.error} onRetry={profile.reload} />;
  if (!profile.data) return <Spinner />;
  return profile.data.verificationStatus === 'APPROVED'
    ? <Dashboard p={profile.data} />
    : <Onboarding p={profile.data} reload={profile.reload} />;
}
