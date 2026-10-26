import { db } from '@/lib/db';
import { ApiError, handler, must, ok, parseBody } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { notify } from '@/lib/notify';
import { audit } from '@/lib/audit';
import { complaintUpdateSchema } from '@/lib/validators';
import { COMPLAINT_STATUS } from '@/lib/shared/labels';

export const PATCH = handler(async (req, { id }) => {
  const admin = await requireAdmin(req, 'COMPLAINTS_MANAGE');
  const b = await parseBody(req, complaintUpdateSchema);
  const before = must(await db().from('complaints').select('status, customer_id, code').eq('id', id).maybeSingle()) as
    { status: string; customer_id: string | null; code: string } | null;
  if (!before) throw new ApiError('NOT_FOUND');
  must(await db().from('complaints').update({
    status: b.status, admin_note: b.adminNote ?? null, handled_by: admin.id,
    resolved_at: ['RESOLVED', 'REJECTED'].includes(b.status) ? new Date().toISOString() : null,
  }).eq('id', id));
  await audit(req, { actorType: 'ADMIN', actorId: admin.id, action: 'COMPLAINT_UPDATED', targetType: 'COMPLAINT', targetId: id, oldValue: { status: before.status }, newValue: b });
  if (before.status !== b.status) {
    await notify([before.customer_id], { title: `تحديث الشكوى ${before.code}`, body: `حالة الشكوى: ${COMPLAINT_STATUS[b.status]}${b.adminNote ? ` — ${b.adminNote}` : ''}`, link: '/app/complaints' });
  }
  return ok();
});
