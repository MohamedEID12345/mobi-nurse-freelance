import { db } from './db';
import { ApiError, must } from './http';
import { REQUIRED_DOCS } from './shared/labels';
import { signedObjectUrl } from './storage';

export interface NurseProfileRow {
  user_id: string; date_of_birth: string; qualification: string; years_experience: number; bio: string;
  verification_status: string; rejection_reason: string | null; registration_fee_paid_at: string | null;
  documents_submitted_at: string | null; is_online: boolean; last_lat: number | null; last_lng: number | null;
  last_location_at: string | null; rating_avg: string; rating_count: number; completed_count: number;
  offers_received: number; offers_accepted: number; cancelled_count: number; approved_at: string | null;
}

export async function getNurseProfile(userId: string): Promise<NurseProfileRow> {
  const p = must(await db().from('nurse_profiles').select('*').eq('user_id', userId).maybeSingle()) as NurseProfileRow | null;
  if (!p) throw new ApiError('NOT_FOUND');
  return p;
}

export const DOCS_EDITABLE = ['REGISTERED', 'FEE_PAID', 'DOCUMENTS_SUBMITTED', 'REJECTED', 'RESUBMISSION_REQUESTED'];

export async function currentDocuments(nurseId: string, signed: boolean) {
  const rows = must(await db().from('nurse_documents').select('id, doc_type, storage_path, mime_type, size_bytes, created_at')
    .eq('nurse_id', nurseId).eq('is_current', true).order('created_at', { ascending: false })) as Array<Record<string, string>>;
  return Promise.all(rows.map(async (d) => ({
    id: d.id, type: d.doc_type, mimeType: d.mime_type, size: Number(d.size_bytes), uploadedAt: d.created_at,
    url: signed ? await signedObjectUrl('nurse-documents', d.storage_path, 300) : null,
  })));
}

export function missingRequiredDocs(types: string[]): string[] {
  return REQUIRED_DOCS.filter((t) => !types.includes(t));
}
