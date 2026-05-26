import React, { useState, useEffect } from 'react';
import { CheckCircle2, CloudFog, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';
import DateInputDMY from '../../DateInputDMY';
import { normalizeToDMY, parseFlexibleDate, formatDateDMY } from '../../../utils/timelineDates';
import { useProjectCanEdit } from '../../../context/ProjectEditContext';
import { useI18n } from '../../../context/I18nContext';

const cellClass =
  'flex flex-col items-center justify-center gap-0.5 h-10 py-1 px-2 border-r border-[var(--border-main)] bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] transition-colors text-center';
const labelClass =
  'text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider leading-none text-center whitespace-nowrap';
const valueClass =
  'text-[11px] font-semibold tabular-nums leading-none min-h-[14px] w-full flex items-center justify-center overflow-visible';

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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('module-dates-updated', {
          detail: { projectId, moduleKey },
        }));
      }
      return next;
    });
  };

  const calculateEndDate = (start, days) => {
    if (!start || !days) return '';
    const d = parseFlexibleDate(start);
    if (!d || Number.isNaN(d.getTime())) return '';
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
    } finally {
      setTimeout(() => setLocalSyncStatus(null), 3000);
    }
  };

  const endDate = calculateEndDate(dateInfo.start, dateInfo.days);

  return (
    <div
      className="hidden lg:flex items-center self-center shrink-0 bg-[var(--bg-main)]/60 border border-[var(--border-main)] rounded-lg shadow-sm overflow-hidden"
      onClick={e => e.stopPropagation()}
    >
      <div className={`${cellClass} w-[7rem] min-w-[7rem] shrink-0 rounded-l-lg`}>
        <span className={labelClass}>{t('moduleDate.start')}</span>
        <div className={valueClass}>
          <DateInputDMY
            value={dateInfo.start}
            onChange={(val) => updateDateInfo('start', val)}
            onBlur={handleBlur}
            disabled={!canEdit}
            showCalendar={canEdit}
            compact
            calendarTitle={t('moduleDate.pickDate')}
            className={`bg-transparent whitespace-nowrap text-center text-[var(--text-main)] focus:outline-none w-[4.65rem] flex-none p-0 m-0 border-0 h-[14px] leading-none ${canEdit ? 'cursor-text' : 'cursor-default opacity-70'}`}
          />
        </div>
      </div>

      <div className={`${cellClass} w-11 min-w-[2.75rem] shrink-0`}>
        <span className={labelClass}>{t('moduleDate.days')}</span>
        <input
          type="number"
          min="0"
          value={dateInfo.days}
          onChange={e => updateDateInfo('days', e.target.value)}
          onBlur={handleBlur}
          disabled={!canEdit}
          className={`${valueClass} input-no-spin bg-transparent text-[#5252ff] focus:outline-none w-full placeholder-[var(--text-muted)] p-0 border-0 ${!canEdit ? 'opacity-70 cursor-default' : ''}`}
          placeholder="-"
        />
      </div>

      <div className={`${cellClass} border-r-0 w-[7rem] min-w-[7rem] shrink-0 ${!(syncStatus || localSyncStatus) ? 'rounded-r-lg' : ''}`}>
        <span className={labelClass}>{t('moduleDate.end')}</span>
        <span className={`${valueClass} font-bold text-[#059669]`}>
          <span className="inline-flex items-center justify-center px-1 py-0.5 rounded-md border border-[#10b981]/30 bg-[#10b981]/10 whitespace-nowrap tabular-nums">
            {endDate || '\u00A0'}
          </span>
        </span>
      </div>

      {(syncStatus || localSyncStatus) && (
        <>
          <div className="w-[1px] h-6 bg-[var(--border-main)] self-center" />
          <div className="flex items-center h-10 px-2 rounded-r-lg bg-[var(--bg-panel)]">
            {(syncStatus === 'saving' || localSyncStatus === 'saving') && (
              <span className="flex items-center gap-1.5 text-[10px] text-blue-400 leading-none">
                <Loader2 className="w-3 h-3 animate-spin" /> {t('moduleDate.saving')}
              </span>
            )}
            {(syncStatus === 'success' || localSyncStatus === 'success') && (
              <span className="flex items-center gap-1.5 text-[10px] text-[#10b981] leading-none">
                <CheckCircle2 className="w-3 h-3" /> {t('moduleDate.saved')}
              </span>
            )}
            {(syncStatus === 'error' || localSyncStatus === 'error') && (
              <span className="flex items-center gap-1.5 text-[10px] text-rose-400 leading-none">
                <CloudFog className="w-3 h-3" /> {t('moduleDate.saveError')}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
