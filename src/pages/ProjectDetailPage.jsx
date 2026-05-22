import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Activity, Briefcase, Folder, Sun, Moon
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import ProjectHeader from "../components/project-details/ProjectHeader";
import KPIOverview from "../components/project-details/KPIOverview";
import MilestoneTimeline from "../components/project-details/MilestoneTimeline";
import SCurveChart from "../components/project-details/SCurveChart";
import SiteLogPanel from "../components/project-details/SiteLogPanel";
import WeeklyKPI from "../components/project-details/WeeklyKPI";
import RiskModule from "../components/project-details/modules/RiskModule";
import PermitModule from "../components/project-details/modules/PermitModule";
import DesignModule from "../components/project-details/modules/DesignModule";
import ProcurementModule from "../components/project-details/modules/ProcurementModule";
import ConstructionModule from "../components/project-details/modules/ConstructionModule";
import HandoverModule from "../components/project-details/modules/HandoverModule";
import { api } from "../services/api";

const getTodayStr = () => {
  const today = new Date();
  const d = String(today.getDate()).padStart(2, '0');
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const y = today.getFullYear();
  return `${d}/${m}/${y}`;
};

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

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Project & S-Curve State
  const [project, setProject] = useState(null);
  const [scurveData, setScurveData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Centralized Operations State
  const [logs, setLogs] = useState([]);
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [monthlyLogs, setMonthlyLogs] = useState([]);
  const [selectedView, setSelectedView] = useState('day'); // 'day' | 'week' | 'month'
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [saveStatus, setSaveStatus] = useState('Saved'); // 'Draft' | 'Saving...' | 'Saved' | 'Error'

  const saveTimeoutRef = useRef(null);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(null);

  const [bundleData, setBundleData] = useState(null);

  const [moduleProgress, setModuleProgress] = useState({
    permit: 0,
    design: 0,
    procurement: 0,
    construction: 0,
    handover: 0
  });

  const handleModuleProgressChange = (moduleKey, percent) => {
    setModuleProgress(prev => {
      if (prev[moduleKey] === percent) return prev;
      const next = { ...prev, [moduleKey]: percent };

      const overall = (next.permit * 0.10) + (next.design * 0.15) + (next.procurement * 0.25) + (next.construction * 0.40) + (next.handover * 0.10);

      setProject(p => {
        if (!p) return p;
        const roundedOverall = Math.round(overall * 100) / 100;
        if (p.actualProgress === roundedOverall) return p;

        const planVal = p.planProgress || 0;
        return {
          ...p,
          actualProgress: roundedOverall,
          delay: roundedOverall - planVal
        };
      });

      return next;
    });
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        let bundle = null;
        try {
          bundle = await api.getDashboardBundle(id);
        } catch (e) {
          console.warn("getDashboardBundle not supported or failed, falling back to individual endpoints", e);
        }

        if (bundle) {
          setBundleData(bundle);
          if (bundle.project) setProject(bundle.project);
          if (bundle.scurve) setScurveData(bundle.scurve);

          const dailyRes = bundle.siteLogs || [];
          setLogs(dailyRes);
          if (dailyRes.length > 0) {
            const sorted = [...dailyRes].sort((a, b) => parseDateStr(a.LOG_DATE || a.NGÀY) - parseDateStr(b.LOG_DATE || b.NGÀY));
            const latest = sorted[sorted.length - 1];
            const latestDate = latest ? (latest.LOG_DATE || latest.NGÀY) : getTodayStr();
            setSelectedDate(latestDate);
          } else {
            setSelectedDate(getTodayStr());
          }

          const weeklyRes = bundle.weeklyLogs || [];
          setWeeklyLogs(weeklyRes);
          if (weeklyRes.length > 0) {
            const latestWeekly = weeklyRes[weeklyRes.length - 1];
            if (latestWeekly) {
              setSelectedWeek(latestWeekly.LOG_DATE);
            } else {
              setSelectedWeek(formatDateStr(getMondayOfDate(new Date())));
            }
          } else {
            setSelectedWeek(formatDateStr(getMondayOfDate(new Date())));
          }

          const monthlyRes = bundle.monthlyLogs || [];
          setMonthlyLogs(monthlyRes);
          if (monthlyRes.length > 0) {
            const latestMonthly = monthlyRes[monthlyRes.length - 1];
            if (latestMonthly) {
              const parts = latestMonthly.LOG_DATE.split('/');
              if (parts.length === 3) setSelectedMonth(`${parts[1]}/${parts[2]}`);
            } else {
              const today = new Date();
              const m = String(today.getMonth() + 1).padStart(2, '0');
              setSelectedMonth(`${m}/${today.getFullYear()}`);
            }
          } else {
            const today = new Date();
            const m = String(today.getMonth() + 1).padStart(2, '0');
            setSelectedMonth(`${m}/${today.getFullYear()}`);
          }
        } else {
          const [projData, scurveRes, dailyRes, weeklyRes, monthlyRes] = await Promise.all([
            api.getProject(id),
            api.getSCurves(id),
            api.getSiteLogs(id),
            api.getWeeklyLogs(id),
            api.getMonthlyLogs(id)
          ]);
          if (projData) setProject(projData);
          if (scurveRes) setScurveData(scurveRes);
          if (dailyRes) {
            setLogs(dailyRes);
            if (dailyRes.length > 0) {
              const sorted = [...dailyRes].sort((a, b) => parseDateStr(a.LOG_DATE || a.NGÀY) - parseDateStr(b.LOG_DATE || b.NGÀY));
              const latest = sorted[sorted.length - 1];
              const latestDate = latest ? (latest.LOG_DATE || latest.NGÀY) : getTodayStr();
              setSelectedDate(latestDate);
            } else {
              setSelectedDate(getTodayStr());
            }
          }
          if (weeklyRes) {
            setWeeklyLogs(weeklyRes);
            if (weeklyRes.length > 0) {
              const latestWeekly = weeklyRes[weeklyRes.length - 1];
              setSelectedWeek(latestWeekly ? latestWeekly.LOG_DATE : formatDateStr(getMondayOfDate(new Date())));
            }
          }
          if (monthlyRes) {
            setMonthlyLogs(monthlyRes);
            if (monthlyRes.length > 0) {
              const latestMonthly = monthlyRes[monthlyRes.length - 1];
              if (latestMonthly) {
                const parts = latestMonthly.LOG_DATE.split('/');
                if (parts.length === 3) setSelectedMonth(`${parts[1]}/${parts[2]}`);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch project details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchAllData();
  }, [id]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // S-Curve Fallback
  const toPercentageVal = (v) => {
    if (v === undefined || v === null || v === '') return null;
    const num = Number(v);
    if (isNaN(num)) return null;
    return num <= 1.0 && num > 0 ? num * 100 : num;
  };

  const formattedSCurve = scurveData && scurveData.length > 0 ? scurveData.map(r => ({
    name: r.NGÀY || r.LOG_DATE || '',
    plan: toPercentageVal(r['KẾ_HOẠCH_%'] || r.PLAN_PROGRESS),
    actual: toPercentageVal(r['THỰC_TẾ_%'] || r.ACTUAL_PROGRESS)
  })) : [
    { name: '01/04', plan: 0, actual: 0 },
    { name: '15/04', plan: 5, actual: 4 },
    { name: '01/05', plan: 15, actual: 12 },
    { name: '15/05', plan: 35, actual: 30 },
    { name: '01/06', plan: 50, actual: 45.2 },
    { name: '15/06', plan: 75, actual: null },
    { name: '30/06', plan: 95, actual: null },
    { name: '10/07', plan: 100, actual: null },
  ];

  const latestActualPoint = [...formattedSCurve].reverse().find(p => p.actual !== null && p.actual !== undefined);

  // Compute live overall progress from module weights
  const liveOverall = Math.round(
    (moduleProgress.permit * 0.10) + 
    (moduleProgress.design * 0.15) + 
    (moduleProgress.procurement * 0.25) + 
    (moduleProgress.construction * 0.40) + 
    (moduleProgress.handover * 0.10)
  );
  
  // Use live module-calculated overall when modules have reported any progress
  const hasModuleData = Object.values(moduleProgress).some(v => v > 0);
  
  const basePlan = project ? (
    project.planProgress !== undefined && project.planProgress !== null 
      ? Number(project.planProgress) 
      : (latestActualPoint ? latestActualPoint.plan : 0)
  ) : 0;
  
  const baseActual = hasModuleData 
    ? liveOverall 
    : (project ? (
        project.actualProgress !== undefined && project.actualProgress !== null 
          ? Number(project.actualProgress) 
          : (latestActualPoint ? latestActualPoint.actual : 0)
      ) : 0);

  const enrichedProject = project ? {
    ...project,
    cod: project.cod || '29/06/2026',
    actualProgress: baseActual,
    planProgress: basePlan,
    delay: baseActual - basePlan
  } : null;

  // Compute active log
  let activeLog = null;
  if (selectedView === 'day') {
    activeLog = logs.find(l => (l.LOG_DATE === selectedDate || l.NGÀY === selectedDate)) || {
      PROJECT_ID: id,
      LOG_DATE: selectedDate,
      MANPOWER: 0,
      ENGINEERS: 0,
      WEATHER: '',
      INCIDENT_COUNT: 0,
      DAILY_NOTE: '',
      WEEKLY_ASSESSMENT: '',
      MONTHLY_REPORT: '',
      STATUS: 'Draft',
      UPDATED_BY: 'NV - GIÁM SÁT',
      UPDATED_AT: ''
    };
  } else if (selectedView === 'week') {
    activeLog = weeklyLogs.find(w => w.LOG_DATE === selectedWeek) || {
      PROJECT_ID: id,
      LOG_DATE: selectedWeek,
      avgManpower: 0,
      avgEngineers: 0,
      weatherSummary: 'Chưa ghi nhận',
      incidentCount: 0,
      loggedDaysCount: 0,
      weeklyAssessment: ''
    };
  } else if (selectedView === 'month') {
    activeLog = monthlyLogs.find(m => {
      const parts = m.LOG_DATE ? m.LOG_DATE.split('/') : [];
      return parts.length === 3 && `${parts[1]}/${parts[2]}` === selectedMonth;
    }) || {
      PROJECT_ID: id,
      LOG_DATE: `01/${selectedMonth}`,
      monthLabel: `Tháng ${selectedMonth}`,
      avgManpower: 0,
      avgEngineers: 0,
      weatherSummary: 'Chưa ghi nhận',
      incidentCount: 0,
      loggedDaysCount: 0,
      monthlyReport: ''
    };
  }

  const getLogsInWeek = (mondayStr) => {
    const monday = parseDateStr(mondayStr);
    if (!monday) return [];
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return logs.filter(l => {
      const d = parseDateStr(l.LOG_DATE || l.NGÀY);
      return d && d >= monday && d <= sunday;
    });
  };

  const getLogsInMonth = (monthYearStr) => {
    const parts = monthYearStr.split('/');
    if (parts.length !== 2) return [];
    const m = parseInt(parts[0]) - 1;
    const y = parseInt(parts[1]);
    return logs.filter(l => {
      const d = parseDateStr(l.LOG_DATE || l.NGÀY);
      return d && d.getMonth() === m && d.getFullYear() === y;
    });
  };

  const handleUpdateLog = (field, value) => {
    let targetLogDate = selectedDate;

    // Support object of fields
    const updates = typeof field === 'object' ? field : { [field]: value };

    // Normalization helper
    const getMappedField = (f) => {
      let mapped = f;
      if (f === 'NHÂN_LỰC_SITE') mapped = 'MANPOWER';
      if (f === 'KỸ_SƯ_GS') mapped = 'ENGINEERS';
      if (f === 'THỜI_TIẾT') mapped = 'WEATHER';
      if (f === 'SỰ_CỐ') mapped = 'INCIDENT_COUNT';
      if (f === 'GHI_CHÚ_HIỆN_TRƯỜNG') mapped = 'DAILY_NOTE';
      if (f === 'ĐÁNH_GIÁ_TUẦN') mapped = 'WEEKLY_ASSESSMENT';
      return mapped;
    };

    // Map view edits to correct daily log row
    if (selectedView === 'week') {
      const weekLogs = getLogsInWeek(selectedWeek);
      if (weekLogs.length > 0) {
        weekLogs.sort((a, b) => parseDateStr(a.LOG_DATE || a.NGÀY) - parseDateStr(b.LOG_DATE || b.NGÀY));
        targetLogDate = weekLogs[weekLogs.length - 1].LOG_DATE || weekLogs[weekLogs.length - 1].NGÀY;
      } else {
        targetLogDate = selectedWeek;
      }
    } else if (selectedView === 'month') {
      const monthLogs = getLogsInMonth(selectedMonth);
      if (monthLogs.length > 0) {
        monthLogs.sort((a, b) => parseDateStr(a.LOG_DATE || a.NGÀY) - parseDateStr(b.LOG_DATE || b.NGÀY));
        targetLogDate = monthLogs[monthLogs.length - 1].LOG_DATE || monthLogs[monthLogs.length - 1].NGÀY;
      } else {
        targetLogDate = `01/${selectedMonth}`;
      }
    }

    const existingLog = logs.find(l => (l.LOG_DATE === targetLogDate || l.NGÀY === targetLogDate)) || {
      PROJECT_ID: id,
      LOG_DATE: targetLogDate,
      MANPOWER: 0,
      ENGINEERS: 0,
      WEATHER: '',
      INCIDENT_COUNT: 0,
      DAILY_NOTE: '',
      WEEKLY_ASSESSMENT: '',
      MONTHLY_REPORT: '',
      STATUS: 'Draft',
      UPDATED_BY: 'NV - GIÁM SÁT',
      UPDATED_AT: ''
    };

    const updatedFields = {};
    Object.keys(updates).forEach(k => {
      const mapped = getMappedField(k);
      const val = updates[k];
      updatedFields[mapped] = (mapped === 'MANPOWER' || mapped === 'ENGINEERS' || mapped === 'INCIDENT_COUNT') ? Number(val) : val;
    });

    const updatedLog = {
      ...existingLog,
      ...updatedFields,
      UPDATED_BY: 'NV - GIÁM SÁT',
      UPDATED_AT: new Date().toISOString()
    };

    // Update local logs list optimistically
    setLogs(prev => {
      const idx = prev.findIndex(l => (l.LOG_DATE === targetLogDate || l.NGÀY === targetLogDate));
      if (idx !== -1) {
        return prev.map((l, i) => i === idx ? { ...l, ...updatedLog } : l);
      } else {
        return [...prev, updatedLog];
      }
    });

    // Sync to GAS with debounce
    triggerSave(updatedLog);
  };

  const triggerSave = (payload) => {
    setSaveStatus('Saving...');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    pendingSaveRef.current = payload;
    saveTimeoutRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;
      await performSave();
    }, 1000);
  };

  const performSave = async () => {
    const toSave = pendingSaveRef.current;
    if (!toSave) {
      setSaveStatus('Saved');
      return;
    }

    isSavingRef.current = true;
    setSaveStatus('Saving...');
    pendingSaveRef.current = null;

    try {
      const payload = {
        PROJECT_ID: String(id),
        LOG_DATE: toSave.LOG_DATE,
        NGÀY: toSave.LOG_DATE,
        MANPOWER: toSave.MANPOWER !== undefined ? Number(toSave.MANPOWER || 0) : Number(toSave.NHÂN_LỰC_SITE || 0),
        NHÂN_LỰC_SITE: toSave.MANPOWER !== undefined ? Number(toSave.MANPOWER || 0) : Number(toSave.NHÂN_LỰC_SITE || 0),
        ENGINEERS: toSave.ENGINEERS !== undefined ? Number(toSave.ENGINEERS || 0) : Number(toSave.KỸ_SƯ_GS || 0),
        KỸ_SƯ_GS: toSave.ENGINEERS !== undefined ? Number(toSave.ENGINEERS || 0) : Number(toSave.KỸ_SƯ_GS || 0),
        WEATHER: toSave.WEATHER !== undefined ? toSave.WEATHER : (toSave.THỜI_TIẾT || ''),
        THỜI_TIẾT: toSave.WEATHER !== undefined ? toSave.WEATHER : (toSave.THỜI_TIẾT || ''),
        INCIDENT_COUNT: toSave.INCIDENT_COUNT !== undefined ? Number(toSave.INCIDENT_COUNT || 0) : Number(parseInt(toSave.SỰ_CỐ) || 0),
        SỰ_CỐ: `${toSave.INCIDENT_COUNT !== undefined ? Number(toSave.INCIDENT_COUNT || 0) : Number(parseInt(toSave.SỰ_CỐ) || 0)} vụ`,
        DAILY_NOTE: toSave.DAILY_NOTE !== undefined ? toSave.DAILY_NOTE : (toSave.GHI_CHÚ_HIỆN_TRƯỜNG || ''),
        GHI_CHÚ_HIỆN_TRƯỜNG: toSave.DAILY_NOTE !== undefined ? toSave.DAILY_NOTE : (toSave.GHI_CHÚ_HIỆN_TRƯỜNG || ''),
        WEEKLY_ASSESSMENT: toSave.WEEKLY_ASSESSMENT !== undefined ? toSave.WEEKLY_ASSESSMENT : (toSave.ĐÁNH_GIÁ_TUẦN || ''),
        ĐÁNH_GIÁ_TUẦN: toSave.WEEKLY_ASSESSMENT !== undefined ? toSave.WEEKLY_ASSESSMENT : (toSave.ĐÁNH_GIÁ_TUẦN || ''),
        MONTHLY_REPORT: toSave.DAILY_NOTE !== undefined ? toSave.DAILY_NOTE : (toSave.GHI_CHÚ_HIỆN_TRƯỜNG || ''),
        STATUS: 'Saved',
        UPDATED_BY: 'NV - GIÁM SÁT',
        UPDATED_AT: new Date().toISOString(),
        _rowIndex: toSave._rowIndex
      };

      const res = await api.updateSiteLog(payload);
      setSaveStatus('Saved');

      if (res && res.dailyLogs) {
        setLogs(res.dailyLogs);
        if (res.weeklyLogs) setWeeklyLogs(res.weeklyLogs);
        if (res.monthlyLogs) setMonthlyLogs(res.monthlyLogs);
      } else {
        const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
          api.getSiteLogs(id),
          api.getWeeklyLogs(id),
          api.getMonthlyLogs(id)
        ]);
        if (dailyRes) setLogs(dailyRes);
        if (weeklyRes) setWeeklyLogs(weeklyRes);
        if (monthlyRes) setMonthlyLogs(monthlyRes);
      }

    } catch (error) {
      console.error("Autosave error:", error);
      setSaveStatus('Error');
      pendingSaveRef.current = toSave;
    } finally {
      isSavingRef.current = false;
      if (pendingSaveRef.current && pendingSaveRef.current !== toSave) {
        performSave();
      }
    }
  };

  if (isLoading || !enrichedProject) {
    return (
      <div className="min-h-screen flex bg-[var(--bg-main)] text-slate-100 font-sans relative">
        <div className="absolute inset-0 z-50 bg-[var(--bg-main)]/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#5252ff]/30 border-t-[#5252ff] rounded-full animate-spin"></div>
            <span className="text-white font-medium text-sm tracking-wide">Đang tải chi tiết dự án...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-slate-100 font-sans">

      {/* LEFT SIDEBAR (Duplicated from App.jsx as requested) */}
      <aside className="w-64 border-r border-[var(--border-main)] bg-[#070b14] flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto hidden md:flex">
        <div>
          {/* Logo Brand */}
          <div className="p-6 flex items-center gap-3 border-b border-[var(--border-main)]/40 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 via-[#5252ff] to-[#8080ff] shadow-[0_0_12px_rgba(82,82,255,0.7)]"></div>
            <span className="text-sm font-bold tracking-wider text-white">VPEG-PXD-REPORT</span>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); navigate('/'); }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[#141c2f]/50 transition-all text-xs font-medium"
            >
              <Activity className="w-4 h-4 text-[var(--text-muted)]" />
              <span>TỔNG QUAN</span>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[#141c2f]/50 transition-all text-xs font-medium"
            >
              <Briefcase className="w-4 h-4 text-[var(--text-muted)]" />
              <span>DANH SÁCH CÔNG VIỆC</span>
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); navigate('/'); }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#5252ff]/10 text-[#7373ff] border-l-2 border-[#5252ff] shadow-[0_0_15px_rgba(82,82,255,0.08)] transition-all text-xs font-semibold"
            >
              <Folder className="w-4 h-4 text-[#5252ff]" />
              <span>CHI TIẾT DỰ ÁN</span>
            </a>
          </nav>
        </div>

        {/* User Profile Bottom */}
        <div className="p-4 border-t border-[var(--border-main)]/50 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--border-main)] flex items-center justify-center text-xs font-bold text-slate-300 border border-[#263554]">
            NV
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white">Nhân viên</span>
            <span className="text-[10px] text-[#3b82f6] font-bold tracking-wider mt-0.5">GIÁM SÁT</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full p-6 space-y-6">

          {/* SECTION 1 - HEADER */}
          <ProjectHeader project={enrichedProject} milestones={bundleData?.milestones || []} onBack={() => navigate('/')} />

          {/* SECTION 2 - KPI OVERVIEW */}
          <KPIOverview project={enrichedProject} milestones={bundleData?.milestones || []} />

          {/* SECTION 3 - MILESTONE TIMELINE */}
          <MilestoneTimeline project={enrichedProject} moduleProgress={moduleProgress} milestonesData={bundleData?.milestones || []} />

          {/* SECTION 4 - S-CURVE CHART (FULL WIDTH) */}
          <SCurveChart project={enrichedProject} milestonesData={bundleData?.milestones || []} />

          {/* SECTION 5 - SITE LOGS & OPERATIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={selectedView === 'day' ? 'lg:col-span-3' : 'lg:col-span-2'}>
              <SiteLogPanel
                project={enrichedProject}
                logs={logs}
                weeklyLogs={weeklyLogs}
                monthlyLogs={monthlyLogs}
                selectedView={selectedView}
                setSelectedView={setSelectedView}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedWeek={selectedWeek}
                setSelectedWeek={setSelectedWeek}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                activeLog={activeLog}
                onUpdateLog={handleUpdateLog}
                saveStatus={saveStatus}
              />
            </div>
            {selectedView !== 'day' && (
              <div className="lg:col-span-1">
                <WeeklyKPI
                  project={enrichedProject}
                  logs={logs}
                  weeklyLogs={weeklyLogs}
                  monthlyLogs={monthlyLogs}
                  selectedView={selectedView}
                  selectedDate={selectedDate}
                  selectedWeek={selectedWeek}
                  selectedMonth={selectedMonth}
                  activeLog={activeLog}
                  onUpdateLog={handleUpdateLog}
                  saveStatus={saveStatus}
                />
              </div>
            )}
          </div>

          {/* SECTION 7 - MAIN ACCORDION MODULES */}
          <div className="space-y-4 pt-4">
            <RiskModule project={enrichedProject} initialData={bundleData?.risks} />
            <PermitModule project={enrichedProject} initialData={bundleData?.permits} onProgressChange={(pct) => handleModuleProgressChange('permit', pct)} />
            <DesignModule project={enrichedProject} initialData={bundleData?.designs} onProgressChange={(pct) => handleModuleProgressChange('design', pct)} />
            <ProcurementModule project={enrichedProject} initialData={bundleData?.procurements} onProgressChange={(pct) => handleModuleProgressChange('procurement', pct)} />
            <ConstructionModule project={enrichedProject} initialData={bundleData?.constructions} onProgressChange={(pct) => handleModuleProgressChange('construction', pct)} />
            <HandoverModule project={enrichedProject} initialData={bundleData?.handovers} onProgressChange={(pct) => handleModuleProgressChange('handover', pct)} />
          </div>

        </div>
      </main>
    </div>
  );
}
