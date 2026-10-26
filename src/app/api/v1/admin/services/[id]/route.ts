import { db } from '@/lib/db';
import { ApiError, handler, must, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { parseServiceForm } from '@/lib/service-form';
import { removeObject } from '@/lib/storage';

export const PATCH = handler(async (req, { id }) => {
  const admin = await requireAdmin(req, 'SERVICES_MANAGE');
  const before = must(await db().from('services').select('*').eq('id', id).is('deleted_at', null).maybeSingle()) as Record<string, unknown> | null;
  if (!before) throw new ApiError('SERVICE_NOT_FOUND');
  const values = await parseServiceForm(await req.formData(), true);
  const row = must(await db().from('services').update(values).eq('id', id).select('*').single()) as Record<string, unknown>;
  if ('image_path' in values && before.image_path && before.image_path !== values.image_path) {
    await removeObject('service-images', String(before.image_path));
  }
  await audit(req, {
    actorType: 'ADMIN', actorId: admin.id, action: Number(before.price) !== Number(row.price) ? 'SERVICE_PRICE_CHANGED' : 'SERVICE_UPDATED',
    targetType: 'SERVICE', targetId: id, oldValue: { name: before.name_ar, price: before.price, active: before.is_active },
    newValue: { name: row.name_ar, price: row.price, active: row.is_active },
  });
  return ok(row);
});

/** Soft delete: hidden everywhere, history (bookings) stays intact. */
export const DELETE = handler(async (req, { id }) => {
  const admin = await requireAdmin(req, 'SERVICES_MANAGE');
  must(await db().from('services').update({ deleted_at: new Date().toISOString(), is_active: false }).eq('id', id));
  await db().from('nurse_services').delete().eq('service_id', id);
  await audit(req, { actorType: 'ADMIN', actorId: admin.id, action: 'SERVICE_DELETED', targetType: 'SERVICE', targetId: id });
  return ok();
});
