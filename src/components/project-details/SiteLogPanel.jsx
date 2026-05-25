import React, { useRef, useEffect, useState } from 'react';
import { 
  Users, HardHat, CloudRain, ShieldAlert, ChevronLeft, ChevronRight, ChevronDown, Loader2, 
  Sun, Cloud, CloudLightning, Wrench, Pencil, CalendarClock, AlertCircle, Check, X, CheckCircle2
} from 'lucide-react';
import { api, getDriveAuthUrl } from '../../services/api';
import { toDisplayableImageUrl } from '../../utils/siteImageUrl';
import {
  readSitePhotosByProject,
  writeDateSitePhotos,
  writeAllSitePhotos,
  mergePhotoLists,
  normalizePhotoDateKey,
  getLogNoteText,
  getPhotoUrlsFromLog,
  canonicalPhotoPersistUrl,
  parseDailyNote,
  serializeDailyNote,
} from '../../utils/sitePhotoCache';
import SitePhoto from './SitePhoto';
import {
  parseFlexibleDate as parseDateStr,
  formatDateStr,
  getMondayOfDate,
  getTodayDMY,
  fromInputDateValue,
  toInputDateValue,
  formatDateDMY,
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
        // Giữ dưới ngưỡng 1-request để tránh chunk (GAS Cache tối đa 100KB/chunk)
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

/** Ảnh hiển thị: Sheet là nguồn chính; localStorage chỉ giữ ảnh đang upload */
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
const getWeekNumber = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return weekNo;
};

const getDayOfWeek = (dateStr, weekdays) => {
  const date = parseDateStr(dateStr);
  if (!date || !weekdays) return '';
  return weekdays[date.getDay()];
};

const parseWeather = (weatherText) => {
  const defaults = {
    condition: '-',
    tempHumid: '-',
    detail: ''
  };

  if (!weatherText || weatherText === '-') return defaults;

  if (weatherText.includes('|')) {
    const parts = weatherText.split('|');
    return {
      condition: parts[0] || defaults.condition,
      tempHumid: parts[1] || defaults.tempHumid,
      detail: parts[2] || defaults.detail
    };
  }

  return {
    condition: weatherText,
    tempHumid: defaults.tempHumid,
    detail: defaults.detail
  };
};

const serializeWeather = (w) => {
  return `${w.condition}|${w.tempHumid}|${w.detail}`;
};

const getWeatherIcon = (weather) => {
  const cond = parseWeather(weather).condition;
  const w = String(cond || '').toLowerCase();
  
  if (!w || w === '-' || w === 'null') {
    return <span className="text-slate-500 font-bold">-</span>;
  }
  if (w.includes('nắng') || w.includes('nang') || w.includes('clear') || w.includes('hot')) {
    return <Sun className="w-4 h-4 text-amber-400 shrink-0" />;
  }
  if (w.includes('mưa lớn') || w.includes('mưa to') || w.includes('bão') || w.includes('bao')) {
    return <CloudLightning className="w-4 h-4 text-blue-400 shrink-0" />;
  }
  if (w.includes('mưa') || w.includes('mua')) {
    return <CloudRain className="w-4 h-4 text-blue-300 shrink-0" />;
  }
  if (w.includes('mây') || w.includes('may') || w.includes('âm u') || w.includes('sương')) {
    return <Cloud className="w-4 h-4 text-slate-400 shrink-0" />;
  }
  return <Sun className="w-4 h-4 text-amber-400 shrink-0" />;
};

// Auto-growing textarea helper component
const AutoGrowTextarea = ({ value, onChange, placeholder, disabled, className }) => {
  const textareaRef = useRef(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => {
        onChange(e);
        adjustHeight();
      }}
      placeholder={placeholder}
      disabled={disabled}
      className={className}
      rows={1}
      style={{ overflow: 'hidden', resize: 'none' }}
    />
  );
};

export default function SiteLogPanel({
  project,
  logs,
  weeklyLogs,
  monthlyLogs,
  selectedView,
  setSelectedView,
  selectedDate,
  setSelectedDate,
  selectedWeek,
  setSelectedWeek,
  selectedMonth,
  setSelectedMonth,
  activeLog,
  onUpdateLog,
  onSaveLogImmediate,
  saveStatus,
  onSaveStatusChange
}) {
  const canEdit = useProjectCanEdit();
  const { t, tf, ts } = useI18n();
  const weekdays = t('siteLog.weekdays');
  const datePickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const photosByDateRef = useRef({});
  const persistPhotosTimerRef = useRef(null);
  const syncedPhotoDatesRef = useRef(new Set());
  const projectId = project?.PROJECT_ID || project?.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [photosByDate, setPhotosByDate] = useState({});
  const [liveWeather, setLiveWeather] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [needsDriveAuth, setNeedsDriveAuth] = useState(false);

  useEffect(() => {
    photosByDateRef.current = photosByDate;
  }, [photosByDate]);

  useEffect(() => () => {
    if (persistPhotosTimerRef.current) clearTimeout(persistPhotosTimerRef.current);
  }, []);

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
      persistPhotosToLog(ready);
      onSaveStatusChange?.('Saved');
    }, 450);
  };

  useEffect(() => {
    const fetchWeather = async () => {
      const todayStr = getTodayDMY();
      
      if (selectedDate === todayStr) {
        try {
          const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=10.823&longitude=106.6296&current_weather=true");
          const data = await res.json();
          if (data && data.current_weather) {
            const t = data.current_weather.temperature;
            const code = data.current_weather.weathercode;
            const condition = code <= 3 ? "Nắng đẹp" : code <= 60 ? "Nhiều mây" : "Mưa nhẹ";
            setLiveWeather({
              condition,
              tempHumid: `${t}°C`,
              detail: "Dữ liệu thời tiết trực tuyến"
            });
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setLiveWeather(null);
      }
    };
    fetchWeather();
  }, [selectedDate]);

  const currentPhotos = (photosByDate[normalizePhotoDateKey(selectedDate)] || []).map(normalizePhotoItem);
  const currentImages = currentPhotos;
  const bgUploadCount = currentPhotos.filter((p) => p.status === 'uploading').length;

  const persistPhotosToLog = async (photos) => {
    if (!canEdit) return;
    const urls = photos.map(photoToPersistUrl).filter(Boolean);
    if (photos.length && !urls.length) return;

    const parsedNote = parseDailyNote(getLogNoteText(activeLog));
    parsedNote.images = urls.join('\n');
    const serialized = serializeDailyNote(parsedNote);
    const noteUpdate = { GHI_CHÚ_HIỆN_TRƯỜNG: serialized, DAILY_NOTE: serialized };

    onUpdateLog(noteUpdate);
    if (projectId) writeDateSitePhotos(projectId, selectedDate, photos);

    if (onSaveLogImmediate) {
      try {
        await onSaveLogImmediate(noteUpdate);
        setUploadError('');
      } catch (err) {
        console.error(err);
        setUploadError('Ảnh đã lên Drive nhưng chưa lưu được vào nhật ký chung. Thử lại hoặc liên hệ admin.');
      }
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

  // Đẩy ảnh còn trong cache trình duyệt lên Sheet (sửa dữ liệu cũ chỉ lưu local)
  useEffect(() => {
    if (!canEdit || !projectId || !selectedDate || !onSaveLogImmediate || !logs?.length) return;
    const dateKey = normalizePhotoDateKey(selectedDate);
    if (syncedPhotoDatesRef.current.has(dateKey)) return;

    const serverCount = (photosFromLogs(logs)[dateKey] || []).length;
    const cached = (readSitePhotosByProject(projectId)[dateKey] || [])
      .map(normalizePhotoItem)
      .filter((p) => photoToPersistUrl(p));
    if (cached.length <= serverCount) return;

    syncedPhotoDatesRef.current.add(dateKey);
    void persistPhotosToLog(cached.slice(0, 4));
  }, [logs, selectedDate, projectId, canEdit, onSaveLogImmediate]);

  // Load images when date changes — merge Sheet + localStorage, không ghi đè ảnh đang upload
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
      const rawUrl = await api.uploadSiteImage({ base64: b64, projectId });
      const displayUrl = toDisplayableImageUrl(rawUrl);

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
      persistPhotosToLog(updated);
      return { ...prev, [dateKey]: updated };
    });
  };

  const fetchWeatherAuto = async (e) => {
    e.preventDefault();
    try {
      // Free open-meteo without API key
      const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=10.823&longitude=106.6296&current_weather=true");
      const data = await res.json();
      if (data && data.current_weather) {
        const t = data.current_weather.temperature;
        const code = data.current_weather.weathercode;
        const condition = code <= 3 ? "Nắng đẹp" : code <= 60 ? "Nhiều mây" : "Mưa nhẹ";
        setEditData(prev => ({
          ...prev,
          weatherCondition: condition,
          weatherDetail: `${t}°C — đã cập nhật tự động`,
        }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    setIsEditing(false);
    setEditData(null);
  }, [selectedDate, selectedWeek]);

  const handleStartEdit = () => {
    if (!canEdit) return;
    const parsedNote = parseDailyNote(getLogNoteText(activeLog));
    const parsedW = parseWeather(activeLog?.WEATHER || activeLog?.THỜI_TIẾT || '');
    
    setEditData({
      manpower: activeLog?.MANPOWER !== undefined ? activeLog?.MANPOWER : (activeLog?.NHÂN_LỰC_SITE || 0),
      engineers: activeLog?.ENGINEERS !== undefined ? activeLog?.ENGINEERS : (activeLog?.KỸ_SƯ_GS || 0),
      incidentCount: activeLog?.INCIDENT_COUNT !== undefined ? activeLog?.INCIDENT_COUNT : (parseInt(activeLog?.SỰ_CỐ) || 0),
      weatherCondition: parsedW.condition,
      weatherDetail: parsedW.detail,
      ghiChu: parsedNote.ghiChu,
      congViecChinh: parsedNote.congViecChinh,
      congViecNgayMai: parsedNote.congViecNgayMai,
      vanDeRuiRo: parsedNote.vanDeRuiRo,
      progressActual: parsedNote.progressActual,
      progressPlanned: parsedNote.progressPlanned,
      dayStatus: parsedNote.dayStatus,
      dayStatusSubtext: parsedNote.dayStatusSubtext,
      images: parsedNote.images
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!canEdit) return;
    const serializedNote = serializeDailyNote({
      ghiChu: editData.ghiChu,
      congViecChinh: editData.congViecChinh,
      congViecNgayMai: editData.congViecNgayMai,
      vanDeRuiRo: editData.vanDeRuiRo,
      progressActual: editData.progressActual,
      progressPlanned: editData.progressPlanned,
      dayStatus: editData.dayStatus,
      dayStatusSubtext: editData.dayStatusSubtext,
      images: editData.images || (photosByDate[normalizePhotoDateKey(selectedDate)]
        ? photosByDate[normalizePhotoDateKey(selectedDate)].map(photoToPersistUrl).filter(Boolean).join('\n')
        : '')
    });

    const existingWeather = parseWeather(activeLog?.WEATHER || activeLog?.THỜI_TIẾT || '');
    const serializedW = serializeWeather({
      condition: editData.weatherCondition,
      tempHumid: existingWeather.tempHumid || '-',
      detail: editData.weatherDetail,
    });

    onUpdateLog({
      NHÂN_LỰC_SITE: editData.manpower,
      KỸ_SƯ_GS: editData.engineers,
      SỰ_CỐ: editData.incidentCount,
      THỜI_TIẾT: serializedW,
      GHI_CHÚ_HIỆN_TRƯỜNG: serializedNote
    });

    setIsEditing(false);
  };

  const getDaysOfWeek = (monDateStr) => {
    const monday = parseDateStr(monDateStr);
    if (!monday) return [];
    const days = [];
    const weekdayNames = t('siteLog.weekdays');
    const mondayFirst = [weekdayNames[1], weekdayNames[2], weekdayNames[3], weekdayNames[4], weekdayNames[5], weekdayNames[6], weekdayNames[0]];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = formatDateStr(d);
      
      const log = logs.find(l => (l.LOG_DATE === dateStr || l.NGÀY === dateStr)) || {
        PROJECT_ID: project?.PROJECT_ID || project?.id,
        LOG_DATE: dateStr,
        NGÀY: dateStr,
        MANPOWER: 0,
        NHÂN_LỰC_SITE: 0,
        ENGINEERS: 0,
        KỸ_SƯ_GS: 0,
        WEATHER: '',
        THỜI_TIẾT: '',
        INCIDENT_COUNT: 0,
        SỰ_CỐ: '0',
        DAILY_NOTE: '',
        GHI_CHÚ_HIỆN_TRƯỜNG: '',
        STATUS: 'Draft'
      };
      
      days.push({
        weekday: mondayFirst[i],
        fullName: mondayFirst[i],
        dateStr,
        log
      });
    }
    return days;
  };

  // Compute available items for lists
  const availableDates = Array.from(new Set(logs.map(l => l.LOG_DATE || l.NGÀY))).filter(Boolean);
  if (selectedDate && !availableDates.includes(selectedDate)) {
    availableDates.push(selectedDate);
  }
  availableDates.sort((a, b) => parseDateStr(a) - parseDateStr(b));

  const availableWeeks = Array.from(new Set(weeklyLogs.map(w => w.LOG_DATE))).filter(Boolean);
  if (selectedWeek && !availableWeeks.includes(selectedWeek)) {
    availableWeeks.push(selectedWeek);
  }
  availableWeeks.sort((a, b) => parseDateStr(a) - parseDateStr(b));

  const availableMonths = Array.from(new Set(monthlyLogs.map(m => {
    const parts = m.LOG_DATE ? m.LOG_DATE.split('/') : [];
    return parts.length === 3 ? `${parts[1]}/${parts[2]}` : null;
  }))).filter(Boolean);
  if (selectedMonth && !availableMonths.includes(selectedMonth)) {
    availableMonths.push(selectedMonth);
  }
  availableMonths.sort((a, b) => {
    const partsA = a.split('/');
    const partsB = b.split('/');
    return new Date(partsA[1], partsA[0] - 1) - new Date(partsB[1], partsB[0] - 1);
  });

  // Navigation handlers
  const handlePrev = () => {
    if (selectedView === 'day') {
      const d = parseDateStr(selectedDate) || new Date();
      d.setDate(d.getDate() - 1);
      setSelectedDate(formatDateStr(d));
    } else if (selectedView === 'week') {
      const d = parseDateStr(selectedWeek) || new Date();
      d.setDate(d.getDate() - 7);
      setSelectedWeek(formatDateStr(getMondayOfDate(d)));
    } else if (selectedView === 'month') {
      const parts = selectedMonth.split('/');
      if (parts.length === 2) {
        const m = Number(parts[0]);
        const y = Number(parts[1]);
        const d = new Date(y, m - 1 - 1, 1);
        const newM = String(d.getMonth() + 1).padStart(2, '0');
        setSelectedMonth(`${newM}/${d.getFullYear()}`);
      }
    }
  };

  const handleNext = () => {
    if (selectedView === 'day') {
      const d = parseDateStr(selectedDate) || new Date();
      d.setDate(d.getDate() + 1);
      setSelectedDate(formatDateStr(d));
    } else if (selectedView === 'week') {
      const d = parseDateStr(selectedWeek) || new Date();
      d.setDate(d.getDate() + 7);
      setSelectedWeek(formatDateStr(getMondayOfDate(d)));
    } else if (selectedView === 'month') {
      const parts = selectedMonth.split('/');
      if (parts.length === 2) {
        const m = Number(parts[0]);
        const y = Number(parts[1]);
        const d = new Date(y, m - 1 + 1, 1);
        const newM = String(d.getMonth() + 1).padStart(2, '0');
        setSelectedMonth(`${newM}/${d.getFullYear()}`);
      }
    }
  };

  const handleAddNewDate = (e) => {
    const val = e.target.value;
    if (!val) return;
    setSelectedDate(fromInputDateValue(val));
  };

  const getStatusBadge = () => {
    switch (saveStatus) {
      case 'Saving...':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 animate-pulse transition-opacity duration-300">
            ● {t('siteLog.statusSaving')}
          </span>
        );
      case 'Saved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 transition-opacity duration-300">
            ● {t('siteLog.statusSaved')}
          </span>
        );
      case 'Error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 transition-opacity duration-300">
            ● {t('siteLog.statusError')}
          </span>
        );
      default:
        return null;
    }
  };

  // Check if prev/next buttons should be disabled
  const isPrevDisabled = () => false;
  const isNextDisabled = () => false;

  return (
    <div className="glass-panel p-4 md:p-5 rounded-xl shadow-lg border border-[var(--border-main)]">
      
      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className="w-1 h-10 rounded-full bg-gradient-to-b from-[#5252ff] via-cyan-400 to-emerald-400 shadow-[0_0_18px_rgba(82,82,255,0.45)]"></div>
          <div>
          <h3 className="text-sm font-black text-[var(--text-strong)] uppercase tracking-wider flex items-center gap-2">
            {t('siteLog.title')}
          </h3>
          <div className="mt-1.5 flex items-center gap-2">
            {getStatusBadge()}
            <span className="hidden sm:inline text-[10px] font-semibold text-slate-500">{t('siteLog.subtitle')}</span>
          </div>
          </div>
        </div>
        
        {/* Day/Week Tabs */}
        <div className="flex rounded-lg bg-[var(--bg-panel)] p-0.5 border border-[var(--border-main)] self-start sm:self-auto">
          <button
            onClick={() => setSelectedView('day')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
              selectedView === 'day' ? 'bg-[#5252ff] text-white shadow-[0_0_16px_rgba(82,82,255,0.28)]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('siteLog.day')}
          </button>
          <button
            onClick={() => setSelectedView('week')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
              selectedView === 'week' ? 'bg-[#5252ff] text-white shadow-[0_0_16px_rgba(82,82,255,0.28)]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('siteLog.week')}
          </button>
        </div>
      </div>

      {/* Traversal Navigation Bar */}
      <div className="flex items-center gap-2 bg-[var(--bg-panel)] border border-[var(--border-main)] p-2 rounded-lg mb-3 justify-between">
        <button
          onClick={handlePrev}
          disabled={isPrevDisabled()}
          className="p-1.5 rounded-md hover:bg-[#18233a] text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Day view: clickable date text → opens calendar picker */}
        {selectedView === 'day' && (
          <div 
            className="flex-1 flex items-center justify-center cursor-pointer hover:bg-[var(--bg-hover)] rounded-md py-1.5 transition-all relative"
            onClick={() => {
              if (datePickerRef.current) {
                try { datePickerRef.current.showPicker(); } catch(e) { datePickerRef.current.click(); }
              }
            }}
          >
            <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5 select-none">
              {selectedDate} ({getDayOfWeek(selectedDate, weekdays)})
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </span>
            <input
              type="date"
              ref={datePickerRef}
              value={toInputDateValue(selectedDate)}
              onChange={handleAddNewDate}
              className="absolute opacity-0 pointer-events-none"
              style={{ width: 0, height: 0, border: 'none', padding: 0 }}
              tabIndex={-1}
            />
          </div>
        )}

        {/* Week view: dropdown select */}
        {selectedView === 'week' && (
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="flex-1 bg-transparent border-none text-xs font-semibold text-slate-200 focus:outline-none focus:ring-0 text-center cursor-pointer hover:text-white transition-all"
          >
            {availableWeeks.map((wKey) => {
              const monday = parseDateStr(wKey);
              if (!monday) return null;
              const sunday = new Date(monday);
              sunday.setDate(monday.getDate() + 6);
              const weekNum = getWeekNumber(monday);
              return (
                <option key={wKey} value={wKey} className="bg-[var(--bg-panel)] text-slate-200">
                  {tf('siteLog.weekLabel', { n: weekNum })} ({wKey.substring(0, 5)} - {formatDateStr(sunday).substring(0, 5)})
                </option>
              );
            })}
          </select>
        )}

        <button
          onClick={handleNext}
          disabled={isNextDisabled()}
          className="p-1.5 rounded-md hover:bg-[#18233a] text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {selectedView === 'day' && (
        <>
          {(() => {
            const parsedNote = parseDailyNote(getLogNoteText(activeLog));
            const parsedW = parseWeather(activeLog?.WEATHER || activeLog?.THỜI_TIẾT || '');
            
            const manpower = activeLog?.MANPOWER !== undefined ? activeLog?.MANPOWER : (activeLog?.NHÂN_LỰC_SITE || 0);
            const engineers = activeLog?.ENGINEERS !== undefined ? activeLog?.ENGINEERS : (activeLog?.KỸ_SƯ_GS || 0);
            
            const weatherCond = ts(parsedW.condition || liveWeather?.condition || 'Nắng đẹp');
            const weatherDetail = ts(parsedW.detail || liveWeather?.detail || 'Chưa có thông tin');
            
            const incidents = activeLog?.INCIDENT_COUNT !== undefined ? activeLog?.INCIDENT_COUNT : (parseInt(activeLog?.SỰ_CỐ) || 0);

            const listChinh = parsedNote.congViecChinh.split('\n').map(line => line.replace(/^-\s*/, '').trim()).filter(Boolean);
            const listGhiChu = parsedNote.ghiChu.split('\n').map(line => line.replace(/^-\s*/, '').trim()).filter(Boolean);
            const listNgayMai = parsedNote.congViecNgayMai.split('\n').map(line => line.replace(/^-\s*/, '').trim()).filter(Boolean);

            if (isEditing && editData) {
              return (
                <div className="bg-[var(--bg-panel)]/80 border border-[var(--border-main)] rounded-xl p-5 mb-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-[var(--border-main)] pb-3">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      📝 Chỉnh sửa nhật ký ngày {selectedDate}
                    </h4>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-2.5 py-1 text-[10px] font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Hủy
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-2.5 py-1 text-[10px] font-bold rounded bg-[#5252ff] hover:bg-[#4040ff] text-white transition-all flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Lưu nháp
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Row 1: Manpower and Incident */}
                    <div>
                      <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Nhân lực Site</label>
                      <input
                        type="number"
                        value={editData.manpower}
                        onChange={(e) => setEditData(prev => ({ ...prev, manpower: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-[#141d30] border border-[var(--border-main)] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#5252ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Kỹ sư / GS</label>
                      <input
                        type="number"
                        value={editData.engineers}
                        onChange={(e) => setEditData(prev => ({ ...prev, engineers: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-[#141d30] border border-[var(--border-main)] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#5252ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Số vụ sự cố</label>
                      <input
                        type="number"
                        value={editData.incidentCount}
                        onChange={(e) => setEditData(prev => ({ ...prev, incidentCount: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-[#141d30] border border-[var(--border-main)] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#5252ff]"
                      />
                    </div>

                    {/* Row 2: Weather details */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Thời tiết (Điều kiện)</label>
                        <button 
                          onClick={fetchWeatherAuto}
                          className="text-[9px] text-[#5252ff] hover:text-[#7373ff] flex items-center gap-1 font-bold"
                        >
                          <CloudRain className="w-3 h-3"/> Tự động
                        </button>
                      </div>
                      <select
                        value={editData.weatherCondition}
                        onChange={(e) => setEditData(prev => ({ ...prev, weatherCondition: e.target.value }))}
                        className="w-full bg-[#141d30] border border-[var(--border-main)] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#5252ff]"
                      >
                        <option value="Nắng đẹp">Nắng đẹp</option>
                        <option value="Mây rải rác">Mây rải rác</option>
                        <option value="Nhiều mây">Nhiều mây</option>
                        <option value="Mưa nhẹ">Mưa nhẹ</option>
                        <option value="Mưa lớn">Mưa lớn</option>
                        <option value="Có dông bão">Có dông bão</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Thời tiết chi tiết</label>
                      <input
                        type="text"
                        placeholder="Sáng mưa, chiều nắng"
                        value={editData.weatherDetail}
                        onChange={(e) => setEditData(prev => ({ ...prev, weatherDetail: e.target.value }))}
                        className="w-full bg-[#141d30] border border-[var(--border-main)] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#5252ff]"
                      />
                    </div>

                    {/* Row 3: Progress and Status */}
                    <div>
                      <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Tiến độ thực tế (%)</label>
                      <input
                        type="text"
                        placeholder="4.20%"
                        value={editData.progressActual}
                        onChange={(e) => setEditData(prev => ({ ...prev, progressActual: e.target.value }))}
                        className="w-full bg-[#141d30] border border-[var(--border-main)] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#5252ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Tiến độ kế hoạch (%)</label>
                      <input
                        type="text"
                        placeholder="5.00%"
                        value={editData.progressPlanned}
                        onChange={(e) => setEditData(prev => ({ ...prev, progressPlanned: e.target.value }))}
                        className="w-full bg-[#141d30] border border-[var(--border-main)] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#5252ff]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Trạng thái ngày</label>
                        <select
                          value={editData.dayStatus}
                          onChange={(e) => setEditData(prev => ({ ...prev, dayStatus: e.target.value }))}
                          className="w-full bg-[#141d30] border border-[var(--border-main)] rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#5252ff]"
                        >
                          <option value="Bình thường">Bình thường</option>
                          <option value="Cần theo dõi">Cần theo dõi</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Ảnh ảnh hưởng</label>
                        <input
                          type="text"
                          placeholder="Thời tiết, vật tư"
                          value={editData.dayStatusSubtext}
                          onChange={(e) => setEditData(prev => ({ ...prev, dayStatusSubtext: e.target.value }))}
                          className="w-full bg-[#141d30] border border-[var(--border-main)] rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#5252ff]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Textareas for Tasks and notes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Công việc chính (Mỗi dòng là 1 công việc)</label>
                      <textarea
                        value={editData.congViecChinh}
                        onChange={(e) => setEditData(prev => ({ ...prev, congViecChinh: e.target.value }))}
                        rows={4}
                        className="w-full bg-[#141d30] border border-[var(--border-main)] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#5252ff] resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Ghi chú hiện trường (Mỗi dòng là 1 ghi chú)</label>
                      <textarea
                        value={editData.ghiChu}
                        onChange={(e) => setEditData(prev => ({ ...prev, ghiChu: e.target.value }))}
                        rows={4}
                        className="w-full bg-[#141d30] border border-[var(--border-main)] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#5252ff] resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Công việc ngày mai (Mỗi dòng là 1 công việc)</label>
                      <textarea
                        value={editData.congViecNgayMai}
                        onChange={(e) => setEditData(prev => ({ ...prev, congViecNgayMai: e.target.value }))}
                        rows={4}
                        className="w-full bg-[#141d30] border border-[var(--border-main)] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#5252ff] resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Vấn đề / Rủi ro cần lưu ý (Nếu có)</label>
                      <textarea
                        value={editData.vanDeRuiRo}
                        onChange={(e) => setEditData(prev => ({ ...prev, vanDeRuiRo: e.target.value }))}
                        rows={4}
                        className="w-full bg-[#141d30] border border-[var(--border-main)] rounded-md p-2 text-xs text-white focus:outline-none focus:border-[#5252ff] resize-y"
                        placeholder="Nhập vấn đề/rủi ro hoặc bỏ trống nếu không có..."
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 border-t border-[var(--border-main)] pt-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-xs font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 text-xs font-bold rounded bg-[#5252ff] hover:bg-[#4040ff] text-white transition-all"
                    >
                      Lưu thay đổi
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <>
                {/* Top Row: 4 Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  {/* NHÂN LỰC SITE */}
                  <div className="bg-[#0b1221] border border-[#22304a] border-l-[#5252ff] border-l-2 rounded-lg p-3.5 flex items-center gap-3.5 shadow-[0_10px_28px_rgba(0,0,0,0.18)] hover:border-[#33466d] transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-[#5252ff]/12 text-[#8585ff] flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{t('siteLog.manpower')}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-white">{manpower}</span>
                        <span className="text-[10px] text-slate-500">{t('siteLog.people')}</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5">{t('siteLog.engineers')}: <span className="text-slate-200 font-semibold">{engineers}</span></p>
                    </div>
                  </div>

                  {/* THỜI TIẾT */}
                  <div className="bg-[#0b1221] border border-[#22304a] border-l-cyan-400/80 border-l-2 rounded-lg p-3.5 flex items-center gap-3.5 shadow-[0_10px_28px_rgba(0,0,0,0.18)] hover:border-[#33466d] transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-300 flex items-center justify-center shrink-0">
                      {getWeatherIcon(activeLog?.WEATHER || activeLog?.THỜI_TIẾT)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{t('siteLog.weather')}</p>
                      <p className="text-xs font-bold text-white leading-tight">{weatherCond}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-tight truncate" title={weatherDetail}>{weatherDetail}</p>
                    </div>
                  </div>

                  {/* CÔNG VIỆC CHÍNH */}
                  <div className="bg-[#0b1221] border border-[#22304a] border-l-emerald-400/80 border-l-2 rounded-lg p-3.5 flex items-center gap-3.5 shadow-[0_10px_28px_rgba(0,0,0,0.18)] hover:border-[#33466d] transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{t('siteLog.mainTasks')}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-white">{listChinh.length}</span>
                        <span className="text-[10px] text-slate-500">{t('siteLog.items')}</span>
                      </div>
                      <ul className="text-[9px] text-slate-400 mt-1 space-y-0.5 list-disc pl-3">
                        {listChinh.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="truncate" title={item}>{ts(item)}</li>
                        ))}
                        {listChinh.length === 0 && <li className="italic text-slate-500">{t('siteLog.noRecord')}</li>}
                      </ul>
                    </div>
                  </div>

                  {/* SỰ CỐ */}
                  <div className={`bg-[#0b1221] border border-[#22304a] ${incidents > 0 ? 'border-l-red-400/80' : 'border-l-emerald-400/80'} border-l-2 rounded-lg p-3.5 flex items-center gap-3.5 shadow-[0_10px_28px_rgba(0,0,0,0.18)] hover:border-[#33466d] transition-colors`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${incidents > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{t('siteLog.incidents')}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-white">{incidents}</span>
                        <span className="text-[10px] text-slate-500">{t('siteLog.incidentsUnit')}</span>
                      </div>
                      <div className="mt-1">
                        <span className={`inline-block text-[8px] font-bold px-2 py-1 rounded-full border ${incidents > 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                          {incidents > 0 ? t('siteLog.monitoring') : t('siteLog.normal')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GHI CHÚ HIỆN TRƯỜNG */}
                <div className="bg-[#0b1221] border border-[#22304a] rounded-lg p-4 mb-3 relative group shadow-[0_10px_28px_rgba(0,0,0,0.16)]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5 text-cyan-400" /> {t('siteLog.siteNotes')}
                    </p>
                    {canEdit && (
                    <button 
                      onClick={handleStartEdit}
                      className="w-7 h-7 rounded-md bg-[#18233a] border border-[#2b3a5c] text-slate-300 hover:text-white flex items-center justify-center hover:bg-[#243250] transition-all"
                      title="Chỉnh sửa nhật ký"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    )}
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed min-h-[38px]">
                    {listGhiChu.map((item, idx) => (
                      <li key={idx}>{ts(item)}</li>
                    ))}
                    {listGhiChu.length === 0 && <li className="italic text-slate-400 list-none pl-0">{t('siteLog.noNotes')}</li>}
                  </ul>
                </div>

                {/* Columns: TÓM TẮT NGÀY & CÔNG VIỆC NGÀY MAI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  {/* TÓM TẮT NGÀY */}
                  <div className="bg-[#0b1221] border border-[#22304a] rounded-lg p-4 flex flex-col justify-between shadow-[0_10px_28px_rgba(0,0,0,0.16)]">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> {t('siteLog.daySummary')}
                      </p>
                      
                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                        <div>
                          <p className="text-[9px] text-slate-500">{t('siteLog.actualProgress')}</p>
                          <p className="text-sm font-bold text-white mt-0.5">{parsedNote.progressActual || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500">{t('siteLog.variance')}</p>
                          {(() => {
                            const actual = parseFloat(parsedNote.progressActual) || 0;
                            const planned = parseFloat(parsedNote.progressPlanned) || 0;
                            const diff = Math.round(actual - planned);
                            const isNeg = diff < 0;
                            return (
                              <p className={`text-sm font-bold mt-0.5 ${isNeg ? 'text-red-400' : 'text-green-400'}`}>
                                {isNeg ? '' : '+'}{diff}%
                              </p>
                            );
                          })()}
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500">{t('siteLog.dayStatus')}</p>
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            <span className={`w-2 h-2 rounded-full ${parsedNote.dayStatus === 'Bình thường' ? 'bg-green-500' : 'bg-amber-500'}`} />
                            <span className="text-[10px] font-semibold text-white">{ts(parsedNote.dayStatus || 'Bình thường')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      {/* Progress bar */}
                      <div className="w-full bg-[#141d30] rounded-full h-2 mb-1.5 border border-[#22304a] overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, Math.max(0, ((parseFloat(parsedNote.progressActual) || 0) / (parseFloat(parsedNote.progressPlanned) || 1)) * 100))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 gap-3">
                        <span>{t('siteLog.planned')}: {parsedNote.progressPlanned || '-'}</span>
                        <span className="truncate">{t('siteLog.impactVariance')}: {parsedNote.dayStatusSubtext || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* CÔNG VIỆC NGÀY MAI */}
                  <div className="bg-[#0b1221] border border-[#22304a] rounded-lg p-4 shadow-[0_10px_28px_rgba(0,0,0,0.16)]">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 text-indigo-400" /> {t('siteLog.tomorrowTasks')}
                      </p>
                      <span className="text-[8px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                        {t('siteLog.highPriority')}
                      </span>
                    </div>
                    
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 min-h-[58px]">
                      {listNgayMai.map((item, idx) => (
                        <li key={idx}>{ts(item)}</li>
                      ))}
                      {listNgayMai.length === 0 && <li className="italic text-slate-400 list-none pl-0">{t('siteLog.noTomorrowTasks')}</li>}
                    </ul>
                  </div>
                </div>

                {/* VẤN ĐỀ / RỦI RO CẦN LƯU Ý */}
                {parsedNote.vanDeRuiRo && (
                  <div className="bg-[#1f1616] border border-red-950 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-500/15 text-red-400 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider mb-0.5">{t('siteLog.risks')}</p>
                        <p className="text-xs text-slate-300 leading-tight">{ts(parsedNote.vanDeRuiRo)}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full shrink-0">
                      {t('siteLog.monitoring')}
                    </span>
                  </div>
                )}
              </>
            );
          })()}

          {/* Ảnh hiện trường */}
          <div className="mt-3 bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-main)] bg-[var(--bg-hover)]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                📷 {t('siteLog.sitePhotos')}
                <span className="ml-1 text-[8px] font-bold bg-[#5252ff]/10 text-[#8585ff] border border-[#5252ff]/20 px-1.5 py-0.5 rounded-full">{tf('siteLog.photosCount', { n: currentImages.length })}</span>
                {bgUploadCount > 0 && (
                  <span className="ml-1 text-[8px] font-semibold text-amber-500/90 inline-flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Lưu Drive nền ({bgUploadCount})
                  </span>
                )}
              </p>
              <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
              {canEdit && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={currentImages.length >= 4}
                className={`flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded-md transition-all ${
                  currentImages.length >= 4 ? 'opacity-50 cursor-not-allowed text-slate-500 bg-slate-800' : 'text-[#8585ff] hover:text-white bg-[#5252ff]/10 hover:bg-[#5252ff]/20 border border-[#5252ff]/20 cursor-pointer'
                }`}
              >
                + Thêm ảnh
              </button>
              )}
            </div>

            {uploadError && (
              <div className="mx-3 mt-2 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/30 text-[11px] text-red-600 leading-snug space-y-2">
                <p>{uploadError}</p>
                {needsDriveAuth && (
                  <div className="space-y-1.5">
                    <a
                      href={getDriveAuthUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#5252ff] text-white text-[10px] font-bold hover:bg-[#4040ff] transition-colors"
                    >
                      Cấp quyền Drive (mở tab mới)
                    </a>
                    <p className="text-[9px] text-red-500/80 break-all select-all">
                      Link: {getDriveAuthUrl()}
                    </p>
                    <p className="text-[9px] text-red-500/70">Phải có <strong>?action=test-drive</strong> ở cuối URL. Thấy JSON &quot;ok&quot;: true là được.</p>
                  </div>
                )}
              </div>
            )}

            <div className="p-3 border-b border-[var(--border-main)]">
              {currentImages.length === 0 ? (
                <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-3 py-5 border border-dashed border-[var(--border-main)] rounded-lg bg-[var(--bg-main)]/40">
                  <div className="w-12 h-12 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
                    📷
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-main)]">{t('siteLog.noPhotos')}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1 max-w-[320px]">{t('siteLog.noPhotosHint')}</p>
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

            <div className="px-3 py-2 bg-[var(--bg-hover)]/50 flex items-center justify-end">
              <p className="text-[9px] text-[var(--text-muted)]">{formatDateDMY(new Date())} · {activeLog?.UPDATED_BY || t('siteLog.supervisor')}</p>
            </div>
          </div>
        </>
      )}

      {selectedView === 'week' && (
        <>
          <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-lg overflow-hidden mb-4">
            <div className="p-3 border-b border-[var(--border-main)] bg-[var(--bg-hover)]">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                📅 {t('table.weekCalendar')}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-main)] text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-hover)]/50">
                    <th className="py-2 px-3">{t('table.weekday')}</th>
                    <th className="py-2 px-3">{t('table.date')}</th>
                    <th className="py-2 px-3 text-center">{t('table.staff')}</th>
                    <th className="py-2 px-3 text-center">{t('table.engineers')}</th>
                    <th className="py-2 px-3">{t('table.weather')}</th>
                    <th className="py-2 px-3 text-center">{t('table.incidents')}</th>
                    <th className="py-2 px-3">{t('table.mainNote')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-main)]/50">
                  {getDaysOfWeek(selectedWeek).map((day, idx) => {
                    const isToday = day.dateStr === formatDateStr(new Date());
                    const man = day.log.MANPOWER !== undefined ? day.log.MANPOWER : (day.log.NHÂN_LỰC_SITE || 0);
                    const eng = day.log.ENGINEERS !== undefined ? day.log.ENGINEERS : (day.log.KỸ_SƯ_GS || 0);
                    const weatherText = day.log.WEATHER !== undefined ? day.log.WEATHER : (day.log.THỜI_TIẾT || '');
                    const incidents = day.log.INCIDENT_COUNT !== undefined ? day.log.INCIDENT_COUNT : (parseInt(day.log.SỰ_CỐ) || 0);
                    const rawNote = day.log.DAILY_NOTE !== undefined ? day.log.DAILY_NOTE : (day.log.GHI_CHÚ_HIỆN_TRƯỜNG || '');
                    let note = '';
                    if (rawNote && rawNote.trim()) {
                      if (rawNote.includes('###')) {
                        const parsedDayNote = parseDailyNote(rawNote);
                        note = parsedDayNote.ghiChu.split('\n').map(l => l.replace(/^-\s*/, '').trim()).filter(Boolean).join(', ');
                      } else {
                        note = rawNote.trim();
                      }
                    }
                    
                    return (
                      <tr 
                        key={idx} 
                        onClick={() => {
                          setSelectedDate(day.dateStr);
                          setSelectedView('day');
                        }}
                        className={`hover:bg-[#141d30]/50 transition-colors cursor-pointer text-xs ${
                          isToday ? 'bg-[#5252ff]/5 border-l-2 border-[#5252ff]' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-white">{day.weekday}</td>
                        <td className="py-2.5 px-3 text-[var(--text-muted)] font-medium">{day.dateStr.substring(0, 5)}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-white">
                          <div className="flex items-center justify-center gap-1">
                            <span className="text-[#3b82f6]">{man}</span>
                            <span className="text-[10px] text-slate-500 font-normal">{t('siteLog.people')}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-300">{eng}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            {getWeatherIcon(weatherText)}
                            <span className="truncate max-w-[80px]">{ts(weatherText.split('|')[0] || '-')}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                            incidents > 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {incidents}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 truncate max-w-[150px] font-normal" title={note}>
                          {note ? ts(note) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Table Footer Legend */}
            <div className="px-3 py-2 bg-[var(--bg-hover)]/30 border-t border-[var(--border-main)] flex items-center justify-between text-[10px] text-slate-500">
              <span className="font-medium text-slate-400">💡 {t('table.clickRowHint')}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 font-semibold px-1 mb-4">
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#3b82f6]" /> {t('table.siteStaff')}</span>
            <span className="flex items-center gap-1.5"><HardHat className="w-3.5 h-3.5 text-slate-400" /> {t('siteLog.engineers')}</span>
            <span className="flex items-center gap-1.5"><CloudRain className="w-3.5 h-3.5 text-slate-400" /> {t('table.weather')}</span>
            <span className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-red-500" /> {t('table.incidents')}</span>
          </div>

          <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-lg p-3">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">{t('siteLog.weekNotes')}</p>
            <AutoGrowTextarea
              value={activeLog.weeklyAssessment !== undefined ? activeLog.weeklyAssessment : (activeLog.WEEKLY_ASSESSMENT || '')}
              onChange={(e) => canEdit && onUpdateLog('WEEKLY_ASSESSMENT', e.target.value)}
              disabled={!canEdit}
              className="w-full bg-transparent border-none text-xs text-slate-300 focus:ring-0 focus:outline-none placeholder-[#4d5e7a] min-h-[60px]"
              placeholder={canEdit ? 'Nhập ghi chú tuần này...' : 'Chỉ xem — bạn chưa được gán dự án này'}
            />
          </div>
        </>
      )}

    </div>
  );
}
