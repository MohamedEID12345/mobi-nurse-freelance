import { db } from '@/lib/db';
import { ApiError, handler, must, ok, parseBody } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { governorateUpdateSchema } from '@/lib/validators';

/** Activating a governorate needs no new app build: apps read availability at runtime. Never deleted. */
export const PATCH = handler(async (req, { id }) => {
  const admin = await requireAdmin(req, 'GOVERNORATES_MANAGE');
  const b = await parseBody(req, governorateUpdateSchema);
  const before = must(await db().from('governorates').select('*').eq('id', id).maybeSingle()) as Record<string, unknown> | null;
  if (!before) throw new ApiError('GOVERNORATE_NOT_FOUND');
  const patch: Record<string, unknown> = {};
  if (b.nameAr) patch.name_ar = b.nameAr;
  if (b.nameEn) patch.name_en = b.nameEn;
  if (b.travelFee !== undefined) patch.travel_fee = b.travelFee;
  if (b.sortOrder !== undefined) patch.sort_order = b.sortOrder;
  if (b.bookingsEnabled !== undefined) patch.bookings_enabled = b.bookingsEnabled;
  if (b.isActive !== undefined && b.isActive !== before.is_active) {
    if (b.isActive) {
      const { count } = await db().from('cities').select('id', { count: 'exact', head: true }).eq('governorate_id', id).eq('is_active', true);
      if (!count) throw new ApiError('GOVERNORATE_HAS_NO_CITIES');
      patch.activated_at = new Date().toISOString();
    } else {
      // Nobody stays online in a deactivated governorate.
      const { data: nurses } = await db().from('app_users').select('id').eq('governorate_id', id).eq('role', 'NURSE');
      const ids = (nurses ?? []).map((n: { id: string }) => n.id);
      if (ids.length) await db().from('nurse_profiles').update({ is_online: false }).in('user_id', ids);
    }
    patch.is_active = b.isActive;
  }
  const row = must(await db().from('governorates').update(patch).eq('id', id).select('*').single()) as Record<string, unknown>;
  const action = b.isActive === true && !before.is_active ? 'GOVERNORATE_ACTIVATED'
    : b.isActive === false && before.is_active ? 'GOVERNORATE_DEACTIVATED' : 'GOVERNORATE_UPDATED';
  await audit(req, { actorType: 'ADMIN', actorId: admin.id, action, targetType: 'GOVERNORATE', targetId: id,
    oldValue: { active: before.is_active, travelFee: before.travel_fee }, newValue: patch });
  return ok(row);
});
