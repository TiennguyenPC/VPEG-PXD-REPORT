/** Trích file id từ link Google Drive — tách nhỏ để không kéo theo logic ảnh nặng */
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
