import { db } from '@/lib/db';
import { ApiError, handler, must, ok, parseBody } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { governorateSchema } from '@/lib/validators';

export const GET = handler(async (req) => {
  await requireAdmin(req, 'DASHBOARD_VIEW');
  const [govs, cities] = await Promise.all([
    db().from('governorates').select('*').order('sort_order'),
    db().from('cities').select('*').order('sort_order'),
  ]);
  const c = must(cities) as Array<Record<string, unknown>>;
  return ok((must(govs) as Array<Record<string, unknown>>).map((g) => ({
    id: g.id, code: g.code, nameAr: g.name_ar, nameEn: g.name_en, isActive: g.is_active, bookingsEnabled: g.bookings_enabled,
    travelFee: Number(g.travel_fee), sortOrder: g.sort_order, activatedAt: g.activated_at,
    cities: c.filter((x) => x.governorate_id === g.id).map((x) => ({ id: x.id, nameAr: x.name_ar, nameEn: x.name_en, isActive: x.is_active, sortOrder: x.sort_order })),
  })));
});

export const POST = handler(async (req) => {
  const admin = await requireAdmin(req, 'GOVERNORATES_MANAGE');
  const b = await parseBody(req, governorateSchema);
  if (!b.code) throw new ApiError('VALIDATION_FAILED', { code: 'required' });
  const row = must(await db().from('governorates').insert({
    code: b.code, name_ar: b.nameAr, name_en: b.nameEn, travel_fee: b.travelFee, sort_order: b.sortOrder ?? 100, is_active: false,
  }).select('*').single()) as Record<string, unknown>;
  await audit(req, { actorType: 'ADMIN', actorId: admin.id, action: 'GOVERNORATE_CREATED', targetType: 'GOVERNORATE', targetId: String(row.id), newValue: b });
  return ok(row, 201);
});
