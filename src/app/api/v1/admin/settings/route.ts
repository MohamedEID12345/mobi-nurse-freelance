import { db } from '@/lib/db';
import { handler, must, ok, parseBody } from '@/lib/http';
import { requireAdmin } from '@/lib/auth';
import { audit } from '@/lib/audit';
import { loadSettings, normalizeSetting } from '@/lib/settings';
import { settingUpdateSchema } from '@/lib/validators';
import { SETTING_DEFS } from '@/lib/shared/settings-defs';

export const GET = handler(async (req) => {
  await requireAdmin(req, 'SETTINGS_MANAGE');
  const s = await loadSettings();
  return ok(Object.entries(SETTING_DEFS).map(([key, def]) => ({ key, value: s[key as keyof typeof s], ...def })));
});

export const PATCH = handler(async (req) => {
  const admin = await requireAdmin(req, 'SETTINGS_MANAGE');
  const b = await parseBody(req, settingUpdateSchema);
  const { key, value } = normalizeSetting(b.key, b.value);
  const before = (await loadSettings())[key];
  must(await db().from('settings').upsert({ key, value, updated_at: new Date().toISOString(), updated_by: admin.id }));
  await audit(req, { actorType: 'ADMIN', actorId: admin.id, action: 'SETTING_CHANGED', targetType: 'SETTING', targetId: key, oldValue: { value: before }, newValue: { value } });
  return ok({ key, value });
});
