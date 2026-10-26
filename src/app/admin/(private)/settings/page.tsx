'use client';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/client/api';
import { useApi } from '@/client/hooks';
import { ActionButton, Card, ErrorBox, Field, Spinner } from '@/components/ui';

interface Setting { key: string; value: string; type: string; label: string; min?: number; max?: number; isPublic: boolean }
interface Page { slug: string; title_ar: string; title_en: string; body_ar: string; body_en: string; is_published: boolean; updated_at: string }

function SettingRow({ s, onSaved }: { s: Setting; onSaved: () => void }) {
  const [v, setV] = useState(s.value);
  useEffect(() => setV(s.value), [s.value]);
  return (
    <div className="list-item">
      <div style={{ flex: 1 }}><strong>{s.label}</strong><div className="small muted">{s.key}{s.min !== undefined ? ` • ${s.min}–${s.max}` : ''}{s.isPublic ? ' • يظهر للمستخدمين' : ''}</div></div>
      {s.type === 'bool'
        ? <select value={v} onChange={(e) => setV(e.target.value)} style={{ width: 120 }}><option value="true">مفعّل</option><option value="false">متوقف</option></select>
        : <input value={v} onChange={(e) => setV(e.target.value)} style={{ width: 180 }} dir="ltr" />}
      <ActionButton className="sm" disabled={v === s.value} onClick={async () => { await api('/api/v1/admin/settings', { method: 'PATCH', body: { key: s.key, value: v } }); onSaved(); }}>حفظ</ActionButton>
    </div>
  );
}

function PageEditor({ p, onSaved }: { p: Page; onSaved: () => void }) {
  const [f, setF] = useState({ titleAr: p.title_ar, titleEn: p.title_en, bodyAr: p.body_ar, bodyEn: p.body_en, isPublished: p.is_published });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <Card className="stack">
      <div className="row between"><h3>{p.title_ar}</h3><a className="small" href={`/policies/${p.slug}`} target="_blank" rel="noreferrer">معاينة</a></div>
      {msg && <div className="alert ok small">{msg}</div>}
      <ErrorBox error={err} />
      <div className="grid2">
        <Field label="العنوان بالعربية"><input value={f.titleAr} onChange={(e) => setF({ ...f, titleAr: e.target.value })} /></Field>
        <Field label="Title (EN)"><input value={f.titleEn} onChange={(e) => setF({ ...f, titleEn: e.target.value })} dir="ltr" /></Field>
      </div>
      <Field label="المحتوى بالعربية" hint="## عنوان • - بند • **نص عريض**"><textarea style={{ minHeight: 240 }} value={f.bodyAr} onChange={(e) => setF({ ...f, bodyAr: e.target.value })} /></Field>
      <Field label="Content (EN)"><textarea style={{ minHeight: 160 }} value={f.bodyEn} onChange={(e) => setF({ ...f, bodyEn: e.target.value })} dir="ltr" /></Field>
      <label className="check"><input type="checkbox" checked={f.isPublished} onChange={(e) => setF({ ...f, isPublished: e.target.checked })} /> منشورة</label>
      <button className="btn" onClick={async () => {
        setErr(null); setMsg(null);
        try { await api(`/api/v1/admin/pages/${p.slug}`, { method: 'PUT', body: f }); setMsg('تم الحفظ'); onSaved(); } catch (e) { setErr(errorMessage(e)); }
      }}>حفظ الصفحة</button>
    </Card>
  );
}

export default function Settings() {
  const settings = useApi<Setting[]>('/api/v1/admin/settings');
  const pages = useApi<Page[]>('/api/v1/admin/pages');
  const [tab, setTab] = useState<'settings' | 'pages'>('settings');
  return (
    <>
      <div className="admin-top"><h1>الإعدادات والسياسات</h1></div>
      <div className="tabs">
        <button className={tab === 'settings' ? 'on' : ''} onClick={() => setTab('settings')}>إعدادات المنصة</button>
        <button className={tab === 'pages' ? 'on' : ''} onClick={() => setTab('pages')}>صفحات السياسات</button>
      </div>
      {tab === 'settings' && (
        <Card>
          <div className="alert warn small">تغيير العمولة أو الأسعار يُطبق على الطلبات الجديدة فقط؛ الطلبات القائمة تحتفظ بقيمها.</div>
          <ErrorBox error={settings.error} onRetry={settings.reload} />
          {!settings.data && <Spinner />}
          {(settings.data ?? []).map((s) => <SettingRow key={s.key} s={s} onSaved={settings.reload} />)}
        </Card>
      )}
      {tab === 'pages' && (
        <div className="stack">
          <ErrorBox error={pages.error} onRetry={pages.reload} />
          {!pages.data && <Spinner />}
          {(pages.data ?? []).map((p) => <PageEditor key={p.slug} p={p} onSaved={pages.reload} />)}
        </div>
      )}
    </>
  );
}
