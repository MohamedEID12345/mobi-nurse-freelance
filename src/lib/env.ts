import { ConfigError } from './http';

function required(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new ConfigError(name);
  return v.trim();
}

export const env = {
  get appUrl() { return required('APP_BASE_URL').replace(/\/$/, ''); },
  get supabaseUrl() { return required('SUPABASE_URL'); },
  get supabaseSecretKey() { return required('SUPABASE_SECRET_KEY'); },
  get jwtSecret() {
    const v = required('JWT_SECRET');
    if (v.length < 32) throw new ConfigError('JWT_SECRET (min 32 chars)');
    return v;
  },
  get kashierMerchantId() { return required('KASHIER_MERCHANT_ID'); },
  get kashierApiKey() { return required('KASHIER_API_KEY'); },
  get kashierMode(): 'test' | 'live' { return process.env.KASHIER_MODE === 'live' ? 'live' : 'test'; },
  get bootstrapAdminEmail() { return process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase() || null; },
  get bootstrapAdminPassword() { return process.env.BOOTSTRAP_ADMIN_PASSWORD || null; },
  get fcmServiceAccountBase64() { return process.env.FCM_SERVICE_ACCOUNT_BASE64?.trim() || null; },
  get isProduction() { return process.env.NODE_ENV === 'production'; },
};
