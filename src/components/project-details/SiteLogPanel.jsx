import React, { useRef, useEffect, useState } from 'react';
import { 
  Users, HardHat, CloudRain, ShieldAlert, ChevronLeft, ChevronRight, ChevronDown, Loader2, 
  Sun, Cloud, CloudLightning, Wrench, Pencil, CalendarClock, AlertCircle, Check, X, CheckCircle2
} from 'lucide-react';

// --- IndexedDB Utils for Image Storage ---
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("SiteLogImagesDB", 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("images")) {
        db.createObjectStore("images", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveImagesDB = async (projectId, date, base64Array) => {
  try {
    const db = await initDB();
    const tx = db.transaction("images", "readwrite");
    const store = tx.objectStore("images");
    store.put({ id: `${projectId}_${date}`, images: base64Array });
  } catch (err) {
    console.error("DB Save Error:", err);
  }
};

const getImagesDB = async (projectId, date) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("images", "readonly");
      const store = tx.objectStore("images");
      const request = store.get(`${projectId}_${date}`);
      request.onsuccess = () => resolve(request.result ? request.result.images : []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("DB Get Error:", err);
    return [];
  }
};

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
    };
  });
};
// ----------------------------------------
const parseDateStr = (dateStr) => {
  if (!dateStr) return null;
  const parts = String(dateStr).split('/');
  if (parts.length !== 3) return null;
  return new Date(parts[2], parts[1] - 1, parts[0]);
};

const formatDateStr = (date) => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
};

const getMondayOfDate = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const getWeekNumber = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return weekNo;
};

const getVietnameseDayOfWeek = (dateStr) => {
  const date = parseDateStr(dateStr);
  if (!date) return '';
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return days[date.getDay()];
};

const parseDailyNote = (noteText) => {
  const defaults = {
    ghiChu: '',
    congViecChinh: '',
    congViecNgayMai: '',
    vanDeRuiRo: '',
    progressActual: '',
    progressPlanned: '',
    dayStatus: 'Bình thường',
    dayStatusSubtext: ''
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
  const dayStatus = extractSection(noteText, 'TRẠNG THÁI NGÀY');
  const dayStatusSubtext = extractSection(noteText, 'ẢNH HƯỞNG');

  if (ghiChu !== null) result.ghiChu = ghiChu;
  if (congViecChinh !== null) result.congViecChinh = congViecChinh;
  if (congViecNgayMai !== null) result.congViecNgayMai = congViecNgayMai;
  if (vanDeRuiRo !== null) result.vanDeRuiRo = vanDeRuiRo;
  if (progressActual !== null) result.progressActual = progressActual;
  if (progressPlanned !== null) result.progressPlanned = progressPlanned;
  if (dayStatus !== null) result.dayStatus = dayStatus;
  if (dayStatusSubtext !== null) result.dayStatusSubtext = dayStatusSubtext;

  // Fallback if legacy notes
  if (ghiChu === null && congViecChinh === null && congViecNgayMai === null && vanDeRuiRo === null) {
    result.ghiChu = noteText.trim();
  }

  return result;
};

const serializeDailyNote = (sections) => {
  return `### GHI CHÚ HIỆN TRƯỜNG\n${sections.ghiChu}\n\n### CÔNG VIỆC CHÍNH\n${sections.congViecChinh}\n\n### CÔNG VIỆC NGÀY MAI\n${sections.congViecNgayMai}\n\n### VẤN ĐỀ / RỦI RO\n${sections.vanDeRuiRo}\n\n### TIẾN ĐỘ THỰC TẾ\n${sections.progressActual}\n\n### TIẾN ĐỘ KẾ HOẠCH\n${sections.progressPlanned}\n\n### TRẠNG THÁI NGÀY\n${sections.dayStatus}\n\n### ẢNH HƯỞNG\n${sections.dayStatusSubtext}`;
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
  saveStatus
}) {
  const datePickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [imagesByDate, setImagesByDate] = useState({});
  const [liveWeather, setLiveWeather] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      const todayStr = (() => {
        const d = new Date();
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      })();
      
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

  const currentImages = imagesByDate[selectedDate] || [];

  // Load images from DB when date changes
  useEffect(() => {
    if (project?.id && selectedDate) {
      getImagesDB(project.id, selectedDate).then(imgs => {
        setImagesByDate(prev => ({ ...prev, [selectedDate]: imgs }));
      });
    }
  }, [project?.id, selectedDate]);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    // Compress and convert to base64
    const compressedPromises = files.map(f => compressImage(f));
    const base64Images = await Promise.all(compressedPromises);

    setImagesByDate(prev => {
      const existing = prev[selectedDate] || [];
      const combined = [...existing, ...base64Images].slice(0, 4);
      
      // Save to IndexedDB immediately
      if (project?.id) {
        saveImagesDB(project.id, selectedDate, combined);
      }
      
      return { ...prev, [selectedDate]: combined };
    });
  };

  const removeImage = (indexToRemove) => {
    setImagesByDate(prev => {
      const updated = prev[selectedDate].filter((_, idx) => idx !== indexToRemove);
      if (project?.id) {
        saveImagesDB(project.id, selectedDate, updated);
      }
      return { ...prev, [selectedDate]: updated };
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
          weatherTempHumid: `${t}°C • 80%`,
          weatherDetail: "Đã cập nhật tự động"
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
    const parsedNote = parseDailyNote(activeLog?.DAILY_NOTE || activeLog?.GHI_CHÚ_HIỆN_TRƯỜNG || '');
    const parsedW = parseWeather(activeLog?.WEATHER || activeLog?.THỜI_TIẾT || '');
    
    setEditData({
      manpower: activeLog?.MANPOWER !== undefined ? activeLog?.MANPOWER : (activeLog?.NHÂN_LỰC_SITE || 0),
      engineers: activeLog?.ENGINEERS !== undefined ? activeLog?.ENGINEERS : (activeLog?.KỸ_SƯ_GS || 0),
      incidentCount: activeLog?.INCIDENT_COUNT !== undefined ? activeLog?.INCIDENT_COUNT : (parseInt(activeLog?.SỰ_CỐ) || 0),
      weatherCondition: parsedW.condition,
      weatherTempHumid: parsedW.tempHumid,
      weatherDetail: parsedW.detail,
      ghiChu: parsedNote.ghiChu,
      congViecChinh: parsedNote.congViecChinh,
      congViecNgayMai: parsedNote.congViecNgayMai,
      vanDeRuiRo: parsedNote.vanDeRuiRo,
      progressActual: parsedNote.progressActual,
      progressPlanned: parsedNote.progressPlanned,
      dayStatus: parsedNote.dayStatus,
      dayStatusSubtext: parsedNote.dayStatusSubtext
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const serializedNote = serializeDailyNote({
      ghiChu: editData.ghiChu,
      congViecChinh: editData.congViecChinh,
      congViecNgayMai: editData.congViecNgayMai,
      vanDeRuiRo: editData.vanDeRuiRo,
      progressActual: editData.progressActual,
      progressPlanned: editData.progressPlanned,
      dayStatus: editData.dayStatus,
      dayStatusSubtext: editData.dayStatusSubtext
    });

    const serializedW = serializeWeather({
      condition: editData.weatherCondition,
      tempHumid: editData.weatherTempHumid,
      detail: editData.weatherDetail
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
    const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const weekdayFullNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
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
        weekday: weekdays[i],
        fullName: weekdayFullNames[i],
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
    const val = e.target.value; // YYYY-MM-DD
    if (!val) return;
    const parts = val.split('-');
    const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    setSelectedDate(formatted);
  };

  const getStatusBadge = () => {
    switch (saveStatus) {
      case 'Saving...':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 animate-pulse">
            ● Đang lưu...
          </span>
        );
      case 'Saved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
            ● Đã lưu
          </span>
        );
      case 'Error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500">
            ● Lỗi kết nối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-400">
            ● Bản nháp
          </span>
        );
    }
  };

  // Check if prev/next buttons should be disabled
  const isPrevDisabled = () => false;
  const isNextDisabled = () => false;

  return (
    <div className="glass-panel p-5 rounded-xl shadow-lg border border-[var(--border-main)]">
      
      {/* Header and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            NHẬT KÝ & VẬN HÀNH
          </h3>
          <div className="mt-1">{getStatusBadge()}</div>
        </div>
        
        {/* Day/Week Tabs */}
        <div className="flex rounded-lg bg-[var(--bg-panel)] p-0.5 border border-[var(--border-main)] self-start sm:self-auto">
          <button
            onClick={() => setSelectedView('day')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
              selectedView === 'day' ? 'bg-[#5252ff] text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ngày
          </button>
          <button
            onClick={() => setSelectedView('week')}
            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
              selectedView === 'week' ? 'bg-[#5252ff] text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tuần
          </button>
        </div>
      </div>

      {/* Traversal Navigation Bar */}
      <div className="flex items-center gap-2 bg-[var(--bg-panel)] border border-[var(--border-main)] p-2 rounded-lg mb-4 justify-between">
        <button
          onClick={handlePrev}
          disabled={isPrevDisabled()}
          className="p-1.5 rounded-md hover:bg-[var(--border-main)] text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Day view: clickable date text → opens calendar picker */}
        {selectedView === 'day' && (
          <div 
            className="flex-1 flex items-center justify-center cursor-pointer hover:bg-[var(--border-main)]/50 rounded-md py-1 transition-all relative"
            onClick={() => {
              if (datePickerRef.current) {
                try { datePickerRef.current.showPicker(); } catch(e) { datePickerRef.current.click(); }
              }
            }}
          >
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 select-none">
              {selectedDate} ({getVietnameseDayOfWeek(selectedDate)})
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </span>
            <input
              type="date"
              ref={datePickerRef}
              value={(() => {
                const parts = selectedDate.split('/');
                return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : '';
              })()}
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
                  Tuần {weekNum} ({wKey.substring(0, 5)} - {formatDateStr(sunday).substring(0, 5)})
                </option>
              );
            })}
          </select>
        )}

        <button
          onClick={handleNext}
          disabled={isNextDisabled()}
          className="p-1.5 rounded-md hover:bg-[var(--border-main)] text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {selectedView === 'day' && (
        <>
          {(() => {
            const parsedNote = parseDailyNote(activeLog?.DAILY_NOTE || activeLog?.GHI_CHÚ_HIỆN_TRƯỜNG || '');
            const parsedW = parseWeather(activeLog?.WEATHER || activeLog?.THỜI_TIẾT || '');
            
            const manpower = activeLog?.MANPOWER !== undefined ? activeLog?.MANPOWER : (activeLog?.NHÂN_LỰC_SITE || 0);
            const engineers = activeLog?.ENGINEERS !== undefined ? activeLog?.ENGINEERS : (activeLog?.KỸ_SƯ_GS || 0);
            
            const weatherCond = parsedW.condition || liveWeather?.condition || 'Nắng đẹp';
            const weatherTemp = parsedW.tempHumid || liveWeather?.tempHumid || 'N/A';
            const weatherDetail = parsedW.detail || liveWeather?.detail || 'Chưa có thông tin';
            
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
                      <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Nhiệt độ & Độ ẩm</label>
                      <input
                        type="text"
                        placeholder="28°C • 80%"
                        value={editData.weatherTempHumid}
                        onChange={(e) => setEditData(prev => ({ ...prev, weatherTempHumid: e.target.value }))}
                        className="w-full bg-[#141d30] border border-[var(--border-main)] rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#5252ff]"
                      />
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
                  {/* NHÂN LỰC SITE */}
                  <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-xl p-4 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#5252ff]/10 text-[#7373ff] flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Nhân lực Site</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-white">{manpower}</span>
                        <span className="text-[10px] text-slate-500">người</span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5">Kỹ sư / GS: {engineers}</p>
                    </div>
                  </div>

                  {/* THỜI TIẾT */}
                  <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-xl p-4 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                      {getWeatherIcon(activeLog?.WEATHER || activeLog?.THỜI_TIẾT)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Thời tiết</p>
                      <p className="text-xs font-bold text-white leading-tight">{weatherCond}</p>
                      <p className="text-[9px] text-[#3b82f6] mt-0.5 font-medium">{weatherTemp}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 leading-tight truncate" title={weatherDetail}>{weatherDetail}</p>
                    </div>
                  </div>

                  {/* CÔNG VIỆC CHÍNH */}
                  <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-xl p-4 flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Công việc chính</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-white">{listChinh.length}</span>
                        <span className="text-[10px] text-slate-500">hạng mục</span>
                      </div>
                      <ul className="text-[9px] text-slate-400 mt-1 space-y-0.5 list-disc pl-3">
                        {listChinh.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="truncate" title={item}>{item}</li>
                        ))}
                        {listChinh.length === 0 && <li className="italic text-slate-600">Không ghi nhận</li>}
                      </ul>
                    </div>
                  </div>

                  {/* SỰ CỐ */}
                  <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-xl p-4 flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${incidents > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Sự cố</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-white">{incidents}</span>
                        <span className="text-[10px] text-slate-500">sự cố</span>
                      </div>
                      <div className="mt-1">
                        <span className={`inline-block text-[8px] font-bold px-1.5 py-0.5 rounded-full ${incidents > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                          {incidents > 0 ? 'Đang theo dõi' : 'Bình thường'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GHI CHÚ HIỆN TRƯỜNG */}
                <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-xl p-4 mb-4 relative group">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5 text-[var(--text-muted)]" /> Ghi chú hiện trường
                    </p>
                    <button 
                      onClick={handleStartEdit}
                      className="w-6 h-6 rounded bg-[var(--border-main)] border border-[#1e2a45] text-slate-400 hover:text-white flex items-center justify-center hover:bg-[#202c46] transition-all"
                      title="Chỉnh sửa nhật ký"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                    {listGhiChu.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                    {listGhiChu.length === 0 && <li className="italic text-slate-500 list-none pl-0">Không có ghi chú.</li>}
                  </ul>
                </div>

                {/* Columns: TÓM TẮT NGÀY & CÔNG VIỆC NGÀY MAI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* TÓM TẮT NGÀY */}
                  <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Tóm tắt ngày
                      </p>
                      
                      <div className="grid grid-cols-3 gap-2 text-center mb-3">
                        <div>
                          <p className="text-[9px] text-slate-500">Tiến độ thực tế</p>
                          <p className="text-sm font-bold text-white mt-0.5">{parsedNote.progressActual}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500">Chênh lệch</p>
                          {(() => {
                            const actual = parseFloat(parsedNote.progressActual);
                            const planned = parseFloat(parsedNote.progressPlanned);
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
                          <p className="text-[9px] text-slate-500">Trạng thái ngày</p>
                          <div className="flex items-center justify-center gap-1 mt-0.5">
                            <span className={`w-2 h-2 rounded-full ${parsedNote.dayStatus === 'Bình thường' ? 'bg-green-500' : 'bg-amber-500'}`} />
                            <span className="text-[10px] font-semibold text-white">{parsedNote.dayStatus}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      {/* Progress bar */}
                      <div className="w-full bg-[#141d30] rounded-full h-1.5 mb-1.5 border border-[var(--border-main)]">
                        <div 
                          className="bg-emerald-500 h-1.5 rounded-full" 
                          style={{ width: `${Math.min(100, Math.max(0, (parseFloat(parsedNote.progressActual) / parseFloat(parsedNote.progressPlanned)) * 100))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>Kế hoạch: {parsedNote.progressPlanned}</span>
                        <span>Chênh lệch tác động: {parsedNote.dayStatusSubtext}</span>
                      </div>
                    </div>
                  </div>

                  {/* CÔNG VIỆC NGÀY MAI */}
                  <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 text-indigo-400" /> Công việc ngày mai
                      </p>
                      <span className="text-[8px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded">
                        Ưu tiên cao
                      </span>
                    </div>
                    
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                      {listNgayMai.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                      {listNgayMai.length === 0 && <li className="italic text-slate-500 list-none pl-0">Chưa ghi nhận công việc ngày mai.</li>}
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
                        <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider mb-0.5">Vấn đề / Rủi ro cần lưu ý</p>
                        <p className="text-xs text-slate-300 leading-tight">{parsedNote.vanDeRuiRo}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full shrink-0">
                      Đang theo dõi
                    </span>
                  </div>
                )}
              </>
            );
          })()}

          {/* Ảnh hiện trường */}
          <div className="mt-3 bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-main)] bg-[var(--bg-hover)]">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                📷 Ảnh hiện trường
                <span className="ml-1 text-[8px] font-normal bg-[#5252ff]/10 text-[#7373ff] border border-[#5252ff]/20 px-1.5 py-0.5 rounded-full">{currentImages.length}/4 ảnh</span>
              </p>
              <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={currentImages.length >= 4}
                className={`flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded-md transition-all ${
                  currentImages.length >= 4 ? 'opacity-50 cursor-not-allowed text-slate-500 bg-slate-800' : 'text-[#7373ff] hover:text-white bg-[#5252ff]/10 hover:bg-[#5252ff]/20 border border-[#5252ff]/20 cursor-pointer'
                }`}
              >
                + Thêm ảnh
              </button>
            </div>

            {/* Photo Grid */}
            <div className="p-4 border-b border-[var(--border-main)]">
              {currentImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-[var(--border-main)] flex items-center justify-center mb-3 text-slate-500">
                    📷
                  </div>
                  <p className="text-sm font-semibold text-slate-300">Chưa có ảnh tải lên</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Hãy thêm ảnh hiện trường để báo cáo trực quan hơn. Tối đa 4 ảnh.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {currentImages.map((src, i) => (
                    <div key={i} className="relative aspect-[16/9] rounded-lg overflow-hidden border border-[#263554] group">
                      <img src={src} alt="site" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 bg-black/60 text-white w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-3 py-2 bg-[var(--bg-hover)]/30 flex items-center justify-end">
              <p className="text-[9px] text-slate-600">{new Date().toLocaleDateString('vi-VN')} · {activeLog.UPDATED_BY || 'Giám sát viên'}</p>
            </div>
          </div>
        </>
      )}

      {selectedView === 'week' && (
        <>
          <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-lg overflow-hidden mb-4">
            <div className="p-3 border-b border-[var(--border-main)] bg-[var(--bg-hover)]">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                📅 LỊCH TRONG TUẦN
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-main)] text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--bg-hover)]/50">
                    <th className="py-2 px-3">Thứ</th>
                    <th className="py-2 px-3">Ngày</th>
                    <th className="py-2 px-3 text-center">Nhân sự</th>
                    <th className="py-2 px-3 text-center">Kỹ sư/GS</th>
                    <th className="py-2 px-3">Thời tiết</th>
                    <th className="py-2 px-3 text-center">Sự cố</th>
                    <th className="py-2 px-3">Ghi chú chính</th>
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
                            <span className="text-[10px] text-slate-500 font-normal">người</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-300">{eng}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            {getWeatherIcon(weatherText)}
                            <span className="truncate max-w-[80px]">{weatherText.split('|')[0] || '-'}</span>
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
                          {note || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Table Footer Legend */}
            <div className="px-3 py-2 bg-[var(--bg-hover)]/30 border-t border-[var(--border-main)] flex items-center justify-between text-[10px] text-slate-500">
              <span className="font-medium text-slate-400">💡 Click vào hàng để xem/sửa chi tiết ngày đó</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 font-semibold px-1 mb-4">
            <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#3b82f6]" /> Nhân sự tại site</span>
            <span className="flex items-center gap-1.5"><HardHat className="w-3.5 h-3.5 text-slate-400" /> Kỹ sư / GS</span>
            <span className="flex items-center gap-1.5"><CloudRain className="w-3.5 h-3.5 text-slate-400" /> Thời tiết</span>
            <span className="flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Sự cố</span>
          </div>

          <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-lg p-3">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Ghi chú tuần này</p>
            <AutoGrowTextarea
              value={activeLog.weeklyAssessment !== undefined ? activeLog.weeklyAssessment : (activeLog.WEEKLY_ASSESSMENT || '')}
              onChange={(e) => onUpdateLog('WEEKLY_ASSESSMENT', e.target.value)}
              className="w-full bg-transparent border-none text-xs text-slate-300 focus:ring-0 focus:outline-none placeholder-[#4d5e7a] min-h-[60px]"
              placeholder="Nhập ghi chú tuần này..."
            />
          </div>
        </>
      )}

    </div>
  );
}
