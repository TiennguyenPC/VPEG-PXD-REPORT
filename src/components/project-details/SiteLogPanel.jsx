import React, { useState, useEffect } from 'react';
import { Users, HardHat, CloudRain, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function SiteLogPanel({ project }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const data = await api.getSiteLogs(project?.PROJECT_ID || project?.id);
        if (data) setLogs(data);
      } catch (error) {
        console.error("Fetch site logs error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (project?.PROJECT_ID || project?.id) fetchLogs();
  }, [project?.PROJECT_ID, project?.id]);

  const latestLog = logs[logs.length - 1] || {
    PROJECT_ID: project?.PROJECT_ID || project?.id,
    NGÀY: new Date().toLocaleDateString('vi-VN'),
    NHÂN_LỰC_SITE: 0,
    KỸ_SƯ_GS: 0,
    THỜI_TIẾT: '',
    SỰ_CỐ: '0 vụ',
    GHI_CHÚ_HIỆN_TRƯỜNG: ''
  };

  const handleUpdate = async (field, value) => {
    try {
      setIsUpdating(true);
      const updated = {
        ...latestLog,
        [field]: value
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

  return (
    <div className="glass-panel p-5 rounded-xl shadow-lg border border-[#182135]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          NHẬT KÝ HIỆN TRƯỜNG <span className="text-[#6b7d9b] font-medium normal-case tracking-normal">({latestLog.NGÀY || 'Hôm nay'})</span>
        </h3>
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6b7d9b]" />}
          {isUpdating && <span className="text-[10px] text-yellow-500 font-bold">Đang lưu...</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Nhân lực site */}
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center gap-1">
          <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Nhân lực site
          </p>
          <div className="flex items-center gap-1">
            <input
              type="number"
              className="w-16 bg-transparent text-center text-xl font-bold text-white border-b border-transparent focus:border-[#5252ff] focus:outline-none"
              value={latestLog.NHÂN_LỰC_SITE || 0}
              onChange={(e) => {
                const v = Number(e.target.value);
                setLogs(prev => {
                  const copy = [...prev];
                  if (copy.length === 0) return [{ ...latestLog, NHÂN_LỰC_SITE: v }];
                  copy[copy.length - 1] = { ...copy[copy.length - 1], NHÂN_LỰC_SITE: v };
                  return copy;
                });
              }}
              onBlur={(e) => handleUpdate('NHÂN_LỰC_SITE', Number(e.target.value))}
            />
            <span className="text-[10px] text-slate-400 font-medium">người</span>
          </div>
        </div>

        {/* Kỹ sư / GS */}
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex flex-col items-center justify-center gap-1">
          <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider flex items-center gap-1.5">
            <HardHat className="w-3 h-3" /> Kỹ sư / GS
          </p>
          <div className="flex items-center gap-1">
            <input
              type="number"
              className="w-16 bg-transparent text-center text-xl font-bold text-white border-b border-transparent focus:border-[#5252ff] focus:outline-none"
              value={latestLog.KỸ_SƯ_GS || 0}
              onChange={(e) => {
                const v = Number(e.target.value);
                setLogs(prev => {
                  const copy = [...prev];
                  if (copy.length === 0) return [{ ...latestLog, KỸ_SƯ_GS: v }];
                  copy[copy.length - 1] = { ...copy[copy.length - 1], KỸ_SƯ_GS: v };
                  return copy;
                });
              }}
              onBlur={(e) => handleUpdate('KỸ_SƯ_GS', Number(e.target.value))}
            />
            <span className="text-[10px] text-slate-400 font-medium">người</span>
          </div>
        </div>

        {/* Thời tiết */}
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center shrink-0">
            <CloudRain className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider mb-0.5">Thời tiết</p>
            <input
              type="text"
              className="bg-transparent text-xs font-semibold text-white border-b border-transparent focus:border-[#5252ff] focus:outline-none w-full"
              value={latestLog.THỜI_TIẾT || ''}
              placeholder="Nhập thời tiết..."
              onChange={(e) => {
                const v = e.target.value;
                setLogs(prev => {
                  const copy = [...prev];
                  if (copy.length === 0) return [{ ...latestLog, THỜI_TIẾT: v }];
                  copy[copy.length - 1] = { ...copy[copy.length - 1], THỜI_TIẾT: v };
                  return copy;
                });
              }}
              onBlur={(e) => handleUpdate('THỜI_TIẾT', e.target.value)}
            />
          </div>
        </div>

        {/* Sự cố */}
        <div className="bg-[#0b0f19] border border-[#182135] p-3 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ef4444]/10 text-[#ef4444] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider mb-0.5">Sự cố</p>
            <input
              type="text"
              className="bg-transparent text-xs font-semibold text-white border-b border-transparent focus:border-[#5252ff] focus:outline-none w-full"
              value={latestLog.SỰ_CỐ || ''}
              placeholder="Không có sự cố"
              onChange={(e) => {
                const v = e.target.value;
                setLogs(prev => {
                  const copy = [...prev];
                  if (copy.length === 0) return [{ ...latestLog, SỰ_CỐ: v }];
                  copy[copy.length - 1] = { ...copy[copy.length - 1], SỰ_CỐ: v };
                  return copy;
                });
              }}
              onBlur={(e) => handleUpdate('SỰ_CỐ', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-[#0b0f19] border border-[#182135] rounded-lg p-3">
        <p className="text-[10px] font-bold text-[#6b7d9b] uppercase tracking-wider mb-2">Ghi chú hiện trường</p>
        <textarea
          value={latestLog.GHI_CHÚ_HIỆN_TRƯỜNG || ''}
          onChange={(e) => {
            const v = e.target.value;
            setLogs(prev => {
              const copy = [...prev];
              if (copy.length === 0) return [{ ...latestLog, GHI_CHÚ_HIỆN_TRƯỜNG: v }];
              copy[copy.length - 1] = { ...copy[copy.length - 1], GHI_CHÚ_HIỆN_TRƯỜNG: v };
              return copy;
            });
          }}
          onBlur={(e) => handleUpdate('GHI_CHÚ_HIỆN_TRƯỜNG', e.target.value)}
          className="w-full bg-transparent border-none text-xs text-slate-300 resize-none focus:ring-0 focus:outline-none placeholder-[#4d5e7a]"
          rows={3}
          placeholder="Nhập ghi chú hiện trường..."
        />
      </div>
    </div>
  );
}
