import React, { useState, useEffect } from 'react';
import { PenTool, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';

export default function DesignModule({ project }) {
  const [isOpen, setIsOpen] = useState(false);
  const [designs, setDesigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await api.getDesigns(project?.PROJECT_ID || project?.id);
        if (data) setDesigns(data);
      } catch (error) {
        console.error("Fetch design error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (project?.PROJECT_ID || project?.id) fetchData();
  }, [project?.PROJECT_ID, project?.id]);

  const handleUpdate = async (id, field, value) => {
    try {
      setIsUpdating(true);
      const original = designs.find(d => (d._rowIndex || d.id) === id);
      const updated = { ...original, [field]: value };
      
      setDesigns(prev => prev.map(d => (d._rowIndex || d.id) === id ? updated : d));
      await api.updateDesign(updated);
    } catch (error) {
      console.error("Update design error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Chưa làm': return 'text-slate-400';
      case 'Đang xử lý': return 'text-blue-400';
      case 'Hoàn thành': return 'text-emerald-400';
      default: return 'text-slate-400';
    }
  };

  const getApprovalColor = (approval) => {
    if (approval === 'Đã duyệt') return 'text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded';
    if (approval === 'Bị từ chối') return 'text-red-400 bg-red-500/10 px-2 py-0.5 rounded';
    if (approval === 'Chờ duyệt') return 'text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded';
    return 'text-slate-300';
  };

  const completedCount = designs.filter(d => d.TÌNH_TRẠNG === 'Hoàn thành').length;
  const progressPercent = designs.length > 0 ? Math.round((completedCount / designs.length) * 100) : 0;

  return (
    <div className="glass-panel rounded-xl shadow-lg border border-[#182135] overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#0b0f19] hover:bg-[#0d1322] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#ec4899]/10 text-[#ec4899] flex items-center justify-center">
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
              <>
                <span className="text-white">{completedCount} / {designs.length} hoàn thành</span>
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
                      <th className="p-3">Hạng mục bản vẽ</th>
                      <th className="p-3">Tình trạng</th>
                      <th className="p-3">Phê duyệt</th>
                      <th className="p-3">Bước tiếp theo</th>
                      <th className="p-3">Kết quả cuối</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182135]">
                    {designs.map(d => (
                      <tr key={d._rowIndex || d.id} className="hover:bg-[#0b0f19]/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-200">{d.HẠNG_MỤC_BẢN_VẼ}</td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getStatusColor(d.TÌNH_TRẠNG)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={d.TÌNH_TRẠNG}
                            onChange={(e) => handleUpdate(d._rowIndex || d.id, 'TÌNH_TRẠNG', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Chưa làm</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang xử lý</option>
                            <option className="bg-[#0b0f19] text-slate-200">Hoàn thành</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getApprovalColor(d.PHÊ_DUYỆT)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={d.PHÊ_DUYỆT}
                            onChange={(e) => handleUpdate(d._rowIndex || d.id, 'PHÊ_DUYỆT', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">N/A</option>
                            <option className="bg-[#0b0f19] text-slate-200">Chưa gửi duyệt</option>
                            <option className="bg-[#0b0f19] text-slate-200">Chờ duyệt</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã duyệt</option>
                            <option className="bg-[#0b0f19] text-slate-200">Bị từ chối</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <input 
                            type="text" 
                            className={`bg-transparent text-slate-300 font-medium focus:outline-none w-full border-b border-transparent focus:border-[#5252ff] ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={d.BƯỚC_TIẾP_THEO || ''}
                            onChange={(e) => {
                              const updated = [...designs];
                              const idx = updated.findIndex(x => (x._rowIndex || x.id) === (d._rowIndex || d.id));
                              updated[idx] = { ...updated[idx], BƯỚC_TIẾP_THEO: e.target.value };
                              setDesigns(updated);
                            }}
                            onBlur={(e) => handleUpdate(d._rowIndex || d.id, 'BƯỚC_TIẾP_THEO', e.target.value)}
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="text" 
                            className={`bg-transparent text-slate-300 font-medium focus:outline-none w-full border-b border-transparent focus:border-[#5252ff] ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={d.KẾT_QUẢ_CUỐI || ''}
                            onChange={(e) => {
                              const updated = [...designs];
                              const idx = updated.findIndex(x => (x._rowIndex || x.id) === (d._rowIndex || d.id));
                              updated[idx] = { ...updated[idx], KẾT_QUẢ_CUỐI: e.target.value };
                              setDesigns(updated);
                            }}
                            onBlur={(e) => handleUpdate(d._rowIndex || d.id, 'KẾT_QUẢ_CUỐI', e.target.value)}
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
