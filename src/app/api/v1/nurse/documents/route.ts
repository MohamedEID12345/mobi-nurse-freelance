import crypto from 'node:crypto';
import { db } from '@/lib/db';
import { ApiError, handler, must, ok } from '@/lib/http';
import { requireUser } from '@/lib/auth';
import { currentDocuments, DOCS_EDITABLE, getNurseProfile } from '@/lib/nurse';
import { putObject, readUpload } from '@/lib/storage';
import { DOC_TYPES } from '@/lib/shared/labels';

export const GET = handler(async (req) => {
  const user = await requireUser(req, 'NURSE');
  return ok(await currentDocuments(user.id, true));
});

/** multipart/form-data: docType + file. Stored in the PRIVATE bucket. */
export const POST = handler(async (req) => {
  const user = await requireUser(req, 'NURSE');
  const profile = await getNurseProfile(user.id);
  if (!DOCS_EDITABLE.includes(profile.verification_status)) throw new ApiError('DOCUMENTS_LOCKED');
  const form = await req.formData().catch(() => { throw new ApiError('FILE_INVALID'); });
  const docType = String(form.get('docType') ?? '');
  if (!(docType in DOC_TYPES)) throw new ApiError('VALIDATION_FAILED');
  const file = await readUpload(form.get('file'), docType !== 'PROFILE_PHOTO');

  const path = `${user.id}/${docType.toLowerCase()}-${crypto.randomUUID()}.${file.ext}`;
  await putObject('nurse-documents', path, file.bytes, file.mime);
  if (docType !== 'OTHER') {
    must(await db().from('nurse_documents').update({ is_current: false }).eq('nurse_id', user.id).eq('doc_type', docType));
  }
  must(await db().from('nurse_documents').insert({
    nurse_id: user.id, doc_type: docType, storage_path: path, mime_type: file.mime, size_bytes: file.bytes.length,
  }));
  return ok(await currentDocuments(user.id, false), 201);
});
