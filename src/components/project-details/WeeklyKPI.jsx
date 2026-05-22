import React, { useRef, useEffect } from 'react';
import { Users, HardHat, CloudRain, ShieldAlert, Sun, Cloud, CloudLightning, Activity, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

const getWeekNumber = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return weekNo;
};

const getWeatherIcon = (weather) => {
  const w = String(weather || '').toLowerCase();
  if (w.includes('nắng') || w.includes('clear') || w.includes('hot')) {
    return <Sun className="w-4 h-4 text-amber-400 shrink-0" />;
  }
  if (w.includes('mưa lớn') || w.includes('mưa to') || w.includes('bão')) {
    return <CloudLightning className="w-4 h-4 text-blue-400 shrink-0" />;
  }
  if (w.includes('mưa')) {
    return <CloudRain className="w-4 h-4 text-blue-300 shrink-0" />;
  }
  if (w.includes('mây') || w.includes('âm u') || w.includes('sương')) {
    return <Cloud className="w-4 h-4 text-slate-400 shrink-0" />;
  }
  return <Sun className="w-4 h-4 text-amber-400 shrink-0" />; // default to sun
};

// Parse structured daily note markdown → extract only ghiChu section
const parseDailyNote = (noteText) => {
  const defaults = { ghiChu: '' };
  if (!noteText) return defaults;
  const regex = /### GHI CHÚ HIỆN TRƯỜNG\n([\s\S]*?)(?=###|$)/i;
  const match = noteText.match(regex);
  if (match) return { ghiChu: match[1].trim() };
  // If no structured headings found, treat entire text as ghiChu (legacy)
  if (!noteText.includes('###')) return { ghiChu: noteText.trim() };
  return defaults;
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

export default function WeeklyKPI({
  project,
  logs,
  weeklyLogs,
  monthlyLogs,
  selectedView,
  selectedDate,
  selectedWeek,
  selectedMonth,
  activeLog,
  onUpdateLog,
  saveStatus
}) {
  
  // Overall project metrics
  const actualProgress = Number(project?.actualProgress || 0);
  const deviation = Number(project?.delay || 0);
  const delayColor = deviation < 0 ? 'text-[#ef4444]' : 'text-[#10b981]';
  const delaySign = deviation > 0 ? '+' : '';

  if (selectedView === 'day') {
    const stat3Label = 'Nhân lực site';
    const stat3Val = String(activeLog.MANPOWER !== undefined ? activeLog.MANPOWER : (activeLog.NHÂN_LỰC_SITE || 0));
    const stat4Label = 'Kỹ sư / GS';
    const stat4Val = String(activeLog.ENGINEERS !== undefined ? activeLog.ENGINEERS : (activeLog.KỸ_SƯ_GS || 0));
    
    const textareaLabel = 'Ghi chú hiện trường';
    const textareaVal = activeLog.DAILY_NOTE !== undefined ? activeLog.DAILY_NOTE : (activeLog.GHI_CHÚ_HIỆN_TRƯỜNG || '');
    const textareaPlaceholder = 'Nhập ghi chú hiện trường...';
    const updateFieldName = 'DAILY_NOTE';

    return (
      <div className="glass-panel p-5 rounded-xl shadow-lg border border-[#182135]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            CHỈ SỐ VẬN HÀNH <span className="text-[#6b7d9b] font-medium normal-case tracking-normal">
              (Ngày {selectedDate})
            </span>
          </h3>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {/* Tiến độ thực tế */}
          <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center text-center gap-1">
            <p className="text-[9px] font-bold text-[#6b7d9b] uppercase tracking-wider">Tiến độ thực tế</p>
            <p className="text-lg font-bold text-white">{actualProgress.toFixed(2)}%</p>
          </div>

          {/* So với KH */}
          <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center text-center gap-1">
            <p className="text-[9px] font-bold text-[#6b7d9b] uppercase tracking-wider">So với KH</p>
            <p className={`text-lg font-bold ${delayColor}`}>{delaySign}{deviation.toFixed(2)}%</p>
          </div>

          {/* Dynamic Metric 3 */}
          <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center text-center gap-1">
            <p className="text-[9px] font-bold text-[#6b7d9b] uppercase tracking-wider">{stat3Label}</p>
            <p className="text-lg font-bold text-white">{stat3Val}</p>
          </div>

          {/* Dynamic Metric 4 */}
          <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center text-center gap-1">
            <p className="text-[9px] font-bold text-[#6b7d9b] uppercase tracking-wider">{stat4Label}</p>
            <p className="text-lg font-bold text-white">{stat4Val}</p>
          </div>
        </div>

        <div className="bg-[#0b0f19] border border-[#182135] rounded-lg p-3">
          <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider mb-2">{textareaLabel}</p>
          <AutoGrowTextarea
            value={textareaVal}
            onChange={(e) => onUpdateLog(updateFieldName, e.target.value)}
            className="w-full bg-transparent border-none text-xs text-slate-300 focus:ring-0 focus:outline-none placeholder-[#4d5e7a] min-h-[60px]"
            placeholder={textareaPlaceholder}
          />
        </div>
      </div>
    );
  }

  // Week view calculations
  const monday = parseDateStr(selectedWeek);
  const weekDays = [];
  const weekdaysVn = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const weekdayFullVn = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
  
  if (monday) {
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = formatDateStr(d);
      const log = logs.find(l => (l.LOG_DATE === dateStr || l.NGÀY === dateStr));
      weekDays.push({
        date: d,
        dateStr,
        weekday: weekdaysVn[i],
        fullName: weekdayFullVn[i],
        log: log || null
      });
    }
  }

  let totalManpower = 0;
  let loggedDaysCount = 0;
  let maxManpower = -1;
  let maxDates = [];
  let minManpower = Infinity;
  let minDates = [];
  let rainDays = 0;
  let cloudyDays = 0;
  let sunnyDays = 0;
  let totalIncidents = 0;
  const chartPoints = [];
  const weatherIconsRow = [];
  const incidentsList = [];

  weekDays.forEach((day) => {
    const workers = day.log ? Number(day.log.MANPOWER !== undefined ? day.log.MANPOWER : (day.log.NHÂN_LỰC_SITE || 0)) : 0;
    const engineers = day.log ? Number(day.log.ENGINEERS !== undefined ? day.log.ENGINEERS : (day.log.KỸ_SƯ_GS || 0)) : 0;
    const man = workers + engineers;
    const weather = day.log ? String(day.log.WEATHER !== undefined ? day.log.WEATHER : (day.log.THỜI_TIẾT || '')).toLowerCase() : '';
    const incidents = day.log ? Number(day.log.INCIDENT_COUNT !== undefined ? day.log.INCIDENT_COUNT : (parseInt(day.log.SỰ_CỐ) || 0)) : 0;
    const rawNote = day.log ? (day.log.DAILY_NOTE !== undefined ? day.log.DAILY_NOTE : (day.log.GHI_CHÚ_HIỆN_TRƯỜNG || '')) : '';
    let note = '';
    if (rawNote && rawNote.trim()) {
      if (rawNote.includes('###')) {
        const parsedDN = parseDailyNote(rawNote);
        note = parsedDN.ghiChu.split('\n').map(l => l.replace(/^-\s*/, '').trim()).filter(Boolean).join(', ');
      } else {
        note = rawNote.trim();
      }
    }

    if (day.log) {
      loggedDaysCount++;
    }

    totalManpower += man;
    totalIncidents += incidents;

    // Track min/max
    if (man > maxManpower) {
      maxManpower = man;
      maxDates = [day];
    } else if (man === maxManpower) {
      maxDates.push(day);
    }

    if (man < minManpower) {
      minManpower = man;
      minDates = [day];
    } else if (man === minManpower) {
      minDates.push(day);
    }

    // Weather count
    if (weather.includes('mưa')) {
      rainDays++;
    } else if (weather.includes('mây') || weather.includes('âm u') || weather.includes('sương')) {
      cloudyDays++;
    } else if (weather.includes('nắng') || weather.includes('clear')) {
      sunnyDays++;
    }

    // Chart points
    chartPoints.push({
      name: day.dateStr.substring(0, 5),
      manpower: man,
      weekday: day.weekday
    });

    // Weather icon row
    weatherIconsRow.push({
      weekday: day.weekday,
      dateLabel: day.dateStr.substring(0, 5),
      weatherText: day.log ? (day.log.WEATHER !== undefined ? day.log.WEATHER : (day.log.THỜI_TIẾT || 'Nắng')) : 'Nắng'
    });

    // Outstanding issues list
    if (incidents > 0 || weather.includes('mưa lớn') || weather.includes('mưa to') || (note && note.length > 20)) {
      let severity = 'Nhẹ';
      if (incidents > 1 || weather.includes('mưa lớn') || weather.includes('mưa to')) {
        severity = 'Trung bình';
      }
      if (incidents > 2 || (note && (note.includes('dừng thi công') || note.includes('sự cố nghiêm trọng')))) {
        severity = 'Nặng';
      }
      incidentsList.push({
        dateStr: day.dateStr.substring(0, 5),
        description: note || (incidents > 0 ? `Có ${incidents} sự cố hiện trường.` : `Thời tiết xấu: ${weather}`),
        severity
      });
    }
  });

  const avgManpower = loggedDaysCount > 0 ? Math.round(totalManpower / loggedDaysCount) : 0;
  if (minManpower === Infinity) minManpower = 0;
  if (maxManpower === -1) maxManpower = 0;

  const weekNum = monday ? getWeekNumber(monday) : '';
  const mondayVal = monday ? formatDateStr(monday) : '';
  const sundayVal = monday ? formatDateStr(new Date(new Date(monday).setDate(monday.getDate() + 6))) : '';

  return (
    <div className="glass-panel p-5 rounded-xl shadow-lg border border-[#182135]">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center justify-between">
        <span>TỔNG HỢP TUẦN {weekNum}</span>
        <span className="text-[10px] text-slate-400 font-medium normal-case tracking-normal">
          ({mondayVal} - {sundayVal})
        </span>
      </h3>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center text-center">
          <p className="text-[9px] font-bold text-[#6b7d9b] uppercase tracking-wider mb-1">Tổng nhân sự</p>
          <p className="text-lg font-bold text-white">{totalManpower}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">người</p>
        </div>
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center text-center">
          <p className="text-[9px] font-bold text-[#6b7d9b] uppercase tracking-wider mb-1">Trung bình / ngày</p>
          <p className="text-lg font-bold text-white">{avgManpower}</p>
          <p className="text-[9px] text-slate-500 mt-0.5">người/ngày</p>
        </div>
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center text-center">
          <p className="text-[9px] font-bold text-[#6b7d9b] uppercase tracking-wider mb-1">Cao nhất</p>
          <p className="text-lg font-bold text-emerald-400">{maxManpower}</p>
          <p className="text-[8px] text-slate-500 mt-0.5 truncate max-w-full">
            {maxDates.length > 0 ? `${maxDates[0].dateStr.substring(0, 5)} (${maxDates[0].weekday})` : '-'}
          </p>
        </div>
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center text-center">
          <p className="text-[9px] font-bold text-[#6b7d9b] uppercase tracking-wider mb-1">Thấp nhất</p>
          <p className="text-lg font-bold text-amber-500">{minManpower}</p>
          <p className="text-[8px] text-slate-500 mt-0.5 truncate max-w-full">
            {minDates.map(d => d.dateStr.substring(0, 5)).join(', ')}
          </p>
        </div>
      </div>

      {/* 4 Weather/Incident Summary Cards */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-[#0b0f19]/60 border border-[#182135] p-2 rounded-lg flex flex-col items-center justify-center text-center">
          <CloudRain className="w-4 h-4 text-blue-400 mb-1" />
          <p className="text-[8px] font-bold text-[#6b7d9b] uppercase tracking-wider">Ngày mưa</p>
          <p className="text-xs font-bold text-white mt-0.5">{rainDays} ngày</p>
        </div>
        <div className="bg-[#0b0f19]/60 border border-[#182135] p-2 rounded-lg flex flex-col items-center justify-center text-center">
          <Cloud className="w-4 h-4 text-slate-400 mb-1" />
          <p className="text-[8px] font-bold text-[#6b7d9b] uppercase tracking-wider">Nhiều mây</p>
          <p className="text-xs font-bold text-white mt-0.5">{cloudyDays} ngày</p>
        </div>
        <div className="bg-[#0b0f19]/60 border border-[#182135] p-2 rounded-lg flex flex-col items-center justify-center text-center">
          <Sun className="w-4 h-4 text-amber-400 mb-1" />
          <p className="text-[8px] font-bold text-[#6b7d9b] uppercase tracking-wider">Ngày nắng</p>
          <p className="text-xs font-bold text-white mt-0.5">{sunnyDays} ngày</p>
        </div>
        <div className="bg-[#0b0f19]/60 border border-[#182135] p-2 rounded-lg flex flex-col items-center justify-center text-center">
          <ShieldAlert className="w-4 h-4 text-red-400 mb-1" />
          <p className="text-[8px] font-bold text-[#6b7d9b] uppercase tracking-wider">Tổng sự cố</p>
          <p className="text-xs font-bold text-white mt-0.5">{totalIncidents} sự cố</p>
        </div>
      </div>

      {/* BIỂU ĐỒ NHÂN LỰC THEO NGÀY */}
      <div className="bg-[#0b0f19] border border-[#182135] rounded-lg p-3 mb-4">
        <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-[#5252ff]" /> BIỂU ĐỒ NHÂN LỰC THEO NGÀY
        </p>
        <div className="h-[120px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartPoints} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#182135" vertical={false} />
              <XAxis dataKey="name" stroke="#4d5e7a" tick={{ fill: '#6b7d9b', fontSize: 8 }} />
              <YAxis stroke="#4d5e7a" tick={{ fill: '#6b7d9b', fontSize: 8 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0b0f19', borderColor: '#182135', borderRadius: '6px' }}
                labelStyle={{ fontSize: '10px', color: '#6b7d9b', fontWeight: 'bold' }}
                itemStyle={{ fontSize: '10px', color: '#fff' }}
              />
              <Line type="monotone" dataKey="manpower" name="Tổng nhân sự" stroke="#5252ff" strokeWidth={2} dot={{ r: 3, fill: '#5252ff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* THỜI TIẾT TRONG TUẦN */}
      <div className="bg-[#0b0f19] border border-[#182135] rounded-lg p-3 mb-4">
        <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider mb-2">🌦️ THỜI TIẾT TRONG TUẦN</p>
        <div className="grid grid-cols-7 gap-1 mt-2 text-center">
          {weatherIconsRow.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-[9px] font-bold text-white">{item.weekday}</span>
              <span className="text-[8px] text-slate-500 mb-1">{item.dateLabel}</span>
              <div className="p-1 bg-[#141d30]/50 rounded border border-[#182135] flex items-center justify-center w-8 h-8">
                {getWeatherIcon(item.weatherText)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SỰ CỐ & VẤN ĐỀ NỔI BẬT */}
      <div className="bg-[#0b0f19] border border-[#182135] rounded-lg p-3">
        <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> SỰ CỐ & VẤN ĐỀ NỔI BẬT
        </p>
        {incidentsList.length > 0 ? (
          <div className="space-y-2 max-h-[150px] overflow-y-auto mt-2">
            {incidentsList.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start gap-2 bg-[#141d30]/30 border border-[#182135] p-2 rounded text-[11px] leading-relaxed">
                <div className="flex items-start gap-1.5 min-w-0">
                  <span className="font-bold text-[#6b7d9b] shrink-0">{item.dateStr}:</span>
                  <span className="text-slate-300 truncate max-w-[200px]" title={item.description}>{item.description}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0 ${
                  item.severity === 'Nhẹ' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  item.severity === 'Trung bình' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {item.severity}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-slate-500 italic mt-2">Không ghi nhận sự cố hay thời tiết bất thường.</p>
        )}
      </div>
    </div>
  );
}
