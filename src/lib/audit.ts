import { NextRequest } from 'next/server';
import { db } from './db';
import { clientIp } from './http';

export async function audit(req: NextRequest | null, entry: {
  actorType: 'ADMIN' | 'USER' | 'SYSTEM';
  actorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  const { error } = await db().from('audit_logs').insert({
    actor_type: entry.actorType,
    actor_id: entry.actorId ?? null,
    action: entry.action,
    target_type: entry.targetType ?? null,
    target_id: entry.targetId ?? null,
    old_value: entry.oldValue ?? null,
    new_value: entry.newValue ?? null,
    ip: req ? clientIp(req) : null,
  });
  if (error) console.error('[audit] failed', entry.action, error.message);
}
