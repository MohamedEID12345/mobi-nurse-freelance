import { cookies } from 'next/headers';
import type { Lang } from './shared/i18n';

/** Public-site language from the mn_lang cookie (Arabic by default). */
export async function getLang(): Promise<Lang> {
  try {
    const c = await cookies();
    return c.get('mn_lang')?.value === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}
