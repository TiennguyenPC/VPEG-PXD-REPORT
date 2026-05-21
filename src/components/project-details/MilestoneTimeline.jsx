import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, Circle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

const initialMilestones = [
  { id: 1, title: 'KICKOFF', date: '01/04/2026', status: 'completed' },
  { id: 2, title: 'PHÁP LÝ', date: '15/04/2026', status: 'completed' },
  { id: 3, title: 'THIẾT KẾ', date: '25/05/2026', status: 'in-progress' },
  { id: 4, title: 'VẬT TƯ', date: '10/06/2026', status: 'pending' },
  { id: 5, title: 'THI CÔNG', date: '25/06/2026', status: 'pending' },
  { id: 6, title: 'COMMISSIONING', date: '05/07/2026', status: 'pending' },
  { id: 7, title: 'COD', date: '29/06/2026', status: 'delay' },
  { id: 8, title: 'BÀN GIAO HỒ SƠ', date: '15/07/2026', status: 'pending' }
];

export default function MilestoneTimeline({ project }) {
  const [milestones, setMilestones] = useState(initialMilestones);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        setIsLoading(true);
        const data = await api.getMilestones(project?.PROJECT_ID || project?.id);
        if (data && data.length > 0) {
          const updated = initialMilestones.map(m => {
            const row = data.find(r => r.MILESTONE === m.title);
            if (row) {
              return {
                ...m,
                date: row.NGÀY_THỰC_TẾ || row.NGÀY_KẾ_HOẠCH || m.date,
                status: row.STATUS ? row.STATUS.toLowerCase() : m.status
              };
            }
            return m;
          });
          setMilestones(updated);
        }
      } catch (error) {
        console.error("Fetch milestones error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (project?.PROJECT_ID || project?.id) fetchMilestones();
  }, [project?.PROJECT_ID, project?.id]);

  const lastActiveIndex = [...milestones].reverse().findIndex(m => m.status === 'completed' || m.status === 'in-progress' || m.status === 'delay');
  const activeIndex = lastActiveIndex !== -1 ? (milestones.length - 1 - lastActiveIndex) : 0;
  const percentWidth = `${(activeIndex / (milestones.length - 1)) * 100}%`;
  
  return (
    <div className="glass-panel p-6 rounded-xl shadow-lg border border-[#182135]">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          TRỤC MILESTONE KIỂM SOÁT TIẾN ĐỘ
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6b7d9b]" />}
        </h3>
        <div className="flex gap-4 text-[10px] font-semibold text-[#6b7d9b] uppercase tracking-wider">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10b981]"></div> Hoàn thành</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div> Đang thực hiện</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#4d5e7a]"></div> Chưa bắt đầu</div>
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#ef4444]"></div> Delay</div>
        </div>
      </div>

      <div className="relative pt-4 pb-12 overflow-x-auto custom-scrollbar">
        <div className="min-w-[800px] relative px-10">
          
          {/* Background Line */}
          <div className="absolute top-[20px] left-10 right-10 h-1 bg-[#182135] rounded-full"></div>
          
          {/* Progress Line */}
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: percentWidth }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute top-[20px] left-10 h-1 bg-gradient-to-r from-[#10b981] to-[#3b82f6] rounded-full"
          ></motion.div>

          <div className="flex justify-between relative">
            {milestones.map((ms, index) => {
              let Icon = Circle;
              let colorClass = "text-[#4d5e7a] bg-[#0b0f19] border-[#182135]";

              if (ms.status === 'completed') {
                Icon = CheckCircle2;
                colorClass = "text-[#10b981] bg-[#0b0f19] border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.2)]";
              } else if (ms.status === 'in-progress') {
                Icon = Clock;
                colorClass = "text-[#3b82f6] bg-[#0b0f19] border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse";
              } else if (ms.status === 'delay') {
                Icon = AlertCircle;
                colorClass = "text-[#ef4444] bg-[#0b0f19] border-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.3)]";
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
                      ms.status === 'pending' ? "text-[#6b7d9b]" : "text-slate-200"
                    }`}>
                      {ms.title}
                    </p>
                    <p className={`text-xs font-semibold ${
                      ms.status === 'pending' ? "text-[#4d5e7a]" : 
                      ms.status === 'delay' ? "text-[#ef4444]" : 
                      ms.status === 'in-progress' ? "text-[#3b82f6]" : "text-[#10b981]"
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
