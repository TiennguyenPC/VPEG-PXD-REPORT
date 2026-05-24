/** Trích file id từ các dạng link Google Drive */
export function extractDriveFileId(url) {
  if (!url || typeof url !== 'string') return null;
  const s = url.trim();
  const patterns = [
    /[?&]id=([\w-]+)/,
    /\/file\/d\/([\w-]+)/,
    /\/d\/([\w-]+)/,
    /\/uc\?export=view&id=([\w-]+)/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

/** Proxy ảnh Drive qua GAS — tránh bị chặn hotlink trên Vercel/production */
export function buildGasImageProxyUrl(fileId) {
  if (!fileId) return '';
  const base = import.meta.env.VITE_GAS_URL
    || 'https://script.google.com/macros/s/AKfycbz2YizKLfy0pjrjEtJM6N4CKDUnxzXmwsF0WsNHfmpeCT0U56QwCUpgIb30XvtRb3lw/exec';
  return `${base}?action=serve-site-image&id=${encodeURIComponent(fileId)}`;
}

/** URL hiển thị được trong thẻ img (Drive thumbnail / lh3 / GAS proxy) */
export function toDisplayableImageUrl(url, size = 1920) {
  if (!url) return url;
  if (url.startsWith('blob:') || url.startsWith('data:')) return url;

  const fileId = extractDriveFileId(url);
  if (fileId) {
    return buildGasImageProxyUrl(fileId);
  }
  return url;
}

/** Thử các URL fallback khi ảnh Drive không load */
export function getImageFallbackUrls(url) {
  if (!url) return [];
  if (url.startsWith('blob:') || url.startsWith('data:')) return [url];

  const fileId = extractDriveFileId(url);
  if (!fileId) return [url];

  return [
    buildGasImageProxyUrl(fileId),
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1920`,
    `https://lh3.googleusercontent.com/d/${fileId}=w1920-h1080`,
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
