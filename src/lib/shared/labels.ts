// Shared (client + server) Arabic labels.
export const BOOKING_STATUS: Record<string, string> = {
  CREATED: 'تم الإنشاء',
  SEARCHING: 'جارٍ البحث عن ممرض',
  NURSE_ASSIGNED: 'تم تعيين ممرض',
  NURSE_ON_THE_WAY: 'الممرض في الطريق',
  NURSE_ARRIVED: 'الممرض وصل',
  SERVICE_STARTED: 'جارٍ تقديم الخدمة',
  SERVICE_COMPLETED: 'انتهت الخدمة',
  WAITING_FOR_PAYMENT: 'في انتظار الدفع',
  PAID: 'تم الدفع',
  CANCELLED: 'ملغي',
  DISPUTED: 'قيد المراجعة (نزاع)',
};

export const CUSTOMER_STEPS = [
  'SEARCHING', 'NURSE_ASSIGNED', 'NURSE_ON_THE_WAY', 'NURSE_ARRIVED', 'SERVICE_STARTED', 'WAITING_FOR_PAYMENT', 'PAID',
] as const;

export const VERIFICATION_STATUS: Record<string, string> = {
  REGISTERED: 'بانتظار سداد الرسوم ورفع المستندات',
  FEE_PAID: 'تم سداد الرسوم — بانتظار المستندات',
  DOCUMENTS_SUBMITTED: 'تم رفع المستندات — بانتظار سداد الرسوم',
  PENDING_VERIFICATION: 'قيد المراجعة',
  APPROVED: 'معتمد',
  REJECTED: 'مرفوض',
  RESUBMISSION_REQUESTED: 'مطلوب إعادة رفع المستندات',
};

export const QUALIFICATIONS: Record<string, string> = {
  NURSING_DIPLOMA: 'دبلوم التمريض',
  TECHNICAL_INSTITUTE: 'المعهد الفني للتمريض',
  BACHELOR: 'بكالوريوس التمريض',
  POSTGRADUATE: 'دراسات عليا في التمريض',
  OTHER: 'أخرى',
};

export const DOC_TYPES: Record<string, string> = {
  PROFILE_PHOTO: 'الصورة الشخصية',
  NATIONAL_ID_FRONT: 'البطاقة الشخصية (وجه)',
  NATIONAL_ID_BACK: 'البطاقة الشخصية (ظهر)',
  PRACTICE_LICENSE: 'ترخيص مزاولة المهنة / كارنيه النقابة',
  QUALIFICATION: 'شهادة المؤهل (اختياري)',
  OTHER: 'مستند إضافي (اختياري)',
};
export const REQUIRED_DOCS = ['PROFILE_PHOTO', 'NATIONAL_ID_FRONT', 'NATIONAL_ID_BACK', 'PRACTICE_LICENSE'] as const;

export const WITHDRAWAL_METHODS: Record<string, string> = {
  VODAFONE_CASH: 'فودافون كاش',
  ORANGE_CASH: 'أورنج كاش',
  ETISALAT_CASH: 'اتصالات كاش',
  WE_PAY: 'WE Pay',
  INSTAPAY: 'إنستاباي',
  BANK_TRANSFER: 'تحويل بنكي',
};

export const WITHDRAWAL_STATUS: Record<string, string> = {
  PENDING: 'قيد المراجعة',
  APPROVED: 'تمت الموافقة',
  PROCESSING: 'جارٍ التحويل',
  PAID: 'تم التحويل',
  REJECTED: 'مرفوض',
};

export const WALLET_TX_TYPES: Record<string, string> = {
  SERVICE_EARNING: 'أرباح خدمة',
  COMMISSION: 'عمولة المنصة',
  WITHDRAWAL: 'سحب',
  REFUND: 'استرداد',
  ADJUSTMENT: 'تسوية',
  NURSE_PAID_ON_BEHALF: 'دفع نيابة عن العميل',
  OTHER: 'أخرى',
};

export const COMPLAINT_CATEGORIES: Record<string, string> = {
  NURSE: 'الممرض',
  PAYMENT: 'الدفع',
  SERVICE: 'الخدمة',
  APP: 'التطبيق',
};

export const COMPLAINT_STATUS: Record<string, string> = {
  OPEN: 'جديدة',
  IN_REVIEW: 'قيد المراجعة',
  RESOLVED: 'تم الحل',
  REJECTED: 'مرفوضة',
  ESCALATED: 'مُصعّدة',
};

export const PAYMENT_STATUS: Record<string, string> = {
  PENDING: 'قيد التنفيذ',
  SUCCESS: 'ناجحة',
  FAILED: 'فاشلة',
};

export const ADMIN_ROLES: Record<string, string> = {
  SUPER_ADMIN: 'المدير العام',
  OPERATIONS_ADMIN: 'مشرف التشغيل',
  FINANCE_ADMIN: 'المشرف المالي',
  VERIFICATION_ADMIN: 'مشرف التحقق',
  SUPPORT_ADMIN: 'مشرف الدعم',
};

export const RELATIONS = ['نفسي', 'الأب', 'الأم', 'الزوج', 'الزوجة', 'ابن', 'ابنة', 'الجد', 'الجدة', 'أخ', 'أخت', 'قريب آخر'];

export function money(v: number | string | null | undefined): string {
  const n = Number(v ?? 0);
  return `${n.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ج.م`;
}

export function dateTime(v: string | null | undefined): string {
  if (!v) return '—';
  return new Date(v).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
}
