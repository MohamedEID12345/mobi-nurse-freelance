import { db } from '@/lib/db';
import { ApiError, handler, must, ok } from '@/lib/http';
import { requireAdmin, revokeAllSessions } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { notify } from '@/lib/notify';
import { readJson } from '@/lib/booking-actions';

/** Suspend / reactivate a customer or nurse account. */
export const POST = handler(async (req, { id, action }) => {
  const target = must(await db().from('app_users').select('id, role, status').eq('id', id).maybeSingle()) as
    { id: string; role: string; status: string } | null;
  if (!target) throw new ApiError('NOT_FOUND');
  const admin = await requireAdmin(req, target.role === 'NURSE' ? 'NURSES_MANAGE' : 'CUSTOMERS_MANAGE');
  const reason = String((await readJson(req)).reason ?? '').trim().slice(0, 500);
  if (action === 'suspend') {
    if (!reason) throw new ApiError('VALIDATION_FAILED', { reason: 'required' });
    must(await db().from('app_users').update({ status: 'SUSPENDED', suspension_reason: reason }).eq('id', id));
    if (target.role === 'NURSE') await db().from('nurse_profiles').update({ is_online: false }).eq('user_id', id);
    await revokeAllSessions('USER', id);
  } else if (action === 'reactivate') {
    must(await db().from('app_users').update({ status: 'ACTIVE', suspension_reason: null }).eq('id', id));
    await notify([id], { title: 'تم تفعيل حسابك', body: 'تم إعادة تفعيل حسابك على MOBI-NURSE.' });
  } else {
    throw new ApiError('NOT_FOUND');
  }
  await audit(req, {
    actorType: 'ADMIN', actorId: admin.id, action: action === 'suspend' ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
    targetType: target.role, targetId: id, oldValue: { status: target.status }, newValue: { reason },
  });
  return ok();
});
