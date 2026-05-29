import { extractDriveFileId } from './siteImageUrl';

export function parseTaskAttachments(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeTaskAttachments(list) {
  return JSON.stringify(Array.isArray(list) ? list : []);
}

export function getAttachmentFileId(attachment) {
  if (!attachment) return '';
  return String(attachment.fileId || extractDriveFileId(attachment.url) || '').trim();
}

export function getAttachmentDownloadUrl(attachment) {
  const fileId = getAttachmentFileId(attachment);
  if (fileId) return `https://drive.google.com/uc?export=download&id=${fileId}`;
  return attachment?.url || '#';
}

export function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatUploadedAt(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

export const MAX_TASK_ATTACHMENT_BYTES = 20 * 1024 * 1024;

export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      let base64 = String(reader.result || '');
      if (base64.includes('base64,')) base64 = base64.split('base64,')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Không đọc được tệp'));
    reader.readAsDataURL(file);
  });
}
