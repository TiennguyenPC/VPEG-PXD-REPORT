import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, Circle, Loader2, Activity, Flag } from 'lucide-react';
import { api } from '../../services/api';

class MilestoneErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() { 
     if (this.state.hasError) return <div style={{color:'red', background:'black', padding:20, zIndex:9999, position:'relative'}}><h2>MilestoneTimeline Crash</h2><pre>{this.state.error?.stack || String(this.state.error)}</pre></div>; 
     return this.props.children; 
  }
}

function MilestoneTimelineInner({ project, moduleProgress = {}, milestonesData = [] }) {
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
        
        const milestoneRow = milestonesData.find(m => String(m.MILESTONE).toUpperCase() === String(title).toUpperCase() || String(m.MILESTONE).toUpperCase().includes(String(title).toUpperCase()));
        if (milestoneRow && milestoneRow.NGÀY_KẾ_HOẠCH) {
          date = milestoneRow.NGÀY_KẾ_HOẠCH;
          if (typeof date === 'string' && date.includes('T')) {
             endDate = new Date(date);
             if (!isNaN(endDate.getTime())) {
                date = `${String(endDate.getDate()).padStart(2, '0')}/${String(endDate.getMonth() + 1).padStart(2, '0')}/${endDate.getFullYear()}`;
             }
          } else {
             endDate = parseDateStr(date);
          }
        }

        try {
          const id = project?.PROJECT_ID || project?.id;
          const data = localStorage.getItem(`dates_${moduleKey}_${id}`);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed.start) startDate = parseDateStr(parsed.start.split('-').reverse().join('/'));
            if (date === '-') {
              date = calculateEndDate(parsed.start, parsed.days);
              endDate = parseDateStr(date);
            }
          }
        } catch(e) {}

        let status = 'pending';
        const progress = moduleProgress[moduleKey] || 0;
        let delayDays = 0;

        if (!endDate) {
          if (progress >= 100) status = 'completed';
          else if (progress > 0) status = 'in-progress';
        } else {
          if (today <= endDate) {
            if (startDate && today < startDate) status = 'pending';
            else status = 'in-progress';
          } else {
            if (progress >= 100) status = 'completed';
            else {
              status = 'delay';
              delayDays = Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
            }
          }
        }

        return { title, date, status, progress, delayDays };
      };

      const kickoffSheetData = milestonesData.find(m => String(m.MILESTONE).toUpperCase() === 'KICKOFF');
      let kickoffDate = kickoffSheetData?.NGÀY_KẾ_HOẠCH || project?.kickoffDate || project?.startDate || project?.NGÀY_BẮT_ĐẦU || '-';
      if (!kickoffDate || kickoffDate === '') kickoffDate = '-';
      let kickoffStatus = 'completed';
      const kD = parseDateStr(kickoffDate);
      if (kD && today < kD) kickoffStatus = 'pending';
      
      let codStatus = 'pending';
      let codDelay = 0;
      const codSheetData = milestonesData.find(m => String(m.MILESTONE).toUpperCase() === 'COD' || String(m.MILESTONE).toUpperCase() === 'BÀN GIAO & ĐÓNG ĐIỆN (COD)');
      let codDateStr = codSheetData?.NGÀY_KẾ_HOẠCH || project?.cod || project?.codDate || project?.COD || '29/06/2026';
      if (!codDateStr || codDateStr === '') codDateStr = '29/06/2026';
      if (typeof codDateStr === 'string' && codDateStr.includes('T')) {
         const tempD = new Date(codDateStr);
         if (!isNaN(tempD.getTime())) codDateStr = `${String(tempD.getDate()).padStart(2, '0')}/${String(tempD.getMonth() + 1).padStart(2, '0')}/${tempD.getFullYear()}`;
      }
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
            codDelay = Math.floor((today.getTime() - codD.getTime()) / (1000 * 60 * 60 * 24));
          }
        }
      }

      const generated = [
        { id: 1, title: 'KICKOFF', date: kickoffDate, status: kickoffStatus, progress: 100, delayDays: 0 },
        { id: 2, ...getModuleData('permit', 'PHÁP LÝ') },
        { id: 3, ...getModuleData('design', 'THIẾT KẾ') },
        { id: 4, ...getModuleData('procurement', 'VẬT TƯ') },
        { id: 5, ...getModuleData('construction', 'THI CÔNG') },
        { id: 6, title: 'COD', date: codDateStr, status: codStatus, progress: project?.status === 'completed' ? 100 : moduleProgress['handover'] >= 100 ? 100 : 0, delayDays: codDelay },
        { id: 7, ...getModuleData('handover', 'BÀN GIAO HỒ SƠ') }
      ];

      setMilestones(generated);
      setIsLoading(false);
    };

    if (project?.PROJECT_ID || project?.id) {
      generateMilestones();
    }
  }, [project, moduleProgress, milestonesData]);

  const today = new Date();
  today.setHours(0,0,0,0);
  
  const parseMDate = (dStr) => {
    if (!dStr || dStr === '-') return null;
    const s = String(dStr);
    const p = s.split('/');
    if (p.length === 3) {
       const d = new Date(p[2], p[1]-1, p[0]);
       return isNaN(d.getTime()) ? null : d;
    }
    if (s.includes('T') && s.includes('-')) {
       const d = new Date(s);
       return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  const lastActiveIndex = [...milestones].reverse().findIndex(m => m.status === 'completed' || m.status === 'in-progress' || m.status === 'delay');
  const activeIndex = lastActiveIndex !== -1 ? (milestones.length - 1 - lastActiveIndex) : 0;

  let calculatedPercentWidth = 0;
  if (milestones.length > 1) {
    const firstNodeDate = parseMDate(milestones[0].date);
    const lastNodeDate = parseMDate(milestones[milestones.length - 1].date);
    
    if (firstNodeDate && lastNodeDate && today >= firstNodeDate) {
      if (today >= lastNodeDate) {
         calculatedPercentWidth = 100;
      } else {
         const totalSpan = lastNodeDate.getTime() - firstNodeDate.getTime();
         const elapsed = today.getTime() - firstNodeDate.getTime();
         if (totalSpan > 0) {
            calculatedPercentWidth = (elapsed / totalSpan) * 100;
         } else {
            calculatedPercentWidth = 100;
         }
      }
    } else {
      calculatedPercentWidth = (activeIndex / (milestones.length - 1)) * 100;
    }
  }

  const visualMilestones = milestones.map((ms, index) => {
    const nodePercent = (index / (milestones.length - 1)) * 100;
    let newStatus = ms.status;
    let newDelayDays = ms.delayDays || 0;
    
    if (calculatedPercentWidth > nodePercent && ms.progress < 100) {
      newStatus = 'delay';
      if (newDelayDays <= 0) {
        const d = parseMDate(ms.date);
        if (d) {
          const diff = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
          newDelayDays = diff > 0 ? diff : 0; 
        }
      }
    }
    
    return { ...ms, status: newStatus, delayDays: newDelayDays };
  });

  const percentWidth = `${calculatedPercentWidth}%`;
  
  const codNode = milestones.find(m => m.title === 'COD');
  
  return (
    <div className="glass-panel p-6 rounded-xl shadow-lg border border-[var(--border-main)] print:break-inside-avoid overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          TRỤC MILESTONE KIỂM SOÁT TIẾN ĐỘ
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)]" />}
        </h3>
        <div className="flex gap-4 text-[10px] font-semibold text-slate-300 uppercase tracking-wider items-center">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> Hoàn thành</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> Đang thực hiện</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#64748b]"></div> Chưa bắt đầu</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div> Delay</div>
          
          <div className="ml-6 px-4 py-2 bg-[rgba(15,23,42,0.6)] border border-[#334155] rounded-lg text-right">
            <p className="text-[10px] text-slate-400">DỰ KIẾN COD</p>
            <p className="text-sm font-bold text-[#a855f7] tracking-wider">{codNode?.date || '29/06/2026'}</p>
          </div>
        </div>
      </div>

      <div className="relative pt-12 pb-16 overflow-x-auto custom-scrollbar">
        <div className="min-w-[900px] relative px-10">
          
          {/* Lines Container matching exact width of flex items */}
          <div className="absolute top-[20px] left-10 right-10 h-0.5 bg-[#334155] z-0">
            {/* Progress Line */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: percentWidth }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-[#10b981] to-[#3b82f6] z-0"
            ></motion.div>
            
            {/* HÔM NAY Marker */}
            <motion.div 
              initial={{ left: 0 }}
              animate={{ left: percentWidth }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute top-[-30px] bottom-[-40px] w-[1px] border-l border-dashed border-[#3b82f6] z-0 flex flex-col items-center justify-between"
            >
              <div className="bg-[#3b82f6] text-white text-[9px] font-bold px-1.5 py-0.5 rounded -mt-4 whitespace-nowrap shadow-lg">HÔM NAY</div>
              <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.8)] -mb-1.5"></div>
            </motion.div>
          </div>

          <div className="flex justify-between relative z-10">
            {visualMilestones.map((ms, index) => {
              let Icon = Circle;
              let colorClass = "text-[#64748b] bg-[#1e293b] border-[#334155]";
              let lineClasses = "border-2";
              let titleColor = ms.status === 'pending' && index > activeIndex ? "text-[#64748b]" : "text-slate-200";
              let dateColor = "text-[#64748b]";
              
              if (ms.status === 'completed') {
                Icon = CheckCircle2;
                colorClass = "text-[#10b981] bg-[#022c22] border-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.3)]";
                dateColor = "text-[#10b981]";
              } else if (ms.status === 'in-progress') {
                Icon = Activity;
                colorClass = "text-[#3b82f6] bg-[#172554] border-[#3b82f6] shadow-[0_0_20px_rgba(59,130,246,0.4)]";
                lineClasses = "border-2 ring-4 ring-[#3b82f6]/20";
                dateColor = "text-[#3b82f6]";
              } else if (ms.status === 'delay') {
                Icon = AlertCircle;
                colorClass = "text-[#ef4444] bg-[#450a0a] border-[#ef4444] shadow-[0_0_20px_rgba(239,68,68,0.4)]";
                dateColor = "text-[#ef4444]";
              } else if (ms.title === 'COD' || ms.title === 'BÀN GIAO HỒ SƠ') {
                if (ms.title === 'COD') Icon = Flag;
                if (ms.status === 'pending') {
                  colorClass = "text-[#a855f7] bg-[#3b0764] border-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.2)]";
                  dateColor = "text-[#a855f7]";
                }
              }

              return (
                <div key={ms.id} className="flex flex-col items-center relative z-10 w-24">
                  
                  {/* Floating Delay Badge */}
                  {ms.status === 'delay' && ms.delayDays > 0 && (
                    <motion.div 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="absolute -top-10 bg-[#ef4444] text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap shadow-lg z-20"
                    >
                      -{ms.delayDays} ngày
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-[#ef4444]"></div>
                    </motion.div>
                  )}

                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1, type: "spring" }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center relative mb-4 ${colorClass} ${lineClasses}`}
                  >
                    <Icon className="w-5 h-5" />
                    {ms.status === 'in-progress' && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3b82f6] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#3b82f6]"></span>
                      </span>
                    )}
                  </motion.div>
                  
                  <div className="text-center absolute top-14 w-full">
                    <p className={`text-[10px] font-bold tracking-wider uppercase mb-1 ${titleColor}`}>
                      {ms.title}
                    </p>
                    <p className={`text-xs font-semibold ${dateColor}`}>
                      {ms.date}
                    </p>
                    <div className="mt-2 flex justify-center">
                      <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border bg-[var(--bg-panel)] ${
                        ms.status === 'completed' ? 'border-[#10b981]/50 text-[#10b981]' : 
                        ms.status === 'in-progress' ? 'border-[#3b82f6]/50 text-[#3b82f6]' : 
                        ms.status === 'delay' ? 'border-[#ef4444]/50 text-[#ef4444]' : 
                        ms.title === 'COD' && ms.status === 'pending' ? 'border-[#a855f7]/50 text-[#a855f7]' :
                        'border-[#334155] text-[#64748b]'
                      }`}>
                        {Math.round(ms.progress)}%
                      </div>
                    </div>
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

export default function MilestoneTimeline(props) {
  return <MilestoneErrorBoundary><MilestoneTimelineInner {...props} /></MilestoneErrorBoundary>;
}
