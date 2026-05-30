import React, { useState, useEffect } from 'react';
import { Truck, ChevronDown, ChevronUp, Loader2, CloudOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';
import ModuleDateHeader from './ModuleDateHeader';
import ModuleProgressPill from './ModuleProgressPill';
import DateInputDMY from '../../DateInputDMY';
import { parseFlexibleDate } from '../../../utils/timelineDates';
import { useProjectCanEdit } from '../../../context/ProjectEditContext';
import { useI18n } from '../../../context/I18nContext';
import { ModuleCell } from '../../ModuleCell';
import ModuleNotesCell from './ModuleNotesCell';
import ModuleSelectField from './ModuleSelectField';
import { normalizeModuleField } from '../../../utils/moduleDisplay';
import useModuleOpenListener from '../../../hooks/useModuleOpenListener';

const defaultProcurements = [
  'An toàn tạm',
  'Dây cáp (AC/DC/Cứu sinh/dây mạng/dây tín hiệu,...)',
  'Lan can cứng',
  'Walkway',
  'Hệ thống khung đỡ (Rail, xà gồ, kẹp biên, kẹp giữa, kẹp seamlock, Pad L,..)',
  'Tấm pin PV ( Kẹp tiếp địa, kẹp thoát nước,...)',
  'Máng cáp (Máng DC, AC, nắp đậy máng, thanh V làm support,..)',
  'Nhà biến tần (khung lưới, mái tôn, chân trụ, bản mã, xà gồ, khung treo biến tần,...)',
  'Biến tần (Inverter, phụ kiện bấm MC4,...)',
  'Tủ điện (Isolator, ACDB)',
  'Hệ thống tiếp địa (dây PE, kẹp tiếp địa, hộp test box, dây đồng trần,...)',
  'Hệ PCCC (Quả cầu PCCC, tiêu lệnh, bình xịt PCCC,...)',
  'Hệ thống giám sát (Tủ Mornitoring, Bluelog, Data logger, UPS, nguồn điện,...)',
  'Hệ thống tủ thông tin/không phát ngược lưới (Tủ zero export, Multi Meter, CT,...)',
  'Hệ thống vệ sinh pin (Bơm, phụ kiện bơm, bồn nước, CB bơm, ống nước, khơi thủy)'
];

const parseDateStr = (str) => parseFlexibleDate(str);

const getAutoEvaluation = (expectedStr, actualStr) => {
  const expected = parseDateStr(expectedStr);
  const actual = parseDateStr(actualStr);
  
  if (actual && expected) {
    return actual.getTime() <= expected.getTime() ? 'Đúng tiến độ' : 'Trễ';
  }
  
  if (expected) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expected.getTime() >= today.getTime() ? 'Đang theo kế hoạch' : 'Trễ';
  }
  
  return '';
};


export default function ProcurementModule({ project, initialData, onProgressChange }) {
  const canEdit = useProjectCanEdit();
  const { t, tf, ts } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  useModuleOpenListener('procurement', setIsOpen);
  
  const mergeProcurementData = (data) => {
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

    return defaultProcurements.map((name, index) => {
      const nameLower = name.toLowerCase().replace(/\s+/g, '');
      const row = data ? data.find(r => {
        const hm = getVal(r, ['HẠNG_MỤC_MUA_HÀNG', 'HẠNG_MỤC', 'HANG_MUC', 'hangmuc']);
        return hm && hm.toLowerCase().replace(/\s+/g, '') === nameLower;
      }) : null;
      if (row) {
        const expected = normalizeModuleField(getVal(row, ['NGÀY_VỀ_DỰ_KIẾN', 'ngayvedukien']));
        const actual = normalizeModuleField(getVal(row, ['NGÀY_VỀ_THỰC_TẾ', 'ngayvethucte']));
        const autoEval = getAutoEvaluation(expected, actual);
        return {
          id: `proc_${index}`,
          _rowIndex: row._rowIndex,
          HẠNG_MỤC_MUA_HÀNG: name,
          NGÀY_VỀ_DỰ_KIẾN: expected,
          NGÀY_VỀ_THỰC_TẾ: actual,
          TÌNH_TRẠNG_VẬT_TƯ: normalizeModuleField(getVal(row, ['TÌNH_TRẠNG_VẬT_TƯ', 'tinhtrangvattu'])),
          ĐÁNH_GIÁ_TIẾN_ĐỘ: autoEval,
          GHI_CHÚ: normalizeModuleField(getVal(row, ['GHI_CHÚ', 'ghichu']))
        };
      }
      return {
        id: `proc_${index}`,
        _rowIndex: undefined,
        HẠNG_MỤC_MUA_HÀNG: name,
        NGÀY_VỀ_DỰ_KIẾN: '',
        NGÀY_VỀ_THỰC_TẾ: '',
        TÌNH_TRẠNG_VẬT_TƯ: '',
        ĐÁNH_GIÁ_TIẾN_ĐỘ: '',
        GHI_CHÚ: ''
      };
    });
  };

  const STORAGE_KEY = `procurements_${project?.PROJECT_ID || project?.id}`;

  const [items, setItems] = useState(() => {
    if (Array.isArray(initialData)) return mergeProcurementData(initialData);
    try {
      const cached = localStorage.getItem(`procurements_${project?.PROJECT_ID || project?.id}`);
      if (cached) return mergeProcurementData(JSON.parse(cached));
    } catch (_) {}
    return mergeProcurementData([]);
  });
  const [rawData, setRawData] = useState(() => {
    if (Array.isArray(initialData)) return initialData;
    try {
      const cached = localStorage.getItem(`procurements_${project?.PROJECT_ID || project?.id}`);
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
      setItems(mergeProcurementData(initialData));
      setRawData(initialData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      setIsLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await api.getProcurements(project?.PROJECT_ID || project?.id);
        const fetchedData = Array.isArray(data) ? data : [];
        setItems(mergeProcurementData(fetchedData));
        setRawData(fetchedData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedData));
        setSyncError(false);
      } catch (error) {
        console.error("Fetch procurement error:", error);
        setSyncError(true); setSyncStatus("error"); setTimeout(() => setSyncStatus(null), 3000);
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            setItems(mergeProcurementData(parsed));
            setRawData(parsed);
          }
        } catch (_) {}
      } finally {
        setIsLoading(false);
      }
    };
    if (project?.PROJECT_ID || project?.id) fetchData();
  }, [project?.PROJECT_ID, project?.id, initialData]);

  const completedCount = items.filter(i => i.TÌNH_TRẠNG_VẬT_TƯ === 'Đã tới site').length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  useEffect(() => {
    if (onProgressChange) onProgressChange(progressPercent);
  }, [progressPercent, onProgressChange]);

  const handleUpdate = async (id, field, value) => {
    if (!canEdit) return;
    let updatedItem = null;
    const nextItems = items.map(i => {
      if (i.id === id) {
        if (field === 'ĐÁNH_GIÁ_TIẾN_ĐỘ') return i;
        const temp = { ...i, [field]: value };
        if (field === 'NGÀY_VỀ_DỰ_KIẾN' || field === 'NGÀY_VỀ_THỰC_TẾ') {
          temp.ĐÁNH_GIÁ_TIẾN_ĐỘ = getAutoEvaluation(temp.NGÀY_VỀ_DỰ_KIẾN, temp.NGÀY_VỀ_THỰC_TẾ);
        }
        updatedItem = temp;
        return temp;
      }
      return i;
    });

    setItems(nextItems);

    if (nextItems.length > 0) {
      const rawData = nextItems.map(i => ({
        _rowIndex: i._rowIndex,
        PROJECT_ID: project?.PROJECT_ID || project?.id,
        HẠNG_MỤC_MUA_HÀNG: i.HẠNG_MỤC_MUA_HÀNG,
        NGÀY_VỀ_DỰ_KIẾN: i.NGÀY_VỀ_DỰ_KIẾN,
        NGÀY_VỀ_THỰC_TẾ: i.NGÀY_VỀ_THỰC_TẾ,
        TÌNH_TRẠNG_VẬT_TƯ: i.TÌNH_TRẠNG_VẬT_TƯ,
        ĐÁNH_GIÁ_TIẾN_ĐỘ: i.ĐÁNH_GIÁ_TIẾN_ĐỘ,
        GHI_CHÚ: i.GHI_CHÚ
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rawData));
    }

    if (updatedItem) {
      try {
        const payload = {
          _rowIndex: updatedItem._rowIndex,
          PROJECT_ID: project?.PROJECT_ID || project?.id,
          NGÀY_BẮT_ĐẦU_MODULE: JSON.parse(localStorage.getItem(`dates_procurement_${project?.PROJECT_ID || project?.id}`) || '{}').start || '',
          SỐ_NGÀY_MODULE: JSON.parse(localStorage.getItem(`dates_procurement_${project?.PROJECT_ID || project?.id}`) || '{}').days || '',
          TÊN_DỰ_ÁN: project?.name || project?.TÊN_DỰ_ÁN || '-',
          HẠNG_MỤC_MUA_HÀNG: updatedItem.HẠNG_MỤC_MUA_HÀNG,
          
          NGÀY_VỀ_DỰ_KIẾN: updatedItem.NGÀY_VỀ_DỰ_KIẾN,
          ngay_ve_du_kien: updatedItem.NGÀY_VỀ_DỰ_KIẾN,
          
          NGÀY_VỀ_THỰC_TẾ: updatedItem.NGÀY_VỀ_THỰC_TẾ,
          ngay_ve_thuc_te: updatedItem.NGÀY_VỀ_THỰC_TẾ,
          
          TÌNH_TRẠNG_VẬT_TƯ: updatedItem.TÌNH_TRẠNG_VẬT_TƯ,
          tinh_trang_vat_tu: updatedItem.TÌNH_TRẠNG_VẬT_TƯ,
          tinhtrangvattu: updatedItem.TÌNH_TRẠNG_VẬT_TƯ,
          
          ĐÁNH_GIÁ_TIẾN_ĐỘ: getAutoEvaluation(updatedItem.NGÀY_VỀ_DỰ_KIẾN, updatedItem.NGÀY_VỀ_THỰC_TẾ),
          danh_gia_tien_do: updatedItem.ĐÁNH_GIÁ_TIẾN_ĐỘ,
          
          GHI_CHÚ: updatedItem.GHI_CHÚ,
          ghi_chu: updatedItem.GHI_CHÚ
        };
        const response = await api.updateProcurement(payload);
        if (response && response.data && response.data.length > 0) {
          setItems(prev => {
            const next = prev.map(i => {
              const serverRow = response.data.find(r => 
                (r.HẠNG_MỤC_MUA_HÀNG || '').toLowerCase().replace(/\s+/g, '') === i.HẠNG_MỤC_MUA_HÀNG.toLowerCase().replace(/\s+/g, '')
              );
              if (serverRow && serverRow._rowIndex) {
                return { ...i, _rowIndex: serverRow._rowIndex };
              }
              return i;
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
      case 'Đã tới site': return 'text-[#10b981] font-semibold';
      case 'Chưa đặt': return 'text-[#ef4444] font-semibold';
      case 'Đã đặt hàng': return 'text-[#3b82f6] font-semibold';
      case 'Đang vận chuyển': return 'text-[#f59e0b] font-semibold';
      default: return 'text-slate-400';
    }
  };

  const getProgressStyle = (progress) => {
    switch (progress) {
      case 'Đúng tiến độ':
        return 'text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 font-bold';
      case 'Đang theo kế hoạch':
        return 'text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20 font-bold';
      case 'Trễ':
        return 'text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded border border-red-500/20 font-bold';
      default:
        return 'text-slate-400 font-semibold';
    }
  };

  return (
    <div className="glass-panel rounded-xl shadow-lg border border-[var(--border-main)]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#f97316]/10 text-[#f97316] flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-[var(--text-strong)] uppercase tracking-wider">{t('modules.procurement')}</h3>
        </div>
        
        <div className="flex items-center gap-4">
          <ModuleDateHeader projectId={project?.PROJECT_ID || project?.id} moduleKey="procurement" syncStatus={syncStatus} initialData={rawData} />
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
                  moduleKey="procurement"
                  initialData={rawData}
                  done={completedCount}
                  total={items.length}
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
            style={{ overflow: 'visible' }}
          >
            <div className="p-4 border-t border-[var(--border-main)] bg-[var(--bg-main)] min-w-0">
              <p className="md:hidden text-[10px] text-[var(--text-muted)] mb-2">
                Vuốt ngang để xem đủ cột
              </p>
              <div className="module-table-scroll rounded-lg border border-[var(--border-main)] -mx-0.5 px-0.5 pb-1">
                <table className="w-full min-w-[920px] md:min-w-0 md:table-fixed text-left text-xs">
                  <colgroup>
                    <col className="w-[26%]" />
                    <col className="w-[13%]" />
                    <col className="w-[13%]" />
                    <col className="w-[14%]" />
                    <col className="w-[14%]" />
                    <col className="w-[20%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-[var(--bg-panel)] text-[var(--text-muted)] font-bold uppercase tracking-wider border-b border-[var(--border-main)]">
                      <th className="p-3 text-left align-bottom min-w-[200px]">{t('table.equipment')}</th>
                      <th className="p-3 text-center align-bottom">{t('table.expectedArrival')}</th>
                      <th className="p-3 text-center align-bottom">{t('table.actualArrival')}</th>
                      <th className="p-3 text-center align-bottom">{t('table.materialStatus')}</th>
                      <th className="p-3 text-center align-bottom">{t('table.progressEval')}</th>
                      <th className="p-3 text-left align-bottom">{t('table.notes')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-main)]">
                    {items.map(item => (
                      <tr key={item.id} className="hover:bg-[var(--bg-panel)]/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-200">{ts(item.HẠNG_MỤC_MUA_HÀNG)}</td>
                        <td className="p-3 text-center align-middle whitespace-nowrap">
                          <DateInputDMY
                            className={`bg-transparent focus:outline-none w-full min-w-[7.25rem] tabular-nums border-b border-transparent focus:border-[#5252ff] text-slate-300 ${!canEdit ? 'pointer-events-none opacity-70' : ''}`}
                            value={item.NGÀY_VỀ_DỰ_KIẾN || ''}
                            disabled={!canEdit}
                            onChange={(val) => {
                              setItems(prev => prev.map(i => i.id === item.id ? { ...i, NGÀY_VỀ_DỰ_KIẾN: val } : i));
                            }}
                            onBlur={(_e, val) => handleUpdate(item.id, 'NGÀY_VỀ_DỰ_KIẾN', val)}
                          />
                        </td>
                        <td className="p-3 text-center align-middle whitespace-nowrap">
                          <DateInputDMY
                            className={`bg-transparent focus:outline-none w-full min-w-[7.25rem] tabular-nums border-b border-transparent focus:border-[#5252ff] text-slate-300 ${!canEdit ? 'pointer-events-none opacity-70' : ''}`}
                            value={item.NGÀY_VỀ_THỰC_TẾ || ''}
                            disabled={!canEdit}
                            onChange={(val) => {
                              setItems(prev => prev.map(i => i.id === item.id ? { ...i, NGÀY_VỀ_THỰC_TẾ: val } : i));
                            }}
                            onBlur={(_e, val) => handleUpdate(item.id, 'NGÀY_VỀ_THỰC_TẾ', val)}
                          />
                        </td>
                        <td className="p-3 text-center align-middle">
                          <ModuleCell canEdit={canEdit} value={item.TÌNH_TRẠNG_VẬT_TƯ} colorClass={getStatusColor(item.TÌNH_TRẠNG_VẬT_TƯ)} ts={ts}>
                          <ModuleSelectField
                            value={item.TÌNH_TRẠNG_VẬT_TƯ}
                            disabled={!canEdit}
                            colorClass={getStatusColor(item.TÌNH_TRẠNG_VẬT_TƯ)}
                            onChange={(e) => handleUpdate(item.id, 'TÌNH_TRẠNG_VẬT_TƯ', e.target.value)}
                          >
                            <option className="bg-[var(--bg-panel)] text-slate-200">Chưa đặt</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Đã đặt hàng</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Đang vận chuyển</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Đã tới site</option>
                          </ModuleSelectField>
                          </ModuleCell>
                        </td>
                        <td className="p-3 text-center align-middle">
                          {(() => {
                            const evalText = getAutoEvaluation(item.NGÀY_VỀ_DỰ_KIẾN, item.NGÀY_VỀ_THỰC_TẾ);
                            if (!evalText) return null;
                            return (
                              <span className={`inline-block text-[11px] whitespace-nowrap ${getProgressStyle(evalText)}`}>
                                {ts(evalText)}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="p-3">
                          <ModuleNotesCell
                            value={item.GHI_CHÚ || ''}
                            canEdit={canEdit}
                            readDisplay={item.GHI_CHÚ ? ts(item.GHI_CHÚ) : ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setItems(prev => prev.map(i => i.id === item.id ? { ...i, GHI_CHÚ: v } : i));
                            }}
                            onBlur={(e) => handleUpdate(item.id, 'GHI_CHÚ', e.target.value)}
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
