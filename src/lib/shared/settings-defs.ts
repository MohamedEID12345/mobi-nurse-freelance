export type SettingType = 'number' | 'int' | 'phone' | 'text' | 'bool';

export interface SettingDef {
  type: SettingType;
  label: string;
  min?: number;
  max?: number;
  isPublic: boolean;
  fallback: string;
}

export const SETTING_DEFS = {
  PLATFORM_COMMISSION_PERCENT: { type: 'number', label: 'نسبة عمولة المنصة (%)', min: 0, max: 50, isPublic: false, fallback: '10' },
  NURSE_REGISTRATION_FEE: { type: 'number', label: 'رسوم تفعيل حساب الممرض (ج.م)', min: 0, max: 10000, isPublic: true, fallback: '100' },
  MIN_WITHDRAWAL_AMOUNT: { type: 'number', label: 'الحد الأدنى لطلب السحب (ج.م)', min: 1, max: 100000, isPublic: true, fallback: '100' },
  MATCHING_RADIUS_KM: { type: 'number', label: 'نطاق البحث عن ممرض (كم)', min: 1, max: 100, isPublic: false, fallback: '15' },
  MATCHING_BATCH_SIZE: { type: 'int', label: 'عدد الممرضين في كل دفعة ترشيح', min: 1, max: 20, isPublic: false, fallback: '5' },
  MATCHING_OFFER_TIMEOUT_SECONDS: { type: 'int', label: 'مهلة رد الممرض على الطلب (ثانية)', min: 20, max: 600, isPublic: false, fallback: '60' },
  SEARCH_MAX_MINUTES: { type: 'int', label: 'أقصى مدة بحث قبل الإلغاء التلقائي (دقيقة)', min: 5, max: 240, isPublic: false, fallback: '20' },
  NURSE_LOCATION_MAX_AGE_MINUTES: { type: 'int', label: 'صلاحية آخر موقع للممرض (دقيقة)', min: 5, max: 1440, isPublic: false, fallback: '60' },
  SUPPORT_WHATSAPP: { type: 'phone', label: 'واتساب الدعم (دولي بدون +)', isPublic: true, fallback: '201062569857' },
  ADMIN_WHATSAPP: { type: 'phone', label: 'واتساب الإدارة (دولي بدون +)', isPublic: false, fallback: '201062569857' },
  EMERGENCY_NUMBER: { type: 'text', label: 'رقم الإسعاف', isPublic: true, fallback: '123' },
  URGENT_REQUESTS_ENABLED: { type: 'bool', label: 'تفعيل الطلب العاجل بدون تسجيل', isPublic: true, fallback: 'true' },
} as const satisfies Record<string, SettingDef>;

export type SettingKey = keyof typeof SETTING_DEFS;
export const SETTING_KEYS = Object.keys(SETTING_DEFS) as SettingKey[];
