import { normalizeToDMY } from './timelineDates';
import { extractDriveFileId } from './siteImageUrl';

export const CACHE_CONSENT_KEY = 'epc_local_cache_consent';

/** Khóa ngày thống nhất dd/mm/yyyy — tránh lệch format khi đọc/ghi ảnh */
export function normalizePhotoDateKey(date) {
  return normalizeToDMY(date) || String(date || '').trim();
}

/** Ưu tiên cột có ### HÌNH ẢNH hoặc nội dung nhật ký ngày (tránh nhầm MONTHLY_REPORT) */
export function getLogNoteText(log) {
  if (!log) return '';
  const daily = String(log.DAILY_NOTE || '').trim();
  const fieldNote = String(log.GHI_CHÚ_HIỆN_TRƯỜNG || '').trim();
  const hasDailySections = (text) => /### (GHI CHÚ HIỆN TRƯỜNG|CÔNG VIỆC CHÍNH|HÌNH ẢNH)/i.test(text);

  if (fieldNote.includes('### HÌNH ẢNH') && !daily.includes('### HÌNH ẢNH')) return fieldNote;
  if (daily.includes('### HÌNH ẢNH') && !fieldNote.includes('### HÌNH ẢNH')) return daily;
  if (hasDailySections(daily) && !hasDailySections(fieldNote)) return daily;
  if (hasDailySections(fieldNote) && !hasDailySections(daily)) return fieldNote;
  if (daily && fieldNote) return daily.length >= fieldNote.length ? daily : fieldNote;
  return daily || fieldNote;
}

/** URL gốc Drive — không lưu proxy GAS vào Sheet */
export function canonicalPhotoPersistUrl(item) {
  const raw = typeof item === 'string'
    ? item
    : (item?.remote || item?.preview || '');
  if (!raw || raw.startsWith('blob:')) return null;
  const fileId = extractDriveFileId(raw);
  if (fileId) return `https://drive.google.com/uc?export=view&id=${fileId}`;
  if (raw.startsWith('http')) return raw;
  return null;
}

export function parseDailyNote(noteText) {
  const defaults = {
    ghiChu: '',
    congViecChinh: '',
    congViecNgayMai: '',
    vanDeRuiRo: '',
    progressActual: '',
    progressPlanned: '',
    progressEntries: '',
    dayStatus: 'Bình thường',
    dayStatusSubtext: '',
    images: '',
  };

  if (!noteText) return defaults;

  const result = { ...defaults };

  const extractSection = (text, heading) => {
    const regex = new RegExp(`### ${heading}\\n([\\s\\S]*?)(?=###|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };

  const ghiChu = extractSection(noteText, 'GHI CHÚ HIỆN TRƯỜNG');
  const congViecChinh = extractSection(noteText, 'CÔNG VIỆC CHÍNH');
  const congViecNgayMai = extractSection(noteText, 'CÔNG VIỆC NGÀY MAI');
  const vanDeRuiRo = extractSection(noteText, 'VẤN ĐỀ / RỦI RO');
  const progressActual = extractSection(noteText, 'TIẾN ĐỘ THỰC TẾ');
  const progressPlanned = extractSection(noteText, 'TIẾN ĐỘ KẾ HOẠCH');
  const progressEntries = extractSection(noteText, 'TIẾN ĐỘ HẠNG MỤC');
  const dayStatus = extractSection(noteText, 'TRẠNG THÁI NGÀY');
  const dayStatusSubtext = extractSection(noteText, 'ẢNH HƯỞNG');
  const images = extractSection(noteText, 'HÌNH ẢNH');

  if (ghiChu !== null) result.ghiChu = ghiChu;
  if (congViecChinh !== null) result.congViecChinh = congViecChinh;
  if (congViecNgayMai !== null) result.congViecNgayMai = congViecNgayMai;
  if (vanDeRuiRo !== null) result.vanDeRuiRo = vanDeRuiRo;
  if (progressActual !== null) result.progressActual = progressActual;
  if (progressPlanned !== null) result.progressPlanned = progressPlanned;
  if (progressEntries !== null) result.progressEntries = progressEntries;
  if (dayStatus !== null) result.dayStatus = dayStatus;
  if (dayStatusSubtext !== null) result.dayStatusSubtext = dayStatusSubtext;
  if (images !== null) result.images = images;

  if (ghiChu === null && congViecChinh === null && congViecNgayMai === null && vanDeRuiRo === null) {
    result.ghiChu = noteText.trim();
  }

  return result;
}

export function serializeDailyNote(sections) {
  const progressEntries = sections.progressEntries ? `\n\n### TIẾN ĐỘ HẠNG MỤC\n${sections.progressEntries}` : '';
  return `### GHI CHÚ HIỆN TRƯỜNG\n${sections.ghiChu}\n\n### CÔNG VIỆC CHÍNH\n${sections.congViecChinh}\n\n### CÔNG VIỆC NGÀY MAI\n${sections.congViecNgayMai}\n\n### VẤN ĐỀ / RỦI RO\n${sections.vanDeRuiRo}\n\n### TIẾN ĐỘ THỰC TẾ\n${sections.progressActual}\n\n### TIẾN ĐỘ KẾ HOẠCH\n${sections.progressPlanned}${progressEntries}\n\n### TRẠNG THÁI NGÀY\n${sections.dayStatus}\n\n### ẢNH HƯỞNG\n${sections.dayStatusSubtext}\n\n### HÌNH ẢNH\n${sections.images || ''}`;
}

function photoUrlKey(url) {
  return extractDriveFileId(url) || String(url || '').trim();
}

function photoUrlsFromText(noteText) {
  const parsed = parseDailyNote(noteText || '');
  if (!parsed.images) return [];
  return parsed.images.split('\n').map((l) => l.trim()).filter(Boolean);
}

function photoUrlsFromCacheItems(items) {
  return (items || [])
    .map((item) => canonicalPhotoPersistUrl(item))
    .filter(Boolean);
}

/** Gom URL ảnh từ mọi nguồn — Sheet, payload lưu, cache trình duyệt */
export function unionPhotoUrls(...sources) {
  const seen = new Set();
  const merged = [];
  for (const source of sources) {
    for (const raw of source || []) {
      const canonical = canonicalPhotoPersistUrl(raw) || String(raw || '').trim();
      if (!canonical) continue;
      const key = photoUrlKey(canonical);
      if (key && !seen.has(key)) {
        seen.add(key);
        merged.push(canonical);
      }
    }
  }
  return merged.slice(0, 4);
}

/** Giữ / gom ảnh khi lưu nhật ký — tránh ghi đè do race autosave */
export function mergeDailyNotePreserveImages(existingNoteText, incomingNoteText, extraPhotoUrls = []) {
  const existing = parseDailyNote(existingNoteText || '');
  const incoming = parseDailyNote(incomingNoteText || '');
  const existingUrls = photoUrlsFromText(existingNoteText);
  const incomingUrls = photoUrlsFromText(incomingNoteText);
  const cacheUrls = extraPhotoUrls || [];
  const incomingHasImageSection = /### HÌNH ẢNH/i.test(incomingNoteText || '');

  const mergedUrls = incomingHasImageSection
    ? unionPhotoUrls(incomingUrls, cacheUrls)
    : unionPhotoUrls(existingUrls, incomingUrls, cacheUrls);

  if (mergedUrls.length) {
    incoming.images = mergedUrls.join('\n');
  } else if (!incoming.images && existing.images) {
    incoming.images = existing.images;
  }
  return serializeDailyNote(incoming);
}

/** Lấy URL ảnh đã cache theo ngày (localStorage) */
export function getCachedPhotoUrls(projectId, logDate) {
  if (!projectId || !logDate) return [];
  const dateKey = normalizePhotoDateKey(logDate);
  const cached = readSitePhotosByProject(projectId)[dateKey] || [];
  return photoUrlsFromCacheItems(cached);
}

/** URL ảnh từ nhật ký Sheet — ưu tiên cột SITE_PHOTOS, fallback ghi chú cũ */
export function getPhotoUrlsFromLog(log) {
  if (!log) return [];
  const direct = String(log.SITE_PHOTOS || log.ẢNH_HIỆN_TRƯỜNG || log.ANH_HIEN_TRUONG || '').trim();
  if (direct) {
    return unionPhotoUrls(direct.split('\n').map((l) => l.trim()).filter(Boolean));
  }
  const daily = String(log.DAILY_NOTE || '').trim();
  const fieldNote = String(log.GHI_CHÚ_HIỆN_TRƯỜNG || '').trim();
  return unionPhotoUrls(
    photoUrlsFromText(daily),
    photoUrlsFromText(fieldNote),
    photoUrlsFromText(getLogNoteText(log))
  );
}

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
  const canonical = canonicalPhotoPersistUrl(url);
  if (!canonical) return null;
  return {
    id: norm.id || canonical,
    preview: canonical,
    remote: canonical,
    status: norm.status === 'uploading' ? 'ready' : (norm.status || 'ready'),
  };
}

function photoListKey(item) {
  const raw = typeof item === 'string' ? item : (item?.remote || item?.preview || item?.id || '');
  return extractDriveFileId(raw) || raw;
}

export function writeDateSitePhotos(projectId, date, photos) {
  if (!projectId || !date) return;
  const dateKey = normalizePhotoDateKey(date);
  const serialized = photos.map(serializePhotoForCache).filter(Boolean).slice(0, 4);
  const all = readSitePhotosByProject(projectId);
  if (serialized.length) all[dateKey] = serialized;
  else delete all[dateKey];
  try {
    localStorage.setItem(storageKey(projectId), JSON.stringify(all));
  } catch (e) {
    console.warn('Không lưu được cache ảnh hiện trường', e);
  }
}

export function writeAllSitePhotos(projectId, photosByDate) {
  if (!projectId) return;
  const all = readSitePhotosByProject(projectId);
  for (const [date, photos] of Object.entries(photosByDate || {})) {
    const dateKey = normalizePhotoDateKey(date);
    const serialized = photos.map(serializePhotoForCache).filter(Boolean).slice(0, 4);
    if (serialized.length) all[dateKey] = serialized;
    else delete all[dateKey];
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
    const key = photoListKey(p);
    if (key && !seen.has(key)) {
      seen.add(key);
      merged.push(p);
    }
  }
  for (const p of localPhotos) {
    const key = photoListKey(p);
    const url = p.remote || p.preview;
    if (key && url && !url.startsWith('blob:') && !seen.has(key)) {
      seen.add(key);
      merged.push(p);
    }
  }
  return merged.slice(0, 4);
}
