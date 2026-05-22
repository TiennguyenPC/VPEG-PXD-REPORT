import React, { useState, useEffect } from 'react';
import { CheckCircle2, CloudFog, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';

export default function ModuleDateHeader({ projectId, moduleKey, syncStatus, initialData }) {
  const storageKey = `dates_${moduleKey}_${projectId}`;
  const [dateInfo, setDateInfo] = useState({ start: '', days: '' });
  const [localSyncStatus, setLocalSyncStatus] = useState(null);

  useEffect(() => {
    let syncedFromData = false;
    if (Array.isArray(initialData) && initialData.length > 0) {
      const rowWithDate = initialData.find(r => r.NGÀY_BẮT_ĐẦU_MODULE || r.SỐ_NGÀY_MODULE);
      if (rowWithDate) {
        const startRaw = rowWithDate.NGÀY_BẮT_ĐẦU_MODULE || '';
        // Convert to YYYY-MM-DD if needed, but assuming it's already YYYY-MM-DD
        let formattedStart = startRaw;
        if (startRaw && startRaw.includes('/')) {
            const parts = startRaw.split('/');
            if (parts.length === 3) {
                formattedStart = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        } else if (startRaw && startRaw.includes('T')) {
            formattedStart = startRaw.split('T')[0];
        }

        const newData = {
          start: formattedStart,
          days: rowWithDate.SỐ_NGÀY_MODULE || ''
        };
        setDateInfo(newData);
        localStorage.setItem(storageKey, JSON.stringify(newData));
        syncedFromData = true;
      }
    }

    if (!syncedFromData) {
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          setDateInfo(JSON.parse(cached));
        }
      } catch {}
    }
  }, [storageKey, initialData]);

  const updateDateInfo = (field, val) => {
    setDateInfo(prev => {
      const next = { ...prev, [field]: val };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const calculateEndDate = (start, days) => {
    if (!start || !days) return '-';
    const d = new Date(start);
    if (isNaN(d.getTime())) return '-';
    d.setDate(d.getDate() + parseInt(days));
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleBlur = async () => {
    setLocalSyncStatus('saving');
    try {
      const sheetNames = {
        permit: 'PROJECT_PERMIT',
        design: 'PROJECT_DESIGN',
        procurement: 'PROJECT_PROCUREMENT',
        construction: 'PROJECT_CONSTRUCTION',
        handover: 'PROJECT_HANDOVER'
      };
      await api.updateModuleDates({
        PROJECT_ID: projectId,
        sheetName: sheetNames[moduleKey],
        NGÀY_BẮT_ĐẦU_MODULE: dateInfo.start,
        SỐ_NGÀY_MODULE: dateInfo.days
      });
      setLocalSyncStatus('success');
    } catch (e) {
      setLocalSyncStatus('error');
    }
    setTimeout(() => setLocalSyncStatus(null), 3000);
  };

  return (
    <div className="hidden lg:flex items-center bg-[var(--bg-main)]/60 border border-[var(--border-main)] rounded-md overflow-hidden shadow-sm" onClick={e => e.stopPropagation()}>
      <div className="flex items-center px-3 py-1.5 border-r border-[var(--border-main)] bg-[#0c1221] hover:bg-[#141c2f] transition-colors group">
        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mr-2 group-hover:text-slate-400 transition-colors">Bắt đầu</span>
        <input 
          type="date" 
          value={dateInfo.start} 
          onChange={e => updateDateInfo('start', e.target.value)}
          onBlur={handleBlur}
          className="bg-transparent text-[11px] font-semibold text-slate-200 focus:outline-none w-[95px] cursor-pointer"
        />
      </div>
      
      <div className="flex items-center px-3 py-1.5 border-r border-[var(--border-main)] bg-[#0c1221] hover:bg-[#141c2f] transition-colors group">
        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mr-2 group-hover:text-slate-400 transition-colors">Ngày</span>
        <input 
          type="number" 
          min="0"
          value={dateInfo.days} 
          onChange={e => updateDateInfo('days', e.target.value)}
          onBlur={handleBlur}
          className="bg-transparent text-[11px] font-semibold text-[#5252ff] focus:outline-none w-8 text-center placeholder-[#4d5e7a]"
          placeholder="-"
        />
      </div>
      
      <div className="flex items-center px-3 py-1.5 bg-[#0a0f1c]">
        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mr-2">Kết thúc</span>
        <span className="text-[11px] font-bold text-[#10b981] w-[70px] text-center bg-[#10b981]/10 rounded border border-[#10b981]/20 py-0.5 shadow-[0_0_8px_rgba(16,185,129,0.15)]">
          {calculateEndDate(dateInfo.start, dateInfo.days)}
        </span>
      </div>
      
      {(syncStatus || localSyncStatus) && (
        <>
          <div className="w-[1px] h-4 bg-[var(--border-main)]"></div>
          <div className="flex items-center">
            {(syncStatus === 'saving' || localSyncStatus === 'saving') && (
              <span className="flex items-center gap-1.5 text-[10px] text-blue-400">
                <Loader2 className="w-3 h-3 animate-spin" /> Đang lưu...
              </span>
            )}
            {(syncStatus === 'success' || localSyncStatus === 'success') && (
              <span className="flex items-center gap-1.5 text-[10px] text-[#10b981]">
                <CheckCircle2 className="w-3 h-3" /> Đã lưu
              </span>
            )}
            {(syncStatus === 'error' || localSyncStatus === 'error') && (
              <span className="flex items-center gap-1.5 text-[10px] text-rose-400">
                <CloudFog className="w-3 h-3" /> Lỗi lưu
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
