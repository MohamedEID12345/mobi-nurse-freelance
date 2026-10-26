'use client';
import { useState } from 'react';
import { api, errorMessage } from '@/client/api';
import { useApi } from '@/client/hooks';
import { ActionButton, ErrorBox, Field, Modal, Money, Spinner } from '@/components/ui';

interface City { id: string; nameAr: string; nameEn: string; isActive: boolean; sortOrder: number }
interface Gov { id: string; code: string; nameAr: string; nameEn: string; isActive: boolean; bookingsEnabled: boolean; travelFee: number; sortOrder: number; cities: City[] }

export default function Governorates() {
  const { data, error, reload } = useApi<Gov[]>('/api/v1/admin/governorates');
  const [open, setOpen] = useState<Gov | null>(null);
  const [fee, setFee] = useState('0');
  const [city, setCity] = useState({ nameAr: '', nameEn: '' });
  const [err, setErr] = useState<string | null>(null);
  const [newGov, setNewGov] = useState(false);
  const [g, setG] = useState({ code: '', nameAr: '', nameEn: '', travelFee: '0' });

  const patch = async (id: string, body: object) => { await api(`/api/v1/admin/governorates/${id}`, { method: 'PATCH', body }); await reload(); };
  const current = open ? data?.find((x) => x.id === open.id) ?? open : null;

  return (
    <>
      <div className="admin-top"><h1>المحافظات</h1><button className="btn" onClick={() => { setNewGov(true); setErr(null); }}>+ محافظة</button></div>
      <div className="alert info small" style={{ marginBottom: '1rem' }}>تفعيل محافظة يظهر فوراً في التطبيق والموقع بدون أي تحديث. المحافظات لا تُحذف (إيقاف فقط) للحفاظ على السجلات.</div>
      <ErrorBox error={error} onRetry={reload} />
      {!data && !error && <Spinner />}
      <div className="table-wrap"><table>
        <thead><tr><th>المحافظة</th><th>الحالة</th><th>استقبال الطلبات</th><th>رسوم الانتقال</th><th>المدن</th><th></th></tr></thead>
        <tbody>{(data ?? []).map((x) => (
          <tr key={x.id}>
            <td><strong>{x.nameAr}</strong> <span className="small muted">{x.code}</span></td>
            <td>{x.isActive ? <span className="badge ok">مفعّلة</span> : <span className="badge">غير مفعّلة</span>}</td>
            <td>{x.bookingsEnabled ? '✅' : '⏸️'}</td>
            <td><Money v={x.travelFee} /></td>
            <td>{x.cities.filter((c) => c.isActive).length} / {x.cities.length}</td>
            <td className="row">
              <ActionButton className={`sm ${x.isActive ? 'danger' : 'ok'}`} confirm={x.isActive ? `إيقاف الخدمة في ${x.nameAr}؟` : `تفعيل الخدمة في ${x.nameAr}؟`}
                            onClick={() => patch(x.id, { isActive: !x.isActive })}>{x.isActive ? 'إيقاف' : 'تفعيل'}</ActionButton>
              <button className="btn sm secondary" onClick={() => { setOpen(x); setFee(String(x.travelFee)); setErr(null); }}>إدارة</button>
            </td>
          </tr>
        ))}</tbody>
      </table></div>

      <Modal open={Boolean(current)} onClose={() => setOpen(null)} title={current?.nameAr ?? ''}>
        {current && (
          <div className="stack">
            <ErrorBox error={err} />
            <div className="row">
              <Field label="رسوم الانتقال (ج.م)"><input type="number" min="0" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} /></Field>
              <ActionButton className="secondary" onClick={() => patch(current.id, { travelFee: Number(fee) })}>حفظ الرسوم</ActionButton>
            </div>
            <label className="check"><input type="checkbox" checked={current.bookingsEnabled} onChange={(e) => patch(current.id, { bookingsEnabled: e.target.checked })} /> استقبال طلبات جديدة (إيقاف مؤقت بدون إخفاء المحافظة)</label>
            <h3>المدن / المراكز</h3>
            {current.cities.map((c) => (
              <div key={c.id} className="list-item">
                <span>{c.nameAr} <span className="small muted">{c.nameEn}</span></span>
                <ActionButton className="sm ghost" onClick={async () => { await api(`/api/v1/admin/cities/${c.id}`, { method: 'PATCH', body: { nameAr: c.nameAr, nameEn: c.nameEn, isActive: !c.isActive } }); reload(); }}>
                  {c.isActive ? 'إيقاف' : 'تفعيل'}
                </ActionButton>
              </div>
            ))}
            <form className="row" onSubmit={async (e) => {
              e.preventDefault(); setErr(null);
              try { await api('/api/v1/admin/cities', { body: { governorateId: current.id, ...city } }); setCity({ nameAr: '', nameEn: '' }); reload(); }
              catch (e2) { setErr(errorMessage(e2)); }
            }}>
              <input placeholder="اسم المدينة بالعربية" value={city.nameAr} onChange={(e) => setCity({ ...city, nameAr: e.target.value })} required style={{ flex: 1 }} />
              <input placeholder="English name" value={city.nameEn} onChange={(e) => setCity({ ...city, nameEn: e.target.value })} required dir="ltr" style={{ flex: 1 }} />
              <button className="btn">إضافة</button>
            </form>
          </div>
        )}
      </Modal>

      <Modal open={newGov} onClose={() => setNewGov(false)} title="محافظة جديدة">
        <form className="stack" onSubmit={async (e) => {
          e.preventDefault(); setErr(null);
          try { await api('/api/v1/admin/governorates', { body: { ...g, travelFee: Number(g.travelFee) } }); setNewGov(false); reload(); }
          catch (e2) { setErr(errorMessage(e2)); }
        }}>
          <ErrorBox error={err} />
          <Field label="الكود (إنجليزي كبير)" hint="مثال: NEW_CAPITAL"><input value={g.code} onChange={(e) => setG({ ...g, code: e.target.value.toUpperCase() })} required dir="ltr" /></Field>
          <Field label="الاسم بالعربية"><input value={g.nameAr} onChange={(e) => setG({ ...g, nameAr: e.target.value })} required /></Field>
          <Field label="الاسم بالإنجليزية"><input value={g.nameEn} onChange={(e) => setG({ ...g, nameEn: e.target.value })} required dir="ltr" /></Field>
          <Field label="رسوم الانتقال"><input type="number" min="0" value={g.travelFee} onChange={(e) => setG({ ...g, travelFee: e.target.value })} /></Field>
          <button className="btn block">إضافة (غير مفعّلة)</button>
        </form>
      </Modal>
    </>
  );
}
