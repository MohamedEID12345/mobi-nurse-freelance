'use client';
import { ReactNode, useState } from 'react';
import { BOOKING_STATUS, money } from '@/lib/shared/labels';

export function Spinner() { return <div className="spinner" aria-label="جارٍ التحميل" />; }

export function ErrorBox({ error, onRetry }: { error: string | null; onRetry?: () => void }) {
  if (!error) return null;
  return (
    <div className="alert danger row between">
      <span>{error}</span>
      {onRetry && <button className="btn sm ghost" onClick={onRetry}>إعادة المحاولة</button>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) { return <div className="empty">{children}</div>; }

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function KV({ k, v }: { k: ReactNode; v: ReactNode }) {
  return <div className="kv"><span className="k">{k}</span><span className="v">{v}</span></div>;
}

export function Money({ v }: { v: number | string | null | undefined }) { return <>{money(v)}</>; }

const STATUS_TONE: Record<string, string> = {
  SEARCHING: 'warn', NURSE_ASSIGNED: 'brand', NURSE_ON_THE_WAY: 'brand', NURSE_ARRIVED: 'brand', SERVICE_STARTED: 'brand',
  SERVICE_COMPLETED: 'brand', WAITING_FOR_PAYMENT: 'warn', PAID: 'ok', CANCELLED: 'danger', DISPUTED: 'danger',
  APPROVED: 'ok', PENDING_VERIFICATION: 'warn', REJECTED: 'danger', RESUBMISSION_REQUESTED: 'danger', SUSPENDED: 'danger',
  ACTIVE: 'ok', SUCCESS: 'ok', FAILED: 'danger', PENDING: 'warn', PROCESSING: 'brand', OPEN: 'warn', RESOLVED: 'ok',
};

export function Badge({ tone, children }: { tone?: string; children: ReactNode }) {
  return <span className={`badge ${tone ?? ''}`}>{children}</span>;
}

export function StatusBadge({ status, labels = BOOKING_STATUS }: { status: string; labels?: Record<string, string> }) {
  return <Badge tone={STATUS_TONE[status]}>{labels[status] ?? status}</Badge>;
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <span className="hint">{hint}</span>}
      {error && <span className="err">{error}</span>}
    </div>
  );
}

export function Stars({ value, onChange, size }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <span className="stars" style={size ? { fontSize: size } : undefined}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" className={i <= value ? 'on' : ''} onClick={() => onChange?.(i)} disabled={!onChange}
                style={size ? { fontSize: size } : undefined} aria-label={`${i}`}>★</button>
      ))}
    </span>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="row between" style={{ marginBottom: '.75rem' }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button className="btn sm ghost" onClick={onClose}>إغلاق</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Button that runs an async action, shows progress and reports errors. */
export function ActionButton({ onClick, children, className = '', confirm, disabled }: {
  onClick: () => Promise<unknown>; children: ReactNode; className?: string; confirm?: string; disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <button className={`btn ${className}`} disabled={busy || disabled} onClick={async () => {
        if (confirm && !window.confirm(confirm)) return;
        setBusy(true); setErr(null);
        try { await onClick(); } catch (e) { setErr(e instanceof Error ? e.message : 'حدث خطأ'); } finally { setBusy(false); }
      }}>{busy ? '...' : children}</button>
      {err && <div className="alert danger small">{err}</div>}
    </>
  );
}

/** Very small, safe markdown renderer for policy pages (headings, lists, bold). */
export function Markdown({ text }: { text: string }) {
  const lines = text.split('\n');
  const out: ReactNode[] = [];
  let list: string[] = [];
  const flush = () => {
    if (list.length) out.push(<ul key={`u${out.length}`}>{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>);
    list = [];
  };
  lines.forEach((raw, i) => {
    const l = raw.trim();
    if (l.startsWith('- ')) { list.push(l.slice(2)); return; }
    flush();
    if (!l) return;
    if (l.startsWith('## ')) out.push(<h2 key={i}>{inline(l.slice(3))}</h2>);
    else if (l.startsWith('# ')) out.push(<h1 key={i}>{inline(l.slice(2))}</h1>);
    else out.push(<p key={i}>{inline(l)}</p>);
  });
  flush();
  return <>{out}</>;
}

function inline(s: string): ReactNode {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => (p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>));
}
