import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ListTodo,
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
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useSidebar } from '../hooks/useSidebar';
import { api } from '../services/api';
import { updateDashboardContext } from '../utils/dashboardContext';

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
      className={`rounded-2xl border border-[var(--border-main)]/80 bg-[var(--bg-panel)]/90 backdrop-blur-sm overflow-hidden flex flex-col shadow-lg shadow-black/20 ${className}`}
    >
      <div className="px-6 py-4 border-b border-[var(--border-main)]/50 flex justify-between items-center bg-gradient-to-r from-[#0e1628]/80 to-transparent">
        <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function Overview() {
  const navigate = useNavigate();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [projData, taskData] = await Promise.all([api.getProjects(), api.getTasks()]);
        setProjects(projData || []);
        setTasks(taskData || []);
      } catch (error) {
        console.error('Error fetching overview data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    updateDashboardContext({ projects, tasks });
  }, [projects, tasks]);

  const totalCapacity = projects.reduce((sum, p) => sum + (Number(p.capacity) || 0), 0);

  const activeProjects = projects.filter((p) => {
    const s = (p.status || '').toUpperCase();
    return s !== 'ĐÃ HOÀN THÀNH' && s !== 'HOÀN THÀNH' && s !== 'COMPLETED';
  });

  const highMediumRisks = projects.filter((p) => {
    const r = (p.risk || '').toUpperCase();
    return r === 'MEDIUM' || r === 'HIGH' || r === 'TRUNG BÌNH' || r === 'CAO';
  });

  const importantTasks = tasks
    .filter((t) => {
      const p = (t.ƯU_TIÊN || '').toUpperCase();
      return p === 'KHẨN CẤP' || p === 'QUAN TRỌNG' || p === 'IMPORTANT';
    })
    .filter((t) => t.TRẠNG_THÁI !== 'Đã hoàn thành');

  const progressProjects = [...activeProjects].sort((a, b) => b.capacity - a.capacity).slice(0, 5);

  const riskList = highMediumRisks
    .map((p) => ({
      project: p.name,
      id: p.id,
      issue: p.issue && p.issue !== 'Không có' ? p.issue : 'Chưa cập nhật chi tiết',
      assignee: p.pm || 'Chưa rõ',
      level: p.risk,
    }))
    .slice(0, 5);

  const priorityWeight = {
    'KHẨN CẤP': 4,
    IMPORTANT: 4,
    'QUAN TRỌNG': 3,
    'BÌNH THƯỜNG': 2,
    MEDIUM: 2,
    THẤP: 1,
    LOW: 1,
  };

  const sortedTasks = [...tasks]
    .filter((t) => t.TRẠNG_THÁI !== 'Đã hoàn thành')
    .sort((a, b) => {
      const pA = priorityWeight[(a.ƯU_TIÊN || '').toUpperCase()] || 0;
      const pB = priorityWeight[(b.ƯU_TIÊN || '').toUpperCase()] || 0;
      return pB - pA;
    })
    .slice(0, 6);

  const kpiValues = {
    capacity: { value: totalCapacity.toLocaleString(), unit: 'kWp' },
    active: { value: activeProjects.length, unit: 'Dự án' },
    risk: { value: highMediumRisks.length, unit: 'Vấn đề' },
    tasks: { value: importantTasks.length, unit: 'Công việc' },
  };

  const todayLabel = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen flex bg-[var(--bg-main)] text-slate-100 font-sans">
      <Sidebar activeItem="overview" isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        {/* Ambient background */}
        <div className="pointer-events-none fixed inset-0 ml-48 overflow-hidden">
          <div className="absolute -top-32 right-1/4 w-[480px] h-[480px] bg-[#5252ff]/8 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 w-[360px] h-[360px] bg-teal-500/5 rounded-full blur-[90px]" />
        </div>

        {isLoading && (
          <div className="absolute inset-0 z-50 bg-[var(--bg-main)]/85 backdrop-blur-md flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-[#5252ff]/30 border-t-[#5252ff] rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Đang tải tổng quan...</span>
            </div>
          </div>
        )}

        <header className="sticky top-0 z-20 px-8 py-5 flex justify-between items-center border-b border-[var(--border-main)]/50 bg-[var(--bg-main)]/75 backdrop-blur-xl">
          <div>
            <p className="text-[10px] font-bold text-[#5252ff] uppercase tracking-[0.2em] mb-1">Dashboard PXD</p>
            <h1 className="text-2xl font-black text-white tracking-tight">Tổng quan</h1>
            <p className="text-xs text-[var(--text-muted)] mt-1 capitalize">{todayLabel}</p>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 bg-[var(--bg-panel)] border border-[var(--border-main)] hover:border-[#5252ff]/50 px-4 py-2 rounded-lg text-sm text-slate-200 transition-all shadow-sm"
          >
            <Calendar className="w-4 h-4 text-[#5252ff]" />
            <span className="font-semibold">Năm 2026</span>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>
        </header>

        <div className="relative z-10 px-8 py-8 space-y-8 max-w-[1680px] w-full mx-auto">
          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {KPI_CARDS.map((card) => {
              const Icon = card.icon;
              const data = kpiValues[card.key];
              return (
                <div
                  key={card.key}
                  className={`group relative overflow-hidden rounded-2xl border border-[var(--border-main)]/80 bg-gradient-to-br from-[#0c1221] to-[var(--bg-panel)] p-5 transition-all duration-300 ${card.borderHover} hover:-translate-y-0.5 ${card.glow}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-80`} />
                  <div className="relative flex justify-between items-start gap-3">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        {card.label}
                      </p>
                      <p className="text-3xl font-black text-white tabular-nums tracking-tight">
                        {data.value}
                        <span className="text-sm font-semibold text-slate-500 ml-1.5">{data.unit}</span>
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl ${card.iconBg} shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress + Risks */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <PanelCard title="Giám sát tiến độ dự án">
              <div className="p-2 flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[480px]">
                  <thead>
                    <tr className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">Dự án</th>
                      <th className="py-3 px-4 font-semibold">Kế hoạch</th>
                      <th className="py-3 px-4 font-semibold">Thực tế</th>
                      <th className="py-3 px-4 text-center font-semibold">Đánh giá</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {progressProjects.map((p) => {
                      const isDelayed = (p.planProgress ?? 0) > (p.actualProgress ?? 0);
                      const plan = Math.round(Number(p.planProgress) || 0);
                      const actual = Math.round(Number(p.actualProgress) || 0);
                      return (
                        <tr
                          key={p.id}
                          onClick={() => navigate(`/projects/${p.id}`)}
                          className="border-t border-[var(--border-main)]/40 hover:bg-[#141c2f]/60 cursor-pointer transition-colors group/row"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-100 group-hover/row:text-white truncate max-w-[140px]">
                                {p.name}
                              </span>
                              <span className="text-[10px] text-slate-500 shrink-0">{p.capacity} kWp</span>
                              <ArrowUpRight className="w-3 h-3 text-[#5252ff] opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0" />
                            </div>
                          </td>
                          <td className="py-4 px-4 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-[#060a13] rounded-full overflow-hidden">
                                <div className="h-full bg-[#5252ff] rounded-full transition-all" style={{ width: `${plan}%` }} />
                              </div>
                              <span className="text-[10px] text-slate-500 w-7 text-right tabular-nums">{plan}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-[#060a13] rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${actual}%` }} />
                              </div>
                              <span className="text-[10px] text-slate-500 w-7 text-right tabular-nums">{actual}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold ${
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
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse min-w-[480px]">
                  <thead>
                    <tr className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider bg-[#060a13]/40">
                      <th className="py-3 px-5 font-semibold">Dự án</th>
                      <th className="py-3 px-4 font-semibold">Vấn đề</th>
                      <th className="py-3 px-4 font-semibold">Phụ trách</th>
                      <th className="py-3 px-4 text-center font-semibold">Mức độ</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-slate-200">
                    {riskList.map((r, idx) => {
                      const levelObj = {
                        HIGH: { color: 'text-rose-400', ring: 'ring-rose-500/25', bg: 'bg-rose-500/10', label: 'Cao' },
                        CAO: { color: 'text-rose-400', ring: 'ring-rose-500/25', bg: 'bg-rose-500/10', label: 'Cao' },
                        MEDIUM: { color: 'text-amber-400', ring: 'ring-amber-500/25', bg: 'bg-amber-500/10', label: 'TB' },
                        'TRUNG BÌNH': { color: 'text-amber-400', ring: 'ring-amber-500/25', bg: 'bg-amber-500/10', label: 'TB' },
                      };
                      const s = levelObj[(r.level || '').toUpperCase()] || {
                        color: 'text-slate-400',
                        ring: 'ring-slate-500/25',
                        bg: 'bg-slate-500/10',
                        label: r.level || '-',
                      };

                      return (
                        <tr
                          key={idx}
                          className="border-t border-[var(--border-main)]/40 hover:bg-[#141c2f]/50 cursor-pointer"
                          onClick={() => r.id && navigate(`/projects/${r.id}`)}
                        >
                          <td className="py-4 px-5 font-semibold text-white">{r.project}</td>
                          <td className="py-4 px-4 text-slate-400 max-w-[160px] truncate" title={r.issue}>
                            {r.issue}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {r.assignee ? r.assignee.substring(0, 1).toUpperCase() : '?'}
                              </div>
                              <span className="truncate max-w-[90px] font-medium">{r.assignee}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold ring-1 ${s.bg} ${s.color} ${s.ring}`}
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider bg-[#060a13]/50 border-b border-[var(--border-main)]/50">
                    <th className="py-3.5 px-5 font-semibold">Công việc</th>
                    <th className="py-3.5 px-4 font-semibold">Mô tả</th>
                    <th className="py-3.5 px-4 font-semibold">Phân công</th>
                    <th className="py-3.5 px-4 font-semibold">Bắt đầu</th>
                    <th className="py-3.5 px-4 font-semibold">Đến hạn</th>
                    <th className="py-3.5 px-4 text-center font-semibold">Trạng thái</th>
                    <th className="py-3.5 px-4 text-center font-semibold">Ưu tiên</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTasks.map((t, idx) => {
                    const statusStr = (t.TRẠNG_THÁI || '').toUpperCase();
                    let computedStatus = 'Chưa bắt đầu';
                    if (statusStr === 'ĐÃ HOÀN THÀNH' || statusStr === 'COMPLETED' || statusStr === 'HOÀN THÀNH')
                      computedStatus = 'Đã hoàn thành';
                    else if (statusStr === 'ĐANG DIỄN RA' || statusStr === 'IN PROGRESS') computedStatus = 'Đang diễn ra';
                    else if (statusStr === 'TRỄ HẠN' || statusStr === 'TRỄ' || statusStr === 'OVERDUE') computedStatus = 'Trễ';

                    const priorityStr = (t.ƯU_TIÊN || '').toUpperCase();
                    let priorityLabel = 'Trung bình';
                    if (priorityStr === 'KHẨN CẤP' || priorityStr === 'URGENT') priorityLabel = 'Khẩn cấp';
                    else if (priorityStr === 'QUAN TRỌNG' || priorityStr === 'IMPORTANT') priorityLabel = 'Cao';
                    else if (priorityStr === 'THẤP' || priorityStr === 'LOW') priorityLabel = 'Thấp';

                    return (
                      <tr
                        key={idx}
                        className="border-t border-[var(--border-main)]/40 hover:bg-[#141c2f]/50 transition-colors cursor-pointer"
                        onClick={() => navigate('/tasks')}
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-start gap-2.5">
                            <Star className="w-3.5 h-3.5 text-slate-600 shrink-0 mt-1" />
                            <span
                              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                computedStatus === 'Trễ'
                                  ? 'bg-red-500'
                                  : computedStatus === 'Đang diễn ra'
                                    ? 'bg-blue-500'
                                    : 'bg-slate-500'
                              }`}
                            />
                            <span className="font-semibold text-sm text-slate-100">{t.TÁC_VỤ}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-400 max-w-[200px] truncate" title={t.MÔ_TẢ}>
                          {t.MÔ_TẢ || '—'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-[9px] font-bold">
                              {t.NHÂN_SỰ ? t.NHÂN_SỰ.substring(0, 2).toUpperCase() : 'NV'}
                            </div>
                            <span className="text-slate-300 font-medium text-xs">{t.NHÂN_SỰ || 'Chưa phân công'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-500 tabular-nums">{t.NGÀY_BẮT_ĐẦU || '—'}</td>
                        <td
                          className={`py-4 px-4 font-semibold tabular-nums ${computedStatus === 'Trễ' ? 'text-red-400' : 'text-emerald-400'}`}
                        >
                          {t.NGÀY_KẾT_THÚC || '—'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold ring-1 ${
                              computedStatus === 'Trễ'
                                ? 'bg-red-500/10 text-red-400 ring-red-500/25'
                                : computedStatus === 'Đang diễn ra'
                                  ? 'bg-blue-500/10 text-blue-400 ring-blue-500/25'
                                  : 'bg-slate-500/10 text-slate-400 ring-slate-500/25'
                            }`}
                          >
                            {computedStatus === 'Đang diễn ra' ? (
                              <PlayCircle className="w-3 h-3" />
                            ) : computedStatus === 'Trễ' ? (
                              <Clock className="w-3 h-3" />
                            ) : (
                              <Circle className="w-3 h-3" />
                            )}
                            {computedStatus}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold ring-1 ${
                              priorityLabel === 'Khẩn cấp' || priorityLabel === 'Cao'
                                ? 'bg-red-500/10 text-red-400 ring-red-500/25'
                                : priorityLabel === 'Thấp'
                                  ? 'bg-slate-700/50 text-slate-400 ring-slate-600/50'
                                  : 'bg-amber-500/10 text-amber-400 ring-amber-500/25'
                            }`}
                          >
                            <Flag className="w-3 h-3" />
                            {priorityLabel}
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
