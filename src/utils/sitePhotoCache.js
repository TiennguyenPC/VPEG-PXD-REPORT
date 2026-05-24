export const CACHE_CONSENT_KEY = 'epc_local_cache_consent';

export function getLocalCacheConsent() {
  try {
    return localStorage.getItem(CACHE_CONSENT_KEY);
  } catch {
    return null;
  }
}

export function setLocalCacheConsent(value) {
  try {
    localStorage.setItem(CACHE_CONSENT_KEY, value);
  } catch { /* private mode / quota */ }
}

export function hasLocalCacheConsent() {
  return getLocalCacheConsent() === 'accepted';
}

function storageKey(projectId) {
  return `epc_site_photos_${String(projectId).replace(/\W/g, '_')}`;
}

export function readSitePhotosByProject(projectId) {
  if (!projectId) return {};
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function serializePhotoForCache(item) {
  const norm = typeof item === 'string'
    ? { id: item, preview: item, remote: item, status: 'ready' }
    : item;
  const remote = norm.remote || '';
  const preview = norm.preview || remote;
  if (!remote && (!preview || preview.startsWith('blob:'))) return null;
  const url = remote || (preview.startsWith('http') ? preview : '');
  if (!url) return null;
  return {
    id: norm.id || url,
    preview: preview.startsWith('blob:') ? url : preview,
    remote: url,
    status: norm.status === 'uploading' ? 'ready' : (norm.status || 'ready'),
  };
}

export function writeDateSitePhotos(projectId, date, photos) {
  if (!projectId || !date) return;
  const serialized = photos.map(serializePhotoForCache).filter(Boolean).slice(0, 4);
  const all = readSitePhotosByProject(projectId);
  all[date] = serialized;
  try {
    localStorage.setItem(storageKey(projectId), JSON.stringify(all));
  } catch (e) {
    console.warn('Không lưu được cache ảnh hiện trường', e);
  }
}

export function writeAllSitePhotos(projectId, photosByDate) {
  if (!projectId) return;
  const all = {};
  for (const [date, photos] of Object.entries(photosByDate || {})) {
    const serialized = photos.map(serializePhotoForCache).filter(Boolean).slice(0, 4);
    if (serialized.length) all[date] = serialized;
  }
  try {
    localStorage.setItem(storageKey(projectId), JSON.stringify(all));
  } catch (e) {
    console.warn('Không lưu được cache ảnh hiện trường', e);
  }
}

export function mergePhotoLists(serverPhotos, localPhotos) {
  const seen = new Set();
  const merged = [];
  for (const p of serverPhotos) {
    const url = p.remote || p.id;
    if (url && !seen.has(url)) {
      seen.add(url);
      merged.push(p);
    }
  }
  for (const p of localPhotos) {
    const url = p.remote || p.preview;
    if (url && !url.startsWith('blob:') && !seen.has(url)) {
      seen.add(url);
      merged.push(p);
    }
  }
  return merged.slice(0, 4);
}
