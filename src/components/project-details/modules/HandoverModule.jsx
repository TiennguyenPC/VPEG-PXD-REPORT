import React, { useState, useEffect } from 'react';
import { ClipboardCheck, ChevronDown, ChevronUp, Loader2, FileText, CheckSquare, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';

const defaultHandovers = [
  'Hồ sơ thiết kế hoàn công',
  'Tài liệu hướng dẫn vận hành & bảo trì (O&M Manuals)',
  'Biên bản nghiệm thu hoàn thành T&C và chạy thử',
  'Giấy chứng nhận/biên bản kiểm định thiết bị',
  'Biên bản nghiệm thu COD & Bàn giao đưa vào sử dụng'
];

export default function HandoverModule({ project, initialData, onProgressChange }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const mergeHandoverData = (data) => {
    return defaultHandovers.map((name, index) => {
      const nameLower = name.toLowerCase().replace(/\s+/g, '');
      const row = data ? data.find(r => r.HẠNG_MỤC && r.HẠNG_MỤC.toLowerCase().replace(/\s+/g, '') === nameLower) : null;
      if (row) {
        return {
          id: `handover_${index}`,
          _rowIndex: row._rowIndex,
          HẠNG_MỤC: name,
          TÌNH_TRẠNG: row.TÌNH_TRẠNG || 'Chưa làm',
          KẾT_QUẢ_PHẢN_HỒI: row.KẾT_QUẢ_PHẢN_HỒI || 'Chưa có phản hồi',
          BƯỚC_TIẾP_THEO: row.BƯỚC_TIẾP_THEO || 'Chuẩn bị hồ sơ',
          KẾT_QUẢ_CUỐI: row.KẾT_QUẢ_CUỐI || 'N/A'
        };
      }
      return {
        id: `handover_${index}`,
        _rowIndex: undefined,
        HẠNG_MỤC: name,
        TÌNH_TRẠNG: 'Chưa làm',
        KẾT_QUẢ_PHẢN_HỒI: 'Chưa có phản hồi',
        BƯỚC_TIẾP_THEO: 'Chuẩn bị hồ sơ',
        KẾT_QUẢ_CUỐI: 'N/A'
      };
    });
  };

  const [handovers, setHandovers] = useState(() => mergeHandoverData(initialData));
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (initialData) {
      const merged = mergeHandoverData(initialData);
      setHandovers(merged);
      setIsLoading(false);
      
      const compCount = merged.filter(p => p.KẾT_QUẢ_CUỐI && p.KẾT_QUẢ_CUỐI !== '-' && p.KẾT_QUẢ_CUỐI !== 'N/A' && p.KẾT_QUẢ_CUỐI.trim() !== '').length;
      const prog = merged.length > 0 ? Math.round((compCount / merged.length) * 100) : 0;
      if (onProgressChange) onProgressChange(prog);
      return;
    }
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await api.getHandovers(project?.PROJECT_ID || project?.id);
        const merged = mergeHandoverData(data);
        setHandovers(merged);
        
        const compCount = merged.filter(p => p.KẾT_QUẢ_CUỐI && p.KẾT_QUẢ_CUỐI !== '-' && p.KẾT_QUẢ_CUỐI !== 'N/A' && p.KẾT_QUẢ_CUỐI.trim() !== '').length;
        const prog = merged.length > 0 ? Math.round((compCount / merged.length) * 100) : 0;
        if (onProgressChange) onProgressChange(prog);
      } catch (error) {
        console.error("Fetch handover error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (project?.PROJECT_ID || project?.id) fetchData();
  }, [project?.PROJECT_ID, project?.id, initialData]);

  const handleUpdate = async (id, field, value) => {
    try {
      setIsUpdating(true);
      
      let updatedItem = null;
      const updatedList = handovers.map(p => {
        if (p.id === id) {
          updatedItem = { ...p, [field]: value };
          return updatedItem;
        }
        return p;
      });
      setHandovers(updatedList);

      const compCount = updatedList.filter(p => p.KẾT_QUẢ_CUỐI && p.KẾT_QUẢ_CUỐI !== '-' && p.KẾT_QUẢ_CUỐI !== 'N/A' && p.KẾT_QUẢ_CUỐI.trim() !== '').length;
      const prog = updatedList.length > 0 ? Math.round((compCount / updatedList.length) * 100) : 0;
      if (onProgressChange) onProgressChange(prog);

      if (updatedItem) {
        const payload = {
          _rowIndex: updatedItem._rowIndex,
          PROJECT_ID: project?.PROJECT_ID || project?.id,
          HẠNG_MỤC: updatedItem.HẠNG_MỤC,
          TÌNH_TRẠNG: updatedItem.TÌNH_TRẠNG,
          KẾT_QUẢ_PHẢN_HỒI: updatedItem.KẾT_QUẢ_PHẢN_HỒI,
          BƯỚC_TIẾP_THEO: updatedItem.BƯỚC_TIẾP_THEO,
          KẾT_QUẢ_CUỐI: updatedItem.KẾT_QUẢ_CUỐI
        };
        const response = await api.updateHandover(payload);
        if (response && response.data) {
          const merged = mergeHandoverData(response.data);
          setHandovers(merged);
        }
      }
    } catch (error) {
      console.error("Update handover error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Chưa làm': return 'text-slate-400';
      case 'Đang chuẩn bị hồ sơ': return 'text-[#f59e0b]';
      case 'Đã trình duyệt': return 'text-[#3b82f6]';
      case 'Đang chỉnh sửa': return 'text-[#ef4444]';
      case 'Đã chốt': return 'text-[#10b981]';
      default: return 'text-slate-400';
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'Chưa có phản hồi': return 'text-slate-400';
      case 'Đã tiếp nhận': return 'text-[#3b82f6]';
      case 'Yêu cầu chỉnh sửa': return 'text-red-400';
      case 'Đã thông qua': return 'text-[#10b981]';
      default: return 'text-slate-300';
    }
  };

  const getNextStepColor = (step) => {
    switch (step) {
      case 'Chuẩn bị hồ sơ': return 'text-[#3b82f6]';
      case 'Bổ sung/Chỉnh sửa': return 'text-[#f59e0b]';
      case 'Trình ký duyệt': return 'text-[#10b981] font-semibold';
      default: return 'text-slate-300';
    }
  };

  const getFinalResultColor = (res) => {
    if (res && res !== '-' && res !== 'N/A') return 'text-[#10b981] font-semibold';
    return 'text-slate-500';
  };

  const getHandoverIcon = (name) => {
    const lowercase = name.toLowerCase();
    if (lowercase.includes('thiết kế')) return <FolderOpen className="w-3.5 h-3.5 text-[#3b82f6]" />;
    if (lowercase.includes('vận hành')) return <FileText className="w-3.5 h-3.5 text-[#eab308]" />;
    if (lowercase.includes('nghiệm thu')) return <CheckSquare className="w-3.5 h-3.5 text-[#ef4444]" />;
    return <ClipboardCheck className="w-3.5 h-3.5 text-[#10b981]" />;
  };

  const completedCount = handovers.filter(p => p.KẾT_QUẢ_CUỐI && p.KẾT_QUẢ_CUỐI !== '-' && p.KẾT_QUẢ_CUỐI !== 'N/A' && p.KẾT_QUẢ_CUỐI.trim() !== '').length;
  const progressPercent = handovers.length > 0 ? Math.round((completedCount / handovers.length) * 100) : 0;

  return (
    <div className="glass-panel rounded-xl shadow-lg border border-[#182135] overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#0b0f19] hover:bg-[#0d1322] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#10b981]/10 text-[#10b981] flex items-center justify-center">
            <ClipboardCheck className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">BÀN GIAO HỒ SƠ DỰ ÁN</h3>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-xs font-semibold">
            {isLoading ? (
              <div className="flex items-center gap-2 text-[#6b7d9b]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tải...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#182135]/50 border border-[#1e293b] px-3 py-1 rounded-full text-xs">
                <span className="text-[#8ca0c3]">{completedCount}/{handovers.length} hoàn thành</span>
                <span className="w-1 h-1 bg-[#10b981] rounded-full"></span>
                <span className="text-[#10b981] font-bold">{progressPercent}%</span>
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
                      <th className="p-3">Hạng mục</th>
                      <th className="p-3">Tình trạng</th>
                      <th className="p-3">Phản hồi</th>
                      <th className="p-3">Bước tiếp</th>
                      <th className="p-3">Kết quả cuối</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182135]">
                    {handovers.map(p => (
                      <tr key={p.id} className="hover:bg-[#0b0f19]/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-200 flex items-center gap-2">
                          {getHandoverIcon(p.HẠNG_MỤC)}
                          <span>{p.HẠNG_MỤC}</span>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getStatusColor(p.TÌNH_TRẠNG)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={p.TÌNH_TRẠNG || ''}
                            onChange={(e) => handleUpdate(p.id, 'TÌNH_TRẠNG', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Chưa làm</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang chuẩn bị hồ sơ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã trình duyệt</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang chỉnh sửa</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã chốt</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getResultColor(p.KẾT_QUẢ_PHẢN_HỒI)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={p.KẾT_QUẢ_PHẢN_HỒI || ''}
                            onChange={(e) => handleUpdate(p.id, 'KẾT_QUẢ_PHẢN_HỒI', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Chưa có phản hồi</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã tiếp nhận</option>
                            <option className="bg-[#0b0f19] text-slate-200">Yêu cầu chỉnh sửa</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã thông qua</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getNextStepColor(p.BƯỚC_TIẾP_THEO)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={p.BƯỚC_TIẾP_THEO || ''}
                            onChange={(e) => handleUpdate(p.id, 'BƯỚC_TIẾP_THEO', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Chuẩn bị hồ sơ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Trình duyệt CĐT</option>
                            <option className="bg-[#0b0f19] text-slate-200">Bổ sung/Chỉnh sửa</option>
                            <option className="bg-[#0b0f19] text-slate-200">Trình ký duyệt</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent focus:outline-none appearance-none cursor-pointer ${getFinalResultColor(p.KẾT_QUẢ_CUỐI)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={p.KẾT_QUẢ_CUỐI || ''}
                            onChange={(e) => handleUpdate(p.id, 'KẾT_QUẢ_CUỐI', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200" value="-">-</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã ký duyệt</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã bàn giao</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã hoàn tất</option>
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
