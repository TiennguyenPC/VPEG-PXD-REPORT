import React from 'react';
import { ChevronLeft, Share2, Download } from 'lucide-react';

export default function ProjectHeader({ project, onBack }) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0b0f19] p-6 rounded-xl border border-[#182135] shadow-lg relative overflow-hidden group">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#5252ff]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-[#5252ff]/10 transition-all duration-500 pointer-events-none"></div>
      
      <div className="flex flex-col gap-3 relative z-10">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-[#6b7d9b] hover:text-[#5252ff] transition-colors w-fit"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="font-semibold uppercase tracking-wider">Quay lại tổng quan</span>
        </button>
        
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            DỰ ÁN ĐIỆN MẶT TRỜI {project.name.toUpperCase()}
            {project.status === 'completed' && (
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Đã hoàn thành
              </span>
            )}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-[#8ca0c3] font-medium">
            <span className="flex items-center gap-1.5">
              Khách hàng: <span className="text-white font-semibold">{project.client}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-[#182135]"></span>
            <span className="flex items-center gap-1.5">
              Công suất: <span className="text-white font-semibold">{project.capacity.toLocaleString()} kWp</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-[#182135]"></span>
            <span className="flex items-center gap-1.5">
              Kế hoạch COD: <span className="text-white font-semibold">{project.codDate}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-4 relative z-10 w-full md:w-auto mt-4 md:mt-0">
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button className="flex items-center gap-2 bg-[#141c2f] hover:bg-[#1a243a] border border-[#263554] text-slate-200 px-4 py-2 rounded-lg text-xs font-semibold transition-all">
            <Share2 className="w-3.5 h-3.5 text-[#7373ff]" />
            Chia sẻ
          </button>
          <button className="flex items-center gap-2 bg-[#141c2f] hover:bg-[#1a243a] border border-[#263554] text-slate-200 px-4 py-2 rounded-lg text-xs font-semibold transition-all">
            <Download className="w-3.5 h-3.5 text-[#10b981]" />
            Export
          </button>
        </div>
        
        <div className="text-right w-full md:w-auto">
          <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider mb-1">Tiến độ thực tế tổng thể</p>
          <div className="flex items-end justify-end gap-3">
            <span className="text-4xl font-black text-white leading-none tracking-tighter">
              {project.progress}%
            </span>
          </div>
          <div className="w-full md:w-48 h-1.5 bg-[#182135] rounded-full mt-3 overflow-hidden shadow-inner">
            <div 
              className={`h-full rounded-full transition-all duration-1000 relative ${
                project.deviation < 0 ? "bg-gradient-to-r from-red-500 to-red-400" : "bg-gradient-to-r from-emerald-500 to-emerald-400"
              }`}
              style={{ width: `${project.progress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
