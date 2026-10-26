import { db } from './db';
import { ApiError, must } from './http';
import { SETTING_DEFS, SETTING_KEYS, SettingKey } from './shared/settings-defs';
import { asciiDigits } from './shared/phone';

export type Settings = Record<SettingKey, string>;

export async function loadSettings(): Promise<Settings> {
  const rows = must(await db().from('settings').select('key, value')) as Array<{ key: string; value: string }>;
  const map = Object.fromEntries(SETTING_KEYS.map((k) => [k, SETTING_DEFS[k].fallback])) as Settings;
  for (const r of rows ?? []) if (r.key in map) map[r.key as SettingKey] = r.value;
  return map;
}

export function num(s: Settings, k: SettingKey): number {
  const n = Number(s[k]);
  return Number.isFinite(n) ? n : Number(SETTING_DEFS[k].fallback);
}

export function bool(s: Settings, k: SettingKey): boolean {
  return s[k] === 'true';
}

export function publicSettings(s: Settings): Record<string, string> {
  return Object.fromEntries(SETTING_KEYS.filter((k) => SETTING_DEFS[k].isPublic).map((k) => [k, s[k]]));
}

/** Validates and normalizes a setting value. */
export function normalizeSetting(key: string, raw: string): { key: SettingKey; value: string } {
  if (!(key in SETTING_DEFS)) throw new ApiError('NOT_FOUND');
  const k = key as SettingKey;
  const def = SETTING_DEFS[k] as { type: string; min?: number; max?: number };
  const v = asciiDigits(String(raw ?? '').trim());
  const bad = () => new ApiError('SETTING_INVALID_VALUE');
  switch (def.type) {
    case 'number':
    case 'int': {
      if (!/^\d+(\.\d{1,2})?$/.test(v)) throw bad();
      const n = Number(v);
      if (def.type === 'int' && !Number.isInteger(n)) throw bad();
      if ((def.min !== undefined && n < def.min) || (def.max !== undefined && n > def.max)) throw bad();
      return { key: k, value: String(n) };
    }
    case 'phone': {
      const d = v.replace(/[\s+\-]/g, '');
      if (!/^\d{6,15}$/.test(d)) throw bad();
      return { key: k, value: d };
    }
    case 'bool':
      if (v !== 'true' && v !== 'false') throw bad();
      return { key: k, value: v };
    default:
      if (!v || v.length > 200) throw bad();
      return { key: k, value: v };
  }
}
