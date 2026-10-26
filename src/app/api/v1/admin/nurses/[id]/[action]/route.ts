import { db } from '@/lib/db';
import { ApiError, handler, must, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { getNurseProfile } from '@/lib/nurse';
import { loadSettings, num } from '@/lib/settings';
import { notify } from '@/lib/notify';
import { audit } from '@/lib/audit';
import { readJson } from '@/lib/booking-actions';

export const POST = handler(async (req, { id, action }) => {
  const admin = await requireAdmin(req, action === 'force-offline' ? 'NURSES_MANAGE' : 'NURSES_VERIFY');
  const p = await getNurseProfile(id);
  const body = await readJson(req);
  const reason = String(body.reason ?? '').trim().slice(0, 500);
  let patch: Record<string, unknown>;
  let message: { title: string; body: string } | null = null;

  switch (action) {
    case 'approve': {
      if (p.verification_status !== 'PENDING_VERIFICATION') throw new ApiError('INVALID_STATUS_TRANSITION');
      const fee = num(await loadSettings(), 'NURSE_REGISTRATION_FEE');
      if (!p.registration_fee_paid_at && fee > 0) throw new ApiError('INVALID_STATUS_TRANSITION');
      patch = { verification_status: 'APPROVED', approved_at: new Date().toISOString(), approved_by: admin.id, rejection_reason: null };
      message = { title: 'تم اعتماد حسابك 🎉', body: 'مرحباً بك في MOBI-NURSE! يمكنك الآن الاتصال واستقبال الطلبات.' };
      break;
    }
    case 'reject': {
      if (!reason) throw new ApiError('VALIDATION_FAILED', { reason: 'required' });
      patch = { verification_status: 'REJECTED', rejection_reason: reason, is_online: false };
      message = { title: 'لم يتم اعتماد الحساب', body: `السبب: ${reason}. يمكنك تعديل المستندات وإعادة الإرسال.` };
      break;
    }
    case 'request-resubmission': {
      if (!reason) throw new ApiError('VALIDATION_FAILED', { reason: 'required' });
      patch = { verification_status: 'RESUBMISSION_REQUESTED', rejection_reason: reason, documents_submitted_at: null, is_online: false };
      message = { title: 'مطلوب إعادة رفع مستندات', body: `برجاء إعادة رفع المستندات: ${reason}` };
      break;
    }
    case 'force-offline':
      patch = { is_online: false };
      break;
    default:
      throw new ApiError('NOT_FOUND');
  }
  must(await db().from('nurse_profiles').update(patch).eq('user_id', id));
  await audit(req, {
    actorType: 'ADMIN', actorId: admin.id, action: `NURSE_${action.toUpperCase().replace(/-/g, '_')}`, targetType: 'NURSE', targetId: id,
    oldValue: { status: p.verification_status }, newValue: { ...patch, reason },
  });
  if (message) await notify([id], { ...message, link: '/app/nurse' });
  return ok();
});
