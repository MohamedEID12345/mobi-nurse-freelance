'use client';

export class ApiClientError extends Error {
  constructor(public code: string, message: string, public fields?: Record<string, string>, public status?: number) {
    super(message);
  }
}

type Kind = 'user' | 'admin';
const NO_REFRESH = ['/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/auth/logout', '/api/v1/auth/register',
  '/api/v1/admin/auth/login', '/api/v1/admin/auth/refresh', '/api/v1/admin/auth/logout'];
const refreshing: Partial<Record<Kind, Promise<boolean>>> = {};

async function refresh(kind: Kind): Promise<boolean> {
  const url = kind === 'admin' ? '/api/v1/admin/auth/refresh' : '/api/v1/auth/refresh';
  try {
    const r = await fetch(url, { method: 'POST', credentials: 'include', headers: { 'x-mn-client': 'web', 'content-type': 'application/json' }, body: '{}' });
    return r.ok;
  } catch {
    return false;
  }
}

function onUnauthorized(kind: Kind) {
  if (typeof window === 'undefined') return;
  const p = window.location.pathname;
  if (kind === 'admin') {
    if (!p.startsWith('/admin/login')) window.location.href = '/admin/login';
  } else if (!p.startsWith('/app/login') && !p.startsWith('/app/register')) {
    window.location.href = `/app/login?next=${encodeURIComponent(p + window.location.search)}`;
  }
}

export interface ApiOptions {
  method?: string;
  body?: unknown;
  form?: FormData;
  silent401?: boolean;
  retried?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function api<T = any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const kind: Kind = path.startsWith('/api/v1/admin') ? 'admin' : 'user';
  const headers: Record<string, string> = { 'x-mn-client': 'web' };
  let body: BodyInit | undefined;
  if (opts.form) body = opts.form;
  else if (opts.body !== undefined) {
    headers['content-type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  let res: Response;
  try {
    res = await fetch(path, { method: opts.method ?? (body ? 'POST' : 'GET'), headers, body, credentials: 'include', cache: 'no-store' });
  } catch {
    throw new ApiClientError('NETWORK', 'تعذر الاتصال بالخادم، تحقق من الإنترنت وحاول مرة أخرى');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let json: any = null;
  try { json = await res.json(); } catch { /* empty body */ }

  if (res.status === 401 && !opts.retried && !NO_REFRESH.some((p) => path.startsWith(p))) {
    refreshing[kind] ??= refresh(kind).finally(() => { delete refreshing[kind]; });
    if (await refreshing[kind]) return api<T>(path, { ...opts, retried: true });
    if (!opts.silent401) onUnauthorized(kind);
  }
  if (res.status === 403 && json?.code === 'PASSWORD_CHANGE_REQUIRED' && typeof window !== 'undefined'
      && !window.location.pathname.startsWith('/admin/change-password')) {
    window.location.href = '/admin/change-password';
  }
  if (!res.ok || !json?.success) {
    throw new ApiClientError(json?.code ?? 'HTTP_' + res.status, json?.message ?? 'حدث خطأ، حاول مرة أخرى', json?.errors, res.status);
  }
  return json.data as T;
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'حدث خطأ غير متوقع';
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
