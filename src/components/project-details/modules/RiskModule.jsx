import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const initialRisks = [
  { id: 1, severity: 'Cao', content: 'Chậm phê duyệt PCCC', impact: 'Delay COD 2 tuần', status: 'Đang xử lý', owner: 'Mr. Tuấn', date: '10/05/2026' },
  { id: 2, severity: 'Trung bình', content: 'Mưa nhiều ảnh hưởng kéo cáp', impact: 'Giảm năng suất 30%', status: 'Theo dõi', owner: 'Mr. Hải', date: '15/05/2026' },
  { id: 3, severity: 'Thấp', content: 'Thay đổi layout inverter', impact: 'Phát sinh chi phí nhỏ', status: 'Đã đóng', owner: 'Mr. Nam', date: '01/05/2026' },
];

export default function RiskModule({ project }) {
  const [isOpen, setIsOpen] = useState(false);
  const [risks, setRisks] = useState(initialRisks);

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

  const activeCount = risks.filter(r => r.status === 'Đang xử lý').length;
  const watchCount = risks.filter(r => r.status === 'Theo dõi').length;
  const closedCount = risks.filter(r => r.status === 'Đã đóng').length;

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
            <div className="flex items-center gap-1.5"><span className="text-[#6b7d9b]">Tổng</span> <span className="text-white">{risks.length}</span></div>
            <div className="flex items-center gap-1.5"><span className="text-[#6b7d9b]">Xử lý</span> <span className="text-blue-400">{activeCount}</span></div>
            <div className="flex items-center gap-1.5"><span className="text-[#6b7d9b]">Theo dõi</span> <span className="text-orange-400">{watchCount}</span></div>
            <div className="flex items-center gap-1.5"><span className="text-[#6b7d9b]">Đã đóng</span> <span className="text-emerald-400">{closedCount}</span></div>
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
                <button className="bg-[#182135] hover:bg-[#263554] text-slate-200 text-xs font-semibold px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors">
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
                      <tr key={r.id} className="hover:bg-[#0b0f19]/50 transition-colors">
                        <td className="p-3">
                          <select 
                            className={`bg-transparent text-xs font-bold focus:outline-none appearance-none cursor-pointer px-2 py-1 rounded border ${getSeverityColor(r.severity)}`}
                            value={r.severity}
                            onChange={() => {}}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Cao</option>
                            <option className="bg-[#0b0f19] text-slate-200">Trung bình</option>
                            <option className="bg-[#0b0f19] text-slate-200">Thấp</option>
                          </select>
                        </td>
                        <td className="p-3 font-semibold text-slate-200">{r.content}</td>
                        <td className="p-3 text-[#8ca0c3]">{r.impact}</td>
                        <td className="p-3">
                          <select 
                            className={`bg-transparent font-bold focus:outline-none appearance-none cursor-pointer ${getStatusColor(r.status)}`}
                            value={r.status}
                            onChange={() => {}}
                          >
                            <option className="bg-[#0b0f19] text-slate-200">Open</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đang xử lý</option>
                            <option className="bg-[#0b0f19] text-slate-200">Theo dõi</option>
                            <option className="bg-[#0b0f19] text-slate-200">Đã đóng</option>
                          </select>
                        </td>
                        <td className="p-3 text-slate-300 font-medium">{r.owner}</td>
                        <td className="p-3 text-[#6b7d9b]">{r.date}</td>
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
