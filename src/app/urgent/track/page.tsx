'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api, errorMessage } from '@/client/api';
import { BookingTracker, CustomerBooking } from '@/components/BookingTracker';
import { ErrorBox, Spinner } from '@/components/ui';
import { Logo } from '@/components/Logo';

function Tracker() {
  const sp = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [b, setB] = useState<CustomerBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Array<{ token: string; code: string; at: string }>>([]);

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem('mn_guest') ?? '[]');
    setSaved(list);
    setToken(sp.get('t') ?? list[0]?.token ?? null);
  }, [sp]);

  const load = useCallback(async () => {
    if (!token) return;
    try { setB(await api(`/api/v1/guest/bookings/${encodeURIComponent(token)}`)); setError(null); } catch (e) { setError(errorMessage(e)); }
  }, [token]);

  useEffect(() => {
    load();
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(); }, 8000);
    return () => clearInterval(t);
  }, [load]);

  if (!token) return <div className="app-content"><div className="empty">لا يوجد طلب عاجل محفوظ على هذا الجهاز.</div><Link className="btn" href="/urgent">طلب جديد</Link></div>;
  return (
    <div className="app-content">
      <ErrorBox error={error} onRetry={load} />
      {!b && !error && <Spinner />}
      {b && <BookingTracker b={b} onAction={async (action, body) => {
        const r = await api(`/api/v1/guest/bookings/${encodeURIComponent(token)}/${action}`, { body: body ?? {} });
        if (action !== 'pay') await load();
        return r;
      }} />}
      {saved.length > 1 && (
        <div className="card">
          <h3>طلباتك العاجلة السابقة</h3>
          {saved.map((s) => <a key={s.token} className="list-item" href={`/urgent/track?t=${encodeURIComponent(s.token)}`}>{s.code}<span className="small muted">{new Date(s.at).toLocaleDateString('ar-EG')}</span></a>)}
        </div>
      )}
      <a className="btn whatsapp block" href="https://wa.me/201062569857">الدعم على واتساب</a>
    </div>
  );
}

export default function TrackPage() {
  return (
    <div className="app-shell">
      <div className="app-header"><Link href="/"><Logo height={34} /></Link><Link href="/urgent" className="small">طلب جديد</Link></div>
      <Suspense fallback={<Spinner />}><Tracker /></Suspense>
    </div>
  );
}
