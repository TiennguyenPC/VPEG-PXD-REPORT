import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function WeeklyKPI({ project }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const data = await api.getSiteLogs(project?.id);
        if (data) setLogs(data);
      } catch (error) {
        console.error("Fetch site logs error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (project?.id) fetchLogs();
  }, [project?.id]);

  const latestLog = logs[logs.length - 1] || {
    PROJECT_ID: project?.id,
    NGÀY: new Date().toLocaleDateString('vi-VN'),
    ĐÁNH_GIÁ_TUẦN: ''
  };

  const handleUpdate = async (value) => {
    try {
      setIsUpdating(true);
      const updated = {
        ...latestLog,
        ĐÁNH_GIÁ_TUẦN: value
      };
      
      if (latestLog._rowIndex) {
        setLogs(prev => prev.map(l => l._rowIndex === latestLog._rowIndex ? updated : l));
      } else {
        setLogs([updated]);
      }
      
      await api.updateSiteLog(updated);
    } catch (error) {
      console.error("Update site log error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Calculations
  const actualProgress = Number(project?.actualProgress || 0);
  const deviation = Number(project?.delay || 0);
  const delayColor = deviation < 0 ? 'text-[#ef4444]' : 'text-[#10b981]';
  const delaySign = deviation > 0 ? '+' : '';

  const avgWorkers = logs.length > 0
    ? Math.round(logs.reduce((sum, l) => sum + Number(l.NHÂN_LỰC_SITE || 0), 0) / logs.length)
    : 0;

  const daysWorked = logs.length;

  return (
    <div className="glass-panel p-5 rounded-xl shadow-lg border border-[#182135]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          CHỈ SỐ VẬN HÀNH <span className="text-[#6b7d9b] font-medium normal-case tracking-normal">(DỮ LIỆU THỰC TẾ)</span>
        </h3>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6b7d9b]" />}
          {isUpdating && <span className="text-[10px] text-yellow-500 font-bold">Đang lưu...</span>}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        {/* Tiến độ TB */}
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center text-center gap-1">
          <p className="text-[9px] font-bold text-[#6b7d9b] uppercase tracking-wider">Tiến độ thực tế</p>
          <p className="text-lg font-bold text-white">{actualProgress.toFixed(2)}%</p>
        </div>

        {/* So với KH */}
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center text-center gap-1">
          <p className="text-[9px] font-bold text-[#6b7d9b] uppercase tracking-wider">So với KH</p>
          <p className={`text-lg font-bold ${delayColor}`}>{delaySign}{deviation.toFixed(2)}%</p>
        </div>

        {/* Nhân lực TB */}
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center text-center gap-1">
          <p className="text-[9px] font-bold text-[#6b7d9b] uppercase tracking-wider">Nhân lực TB</p>
          <p className="text-lg font-bold text-white">{avgWorkers}</p>
        </div>

        {/* Ngày làm */}
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center text-center gap-1">
          <p className="text-[9px] font-bold text-[#6b7d9b] uppercase tracking-wider">Số ngày log</p>
          <p className="text-lg font-bold text-white">{daysWorked}</p>
        </div>
      </div>

      <div className="bg-[#0b0f19] border border-[#182135] rounded-lg p-3">
        <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider mb-2">Đánh giá chung tuần này</p>
        <textarea
          value={latestLog.ĐÁNH_GIÁ_TUẦN || ''}
          onChange={(e) => {
            const v = e.target.value;
            setLogs(prev => {
              const copy = [...prev];
              if (copy.length === 0) return [{ ...latestLog, ĐÁNH_GIÁ_TUẦN: v }];
              copy[copy.length - 1] = { ...copy[copy.length - 1], ĐÁNH_GIÁ_TUẦN: v };
              return copy;
            });
          }}
          onBlur={(e) => handleUpdate(e.target.value)}
          className="w-full bg-transparent border-none text-xs text-slate-300 resize-none focus:ring-0 focus:outline-none placeholder-[#4d5e7a]"
          rows={3}
          placeholder="Nhập đánh giá vận hành tuần..."
        />
      </div>
    </div>
  );
}
