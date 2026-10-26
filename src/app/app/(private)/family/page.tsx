'use client';
import { useState } from 'react';
import { api, errorMessage } from '@/client/api';
import { useApi } from '@/client/hooks';
import { ActionButton, Card, Empty, ErrorBox, Field, Modal, Spinner } from '@/components/ui';
import { RELATIONS } from '@/lib/shared/labels';

interface Member { id: string; name: string; relation: string; birthDate: string | null; gender: string | null; notes: string }
const EMPTY = { name: '', relation: 'الأب', birthDate: '', gender: '', notes: '' };

export default function Family() {
  const { data, error, loading, reload } = useApi<Member[]>('/api/v1/family');
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [err, setErr] = useState<string | null>(null);

  const start = (m?: Member) => {
    setEditing(m?.id ?? null);
    setF(m ? { name: m.name, relation: m.relation, birthDate: m.birthDate ?? '', gender: m.gender ?? '', notes: m.notes } : EMPTY);
    setErr(null); setOpen(true);
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = { name: f.name, relation: f.relation, birthDate: f.birthDate || null, gender: f.gender || null, notes: f.notes };
    try {
      await api(editing ? `/api/v1/family/${editing}` : '/api/v1/family', { method: editing ? 'PATCH' : 'POST', body });
      setOpen(false); reload();
    } catch (e2) { setErr(errorMessage(e2)); }
  };

  return (
    <>
      <div className="row between"><h1>أسرتي</h1><button className="btn sm" onClick={() => start()}>+ إضافة</button></div>
      <p className="muted small">أضف أفراد أسرتك لتطلب لهم الخدمة بسهولة.</p>
      <ErrorBox error={error} onRetry={reload} />
      {loading && <Spinner />}
      {data && data.length === 0 && <Empty>لم تتم إضافة أفراد بعد</Empty>}
      {(data ?? []).map((m) => (
        <Card key={m.id}>
          <div className="row between">
            <div><strong>{m.name}</strong><div className="small muted">{m.relation}{m.birthDate ? ` • ${m.birthDate}` : ''}</div></div>
            <div className="row">
              <button className="btn sm ghost" onClick={() => start(m)}>تعديل</button>
              <ActionButton className="sm danger" confirm="حذف هذا الفرد؟" onClick={async () => { await api(`/api/v1/family/${m.id}`, { method: 'DELETE' }); reload(); }}>حذف</ActionButton>
            </div>
          </div>
        </Card>
      ))}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'تعديل' : 'إضافة فرد'}>
        <form className="stack" onSubmit={save}>
          <ErrorBox error={err} />
          <Field label="الاسم"><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required minLength={2} /></Field>
          <Field label="صلة القرابة">
            <select value={f.relation} onChange={(e) => setF({ ...f, relation: e.target.value })}>{RELATIONS.map((r) => <option key={r}>{r}</option>)}</select>
          </Field>
          <div className="grid2">
            <Field label="تاريخ الميلاد"><input type="date" value={f.birthDate} onChange={(e) => setF({ ...f, birthDate: e.target.value })} /></Field>
            <Field label="النوع">
              <select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}>
                <option value="">—</option><option value="MALE">ذكر</option><option value="FEMALE">أنثى</option>
              </select>
            </Field>
          </div>
          <Field label="ملاحظات (اختياري)" hint="أي معلومة تهم الممرض فقط، مثل الحساسية من دواء"><textarea value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} maxLength={500} /></Field>
          <button className="btn block">حفظ</button>
        </form>
      </Modal>
    </>
  );
}
