'use client';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/client/api';
import { useApi } from '@/client/hooks';
import { ActionButton, Card, ErrorBox, Field, Spinner, Stars } from '@/components/ui';
import { QUALIFICATIONS, VERIFICATION_STATUS, dateTime } from '@/lib/shared/labels';

interface Profile {
  verificationStatus: string; photoUrl: string | null; qualification: string; yearsExperience: number; bio: string;
  rating: number; ratingCount: number; completed: number; acceptanceRate: number | null; completionRate: number | null;
  services: Array<{ id: string; name: string }>; reviews: Array<{ rating: number; comment: string; createdAt: string }>;
}

export default function NurseProfilePage() {
  const p = useApi<Profile>('/api/v1/nurse/profile');
  const all = useApi<Array<{ id: string; nameAr: string }>>('/api/v1/services');
  const [sel, setSel] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [years, setYears] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (p.data) { setSel(p.data.services.map((s) => s.id)); setBio(p.data.bio); setYears(p.data.yearsExperience); }
  }, [p.data]);

  if (!p.data) return p.error ? <ErrorBox error={p.error} onRetry={p.reload} /> : <Spinner />;
  const d = p.data;
  return (
    <>
      <Card className="center stack">
        {d.photoUrl ? <img className="avatar" style={{ width: 90, height: 90, margin: '0 auto' }} src={d.photoUrl} alt="" /> : <span className="avatar" style={{ margin: '0 auto' }}>👩‍⚕️</span>}
        <div><Stars value={Math.round(d.rating)} /> <strong>{d.rating ? d.rating.toFixed(1) : 'جديد'}</strong> <span className="muted small">({d.ratingCount} تقييم)</span></div>
        <div className="small muted">{QUALIFICATIONS[d.qualification]} • {VERIFICATION_STATUS[d.verificationStatus]}</div>
      </Card>
      <div className="grid3">
        <div className="card center"><div className="total">{d.completed}</div><div className="small muted">خدمة مكتملة</div></div>
        <div className="card center"><div className="total">{d.acceptanceRate ?? '—'}{d.acceptanceRate != null ? '%' : ''}</div><div className="small muted">القبول</div></div>
        <div className="card center"><div className="total">{d.completionRate ?? '—'}{d.completionRate != null ? '%' : ''}</div><div className="small muted">الإكمال</div></div>
      </div>
      <Card className="stack">
        <h3>بياناتي المهنية</h3>
        {msg && <div className="alert ok">{msg}</div>}
        <ErrorBox error={err} />
        <Field label="سنوات الخبرة"><input type="number" min={0} max={60} value={years} onChange={(e) => setYears(Number(e.target.value))} /></Field>
        <Field label="نبذة"><textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={500} /></Field>
        <Field label="الخدمات التي أقدمها">
          <div>{(all.data ?? []).map((s) => (
            <label key={s.id} className="check"><input type="checkbox" checked={sel.includes(s.id)}
              onChange={(e) => setSel(e.target.checked ? [...sel, s.id] : sel.filter((x) => x !== s.id))} />{s.nameAr}</label>
          ))}</div>
        </Field>
        <ActionButton className="block" disabled={sel.length === 0} onClick={async () => {
          setErr(null); setMsg(null);
          try { await api('/api/v1/nurse/profile', { method: 'PATCH', body: { bio, yearsExperience: years, serviceIds: sel } }); setMsg('تم الحفظ'); p.reload(); }
          catch (e) { setErr(errorMessage(e)); }
        }}>حفظ</ActionButton>
      </Card>
      <Card>
        <h3>آخر التقييمات</h3>
        {d.reviews.length === 0 && <p className="muted small">لا توجد تقييمات بعد</p>}
        {d.reviews.map((r, i) => (
          <div key={i} className="list-item"><div><Stars value={r.rating} size={16} />{r.comment && <div className="small">{r.comment}</div>}</div><span className="small muted">{dateTime(r.createdAt)}</span></div>
        ))}
      </Card>
    </>
  );
}
