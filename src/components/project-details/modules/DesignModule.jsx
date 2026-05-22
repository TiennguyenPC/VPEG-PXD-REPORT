import React, { useState, useEffect } from 'react';
import { PenTool, ChevronDown, ChevronUp, Loader2, Compass, CloudOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';

const defaultDesigns = [
  'Bản vẽ sơ bộ làm giấy phép',
  'Bản vẽ thi công',
  'BOQ',
  'Bản vẽ hoàn công'
];

export default function DesignModule({ project, initialData, onProgressChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const mergeDesignData = (data) => {
    return defaultDesigns.map((name, index) => {
      const nameLower = name.toLowerCase().replace(/\s+/g, '');
      const row = data ? data.find(r => r.HẠNG_MỤC_BẢN_VẼ && r.HẠNG_MỤC_BẢN_VẼ.toLowerCase().replace(/\s+/g, '') === nameLower) : null;
      if (row) {
        return {
          id: `design_${index}`,
          _rowIndex: row._rowIndex,
          HẠNG_MỤC_BẢN_VẼ: name,
          TÌNH_TRẠNG: row.TÌNH_TRẠNG || 'Chưa làm',
          PHÊ_DUYỆT: row.PHÊ_DUYỆT || 'Chưa phản hồi',
          BƯỚC_TIẾP_THEO: row.BƯỚC_TIẾP_THEO || row.BƯỚC_TIẾP || 'Vẽ mới',
          KẾT_QUẢ_CUỐI: row.KẾT_QUẢ_CUỐI || '-'
        };
      }
      return {
        id: `design_${index}`,
        _rowIndex: undefined,
        HẠNG_MỤC_BẢN_VẼ: name,
        TÌNH_TRẠNG: 'Chưa làm',
        PHÊ_DUYỆT: 'Chưa phản hồi',
        BƯỚC_TIẾP_THEO: 'Vẽ mới',
        KẾT_QUẢ_CUỐI: '-'
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
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [syncError, setSyncError] = useState(false);

  useEffect(() => {
    if (Array.isArray(initialData)) {
      const merged = mergeDesignData(initialData);
      setDesigns(merged);
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedData));
        setSyncError(false);
      } catch (error) {
        console.error("Fetch design error:", error);
        setSyncError(true);
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached) setDesigns(mergeDesignData(JSON.parse(cached)));
        } catch (_) {}
      } finally {
        setIsLoading(false);
      }
    };
    if (project?.PROJECT_ID || project?.id) fetchData();
  }, [project?.PROJECT_ID, project?.id, initialData]);

  useEffect(() => {
    const completedCount = designs.filter(d => d.KẾT_QUẢ_CUỐI && d.KẾT_QUẢ_CUỐI !== '-' && d.KẾT_QUẢ_CUỐI !== '---' && d.KẾT_QUẢ_CUỐI !== 'N/A' && d.KẾT_QUẢ_CUỐI.trim() !== '').length;
    const progressPercent = designs.length > 0 ? Math.round((completedCount / designs.length) * 100) : 0;
    if (onProgressChange) onProgressChange(progressPercent);
  }, [designs, onProgressChange]);

  const handleUpdate = async (id, field, value) => {
    let updatedItems = [];
    let updatedItem = null;

    setDesigns(prev => {
      const next = prev.map(d => {
        if (d.id === id) {
          updatedItem = { ...d, [field]: value };
          return updatedItem;
        }
        return d;
      });
      updatedItems = next;
      return next;
    });

    if (updatedItems.length > 0) {
      const rawData = updatedItems.map(d => ({
        _rowIndex: d._rowIndex,
        PROJECT_ID: project?.PROJECT_ID || project?.id,
        HẠNG_MỤC_BẢN_VẼ: d.HẠNG_MỤC_BẢN_VẼ,
        TÌNH_TRẠNG: d.TÌNH_TRẠNG,
        PHÊ_DUYỆT: d.PHÊ_DUYỆT,
        BƯỚC_TIẾP_THEO: d.BƯỚC_TIẾP_THEO,
        KẾT_QUẢ_CUỐI: d.KẾT_QUẢ_CUỐI
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rawData));
    }

    if (updatedItem) {
      setIsUpdating(true);
      try {
        const payload = {
          _rowIndex: updatedItem._rowIndex,
          PROJECT_ID: project?.PROJECT_ID || project?.id,
          HẠNG_MỤC_BẢN_VẼ: updatedItem.HẠNG_MỤC_BẢN_VẼ,
          TÌNH_TRẠNG: updatedItem.TÌNH_TRẠNG,
          PHÊ_DUYỆT: updatedItem.PHÊ_DUYỆT,
          BƯỚC_TIẾP_THEO: updatedItem.BƯỚC_TIẾP_THEO,
          KẾT_QUẢ_CUỐI: updatedItem.KẾT_QUẢ_CUỐI
        };
        const response = await api.updateDesign(payload);
        if (response && response.data && response.data.length > 0) {
          setDesigns(mergeDesignData(response.data));
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
  const progressPercent = designs.length > 0 ? Math.round((completedCount / designs.length) * 100) : 0;

  return (
    <div className="glass-panel rounded-xl shadow-lg border border-[#182135] overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#0b0f19] hover:bg-[#0d1322] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#a855f7]/10 text-[#a855f7] flex items-center justify-center">
            <PenTool className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">THIẾT KẾ KỸ THUẬT / SHOPDRAWING</h3>
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
                  <span className="text-[#8ca0c3]">{completedCount}/{designs.length} hoàn thành</span>
                  <span className="w-1 h-1 bg-[#10b981] rounded-full"></span>
                  <span className="text-[#10b981] font-bold">{progressPercent}%</span>
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
                <table className="w-full text-left text-xs min-w-[800px]">
                  <thead>
                    <tr className="bg-[#0b0f19] text-[#6b7d9b] font-bold uppercase tracking-wider border-b border-[#182135]">
                      <th className="p-3">Hạng mục bản vẽ</th>
                      <th className="p-3">Tình trạng</th>
                      <th className="p-3">Phê duyệt</th>
                      <th className="p-3">Bước tiếp theo</th>
                      <th className="p-3">Kết quả cuối</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182135]">
                    {designs.map(d => (
                      <tr key={d.id} className="hover:bg-[#0b0f19]/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-200 flex items-center gap-2">
                          <Compass className="w-3.5 h-3.5 text-slate-400" />
                          <span>{d.HẠNG_MỤC_BẢN_VẼ}</span>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getStatusColor(d.TÌNH_TRẠNG)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={d.TÌNH_TRẠNG || ''}
                            onChange={(e) => handleUpdate(d.id, 'TÌNH_TRẠNG', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Chưa làm</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang vẽ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã gửi nội bộ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã gửi CĐT</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang chỉnh sửa</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getApprovalColor(d.PHÊ_DUYỆT)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={d.PHÊ_DUYỆT || ''}
                            onChange={(e) => handleUpdate(d.id, 'PHÊ_DUYỆT', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Chưa phản hồi</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã duyệt</option>
                            <option className="bg-[#0b0f19] text-slate-200">Duyệt có điều kiện</option>
                            <option className="bg-[#0b0f19] text-slate-200">Yêu cầu chỉnh sửa</option>
                            <option className="bg-[#0b0f19] text-slate-200">Không đạt</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getNextStepColor(d.BƯỚC_TIẾP_THEO)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={d.BƯỚC_TIẾP_THEO || ''}
                            onChange={(e) => handleUpdate(d.id, 'BƯỚC_TIẾP_THEO', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Vẽ mới</option>
                            <option className="bg-[#0b0f19] text-slate-200">Chỉnh sửa bản vẽ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Gửi duyệt nội bộ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Gửi CĐT</option>
                            <option className="bg-[#0b0f19] text-slate-200">Giải trình</option>
                            <option className="bg-[#0b0f19] text-slate-200">Chốt hồ sơ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Hoàn tất thiết kế</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent focus:outline-none appearance-none cursor-pointer ${getFinalResultColor(d.KẾT_QUẢ_CUỐI)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={d.KẾT_QUẢ_CUỐI || ''}
                            onChange={(e) => handleUpdate(d.id, 'KẾT_QUẢ_CUỐI', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200" value="-">-</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã duyệt bản vẽ sơ bộ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã duyệt bản vẽ thi công</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã chốt BOQ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã có bản vẽ hoàn công</option>
                            <option className="bg-[#0b0f19] text-slate-200">Hoàn tất thiết kế</option>
                            <option className="bg-[#0b0f19] text-slate-200">N/A</option>
                          </select>
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
