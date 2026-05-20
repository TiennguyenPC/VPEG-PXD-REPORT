import React, { useState } from 'react';
import { Users, HardHat, CloudRain, ShieldAlert, ArrowRight } from 'lucide-react';

export default function SiteLogPanel({ project }) {
  const [note, setNote] = useState(
    "Đã nhận đủ cáp DC. Kéo cáp mái bị gián đoạn buổi sáng do mưa.\nCần tăng cường nhân lực vào ngày mai để bù tiến độ."
  );

  return (
    <div className="glass-panel p-5 rounded-xl shadow-lg border border-[#182135]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          NHẬT KÝ HIỆN TRƯỜNG <span className="text-[#6b7d9b] font-medium normal-case tracking-normal">(17/05/2026)</span>
        </h3>
        <button className="text-xs text-[#5252ff] font-semibold hover:text-[#7373ff] flex items-center gap-1 transition-colors">
          Xem chi tiết <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Nhân lực site */}
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center gap-1">
          <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Nhân lực site
          </p>
          <p className="text-xl font-bold text-white">
            28 <span className="text-[10px] text-slate-400 font-medium">người</span>
          </p>
        </div>

        {/* Kỹ sư / GS */}
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center gap-1">
          <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider flex items-center gap-1.5">
            <HardHat className="w-3 h-3" /> Kỹ sư / GS
          </p>
          <p className="text-xl font-bold text-white">
            4 <span className="text-[10px] text-slate-400 font-medium">người</span>
          </p>
        </div>

        {/* Thời tiết */}
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center shrink-0">
            <CloudRain className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider mb-0.5">Thời tiết</p>
            <p className="text-xs font-semibold text-white">Có mưa rào 27°C</p>
          </div>
        </div>

        {/* Sự cố */}
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ef4444]/10 text-[#ef4444] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider mb-0.5">Sự cố</p>
            <p className="text-xs font-semibold text-white">0 vụ</p>
          </div>
        </div>
      </div>

      <div className="bg-[#0b0f19] border border-[#182135] rounded-lg p-3">
        <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider mb-2">Ghi chú hiện trường</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full bg-transparent border-none text-xs text-slate-300 resize-none focus:ring-0 focus:outline-none placeholder-[#4d5e7a]"
          rows={3}
          placeholder="Nhập ghi chú hiện trường..."
        />
      </div>
    </div>
  );
}
