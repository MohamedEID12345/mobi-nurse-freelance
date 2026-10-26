'use client';
import { useState } from 'react';
import { api, errorMessage } from '@/client/api';
import { useApi } from '@/client/hooks';
import { Table, useAdmin } from '@/components/admin';
import { ActionButton, ErrorBox, Field, Modal } from '@/components/ui';
import { ADMIN_ROLES, dateTime } from '@/lib/shared/labels';

interface A { id: string; email: string; fullName: string; role: string; isActive: boolean; mustChangePassword: boolean; lastLoginAt: string | null }

export default function Admins() {
  const me = useAdmin();
  const { data, error, reload } = useApi<A[]>('/api/v1/admin/admins');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ email: '', fullName: '', role: 'SUPPORT_ADMIN', temporaryPassword: '' });
  const [err, setErr] = useState<string | null>(null);
  const update = async (id: string, body: object) => { await api(`/api/v1/admin/admins/${id}`, { method: 'PATCH', body }); reload(); };
  return (
    <>
      <div className="admin-top"><h1>المشرفون</h1><button className="btn" onClick={() => { setOpen(true); setErr(null); }}>+ مشرف</button></div>
      <ErrorBox error={error} onRetry={reload} />
      <Table rows={data ?? []} columns={[
        { label: 'الاسم', render: (a) => a.fullName },
        { label: 'البريد', render: (a) => <span className="ltr">{a.email}</span> },
        { label: 'الدور', render: (a) => a.id === me.id ? ADMIN_ROLES[a.role] : (
          <select value={a.role} onChange={(e) => update(a.id, { role: e.target.value })} style={{ minHeight: 34 }}>
            {Object.entries(ADMIN_ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>) },
        { label: 'الحالة', render: (a) => (a.isActive ? <span className="badge ok">نشط</span> : <span className="badge danger">موقوف</span>) },
        { label: 'آخر دخول', render: (a) => dateTime(a.lastLoginAt) },
        { label: '', render: (a) => a.id === me.id ? <span className="small muted">أنت</span> : (
          <div className="row">
            <ActionButton className="sm ghost" onClick={() => update(a.id, { isActive: !a.isActive })}>{a.isActive ? 'إيقاف' : 'تفعيل'}</ActionButton>
            <ActionButton className="sm secondary" onClick={async () => {
              const p = window.prompt('كلمة مرور مؤقتة جديدة (12 حرفاً على الأقل بها حروف وأرقام)');
              if (p) await update(a.id, { temporaryPassword: p });
            }}>إعادة تعيين كلمة المرور</ActionButton>
          </div>) },
      ]} />
      <Modal open={open} onClose={() => setOpen(false)} title="مشرف جديد">
        <form className="stack" onSubmit={async (e) => {
          e.preventDefault(); setErr(null);
          try { await api('/api/v1/admin/admins', { body: f }); setOpen(false); reload(); } catch (e2) { setErr(errorMessage(e2)); }
        }}>
          <ErrorBox error={err} />
          <Field label="الاسم"><input value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} required /></Field>
          <Field label="البريد الإلكتروني"><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required dir="ltr" /></Field>
          <Field label="الدور"><select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{Object.entries(ADMIN_ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <Field label="كلمة مرور مؤقتة" hint="سيُطلب تغييرها عند أول دخول"><input value={f.temporaryPassword} onChange={(e) => setF({ ...f, temporaryPassword: e.target.value })} required minLength={12} /></Field>
          <button className="btn block">إنشاء</button>
        </form>
      </Modal>
    </>
  );
}
