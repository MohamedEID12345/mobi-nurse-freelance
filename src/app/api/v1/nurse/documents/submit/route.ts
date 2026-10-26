import { db } from '@/lib/db';
import { ApiError, handler, must, ok } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { currentDocuments, DOCS_EDITABLE, getNurseProfile, missingRequiredDocs } from '@/lib/nurse';
import { loadSettings, num } from '@/lib/settings';
import { audit } from '@/lib/audit';

export const POST = handler(async (req) => {
  const user = await requireUser(req, 'NURSE');
  const p = await getNurseProfile(user.id);
  if (!DOCS_EDITABLE.includes(p.verification_status)) throw new ApiError('DOCUMENTS_LOCKED');
  const docs = await currentDocuments(user.id, false);
  if (missingRequiredDocs(docs.map((d) => d.type)).length) throw new ApiError('DOCUMENTS_INCOMPLETE');
  const fee = num(await loadSettings(), 'NURSE_REGISTRATION_FEE');
  const feePaid = Boolean(p.registration_fee_paid_at) || fee === 0;
  const next = feePaid ? 'PENDING_VERIFICATION' : 'DOCUMENTS_SUBMITTED';
  must(await db().from('nurse_profiles').update({
    verification_status: next, documents_submitted_at: new Date().toISOString(), rejection_reason: null,
  }).eq('user_id', user.id));
  await audit(req, { actorType: 'USER', actorId: user.id, action: 'NURSE_DOCUMENTS_SUBMITTED', targetType: 'NURSE', targetId: user.id, newValue: { status: next } });
  return ok({ verificationStatus: next });
});
