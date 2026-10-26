import { db } from './db';

/** Data shared by public pages (support number + services for the footer). Never throws. */
export async function siteChromeData(lang: 'ar' | 'en') {
  try {
    const [{ data: wa }, { data: svc }] = await Promise.all([
      db().from('settings').select('value').eq('key', 'SUPPORT_WHATSAPP').maybeSingle(),
      db().from('services').select('id, name_ar, name_en').eq('is_active', true).is('deleted_at', null).order('sort_order').limit(6),
    ]);
    return {
      whatsapp: (wa?.value as string) || '201062569857',
      services: (svc ?? []).map((s: { id: string; name_ar: string; name_en: string }) => ({ id: s.id, name: lang === 'en' && s.name_en ? s.name_en : s.name_ar })),
    };
  } catch {
    return { whatsapp: '201062569857', services: [] };
  }
}
