'use client';
import { useEffect, useState } from 'react';
import { getLocation } from '@/client/location';
import { mapsLink } from '@/lib/shared/geo';

/** Auto-detects GPS (no in-app map): shows a Google Maps link so the user can verify the point. */
export function LocationPicker({ value, onChange, auto = true }: {
  value: { latitude: number; longitude: number } | null;
  onChange: (v: { latitude: number; longitude: number }) => void;
  auto?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const detect = async () => {
    setBusy(true); setErr(null);
    try {
      const c = await getLocation(true);
      setAccuracy(Math.round(c.accuracy));
      onChange({ latitude: c.latitude, longitude: c.longitude });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'تعذر تحديد الموقع');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (auto && !value) detect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="field">
      <label>📍 الموقع</label>
      {value ? (
        <div className="alert ok small">
          تم تحديد موقعك{accuracy ? ` (دقة ~${accuracy} م)` : ''} —{' '}
          <a href={mapsLink(value.latitude, value.longitude)} target="_blank" rel="noreferrer">تأكد منه على خرائط جوجل</a>
        </div>
      ) : (
        <div className="alert warn small">لم يتم تحديد الموقع بعد</div>
      )}
      <button type="button" className="btn secondary" onClick={detect} disabled={busy}>
        {busy ? 'جارٍ تحديد الموقع...' : value ? 'إعادة تحديد موقعي الحالي' : 'حدّد موقعي تلقائياً'}
      </button>
      {err && <span className="err">{err}</span>}
      <span className="hint">تأكد أنك في مكان المريض عند تحديد الموقع، أو اكتب العنوان بالتفصيل.</span>
    </div>
  );
}
