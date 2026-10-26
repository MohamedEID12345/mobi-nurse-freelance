import { db } from '@/lib/db';
import { ApiError, handler, must, ok, parseBody } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { pageUpdateSchema } from '@/lib/validators';

export const PUT = handler(async (req, { slug }) => {
  const admin = await requireAdmin(req, 'SETTINGS_MANAGE');
  const b = await parseBody(req, pageUpdateSchema);
  if (b.isPublished && !b.bodyAr.trim()) throw new ApiError('PAGE_BODY_REQUIRED');
  const row = must(await db().from('content_pages').update({
    title_ar: b.titleAr, title_en: b.titleEn, body_ar: b.bodyAr, body_en: b.bodyEn, is_published: b.isPublished,
    updated_at: new Date().toISOString(), updated_by: admin.id,
  }).eq('slug', slug).select('slug').maybeSingle());
  if (!row) throw new ApiError('NOT_FOUND');
  await audit(req, { actorType: 'ADMIN', actorId: admin.id, action: 'PAGE_UPDATED', targetType: 'PAGE', targetId: slug, newValue: { published: b.isPublished, length: b.bodyAr.length } });
  return ok();
});
