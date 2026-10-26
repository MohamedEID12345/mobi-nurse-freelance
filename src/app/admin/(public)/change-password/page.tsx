'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, errorMessage } from '@/client/api';
import { Card, ErrorBox, Field } from '@/components/ui';

export default function ChangePassword() {
  const router = useRouter();
  const [f, setF] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  return (
    <form className="stack" onSubmit={async (e) => {
      e.preventDefault(); setError(null);
      if (f.newPassword !== f.confirm) { setError('كلمتا المرور غير متطابقتين'); return; }
      try {
        await api('/api/v1/admin/auth/change-password', { body: { currentPassword: f.currentPassword, newPassword: f.newPassword } });
        router.replace('/admin');
      } catch (e2) { setError(errorMessage(e2)); }
    }}>
      <h1>تغيير كلمة المرور</h1>
      <div className="alert warn">لأمان الحساب يجب تغيير كلمة المرور المؤقتة قبل المتابعة.</div>
      <ErrorBox error={error} />
      <Card className="stack">
        <Field label="كلمة المرور الحالية"><input type="password" value={f.currentPassword} onChange={(e) => setF({ ...f, currentPassword: e.target.value })} required /></Field>
        <Field label="كلمة المرور الجديدة" hint="12 حرفاً على الأقل تحتوي على حروف وأرقام"><input type="password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} required minLength={12} /></Field>
        <Field label="تأكيد كلمة المرور"><input type="password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} required /></Field>
        <button className="btn block">حفظ ومتابعة</button>
      </Card>
    </form>
  );
}
