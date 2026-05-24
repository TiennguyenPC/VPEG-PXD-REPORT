export const VUPHONG_EMAIL_DOMAIN = '@vuphong.com';

export function parseEmailLocal(email) {
  const raw = String(email || '').trim().toLowerCase();
  if (!raw) return '';
  if (raw.endsWith(VUPHONG_EMAIL_DOMAIN)) {
    return raw.slice(0, -VUPHONG_EMAIL_DOMAIN.length);
  }
  if (raw.includes('@')) {
    return raw.split('@')[0];
  }
  return raw;
}

export function buildVuphongEmail(localPart) {
  const local = String(localPart || '').trim().toLowerCase().replace(/@.*$/, '');
  if (!local) return '';
  return `${local}${VUPHONG_EMAIL_DOMAIN}`;
}

export function isValidEmailLocal(localPart) {
  const local = String(localPart || '').trim();
  return local.length >= 2 && /^[a-z0-9._-]+$/i.test(local);
}

export function formatApiError(message) {
  return String(message || '')
    .replace(/^Exception:\s*/i, '')
    .replace(/^Error:\s*/i, '')
    .trim();
}
