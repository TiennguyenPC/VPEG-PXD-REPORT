import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, Circle, Loader2, Activity, Flag } from 'lucide-react';
import { formatPercent3 } from '../../utils/formatPercent';
import {
  parseFlexibleDate,
  formatDateDMY,
  calcTodayAxisPercent,
  resolveTimelineBounds,
} from '../../utils/timelineDates';
import { useI18n } from '../../context/I18nContext';
import { displayMilestoneTitle } from '../../i18n/messages';
import { useAuth } from '../../context/AuthContext';
import { canViewContractTracking, canEditContractTracking } from '../../utils/permissions';
import { getContractMilestoneDates, getModuleScheduleDate } from '../../utils/contractTracking';
import ContractTrackingPanel from './ContractTrackingPanel';

class MilestoneErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() { 
     if (this.state.hasError) return <div style={{color:'red', background:'black', padding:20, zIndex:9999, position:'relative'}}><h2>MilestoneTimeline Crash</h2><pre>{this.state.error?.stack || String(this.state.error)}</pre></div>; 
     return this.props.children; 
  }
}

function MilestoneTimelineInner({ project, moduleProgress = {}, milestonesData = [], onContractTrackingSave, moduleBundles }) {
  const { t, tf, ts } = useI18n();
  const { user } = useAuth();
  const projectId = project?.id || project?.PROJECT_ID;
  const canViewContract = canViewContractTracking(user, projectId, project);
  const canEditContract = canEditContractTracking(user, projectId, project);
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [datesVersion, setDatesVersion] = useState(0);

  useEffect(() => {
    const pid = project?.PROJECT_ID || project?.id;
    if (!pid) return undefined;
    const handler = (e) => {
      if (String(e.detail?.projectId) === String(pid)) {
        setDatesVersion((v) => v + 1);
      }
    };
    window.addEventListener('module-dates-updated', handler);
    return () => window.removeEventListener('module-dates-updated', handler);
  }, [project?.PROJECT_ID, project?.id]);

  useEffect(() => {
    const generateMilestones = () => {
      setIsLoading(true);
      const today = new Date();
      today.setHours(0,0,0,0);
      const projectId = project?.PROJECT_ID || project?.id;

      const parseDateStr = (dateStr) => parseFlexibleDate(dateStr);

      const calculateEndDate = (start, days) => {
        if (!start || !days) return '-';
        const d = parseFlexibleDate(start);
        if (!d) return '-';
        d.setDate(d.getDate() + parseInt(days, 10));
        return formatDateDMY(d);
      };

      const getModuleData = (moduleKey, title) => {
        let date = '-';
        let startDate = null;
        let endDate = null;

        const moduleEnd = getModuleScheduleDate(projectId, moduleKey, 'end');
        const moduleStart = getModuleScheduleDate(projectId, moduleKey, 'start');
        if (moduleStart) startDate = parseDateStr(moduleStart);
        if (moduleEnd) {
          date = moduleEnd;
          endDate = parseDateStr(moduleEnd);
        }

        const milestoneRow = milestonesData.find(m => String(m.MILESTONE).toUpperCase() === String(title).toUpperCase() || String(m.MILESTONE).toUpperCase().includes(String(title).toUpperCase()));
        if (date === '-' && milestoneRow?.NGÀY_KẾ_HOẠCH) {
          date = milestoneRow.NGÀY_KẾ_HOẠCH;
          endDate = parseDateStr(date);
          if (endDate) date = formatDateDMY(endDate);
        }

        if (date === '-') {
          try {
            const data = localStorage.getItem(`dates_${moduleKey}_${projectId}`);
            if (data) {
              const parsed = JSON.parse(data);
              if (parsed.start) startDate = parseDateStr(parsed.start);
              date = calculateEndDate(parsed.start, parsed.days);
              endDate = parseDateStr(date);
            }
          } catch (e) { /* ignore */ }
        }

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

      const contractDates = getContractMilestoneDates(project);

      const kickoffSheetData = milestonesData.find(m => String(m.MILESTONE).toUpperCase() === 'KICKOFF');
      let kickoffDate =
        contractDates.kickoff ||
        kickoffSheetData?.NGÀY_KẾ_HOẠCH ||
        project?.kickoffDate ||
        project?.KICKOFF_DATE ||
        '-';
      if (!kickoffDate || kickoffDate === '') kickoffDate = '-';
      const kD = parseDateStr(kickoffDate);
      if (kD) kickoffDate = formatDateDMY(kD);

      const codSheetData = milestonesData.find(m => String(m.MILESTONE).toUpperCase() === 'COD' || String(m.MILESTONE).toUpperCase() === 'BÀN GIAO & ĐÓNG ĐIỆN (COD)');
      let codDateStr =
        contractDates.cod ||
        codSheetData?.NGÀY_KẾ_HOẠCH ||
        project?.cod ||
        project?.codDate ||
        project?.COD ||
        '-';
      if (!codDateStr || codDateStr === '') codDateStr = '-';
      const codD = parseDateStr(codDateStr);
      if (codD) codDateStr = formatDateDMY(codD);
      const handoverData = getModuleData('handover', 'BÀN GIAO HỒ SƠ');
      let handoverDate = handoverData.date;
      if (handoverDate === '-' && contractDates.handover) {
        handoverDate = contractDates.handover;
      }

      let kickoffStatus = 'pending';
      let kickoffProgress = 0;
      const projectKickoffRaw = project?.kickoffDate || project?.KICKOFF_DATE;
      const projectKickoff = parseDateStr(projectKickoffRaw);
      if (!kD && projectKickoff) {
        kickoffDate = formatDateDMY(projectKickoff);
      }

      const effectiveKickoff = kD || projectKickoff;
      const anyModuleStarted = Object.values(moduleProgress).some((p) => Number(p) > 0);

      if (effectiveKickoff) {
        if (today < effectiveKickoff) {
          kickoffStatus = 'pending';
          kickoffProgress = 0;
        } else {
          kickoffStatus = 'completed';
          kickoffProgress = 100;
        }
      } else if (anyModuleStarted) {
        kickoffStatus = 'completed';
        kickoffProgress = 100;
        if (kickoffDate === '-') kickoffDate = formatDateDMY(today);
      }

      let codStatus = 'pending';
      let codDelay = 0;
      let codProgress = 0;
      if (!codD) {
        codStatus = project?.status === 'completed' ? 'completed' : 'pending';
        codProgress = project?.status === 'completed' ? 100 : 0;
      } else {
        if (today <= codD) {
          codStatus = 'pending';
          codProgress = 0;
        } else {
          if (project?.status === 'completed') {
            codStatus = 'completed';
            codProgress = 100;
          } else if (moduleProgress['handover'] >= 100) {
            codStatus = 'completed';
            codProgress = 100;
          } else {
            codStatus = 'delay';
            codDelay = Math.floor((today.getTime() - codD.getTime()) / (1000 * 60 * 60 * 24));
            codProgress = 0;
          }
        }
      }

      const generated = [
        { id: 1, title: 'KICKOFF', date: kickoffDate, status: kickoffStatus, progress: kickoffProgress, delayDays: 0 },
        { id: 2, ...getModuleData('permit', 'PHÁP LÝ') },
        { id: 3, ...getModuleData('design', 'THIẾT KẾ') },
        { id: 4, ...getModuleData('procurement', 'VẬT TƯ') },
        { id: 5, ...getModuleData('construction', 'THI CÔNG') },
        { id: 6, title: 'COD', date: codDateStr, status: codStatus, progress: codProgress, delayDays: codDelay },
        { id: 7, ...handoverData, date: handoverDate }
      ];

      setMilestones(generated);
      setIsLoading(false);
    };

    if (project?.PROJECT_ID || project?.id) {
      generateMilestones();
    }
  }, [project, moduleProgress, milestonesData, datesVersion]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastActiveIndex = [...milestones].reverse().findIndex(m => m.status === 'completed' || m.status === 'in-progress' || m.status === 'delay');
  const activeIndex = lastActiveIndex !== -1 ? (milestones.length - 1 - lastActiveIndex) : 0;

  const { startDate, endDate } = resolveTimelineBounds(project, milestones, milestonesData);
  const todayPercent = calcTodayAxisPercent(startDate, endDate);
  const percentWidth = todayPercent != null ? `${todayPercent}%` : '0%';
  const showTodayMarker = todayPercent != null;
  const visualMilestones = milestones.map((ms, index) => {
    let newStatus = ms.status;
    let newDelayDays = ms.delayDays || 0;
    
    const parsedDate = parseFlexibleDate(ms.date);
    
    // Nếu ngày hôm nay ĐÃ VƯỢT QUÁ ngày dự kiến của mốc này mà chưa xong -> DELAY
    if (parsedDate && today > parsedDate && ms.progress < 100) {
      newStatus = 'delay';
      if (newDelayDays <= 0) {
         const diff = Math.floor((today.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24));
         newDelayDays = diff > 0 ? diff : 0; 
      }
    }
    
    return { ...ms, status: newStatus, delayDays: newDelayDays };
  });

  const codNode = milestones.find(m => m.title === 'COD');
  
  return (
    <div className="glass-panel p-6 rounded-xl shadow-lg border border-[var(--border-main)] print:break-inside-avoid overflow-hidden">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-sm font-bold text-[var(--text-strong)] uppercase tracking-wider flex items-center gap-2">
          {t('milestoneUi.title')}
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)]" />}
        </h3>
        <div className="flex gap-4 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider items-center flex-wrap justify-end">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div> {t('milestoneUi.completed')}</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></div> {t('milestoneUi.inProgress')}</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#64748b]"></div> {t('milestoneUi.notStarted')}</div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></div> {t('milestoneUi.delay')}</div>

          <div className="ml-2 px-4 py-2 bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-lg text-right shadow-sm min-w-[120px]">
            <p className="text-[10px] text-[var(--text-muted)]">{t('milestoneUi.expectedCod')}</p>
            <p className="text-sm font-bold text-[#7c3aed] tracking-wider">{codNode?.date || '-'}</p>
          </div>
        </div>
      </div>

      {canViewContract && (
        <ContractTrackingPanel
          project={project}
          canEdit={canEditContract && !!onContractTrackingSave}
          onSave={onContractTrackingSave}
          moduleBundles={moduleBundles}
        />
      )}

      <div className="relative pt-12 pb-16 overflow-x-auto custom-scrollbar">
        <div className="min-w-[900px] relative px-10">
          
          <div className="absolute top-[20px] left-10 right-10 h-0.5 bg-[var(--border-main)] z-[1] pointer-events-none">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: percentWidth }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-[#10b981] to-[#3b82f6] z-[1]"
            ></motion.div>
            
            {showTodayMarker && (
            <motion.div 
              initial={{ left: 0 }}
              animate={{ left: percentWidth }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute top-[-50px] bottom-[-40px] w-[1px] border-l border-dashed border-[#3b82f6] z-[2] flex flex-col items-center pointer-events-none"
            >
              <div className="bg-[#3b82f6] text-white text-[9px] font-bold px-2 py-1 rounded whitespace-nowrap shadow-md relative z-30">
                {t('milestoneUi.today')}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-[#3b82f6]"></div>
              </div>
              <div className="w-2 h-2 rounded-full bg-[#3b82f6] absolute top-[50px] -translate-x-1/2 -translate-y-1/2 z-20"></div>
            </motion.div>
            )}
          </div>

          <div className="flex justify-between relative z-20">
            {visualMilestones.map((ms, index) => {
              let Icon = Circle;
              let colorClass = "text-[#64748b] bg-[var(--bg-panel)] border-[var(--border-main)]";
              let lineClasses = "border-2";
              let titleColor = ms.status === 'pending' && index > activeIndex ? "text-[var(--text-muted)]" : "text-[var(--text-main)]";
              let dateColor = "text-[var(--text-muted)]";
              
              if (ms.status === 'completed') {
                Icon = CheckCircle2;
                colorClass = "text-[#10b981] bg-[var(--bg-panel)] border-[#10b981] shadow-[0_0_16px_rgba(16,185,129,0.25)]";
                dateColor = "text-[#10b981]";
              } else if (ms.status === 'in-progress') {
                Icon = Activity;
                colorClass = "text-[#3b82f6] bg-[var(--bg-panel)] border-[#3b82f6] shadow-[0_0_16px_rgba(59,130,246,0.25)]";
                lineClasses = "border-2 ring-4 ring-[#3b82f6]/20";
                dateColor = "text-[#3b82f6]";
              } else if (ms.status === 'delay') {
                Icon = AlertCircle;
                colorClass = "text-[#ef4444] bg-[var(--bg-panel)] border-[#ef4444] shadow-[0_0_16px_rgba(239,68,68,0.25)]";
                dateColor = "text-[#ef4444]";
              } else if (ms.title === 'COD' || ms.title === 'BÀN GIAO HỒ SƠ') {
                if (ms.title === 'COD') Icon = Flag;
                if (ms.status === 'pending') {
                  colorClass = "text-[#a855f7] bg-[var(--bg-panel)] border-[#a855f7] shadow-[0_0_12px_rgba(168,85,247,0.2)]";
                  dateColor = "text-[#a855f7]";
                }
              }

              return (
                <div key={ms.id} className="flex flex-col items-center relative z-30 w-24">
                  
                  {/* Floating Delay Badge */}
                  {ms.status === 'delay' && ms.delayDays > 0 && (
                    <motion.div 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="absolute -top-10 bg-[#ef4444] text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap shadow-lg z-20"
                    >
                      {tf('milestoneUi.daysLate', { n: ms.delayDays })}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-[4px] border-r-[4px] border-t-[4px] border-transparent border-t-[#ef4444]"></div>
                    </motion.div>
                  )}

                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1, type: "spring" }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center relative z-30 mb-4 ${colorClass} ${lineClasses}`}
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
                      {displayMilestoneTitle(ms.title, t, ts)}
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
                        {formatPercent3(ms.progress)}
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
