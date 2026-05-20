import React, { useState } from 'react';
import { ArrowRight, TrendingUp, TrendingDown, Clock, Users } from 'lucide-react';

export default function WeeklyKPI({ project }) {
  const [evaluation, setEvaluation] = useState(
    "Hoàn thành lắp đặt cơ khí mái xưởng A. Tuần tới tập trung hoàn thành khu vực trạm điện và tiếp địa."
  );

  return (
    <div className="glass-panel p-5 rounded-xl shadow-lg border border-[#182135]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          CHỈ SỐ VẬN HÀNH <span className="text-[#6b7d9b] font-medium normal-case tracking-normal">(TUẦN 3 THÁNG 5)</span>
        </h3>
        <button className="text-xs text-[#5252ff] font-semibold hover:text-[#7373ff] flex items-center gap-1 transition-colors">
          Xem chi tiết <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {/* Tiến độ TB */}
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center text-center gap-1">
          <p className="text-[9px] font-bold text-[#6b7d9b] uppercase tracking-wider">Tiến độ TB</p>
          <p className="text-lg font-bold text-white">3.20%</p>
        </div>

        {/* So với KH */}
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center text-center gap-1">
          <p className="text-[9px] font-bold text-[#6b7d9b] uppercase tracking-wider">So với KH</p>
          <p className="text-lg font-bold text-[#ef4444]">-1.10%</p>
        </div>

        {/* Nhân lực TB */}
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center text-center gap-1">
          <p className="text-[9px] font-bold text-[#6b7d9b] uppercase tracking-wider">Nhân lực TB</p>
          <p className="text-lg font-bold text-white">30</p>
        </div>

        {/* Ngày làm */}
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center text-center gap-1">
          <p className="text-[9px] font-bold text-[#6b7d9b] uppercase tracking-wider">Ngày làm</p>
          <p className="text-lg font-bold text-white">6 / 7</p>
        </div>
      </div>

      <div className="bg-[#0b0f19] border border-[#182135] rounded-lg p-3">
        <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider mb-2">Đánh giá chung tuần này</p>
        <textarea
          value={evaluation}
          onChange={(e) => setEvaluation(e.target.value)}
          className="w-full bg-transparent border-none text-xs text-slate-300 resize-none focus:ring-0 focus:outline-none placeholder-[#4d5e7a]"
          rows={3}
          placeholder="Nhập đánh giá vận hành tuần..."
        />
      </div>
    </div>
  );
}
