const AR_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/g;

export function asciiDigits(s: string): string {
  return s.replace(AR_DIGITS, (d) => {
    const c = d.charCodeAt(0);
    return String(c >= 0x06f0 ? c - 0x06f0 : c - 0x0660);
  });
}

/** Egyptian mobile → canonical 01XXXXXXXXX, or null. Accepts +20 / 0020 / 20 / Arabic digits. */
export function normalizeEgyptianMobile(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = asciiDigits(raw).replace(/[\s\-()]/g, '');
  if (d.startsWith('+20')) d = '0' + d.slice(3);
  else if (d.startsWith('0020')) d = '0' + d.slice(4);
  else if (d.startsWith('20') && d.length === 12) d = '0' + d.slice(2);
  return /^01[0125]\d{8}$/.test(d) ? d : null;
}

/** 01XXXXXXXXX → 201XXXXXXXXX (for wa.me / tel). */
export function toInternational(phone: string): string {
  return phone.startsWith('0') ? '20' + phone.slice(1) : phone.replace(/^\+/, '');
}

export function whatsappLink(intlNumber: string, text?: string): string {
  const n = intlNumber.replace(/[^\d]/g, '');
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
