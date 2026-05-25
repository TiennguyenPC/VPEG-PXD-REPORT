import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Zap,
  Clock,
  CheckCircle2,
  Briefcase,
  FileText,
  ChevronDown,
  PlayCircle,
  Circle,
  Flag,
  Star,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../hooks/useSidebar';
import { api, OVERVIEW_REFRESH_EVENT } from '../services/api';
import { updateDashboardContext } from '../utils/dashboardContext';
import { getTaskDescription, enrichTaskForUI } from '../utils/taskFields';
import { enrichProjectsProgress } from '../utils/projectProgress';
import { buildOverviewRiskRows } from '../utils/riskHelpers';

const KPI_CARDS = [
  {
    key: 'capacity',
    label: 'Tổng công suất Site',
    icon: Zap,
    accent: 'from-[#5252ff]/20 to-transparent',
    iconBg: 'bg-[#5252ff]/15 text-[#7373ff]',
    borderHover: 'hover:border-[#5252ff]/40',
    glow: 'shadow-[0_0_24px_-8px_rgba(82,82,255,0.35)]',
  },
  {
    key: 'active',
    label: 'Dự án đang thi công',
    icon: Briefcase,
    accent: 'from-teal-500/15 to-transparent',
    iconBg: 'bg-teal-500/15 text-teal-400',
    borderHover: 'hover:border-teal-500/40',
    glow: 'shadow-[0_0_24px_-8px_rgba(20,184,166,0.25)]',
  },
  {
    key: 'risk',
    label: 'Risk cần xử lý',
    icon: AlertTriangle,
    accent: 'from-amber-500/15 to-transparent',
    iconBg: 'bg-amber-500/15 text-amber-400',
    borderHover: 'hover:border-amber-500/40',
    glow: 'shadow-[0_0_24px_-8px_rgba(245,158,11,0.2)]',
  },
  {
    key: 'tasks',
    label: 'Task quan trọng',
    icon: FileText,
    accent: 'from-rose-500/15 to-transparent',
    iconBg: 'bg-rose-500/15 text-rose-400',
    borderHover: 'hover:border-rose-500/40',
    glow: 'shadow-[0_0_24px_-8px_rgba(244,63,94,0.2)]',
  },
];

function PanelCard({ title, action, children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border-main)]/80 bg-[var(--bg-panel)]/90 backdrop-blur-sm overflow-hidden flex flex-col shadow-lg shadow-black/20 min-w-0 ${className}`}
    >
      <div className="px-6 py-4 border-b border-[var(--border-main)]/50 flex justify-between items-center gap-3 bg-gradient-to-r from-[#0e1628]/80 to-transparent shrink-0">
        <h3 className="text-sm font-bold text-[var(--text-strong)] tracking-wide truncate">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

const thBase = 'py-3 px-3 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider align-top';
const tdBase = 'py-3 px-3 text-xs align-top';
const textWrap = 'text-[11px] leading-snug break-words line-clamp-2';

function readCachedArray(key) {
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

function AssigneeCell({ name, fallback = 'Chưa rõ' }) {
  const display = (name || '').trim() || fallback;
  const initials = display.length >= 2 ? display.substring(0, 2).toUpperCase() : display.substring(0, 1).toUpperCase();
  return (
    <div className="flex items-start gap-2 min-w-[100px]">
      <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] font-bold shrink-0">
        {initials || '?'}
      </div>
      <span className={`${textWrap} font-medium text-[var(--text-main)] flex-1 min-w-0`} title={display}>
        {display}
      </span>
    </div>
  );
}

function CellText({ children, className = '', title }) {
  const label = title ?? (typeof children === 'string' ? children : undefined);
  return (
    <span className={`${textWrap} ${className}`} title={label}>
      {children}
    </span>
  );
}

export default function Overview() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const [projects, setProjects] = useState(() => readCachedArray('epc_projects_cache'));
  const [tasks, setTasks] = useState(() => readCachedArray('epc_tasks_cache'));
  const [allRisks, setAllRisks] = useState(() => readCachedArray('epc_risks_cache'));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [progressTick, setProgressTick] = useState(0);

  useEffect(() => {
    const refresh = () => setProgressTick((t) => t + 1);
    window.addEventListener('epc-progress-updated', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('epc-progress-updated', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const enrichedProjects = useMemo(
    () => enrichProjectsProgress(projects),
    [projects, progressTick]
  );

  useEffect(() => {
    let cancelled = false;

    const applyBundle = (bundle) => {
      if (cancelled || !bundle) return;
      setProjects(bundle.projects || []);
      setTasks(bundle.tasks || []);
      setAllRisks(bundle.risks || []);
    };

    const load = async () => {
      const hasCachedData =
        readCachedArray('epc_projects_cache').length > 0 ||
        readCachedArray('epc_tasks_cache').length > 0 ||
        readCachedArray('epc_risks_cache').length > 0;
      if (!hasCachedData) setIsRefreshing(true);
      try {
        const bundle = await api.getOverviewData();
        applyBundle(bundle);
      } catch (error) {
        console.error('Error fetching overview data', error);
      } finally {
        if (!cancelled) setIsRefreshing(false);
      }
    };

    load();

    const onRefreshed = (e) => applyBundle(e.detail);
    window.addEventListener(OVERVIEW_REFRESH_EVENT, onRefreshed);
    return () => {
      cancelled = true;
      window.removeEventListener(OVERVIEW_REFRESH_EVENT, onRefreshed);
    };
  }, []);

  // Khi quay lại Tổng quan từ trang khác — refresh nền (cache vẫn hiện ngay)
  const prevPathRef = React.useRef(location.pathname);
  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = location.pathname;
    if (location.pathname === '/' && prev !== '/') {
      api.getOverviewData().catch(() => {});
    }
  }, [location.pathname]);

  useEffect(() => {
    updateDashboardContext({ projects: enrichedProjects, tasks });
  }, [enrichedProjects, tasks]);

  const enrichedTasks = useMemo(() => tasks.map(enrichTaskForUI), [tasks]);

  const totalCapacity = useMemo(
    () => enrichedProjects.reduce((sum, p) => sum + (Number(p.capacity) || 0), 0),
    [enrichedProjects]
  );

  const activeProjects = useMemo(() => enrichedProjects.filter((p) => {
    const s = (p.status || '').toUpperCase();
    return s !== 'ĐÃ HOÀN THÀNH' && s !== 'HOÀN THÀNH' && s !== 'COMPLETED';
  }), [enrichedProjects]);

  const overviewRisks = useMemo(
    () => buildOverviewRiskRows(allRisks, enrichedProjects),
    [allRisks, enrichedProjects]
  );

  const riskCount = overviewRisks.length;
  const riskList = useMemo(() => overviewRisks.slice(0, 5), [overviewRisks]);

  const importantTasks = useMemo(() => enrichedTasks.filter((t) => {
    if (t.computedStatus === 'Đã hoàn thành') return false;
    const p = (t.ƯU_TIÊN || '').toUpperCase();
    return p !== 'THẤP' && p !== 'LOW' && p !== '';
  }), [enrichedTasks]);

  const progressProjects = useMemo(
    () => [...activeProjects].sort((a, b) => b.capacity - a.capacity).slice(0, 5),
    [activeProjects]
  );

  const priorityWeight = useMemo(() => ({
    'KHẨN CẤP': 4,
    IMPORTANT: 4,
    'QUAN TRỌNG': 3,
    'BÌNH THƯỜNG': 2,
    MEDIUM: 2,
    THẤP: 1,
    LOW: 1,
  }), []);

  const sortedTasks = useMemo(() => [...enrichedTasks]
    .filter((t) => t.computedStatus !== 'Đã hoàn thành')
    .sort((a, b) => {
      const pA = priorityWeight[(a.ƯU_TIÊN || '').toUpperCase()] || 0;
      const pB = priorityWeight[(b.ƯU_TIÊN || '').toUpperCase()] || 0;
      return pB - pA;
    })
    .slice(0, 6), [enrichedTasks, priorityWeight]);

  const kpiValues = useMemo(() => ({
    capacity: { value: totalCapacity.toLocaleString(), unit: 'kWp' },
    active: { value: activeProjects.length, unit: 'Dự án' },
    risk: { value: riskCount, unit: 'Vấn đề' },
    tasks: { value: importantTasks.length, unit: 'Công việc' },
  }), [totalCapacity, activeProjects.length, riskCount, importantTasks.length]);

  const todayLabel = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-[var(--text-main)] font-sans">
      <Sidebar activeItem="overview" isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        {/* Ambient background */}
        <div className="pointer-events-none fixed inset-0 ml-48 overflow-hidden">
          <div className="absolute -top-32 right-1/4 w-[480px] h-[480px] bg-[#5252ff]/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 w-[360px] h-[360px] bg-teal-500/5 rounded-full blur-[90px]" />
        </div>

        {isRefreshing && (
          <div className="absolute top-3 right-6 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-panel)]/90 border border-[var(--border-main)] text-[10px] text-[var(--text-muted)] shadow-sm">
            <div className="w-3 h-3 border-2 border-[#5252ff]/30 border-t-[#5252ff] rounded-full animate-spin" />
            Đang cập nhật...
          </div>
        )}

        <div className="relative z-10 px-8 pt-4 pb-4 border-b border-[var(--border-main)]/50 bg-[var(--bg-main)]">
        <header className="flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-[#5252ff] uppercase tracking-[0.2em] mb-1">Dashboard PXD</p>
            <h1 className="text-2xl font-black text-[var(--text-strong)] tracking-tight">Tổng quan</h1>
            <p className="text-xs text-[var(--text-muted)] mt-1 capitalize">{todayLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-2 bg-[var(--bg-panel)] border border-[var(--border-main)] hover:border-[#5252ff]/50 px-4 py-2 rounded-lg text-sm text-[var(--text-main)] transition-all shadow-sm"
            >
              <Calendar className="w-4 h-4 text-[#5252ff]" />
              <span className="font-semibold">Năm 2026</span>
              <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          </div>
        </header>

          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4 max-w-[1680px] w-full mx-auto min-w-0">
            {KPI_CARDS.map((card) => {
              const Icon = card.icon;
              const data = kpiValues[card.key];
              return (
                <div
                  key={card.key}
                  className={`group relative overflow-hidden rounded-xl border border-[var(--border-main)]/80 bg-[var(--bg-panel)] p-4 transition-all duration-300 ${card.borderHover} hover:-translate-y-0.5 ${card.glow}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-80`} />
                  <div className="relative flex justify-between items-start gap-3">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        {card.label}
                      </p>
                      <p className="text-2xl font-black text-[var(--text-strong)] tabular-nums tracking-tight">
                        {data.value}
                        <span className="text-xs font-semibold text-slate-500 ml-1.5">{data.unit}</span>
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${card.iconBg} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 px-8 pt-6 pb-6 space-y-8 max-w-[1680px] w-full mx-auto min-w-0">

          {/* Progress + Risks */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 min-w-0">
            <PanelCard title="Giám sát tiến độ dự án">
              <div className="p-3 flex-1 overflow-x-auto min-w-0">
                <table className="w-full border-collapse" style={{ minWidth: '420px' }}>
                  <colgroup>
                    <col style={{ width: '38%' }} />
                    <col style={{ width: '24%' }} />
                    <col style={{ width: '24%' }} />
                    <col style={{ width: '14%' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className={`${thBase} text-left`}>Dự án</th>
                      <th className={`${thBase} text-center`}>Kế hoạch</th>
                      <th className={`${thBase} text-center`}>Thực tế</th>
                      <th className={`${thBase} text-center`}>Đánh giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progressProjects.map((p) => {
                      const isDelayed = (p.planProgress ?? 0) > (p.actualProgress ?? 0);
                      const plan = Math.round(Number(p.planProgress) || 0);
                      const actual = Math.round(Number(p.actualProgress) || 0);
                      return (
                        <tr
                          key={p.id}
                          onClick={() => navigate(`/projects/${p.id}`)}
                          className="border-t border-[var(--border-main)]/40 hover:bg-[var(--bg-hover)] cursor-pointer transition-colors group/row"
                        >
                          <td className={tdBase}>
                            <div className="pr-1">
                          <CellText className="font-semibold text-[var(--text-main)]" title={p.name}>
                                {p.name}
                              </CellText>
                              <span className="text-[10px] text-slate-500 tabular-nums mt-0.5 block">{p.capacity} kWp</span>
                            </div>
                          </td>
                          <td className={tdBase}>
                            <div className="flex items-center justify-center gap-1.5 min-w-0">
                              <div className="w-full max-w-[72px] h-1.5 bg-[var(--border-main)] rounded-full overflow-hidden shrink">
                                <div className="h-full bg-[#5252ff] rounded-full" style={{ width: `${plan}%` }} />
                              </div>
                              <span className="text-[10px] text-slate-500 w-8 text-right tabular-nums shrink-0">{plan}%</span>
                            </div>
                          </td>
                          <td className={tdBase}>
                            <div className="flex items-center justify-center gap-1.5 min-w-0">
                              <div className="w-full max-w-[72px] h-1.5 bg-[var(--border-main)] rounded-full overflow-hidden shrink">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${actual}%` }} />
                              </div>
                              <span className="text-[10px] text-slate-500 w-8 text-right tabular-nums shrink-0">{actual}%</span>
                            </div>
                          </td>
                          <td className={`${tdBase} text-center`}>
                            <span
                              className={`inline-flex items-center justify-center whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isDelayed
                                  ? 'bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/25'
                                  : 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25'
                              }`}
                            >
                              {isDelayed ? 'Chậm' : 'Đạt'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {progressProjects.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-500 text-sm">
                          Chưa có dự án thi công
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </PanelCard>

            <PanelCard
              title="Vấn đề / Rủi ro nổi bật"
              action={
                <button
                  type="button"
                  className="text-xs text-[#7373ff] hover:text-[#a0a0ff] font-semibold flex items-center gap-1 transition-colors"
                  onClick={() => navigate('/projects')}
                >
                  Xem tất cả
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              }
            >
              <div className="overflow-x-auto flex-1 min-w-0 p-3">
                <table className="w-full border-collapse" style={{ minWidth: '520px' }}>
                  <colgroup>
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '34%' }} />
                    <col style={{ width: '38%' }} />
                    <col style={{ width: '14%' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-[var(--bg-hover)]/40">
                      <th className={`${thBase} text-left`}>Dự án</th>
                      <th className={`${thBase} text-left`}>Vấn đề</th>
                      <th className={`${thBase} text-left`}>Phụ trách</th>
                      <th className={`${thBase} text-center`}>Mức độ</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--text-main)]">
                    {riskList.map((r, idx) => {
                      const levelLabel = r.level || '-';
                      const s =
                        levelLabel === 'Cao'
                          ? { color: 'text-rose-400', ring: 'ring-rose-500/25', bg: 'bg-rose-500/10', label: 'Cao' }
                          : levelLabel === 'Trung bình'
                            ? { color: 'text-amber-400', ring: 'ring-amber-500/25', bg: 'bg-amber-500/10', label: 'TB' }
                            : {
                                color: 'text-slate-400',
                                ring: 'ring-slate-500/25',
                                bg: 'bg-slate-500/10',
                                label: levelLabel,
                              };

                      return (
                        <tr
                          key={idx}
                          className="border-t border-[var(--border-main)]/40 hover:bg-[var(--bg-hover)] cursor-pointer"
                          onClick={() => r.id && navigate(`/projects/${r.id}`)}
                        >
                          <td className={tdBase}>
                            <CellText className="font-semibold text-[var(--text-strong)]" title={r.project}>
                              {r.project}
                            </CellText>
                          </td>
                          <td className={tdBase}>
                            <CellText className="text-slate-400" title={r.issue}>
                              {r.issue}
                            </CellText>
                          </td>
                          <td className={tdBase}>
                            <AssigneeCell name={r.assignee} />
                          </td>
                          <td className={`${tdBase} text-center`}>
                            <span
                              className={`inline-flex items-center justify-center whitespace-nowrap px-2 py-0.5 rounded-md text-[10px] font-bold ring-1 ${s.bg} ${s.color} ${s.ring}`}
                            >
                              {s.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {riskList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center">
                          <div className="inline-flex flex-col items-center gap-2 text-slate-500">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500/60" />
                            <span className="text-sm">Không có rủi ro nghiêm trọng</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </PanelCard>
          </div>

          {/* Tasks */}
          <PanelCard
            title="Theo dõi công việc quan trọng"
            action={
              <button
                type="button"
                className="text-xs text-[#7373ff] hover:text-[#a0a0ff] font-semibold flex items-center gap-1 transition-colors"
                onClick={() => navigate('/tasks')}
              >
                Xem tất cả
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            <div className="overflow-x-auto min-w-0 p-3">
              <table className="w-full border-collapse" style={{ minWidth: '880px' }}>
                <colgroup>
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '9%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-[var(--bg-hover)]/50 border-b border-[var(--border-main)]/50">
                    <th className={`${thBase} text-left`}>Công việc</th>
                    <th className={`${thBase} text-left`}>Mô tả</th>
                    <th className={`${thBase} text-left`}>Phân công</th>
                    <th className={`${thBase} text-center`}>Bắt đầu</th>
                    <th className={`${thBase} text-center`}>Đến hạn</th>
                    <th className={`${thBase} text-center`}>Trạng thái</th>
                    <th className={`${thBase} text-center`}>Ưu tiên</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTasks.map((t) => {
                    const computedStatus = t.computedStatus || 'Chưa bắt đầu';

                    const priorityStr = (t.ƯU_TIÊN || '').toUpperCase();
                    let priorityLabel = 'Trung bình';
                    if (priorityStr === 'KHẨN CẤP' || priorityStr === 'URGENT') priorityLabel = 'Khẩn cấp';
                    else if (priorityStr === 'QUAN TRỌNG' || priorityStr === 'IMPORTANT') priorityLabel = 'Cao';
                    else if (priorityStr === 'THẤP' || priorityStr === 'LOW') priorityLabel = 'Thấp';

                    return (
                      <tr
                        key={t._rowIndex ?? `${t.TÁC_VỤ}-${t.PROJECT_ID}-${t.NGÀY_BẮT_ĐẦU}`}
                        className="border-t border-[var(--border-main)]/40 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                        onClick={() => navigate('/tasks')}
                      >
                        <td className={tdBase}>
                          <div className="flex items-start gap-1.5">
                            <Star className="w-3 h-3 text-slate-600 shrink-0 mt-0.5" />
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                                computedStatus === 'Trễ'
                                  ? 'bg-red-500'
                                  : computedStatus === 'Đang diễn ra'
                                    ? 'bg-blue-500'
                                    : 'bg-slate-500'
                              }`}
                            />
                            <CellText className="font-semibold text-[var(--text-main)] flex-1 min-w-0" title={t.TÁC_VỤ}>
                              {t.TÁC_VỤ}
                            </CellText>
                          </div>
                        </td>
                        <td className={tdBase}>
                          <CellText className="text-slate-400" title={getTaskDescription(t)}>
                            {getTaskDescription(t) || '—'}
                          </CellText>
                        </td>
                        <td className={tdBase}>
                          <AssigneeCell name={t.NHÂN_SỰ} fallback="Chưa phân công" />
                        </td>
                        <td className={`${tdBase} text-center text-slate-500 tabular-nums whitespace-nowrap`}>
                          {t.NGÀY_BẮT_ĐẦU_LOCAL || t.NGÀY_BẮT_ĐẦU || '—'}
                        </td>
                        <td
                          className={`${tdBase} text-center font-semibold tabular-nums whitespace-nowrap ${
                            computedStatus === 'Trễ' ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        >
                          {t.NGÀY_KẾT_THÚC_LOCAL || t.NGÀY_KẾT_THÚC || '—'}
                        </td>
                        <td className={`${tdBase} text-center`}>
                          <span
                            className={`inline-flex items-center justify-center gap-0.5 max-w-full px-1.5 py-0.5 rounded-md text-[9px] font-bold ring-1 whitespace-nowrap ${
                              computedStatus === 'Trễ'
                                ? 'bg-red-500/10 text-red-400 ring-red-500/25'
                                : computedStatus === 'Đang diễn ra'
                                  ? 'bg-blue-500/10 text-blue-400 ring-blue-500/25'
                                  : 'bg-slate-500/10 text-slate-400 ring-slate-500/25'
                            }`}
                            title={computedStatus}
                          >
                            {computedStatus === 'Đang diễn ra' ? (
                              <PlayCircle className="w-2.5 h-2.5 shrink-0" />
                            ) : computedStatus === 'Trễ' ? (
                              <Clock className="w-2.5 h-2.5 shrink-0" />
                            ) : (
                              <Circle className="w-2.5 h-2.5 shrink-0" />
                            )}
                            <span className="truncate">{computedStatus}</span>
                          </span>
                        </td>
                        <td className={`${tdBase} text-center`}>
                          <span
                            className={`inline-flex items-center justify-center gap-0.5 max-w-full px-1.5 py-0.5 rounded-md text-[9px] font-bold ring-1 whitespace-nowrap ${
                              priorityLabel === 'Khẩn cấp' || priorityLabel === 'Cao'
                                ? 'bg-red-500/10 text-red-400 ring-red-500/25'
                                : priorityLabel === 'Thấp'
                                  ? 'bg-slate-700/50 text-slate-400 ring-slate-600/50'
                                  : 'bg-amber-500/10 text-amber-400 ring-amber-500/25'
                            }`}
                          >
                            <Flag className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate">{priorityLabel}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {sortedTasks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 text-sm">
                        Không có công việc nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </PanelCard>
        </div>
      </main>
    </div>
  );
}
