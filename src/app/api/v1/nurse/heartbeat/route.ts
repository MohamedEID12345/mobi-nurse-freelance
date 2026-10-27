import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { NURSE_ACTIVE } from '@/lib/bookings';
import { sha256 } from '@/lib/codes';
import { inEgypt } from '@/lib/shared/geo';

const schema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  offline: z.boolean().optional(),
});

/** Called by the Android background service every few minutes (header x-mn-heartbeat). No cookies. */
export async function POST(req: NextRequest) {
  const token = req.headers.get('x-mn-heartbeat') ?? '';
  if (token.length < 20 || token.length > 100) return NextResponse.json({ ok: false, code: 'TOKEN_INVALID' }, { status: 401 });
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, code: 'VALIDATION_FAILED' }, { status: 400 });
  }
  try {
    const { data: p } = await db().from('nurse_profiles')
      .select('user_id, is_online, verification_status, heartbeat_expires_at, app_users!inner(status)')
      .eq('heartbeat_token_hash', sha256(token)).maybeSingle();
    const userStatus = p ? (Array.isArray(p.app_users) ? p.app_users[0]?.status : (p.app_users as { status: string })?.status) : null;
    const valid = p && p.is_online && p.verification_status === 'APPROVED' && userStatus === 'ACTIVE'
      && p.heartbeat_expires_at && new Date(p.heartbeat_expires_at).getTime() > Date.now();
    if (!valid) return NextResponse.json({ ok: false, code: 'TOKEN_INVALID' }, { status: 401 });

    if (body.offline) {
      await db().from('nurse_profiles').update({ is_online: false, heartbeat_token_hash: null, heartbeat_expires_at: null }).eq('user_id', p.user_id);
      return NextResponse.json({ ok: true, online: false });
    }
    if (body.latitude === undefined || body.longitude === undefined || !inEgypt(body.latitude, body.longitude)) {
      return NextResponse.json({ ok: false, code: 'LOCATION_OUT_OF_RANGE' }, { status: 400 });
    }
    const now = new Date().toISOString();
    await db().from('nurse_profiles').update({ last_lat: body.latitude, last_lng: body.longitude, last_location_at: now }).eq('user_id', p.user_id);
    await db().from('bookings').update({ nurse_last_lat: body.latitude, nurse_last_lng: body.longitude, nurse_last_location_at: now })
      .eq('nurse_id', p.user_id).in('status', NURSE_ACTIVE.filter((s) => s === 'NURSE_ASSIGNED' || s === 'NURSE_ON_THE_WAY'));
    return NextResponse.json({ ok: true, online: true });
  } catch (e) {
    console.error('[heartbeat]', e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
