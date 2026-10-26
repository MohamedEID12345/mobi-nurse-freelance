import { db } from '@/lib/db';
import { ApiError, handler, must, ok, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { familyMemberSchema } from '@/lib/validators';

function dto(f: Record<string, unknown>) {
  return { id: f.id, name: f.name, relation: f.relation, birthDate: f.birth_date, gender: f.gender, notes: f.notes };
}

export const PATCH = handler(async (req, { id }) => {
  const user = await requireUser(req, 'CUSTOMER');
  const b = await parseBody(req, familyMemberSchema);
  const row = must(await db().from('family_members').update({
    name: b.name, relation: b.relation, birth_date: b.birthDate ?? null, gender: b.gender ?? null, notes: b.notes ?? '',
  }).eq('id', id).eq('customer_id', user.id).is('deleted_at', null).select('*').maybeSingle()) as Record<string, unknown> | null;
  if (!row) throw new ApiError('FAMILY_MEMBER_NOT_FOUND');
  return ok(dto(row));
});

export const DELETE = handler(async (req, { id }) => {
  const user = await requireUser(req, 'CUSTOMER');
  await db().from('family_members').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('customer_id', user.id);
  return ok();
});
