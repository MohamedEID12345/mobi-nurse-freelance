import { db } from './db';
import { ApiError } from './http';

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // Vercel request limit is 4.5 MB

const SIGNATURES: Array<{ mime: string; ext: string; test: (b: Buffer) => boolean }> = [
  { mime: 'image/jpeg', ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', ext: 'png', test: (b) => b.subarray(0, 4).toString('hex') === '89504e47' },
  { mime: 'image/webp', ext: 'webp', test: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP' },
  { mime: 'application/pdf', ext: 'pdf', test: (b) => b.subarray(0, 4).toString() === '%PDF' },
];

/** Reads an uploaded File, checks size and real content type (magic bytes, not the file name). */
export async function readUpload(file: unknown, allowPdf: boolean): Promise<{ bytes: Buffer; mime: string; ext: string }> {
  if (!file || typeof file !== 'object' || !('arrayBuffer' in file)) throw new ApiError('FILE_INVALID');
  const f = file as File;
  if (f.size <= 0 || f.size > MAX_UPLOAD_BYTES) throw new ApiError('FILE_INVALID');
  const bytes = Buffer.from(await f.arrayBuffer());
  const sig = SIGNATURES.find((s) => s.test(bytes));
  if (!sig || (!allowPdf && sig.mime === 'application/pdf')) throw new ApiError('FILE_INVALID');
  return { bytes, mime: sig.mime, ext: sig.ext };
}

export async function putObject(bucket: string, path: string, bytes: Buffer, contentType: string) {
  const { error } = await db().storage.from(bucket).upload(path, bytes, { contentType, upsert: false });
  if (error) throw new ApiError('INTERNAL_ERROR', undefined, `storage: ${error.message}`);
}

export async function removeObject(bucket: string, path: string | null | undefined) {
  if (path) await db().storage.from(bucket).remove([path]);
}

export function publicObjectUrl(bucket: string, path: string): string {
  return db().storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function signedObjectUrl(bucket: string, path: string, seconds = 300): Promise<string | null> {
  const { data } = await db().storage.from(bucket).createSignedUrl(path, seconds);
  return data?.signedUrl ?? null;
}
