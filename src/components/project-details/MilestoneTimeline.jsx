import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, Circle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

export default function MilestoneTimeline({ project, moduleProgress = {}, milestonesData = [] }) {
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateMilestones = () => {
      setIsLoading(true);
      const today = new Date();
      today.setHours(0,0,0,0);

      const parseDateStr = (dateStr) => {
        if (!dateStr || dateStr === '-') return null;
        const parts = String(dateStr).split('/');
        if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
        return new Date(dateStr);
      };

      const calculateEndDate = (start, days) => {
        if (!start || !days) return '-';
        const d = new Date(start);
        if (isNaN(d.getTime())) return '-';
        d.setDate(d.getDate() + parseInt(days));
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      };

      const getModuleData = (moduleKey, title) => {
        let date = '-';
        let startDate = null;
        let endDate = null;
        
        // 1. First check milestonesData from backend (Source of Truth)
        const milestoneRow = milestonesData.find(m => String(m.MILESTONE).toUpperCase() === String(title).toUpperCase() || String(m.MILESTONE).toUpperCase().includes(String(title).toUpperCase()));
        if (milestoneRow && milestoneRow.NGÀY_KẾ_HOẠCH) {
          date = milestoneRow.NGÀY_KẾ_HOẠCH;
          endDate = parseDateStr(date);
        }

        // 2. Then check localStorage if backend date is missing
        try {
          const id = project?.PROJECT_ID || project?.id;
          const data = localStorage.getItem(`dates_${moduleKey}_${id}`);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed.start) {
              startDate = parseDateStr(parsed.start.split('-').reverse().join('/')); // handle yyyy-mm-dd
            }
            if (date === '-') {
              date = calculateEndDate(parsed.start, parsed.days);
              endDate = parseDateStr(date);
            }
          }
        } catch(e) {}

        let status = 'pending';
        const progress = moduleProgress[moduleKey] || 0;

        if (!endDate) {
          // Fallback if no date
          if (progress >= 100) status = 'completed';
          else if (progress > 0) status = 'in-progress';
        } else {
          // Date-driven logic
          if (today <= endDate) {
            // Chưa đến hoặc bằng ngày kết thúc
            if (startDate && today < startDate) {
              status = 'pending'; // Chưa đến cả ngày bắt đầu
            } else {
              status = 'in-progress'; // Đang trong giai đoạn làm
            }
          } else {
            // Quá ngày kết thúc
            if (progress >= 100) {
              status = 'completed'; // Đã xong
            } else {
              status = 'delay'; // Trễ hạn
            }
          }
        }

        return { title, date, status };
      };

      const kickoffSheetData = milestonesData.find(m => String(m.MILESTONE).toUpperCase() === 'KICKOFF');
      let kickoffDate = kickoffSheetData?.NGÀY_KẾ_HOẠCH || project?.kickoffDate || project?.startDate || project?.NGÀY_BẮT_ĐẦU || '-';
      if (!kickoffDate || kickoffDate === '') kickoffDate = '-';
      let kickoffStatus = 'completed';
      const kD = parseDateStr(kickoffDate);
      if (kD && today < kD) {
        kickoffStatus = 'pending';
      }
      
      let codStatus = 'pending';
      const codSheetData = milestonesData.find(m => String(m.MILESTONE).toUpperCase() === 'COD' || String(m.MILESTONE).toUpperCase() === 'BÀN GIAO & ĐÓNG ĐIỆN (COD)');
      let codDateStr = codSheetData?.NGÀY_KẾ_HOẠCH || project?.cod || project?.codDate || project?.COD || '29/06/2026';
      if (!codDateStr || codDateStr === '') codDateStr = '29/06/2026';
      const codD = parseDateStr(codDateStr);
      if (!codD) {
        codStatus = project?.status === 'completed' ? 'completed' : 'in-progress';
      } else {
        if (today <= codD) {
          codStatus = 'in-progress';
        } else {
          if (project?.status === 'completed' || (moduleProgress['handover'] >= 100)) {
            codStatus = 'completed';
          } else {
            codStatus = 'delay';
          }
        }
      }

      const generated = [
        { id: 1, title: 'KICKOFF', date: kickoffDate, status: kickoffStatus },
        { id: 2, ...getModuleData('permit', 'PHÁP LÝ') },
        { id: 3, ...getModuleData('design', 'THIẾT KẾ') },
        { id: 4, ...getModuleData('procurement', 'VẬT TƯ') },
        { id: 5, ...getModuleData('construction', 'THI CÔNG') },
        { id: 6, title: 'COD', date: codDateStr, status: codStatus },
        { id: 7, ...getModuleData('handover', 'BÀN GIAO HỒ SƠ') }
      ];

      setMilestones(generated);
      setIsLoading(false);
    };

    if (project?.PROJECT_ID || project?.id) {
      generateMilestones();
    }
  }, [project, moduleProgress, milestonesData]);

  const lastActiveIndex = [...milestones].reverse().findIndex(m => m.status === 'completed' || m.status === 'in-progress' || m.status === 'delay');
  const activeIndex = lastActiveIndex !== -1 ? (milestones.length - 1 - lastActiveIndex) : 0;
  const percentWidth = `${(activeIndex / (milestones.length - 1)) * 100}%`;
  
  return (
    <div className="glass-panel p-6 rounded-xl shadow-lg border border-[var(--border-main)] print:break-inside-avoid">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          TRỤC MILESTONE KIỂM SOÁT TIẾN ĐỘ
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)]" />}
        </h3>
        <div className="flex gap-4 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10b981]"></div> Hoàn thành</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div> Đang thực hiện</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#4d5e7a]"></div> Chưa bắt đầu</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ef4444]"></div> Delay</div>
        </div>
      </div>

      <div className="relative pt-4 pb-12 overflow-x-auto custom-scrollbar">
        <div className="min-w-[800px] relative px-10">
          
          {/* Lines Container matching exact width of flex items */}
          <div className="absolute top-[20px] left-10 right-10 h-1 bg-[var(--border-main)] rounded-full">
            {/* Progress Line */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: percentWidth }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-[#10b981] to-[#3b82f6] rounded-full"
            ></motion.div>
          </div>

          <div className="flex justify-between relative">
            {milestones.map((ms, index) => {
              let Icon = Circle;
              let colorClass = "text-[var(--text-muted)] bg-[var(--bg-panel)] border-[#263554] shadow-[0_0_8px_rgba(38,53,84,0.4)]";

              if (ms.status === 'completed') {
                Icon = CheckCircle2;
                colorClass = "text-[#10b981] bg-[var(--bg-panel)] border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.2)]";
              } else if (ms.status === 'in-progress') {
                Icon = Clock;
                colorClass = "text-[#3b82f6] bg-[var(--bg-panel)] border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse";
              } else if (ms.status === 'delay') {
                Icon = AlertCircle;
                colorClass = "text-[#ef4444] bg-[var(--bg-panel)] border-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.3)]";
              } else if (index <= activeIndex) {
                // If it's pending but the line has passed through it, light it up
                colorClass = "text-[#3b82f6] bg-[var(--bg-panel)] border-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.2)]";
              }

              return (
                <div key={ms.id} className="flex flex-col items-center relative z-10 w-24">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1, type: "spring" }}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center relative mb-4 ${colorClass}`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    {ms.status === 'in-progress' && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3b82f6] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#3b82f6]"></span>
                      </span>
                    )}
                  </motion.div>
                  
                  <div className="text-center absolute top-14 w-full">
                    <p className={`text-[10px] font-bold tracking-wider uppercase mb-1 ${
                      ms.status === 'pending' && index > activeIndex ? "text-[#8a9bb8]" : "text-slate-200"
                    }`}>
                      {ms.title}
                    </p>
                    <p className={`text-xs font-semibold ${
                      ms.status === 'pending' && index > activeIndex ? "text-[var(--text-muted)]" : 
                      ms.status === 'delay' ? "text-[#ef4444]" : 
                      ms.status === 'in-progress' || (ms.status === 'pending' && index <= activeIndex) ? "text-[#3b82f6]" : "text-[#10b981]"
                    }`}>
                      {ms.date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
