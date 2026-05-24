import React from 'react';
import { Target, Activity, AlertTriangle, CalendarDays, Clock } from 'lucide-react';
import { formatPercent3 } from '../../utils/formatPercent';
import { useI18n } from '../../context/I18nContext';

export default function KPIOverview({ project }) {
  const { t } = useI18n();
  // Map data from exact Google Sheet fields
  const planProgress = Number(project.planProgress || 0);
  const actualProgress = Number(project.actualProgress || 0);
  const deviation = Number(project.delay || 0);
  
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    }
    return new Date(dateStr);
  };
  
  const parsedCodDate = project.cod ? parseDate(project.cod) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // reset time to start of day
  const codDays = parsedCodDate ? Math.ceil((parsedCodDate - today) / (1000 * 60 * 60 * 24)) : 0;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:break-inside-avoid">
      {/* 1. Tiến độ kế hoạch */}
      <div className="glass-panel p-4 rounded-xl shadow-md border border-[var(--border-main)] hover:border-[#263554] transition-all relative overflow-hidden group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center border border-[#3b82f6]/20 group-hover:scale-110 transition-transform">
            <Target className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('kpi.plan')}</p>
            <p className="text-xl font-bold text-[var(--text-strong)] tracking-tight">{formatPercent3(planProgress)}</p>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#3b82f6]"></div>
      </div>

      {/* 2. Tiến độ thực tế */}
      <div className="glass-panel p-4 rounded-xl shadow-md border border-[var(--border-main)] hover:border-[#263554] transition-all relative overflow-hidden group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 text-[#10b981] flex items-center justify-center border border-[#10b981]/20 group-hover:scale-110 transition-transform">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('kpi.actual')}</p>
            <p className="text-xl font-bold text-[var(--text-strong)] tracking-tight">{formatPercent3(actualProgress)}</p>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#10b981]"></div>
      </div>

      {/* 3. Chênh lệch / Delay */}
      <div className="glass-panel p-4 rounded-xl shadow-md border border-[var(--border-main)] hover:border-[#263554] transition-all relative overflow-hidden group">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border group-hover:scale-110 transition-transform ${
            deviation < 0 
              ? "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20" 
              : "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
          }`}>
            <AlertTriangle className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('kpi.deviation')}</p>
            <p className={`text-xl font-bold tracking-tight ${deviation < 0 ? "text-[#ef4444]" : "text-[#10b981]"}`}>
              {deviation > 0 ? "+" : ""}{formatPercent3(deviation)}
            </p>
          </div>
        </div>
        <div className={`absolute right-0 top-0 bottom-0 w-[3px] ${deviation < 0 ? "bg-[#ef4444]" : "bg-[#10b981]"}`}></div>
      </div>

      {/* 4. Thời gian còn lại */}
      <div className="glass-panel p-4 rounded-xl shadow-md border border-[var(--border-main)] hover:border-[#263554] transition-all relative overflow-hidden group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#5252ff]/10 text-[#7373ff] flex items-center justify-center border border-[#5252ff]/20 group-hover:scale-110 transition-transform">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('kpi.timeLeft')}</p>
            <p className="text-xl font-bold text-[var(--text-strong)] tracking-tight">
              <span className="text-[#7373ff]">{codDays > 0 ? codDays : 0}</span> <span className="text-sm font-medium text-[var(--text-muted)]">{t('kpi.days')}</span>
            </p>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#5252ff]"></div>
      </div>
    </div>
  );
}
