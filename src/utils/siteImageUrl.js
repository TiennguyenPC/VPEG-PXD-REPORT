import { extractDriveFileId } from './driveFileId';

export { extractDriveFileId };

/** Proxy ảnh Drive qua GAS — tránh bị chặn hotlink trên Vercel/production */
export function buildGasImageProxyUrl(fileId) {
  if (!fileId) return '';
  const base = import.meta.env.VITE_GAS_URL
    || 'https://script.google.com/macros/s/AKfycbz2YizKLfy0pjrjEtJM6N4CKDUnxzXmwsF0WsNHfmpeCT0U56QwCUpgIb30XvtRb3lw/exec';
  return `${base}?action=serve-site-image&id=${encodeURIComponent(fileId)}`;
}

function buildDriveThumbnailUrl(fileId, width = 640) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${width}`;
}

const workedUrlMemory = new Map();

function cacheKey(fileId, variant) {
  return `${fileId}:${variant}`;
}

export function getRememberedImageUrl(fileId, variant = 'thumb') {
  if (!fileId) return null;
  const key = cacheKey(fileId, variant);
  if (workedUrlMemory.has(key)) return workedUrlMemory.get(key);
  try {
    const stored = sessionStorage.getItem(`epc_img_ok_${key}`);
    if (stored) {
      workedUrlMemory.set(key, stored);
      return stored;
    }
  } catch { /* ignore */ }
  return null;
}

export function rememberWorkingImageUrl(fileId, variant, url) {
  if (!fileId || !url) return;
  const key = cacheKey(fileId, variant);
  workedUrlMemory.set(key, url);
  try {
    sessionStorage.setItem(`epc_img_ok_${key}`, url);
  } catch { /* quota / private mode */ }
}

/** URL hiển thị grid — ưu tiên GAS proxy (ổn định trên production) rồi Drive thumbnail */
export function toDisplayableImageUrl(url, _size = 640) {
  if (!url) return url;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;

  const fileId = extractDriveFileId(url);
  if (fileId) {
    const cached = getRememberedImageUrl(fileId, 'thumb');
    if (cached) return cached;
    return buildGasImageProxyUrl(fileId);
  }
  return url;
}

/** Thử các URL fallback — thumb: Drive thumbnail trước; full: GAS/proxy cho lightbox */
export function getImageFallbackUrls(url, { variant = 'thumb' } = {}) {
  if (!url) return [];
  if (url.startsWith('blob:') || url.startsWith('data:')) return [url];

  const fileId = extractDriveFileId(url);
  if (!fileId) return [url];

  const cached = getRememberedImageUrl(fileId, variant);
  if (cached) return [cached, url];

  if (variant === 'full') {
    return [
      buildGasImageProxyUrl(fileId),
      buildDriveThumbnailUrl(fileId, 1920),
      `https://lh3.googleusercontent.com/d/${fileId}=w1920-h1080`,
      `https://drive.google.com/uc?export=view&id=${fileId}`,
      url,
    ];
  }

  return [
    buildGasImageProxyUrl(fileId),
    buildDriveThumbnailUrl(fileId, 640),
    buildDriveThumbnailUrl(fileId, 320),
    `https://lh3.googleusercontent.com/d/${fileId}=w640-h480`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    url,
  ];
}

export function verifyImageLoads(url, timeoutMs = 12000) {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    const img = new Image();
    let done = false;
    const finish = (ok) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    img.onload = () => finish(true);
    img.onerror = () => finish(false);
    img.referrerPolicy = 'no-referrer';
    img.src = url;
  });
}
