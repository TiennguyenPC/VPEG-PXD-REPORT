import React, { useState, useEffect } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';

export default function RiskModule({ project, initialData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [risks, setRisks] = useState(initialData || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (initialData) {
      setRisks(initialData);
      setIsLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await api.getRisks(project?.PROJECT_ID || project?.id);
        if (data) setRisks(data);
      } catch (error) {
        console.error("Fetch risk error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (project?.PROJECT_ID || project?.id) {
      fetchData();
    }
  }, [project?.PROJECT_ID, project?.id, initialData]);

  const handleUpdate = async (id, field, value) => {
    try {
      setIsUpdating(true);
      const original = risks.find(r => (r._rowIndex || r.id) === id);
      const updated = { ...original, [field]: value };
      
      // Optimistic update
      setRisks(prev => prev.map(r => (r._rowIndex || r.id) === id ? updated : r));
      
      await api.updateRisk(updated);
    } catch (error) {
      console.error("Update risk error:", error);
      // Optional: reload data to revert
    } finally {
      setIsUpdating(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Cao': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'Trung bình': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'Thấp': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'text-red-400';
      case 'Đang xử lý': return 'text-blue-400';
      case 'Theo dõi': return 'text-orange-400';
      case 'Đã đóng': return 'text-emerald-400';
      default: return 'text-slate-400';
    }
  };

  const activeCount = risks.filter(r => r.TRẠNG_THÁI === 'Đang xử lý').length;
  const watchCount = risks.filter(r => r.TRẠNG_THÁI === 'Theo dõi').length;
  const closedCount = risks.filter(r => r.TRẠNG_THÁI === 'Đã đóng').length;

  return (
    <div className="glass-panel rounded-xl shadow-lg border border-[#182135] overflow-hidden">
      {/* Header / Accordion Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-[#0b0f19] hover:bg-[#0d1322] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#ef4444]/10 text-[#ef4444] flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">RỦI RO DỰ ÁN</h3>
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
                <div className="flex items-center gap-1.5"><span className="text-[#6b7d9b]">Tổng</span> <span className="text-white">{risks.length}</span></div>
                <div className="flex items-center gap-1.5"><span className="text-[#6b7d9b]">Xử lý</span> <span className="text-blue-400">{activeCount}</span></div>
                <div className="flex items-center gap-1.5"><span className="text-[#6b7d9b]">Theo dõi</span> <span className="text-orange-400">{watchCount}</span></div>
                <div className="flex items-center gap-1.5"><span className="text-[#6b7d9b]">Đã đóng</span> <span className="text-emerald-400">{closedCount}</span></div>
              </>
            )}
          </div>
          <div className="w-[1px] h-6 bg-[#182135] mx-2"></div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-[#6b7d9b]" /> : <ChevronDown className="w-4 h-4 text-[#6b7d9b]" />}
        </div>
      </button>

      {/* Accordion Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 border-t border-[#182135] bg-[#060a13]">
              <div className="flex justify-end mb-3">
                <button 
                  onClick={async () => {
                    const newRisk = {
                      PROJECT_ID: project?.PROJECT_ID || project?.id || '',
                      MỨC_ĐỘ: 'Trung bình',
                      NỘI_DUNG: 'Rủi ro mới',
                      ẢNH_HƯỞNG: '',
                      TRẠNG_THÁI: 'Open',
                      PHỤ_TRÁCH: '',
                      NGÀY: new Date().toLocaleDateString('vi-VN'),
                      GHI_CHÚ: ''
                    };
                    setRisks(prev => [...prev, { ...newRisk, _rowIndex: 'new-' + Date.now() }]);
                    try { await api.addRisk(newRisk); } catch(e) { console.error("Add risk error:", e); }
                  }}
                  className="bg-[#182135] hover:bg-[#263554] text-slate-200 text-xs font-semibold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm rủi ro
                </button>
              </div>
              
              <div className="overflow-x-auto rounded-lg border border-[#182135]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#0b0f19] text-[#6b7d9b] font-bold uppercase tracking-wider border-b border-[#182135]">
                      <th className="p-3">Mức độ</th>
                      <th className="p-3">Nội dung</th>
                      <th className="p-3">Ảnh hưởng</th>
                      <th className="p-3">Trạng thái</th>
                      <th className="p-3">Phụ trách</th>
                      <th className="p-3">Ngày</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182135]">
                    {risks.map(r => (
                      <tr key={r._rowIndex || r.id} className="hover:bg-[#0b0f19]/50 transition-colors">
                        <td className="p-3">
                          <select 
                            className={`bg-transparent text-xs font-bold focus:outline-none appearance-none cursor-pointer px-2 py-1 rounded border ${getSeverityColor(r.MỨC_ĐỘ)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={r.MỨC_ĐỘ}
                            onChange={(e) => handleUpdate(r._rowIndex || r.id, 'MỨC_ĐỘ', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Cao</option>
                            <option className="bg-[#0b0f19] text-slate-200">Trung bình</option>
                            <option className="bg-[#0b0f19] text-slate-200">Thấp</option>
                          </select>
                        </td>
                        <td className="p-3 font-semibold text-slate-200">{r.NỘI_DUNG}</td>
                        <td className="p-3 text-[#8ca0c3]">{r.ẢNH_HƯỞNG}</td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getStatusColor(r.TRẠNG_THÁI)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={r.TRẠNG_THÁI}
                            onChange={(e) => handleUpdate(r._rowIndex || r.id, 'TRẠNG_THÁI', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Open</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang xử lý</option>
                            <option className="bg-[#0b0f19] text-slate-200">Theo dõi</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã đóng</option>
                          </select>
                        </td>
                        <td className="p-3 text-slate-300 font-medium">{r.PHỤ_TRÁCH}</td>
                        <td className="p-3 text-[#6b7d9b]">{r.NGÀY}</td>
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
