import { db } from '@/lib/db';
import { handler, must, ok } from '@/lib/http';
import { loadSettings, publicSettings } from '@/lib/settings';

/** Everything the apps need at start-up: governorates/cities and public settings. */
export const GET = handler(async () => {
  const [govs, cities, settings] = await Promise.all([
    db().from('governorates').select('id, code, name_ar, name_en, is_active, bookings_enabled, travel_fee').order('sort_order'),
    db().from('cities').select('id, governorate_id, name_ar, name_en').eq('is_active', true).order('sort_order'),
    loadSettings(),
  ]);
  const cityRows = must(cities) as Array<{ id: string; governorate_id: string; name_ar: string; name_en: string }>;
  const governorates = (must(govs) as Array<Record<string, unknown>>).map((g) => ({
    id: g.id, code: g.code, nameAr: g.name_ar, nameEn: g.name_en, active: g.is_active,
    bookingsEnabled: g.bookings_enabled, travelFee: Number(g.travel_fee),
    cities: cityRows.filter((c) => c.governorate_id === g.id).map((c) => ({ id: c.id, nameAr: c.name_ar, nameEn: c.name_en })),
  }));
  return ok({ governorates, settings: publicSettings(settings) });
});
