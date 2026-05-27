import React, { useRef, useEffect, useState } from 'react';
import { 
  Users, HardHat, CloudRain, ShieldAlert, ChevronLeft, ChevronRight, ChevronDown,
  Sun, Cloud, CloudLightning, Wrench, Pencil, CalendarClock, AlertCircle, Check, X, CheckCircle2
} from 'lucide-react';
import {
  getLogNoteText,
  parseDailyNote,
  serializeDailyNote,
} from '../../utils/sitePhotoCache';
import {
  buildConstructionOptions,
  formatEntriesAsSummaryLines,
  getRemainingPercentForTask,
  parseProgressEntries,
  serializeProgressEntries,
  sumProgressDeltasFromLogs,
  taskProgressKey,
  validateProgressEntries,
} from '../../utils/siteLogConstructionProgress';
import {
  parseFlexibleDate as parseDateStr,
  formatDateStr,
  getMondayOfDate,
  getTodayDMY,
  fromInputDateValue,
  toInputDateValue,
} from '../../utils/timelineDates';
import {
  calcDailyActualProjectPercent,
  calcDailyPlannedProjectPercent,
  getPlannedWorkLabelsForDay,
} from '../../utils/dailyPlannedProgress';
import {
  computeTomorrowWork,
  parseDismissedTomorrowKeys,
  serializeDismissedTomorrowKeys,
  addDaysDMY,
} from '../../utils/siteLogTomorrowWork';
import { useProjectCanEdit } from '../../context/ProjectEditContext';
import { useI18n } from '../../context/I18nContext';

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
  constructions = [],
  moduleBundles = {},
}) {
  const canEdit = useProjectCanEdit();
  const { t, tf, ts } = useI18n();
  const weekdays = t('siteLog.weekdays');
  const datePickerRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [progressSaveError, setProgressSaveError] = useState('');
  const [liveWeather, setLiveWeather] = useState(null);

  const constructionOptions = buildConstructionOptions(constructions);

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
    const noteText = getLogNoteText(activeLog);
    const parsedNote = parseDailyNote(noteText);
    const parsedW = parseWeather(activeLog?.WEATHER || activeLog?.THỜI_TIẾT || '');
    const progressEntries = parseProgressEntries(noteText);
    const projectId = project?.PROJECT_ID || project?.id;
    const bundles = {
      permits: moduleBundles.permits,
      designs: moduleBundles.designs,
      procurements: moduleBundles.procurements,
      constructions: constructions.length ? constructions : moduleBundles.constructions,
      handovers: moduleBundles.handovers,
    };
    const constructionRows = bundles.constructions || [];
    const dismissedTomorrow = parseDismissedTomorrowKeys(noteText);
    const tomorrowWork = computeTomorrowWork({
      logDate: selectedDate,
      projectId,
      bundles,
      logs,
      constructions: constructionRows,
      dismissedKeys: dismissedTomorrow,
      savedTomorrowText: parsedNote.congViecNgayMai,
    });
    const autoOnly = computeTomorrowWork({
      logDate: selectedDate,
      projectId,
      bundles,
      logs,
      constructions: constructionRows,
      dismissedKeys: dismissedTomorrow,
      savedTomorrowText: '',
    });
    const autoLabelSet = new Set(autoOnly.lines.map((line) => line.toLowerCase()));
    const manualTomorrow = String(parsedNote.congViecNgayMai || '')
      .split('\n')
      .map((line) => line.replace(/^-\s*/, '').trim())
      .filter((line) => line && !autoLabelSet.has(line.toLowerCase()))
      .join('\n');

    setEditData({
      manpower: activeLog?.MANPOWER !== undefined ? activeLog?.MANPOWER : (activeLog?.NHÂN_LỰC_SITE || 0),
      engineers: activeLog?.ENGINEERS !== undefined ? activeLog?.ENGINEERS : (activeLog?.KỸ_SƯ_GS || 0),
      incidentCount: activeLog?.INCIDENT_COUNT !== undefined ? activeLog?.INCIDENT_COUNT : (parseInt(activeLog?.SỰ_CỐ) || 0),
      weatherCondition: parsedW.condition,
      weatherDetail: parsedW.detail,
      ghiChu: parsedNote.ghiChu,
      congViecChinh: parsedNote.congViecChinh,
      congViecNgayMai: tomorrowWork.text,
      tomorrowItems: tomorrowWork.items,
      dismissedTomorrow,
      congViecNgayMaiManual: manualTomorrow,
      vanDeRuiRo: parsedNote.vanDeRuiRo,
      dayStatus: parsedNote.dayStatus,
      dayStatusSubtext: parsedNote.dayStatusSubtext,
      progressEntries: progressEntries.length
        ? progressEntries
        : [{ taskCode: '', taskName: '', deltaPercent: '', note: '' }],
    });
    setProgressSaveError('');
    setIsEditing(true);
  };

  const rebuildTomorrowEditState = (prev, dismissedTomorrow) => {
    const projectId = project?.PROJECT_ID || project?.id;
    const bundles = {
      permits: moduleBundles.permits,
      designs: moduleBundles.designs,
      procurements: moduleBundles.procurements,
      constructions: constructions.length ? constructions : moduleBundles.constructions,
      handovers: moduleBundles.handovers,
    };
    const tomorrowWork = computeTomorrowWork({
      logDate: selectedDate,
      projectId,
      bundles,
      logs,
      constructions: bundles.constructions || [],
      dismissedKeys: dismissedTomorrow,
      savedTomorrowText: prev.congViecNgayMaiManual,
    });
    return {
      ...prev,
      dismissedTomorrow,
      tomorrowItems: tomorrowWork.items,
      congViecNgayMai: tomorrowWork.text,
    };
  };

  const handleDismissTomorrowItem = (itemKey) => {
    setEditData((prev) => {
      if (!prev) return prev;
      const nextDismissed = [...new Set([...(prev.dismissedTomorrow || []), itemKey])];
      return rebuildTomorrowEditState(prev, nextDismissed);
    });
  };

  const addProgressEntryRow = () => {
    setEditData((prev) => ({
      ...prev,
      progressEntries: [...(prev.progressEntries || []), { taskCode: '', taskName: '', deltaPercent: '', note: '' }],
    }));
  };

  const updateProgressEntryRow = (index, patch) => {
    setEditData((prev) => ({
      ...prev,
      progressEntries: (prev.progressEntries || []).map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    }));
    setProgressSaveError('');
  };

  const removeProgressEntryRow = (index) => {
    setEditData((prev) => ({
      ...prev,
      progressEntries: (prev.progressEntries || []).filter((_, i) => i !== index),
    }));
  };

  const handleProgressTaskPick = (index, optionValue) => {
    const option = constructionOptions.find((item) => taskProgressKey(item) === optionValue);
    if (!option) {
      updateProgressEntryRow(index, { taskCode: '', taskName: '' });
      return;
    }
    updateProgressEntryRow(index, {
      taskCode: option.taskCode,
      taskName: option.taskName,
    });
  };

  const handleSaveEdit = async () => {
    if (!canEdit) return;

    const normalizedEntries = (editData.progressEntries || [])
      .map((entry) => ({
        taskCode: String(entry.taskCode || '').trim(),
        taskName: String(entry.taskName || '').trim(),
        deltaPercent: Number(entry.deltaPercent || 0),
        note: String(entry.note || '').trim(),
      }))
      .filter((entry) => entry.taskCode && entry.taskName);

    const validationErrors = validateProgressEntries(normalizedEntries, logs, selectedDate);
    if (validationErrors.length) {
      const first = validationErrors[0];
      setProgressSaveError(
        `${first.taskName}: tối đa còn ${first.maxAllowed}% (đã ghi ${first.prior}%, nhập thêm ${first.attempted}% → ${first.total}%)`
      );
      return;
    }

    const activeEntries = normalizedEntries.filter((entry) => entry.deltaPercent > 0);
    const serializedProgress = serializeProgressEntries(activeEntries);
    const autoCongViecChinh = formatEntriesAsSummaryLines(activeEntries);

    const serializedNote = serializeDailyNote({
      ghiChu: editData.ghiChu,
      congViecChinh: autoCongViecChinh || editData.congViecChinh,
      congViecNgayMai: editData.congViecNgayMai,
      vanDeRuiRo: editData.vanDeRuiRo,
      progressActual: '',
      progressPlanned: '',
      progressEntries: serializedProgress,
      dayStatus: editData.dayStatus,
      dayStatusSubtext: editData.dayStatusSubtext,
      boQuaNgayMai: serializeDismissedTomorrowKeys(editData.dismissedTomorrow),
    });

    const existingWeather = parseWeather(activeLog?.WEATHER || activeLog?.THỜI_TIẾT || '');
    const serializedW = serializeWeather({
      condition: editData.weatherCondition,
      tempHumid: existingWeather.tempHumid || '-',
      detail: editData.weatherDetail,
    });

    const payload = {
      MANPOWER: editData.manpower,
      NHÂN_LỰC_SITE: editData.manpower,
      ENGINEERS: editData.engineers,
      KỸ_SƯ_GS: editData.engineers,
      INCIDENT_COUNT: editData.incidentCount,
      SỰ_CỐ: editData.incidentCount,
      WEATHER: serializedW,
      THỜI_TIẾT: serializedW,
      GHI_CHÚ_HIỆN_TRƯỜNG: serializedNote,
      DAILY_NOTE: serializedNote,
    };

    setProgressSaveError('');
    setIsEditing(false);

    try {
      if (onSaveLogImmediate) {
        await onSaveLogImmediate(payload);
      } else {
        onUpdateLog(payload);
      }
    } catch (err) {
      setProgressSaveError(err?.message || 'Không lưu được nhật ký. Thử lại.');
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setProgressSaveError('');
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
      
      {/* Header and Tabs — ẩn trên mobile khi đang sửa để form chiếm tối đa chiều cao */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 ${isEditing ? 'max-md:hidden' : ''}`}>
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
        
        {/* Day/Week Tabs + Edit */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {selectedView === 'day' && canEdit && !isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg bg-[#18233a] border border-[#2b3a5c] text-slate-200 hover:text-white hover:bg-[#243250] transition-all"
                title="Chỉnh sửa toàn bộ nhật ký ngày"
              >
                <Pencil className="w-3.5 h-3.5" /> Sửa nhật ký
              </button>
          )}

          <div className="flex rounded-lg bg-[var(--bg-panel)] p-0.5 border border-[var(--border-main)]">
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
      </div>

      {/* Traversal Navigation Bar — mobile: chỉ giữ cố định thanh chọn ngày (từ đây trở lên là tab section nav) */}
      <div className={`flex items-center gap-2 bg-[var(--bg-panel)] border border-[var(--border-main)] p-2 rounded-lg mb-3 justify-between max-md:sticky max-md:top-11 max-md:z-20 max-md:bg-[var(--bg-main)]/95 max-md:backdrop-blur-md max-md:shadow-sm ${isEditing ? 'max-md:mb-2' : ''}`}>
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
            const progressEntries = parseProgressEntries(getLogNoteText(activeLog));
            
            const manpower = activeLog?.MANPOWER !== undefined ? activeLog?.MANPOWER : (activeLog?.NHÂN_LỰC_SITE || 0);
            const engineers = activeLog?.ENGINEERS !== undefined ? activeLog?.ENGINEERS : (activeLog?.KỸ_SƯ_GS || 0);
            
            const weatherCond = ts(parsedW.condition || liveWeather?.condition || 'Nắng đẹp');
            const weatherDetail = ts(parsedW.detail || liveWeather?.detail || 'Chưa có thông tin');
            
            const incidents = activeLog?.INCIDENT_COUNT !== undefined ? activeLog?.INCIDENT_COUNT : (parseInt(activeLog?.SỰ_CỐ) || 0);

            const listChinh = progressEntries.length
              ? progressEntries
                  .filter((entry) => Number(entry.deltaPercent) > 0)
                  .map((entry) => `[${entry.taskCode}] ${entry.taskName}: +${Number(entry.deltaPercent)}%`)
              : parsedNote.congViecChinh.split('\n').map(line => line.replace(/^-\s*/, '').trim()).filter(Boolean);
            const listGhiChu = parsedNote.ghiChu.split('\n').map(line => line.replace(/^-\s*/, '').trim()).filter(Boolean);

            const projectId = project?.PROJECT_ID || project?.id;
            const bundles = {
              permits: moduleBundles.permits,
              designs: moduleBundles.designs,
              procurements: moduleBundles.procurements,
              constructions: constructions.length ? constructions : moduleBundles.constructions,
              handovers: moduleBundles.handovers,
            };
            const dismissedTomorrow = parseDismissedTomorrowKeys(getLogNoteText(activeLog));
            const tomorrowWork = computeTomorrowWork({
              logDate: selectedDate,
              projectId,
              bundles,
              logs,
              constructions: bundles.constructions || [],
              dismissedKeys: dismissedTomorrow,
              savedTomorrowText: parsedNote.congViecNgayMai,
            });
            const listNgayMai = tomorrowWork.lines;
            const tomorrowDateLabel = addDaysDMY(selectedDate, 1) || '';
            const summaryPlanned = calcDailyPlannedProjectPercent(selectedDate, projectId, bundles);
            const summaryActual = calcDailyActualProjectPercent(progressEntries, bundles.constructions || []);
            const plannedLabels = getPlannedWorkLabelsForDay(selectedDate, projectId, bundles);
            const impactHint =
              parsedNote.dayStatusSubtext ||
              (plannedLabels.length
                ? `${plannedLabels.length} việc KH trong ngày`
                : summaryPlanned > 0
                  ? 'Theo lịch hạng mục'
                  : '-');

            if (isEditing && editData) {
              return (
                <div className="bg-[var(--bg-panel)]/80 border border-[var(--border-main)] rounded-xl p-4 md:p-5 mb-4 space-y-4 max-md:pb-24">
                  <div className="hidden md:flex items-center justify-between border-b border-[var(--border-main)] pb-3 gap-6">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      📝 Chỉnh sửa nhật ký ngày {selectedDate}
                    </h4>
                    <div className="flex items-center gap-2 shrink-0 rounded-lg bg-[#0b1221] p-1 border border-[var(--border-main)]">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={saveStatus === 'Saving...'}
                        className="px-3 py-1.5 text-[10px] font-bold rounded-md bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" /> Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={saveStatus === 'Saving...'}
                        className="px-3 py-1.5 text-[10px] font-bold rounded-md bg-[#5252ff] hover:bg-[#4040ff] text-white shadow-[0_0_12px_rgba(82,82,255,0.25)] transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" /> Lưu ngay
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

                    {/* Row 3: Status */}
                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  {/* Tiến độ hạng mục thi công hôm nay */}
                  <div className="border border-[var(--border-main)] rounded-lg p-3 bg-[#0f1628] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                          Tiến độ hạng mục thi công hôm nay
                        </label>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Nhập % cộng thêm trong ngày — hệ thống tự cộng dồn vào bảng Thi công (tối đa 100%/hạng mục).
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addProgressEntryRow}
                        disabled={!constructionOptions.length}
                        className="px-2.5 py-1 text-[10px] font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40"
                      >
                        + Thêm hạng mục
                      </button>
                    </div>

                    {!constructionOptions.length && (
                      <p className="text-[11px] text-amber-400/90">
                        Chưa có dữ liệu hạng mục thi công. Mở tab Thi công để khởi tạo danh sách trước.
                      </p>
                    )}

                    {(editData.progressEntries || []).map((entry, index) => {
                      const selectedKey = taskProgressKey(entry);
                      const priorSum = sumProgressDeltasFromLogs(logs, { excludeDate: selectedDate });
                      const prior = priorSum[selectedKey] || 0;
                      const remaining = selectedKey
                        ? getRemainingPercentForTask(entry, logs, selectedDate, editData.progressEntries, index)
                        : 100;

                      return (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_88px_minmax(0,1fr)_auto] gap-2 items-end">
                          <div>
                            <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Hạng mục</label>
                            <select
                              value={selectedKey}
                              onChange={(e) => handleProgressTaskPick(index, e.target.value)}
                              className="w-full bg-[#141d30] border border-[var(--border-main)] rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#5252ff]"
                            >
                              <option value="">-- Chọn hạng mục --</option>
                              {constructionOptions.map((option) => (
                                <option key={taskProgressKey(option)} value={taskProgressKey(option)}>
                                  [{option.taskCode}] {option.taskName} ({Math.round(option.currentPercent)}%)
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">% hôm nay</label>
                            <input
                              type="number"
                              min="0"
                              max={remaining || 100}
                              step="0.1"
                              value={entry.deltaPercent}
                              onChange={(e) => updateProgressEntryRow(index, { deltaPercent: e.target.value })}
                              className="w-full bg-[#141d30] border border-[var(--border-main)] rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#5252ff]"
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Ghi chú</label>
                            <input
                              type="text"
                              value={entry.note || ''}
                              onChange={(e) => updateProgressEntryRow(index, { note: e.target.value })}
                              className="w-full bg-[#141d30] border border-[var(--border-main)] rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#5252ff]"
                              placeholder="Tùy chọn"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProgressEntryRow(index)}
                            className="px-2 py-1.5 text-[10px] font-bold rounded bg-red-500/10 text-red-300 hover:bg-red-500/20"
                          >
                            Xóa
                          </button>
                          {selectedKey && (
                            <p className="md:col-span-4 text-[10px] text-slate-500">
                              Đã tích lũy trước ngày này: <span className="text-slate-300 font-semibold">{Math.round(prior)}%</span>
                              {' · '}Còn tối đa hôm nay: <span className="text-emerald-300 font-semibold">{Math.round(remaining)}%</span>
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {progressSaveError && (
                      <p className="text-[11px] text-red-400 font-semibold">{progressSaveError}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                        Công việc ngày mai
                        {tomorrowDateLabel ? (
                          <span className="normal-case font-medium text-slate-500 ml-1">({tomorrowDateLabel})</span>
                        ) : null}
                      </label>
                      <p className="text-[10px] text-slate-500 mb-2">
                        Tự động theo lịch hạng mục + việc chưa xong hôm nay. Bấm X để bỏ nhắc.
                      </p>
                      {(editData.tomorrowItems || []).length > 0 ? (
                        <ul className="space-y-1.5 mb-2">
                          {(editData.tomorrowItems || []).map((item) => (
                            <li
                              key={item.key}
                              className="flex items-start gap-2 bg-[#141d30] border border-[var(--border-main)] rounded-md px-2.5 py-2 text-xs text-white"
                            >
                              <span className="flex-1 min-w-0 leading-snug">{item.label}</span>
                              <button
                                type="button"
                                onClick={() => handleDismissTomorrowItem(item.key)}
                                className="shrink-0 p-1 rounded hover:bg-red-500/15 text-slate-400 hover:text-red-400 transition-colors"
                                title="Bỏ nhắc việc này"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] italic text-slate-500 mb-2">Chưa có việc gợi ý cho ngày mai.</p>
                      )}
                      <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                        Thêm công việc khác (tuỳ chọn)
                      </label>
                      <textarea
                        value={editData.congViecNgayMaiManual || ''}
                        onChange={(e) => {
                          const manual = e.target.value;
                          setEditData((prev) => rebuildTomorrowEditState(
                            { ...prev, congViecNgayMaiManual: manual },
                            prev.dismissedTomorrow || []
                          ));
                        }}
                        rows={3}
                        placeholder="Mỗi dòng là 1 công việc bổ sung..."
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

                  <div className="md:hidden flex items-center gap-2 pt-3 mt-1 border-t border-[var(--border-main)]">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={saveStatus === 'Saving...'}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
                    >
                      <X className="w-4 h-4" /> Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={saveStatus === 'Saving...'}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-lg bg-[#5252ff] hover:bg-[#4040ff] text-white transition-all disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" /> Lưu ngay
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
                          <p className="text-sm font-bold text-white mt-0.5">
                            {(Number(summaryActual) || 0).toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500">{t('siteLog.variance')}</p>
                          {(() => {
                            const actual = Number(summaryActual) || 0;
                            const planned = Number(summaryPlanned) || 0;
                            const diff = actual - planned;
                            const isNeg = diff < 0;
                            return (
                              <p className={`text-sm font-bold mt-0.5 ${isNeg ? 'text-red-400' : diff > 0 ? 'text-green-400' : 'text-slate-300'}`}>
                                {diff > 0 ? '+' : ''}{diff.toFixed(2)}%
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
                          style={{
                            width: `${Math.min(100, Math.max(0, ((Number(summaryActual) || 0) / Math.max(Number(summaryPlanned) || 0, 0.01)) * 100))}%`,
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 gap-3">
                        <span>{t('siteLog.planned')}: {(Number(summaryPlanned) || 0).toFixed(2)}%</span>
                        <span className="truncate">{t('siteLog.impactVariance')}: {impactHint}</span>
                      </div>
                    </div>
                  </div>

                  {/* CÔNG VIỆC NGÀY MAI */}
                  <div className="bg-[#0b1221] border border-[#22304a] rounded-lg p-4 shadow-[0_10px_28px_rgba(0,0,0,0.16)]">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 text-indigo-400" /> {t('siteLog.tomorrowTasks')}
                        {tomorrowDateLabel ? (
                          <span className="normal-case font-medium text-slate-500">· {tomorrowDateLabel}</span>
                        ) : null}
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
