import React, { useState, useEffect } from 'react';
import { Truck, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../services/api';

export default function ProcurementModule({ project }) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await api.getProcurements(project?.PROJECT_ID || project?.id);
        if (data) setItems(data);
      } catch (error) {
        console.error("Fetch procurement error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (project?.PROJECT_ID || project?.id) fetchData();
  }, [project?.PROJECT_ID, project?.id]);

  const handleUpdate = async (id, field, value) => {
    try {
      setIsUpdating(true);
      const original = items.find(i => (i._rowIndex || i.id) === id);
      const updated = { ...original, [field]: value };
      
      setItems(prev => prev.map(i => (i._rowIndex || i.id) === id ? updated : i));
      await api.updateProcurement(updated);
    } catch (error) {
      console.error("Update procurement error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Chưa yêu cầu': return 'text-slate-400';
      case 'Đang lấy báo giá': return 'text-purple-400';
      case 'Đã duyệt mua': return 'text-blue-400';
      case 'Đã đặt hàng': return 'text-blue-500';
      case 'Đang sản xuất': return 'text-orange-400';
      case 'Đang vận chuyển': return 'text-yellow-400';
      case 'Đã tới site': return 'text-emerald-400';
      case 'Thiếu vật tư': return 'text-red-400';
      case 'Hoàn thành': return 'text-emerald-500 font-black';
      default: return 'text-slate-400';
    }
  };

  const getProgressColor = (progress) => {
    switch (progress) {
      case 'Đúng tiến độ': return 'text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded';
      case 'Có nguy cơ trễ': return 'text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded';
      case 'Trễ': return 'text-red-400 bg-red-500/10 px-2 py-0.5 rounded';
      case 'Critical Delay': return 'text-red-500 bg-red-900/30 px-2 py-0.5 rounded font-black border border-red-500/50';
      default: return 'text-slate-300';
    }
  };

  const completedCount = items.filter(i => i.TÌNH_TRẠNG_VẬT_TƯ === 'Hoàn thành' || i.TÌNH_TRẠNG_VẬT_TƯ === 'Đã tới site').length;

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
              <>
                <span className="text-[#6b7d9b]">Mặt hàng chính:</span>
                <span className="text-white">{completedCount} / {items.length} (Tại site)</span>
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
                <table className="w-full text-left text-xs min-w-[1000px]">
                  <thead>
                    <tr className="bg-[#0b0f19] text-[#6b7d9b] font-bold uppercase tracking-wider border-b border-[#182135]">
                      <th className="p-3">Hạng mục mua hàng</th>
                      <th className="p-3">Nhà cung cấp</th>
                      <th className="p-3">PO No.</th>
                      <th className="p-3">Ngày YC</th>
                      <th className="p-3">Ngày về DK</th>
                      <th className="p-3">Ngày về TT</th>
                      <th className="p-3">Tình trạng vật tư</th>
                      <th className="p-3">Đánh giá tiến độ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182135]">
                    {items.map(item => (
                      <tr key={item._rowIndex || item.id} className="hover:bg-[#0b0f19]/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-200">{item.HẠNG_MỤC_MUA_HÀNG}</td>
                        <td className="p-3">
                          <input type="text" className={`bg-transparent text-slate-300 font-medium focus:outline-none w-full border-b border-transparent focus:border-[#5252ff] ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`} value={item.NCC || ''} onChange={(e) => {
                            const updated = [...items];
                            const idx = updated.findIndex(x => (x._rowIndex || x.id) === (item._rowIndex || item.id));
                            updated[idx] = { ...updated[idx], NCC: e.target.value };
                            setItems(updated);
                          }} onBlur={(e) => handleUpdate(item._rowIndex || item.id, 'NCC', e.target.value)} placeholder="-" />
                        </td>
                        <td className="p-3">
                          <input type="text" className={`bg-transparent text-slate-300 font-medium focus:outline-none w-full border-b border-transparent focus:border-[#5252ff] ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`} value={item.GHI_CHÚ || ''} onChange={(e) => {
                            const updated = [...items];
                            const idx = updated.findIndex(x => (x._rowIndex || x.id) === (item._rowIndex || item.id));
                            updated[idx] = { ...updated[idx], GHI_CHÚ: e.target.value };
                            setItems(updated);
                          }} onBlur={(e) => handleUpdate(item._rowIndex || item.id, 'GHI_CHÚ', e.target.value)} placeholder="-" />
                        </td>
                        <td className="p-3 text-slate-400">-</td>
                        <td className="p-3 text-slate-400">{item.NGÀY_VỀ_DỰ_KIẾN || '-'}</td>
                        <td className="p-3 text-emerald-400 font-semibold">{item.NGÀY_VỀ_THỰC_TẾ || '-'}</td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getStatusColor(item.TÌNH_TRẠNG_VẬT_TƯ)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={item.TÌNH_TRẠNG_VẬT_TƯ}
                            onChange={(e) => handleUpdate(item._rowIndex || item.id, 'TÌNH_TRẠNG_VẬT_TƯ', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Chưa yêu cầu</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang lấy báo giá</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã duyệt mua</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã đặt hàng</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang sản xuất</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang vận chuyển</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã tới site</option>
                            <option className="bg-[#0b0f19] text-slate-200">Thiếu vật tư</option>
                            <option className="bg-[#0b0f19] text-slate-200">Hoàn thành</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getProgressColor(item.ĐÁNH_GIÁ_TIẾN_ĐỘ)} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                            value={item.ĐÁNH_GIÁ_TIẾN_ĐỘ}
                            onChange={(e) => handleUpdate(item._rowIndex || item.id, 'ĐÁNH_GIÁ_TIẾN_ĐỘ', e.target.value)}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Đúng tiến độ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Có nguy cơ trễ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Trễ</option>
                            <option className="bg-[#0b0f19] text-slate-200">Critical Delay</option>
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
