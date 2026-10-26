import { db } from '@/lib/db';
import { handler, must, ok, parseBody } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { citySchema } from '@/lib/validators';

export const PATCH = handler(async (req, { id }) => {
  const admin = await requireAdmin(req, 'GOVERNORATES_MANAGE');
  const b = await parseBody(req, citySchema);
  const row = must(await db().from('cities').update({
    name_ar: b.nameAr, name_en: b.nameEn, ...(b.isActive !== undefined ? { is_active: b.isActive } : {}),
    ...(b.sortOrder !== undefined ? { sort_order: b.sortOrder } : {}),
  }).eq('id', id).select('*').single());
  await audit(req, { actorType: 'ADMIN', actorId: admin.id, action: 'CITY_UPDATED', targetType: 'CITY', targetId: id, newValue: b });
  return ok(row);
});
