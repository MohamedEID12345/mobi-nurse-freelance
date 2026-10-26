import { db } from '@/lib/db';
import { handler, must, ok } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { parseServiceForm } from '@/lib/service-form';

export const GET = handler(async (req) => {
  await requireAdmin(req, 'SERVICES_MANAGE');
  const rows = must(await db().from('services').select('*').is('deleted_at', null).order('sort_order').order('name_ar')) as Array<Record<string, unknown>>;
  return ok(rows.map((s) => ({ ...s, price: Number(s.price) })));
});

/** multipart/form-data: nameAr, nameEn, descriptionAr, descriptionEn, price, durationMinutes, sortOrder, isActive, image */
export const POST = handler(async (req) => {
  const admin = await requireAdmin(req, 'SERVICES_MANAGE');
  const values = await parseServiceForm(await req.formData(), false);
  const row = must(await db().from('services').insert(values).select('*').single()) as Record<string, unknown>;
  await audit(req, { actorType: 'ADMIN', actorId: admin.id, action: 'SERVICE_CREATED', targetType: 'SERVICE', targetId: String(row.id), newValue: { name: row.name_ar, price: row.price } });
  return ok(row, 201);
});
