import { ApiError, handler, ok } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { getNurseProfile } from '@/lib/nurse';
import { loadSettings, num } from '@/lib/settings';
import { startPayment } from '@/lib/payments';

/** Starts the one-time account activation fee payment (Kashier). */
export const POST = handler(async (req) => {
  const user = await requireUser(req, 'NURSE');
  const p = await getNurseProfile(user.id);
  const fee = num(await loadSettings(), 'NURSE_REGISTRATION_FEE');
  if (p.registration_fee_paid_at || fee === 0) throw new ApiError('FEE_ALREADY_PAID');
  return ok(await startPayment({ purpose: 'REGISTRATION_FEE', nurseId: user.id, payerType: 'NURSE', payerUserId: user.id, amount: fee }));
});
