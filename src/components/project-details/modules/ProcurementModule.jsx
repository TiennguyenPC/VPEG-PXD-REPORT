import React, { useState, useEffect } from 'react';
import { Truck, ChevronDown, ChevronUp, Loader2, CloudOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';

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
    return defaultProcurements.map((name, index) => {
      const row = data ? data.find(r => r.HẠNG_MỤC_MUA_HÀNG === name) : null;
      if (row) {
        const expected = row.NGÀY_VỀ_DỰ_KIẾN || '';
        const actual = row.NGÀY_VỀ_THỰC_TẾ || '';
        const autoEval = getAutoEvaluation(expected, actual);
        return {
          id: `proc_${index}`,
          _rowIndex: row._rowIndex,
          HẠNG_MỤC_MUA_HÀNG: name,
          NGÀY_VỀ_DỰ_KIẾN: expected,
          NGÀY_VỀ_THỰC_TẾ: actual,
          TÌNH_TRẠNG_VẬT_TƯ: row.TÌNH_TRẠNG_VẬT_TƯ || '',
          ĐÁNH_GIÁ_TIẾN_ĐỘ: row.ĐÁNH_GIÁ_TIẾN_ĐỘ || autoEval,
          GHI_CHÚ: row.GHI_CHÚ || ''
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
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    if (Array.isArray(initialData)) {
      setItems(mergeProcurementData(initialData));
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedData));
        setSyncError(false);
      } catch (error) {
        console.error("Fetch procurement error:", error);
        setSyncError(true);
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) setItems(mergeProcurementData(JSON.parse(cached)));
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
    let updatedItems = [];
    let updatedItem = null;

    setItems(prev => {
      const next = prev.map(i => {
        if (i.id === id) {
          let temp = { ...i, [field]: value };
          if (field === 'NGÀY_VỀ_DỰ_KIẾN' || field === 'NGÀY_VỀ_THỰC_TẾ') {
            temp.ĐÁNH_GIÁ_TIẾN_ĐỘ = getAutoEvaluation(temp.NGÀY_VỀ_DỰ_KIẾN, temp.NGÀY_VỀ_THỰC_TẾ);
          }
          updatedItem = temp;
          return updatedItem;
        }
        return i;
      });
      updatedItems = next;
      return next;
    });

    if (updatedItems.length > 0) {
      const rawData = updatedItems.map(i => ({
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
      setIsUpdating(true);
      try {
        const payload = {
          _rowIndex: updatedItem._rowIndex,
          PROJECT_ID: project?.PROJECT_ID || project?.id,
          HẠNG_MỤC_MUA_HÀNG: updatedItem.HẠNG_MỤC_MUA_HÀNG,
          NGÀY_VỀ_DỰ_KIẾN: updatedItem.NGÀY_VỀ_DỰ_KIẾN,
          NGÀY_VỀ_THỰC_TẾ: updatedItem.NGÀY_VỀ_THỰC_TẾ,
          TÌNH_TRẠNG_VẬT_TƯ: updatedItem.TÌNH_TRẠNG_VẬT_TƯ,
          ĐÁNH_GIÁ_TIẾN_ĐỘ: updatedItem.ĐÁNH_GIÁ_TIẾN_ĐỘ,
          GHI_CHÚ: updatedItem.GHI_CHÚ
        };
        const response = await api.updateProcurement(payload);
        if (response && response.data && response.data.length > 0) {
          setItems(mergeProcurementData(response.data));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
          setSyncError(false);
        }
      } catch (error) {
        console.warn("GAS sync failed (data saved locally):", error);
        setSyncError(true);
      } finally {
        setIsUpdating(false);
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
    <div className="glass-panel rounded-xl shadow-lg border border-[#182135] overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#0b0f19] hover:bg-[#0d1322] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#f97316]/10 text-[#f97316] flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">CUNG ỨNG VẬT TƯ / PROCUREMENT</h3>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-xs font-semibold">
            {isLoading ? (
              <div className="flex items-center gap-2 text-[#6b7d9b]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tải...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {syncError && (
                  <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-full text-xs text-amber-400">
                    <CloudOff className="w-3 h-3" />
                    <span>Lưu cục bộ</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-[#182135]/50 border border-[#1e293b] px-3 py-1 rounded-full text-xs">
                  <span className="text-[#8ca0c3]">{completedCount}/{items.length} hoàn thành</span>
                  <span className="w-1 h-1 bg-[#f97316] rounded-full"></span>
                  <span className="text-[#f97316] font-bold">{progressPercent}%</span>
                </div>
              </div>
            )}
          </div>
          <div className="w-[1px] h-6 bg-[#182135] mx-2"></div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-[#6b7d9b]" /> : <ChevronDown className="w-4 h-4 text-[#6b7d9b]" />}
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
            <div className="p-4 border-t border-[#182135] bg-[#060a13]">
              <div className="overflow-x-auto rounded-lg border border-[#182135]">
                <table className="w-full text-left text-xs min-w-[950px]">
                  <thead>
                    <tr className="bg-[#0b0f19] text-[#6b7d9b] font-bold uppercase tracking-wider border-b border-[#182135]">
                      <th className="p-3">Thiết bị / Vật tư mua hàng</th>
                      <th className="p-3 w-32">Ngày về dự kiến</th>
                      <th className="p-3 w-32">Ngày về thực tế</th>
                      <th className="p-3 w-36">Tình trạng vật tư</th>
                      <th className="p-3 w-40">Đánh giá tiến độ</th>
                      <th className="p-3 w-64">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182135]">
                    {items.map(item => (
                      <tr key={item.id} className="hover:bg-[#0b0f19]/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-200">{item.HẠNG_MỤC_MUA_HÀNG}</td>
                        <td className="p-3">
                          <input 
                            type="text" 
                            className={`bg-transparent focus:outline-none w-full border-b border-transparent focus:border-[#5252ff] text-slate-300 ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={item.NGÀY_VỀ_DỰ_KIẾN || ''}
                            placeholder="-"
                            onChange={(e) => {
                              const v = e.target.value;
                              setItems(prev => prev.map(i => i.id === item.id ? { ...i, NGÀY_VỀ_DỰ_KIẾN: v } : i));
                            }}
                            onBlur={(e) => handleUpdate(item.id, 'NGÀY_VỀ_DỰ_KIẾN', e.target.value)}
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="text" 
                            className={`bg-transparent font-semibold focus:outline-none w-full border-b border-transparent focus:border-[#5252ff] ${item.NGÀY_VỀ_THỰC_TẾ && item.NGÀY_VỀ_THỰC_TẾ !== '-' ? 'text-[#10b981]' : 'text-slate-300'} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={item.NGÀY_VỀ_THỰC_TẾ || ''}
                            placeholder="-"
                            onChange={(e) => {
                              const v = e.target.value;
                              setItems(prev => prev.map(i => i.id === item.id ? { ...i, NGÀY_VỀ_THỰC_TẾ: v } : i));
                            }}
                            onBlur={(e) => handleUpdate(item.id, 'NGÀY_VỀ_THỰC_TẾ', e.target.value)}
                          />
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getStatusColor(item.TÌNH_TRẠNG_VẬT_TƯ)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={item.TÌNH_TRẠNG_VẬT_TƯ || ''}
                            onChange={(e) => handleUpdate(item.id, 'TÌNH_TRẠNG_VẬT_TƯ', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200" value="">-</option>
                            <option className="bg-[#0b0f19] text-slate-200">Chưa đặt</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã đặt hàng</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang vận chuyển</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã tới site</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent focus:outline-none appearance-none cursor-pointer ${getProgressStyle(item.ĐÁNH_GIÁ_TIẾN_ĐỘ)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={item.ĐÁNH_GIÁ_TIẾN_ĐỘ || ''}
                            onChange={(e) => handleUpdate(item.id, 'ĐÁNH_GIÁ_TIẾN_ĐỘ', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200" value="">-</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đúng tiến độ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang theo kế hoạch</option>
                            <option className="bg-[#0b0f19] text-slate-200">Trễ</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <AutoGrowingTextarea 
                            value={item.GHI_CHÚ || ''}
                            placeholder="Nhập ghi chú..."
                            disabled={isUpdating}
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
