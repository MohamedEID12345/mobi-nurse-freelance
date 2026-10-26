import { db } from '@/lib/db';
import { ApiError, handler, must, ok, parseBody } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { citySchema } from '@/lib/validators';

export const POST = handler(async (req) => {
  const admin = await requireAdmin(req, 'GOVERNORATES_MANAGE');
  const b = await parseBody(req, citySchema);
  if (!b.governorateId) throw new ApiError('VALIDATION_FAILED', { governorateId: 'required' });
  const row = must(await db().from('cities').insert({
    governorate_id: b.governorateId, name_ar: b.nameAr, name_en: b.nameEn, is_active: b.isActive ?? true, sort_order: b.sortOrder ?? 100,
  }).select('*').single()) as Record<string, unknown>;
  await audit(req, { actorType: 'ADMIN', actorId: admin.id, action: 'CITY_CREATED', targetType: 'CITY', targetId: String(row.id), newValue: b });
  return ok(row, 201);
});
