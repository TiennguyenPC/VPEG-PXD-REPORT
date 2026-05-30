import React, { useState, useEffect } from 'react';
import { PenTool, ChevronDown, ChevronUp, Loader2, Compass, CloudOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';
import { formatPercent3 } from '../../../utils/formatPercent';
import ModuleDateHeader from './ModuleDateHeader';
import ModuleProgressPill from './ModuleProgressPill';
import { useProjectCanEdit } from '../../../context/ProjectEditContext';
import { useI18n } from '../../../context/I18nContext';
import { ModuleCell } from '../../ModuleCell';
import ModuleNotesCell from './ModuleNotesCell';
import ModuleSelectField from './ModuleSelectField';
import { normalizeModuleField } from '../../../utils/moduleDisplay';
import useModuleOpenListener from '../../../hooks/useModuleOpenListener';

const defaultDesigns = [
  'Bản vẽ sơ bộ làm giấy phép',
  'Bản vẽ thi công',
  'BOQ',
  'Bản vẽ hoàn công'
];

export default function DesignModule({ project, initialData, onProgressChange }) {
  const { t, tf, ts } = useI18n();
  const canEdit = useProjectCanEdit();
  const [isOpen, setIsOpen] = useState(false);
  useModuleOpenListener('design', setIsOpen);

  const mergeDesignData = (data) => {
    const getVal = (row, keys) => {
      if (!row) return null;
      const rowKeys = Object.keys(row);
      for (const key of keys) {
        const cleanKey = key.toLowerCase().replace(/[\s_]/g, '');
        const match = rowKeys.find(k => k.toLowerCase().replace(/[\s_]/g, '') === cleanKey);
        if (match && row[match] !== undefined && row[match] !== null && row[match] !== '') {
          return row[match];
        }
      }
      return null;
    };

    return defaultDesigns.map((name, index) => {
      const nameLower = name.toLowerCase().replace(/\s+/g, '');
      const row = data ? data.find(r => {
        const hm = getVal(r, ['HẠNG_MỤC', 'HANG_MUC', 'hangmuc', 'HẠNG_MỤC_BẢN_VẼ']);
        return hm && hm.toLowerCase().replace(/\s+/g, '') === nameLower;
      }) : null;

      if (row) {
        return {
          id: `design_${index}`,
          _rowIndex: row._rowIndex,
          HẠNG_MỤC: name,
          TÌNH_TRẠNG: normalizeModuleField(getVal(row, ['TÌNH_TRẠNG', 'tinhtrang'])),
          PHÊ_DUYỆT: normalizeModuleField(getVal(row, ['PHÊ_DUYỆT', 'pheduyet', 'KẾT_QUẢ_PHẢN_HỒI', 'KẾ_QUẢ_PHẢN_HỒI'])),
          BƯỚC_TIẾP_THEO: normalizeModuleField(getVal(row, ['BƯỚC_TIẾP_THEO', 'buoctieptheo', 'buoctiep'])),
          KẾT_QUẢ_CUỐI: normalizeModuleField(getVal(row, ['KẾT_QUẢ_CUỐI', 'KẾ_QUẢ_CUỐI', 'ketquacuoi', 'ket_qua_cuoi', 'kequacuoi'])),
          GHI_CHÚ: normalizeModuleField(getVal(row, ['GHI_CHÚ', 'ghichu']))
        };
      }
      return {
        id: `design_${index}`,
        _rowIndex: undefined,
        HẠNG_MỤC: name,
        TÌNH_TRẠNG: '',
        PHÊ_DUYỆT: '',
        BƯỚC_TIẾP_THEO: '',
        KẾT_QUẢ_CUỐI: '',
        GHI_CHÚ: ''
      };
    });
  };

  const STORAGE_KEY = `designs_${project?.PROJECT_ID || project?.id}`;

  const [designs, setDesigns] = useState(() => {
    if (Array.isArray(initialData)) return mergeDesignData(initialData);
    try {
      const cached = localStorage.getItem(`designs_${project?.PROJECT_ID || project?.id}`);
      if (cached) return mergeDesignData(JSON.parse(cached));
    } catch (_) {}
    return mergeDesignData([]);
  });
  const [rawData, setRawData] = useState(() => {
    if (Array.isArray(initialData)) return initialData;
    try {
      const cached = localStorage.getItem(`designs_${project?.PROJECT_ID || project?.id}`);
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return [];
  });
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    if (Array.isArray(initialData)) {
      const merged = mergeDesignData(initialData);
      setDesigns(merged);
      setRawData(initialData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      setIsLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await api.getDesigns(project?.PROJECT_ID || project?.id);
        const fetchedData = Array.isArray(data) ? data : [];
        setDesigns(mergeDesignData(fetchedData));
        setRawData(fetchedData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedData));
        setSyncError(false);
      } catch (error) {
        console.error("Fetch design error:", error);
        setSyncError(true); setSyncStatus("error"); setTimeout(() => setSyncStatus(null), 3000);
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            setDesigns(mergeDesignData(parsed));
            setRawData(parsed);
          }
        } catch (_) {}
      } finally {
        setIsLoading(false);
      }
    };
    if (project?.PROJECT_ID || project?.id) fetchData();
  }, [project?.PROJECT_ID, project?.id, initialData]);

  useEffect(() => {
    const completedCount = designs.filter(d => d.KẾT_QUẢ_CUỐI && d.KẾT_QUẢ_CUỐI !== '-' && d.KẾT_QUẢ_CUỐI !== '---' && d.KẾT_QUẢ_CUỐI !== 'N/A' && d.KẾT_QUẢ_CUỐI.trim() !== '').length;
    const progressPercent = designs.length > 0 ? (completedCount / designs.length) * 100 : 0;
    if (onProgressChange) onProgressChange(progressPercent);
  }, [designs, onProgressChange]);

  const handleUpdate = async (id, field, value) => {
    if (!canEdit) return;
    let updatedItem = null;
    const nextItems = designs.map(d => {
      if (d.id === id) {
        updatedItem = { ...d, [field]: value };
        return updatedItem;
      }
      return d;
    });
    setDesigns(nextItems);

    if (nextItems.length > 0) {
      const rawData = nextItems.map(d => ({
        _rowIndex: d._rowIndex,
        PROJECT_ID: project?.PROJECT_ID || project?.id,
        HẠNG_MỤC: d.HẠNG_MỤC,
        TÌNH_TRẠNG: d.TÌNH_TRẠNG,
        PHÊ_DUYỆT: d.PHÊ_DUYỆT,
        BƯỚC_TIẾP_THEO: d.BƯỚC_TIẾP_THEO,
        KẾT_QUẢ_CUỐI: d.KẾT_QUẢ_CUỐI,
        GHI_CHÚ: d.GHI_CHÚ
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rawData));
    }

    if (updatedItem) {
      try {
        const payload = {
          _rowIndex: updatedItem._rowIndex,
          PROJECT_ID: project?.PROJECT_ID || project?.id,
          NGÀY_BẮT_ĐẦU_MODULE: JSON.parse(localStorage.getItem(`dates_design_${project?.PROJECT_ID || project?.id}`) || '{}').start || '',
          SỐ_NGÀY_MODULE: JSON.parse(localStorage.getItem(`dates_design_${project?.PROJECT_ID || project?.id}`) || '{}').days || '',
          TÊN_DỰ_ÁN: project?.name || project?.TÊN_DỰ_ÁN || '-',
          HẠNG_MỤC_BẢN_VẼ: updatedItem.HẠNG_MỤC,
          
          TÌNH_TRẠNG: updatedItem.TÌNH_TRẠNG,
          tinhtrang: updatedItem.TÌNH_TRẠNG,
          
          PHÊ_DUYỆT: updatedItem.PHÊ_DUYỆT,
          pheduyet: updatedItem.PHÊ_DUYỆT,
          
          BƯỚC_TIẾP_THEO: updatedItem.BƯỚC_TIẾP_THEO,
          BƯỚC_TIẾP: updatedItem.BƯỚC_TIẾP_THEO,
          buoctieptheo: updatedItem.BƯỚC_TIẾP_THEO,
          
          KẾT_QUẢ_CUỐI: updatedItem.KẾT_QUẢ_CUỐI,
          KẾ_QUẢ_CUỐI: updatedItem.KẾT_QUẢ_CUỐI,
          ketquacuoi: updatedItem.KẾT_QUẢ_CUỐI,

          GHI_CHÚ: updatedItem.GHI_CHÚ,
          ghichu: updatedItem.GHI_CHÚ
        };
        const response = await api.updateDesign(payload);
        if (response && response.data && response.data.length > 0) {
          setDesigns(prev => {
            const next = prev.map(d => {
              const serverRow = response.data.find(r => 
                (r.HẠNG_MỤC || r.HẠNG_MỤC_BẢN_VẼ || '').toLowerCase().replace(/\s+/g, '') === d.HẠNG_MỤC.toLowerCase().replace(/\s+/g, '')
              );
              if (serverRow && serverRow._rowIndex) {
                return { ...d, _rowIndex: serverRow._rowIndex };
              }
              return d;
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
          });
          setSyncError(false);
        }
      } catch (error) {
        console.warn("GAS sync failed (data saved locally):", error);
        setSyncError(true); setSyncStatus("error"); setTimeout(() => setSyncStatus(null), 3000);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Chưa làm': return 'text-slate-400';
      case 'Đang vẽ': return 'text-[#3b82f6]'; // blue
      case 'Đã gửi nội bộ': return 'text-[#8b5cf6]'; // purple
      case 'Đã gửi CĐT': return 'text-[#f97316]'; // orange
      case 'Đang chỉnh sửa': return 'text-[#ef4444]'; // red
      case 'Hoàn thành': return 'text-emerald-400'; // green
      default: return 'text-slate-400';
    }
  };

  const getApprovalColor = (approval) => {
    switch (approval) {
      case 'Chưa phản hồi': return 'text-slate-400';
      case 'Đã duyệt': return 'text-[#10b981]'; // green
      case 'Duyệt có điều kiện': return 'text-[#10b981]'; // orange/emerald
      case 'Yêu cầu chỉnh sửa': return 'text-[#f59e0b]'; // orange
      case 'Không đạt': return 'text-[#ef4444]'; // red
      default: return 'text-slate-300';
    }
  };

  const getNextStepColor = (step) => {
    switch (step) {
      case 'Vẽ mới': return 'text-[#3b82f6]';
      case 'Chỉnh sửa bản vẽ': return 'text-slate-300';
      case 'Gửi duyệt nội bộ': return 'text-[#8b5cf6]';
      case 'Gửi CĐT': return 'text-[#f97316]';
      case 'Chốt hồ sơ': return 'text-[#10b981]';
      case 'Giải trình': return 'text-amber-500';
      case 'Hoàn tất thiết kế': return 'text-emerald-400 font-semibold';
      default: return 'text-slate-300';
    }
  };

  const getFinalResultColor = (res) => {
    if (res && res !== '-') return 'text-[#10b981] font-semibold';
    return 'text-slate-500';
  };

  const completedCount = designs.filter(d => d.KẾT_QUẢ_CUỐI && d.KẾT_QUẢ_CUỐI !== '-' && d.KẾT_QUẢ_CUỐI !== '---' && d.KẾT_QUẢ_CUỐI !== 'N/A' && d.KẾT_QUẢ_CUỐI.trim() !== '').length;
  const progressPercent = designs.length > 0 ? (completedCount / designs.length) * 100 : 0;

  return (
    <div className="glass-panel rounded-xl shadow-lg border border-[var(--border-main)] overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#a855f7]/10 text-[#a855f7] flex items-center justify-center">
            <PenTool className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-strong)] uppercase tracking-wider">{t('modules.design')}</h3>
        </div>
        
        <div className="flex items-center gap-4">
          <ModuleDateHeader projectId={project?.PROJECT_ID || project?.id} moduleKey="design" syncStatus={syncStatus} initialData={rawData} />
          <div className="hidden sm:flex items-center justify-end w-[200px] gap-3 text-xs font-semibold">
            {isLoading ? (
              <div className="flex items-center justify-end gap-2 text-[var(--text-muted)] w-full">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t('common.loading')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-end w-full">
                {syncError && (
                  <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-full text-xs text-amber-400">
                    <CloudOff className="w-3 h-3" />
                    <span className="hidden xl:inline">{t('common.savedLocal')}</span>
                  </div>
                )}
                <ModuleProgressPill
                  projectId={project?.PROJECT_ID || project?.id}
                  moduleKey="design"
                  initialData={rawData}
                  done={completedCount}
                  total={designs.length}
                  percent={progressPercent}
                />
              </div>
            )}
          </div>
          <div className="w-[1px] h-6 bg-[var(--border-main)] mx-2"></div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 border-t border-[var(--border-main)] bg-[var(--bg-main)]">
              <div className="module-table-scroll rounded-lg border border-[var(--border-main)] -mx-0.5 px-0.5 pb-1">
                <table className="w-full text-left text-xs min-w-[950px]">
                  <thead>
                    <tr className="bg-[var(--bg-panel)] text-[var(--text-muted)] font-bold uppercase tracking-wider border-b border-[var(--border-main)]">
                      <th className="p-3">{t('table.drawingItem')}</th>
                      <th className="p-3">{t('table.status')}</th>
                      <th className="p-3">{t('table.approval')}</th>
                      <th className="p-3">{t('table.nextStepLong')}</th>
                      <th className="p-3">{t('table.finalResult')}</th>
                      <th className="p-3 w-64">{t('table.notes')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-main)]">
                    {designs.map(d => (
                      <tr key={d.id} className="hover:bg-[var(--bg-panel)]/50 transition-colors">
                        <td className="p-3 font-semibold text-[var(--text-main)]">
                          <span className="flex items-center gap-2">
                          <Compass className="w-3.5 h-3.5 text-slate-400" />
                          <span>{ts(d.HẠNG_MỤC)}</span>
                          </span>
                        </td>
                        <td className="p-3">
                          <ModuleCell canEdit={canEdit} value={d.TÌNH_TRẠNG} colorClass={getStatusColor(d.TÌNH_TRẠNG)} ts={ts}>
                          <ModuleSelectField
                            value={d.TÌNH_TRẠNG}
                            disabled={!canEdit}
                            colorClass={getStatusColor(d.TÌNH_TRẠNG)}
                            onChange={(e) => handleUpdate(d.id, 'TÌNH_TRẠNG', e.target.value)}
                          >
                            <option className="bg-[var(--bg-panel)] text-slate-200">Chưa làm</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Đang vẽ</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Đã gửi nội bộ</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Đã gửi CĐT</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Đang chỉnh sửa</option>
                          </ModuleSelectField>
                          </ModuleCell>
                        </td>
                        <td className="p-3">
                          <ModuleCell canEdit={canEdit} value={d.PHÊ_DUYỆT} colorClass={getApprovalColor(d.PHÊ_DUYỆT)} ts={ts}>
                          <ModuleSelectField
                            value={d.PHÊ_DUYỆT}
                            disabled={!canEdit}
                            colorClass={getApprovalColor(d.PHÊ_DUYỆT)}
                            onChange={(e) => handleUpdate(d.id, 'PHÊ_DUYỆT', e.target.value)}
                          >
                            <option className="bg-[var(--bg-panel)] text-slate-200">Chưa phản hồi</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Đã duyệt</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Duyệt có điều kiện</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Yêu cầu chỉnh sửa</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Không đạt</option>
                          </ModuleSelectField>
                          </ModuleCell>
                        </td>
                        <td className="p-3">
                          <ModuleCell canEdit={canEdit} value={d.BƯỚC_TIẾP_THEO} colorClass={getNextStepColor(d.BƯỚC_TIẾP_THEO)} ts={ts}>
                          <ModuleSelectField
                            value={d.BƯỚC_TIẾP_THEO}
                            disabled={!canEdit}
                            colorClass={getNextStepColor(d.BƯỚC_TIẾP_THEO)}
                            onChange={(e) => handleUpdate(d.id, 'BƯỚC_TIẾP_THEO', e.target.value)}
                          >
                            <option className="bg-[var(--bg-panel)] text-slate-200">Vẽ mới</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Chỉnh sửa bản vẽ</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Gửi duyệt nội bộ</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Gửi CĐT</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Giải trình</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Chốt hồ sơ</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Hoàn tất thiết kế</option>
                          </ModuleSelectField>
                          </ModuleCell>
                        </td>
                        <td className="p-3">
                          <ModuleCell canEdit={canEdit} value={d.KẾT_QUẢ_CUỐI} colorClass={getFinalResultColor(d.KẾT_QUẢ_CUỐI)} ts={ts}>
                          <ModuleSelectField
                            value={d.KẾT_QUẢ_CUỐI}
                            disabled={!canEdit}
                            colorClass={getFinalResultColor(d.KẾT_QUẢ_CUỐI)}
                            onChange={(e) => handleUpdate(d.id, 'KẾT_QUẢ_CUỐI', e.target.value)}
                          >
                            <option className="bg-[var(--bg-panel)] text-slate-200">Đã duyệt bản vẽ sơ bộ</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Đã duyệt bản vẽ thi công</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Đã chốt BOQ</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Đã có bản vẽ hoàn công</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Hoàn tất thiết kế</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">N/A</option>
                          </ModuleSelectField>
                          </ModuleCell>
                        </td>
                        <td className="p-3">
                          <ModuleNotesCell
                            value={d.GHI_CHÚ || ''}
                            canEdit={canEdit}
                            readDisplay={d.GHI_CHÚ ? ts(d.GHI_CHÚ) : ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setDesigns(prev => prev.map(item => item.id === d.id ? { ...item, GHI_CHÚ: v } : item));
                            }}
                            onBlur={(e) => handleUpdate(d.id, 'GHI_CHÚ', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
