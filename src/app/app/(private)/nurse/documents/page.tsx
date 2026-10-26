'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api, errorMessage } from '@/client/api';
import { useApi } from '@/client/hooks';
import { prepareUpload } from '@/client/image';
import { ActionButton, Card, ErrorBox, Spinner } from '@/components/ui';
import { DOC_TYPES, REQUIRED_DOCS, VERIFICATION_STATUS } from '@/lib/shared/labels';

interface Doc { id: string; type: string; mimeType: string; url: string | null; uploadedAt: string }
interface Profile { verificationStatus: string; feePaid: boolean; documentsSubmitted: boolean; missingDocuments: string[] }
const EDITABLE = ['REGISTERED', 'FEE_PAID', 'DOCUMENTS_SUBMITTED', 'REJECTED', 'RESUBMISSION_REQUESTED'];

export default function Documents() {
  const docs = useApi<Doc[]>('/api/v1/nurse/documents');
  const profile = useApi<Profile>('/api/v1/nurse/profile');
  const [busyType, setBusyType] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (!docs.data || !profile.data) return docs.error || profile.error ? <ErrorBox error={docs.error ?? profile.error} /> : <Spinner />;
  const editable = EDITABLE.includes(profile.data.verificationStatus);

  const upload = async (type: string, file: File | undefined) => {
    if (!file) return;
    setBusyType(type); setErr(null); setMsg(null);
    try {
      const fd = new FormData();
      fd.append('docType', type);
      fd.append('file', await prepareUpload(file));
      await api('/api/v1/nurse/documents', { form: fd });
      await Promise.all([docs.reload(), profile.reload()]);
    } catch (e) { setErr(errorMessage(e)); } finally { setBusyType(null); }
  };

  return (
    <>
      <h1>المستندات</h1>
      <div className="alert info small">الحالة: {VERIFICATION_STATUS[profile.data.verificationStatus]}. المستندات محفوظة بشكل خاص ولا يراها إلا فريق التحقق.</div>
      {msg && <div className="alert ok">{msg}</div>}
      <ErrorBox error={err} />
      {!editable && <div className="alert warn">لا يمكن تعديل المستندات أثناء المراجعة أو بعد الاعتماد. للتعديل تواصل مع الدعم.</div>}
      {Object.entries(DOC_TYPES).map(([type, label]) => {
        const current = docs.data!.filter((d) => d.type === type);
        const required = (REQUIRED_DOCS as readonly string[]).includes(type);
        return (
          <Card key={type} className="stack">
            <div className="row between"><strong>{label}</strong>{current.length ? <span className="badge ok">مرفوع ✅</span> : required ? <span className="badge warn">مطلوب</span> : <span className="badge">اختياري</span>}</div>
            {current.map((d) => d.url && (d.mimeType === 'application/pdf'
              ? <a key={d.id} href={d.url} target="_blank" rel="noreferrer">📄 عرض الملف</a>
              : <img key={d.id} className="doc-thumb" src={d.url} alt={label} />))}
            {editable && (
              <label className="btn secondary block">
                {busyType === type ? 'جارٍ الرفع...' : current.length ? 'استبدال' : 'رفع صورة / ملف'}
                <input type="file" accept={type === 'PROFILE_PHOTO' ? 'image/*' : 'image/*,application/pdf'} className="hidden"
                       disabled={busyType !== null} onChange={(e) => upload(type, e.target.files?.[0])} />
              </label>
            )}
          </Card>
        );
      })}
      {editable && (
        <ActionButton className="block lg ok" disabled={profile.data.missingDocuments.length > 0} onClick={async () => {
          const r = await api<{ verificationStatus: string }>('/api/v1/nurse/documents/submit', { body: {} });
          setMsg(r.verificationStatus === 'PENDING_VERIFICATION' ? 'تم إرسال المستندات للمراجعة ✅' : 'تم حفظ المستندات. ادفع رسوم التفعيل لإكمال الطلب.');
          await profile.reload();
        }}>إرسال المستندات للمراجعة</ActionButton>
      )}
      <Link className="btn block ghost" href="/app/nurse">رجوع</Link>
    </>
  );
}
