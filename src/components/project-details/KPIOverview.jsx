import React from 'react';
import { Target, Activity, AlertTriangle, CalendarDays, Clock } from 'lucide-react';

export default function KPIOverview({ project }) {
  // Mock data for planning progress if not provided
  const planProgress = project.progress - project.deviation;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Tiến độ kế hoạch */}
      <div className="glass-panel p-4 rounded-xl shadow-md border border-[#182135] hover:border-[#263554] transition-all relative overflow-hidden group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center border border-[#3b82f6]/20 group-hover:scale-110 transition-transform">
            <Target className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider">Tiến độ kế hoạch</p>
            <p className="text-xl font-bold text-white tracking-tight">{planProgress.toFixed(2)}%</p>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#3b82f6]"></div>
      </div>

      {/* 2. Tiến độ thực tế */}
      <div className="glass-panel p-4 rounded-xl shadow-md border border-[#182135] hover:border-[#263554] transition-all relative overflow-hidden group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#10b981]/10 text-[#10b981] flex items-center justify-center border border-[#10b981]/20 group-hover:scale-110 transition-transform">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider">Tiến độ thực tế</p>
            <p className="text-xl font-bold text-white tracking-tight">{project.progress.toFixed(2)}%</p>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#10b981]"></div>
      </div>

      {/* 3. Chênh lệch / Delay */}
      <div className="glass-panel p-4 rounded-xl shadow-md border border-[#182135] hover:border-[#263554] transition-all relative overflow-hidden group">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border group-hover:scale-110 transition-transform ${
            project.deviation < 0 
              ? "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/20" 
              : "bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20"
          }`}>
            <AlertTriangle className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider">Chênh lệch / Delay</p>
            <p className={`text-xl font-bold tracking-tight ${project.deviation < 0 ? "text-[#ef4444]" : "text-[#10b981]"}`}>
              {project.deviation > 0 ? "+" : ""}{project.deviation.toFixed(2)}%
            </p>
          </div>
        </div>
        <div className={`absolute right-0 top-0 bottom-0 w-[3px] ${project.deviation < 0 ? "bg-[#ef4444]" : "bg-[#10b981]"}`}></div>
      </div>

      {/* 4. Dự báo COD */}
      <div className="glass-panel p-4 rounded-xl shadow-md border border-[#182135] hover:border-[#263554] transition-all relative overflow-hidden group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#eab308]/10 text-[#eab308] flex items-center justify-center border border-[#eab308]/20 group-hover:scale-110 transition-transform">
            <CalendarDays className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider">Dự báo COD</p>
            <p className="text-lg font-bold text-white tracking-tight">{project.codDate}</p>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#eab308]"></div>
      </div>

      {/* 5. Thời gian còn lại */}
      <div className="glass-panel p-4 rounded-xl shadow-md border border-[#182135] hover:border-[#263554] transition-all relative overflow-hidden group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#5252ff]/10 text-[#7373ff] flex items-center justify-center border border-[#5252ff]/20 group-hover:scale-110 transition-transform">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider">Thời gian còn lại</p>
            <p className="text-xl font-bold text-white tracking-tight">
              <span className="text-[#7373ff]">{project.codDays}</span> <span className="text-sm font-medium text-slate-400">ngày</span>
            </p>
          </div>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-[#5252ff]"></div>
      </div>
    </div>
  );
}
