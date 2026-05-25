import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Activity, Briefcase, Folder, Sun, Moon
} from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useSidebar } from "../hooks/useSidebar";
import Sidebar from "../components/Sidebar";
import ProjectHeader from "../components/project-details/ProjectHeader";
import ProjectSectionNav from "../components/project-details/ProjectSectionNav";
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
import { updateDashboardContext } from "../utils/dashboardContext";
import { syncProgressToProjectsCache } from "../utils/projectProgress";
import { useAuth } from "../context/AuthContext";
import { canEditProject, canShareProjectWithClient } from "../utils/permissions";
import { ProjectEditProvider } from "../context/ProjectEditContext";
import {
  parseFlexibleDate as parseDateStr,
  formatDateStr,
  getMondayOfDate,
  getTodayDMY,
  normalizeToDMY,
} from "../utils/timelineDates";

const getTodayStr = getTodayDMY;

const bundleCacheKey = (projectId) => `epc_bundle_${projectId}`;

const readBundleCache = (projectId) => {
  if (!projectId) return null;
  try {
    const raw = localStorage.getItem(bundleCacheKey(projectId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeBundleCache = (projectId, bundle) => {
  if (!projectId || !bundle) return;
  try {
    localStorage.setItem(bundleCacheKey(projectId), JSON.stringify(bundle));
  } catch { /* quota */ }
};

const pickLogSelections = (dailyRes = [], weeklyRes = [], monthlyRes = []) => {
  let selectedDate = getTodayStr();
  if (dailyRes.length > 0) {
    const sorted = [...dailyRes].sort((a, b) => parseDateStr(a.LOG_DATE || a.NGÀY) - parseDateStr(b.LOG_DATE || b.NGÀY));
    const latest = sorted[sorted.length - 1];
    selectedDate = latest ? (latest.LOG_DATE || latest.NGÀY) : getTodayStr();
  }

  let selectedWeek = formatDateStr(getMondayOfDate(new Date()));
  if (weeklyRes.length > 0) {
    const latestWeekly = weeklyRes[weeklyRes.length - 1];
    if (latestWeekly?.LOG_DATE) selectedWeek = latestWeekly.LOG_DATE;
  }

  let selectedMonth = `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`;
  if (monthlyRes.length > 0) {
    const latestMonthly = monthlyRes[monthlyRes.length - 1];
    const parts = latestMonthly?.LOG_DATE?.split('/');
    if (parts?.length === 3) selectedMonth = `${parts[1]}/${parts[2]}`;
  }

  return { selectedDate, selectedWeek, selectedMonth };
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const cachedBundle = readBundleCache(id);
  const cachedSelections = pickLogSelections(
    cachedBundle?.siteLogs,
    cachedBundle?.weeklyLogs,
    cachedBundle?.monthlyLogs
  );

  // Project & S-Curve State
  const [project, setProject] = useState(() => {
    if (cachedBundle?.project) return cachedBundle.project;
    try {
      const cached = localStorage.getItem('epc_projects_cache');
      if (!cached) return null;
      const list = JSON.parse(cached);
      return list.find((p) => String(p.id || p.PROJECT_ID) === String(id)) || null;
    } catch {
      return null;
    }
  });
  const [scurveData, setScurveData] = useState(() => cachedBundle?.scurve || []);
  const [isLoading, setIsLoading] = useState(() => {
    if (cachedBundle?.project) return false;
    try {
      const cached = localStorage.getItem('epc_projects_cache');
      if (!cached) return true;
      const list = JSON.parse(cached);
      return !list.find((p) => String(p.id || p.PROJECT_ID) === String(id));
    } catch {
      return true;
    }
  });

  // Centralized Operations State
  const [logs, setLogs] = useState(() => cachedBundle?.siteLogs || []);
  const [weeklyLogs, setWeeklyLogs] = useState(() => cachedBundle?.weeklyLogs || []);
  const [monthlyLogs, setMonthlyLogs] = useState(() => cachedBundle?.monthlyLogs || []);
  const [selectedView, setSelectedView] = useState('day'); // 'day' | 'week' | 'month'
  const [selectedDate, setSelectedDate] = useState(cachedSelections.selectedDate);
  const [selectedWeek, setSelectedWeek] = useState(cachedSelections.selectedWeek);
  const [selectedMonth, setSelectedMonth] = useState(cachedSelections.selectedMonth);
  const [saveStatus, setSaveStatus] = useState('Saved'); // 'Draft' | 'Saving...' | 'Saved' | 'Error'

  const saveTimeoutRef = useRef(null);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(null);

  const [bundleData, setBundleData] = useState(cachedBundle);

  const [moduleProgress, setModuleProgress] = useState({
    permit: 0,
    design: 0,
    procurement: 0,
    construction: 0,
    handover: 0
  });
  
  const [dynamicPlanPercent, setDynamicPlanPercent] = useState(null);

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
    const applyBundle = (bundle) => {
      if (!bundle) return;
      setBundleData(bundle);
      if (bundle.project) {
        setProject(bundle.project);
        setIsLoading(false);
      }
      if (bundle.scurve) setScurveData(bundle.scurve);

      const dailyRes = bundle.siteLogs || [];
      const weeklyRes = bundle.weeklyLogs || [];
      const monthlyRes = bundle.monthlyLogs || [];
      setLogs(dailyRes);
      setWeeklyLogs(weeklyRes);
      setMonthlyLogs(monthlyRes);

      const sel = pickLogSelections(dailyRes, weeklyRes, monthlyRes);
      setSelectedDate(sel.selectedDate);
      setSelectedWeek(sel.selectedWeek);
      setSelectedMonth(sel.selectedMonth);
    };

    const fetchAllData = async () => {
      try {
        let bundle = null;
        try {
          bundle = await api.getDashboardBundle(id);
        } catch (e) {
          console.warn("getDashboardBundle not supported or failed, falling back to individual endpoints", e);
        }

        if (bundle) {
          applyBundle(bundle);
          writeBundleCache(id, bundle);
        } else {
          const [projData, scurveRes, dailyRes, weeklyRes, monthlyRes] = await Promise.all([
            api.getProject(id),
            api.getSCurves(id),
            api.getSiteLogs(id),
            api.getWeeklyLogs(id),
            api.getMonthlyLogs(id)
          ]);
          if (projData) {
            setProject(projData);
            setIsLoading(false);
          }
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
  
  const basePlan = dynamicPlanPercent !== null 
    ? dynamicPlanPercent 
    : (project ? (
        project.planProgress !== undefined && project.planProgress !== null 
          ? Number(project.planProgress) 
          : (latestActualPoint ? latestActualPoint.plan : 0)
      ) : 0);
  
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

  useEffect(() => {
    if (!project || !id) return;
    updateDashboardContext({
      projectId: id,
      currentProject: {
        ...project,
        actualProgress: baseActual,
        planProgress: basePlan,
        delay: baseActual - basePlan,
      },
      milestones: bundleData?.milestones,
      risks: bundleData?.risks,
      procurements: bundleData?.procurements,
      constructions: bundleData?.constructions,
      siteLogs: logs,
      permits: bundleData?.permits,
      designs: bundleData?.designs,
    });
  }, [id, project, baseActual, basePlan, bundleData, logs]);

  // Persist progress so Tổng quan / Danh sách dự án hiện ngay (không chờ GAS)
  useEffect(() => {
    if (!project) return;
    const pId = project.PROJECT_ID || project.id;
    if (!pId) return;
    syncProgressToProjectsCache(pId, baseActual, basePlan);
  }, [baseActual, basePlan, project]);

  // Compute active log
  let activeLog = null;
  if (selectedView === 'day') {
    activeLog = logs.find(l => normalizeToDMY(l.LOG_DATE || l.NGÀY) === normalizeToDMY(selectedDate)) || {
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
    if (!canEditProject(user, id)) return;

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

    const existingLog = logs.find(l => normalizeToDMY(l.LOG_DATE || l.NGÀY) === normalizeToDMY(targetLogDate)) || {
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
      if (k === 'GHI_CHÚ_HIỆN_TRƯỜNG') {
        updatedFields.DAILY_NOTE = val;
        updatedFields.GHI_CHÚ_HIỆN_TRƯỜNG = val;
        return;
      }
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
      const idx = prev.findIndex(l => normalizeToDMY(l.LOG_DATE || l.NGÀY) === normalizeToDMY(targetLogDate));
      if (idx !== -1) {
        return prev.map((l, i) => i === idx ? { ...l, ...updatedLog } : l);
      } else {
        return [...prev, updatedLog];
      }
    });

    // Sync to GAS with debounce (ảnh hiện trường lưu ngay, không chờ 1 giây)
    const isPhotoSave = updates.GHI_CHÚ_HIỆN_TRƯỜNG !== undefined || updates.DAILY_NOTE !== undefined;
    triggerSave(updatedLog);
    if (isPhotoSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      pendingSaveRef.current = updatedLog;
      performSave();
    }
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
    if (!canEditProject(user, id)) {
      pendingSaveRef.current = null;
      setSaveStatus('Saved');
      return;
    }

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
        MONTHLY_REPORT: toSave.MONTHLY_REPORT !== undefined ? toSave.MONTHLY_REPORT : '',
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
        setBundleData((prev) => {
          const next = {
            ...(prev || {}),
            siteLogs: res.dailyLogs,
            weeklyLogs: res.weeklyLogs || prev?.weeklyLogs,
            monthlyLogs: res.monthlyLogs || prev?.monthlyLogs,
          };
          writeBundleCache(id, next);
          return next;
        });
      } else {
        const [dailyRes, weeklyRes, monthlyRes] = await Promise.all([
          api.getSiteLogs(id),
          api.getWeeklyLogs(id),
          api.getMonthlyLogs(id)
        ]);
        if (dailyRes) setLogs(dailyRes);
        if (weeklyRes) setWeeklyLogs(weeklyRes);
        if (monthlyRes) setMonthlyLogs(monthlyRes);
        setBundleData((prev) => {
          const next = {
            ...(prev || {}),
            siteLogs: dailyRes || prev?.siteLogs,
            weeklyLogs: weeklyRes || prev?.weeklyLogs,
            monthlyLogs: monthlyRes || prev?.monthlyLogs,
          };
          writeBundleCache(id, next);
          return next;
        });
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

  if (isLoading && !project) {
    return (
      <div className="min-h-screen flex bg-[var(--bg-main)] text-[var(--text-main)] font-sans relative">
        <div className="absolute inset-0 z-50 bg-[var(--bg-main)]/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#5252ff]/30 border-t-[#5252ff] rounded-full animate-spin"></div>
            <span className="text-[var(--text-strong)] font-medium text-sm tracking-wide">Đang tải chi tiết dự án...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] text-[var(--text-muted)]">
        Không tìm thấy dự án.
      </div>
    );
  }

  const projectEditable = canEditProject(user, id);

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-slate-100 font-sans">

      {/* LEFT SIDEBAR (Duplicated from App.jsx as requested) */}
      <Sidebar activeItem="project-detail" isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto print:overflow-visible">
        <ProjectEditProvider canEdit={projectEditable}>
        <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          <ProjectHeader
            project={enrichedProject} 
            milestones={bundleData?.milestones || []} 
            onBack={() => navigate('/')} 
            onToggleSidebar={toggleSidebar}
            isSidebarCollapsed={isCollapsed}
            shareMode={canShareProjectWithClient(user) ? 'public' : 'internal'}
          />

          <ProjectSectionNav />

          {/* SECTION 2 - KPI OVERVIEW */}
          <section id="section-kpi" className="scroll-mt-20">
            <KPIOverview project={enrichedProject} milestones={bundleData?.milestones || []} />
          </section>

          {/* SECTION 3 - MILESTONE TIMELINE */}
          <section id="section-timeline" className="scroll-mt-20">
            <MilestoneTimeline project={enrichedProject} moduleProgress={moduleProgress} milestonesData={bundleData?.milestones || []} />
          </section>

          {/* SECTION 4 - NHẬT KÝ & VẬN HÀNH (trước S-Curve để dễ thấy) */}
          <section id="section-site-log" className="scroll-mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 print:grid-cols-3 gap-6">
            <div className={selectedView === 'day' ? 'lg:col-span-3 print:col-span-3' : 'lg:col-span-2 print:col-span-2'}>
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
                onSaveStatusChange={setSaveStatus}
              />
            </div>
            {selectedView !== 'day' && (
              <div className="lg:col-span-1 print:col-span-1">
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
          </section>

          {/* SECTION 5 - S-CURVE CHART (FULL WIDTH) */}
          <section id="section-scurve" className="scroll-mt-20">
            <SCurveChart
              project={enrichedProject}
              milestonesData={bundleData?.milestones || []}
              initialData={scurveData}
              onPlanCalculated={setDynamicPlanPercent}
            />
          </section>

          {/* SECTION 6 - MAIN ACCORDION MODULES */}
          <section id="section-modules" className="scroll-mt-20 space-y-4 pt-4">
            <RiskModule project={enrichedProject} initialData={bundleData?.risks} />
            <PermitModule project={enrichedProject} initialData={bundleData?.permits} onProgressChange={(pct) => handleModuleProgressChange('permit', pct)} />
            <DesignModule project={enrichedProject} initialData={bundleData?.designs} onProgressChange={(pct) => handleModuleProgressChange('design', pct)} />
            <ProcurementModule project={enrichedProject} initialData={bundleData?.procurements} onProgressChange={(pct) => handleModuleProgressChange('procurement', pct)} />
            <ConstructionModule project={enrichedProject} initialData={bundleData?.constructions} onProgressChange={(pct) => handleModuleProgressChange('construction', pct)} />
            <HandoverModule project={enrichedProject} initialData={bundleData?.handovers} onProgressChange={(pct) => handleModuleProgressChange('handover', pct)} />
          </section>

        </div>
        </ProjectEditProvider>
      </main>
    </div>
  );
}
