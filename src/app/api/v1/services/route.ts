import { db } from '@/lib/db';
import { handler, must, ok, query } from '@/lib/http';

export const GET = handler(async (req) => {
  const governorateId = query(req, 'governorateId');
  const rows = must(await db().from('services').select('id, name_ar, name_en, description_ar, description_en, price, duration_minutes, image_url')
    .eq('is_active', true).is('deleted_at', null).order('sort_order').order('name_ar')) as Array<Record<string, unknown>>;
  let travelFee = 0;
  if (governorateId) {
    const { data } = await db().from('governorates').select('travel_fee').eq('id', governorateId).maybeSingle();
    travelFee = Number(data?.travel_fee ?? 0);
  }
  return ok((rows ?? []).map((s) => ({
    id: s.id, nameAr: s.name_ar, nameEn: s.name_en, descriptionAr: s.description_ar, descriptionEn: s.description_en,
    price: Number(s.price), durationMinutes: s.duration_minutes, imageUrl: s.image_url,
    travelFee, total: Number(s.price) + travelFee,
  })));
});
