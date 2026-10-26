import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError, ZodTypeAny } from 'zod';

export const ERRORS = {
  VALIDATION_FAILED: [400, 'البيانات المدخلة غير صحيحة'],
  NOT_FOUND: [404, 'العنصر المطلوب غير موجود'],
  DATA_CONFLICT: [409, 'البيانات تتعارض مع بيانات موجودة'],
  TOO_MANY_ATTEMPTS: [429, 'محاولات كثيرة، حاول مرة أخرى بعد 15 دقيقة'],
  INTERNAL_ERROR: [500, 'حدث خطأ غير متوقع، حاول مرة أخرى'],
  CONFIG_MISSING: [503, 'الخدمة غير مهيأة بالكامل بعد، برجاء التواصل مع الدعم'],
  CSRF_REJECTED: [403, 'طلب غير مسموح'],
  UNAUTHORIZED: [401, 'يجب تسجيل الدخول أولاً'],
  TOKEN_EXPIRED: [401, 'انتهت الجلسة'],
  TOKEN_INVALID: [401, 'انتهت الجلسة، سجّل الدخول مرة أخرى'],
  INVALID_CREDENTIALS: [401, 'رقم الموبايل أو كلمة المرور غير صحيحة'],
  ADMIN_INVALID_CREDENTIALS: [401, 'البريد الإلكتروني أو كلمة المرور غير صحيحة'],
  CURRENT_PASSWORD_INCORRECT: [400, 'كلمة المرور الحالية غير صحيحة'],
  WEAK_PASSWORD: [400, 'كلمة المرور يجب ألا تقل عن 8 أحرف وتحتوي على حروف وأرقام'],
  WEAK_ADMIN_PASSWORD: [400, 'كلمة مرور المشرف يجب ألا تقل عن 12 حرفاً وتحتوي على حروف وأرقام'],
  PASSWORD_CHANGE_REQUIRED: [403, 'يجب تغيير كلمة المرور قبل المتابعة'],
  ACCESS_DENIED: [403, 'غير مسموح لك بتنفيذ هذا الإجراء'],
  ACCOUNT_SUSPENDED: [403, 'الحساب موقوف، برجاء التواصل مع الدعم'],
  INVALID_PHONE: [400, 'رقم الموبايل غير صحيح، أدخل رقماً مصرياً من 11 رقم'],
  PHONE_ALREADY_REGISTERED: [409, 'رقم الموبايل مسجل بالفعل'],
  UNDERAGE: [400, 'يجب ألا يقل السن عن 21 سنة'],
  LOCATION_REQUIRED: [400, 'برجاء تحديد الموقع'],
  LOCATION_OUT_OF_RANGE: [400, 'الموقع المحدد خارج مصر'],
  GOVERNORATE_NOT_FOUND: [404, 'المحافظة غير موجودة'],
  GOVERNORATE_NOT_ACTIVE: [422, 'الخدمة غير متاحة في هذه المحافظة حالياً'],
  GOVERNORATE_HAS_NO_CITIES: [422, 'أضف مدينة مفعّلة واحدة على الأقل قبل تفعيل المحافظة'],
  CITY_NOT_IN_GOVERNORATE: [400, 'المدينة لا تتبع المحافظة المختارة'],
  SERVICE_NOT_FOUND: [404, 'الخدمة غير موجودة أو غير متاحة'],
  FAMILY_MEMBER_NOT_FOUND: [404, 'فرد الأسرة غير موجود'],
  BOOKING_NOT_FOUND: [404, 'الطلب غير موجود'],
  BOOKING_ALREADY_ASSIGNED: [409, 'تم قبول هذا الطلب من ممرض آخر'],
  OFFER_NOT_AVAILABLE: [409, 'هذا الطلب لم يعد متاحاً'],
  OFFER_EXPIRED: [409, 'انتهت مهلة قبول هذا الطلب'],
  NURSE_NOT_AVAILABLE: [409, 'يجب أن تكون متصلاً ومعتمداً لقبول الطلبات'],
  NURSE_BUSY: [409, 'لديك طلب آخر جارٍ في نفس الوقت'],
  NURSE_NOT_APPROVED: [403, 'حسابك لم يتم اعتماده بعد'],
  INVALID_STATUS_TRANSITION: [409, 'لا يمكن تنفيذ هذا الإجراء في حالة الطلب الحالية'],
  SCHEDULE_INVALID: [400, 'الموعد يجب أن يكون بعد 30 دقيقة على الأقل وخلال 30 يوماً'],
  URGENT_DISABLED: [403, 'الطلب العاجل غير متاح حالياً'],
  ALREADY_REVIEWED: [409, 'تم تقييم هذا الطلب من قبل'],
  NOT_PAYABLE: [409, 'الطلب غير متاح للدفع الآن'],
  PAYMENT_UNAVAILABLE: [503, 'بوابة الدفع غير مهيأة حالياً'],
  FEE_ALREADY_PAID: [409, 'تم سداد رسوم التفعيل بالفعل'],
  DOCUMENTS_INCOMPLETE: [400, 'برجاء رفع جميع المستندات المطلوبة'],
  DOCUMENTS_LOCKED: [409, 'لا يمكن تعديل المستندات أثناء المراجعة أو بعد الاعتماد'],
  FILE_INVALID: [400, 'الملف غير مدعوم: صورة JPG/PNG/WEBP أو PDF بحد أقصى 4 ميجا'],
  INSUFFICIENT_BALANCE: [409, 'الرصيد المتاح غير كافٍ'],
  WITHDRAWAL_BELOW_MINIMUM: [400, 'المبلغ أقل من الحد الأدنى للسحب'],
  WITHDRAWAL_NOT_FOUND: [404, 'طلب السحب غير موجود'],
  ADMIN_EMAIL_EXISTS: [409, 'البريد الإلكتروني مستخدم بالفعل'],
  CANNOT_MODIFY_SELF: [422, 'لا يمكنك تعديل صلاحيات أو حالة حسابك'],
  LAST_SUPER_ADMIN: [422, 'لا يمكن إيقاف آخر مدير عام'],
  SETTING_INVALID_VALUE: [400, 'قيمة الإعداد غير صحيحة'],
  PAGE_BODY_REQUIRED: [422, 'لا يمكن نشر صفحة بدون محتوى'],
} as const satisfies Record<string, readonly [number, string]>;

export type ErrorCode = keyof typeof ERRORS;

export class ApiError extends Error {
  constructor(public code: ErrorCode, public fields?: Record<string, string>, public detail?: string) {
    super(detail ? `${code}: ${detail}` : code);
  }
}

export class ConfigError extends Error {
  constructor(public variable: string) {
    super(`Missing configuration: ${variable}`);
  }
}

export function ok(data: unknown = null, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(code: ErrorCode, fields?: Record<string, string>): NextResponse {
  const [status, message] = ERRORS[code];
  return NextResponse.json({ success: false, code, message, ...(fields ? { errors: fields } : {}) }, { status });
}

export function fromDbError(error: { message?: string; code?: string } | null): ApiError {
  const msg = (error?.message ?? '').trim();
  if (msg in ERRORS) return new ApiError(msg as ErrorCode);
  if (error?.code === '23505') return new ApiError('DATA_CONFLICT', undefined, msg);
  return new ApiError('INTERNAL_ERROR', undefined, `db: ${error?.code ?? ''} ${msg}`);
}

/** Throws on a Supabase error, otherwise returns data. */
export function must<T>(res: { data: T | null; error: { message?: string; code?: string } | null }): T {
  if (res.error) throw fromDbError(res.error);
  return res.data as T;
}

export function errorResponse(e: unknown): NextResponse {
  if (e instanceof ApiError) {
    if (ERRORS[e.code][0] >= 500) console.error('[api]', e.message);
    return fail(e.code, e.fields);
  }
  if (e instanceof ConfigError) {
    console.error('[config]', e.message);
    return fail('CONFIG_MISSING');
  }
  if (e instanceof ZodError) return fail('VALIDATION_FAILED', zodFields(e));
  console.error('[api] unhandled', e);
  return fail('INTERNAL_ERROR');
}

function zodFields(e: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of e.issues) {
    const k = issue.path.join('.') || '_';
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Cookie-authenticated mutations must come from our own client (custom header ⇒ no cross-site forms). */
function checkCsrf(req: NextRequest) {
  if (!MUTATING.has(req.method)) return;
  if (req.headers.get('authorization')) return;
  const cookie = req.headers.get('cookie') ?? '';
  if (!/\bmn_a?at=|\bmn_a?rt=/.test(cookie)) return;
  if (!req.headers.get('x-mn-client')) throw new ApiError('CSRF_REJECTED');
}

type Params = Record<string, string>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function handler(fn: (req: NextRequest, params: Params) => Promise<Response>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: NextRequest, ctx: any): Promise<Response> => {
    try {
      checkCsrf(req);
      const params: Params = ctx?.params ? await ctx.params : {};
      return await fn(req, params);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export async function parseBody<S extends ZodTypeAny>(req: NextRequest, schema: S): Promise<z.output<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError('VALIDATION_FAILED');
  }
  const r = schema.safeParse(raw);
  if (!r.success) throw new ApiError('VALIDATION_FAILED', zodFields(r.error));
  return r.data;
}

export function query(req: NextRequest, name: string): string | null {
  const v = req.nextUrl.searchParams.get(name);
  return v && v.trim() ? v.trim() : null;
}

export function pageParams(req: NextRequest, defSize = 30) {
  const page = Math.max(0, Number(query(req, 'page') ?? 0) || 0);
  const size = Math.min(100, Math.max(1, Number(query(req, 'size') ?? defSize) || defSize));
  return { page, size, from: page * size, to: page * size + size - 1 };
}

/** Strips characters that would break PostgREST `or()` filters. */
export function searchTerm(req: NextRequest): string | null {
  const q = query(req, 'q');
  return q ? q.replace(/[,()%*\\]/g, ' ').trim().slice(0, 60) || null : null;
}

export function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
}
