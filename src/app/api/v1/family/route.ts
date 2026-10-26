import { db } from '@/lib/db';
import { handler, must, ok, parseBody } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { familyMemberSchema } from '@/lib/validators';

function familyDto(f: Record<string, unknown>) {
  return { id: f.id, name: f.name, relation: f.relation, birthDate: f.birth_date, gender: f.gender, notes: f.notes };
}

export const GET = handler(async (req) => {
  const user = await requireUser(req, 'CUSTOMER');
  const rows = must(await db().from('family_members').select('*').eq('customer_id', user.id).is('deleted_at', null)
    .order('created_at')) as Array<Record<string, unknown>>;
  return ok(rows.map(familyDto));
});

export const POST = handler(async (req) => {
  const user = await requireUser(req, 'CUSTOMER');
  const b = await parseBody(req, familyMemberSchema);
  const row = must(await db().from('family_members').insert({
    customer_id: user.id, name: b.name, relation: b.relation, birth_date: b.birthDate ?? null,
    gender: b.gender ?? null, notes: b.notes ?? '',
  }).select('*').single()) as Record<string, unknown>;
  return ok(familyDto(row), 201);
});
