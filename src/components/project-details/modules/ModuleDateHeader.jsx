import React, { useState, useEffect } from 'react';
import { CheckCircle2, CloudFog, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';
import DateInputDMY from '../../DateInputDMY';
import { normalizeToDMY, parseFlexibleDate, formatDateDMY } from '../../../utils/timelineDates';
import { useProjectCanEdit } from '../../../context/ProjectEditContext';
import { useI18n } from '../../../context/I18nContext';

export default function ModuleDateHeader({ projectId, moduleKey, syncStatus, initialData }) {
  const canEdit = useProjectCanEdit();
  const { t } = useI18n();
  const storageKey = `dates_${moduleKey}_${projectId}`;
  const [dateInfo, setDateInfo] = useState({ start: '', days: '' });
  const [localSyncStatus, setLocalSyncStatus] = useState(null);

  useEffect(() => {
    let syncedFromData = false;
    if (Array.isArray(initialData) && initialData.length > 0) {
      const rowWithDate = initialData.find(r => r.NGÀY_BẮT_ĐẦU_MODULE || r.SỐ_NGÀY_MODULE);
      if (rowWithDate) {
        const startRaw = rowWithDate.NGÀY_BẮT_ĐẦU_MODULE || '';
        const formattedStart = normalizeToDMY(startRaw) || startRaw.split('T')[0] || '';

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
    const d = parseFlexibleDate(start);
    if (!d || Number.isNaN(d.getTime())) return '-';
    d.setDate(d.getDate() + parseInt(days, 10));
    return formatDateDMY(d);
  };

  const handleBlur = async () => {
    if (!canEdit) return;
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
    <div className="hidden lg:flex items-center shrink-0 bg-[var(--bg-main)]/60 border border-[var(--border-main)] rounded-md overflow-hidden shadow-sm" onClick={e => e.stopPropagation()}>
      <div className="flex items-center shrink-0 px-3 py-1.5 border-r border-[var(--border-main)] bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] transition-colors group">
        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mr-2 shrink-0">{t('moduleDate.start')}</span>
        <DateInputDMY
          value={dateInfo.start}
          onChange={(val) => updateDateInfo('start', val)}
          onBlur={handleBlur}
          disabled={!canEdit}
          className={`bg-transparent text-[11px] font-semibold tabular-nums whitespace-nowrap text-[var(--text-main)] focus:outline-none min-w-[5.75rem] w-[5.75rem] box-border ${canEdit ? 'cursor-text' : 'cursor-default opacity-70'}`}
        />
      </div>
      
      <div className="flex items-center shrink-0 px-3 py-1.5 border-r border-[var(--border-main)] bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] transition-colors group">
        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mr-2 shrink-0">{t('moduleDate.days')}</span>
        <input 
          type="number" 
          min="0"
          value={dateInfo.days} 
          onChange={e => updateDateInfo('days', e.target.value)}
          onBlur={handleBlur}
          disabled={!canEdit}
          className={`bg-transparent text-[11px] font-semibold tabular-nums text-[#5252ff] focus:outline-none min-w-[2.25rem] w-10 text-center placeholder-[var(--text-muted)] box-border ${!canEdit ? 'opacity-70 cursor-default' : ''}`}
          placeholder="-"
        />
      </div>
      
      <div className="flex items-center shrink-0 px-3 py-1.5 bg-[var(--bg-panel)]">
        <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mr-2 shrink-0">{t('moduleDate.end')}</span>
        <span className="inline-flex items-center justify-center min-w-[5.75rem] px-2 box-border text-[11px] font-bold tabular-nums whitespace-nowrap text-[#059669] bg-[#10b981]/10 rounded border border-[#10b981]/30 py-0.5">
          {calculateEndDate(dateInfo.start, dateInfo.days)}
        </span>
      </div>
      
      {(syncStatus || localSyncStatus) && (
        <>
          <div className="w-[1px] h-4 bg-[var(--border-main)]"></div>
          <div className="flex items-center">
            {(syncStatus === 'saving' || localSyncStatus === 'saving') && (
              <span className="flex items-center gap-1.5 text-[10px] text-blue-400">
                <Loader2 className="w-3 h-3 animate-spin" /> {t('moduleDate.saving')}
              </span>
            )}
            {(syncStatus === 'success' || localSyncStatus === 'success') && (
              <span className="flex items-center gap-1.5 text-[10px] text-[#10b981]">
                <CheckCircle2 className="w-3 h-3" /> {t('moduleDate.saved')}
              </span>
            )}
            {(syncStatus === 'error' || localSyncStatus === 'error') && (
              <span className="flex items-center gap-1.5 text-[10px] text-rose-400">
                <CloudFog className="w-3 h-3" /> {t('moduleDate.saveError')}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
