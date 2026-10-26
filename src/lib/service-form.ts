import crypto from 'node:crypto';
import { ApiError } from './http';
import { putObject, publicObjectUrl, readUpload } from './storage';

/** Parses the multipart service form (admin). */
export async function parseServiceForm(form: FormData, partial: boolean) {
  const str = (k: string) => (form.get(k) === null ? undefined : String(form.get(k)).trim());
  const out: Record<string, unknown> = {};
  const nameAr = str('nameAr');
  if (nameAr !== undefined || !partial) {
    if (!nameAr || nameAr.length < 2 || nameAr.length > 120) throw new ApiError('VALIDATION_FAILED', { nameAr: 'required' });
    out.name_ar = nameAr;
  }
  const map: Array<[string, string, number]> = [['nameEn', 'name_en', 120], ['descriptionAr', 'description_ar', 1000], ['descriptionEn', 'description_en', 1000]];
  for (const [k, col, max] of map) {
    const v = str(k);
    if (v !== undefined) {
      if (v.length > max) throw new ApiError('VALIDATION_FAILED', { [k]: 'too long' });
      out[col] = v;
    }
  }
  const price = str('price');
  if (price !== undefined || !partial) {
    const n = Number(price);
    if (!Number.isFinite(n) || n <= 0 || n > 1_000_000 || Math.round(n * 100) !== n * 100) throw new ApiError('VALIDATION_FAILED', { price: 'invalid' });
    out.price = n;
  }
  const duration = str('durationMinutes');
  if (duration !== undefined) out.duration_minutes = duration === '' ? null : Math.max(1, Math.round(Number(duration)) || 1);
  const sort = str('sortOrder');
  if (sort !== undefined && sort !== '') out.sort_order = Math.round(Number(sort)) || 0;
  const active = str('isActive');
  if (active !== undefined) out.is_active = active === 'true';

  const image = form.get('image');
  if (image && typeof image === 'object' && 'size' in image && (image as File).size > 0) {
    const f = await readUpload(image, false);
    const path = `services/${crypto.randomUUID()}.${f.ext}`;
    await putObject('service-images', path, f.bytes, f.mime);
    out.image_path = path;
    out.image_url = publicObjectUrl('service-images', path);
  } else if (str('removeImage') === 'true') {
    out.image_path = null;
    out.image_url = null;
  }
  return out;
}
