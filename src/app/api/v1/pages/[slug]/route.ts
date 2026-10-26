import { db } from '@/lib/db';
import { ApiError, handler, must, ok } from '@/lib/http';

export const GET = handler(async (_req, { slug }) => {
  const page = must(await db().from('content_pages').select('slug, title_ar, title_en, body_ar, body_en, updated_at')
    .eq('slug', slug).eq('is_published', true).maybeSingle()) as Record<string, string> | null;
  if (!page) throw new ApiError('NOT_FOUND');
  return ok({ slug: page.slug, titleAr: page.title_ar, titleEn: page.title_en, bodyAr: page.body_ar, bodyEn: page.body_en, updatedAt: page.updated_at });
});
