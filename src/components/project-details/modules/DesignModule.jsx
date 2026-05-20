import React, { useState } from 'react';
import { PenTool, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const initialDesigns = [
  { id: 1, item: 'Bản vẽ sơ bộ làm giấy phép', status: 'Hoàn thành', approval: 'Đã duyệt', nextStep: 'N/A', finalResult: 'N/A' },
  { id: 2, item: 'Bản vẽ thi công', status: 'Đang xử lý', approval: 'Chờ duyệt', nextStep: 'Gửi CĐT duyệt', finalResult: 'N/A' },
  { id: 3, item: 'BOQ', status: 'Đang xử lý', approval: 'Chưa gửi duyệt', nextStep: 'Kiểm tra lại', finalResult: 'N/A' },
  { id: 4, item: 'Bản vẽ hoàn công', status: 'Chưa làm', approval: 'N/A', nextStep: 'Chờ thi công xong', finalResult: 'N/A' },
];

export default function DesignModule({ project }) {
  const [isOpen, setIsOpen] = useState(false);
  const [designs, setDesigns] = useState(initialDesigns);

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

  const completedCount = designs.filter(d => d.status === 'Hoàn thành').length;
  const progressPercent = Math.round((completedCount / designs.length) * 100);

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
            <span className="text-white">{completedCount} / {designs.length} hoàn thành</span>
            <span className="text-[#10b981]">{progressPercent}%</span>
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
                      <tr key={d.id} className="hover:bg-[#0b0f19]/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-200">{d.item}</td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getStatusColor(d.status)}`}
                            value={d.status}
                            onChange={() => {}}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Chưa làm</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang xử lý</option>
                            <option className="bg-[#0b0f19] text-slate-200">Hoàn thành</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getApprovalColor(d.approval)}`}
                            value={d.approval}
                            onChange={() => {}}
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
                            className="bg-transparent text-slate-300 font-medium focus:outline-none w-full border-b border-transparent focus:border-[#5252ff]"
                            value={d.nextStep}
                            onChange={() => {}}
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="text" 
                            className="bg-transparent text-slate-300 font-medium focus:outline-none w-full border-b border-transparent focus:border-[#5252ff]"
                            value={d.finalResult}
                            onChange={() => {}}
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
