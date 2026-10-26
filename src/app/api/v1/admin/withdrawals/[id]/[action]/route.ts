import { ApiError, handler, must, ok, parseBody } from '@/lib/http';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { notify } from '@/lib/notify';
import { audit } from '@/lib/audit';
import { withdrawalActionSchema } from '@/lib/validators';
import { money } from '@/lib/shared/labels';

const ACTIONS: Record<string, string> = { approve: 'APPROVE', processing: 'PROCESSING', 'mark-paid': 'MARK_PAID', reject: 'REJECT' };

export const POST = handler(async (req, { id, action }) => {
  const admin = await requireAdmin(req, 'WITHDRAWALS_MANAGE');
  const op = ACTIONS[action];
  if (!op) throw new ApiError('NOT_FOUND');
  const b = await parseBody(req, withdrawalActionSchema);
  if (op === 'REJECT' && !b.note) throw new ApiError('VALIDATION_FAILED', { note: 'required' });
  const w = must(await db().rpc('mn_update_withdrawal', {
    p_id: id, p_action: op, p_admin: admin.id, p_note: b.note ?? null, p_reference: b.reference ?? null,
  })) as { id: string; nurse_id: string; amount: string; status: string };
  await audit(req, { actorType: 'ADMIN', actorId: admin.id, action: `WITHDRAWAL_${op}`, targetType: 'WITHDRAWAL', targetId: id, newValue: { status: w.status, note: b.note, reference: b.reference } });
  const msgs: Record<string, [string, string]> = {
    APPROVE: ['تمت الموافقة على طلب السحب', `طلب سحب ${money(w.amount)} قيد التحويل.`],
    PROCESSING: ['جارٍ تحويل المبلغ', `جارٍ تحويل ${money(w.amount)} إلى حسابك.`],
    MARK_PAID: ['تم التحويل ✅', `تم تحويل ${money(w.amount)} إلى حسابك${b.reference ? ` (مرجع: ${b.reference})` : ''}.`],
    REJECT: ['تم رفض طلب السحب', `تمت إعادة ${money(w.amount)} لمحفظتك. السبب: ${b.note ?? ''}`],
  };
  await notify([w.nurse_id], { title: msgs[op][0], body: msgs[op][1], link: '/app/nurse/wallet' });
  return ok({ status: w.status });
});
