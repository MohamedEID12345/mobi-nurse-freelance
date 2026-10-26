import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { errors as joseErrors, jwtVerify, SignJWT } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { db } from './db';
import { env } from './env';
import { ApiError, clientIp, must } from './http';
import { can, Permission } from './shared/permissions';

export type SubjectKind = 'USER' | 'ADMIN';

const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_SECONDS: Record<SubjectKind, number> = { USER: 60 * 60 * 24 * 30, ADMIN: 60 * 60 * 12 };
const COOKIES: Record<SubjectKind, { access: string; refresh: string; refreshPath: string }> = {
  USER: { access: 'mn_at', refresh: 'mn_rt', refreshPath: '/api/v1/auth' },
  ADMIN: { access: 'mn_aat', refresh: 'mn_art', refreshPath: '/api/v1/admin/auth' },
};

export interface UserRow {
  id: string; phone: string; full_name: string; password_hash: string; role: 'CUSTOMER' | 'NURSE';
  status: string; governorate_id: string; city_id: string; address: string;
  latitude: number | null; longitude: number | null; fcm_token: string | null; created_at: string;
}

export interface AdminRow {
  id: string; email: string; full_name: string; password_hash: string; role: string;
  is_active: boolean; must_change_password: boolean; last_login_at: string | null; created_at: string;
}

// ------------------------------------------------------------------ passwords
export function validateUserPassword(pw: string) {
  if (pw.length < 8 || Buffer.byteLength(pw) > 72 || !/\p{L}/u.test(pw) || !/\d/.test(pw)) {
    throw new ApiError('WEAK_PASSWORD');
  }
}

export function validateAdminPassword(pw: string) {
  if (pw.length < 12 || Buffer.byteLength(pw) > 72 || !/\p{L}/u.test(pw) || !/\d/.test(pw)) {
    throw new ApiError('WEAK_ADMIN_PASSWORD');
  }
}

export function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

// Pre-computed hash to keep login timing constant when the account does not exist.
const DUMMY_HASH = bcrypt.hashSync('mobinurse-timing-equalizer', 10);

export async function verifyPassword(pw: string, hash: string | null | undefined): Promise<boolean> {
  const okHash = await bcrypt.compare(pw, hash ?? DUMMY_HASH);
  return Boolean(hash) && okHash;
}

// ------------------------------------------------------------------ rate limiting (DB-backed: works on serverless)
const WINDOW_MINUTES = 15;
const MAX_FAILURES = 8;

export async function assertNotRateLimited(req: NextRequest, accountKey: string) {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
  const checks: Array<[string, number]> = [[accountKey, MAX_FAILURES], [`ip:${clientIp(req)}`, MAX_FAILURES * 3]];
  for (const [key, limit] of checks) {
    const { count, error } = await db().from('auth_failures').select('id', { count: 'exact', head: true })
      .eq('key', key).gte('created_at', since);
    if (error) throw new ApiError('INTERNAL_ERROR', undefined, error.message);
    if ((count ?? 0) >= limit) throw new ApiError('TOO_MANY_ATTEMPTS');
  }
}

export async function recordAuthFailure(req: NextRequest, accountKey: string) {
  await db().from('auth_failures').insert([{ key: accountKey }, { key: `ip:${clientIp(req)}` }]);
}

// ------------------------------------------------------------------ tokens
function signingKey() {
  return new TextEncoder().encode(env.jwtSecret);
}

export async function signAccessToken(kind: SubjectKind, id: string, role: string): Promise<string> {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(id)
    .setIssuer('mobi-nurse')
    .setAudience(kind)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(signingKey());
}

async function verifyAccessToken(token: string, kind: SubjectKind): Promise<{ id: string; role: string }> {
  try {
    const { payload } = await jwtVerify(token, signingKey(), { issuer: 'mobi-nurse', audience: kind });
    if (!payload.sub) throw new ApiError('UNAUTHORIZED');
    return { id: payload.sub, role: String(payload.role ?? '') };
  } catch (e) {
    if (e instanceof joseErrors.JWTExpired) throw new ApiError('TOKEN_EXPIRED');
    if (e instanceof ApiError) throw e;
    throw new ApiError('UNAUTHORIZED');
  }
}

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex');
}

function readToken(req: NextRequest, kind: SubjectKind): string | null {
  const h = req.headers.get('authorization');
  if (h?.startsWith('Bearer ')) return h.slice(7).trim();
  return req.cookies.get(COOKIES[kind].access)?.value ?? null;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export async function createSession(kind: SubjectKind, id: string, role: string, familyId?: string): Promise<Session> {
  const accessToken = await signAccessToken(kind, id, role);
  const refreshToken = crypto.randomBytes(32).toString('base64url');
  must(await db().from('refresh_tokens').insert({
    subject_type: kind,
    subject_id: id,
    token_hash: sha256(refreshToken),
    family_id: familyId ?? crypto.randomUUID(),
    expires_at: new Date(Date.now() + REFRESH_TTL_SECONDS[kind] * 1000).toISOString(),
  }));
  return { accessToken, refreshToken, expiresIn: ACCESS_TTL_SECONDS };
}

export function setSessionCookies(res: NextResponse, kind: SubjectKind, s: Session) {
  const c = COOKIES[kind];
  const secure = env.isProduction;
  res.cookies.set(c.access, s.accessToken, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: ACCESS_TTL_SECONDS });
  res.cookies.set(c.refresh, s.refreshToken, { httpOnly: true, secure, sameSite: 'lax', path: c.refreshPath, maxAge: REFRESH_TTL_SECONDS[kind] });
}

export function clearSessionCookies(res: NextResponse, kind: SubjectKind) {
  const c = COOKIES[kind];
  res.cookies.set(c.access, '', { path: '/', maxAge: 0 });
  res.cookies.set(c.refresh, '', { path: c.refreshPath, maxAge: 0 });
}

export function readRefreshToken(req: NextRequest, kind: SubjectKind, bodyToken?: string | null): string | null {
  return bodyToken || req.cookies.get(COOKIES[kind].refresh)?.value || null;
}

/** Rotates a refresh token. Reusing an already-rotated token revokes the whole session family. */
export async function consumeRefreshToken(raw: string, kind: SubjectKind): Promise<{ subjectId: string; familyId: string }> {
  if (raw.length > 200) throw new ApiError('TOKEN_INVALID');
  const rows = must(await db().rpc('mn_consume_refresh_token', { p_hash: sha256(raw), p_type: kind })) as
    Array<{ result: string; subject_id: string; family_id: string }>;
  const r = rows?.[0];
  if (!r || r.result !== 'OK') throw new ApiError('TOKEN_INVALID');
  return { subjectId: r.subject_id, familyId: r.family_id };
}

export async function revokeRefreshToken(raw: string | null) {
  if (!raw || raw.length > 200) return;
  const { data } = await db().from('refresh_tokens').select('family_id').eq('token_hash', sha256(raw)).maybeSingle();
  if (data?.family_id) {
    await db().from('refresh_tokens').update({ revoked_at: new Date().toISOString() })
      .eq('family_id', data.family_id).is('revoked_at', null);
  }
}

export async function revokeAllSessions(kind: SubjectKind, subjectId: string) {
  await db().from('refresh_tokens').update({ revoked_at: new Date().toISOString() })
    .eq('subject_type', kind).eq('subject_id', subjectId).is('revoked_at', null);
}

// ------------------------------------------------------------------ guards
export async function requireUser(req: NextRequest, role?: 'CUSTOMER' | 'NURSE'): Promise<UserRow> {
  const token = readToken(req, 'USER');
  if (!token) throw new ApiError('UNAUTHORIZED');
  const p = await verifyAccessToken(token, 'USER');
  const user = must(await db().from('app_users').select('*').eq('id', p.id).maybeSingle()) as UserRow | null;
  if (!user) throw new ApiError('UNAUTHORIZED');
  if (user.status !== 'ACTIVE') throw new ApiError('ACCOUNT_SUSPENDED');
  if (role && user.role !== role) throw new ApiError('ACCESS_DENIED');
  return user;
}

export async function optionalUser(req: NextRequest): Promise<UserRow | null> {
  try {
    return await requireUser(req);
  } catch {
    return null;
  }
}

export async function requireAdmin(req: NextRequest, permission?: Permission,
                                   opts: { allowPasswordChange?: boolean } = {}): Promise<AdminRow> {
  const token = readToken(req, 'ADMIN');
  if (!token) throw new ApiError('UNAUTHORIZED');
  const p = await verifyAccessToken(token, 'ADMIN');
  const admin = must(await db().from('admin_users').select('*').eq('id', p.id).maybeSingle()) as AdminRow | null;
  if (!admin || !admin.is_active) throw new ApiError('UNAUTHORIZED');
  if (admin.must_change_password && !opts.allowPasswordChange) throw new ApiError('PASSWORD_CHANGE_REQUIRED');
  if (permission && !can(admin.role, permission)) throw new ApiError('ACCESS_DENIED');
  return admin;
}

export function publicUser(u: UserRow) {
  return {
    id: u.id, phone: u.phone, fullName: u.full_name, role: u.role, status: u.status,
    governorateId: u.governorate_id, cityId: u.city_id, address: u.address,
    latitude: u.latitude, longitude: u.longitude, createdAt: u.created_at,
  };
}

export function publicAdmin(a: AdminRow) {
  return {
    id: a.id, email: a.email, fullName: a.full_name, role: a.role, isActive: a.is_active,
    mustChangePassword: a.must_change_password, lastLoginAt: a.last_login_at, createdAt: a.created_at,
  };
}
