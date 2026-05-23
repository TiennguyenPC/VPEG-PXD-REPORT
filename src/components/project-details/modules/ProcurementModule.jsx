import React, { useState, useEffect } from 'react';
import { Truck, ChevronDown, ChevronUp, Loader2, CloudOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';
import ModuleDateHeader from './ModuleDateHeader';

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

const parseDateStr = (str) => {
  if (!str) return null;
  const cleaned = str.trim();
  if (cleaned === '-' || cleaned === '' || cleaned === '---') return null;
  
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      let year = parseInt(parts[2], 10);
      if (parts[2].length === 2) {
        year += 2000;
      }
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
  }
  
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
      } else {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
      }
    }
  }
  
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d;
  return null;
};

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


function AutoGrowingTextarea({ value, onChange, onBlur, disabled, placeholder }) {
  const textareaRef = React.useRef(null);

  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={onChange}
      onBlur={onBlur}
      rows={1}
      className="bg-transparent focus:outline-none w-full border-b border-transparent focus:border-[#5252ff] text-slate-300 resize-none overflow-hidden min-h-[24px] py-1 leading-normal transition-all"
    />
  );
}

export default function ProcurementModule({ project, initialData, onProgressChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
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
        const expected = getVal(row, ['NGÀY_VỀ_DỰ_KIẾN', 'ngayvedukien']) || '';
        const actual = getVal(row, ['NGÀY_VỀ_THỰC_TẾ', 'ngayvethucte']) || '';
        const autoEval = getAutoEvaluation(expected, actual);
        return {
          id: `proc_${index}`,
          _rowIndex: row._rowIndex,
          HẠNG_MỤC_MUA_HÀNG: name,
          NGÀY_VỀ_DỰ_KIẾN: expected,
          NGÀY_VỀ_THỰC_TẾ: actual,
          TÌNH_TRẠNG_VẬT_TƯ: getVal(row, ['TÌNH_TRẠNG_VẬT_TƯ', 'tinhtrangvattu']) || '',
          ĐÁNH_GIÁ_TIẾN_ĐỘ: getVal(row, ['ĐÁNH_GIÁ_TIẾN_ĐỘ', 'danhgiatiendo']) || autoEval,
          GHI_CHÚ: getVal(row, ['GHI_CHÚ', 'ghichu']) || ''
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
    let updatedItem = null;
    const nextItems = items.map(i => {
      if (i.id === id) {
        let temp = { ...i, [field]: value };
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
          
          ĐÁNH_GIÁ_TIẾN_ĐỘ: updatedItem.ĐÁNH_GIÁ_TIẾN_ĐỘ,
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
    <div className="glass-panel rounded-xl shadow-lg border border-[var(--border-main)] overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[var(--bg-panel)] hover:bg-[var(--bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#f97316]/10 text-[#f97316] flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">CUNG ỨNG VẬT TƯ / PROCUREMENT</h3>
        </div>
        
        <div className="flex items-center gap-4">
          <ModuleDateHeader projectId={project?.PROJECT_ID || project?.id} moduleKey="procurement" syncStatus={syncStatus} initialData={rawData} />
          <div className="hidden sm:flex items-center justify-end w-[200px] gap-3 text-xs font-semibold">
            {isLoading ? (
              <div className="flex items-center justify-end gap-2 text-[var(--text-muted)] w-full">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tải...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-end w-full">
                {syncError && (
                  <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-full text-xs text-amber-400">
                    <CloudOff className="w-3 h-3" />
                    <span className="hidden xl:inline">Lưu cục bộ</span>
                  </div>
                )}
                <div className="flex items-center justify-center gap-2 bg-[var(--border-main)]/50 border border-[var(--border-light)] px-3 py-1 rounded-full text-xs min-w-[140px]">
                  <span className="text-[#8ca0c3] whitespace-nowrap">{completedCount}/{items.length} hoàn thành</span>
                  <span className="w-1 h-1 bg-[#f97316] rounded-full shrink-0"></span>
                  <span className="text-[#f97316] font-bold shrink-0">{progressPercent}%</span>
                </div>
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
              <div className="overflow-x-auto rounded-lg border border-[var(--border-main)]">
                <table className="w-full text-left text-xs min-w-[950px]">
                  <thead>
                    <tr className="bg-[var(--bg-panel)] text-[var(--text-muted)] font-bold uppercase tracking-wider border-b border-[var(--border-main)]">
                      <th className="p-3">Thiết bị / Vật tư mua hàng</th>
                      <th className="p-3 w-32">Ngày về dự kiến</th>
                      <th className="p-3 w-32">Ngày về thực tế</th>
                      <th className="p-3 w-36">Tình trạng vật tư</th>
                      <th className="p-3 w-40">Đánh giá tiến độ</th>
                      <th className="p-3 w-64">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-main)]">
                    {items.map(item => (
                      <tr key={item.id} className="hover:bg-[var(--bg-panel)]/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-200">{item.HẠNG_MỤC_MUA_HÀNG}</td>
                        <td className="p-3">
                          <input 
                            type="date" 
                            className={`bg-transparent focus:outline-none w-full border-b border-transparent focus:border-[#5252ff] text-slate-300 ${!item.NGÀY_VỀ_DỰ_KIẾN || item.NGÀY_VỀ_DỰ_KIẾN === '-' ? 'text-transparent' : ''}`}
                            value={item.NGÀY_VỀ_DỰ_KIẾN && item.NGÀY_VỀ_DỰ_KIẾN !== '-' ? (() => {
                              const v = item.NGÀY_VỀ_DỰ_KIẾN;
                              if (v.includes('/')) {
                                const parts = v.split('/');
                                if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                              }
                              return v;
                            })() : ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              let formatted = v;
                              if (v && v.includes('-')) {
                                const parts = v.split('-');
                                if (parts.length === 3) formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
                              }
                              setItems(prev => prev.map(i => i.id === item.id ? { ...i, NGÀY_VỀ_DỰ_KIẾN: formatted } : i));
                            }}
                            onBlur={(e) => {
                              const rawVal = e.target.value;
                              let finalVal = rawVal;
                              if (rawVal && rawVal.includes('-')) {
                                const parts = rawVal.split('-');
                                if (parts.length === 3) finalVal = `${parts[2]}/${parts[1]}/${parts[0]}`;
                              }
                              handleUpdate(item.id, 'NGÀY_VỀ_DỰ_KIẾN', finalVal);
                            }}
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="date" 
                            className={`bg-transparent focus:outline-none w-full border-b border-transparent focus:border-[#5252ff] text-slate-300 ${!item.NGÀY_VỀ_THỰC_TẾ || item.NGÀY_VỀ_THỰC_TẾ === '-' ? 'text-transparent' : ''}`}
                            value={item.NGÀY_VỀ_THỰC_TẾ && item.NGÀY_VỀ_THỰC_TẾ !== '-' ? (() => {
                              const v = item.NGÀY_VỀ_THỰC_TẾ;
                              if (v.includes('/')) {
                                const parts = v.split('/');
                                if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                              }
                              return v;
                            })() : ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              let formatted = v;
                              if (v && v.includes('-')) {
                                const parts = v.split('-');
                                if (parts.length === 3) formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
                              }
                              setItems(prev => prev.map(i => i.id === item.id ? { ...i, NGÀY_VỀ_THỰC_TẾ: formatted } : i));
                            }}
                            onBlur={(e) => {
                              const rawVal = e.target.value;
                              let finalVal = rawVal;
                              if (rawVal && rawVal.includes('-')) {
                                const parts = rawVal.split('-');
                                if (parts.length === 3) finalVal = `${parts[2]}/${parts[1]}/${parts[0]}`;
                              }
                              handleUpdate(item.id, 'NGÀY_VỀ_THỰC_TẾ', finalVal);
                            }}
                          />
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getStatusColor(item.TÌNH_TRẠNG_VẬT_TƯ)}`}
                            value={item.TÌNH_TRẠNG_VẬT_TƯ || ''}
                            onChange={(e) => handleUpdate(item.id, 'TÌNH_TRẠNG_VẬT_TƯ', e.target.value)}
                          >
                            <option className="bg-[var(--bg-panel)] text-slate-200" value="">-</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Chưa đặt</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Đã đặt hàng</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Đang vận chuyển</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Đã tới site</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent focus:outline-none appearance-none cursor-pointer ${getProgressStyle(item.ĐÁNH_GIÁ_TIẾN_ĐỘ)}`}
                            value={item.ĐÁNH_GIÁ_TIẾN_ĐỘ || ''}
                            onChange={(e) => handleUpdate(item.id, 'ĐÁNH_GIÁ_TIẾN_ĐỘ', e.target.value)}
                          >
                            <option className="bg-[var(--bg-panel)] text-slate-200" value="">-</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Đúng tiến độ</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Đang theo kế hoạch</option>
                            <option className="bg-[var(--bg-panel)] text-slate-200">Trễ</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <AutoGrowingTextarea 
                            value={item.GHI_CHÚ || ''}
                            placeholder="Nhập ghi chú..."
                            disabled={false}
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
