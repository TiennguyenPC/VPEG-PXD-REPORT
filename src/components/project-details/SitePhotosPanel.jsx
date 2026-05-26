import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { api, getDriveAuthUrl } from '../../services/api';
import { toDisplayableImageUrl } from '../../utils/siteImageUrl';
import {
  readSitePhotosByProject,
  writeDateSitePhotos,
  writeAllSitePhotos,
  mergePhotoLists,
  normalizePhotoDateKey,
  getPhotoUrlsFromLog,
  canonicalPhotoPersistUrl,
} from '../../utils/sitePhotoCache';
import SitePhoto from './SitePhoto';
import {
  parseFlexibleDate as parseDateStr,
  formatDateStr,
  fromInputDateValue,
  toInputDateValue,
} from '../../utils/timelineDates';
import { useProjectCanEdit } from '../../context/ProjectEditContext';
import { useI18n } from '../../context/I18nContext';

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onerror = () => reject(new Error('Không đọc được file ảnh'));
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onerror = () => reject(new Error('File không phải ảnh hợp lệ'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1280;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.78;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > 260_000 && quality > 0.42) {
          quality -= 0.07;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
    };
  });
};

const normalizePhotoItem = (item) => {
  if (typeof item === 'string') {
    return { id: item, preview: item, remote: item, status: 'ready' };
  }
  return item;
};

const photoToPersistUrl = canonicalPhotoPersistUrl;

const urlsToPhotoItems = (urls) => urls.map((url) => ({
  id: url,
  preview: toDisplayableImageUrl(url),
  remote: url,
  status: 'ready',
}));

const buildPhotosForDate = (serverPhotos, prevPhotos) => {
  const pending = (prevPhotos || []).filter((p) => {
    const item = normalizePhotoItem(p);
    return item.status === 'uploading' || item.preview?.startsWith('blob:');
  });
  return mergePhotoLists(serverPhotos, pending).slice(0, 4);
};

const photosFromLogs = (logsList) => {
  const out = {};
  for (const log of logsList || []) {
    const dateKey = normalizePhotoDateKey(log.LOG_DATE || log.NGÀY);
    if (!dateKey) continue;
    const imageUrls = getPhotoUrlsFromLog(log);
    if (!imageUrls.length) continue;
    out[dateKey] = urlsToPhotoItems(imageUrls);
  }
  return out;
};

export default function SitePhotosPanel({
  project,
  logs,
  selectedDate,
  setSelectedDate,
  activeLog,
  onSaveSitePhotos,
  onLogsUpdated,
  onSaveStatusChange,
}) {
  const canEdit = useProjectCanEdit();
  const { t, tf } = useI18n();
  const fileInputRef = useRef(null);
  const datePickerRef = useRef(null);
  const photosByDateRef = useRef({});
  const persistPhotosTimerRef = useRef(null);
  const syncedPhotoDatesRef = useRef(new Set());
  const projectId = project?.PROJECT_ID || project?.id;
  const [photosByDate, setPhotosByDate] = useState({});
  const [uploadError, setUploadError] = useState('');
  const [needsDriveAuth, setNeedsDriveAuth] = useState(false);
  const [syncingSheet, setSyncingSheet] = useState(false);

  useEffect(() => {
    photosByDateRef.current = photosByDate;
  }, [photosByDate]);

  useEffect(() => () => {
    if (persistPhotosTimerRef.current) clearTimeout(persistPhotosTimerRef.current);
  }, []);

  const currentPhotos = (photosByDate[normalizePhotoDateKey(selectedDate)] || []).map(normalizePhotoItem);
  const bgUploadCount = currentPhotos.filter((p) => p.status === 'uploading').length;
  const serverPhotoCount = activeLog ? getPhotoUrlsFromLog(activeLog).length : 0;
  const readyLocalCount = currentPhotos.filter((p) => photoToPersistUrl(normalizePhotoItem(p))).length;
  const needsSheetSync = canEdit && readyLocalCount > serverPhotoCount;

  const persistPhotosToSheet = async (photos) => {
    if (!canEdit) return;
    const urls = photos.map(photoToPersistUrl).filter(Boolean);
    if (photos.length && !urls.length) return;

    if (projectId) writeDateSitePhotos(projectId, selectedDate, photos);

    if (onSaveSitePhotos) {
      await onSaveSitePhotos(urls, selectedDate, activeLog?._rowIndex);
      setUploadError('');
    }
  };

  const schedulePersistPhotos = (dateKey) => {
    if (persistPhotosTimerRef.current) clearTimeout(persistPhotosTimerRef.current);
    persistPhotosTimerRef.current = setTimeout(() => {
      const photos = (photosByDateRef.current[dateKey] || []).map(normalizePhotoItem);
      const stillUploading = photos.some((p) => p.status === 'uploading');
      if (stillUploading) {
        schedulePersistPhotos(dateKey);
        return;
      }
      const ready = photos.filter((p) => p.status === 'ready' && photoToPersistUrl(p));
      if (!ready.length) return;
      void persistPhotosToSheet(ready).then(() => onSaveStatusChange?.('Saved'));
    }, 450);
  };

  const handleSyncPhotosToSheet = async () => {
    if (!canEdit || syncingSheet) return;
    setSyncingSheet(true);
    setUploadError('');
    try {
      const ready = currentPhotos.map(normalizePhotoItem).filter((p) => photoToPersistUrl(p));
      await persistPhotosToSheet(ready.slice(0, 4));
      onSaveStatusChange?.('Saved');
    } catch (err) {
      console.error(err);
      setUploadError(err?.message || 'Không lưu được ảnh lên Google Sheet. Thử đăng nhập lại.');
      onSaveStatusChange?.('Error');
    } finally {
      setSyncingSheet(false);
    }
  };

  useEffect(() => {
    if (!projectId) return;
    writeAllSitePhotos(projectId, photosByDate);
  }, [photosByDate, projectId]);

  useEffect(() => {
    if (!logs?.length && !projectId) return;
    const fromServer = photosFromLogs(logs);
    setPhotosByDate((prev) => {
      const dateKeys = new Set([
        ...Object.keys(fromServer),
        ...Object.keys(prev).map(normalizePhotoDateKey),
      ]);
      const next = { ...prev };
      let changed = false;
      for (const rawDate of dateKeys) {
        const dateKey = normalizePhotoDateKey(rawDate);
        const serverPhotos = fromServer[dateKey] || [];
        const merged = buildPhotosForDate(serverPhotos, prev[dateKey] || prev[rawDate] || []);
        const prevList = (prev[dateKey] || prev[rawDate] || []).map(normalizePhotoItem);
        if (JSON.stringify(merged) !== JSON.stringify(prevList)) {
          next[dateKey] = merged;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [logs, projectId]);

  useEffect(() => {
    if (!canEdit || !projectId || !selectedDate || !onSaveSitePhotos || !logs?.length) return;
    const dateKey = normalizePhotoDateKey(selectedDate);
    if (syncedPhotoDatesRef.current.has(dateKey)) return;

    const serverCount = (photosFromLogs(logs)[dateKey] || []).length;
    const cached = (readSitePhotosByProject(projectId)[dateKey] || [])
      .map(normalizePhotoItem)
      .filter((p) => photoToPersistUrl(p));
    if (cached.length <= serverCount) return;

    syncedPhotoDatesRef.current.add(dateKey);
    void persistPhotosToSheet(cached.slice(0, 4));
  }, [logs, selectedDate, projectId, canEdit, onSaveSitePhotos]);

  useEffect(() => {
    if (!selectedDate) return;
    const dateKey = normalizePhotoDateKey(selectedDate);
    const imageUrls = activeLog ? getPhotoUrlsFromLog(activeLog) : [];

    setPhotosByDate((prev) => {
      const local = prev[dateKey] || prev[selectedDate] || [];
      const hasPending = local.some((p) => {
        const item = normalizePhotoItem(p);
        return item.status === 'uploading' || item.preview?.startsWith('blob:');
      });
      if (hasPending) return prev;

      const serverPhotos = urlsToPhotoItems(imageUrls);
      const merged = buildPhotosForDate(serverPhotos, local);
      const prevList = local.map(normalizePhotoItem);
      if (JSON.stringify(merged) === JSON.stringify(prevList)) return prev;
      return { ...prev, [dateKey]: merged };
    });
  }, [activeLog, selectedDate, projectId]);

  const uploadPhotoInBackground = async (item, dateKey) => {
    try {
      const b64 = await compressImage(item.file);
      const uploadResult = await api.uploadSiteImage({
        base64: b64,
        projectId,
        logDate: dateKey,
        _rowIndex: activeLog?._rowIndex,
      });
      const rawUrl = uploadResult?.url || uploadResult;
      const displayUrl = toDisplayableImageUrl(rawUrl);

      if (uploadResult?.dailyLogs && onLogsUpdated) {
        onLogsUpdated(uploadResult.dailyLogs);
      }

      setPhotosByDate((prev) => {
        const list = (prev[dateKey] || []).map((p) => {
          const norm = normalizePhotoItem(p);
          if (norm.id !== item.id) return norm;
          if (norm.preview?.startsWith('blob:')) {
            URL.revokeObjectURL(norm.preview);
          }
          return {
            ...norm,
            remote: rawUrl,
            preview: displayUrl,
            status: 'ready',
          };
        });
        const next = { ...prev, [dateKey]: list };
        photosByDateRef.current = next;
        return next;
      });
      schedulePersistPhotos(dateKey);
      setUploadError('');
      setNeedsDriveAuth(false);
    } catch (err) {
      console.error(err);
      setPhotosByDate((prev) => ({
        ...prev,
        [dateKey]: [...(prev[dateKey] || [])].map((p) => {
          const norm = normalizePhotoItem(p);
          if (norm.id !== item.id) return norm;
          return { ...norm, status: 'error' };
        }),
      }));

      let msg = String(err?.message || 'Tải ảnh thất bại')
        .replace(/^Error:\s*/i, '')
        .replace(/^Exception:\s*/i, '');
      setNeedsDriveAuth(/Drive|DriveApp|quyền|từ chối|denied/i.test(msg));
      if (/UrlFetchApp|external_request/i.test(msg)) {
        msg = 'Backend chưa cập nhật. Chạy: npm run gas:sync (hoặc nhờ admin deploy Apps Script).';
      } else if (/Invalid API endpoint|upload-image-chunk/i.test(msg)) {
        msg = 'Backend chưa deploy bản mới. Chạy: npm run gas:sync → thử lại.';
      } else if (/Drive|DriveApp|từ chối|denied/i.test(msg)) {
        msg = 'Upload Drive thất bại. Chạy npm run gas:sync, mở link test-drive, rồi thử lại.';
      } else if (msg.length > 160) {
        msg = msg.slice(0, 160) + '…';
      }
      setUploadError(msg);
      onSaveStatusChange?.('Error');
    }
  };

  const handleFileSelect = (e) => {
    if (!canEdit) return;
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const slotsLeft = 4 - currentPhotos.length;
    if (slotsLeft <= 0) return;
    const filesToUpload = files.slice(0, slotsLeft);
    const dateKey = normalizePhotoDateKey(selectedDate);

    setUploadError('');
    setNeedsDriveAuth(false);

    const pendingItems = filesToUpload.map((file) => ({
      id: `pending_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      preview: URL.createObjectURL(file),
      remote: null,
      status: 'uploading',
      file,
    }));

    setPhotosByDate((prev) => {
      const next = {
        ...prev,
        [dateKey]: [...(prev[dateKey] || prev[selectedDate] || []), ...pendingItems],
      };
      photosByDateRef.current = next;
      return next;
    });

    onSaveStatusChange?.('Saving...');
    void Promise.all(pendingItems.map((item) => uploadPhotoInBackground(item, dateKey)));

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (indexToRemove) => {
    if (!canEdit) return;
    setPhotosByDate((prev) => {
      const dateKey = normalizePhotoDateKey(selectedDate);
      const list = (prev[dateKey] || prev[selectedDate] || []).map(normalizePhotoItem);
      const removed = list[indexToRemove];
      if (removed?.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(removed.preview);
      }
      const updated = list.filter((_, idx) => idx !== indexToRemove);
      void persistPhotosToSheet(updated);
      return { ...prev, [dateKey]: updated };
    });
  };

  const handlePrevDay = () => {
    const d = parseDateStr(selectedDate) || new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatDateStr(d));
  };

  const handleNextDay = () => {
    const d = parseDateStr(selectedDate) || new Date();
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatDateStr(d));
  };

  const handleDatePick = (e) => {
    const val = e.target.value;
    if (!val) return;
    setSelectedDate(fromInputDateValue(val));
  };

  return (
    <div className="glass-panel p-4 md:p-5 rounded-xl shadow-lg border border-[var(--border-main)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-1 h-10 rounded-full bg-gradient-to-b from-emerald-400 via-cyan-400 to-[#5252ff] shadow-[0_0_18px_rgba(52,211,153,0.35)]" />
          <div>
            <h3 className="text-sm font-black text-[var(--text-strong)] uppercase tracking-wider">
              📷 {t('siteLog.sitePhotos')}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-slate-400 hover:text-slate-200 transition-all"
            aria-label="Ngày trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => datePickerRef.current?.showPicker?.() || datePickerRef.current?.click()}
            className="px-3 py-1.5 rounded-md bg-[var(--bg-hover)] border border-[var(--border-main)] text-xs font-bold text-white min-w-[108px] text-center"
          >
            {selectedDate || '—'}
          </button>
          <input
            ref={datePickerRef}
            type="date"
            value={toInputDateValue(selectedDate)}
            onChange={handleDatePick}
            className="sr-only"
          />
          <button
            type="button"
            onClick={handleNextDay}
            className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-slate-400 hover:text-slate-200 transition-all"
            aria-label="Ngày sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-main)] bg-[var(--bg-hover)]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            {tf('siteLog.photosCount', { n: currentPhotos.length })}
            {bgUploadCount > 0 && (
              <span className="ml-1 text-[8px] font-semibold text-amber-500/90 inline-flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Đang tải ({bgUploadCount})
              </span>
            )}
          </p>
          <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          {canEdit && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={currentPhotos.length >= 4}
              className={`flex items-center gap-1 text-[9px] font-semibold px-2.5 py-1.5 rounded-md transition-all ${
                currentPhotos.length >= 4
                  ? 'opacity-50 cursor-not-allowed text-slate-500 bg-slate-800'
                  : 'text-white bg-[#5252ff] hover:bg-[#4040ff] cursor-pointer'
              }`}
            >
              + Tải ảnh lên
            </button>
          )}
        </div>

        {needsSheetSync && (
          <div className="mx-3 mt-2 px-3 py-2.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-200 leading-snug flex flex-col sm:flex-row sm:items-center gap-2">
            <p className="flex-1">Ảnh chưa đồng bộ Google Sheet — tài khoản khác chưa thấy.</p>
            <button
              type="button"
              onClick={handleSyncPhotosToSheet}
              disabled={syncingSheet}
              className="shrink-0 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold disabled:opacity-60"
            >
              {syncingSheet ? 'Đang lưu...' : 'Lưu lên Sheet'}
            </button>
          </div>
        )}

        {uploadError && (
          <div className="mx-3 mt-2 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/30 text-[11px] text-red-600 leading-snug space-y-2">
            <p>{uploadError}</p>
            {needsDriveAuth && (
              <a
                href={getDriveAuthUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#5252ff] text-white text-[10px] font-bold hover:bg-[#4040ff] transition-colors"
              >
                Cấp quyền Drive
              </a>
            )}
          </div>
        )}

        <div className="p-3">
          {currentPhotos.length === 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-3 py-8 border border-dashed border-[var(--border-main)] rounded-lg bg-[var(--bg-main)]/40">
              <div className="w-14 h-14 rounded-xl bg-[var(--bg-hover)] flex items-center justify-center text-2xl shrink-0">
                📷
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-main)]">{t('siteLog.noPhotos')}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {currentPhotos.map((photo, i) => {
                const item = normalizePhotoItem(photo);
                return (
                  <SitePhoto
                    key={item.id || i}
                    src={item.remote || item.preview}
                    status={item.status}
                    priority={i < 4}
                    onRemove={canEdit ? () => removeImage(i) : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="px-3 py-2 bg-[var(--bg-hover)]/50 flex items-center justify-end text-[9px] text-[var(--text-muted)]">
          <span>{selectedDate} · {activeLog?.UPDATED_BY || t('siteLog.supervisor')}</span>
        </div>
      </div>
    </div>
  );
}
