'use client';
import { useState } from 'react';
import { api, errorMessage } from '@/client/api';
import { useApi } from '@/client/hooks';
import { prepareUpload } from '@/client/image';
import { ActionButton, ErrorBox, Field, Modal, Money, Spinner } from '@/components/ui';

interface S { id: string; name_ar: string; name_en: string; description_ar: string; description_en: string; price: number;
  duration_minutes: number | null; image_url: string | null; is_active: boolean; sort_order: number }
const EMPTY = { nameAr: '', nameEn: '', descriptionAr: '', descriptionEn: '', price: '', durationMinutes: '', sortOrder: '0', isActive: true };

export default function Services() {
  const { data, error, reload } = useApi<S[]>('/api/v1/admin/services');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<S | null>(null);
  const [f, setF] = useState(EMPTY);
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const start = (s?: S) => {
    setEditing(s ?? null); setImage(null); setRemoveImage(false); setErr(null);
    setF(s ? { nameAr: s.name_ar, nameEn: s.name_en, descriptionAr: s.description_ar, descriptionEn: s.description_en, price: String(s.price),
      durationMinutes: s.duration_minutes ? String(s.duration_minutes) : '', sortOrder: String(s.sort_order), isActive: s.is_active } : EMPTY);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr(null);
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, String(v)));
      if (image) fd.append('image', await prepareUpload(image));
      if (removeImage) fd.append('removeImage', 'true');
      await api(editing ? `/api/v1/admin/services/${editing.id}` : '/api/v1/admin/services', { method: editing ? 'PATCH' : 'POST', form: fd });
      setOpen(false); reload();
    } catch (e2) { setErr(errorMessage(e2)); } finally { setBusy(false); }
  };

  const toggle = async (s: S) => {
    const fd = new FormData(); fd.append('isActive', String(!s.is_active));
    await api(`/api/v1/admin/services/${s.id}`, { method: 'PATCH', form: fd }); reload();
  };

  return (
    <>
      <div className="admin-top"><h1>الخدمات والأسعار</h1><button className="btn" onClick={() => start()}>+ إضافة خدمة</button></div>
      <p className="muted small">الأسعار تُطبق على الطلبات الجديدة فقط. الحذف يخفي الخدمة ويحتفظ بسجل الطلبات السابقة.</p>
      <ErrorBox error={error} onRetry={reload} />
      {!data && !error && <Spinner />}
      <div className="grid-auto">
        {(data ?? []).map((s) => (
          <div key={s.id} className="card stack" style={{ opacity: s.is_active ? 1 : 0.55 }}>
            <div className="service-tile"><div className="img" style={s.image_url ? { backgroundImage: `url(${s.image_url})` } : undefined}>{s.image_url ? '' : '🩺'}</div></div>
            <strong>{s.name_ar}</strong>
            <span className="small muted">{s.description_ar}</span>
            <span className="total"><Money v={s.price} /></span>
            <span className={`badge ${s.is_active ? 'ok' : ''}`}>{s.is_active ? 'مفعّلة' : 'متوقفة'}</span>
            <div className="row">
              <button className="btn sm secondary" onClick={() => start(s)}>تعديل</button>
              <ActionButton className="sm ghost" onClick={() => toggle(s)}>{s.is_active ? 'إيقاف' : 'تفعيل'}</ActionButton>
              <ActionButton className="sm danger" confirm={`حذف خدمة "${s.name_ar}"؟`} onClick={async () => { await api(`/api/v1/admin/services/${s.id}`, { method: 'DELETE' }); reload(); }}>حذف</ActionButton>
            </div>
          </div>
        ))}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'تعديل خدمة' : 'خدمة جديدة'}>
        <form className="stack" onSubmit={save}>
          <ErrorBox error={err} />
          <div className="grid2">
            <Field label="الاسم بالعربية"><input value={f.nameAr} onChange={(e) => setF({ ...f, nameAr: e.target.value })} required minLength={2} /></Field>
            <Field label="الاسم بالإنجليزية"><input value={f.nameEn} onChange={(e) => setF({ ...f, nameEn: e.target.value })} dir="ltr" /></Field>
          </div>
          <Field label="الوصف بالعربية"><textarea value={f.descriptionAr} onChange={(e) => setF({ ...f, descriptionAr: e.target.value })} maxLength={1000} /></Field>
          <Field label="الوصف بالإنجليزية"><textarea value={f.descriptionEn} onChange={(e) => setF({ ...f, descriptionEn: e.target.value })} maxLength={1000} dir="ltr" /></Field>
          <div className="grid3">
            <Field label="السعر (ج.م)"><input type="number" min="1" step="0.01" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} required /></Field>
            <Field label="المدة (دقيقة)"><input type="number" min="1" value={f.durationMinutes} onChange={(e) => setF({ ...f, durationMinutes: e.target.value })} /></Field>
            <Field label="الترتيب"><input type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: e.target.value })} /></Field>
          </div>
          <Field label="صورة الخدمة" hint="JPG / PNG / WEBP">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
          </Field>
          {editing?.image_url && !image && <label className="check"><input type="checkbox" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} /> حذف الصورة الحالية</label>}
          <label className="check"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} /> الخدمة مفعّلة</label>
          <button className="btn block" disabled={busy}>{busy ? '...' : 'حفظ'}</button>
        </form>
      </Modal>
    </>
  );
}
