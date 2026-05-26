import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  ChevronDown,
  Calendar,
  ArrowUpRight,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../hooks/useSidebar';
import { api, OVERVIEW_REFRESH_EVENT } from '../services/api';
import { updateDashboardContext } from '../utils/dashboardContext';
import { enrichTaskForUI, formatAssigneeDisplay, parseAssignees } from '../utils/taskFields';
import AssigneeDisplay from '../components/AssigneeDisplay';
import { enrichProjectsProgress } from '../utils/projectProgress';
import { buildOverviewRiskRows } from '../utils/riskHelpers';
import { parseFlexibleDate } from '../utils/timelineDates';
import OverviewProgressMobile from '../components/mobile/OverviewProgressMobile';
import OverviewRiskMobile from '../components/mobile/OverviewRiskMobile';

const KPI_CARDS = [
  {
    key: 'risk',
    label: 'Risk cần xử lý',
    icon: AlertTriangle,
    accent: 'from-amber-500/15 to-transparent',
    iconBg: 'bg-amber-500/15 text-amber-400',
    borderHover: 'hover:border-amber-500/40',
    glow: 'shadow-[0_0_24px_-8px_rgba(245,158,11,0.2)]',
    scrollTarget: 'risk',
  },
  {
    key: 'tasks',
    label: 'Task quan trọng',
    icon: FileText,
    accent: 'from-rose-500/15 to-transparent',
    iconBg: 'bg-rose-500/15 text-rose-400',
    borderHover: 'hover:border-rose-500/40',
    glow: 'shadow-[0_0_24px_-8px_rgba(244,63,94,0.2)]',
    scrollTarget: 'tasks',
  },
];

function PanelCard({ title, subtitle, action, children, className = '', centerTitle = false }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border-main)]/80 bg-[var(--bg-panel)]/90 backdrop-blur-sm overflow-hidden flex flex-col shadow-lg shadow-black/20 min-w-0 ${className}`}
    >
      <div
        className={`px-4 py-2.5 border-b border-[var(--border-main)]/50 bg-gradient-to-r from-[#0e1628]/80 to-transparent shrink-0 ${
          centerTitle ? 'relative flex items-center justify-center' : 'flex justify-between items-center gap-3'
        }`}
      >
        <div className={`min-w-0 ${centerTitle ? 'text-center' : ''}`}>
          <h3 className={`text-sm font-bold text-[var(--text-strong)] tracking-wide ${centerTitle ? 'text-center' : 'truncate'}`}>
            {title}
          </h3>
          {subtitle ? (
            <p className={`text-[10px] text-slate-500 mt-0.5 ${centerTitle ? 'text-center' : 'truncate'}`}>{subtitle}</p>
          ) : null}
        </div>
        {action ? <div className={`shrink-0 ${centerTitle ? 'absolute right-4 top-1/2 -translate-y-1/2' : ''}`}>{action}</div> : null}
      </div>
      {children}
    </div>
  );
}

const thBase = 'py-2 px-2.5 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider align-top';
const tdBase = 'py-2 px-2.5 text-xs align-top';
const textWrap = 'text-[11px] leading-snug break-words line-clamp-2';

function readCachedArray(key) {
  try {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

function CellText({ children, className = '', title }) {
  const label = title ?? (typeof children === 'string' ? children : undefined);
  return (
    <span className={`${textWrap} ${className}`} title={label}>
      {children}
    </span>
  );
}

const KANBAN_COLUMNS = [
  { key: 'overdue', label: 'Quá hạn', dot: 'bg-red-500', text: 'text-red-400', dateText: 'text-red-400' },
  { key: 'today', label: 'Hạn hôm nay', dot: 'bg-amber-400', text: 'text-amber-400', dateText: 'text-amber-400' },
  { key: 'upcoming', label: 'Sắp đến hạn', dot: 'bg-blue-500', text: 'text-blue-400', dateText: 'text-blue-400' },
  { key: 'completed', label: 'Hoàn thành', dot: 'bg-emerald-500', text: 'text-emerald-400', dateText: 'text-emerald-400' },
];

function formatShortDueDate(dateStr) {
  if (!dateStr) return '—';
  const parts = String(dateStr).split('/');
  if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
  return dateStr;
}

function categorizeTaskByDue(task, today) {
  const status = task.computedStatus || task.TRẠNG_THÁI || '';
  if (status === 'Đã hoàn thành') return 'completed';

  const endDate = parseFlexibleDate(task.NGÀY_KẾT_THÚC_LOCAL || task.NGÀY_KẾT_THÚC);
  if (!endDate) return 'upcoming';
  if (endDate < today) return 'overdue';
  if (endDate.getTime() === today.getTime()) return 'today';
  return 'upcoming';
}

function TaskKanbanCard({ task, column, onClick }) {
  const isCompleted = column.key === 'completed';
  const projectLabel = (task.TÊN_DỰ_ÁN || task.PROJECT_ID || '').trim() || '—';
  const assigneeFull = (task.NHÂN_SỰ || '').trim();
  const assigneeList = parseAssignees(assigneeFull);
  const assigneeLabel = assigneeList.length <= 1
    ? (assigneeList[0] || null)
    : formatAssigneeDisplay(assigneeFull);
  const dueRaw = task.NGÀY_KẾT_THÚC_LOCAL || task.NGÀY_KẾT_THÚC;
  const dueShort = formatShortDueDate(dueRaw);
  const dueLabel = dueShort === '—' ? dueShort : `Hạn ${dueShort}`;
  const metaLine = assigneeLabel ? `${projectLabel} - ${assigneeLabel}` : projectLabel;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-lg border border-[var(--border-main)]/70 bg-[var(--bg-main)]/40 hover:bg-[var(--bg-hover)]/60 hover:border-[var(--border-main)] transition-colors p-2.5 flex flex-col gap-1.5"
    >
      <div
        className="text-[10px] text-slate-500 uppercase tracking-wide truncate"
        title={[projectLabel, assigneeFull].filter(Boolean).join(' - ')}
      >
        {metaLine}
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 min-w-0 flex-1">
          {isCompleted ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${column.dot}`} />
          )}
          <span className="text-xs font-semibold text-[var(--text-main)] leading-snug line-clamp-2" title={task.TÁC_VỤ}>
            {task.TÁC_VỤ}
          </span>
        </div>
        <span
          className={`text-[10px] font-semibold tabular-nums shrink-0 pt-0.5 ${column.dateText}`}
          title={dueRaw ? `Hạn hoàn thành: ${dueRaw}` : undefined}
        >
          {dueLabel}
        </span>
      </div>
    </button>
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

  const kpiValues = useMemo(() => ({
    risk: { value: riskCount, unit: 'Vấn đề' },
    tasks: { value: importantTasks.length, unit: 'Công việc' },
  }), [riskCount, importantTasks.length]);

  const kanbanTasks = useMemo(() => enrichedTasks.filter((t) => {
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

  const taskBuckets = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets = { overdue: [], today: [], upcoming: [], completed: [] };

    const sortByPriorityThenDue = (a, b) => {
      const pA = priorityWeight[(a.ƯU_TIÊN || '').toUpperCase()] || 0;
      const pB = priorityWeight[(b.ƯU_TIÊN || '').toUpperCase()] || 0;
      if (pB !== pA) return pB - pA;
      const dA = parseFlexibleDate(a.NGÀY_KẾT_THÚC_LOCAL || a.NGÀY_KẾT_THÚC)?.getTime() ?? 0;
      const dB = parseFlexibleDate(b.NGÀY_KẾT_THÚC_LOCAL || b.NGÀY_KẾT_THÚC)?.getTime() ?? 0;
      return dA - dB;
    };

    kanbanTasks.forEach((task) => {
      const bucket = categorizeTaskByDue(task, today);
      buckets[bucket].push(task);
    });

    Object.keys(buckets).forEach((key) => {
      buckets[key].sort(sortByPriorityThenDue);
      buckets[key] = buckets[key].slice(0, 4);
    });

    return buckets;
  }, [kanbanTasks, priorityWeight]);

  const todayLabel = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const riskPanelRef = useRef(null);
  const tasksPanelRef = useRef(null);
  const [highlightSection, setHighlightSection] = useState(null);

  const scrollToOverviewSection = useCallback((section) => {
    const ref = section === 'risk' ? riskPanelRef : tasksPanelRef;
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setHighlightSection(section);
    window.setTimeout(() => setHighlightSection(null), 1800);
  }, []);

  const sectionHighlightClass = (section) =>
    highlightSection === section
      ? 'rounded-2xl ring-2 ring-[#5252ff]/60 shadow-[0_0_24px_-6px_rgba(82,82,255,0.35)] transition-shadow duration-300'
      : 'rounded-2xl transition-shadow duration-300';

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-[var(--text-main)] font-sans">
      <Sidebar activeItem="overview" isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative pb-mobile-nav">
        {/* Ambient background */}
        <div className="pointer-events-none fixed inset-0 md:ml-48 overflow-hidden">
          <div className="absolute -top-32 right-1/4 w-[480px] h-[480px] bg-[#5252ff]/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 w-[360px] h-[360px] bg-teal-500/5 rounded-full blur-[90px]" />
        </div>

        {isRefreshing && (
          <div className="absolute top-3 right-4 md:right-6 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-panel)]/90 border border-[var(--border-main)] text-[10px] text-[var(--text-muted)] shadow-sm">
            <div className="w-3 h-3 border-2 border-[#5252ff]/30 border-t-[#5252ff] rounded-full animate-spin" />
            Đang cập nhật...
          </div>
        )}

        <div className="relative z-10 px-4 md:px-6 pt-3 pb-2 border-b border-[var(--border-main)]/50 bg-[var(--bg-main)]">
        <header className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center max-md:mobile-header-offset">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-[#5252ff] uppercase tracking-[0.2em] mb-0.5">Dashboard PXD</p>
            <h1 className="text-lg md:text-xl font-black text-[var(--text-strong)] tracking-tight">Tổng quan</h1>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5 capitalize">{todayLabel}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              className="flex items-center gap-1.5 md:gap-2 bg-[var(--bg-panel)] border border-[var(--border-main)] hover:border-[#5252ff]/50 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm text-[var(--text-main)] transition-all shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#5252ff]" />
              <span className="font-semibold">Năm 2026</span>
              <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--text-muted)]" />
            </button>
          </div>
        </header>

          {/* KPI row */}
          <div className="grid grid-cols-2 gap-2.5 md:gap-3 mt-3 w-full min-w-0">
            {KPI_CARDS.map((card) => {
              const Icon = card.icon;
              const data = kpiValues[card.key];
              const isNavCard = Boolean(card.scrollTarget);
              const cardClass = `group relative overflow-hidden rounded-xl border border-[var(--border-main)]/80 bg-[var(--bg-panel)] p-2.5 md:p-3 transition-all duration-300 ${card.borderHover} md:hover:-translate-y-0.5 ${card.glow} ${isNavCard ? 'cursor-pointer text-left w-full' : ''}`;

              const cardBody = (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-80`} />
                  <div className="relative flex justify-between items-start gap-2">
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        {card.label}
                      </p>
                      <p className="text-lg md:text-xl font-black text-[var(--text-strong)] tabular-nums tracking-tight">
                        {data.value}
                        <span className="text-xs font-semibold text-slate-500 ml-1.5">{data.unit}</span>
                      </p>
                    </div>
                    <div className={`p-2 rounded-lg ${card.iconBg} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                </>
              );

              if (isNavCard) {
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => scrollToOverviewSection(card.scrollTarget)}
                    className={cardClass}
                    title={card.scrollTarget === 'risk' ? 'Xem rủi ro nổi bật' : 'Xem công việc quan trọng'}
                  >
                    {cardBody}
                  </button>
                );
              }

              return (
                <div key={card.key} className={cardClass}>
                  {cardBody}
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 px-4 md:px-6 pt-3 pb-4 space-y-4 max-w-[1680px] w-full mx-auto min-w-0 mobile-content-compact">

          {/* Progress + Risks */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 min-w-0">
            <PanelCard title="Giám sát tiến độ dự án">
              <div className="md:hidden">
                <OverviewProgressMobile
                  projects={progressProjects}
                  onOpenProject={(id) => navigate(`/projects/${id}`)}
                />
              </div>
              <div className="hidden md:block p-2 flex-1 overflow-x-auto min-w-0">
                <table className="w-full border-collapse">
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
                        <td colSpan={4} className="py-8 text-center text-slate-500 text-sm">
                          Chưa có dự án thi công
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </PanelCard>

            <div ref={riskPanelRef} className={`min-w-0 scroll-mt-4 ${sectionHighlightClass('risk')}`}>
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
              <div className="md:hidden">
                <OverviewRiskMobile risks={riskList} onOpenProject={(id) => navigate(`/projects/${id}`)} />
              </div>
              <div className="hidden md:block overflow-x-auto flex-1 min-w-0 p-2">
                <table className="w-full border-collapse">
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
                            <AssigneeDisplay assignees={r.assignee} variant="overview" fallback="Chưa rõ" />
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
                        <td colSpan={4} className="py-8 text-center">
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
          </div>

          {/* Tasks */}
          <div ref={tasksPanelRef} className={`scroll-mt-4 ${sectionHighlightClass('tasks')}`}>
          <PanelCard
            title="Theo dõi công việc quan trọng"
            subtitle="Phân loại theo hạn hoàn thành (ngày kết thúc)"
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
            <div className="p-2.5 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-md:flex max-md:overflow-x-auto max-md:gap-3 max-md:pb-2 max-md:snap-x max-md:snap-mandatory">
                {KANBAN_COLUMNS.map((col) => (
                  <div
                    key={col.key}
                    className="min-w-0 flex flex-col gap-1.5 relative max-md:min-w-[82vw] max-md:max-w-[82vw] max-md:shrink-0 max-md:snap-start"
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1 px-1">
                      <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <span className={`text-xs font-semibold ${col.text}`}>{col.label}</span>
                      <span className="text-xs text-slate-500">({taskBuckets[col.key].length})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {taskBuckets[col.key].map((t) => (
                        <TaskKanbanCard
                          key={t._rowIndex ?? `${t.TÁC_VỤ}-${t.PROJECT_ID}-${t.NGÀY_BẮT_ĐẦU}`}
                          task={t}
                          column={col}
                          onClick={() => navigate('/tasks')}
                        />
                      ))}
                      {taskBuckets[col.key].length === 0 && (
                        <div className="w-full py-4 text-center text-[11px] text-slate-500 border border-dashed border-[var(--border-main)]/50 rounded-lg">
                          Không có
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {kanbanTasks.length === 0 && (
                <div className="py-6 text-center text-slate-500 text-sm">
                  Không có công việc quan trọng
                </div>
              )}
            </div>
          </PanelCard>
          </div>
        </div>
      </main>
    </div>
  );
}
