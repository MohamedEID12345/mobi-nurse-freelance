'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, errorMessage } from '@/client/api';
import { Card, ErrorBox, Field } from '@/components/ui';
import { Logo } from '@/components/Logo';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form className="stack" onSubmit={async (e) => {
      e.preventDefault(); setBusy(true); setError(null);
      try {
        const r = await api<{ admin: { mustChangePassword: boolean } }>('/api/v1/admin/auth/login', { body: { email, password } });
        router.replace(r.admin.mustChangePassword ? '/admin/change-password' : '/admin');
      } catch (e2) { setError(errorMessage(e2)); } finally { setBusy(false); }
    }}>
      <div className="center"><Logo width={220} /></div>
      <h1 className="center">MOBI-NURSE ADMIN</h1>
      <ErrorBox error={error} />
      <Card className="stack">
        <Field label="البريد الإلكتروني"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" autoComplete="username" /></Field>
        <Field label="كلمة المرور"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></Field>
        <button className="btn block" disabled={busy}>{busy ? '...' : 'دخول'}</button>
      </Card>
    </form>
  );
}
