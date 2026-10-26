import { db } from '@/lib/db';
import { handler, must, ok, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { loadSettings, num } from '@/lib/settings';
import { withdrawalSchema } from '@/lib/validators';
import { audit } from '@/lib/audit';

export const POST = handler(async (req) => {
  const user = await requireUser(req, 'NURSE');
  const b = await parseBody(req, withdrawalSchema);
  const amount = Math.round(b.amount * 100) / 100;
  const min = num(await loadSettings(), 'MIN_WITHDRAWAL_AMOUNT');
  const w = must(await db().rpc('mn_request_withdrawal', {
    p_nurse: user.id, p_amount: amount, p_method: b.method, p_account: b.receivingAccount, p_min: min,
  })) as { id: string };
  await audit(req, { actorType: 'USER', actorId: user.id, action: 'WITHDRAWAL_REQUESTED', targetType: 'WITHDRAWAL', targetId: w.id, newValue: { amount, method: b.method } });
  return ok({ id: w.id }, 201);
});
