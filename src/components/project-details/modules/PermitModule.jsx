import React, { useState, useEffect } from 'react';
import { FileText, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';

export default function PermitModule({ project }) {
  const [isOpen, setIsOpen] = useState(false);
  const [permits, setPermits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await api.getPermits(project?.PROJECT_ID || project?.id);
        if (data) setPermits(data);
      } catch (error) {
        console.error("Fetch permit error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (project?.PROJECT_ID || project?.id) fetchData();
  }, [project?.PROJECT_ID, project?.id]);

  const handleUpdate = async (id, field, value) => {
    try {
      setIsUpdating(true);
      const original = permits.find(p => (p._rowIndex || p.id) === id);
      const updated = { ...original, [field]: value };
      
      setPermits(prev => prev.map(p => (p._rowIndex || p.id) === id ? updated : p));
      await api.updatePermit(updated);
    } catch (error) {
      console.error("Update permit error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Chưa làm': return 'text-slate-400';
      case 'Đang chuẩn bị hồ sơ': return 'text-purple-400';
      case 'Đã nộp hồ sơ': return 'text-blue-400';
      case 'Đang xử lý': return 'text-orange-400';
      case 'Chờ phản hồi': return 'text-yellow-400';
      case 'Đang bổ sung': return 'text-red-400';
      case 'Hoàn thành': return 'text-emerald-400';
      default: return 'text-slate-400';
    }
  };

  const getResultColor = (result) => {
    if (result === 'Đã duyệt') return 'text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded';
    if (result === 'Bị từ chối' || result === 'Yêu cầu bổ sung') return 'text-red-400 bg-red-500/10 px-2 py-0.5 rounded';
    return 'text-slate-300';
  };

  const completedCount = permits.filter(p => p.TÌNH_TRẠNG === 'Hoàn thành').length;
  const progressPercent = permits.length > 0 ? Math.round((completedCount / permits.length) * 100) : 0;

  return (
    <div className="glass-panel rounded-xl shadow-lg border border-[#182135] overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#0b0f19] hover:bg-[#0d1322] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#8b5cf6]/10 text-[#8b5cf6] flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">GIẤY PHÉP / HỒ SƠ PHÁP LÝ</h3>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-xs font-semibold">
            {isLoading ? (
              <div className="flex items-center gap-2 text-[#6b7d9b]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tải...</span>
              </div>
            ) : (
              <>
                <span className="text-white">{completedCount} / {permits.length} hoàn thành</span>
                <span className="text-[#10b981]">{progressPercent}%</span>
              </>
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
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#0b0f19] text-[#6b7d9b] font-bold uppercase tracking-wider border-b border-[#182135]">
                      <th className="p-3">Hạng mục</th>
                      <th className="p-3">Tình trạng</th>
                      <th className="p-3">Kết quả / Phản hồi</th>
                      <th className="p-3">Bước tiếp theo</th>
                      <th className="p-3">Kết quả cuối</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182135]">
                    {permits.map(p => (
                      <tr key={p._rowIndex || p.id} className="hover:bg-[#0b0f19]/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-200">{p.HẠNG_MỤC}</td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getStatusColor(p.TÌNH_TRẠNG)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={p.TÌNH_TRẠNG}
                            onChange={(e) => handleUpdate(p._rowIndex || p.id, 'TÌNH_TRẠNG', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Chưa làm</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang chuẩn bị hồ sơ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã nộp hồ sơ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang xử lý</option>
                            <option className="bg-[#0b0f19] text-slate-200">Chờ phản hồi</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang bổ sung</option>
                            <option className="bg-[#0b0f19] text-slate-200">Hoàn thành</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getResultColor(p.KẾT_QUẢ_PHẢN_HỒI)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={p.KẾT_QUẢ_PHẢN_HỒI}
                            onChange={(e) => handleUpdate(p._rowIndex || p.id, 'KẾT_QUẢ_PHẢN_HỒI', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Chưa có phản hồi</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã tiếp nhận</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã có biên nhận</option>
                            <option className="bg-[#0b0f19] text-slate-200">Yêu cầu bổ sung</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã duyệt</option>
                            <option className="bg-[#0b0f19] text-slate-200">Bị từ chối</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent text-slate-300 font-medium focus:outline-none appearance-none cursor-pointer ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={p.BƯỚC_TIẾP_THEO}
                            onChange={(e) => handleUpdate(p._rowIndex || p.id, 'BƯỚC_TIẾP_THEO', e.target.value)}
                          >
                            <option className="bg-[#0b0f19]">Chuẩn bị hồ sơ</option>
                            <option className="bg-[#0b0f19]">Nộp hồ sơ</option>
                            <option className="bg-[#0b0f19]">Liên hệ cán bộ</option>
                            <option className="bg-[#0b0f19]">Bổ sung hồ sơ</option>
                            <option className="bg-[#0b0f19]">Theo dõi</option>
                            <option className="bg-[#0b0f19]">Gọi thúc</option>
                            <option className="bg-[#0b0f19]">Lấy kết quả</option>
                            <option className="bg-[#0b0f19]">Mời nghiệm thu</option>
                            <option className="bg-[#0b0f19]">N/A</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent text-slate-300 font-medium focus:outline-none appearance-none cursor-pointer ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={p.KẾT_QUẢ_CUỐI}
                            onChange={(e) => handleUpdate(p._rowIndex || p.id, 'KẾT_QUẢ_CUỐI', e.target.value)}
                          >
                            <option className="bg-[#0b0f19]">Đã có GCN</option>
                            <option className="bg-[#0b0f19]">Đã có biên nhận</option>
                            <option className="bg-[#0b0f19]">Đã nghiệm thu</option>
                            <option className="bg-[#0b0f19]">Đã có công văn</option>
                            <option className="bg-[#0b0f19]">Đã hoàn tất</option>
                            <option className="bg-[#0b0f19]">N/A</option>
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
