import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, ReferenceDot, Label } from 'recharts';
import { Maximize2, Loader2, Minimize2, Flag, FileText, PenTool, Package, Wrench, Zap, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

const getIconForTitle = (title) => {
  const t = title.toLowerCase();
  if (t.includes('kickoff')) return Flag;
  if (t.includes('pháp lý')) return FileText;
  if (t.includes('thiết kế')) return PenTool;
  if (t.includes('vật tư')) return Package;
  if (t.includes('thi công')) return Wrench;
  if (t.includes('cod')) return Zap;
  return CheckCircle2;
};

// Removed mock data

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const actual = data.actual;
    const plan = data.plan;
    const diff = actual !== null ? actual - plan : null;
    
    return (
      <div className="bg-[var(--bg-panel)] border border-[#263554] p-3 rounded-lg shadow-xl shadow-black/50 min-w-[140px]">
        <p className="text-white text-xs font-bold mb-2 pb-2 border-b border-[#263554]">
          {data.originalDate || label}
        </p>
        <div className="space-y-1.5">
          {actual !== null && (
            <div className="flex justify-between items-center gap-4 text-xs">
              <span className="text-[#10b981] font-medium">Thực tế:</span>
              <span className="text-white font-bold">{actual}%</span>
            </div>
          )}
          <div className="flex justify-between items-center gap-4 text-xs">
            <span className="text-[#64748b] font-medium">Kế hoạch:</span>
            <span className="text-white font-bold">{plan}%</span>
          </div>
          {diff !== null && diff !== 0 && (
            <div className={`mt-2 pt-2 border-t border-[#263554] flex justify-between items-center gap-4 text-xs ${diff < 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
              <span className="font-medium">Chênh lệch:</span>
              <span className="font-bold">{diff > 0 ? '+' : ''}{diff}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function SCurveChart({ project, milestonesData = [], onPlanCalculated }) {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastPlanCalculated = React.useRef(null);

  const toPercentageVal = (v) => {
    if (v === undefined || v === null || v === '') return null;
    const num = Number(v);
    if (isNaN(num)) return null;
    // If the float is <= 1.0, multiply by 100.
    return num <= 1.0 && num > 0 ? num * 100 : num;
  };

  useEffect(() => {
    const fetchSCurve = async () => {
      try {
        setIsLoading(true);
        const data = await api.getSCurves(project?.PROJECT_ID || project?.id);
        if (data && data.length > 0) {
          const normalizeMDate = (dStr) => {
             if (!dStr || dStr === '-') return null;
             if (typeof dStr === 'string' && dStr.includes('T') && dStr.includes('-')) {
               try {
                 const dObj = new Date(dStr);
                 if (!isNaN(dObj)) return `${String(dObj.getDate()).padStart(2, '0')}/${String(dObj.getMonth() + 1).padStart(2, '0')}`;
               } catch(e) {}
             }
             const p = String(dStr).split('/');
             if (p.length >= 2) return `${String(p[0]).padStart(2, '0')}/${String(p[1]).padStart(2, '0')}`;
             return null;
          };
          const normalizedMilestones = milestonesData.map(m => ({
             ...m,
             normalizedDate: normalizeMDate(m.NGÀY_KẾ_HOẠCH)
          }));

          // INJECT LOCALSTORAGE MILESTONES (To perfectly match MilestoneTimeline)
          const parseLocalD = (dStr) => {
             if (!dStr) return null;
             const p = String(dStr).split('/');
             if (p.length === 3) return new Date(p[2], parseInt(p[1])-1, parseInt(p[0]));
             return new Date(dStr);
          };

          const getLocalMDate = (moduleKey) => {
             try {
                const id = project?.PROJECT_ID || project?.id;
                const d = localStorage.getItem(`dates_${moduleKey}_${id}`);
                if (d) {
                   const parsed = JSON.parse(d);
                   let dObj = null;
                   if (parsed.start) {
                      // Attempt to fix DD/MM/YYYY
                      if (parsed.start.includes('/')) {
                         dObj = parseLocalD(parsed.start);
                      } else {
                         // Attempt to fix YYYY-MM-DD mapped backwards by MilestoneTimeline
                         dObj = parseLocalD(parsed.start.split('-').reverse().join('/'));
                      }
                   }
                   if (dObj && !isNaN(dObj.getTime())) {
                      if (parsed.days) {
                         dObj.setDate(dObj.getDate() + parseInt(parsed.days));
                      }
                      return dObj;
                   }
                }
             } catch(e) {}
             return null;
          };

          const localMilestones = [
             { key: 'permit', name: 'PHÁP LÝ' },
             { key: 'design', name: 'THIẾT KẾ' },
             { key: 'procurement', name: 'VẬT TƯ' },
             { key: 'construction', name: 'THI CÔNG' },
             { key: 'handover', name: 'BÀN GIAO HỒ SƠ' }
          ];

          localMilestones.forEach(lm => {
             const existingRow = (milestonesData || []).find(m => String(m.MILESTONE).toUpperCase().includes(lm.name));
             const hasValidDate = existingRow && existingRow.NGÀY_KẾ_HOẠCH && existingRow.NGÀY_KẾ_HOẠCH !== '-';
             console.log(`[SCurve Debug] ${lm.name}: exists=${!!existingRow}, validDate=${hasValidDate}, val=${existingRow?.NGÀY_KẾ_HOẠCH}`);
             
             if (!hasValidDate) {
                const dObj = getLocalMDate(lm.key);
                if (dObj && !isNaN(dObj.getTime())) {
                   const dayStr = String(dObj.getDate()).padStart(2, '0');
                   const monthStr = String(dObj.getMonth() + 1).padStart(2, '0');
                   normalizedMilestones.push({
                      MILESTONE: lm.name,
                      normalizedDate: `${dayStr}/${monthStr}`,
                      dObj: dObj // Saved for maxMilestoneDate extraction
                   });
                }
             }
          });

          const formatted = data.map((r, index) => {
            let originalName = r.NGÀY || '';
            let dObj = null;
            // Handle ISO date strings from Google Sheets
            if (typeof originalName === 'string' && originalName.includes('T') && originalName.includes('-')) {
              try {
                dObj = new Date(originalName);
                if (!isNaN(dObj)) {
                  originalName = `${String(dObj.getDate()).padStart(2, '0')}/${String(dObj.getMonth() + 1).padStart(2, '0')}/${dObj.getFullYear()}`;
                }
              } catch(e) {}
            } else if (typeof originalName === 'string' && originalName.includes('/')) {
              const parts = originalName.split('/');
              if (parts.length === 2) {
                 const currentY = new Date().getFullYear();
                 originalName = `${parts[0]}/${parts[1]}/${currentY}`;
                 dObj = new Date(currentY, parseInt(parts[1])-1, parseInt(parts[0]));
              } else if (parts.length === 3) {
                 dObj = new Date(parts[2], parseInt(parts[1])-1, parseInt(parts[0]));
              }
            }

            let dayStr = String(index + 1);
            let monthStrObj = '';
            if (dObj) {
               const d = String(dObj.getDate()).padStart(2, '0');
               const m = String(dObj.getMonth() + 1).padStart(2, '0');
               const y = dObj.getFullYear();
               dayStr = d;
               monthStrObj = `THÁNG ${m}/${y}`;
            }

            let milestoneColor = null;
            let milestoneTitle = null;
            if (dObj) {
               const dayM = String(dObj.getDate()).padStart(2, '0');
               const monthM = String(dObj.getMonth() + 1).padStart(2, '0');
               const dateStrMatch = `${dayM}/${monthM}`;
               const matchedMilestones = normalizedMilestones.filter(m => m.normalizedDate === dateStrMatch);
               
               if (matchedMilestones.length > 0) {
                  const titles = [];
                  let finalColor = '#ef4444';
                  matchedMilestones.forEach(matchedMilestone => {
                    const t = String(matchedMilestone.MILESTONE).toUpperCase();
                    if (t.includes('KICKOFF')) { finalColor = '#10b981'; titles.push('Kickoff'); }
                    else if (t.includes('PHÁP LÝ')) { finalColor = '#10b981'; titles.push('Pháp lý'); }
                    else if (t.includes('THIẾT KẾ')) { finalColor = '#3b82f6'; titles.push('Thiết kế'); }
                    else if (t.includes('VẬT TƯ')) { finalColor = '#3b82f6'; titles.push('Vật tư'); }
                    else if (t.includes('COD') || t.includes('ĐÓNG ĐIỆN')) { finalColor = '#a855f7'; titles.push('COD'); }
                    else if (t.includes('BÀN GIAO')) { finalColor = '#a855f7'; titles.push('Handover'); }
                    else { finalColor = '#ef4444'; titles.push('Thi công'); }
                  });
                  milestoneColor = finalColor;
                  milestoneTitle = [...new Set(titles)].join(' & ');
               }
            }

            let planVal = toPercentageVal(r['KẾ_HOẠCH_%']);
            let actualVal = toPercentageVal(r['THỰC_TẾ_%']);
            let delayRange = null;
            if (actualVal !== null && planVal !== null && actualVal < planVal) {
               delayRange = [Math.round(actualVal), Math.round(planVal)];
            }

            return {
              name: dayStr,
              monthStr: monthStrObj,
              originalDate: originalName,
              plan: planVal !== null ? Math.round(planVal) : null,
              actual: actualVal !== null ? Math.round(actualVal) : null,
              delayRange: delayRange,
              milestoneColor: milestoneColor,
              milestoneTitle: milestoneTitle
            };
          });

          // Ensure chart data extends to the furthest milestone (e.g. Handover)
          let lastDateObj = null;
          let lastPlanVal = null;
          if (formatted.length > 0) {
             const lastItem = formatted[formatted.length - 1];
             const p = String(lastItem.originalDate).split('/');
             if (p.length >= 3) {
                lastDateObj = new Date(p[2], parseInt(p[1])-1, parseInt(p[0]));
             }
             lastPlanVal = lastItem.plan;
          }

          let maxMilestoneDate = null;
          (milestonesData || []).forEach(m => {
            if (m.NGÀY_KẾ_HOẠCH) {
              let dObj = null;
              if (typeof m.NGÀY_KẾ_HOẠCH === 'string' && m.NGÀY_KẾ_HOẠCH.includes('T')) {
                dObj = new Date(m.NGÀY_KẾ_HOẠCH);
              } else {
                const p = String(m.NGÀY_KẾ_HOẠCH).split('/');
                if (p.length === 3) dObj = new Date(p[2], parseInt(p[1])-1, parseInt(p[0]));
                else if (p.length === 2) dObj = new Date(new Date().getFullYear(), parseInt(p[1])-1, parseInt(p[0]));
              }
              if (dObj && !isNaN(dObj.getTime())) {
                if (!maxMilestoneDate || dObj.getTime() > maxMilestoneDate.getTime()) {
                  maxMilestoneDate = dObj;
                }
              }
            }
          });

          // Also check injected localStorage milestones
          normalizedMilestones.forEach(m => {
             if (m.dObj && !isNaN(m.dObj.getTime())) {
                if (!maxMilestoneDate || m.dObj.getTime() > maxMilestoneDate.getTime()) {
                  maxMilestoneDate = m.dObj;
                }
             }
          });

          // Pad missing days
          if (lastDateObj && maxMilestoneDate && maxMilestoneDate.getTime() > lastDateObj.getTime()) {
             const ONE_DAY = 24 * 60 * 60 * 1000;
             const daysToAdd = Math.ceil((maxMilestoneDate.getTime() - lastDateObj.getTime()) / ONE_DAY);
             for (let i = 1; i <= daysToAdd; i++) {
                const currentDate = new Date(lastDateObj.getTime() + ONE_DAY * i);
                const dayStr = String(currentDate.getDate()).padStart(2, '0');
                const monthM = String(currentDate.getMonth() + 1).padStart(2, '0');
                const monthStrObj = `THÁNG ${monthM}/${currentDate.getFullYear()}`;
                const originalName = `${dayStr}/${monthM}/${currentDate.getFullYear()}`;
                
                let milestoneColor = null;
                let milestoneTitle = null;
                const dateStrMatch = `${dayStr}/${monthM}`;
                const matchedMilestones = normalizedMilestones.filter(m => m.normalizedDate === dateStrMatch);
                
                if (matchedMilestones.length > 0) {
                   const titles = [];
                   let finalColor = '#ef4444';
                   matchedMilestones.forEach(matchedMilestone => {
                     const t = String(matchedMilestone.MILESTONE).toUpperCase();
                     if (t.includes('KICKOFF')) { finalColor = '#10b981'; titles.push('Kickoff'); }
                     else if (t.includes('PHÁP LÝ')) { finalColor = '#10b981'; titles.push('Pháp lý'); }
                     else if (t.includes('THIẾT KẾ')) { finalColor = '#3b82f6'; titles.push('Thiết kế'); }
                     else if (t.includes('VẬT TƯ')) { finalColor = '#3b82f6'; titles.push('Vật tư'); }
                     else if (t.includes('COD') || t.includes('ĐÓNG ĐIỆN')) { finalColor = '#a855f7'; titles.push('COD'); }
                     else if (t.includes('BÀN GIAO')) { finalColor = '#a855f7'; titles.push('Handover'); }
                     else { finalColor = '#ef4444'; titles.push('Thi công'); }
                   });
                   milestoneColor = finalColor;
                   milestoneTitle = [...new Set(titles)].join(' & ');
                }

                formatted.push({
                  name: dayStr,
                  monthStr: monthStrObj,
                  originalDate: originalName,
                  plan: lastPlanVal,
                  actual: null,
                  delayRange: null,
                  milestoneColor: milestoneColor,
                  milestoneTitle: milestoneTitle
                });
             }
          }

          setChartData(formatted);
        } else {
          // AUTO-GENERATE S-CURVE IF NO DATA
          generateAutoSCurve();
        }
      } catch (error) {
        console.error("Fetch S-Curve error:", error);
        generateAutoSCurve();
      } finally {
        setIsLoading(false);
      }
    };

    const generateAutoSCurve = () => {
      if (!project) return;
      
      const parseD = (dStr) => {
        if (!dStr || dStr === '-') return null;
        const p = String(dStr).split('/');
        if (p.length === 3) return new Date(p[2], p[1]-1, p[0]);
        return new Date(dStr);
      };

      const kickoffSheetData = milestonesData?.find(m => String(m.MILESTONE).toUpperCase() === 'KICKOFF');
      const codSheetData = milestonesData?.find(m => String(m.MILESTONE).toUpperCase() === 'COD' || String(m.MILESTONE).toUpperCase() === 'BÀN GIAO & ĐÓNG ĐIỆN (COD)');

      const kDateStr = kickoffSheetData?.NGÀY_KẾ_HOẠCH || project?.kickoffDate || project?.startDate;
      const cDateStr = codSheetData?.NGÀY_KẾ_HOẠCH || project?.cod || project?.codDate;

      const kickoff = parseD(kDateStr) || new Date(new Date().setMonth(new Date().getMonth() - 1));
      const cod = parseD(cDateStr) || new Date(new Date().setMonth(new Date().getMonth() + 1));
      
      // Ensure global span covers all milestones
      const allDates = [];
      if (kickoff && !isNaN(kickoff.getTime())) allDates.push(kickoff.getTime());
      if (cod && !isNaN(cod.getTime())) allDates.push(cod.getTime());
      
      (milestonesData || []).forEach(m => {
        if (m.NGÀY_KẾ_HOẠCH) {
          let dObj = null;
          if (typeof m.NGÀY_KẾ_HOẠCH === 'string' && m.NGÀY_KẾ_HOẠCH.includes('T')) {
            dObj = new Date(m.NGÀY_KẾ_HOẠCH);
          } else {
            const p = String(m.NGÀY_KẾ_HOẠCH).split('/');
            if (p.length === 3) dObj = new Date(p[2], parseInt(p[1])-1, parseInt(p[0]));
            else if (p.length === 2) dObj = new Date(new Date().getFullYear(), parseInt(p[1])-1, parseInt(p[0]));
          }
          if (dObj && !isNaN(dObj.getTime())) allDates.push(dObj.getTime());
        }
      });
      
      const normalizeMDate = (dStr) => {
         if (!dStr || dStr === '-') return null;
         if (typeof dStr === 'string' && dStr.includes('T') && dStr.includes('-')) {
           try {
             const dObj = new Date(dStr);
             if (!isNaN(dObj)) return `${String(dObj.getDate()).padStart(2, '0')}/${String(dObj.getMonth() + 1).padStart(2, '0')}`;
           } catch(e) {}
         }
         const p = String(dStr).split('/');
         if (p.length >= 2) return `${String(p[0]).padStart(2, '0')}/${String(p[1]).padStart(2, '0')}`;
         return null;
      };
      
      const normalizedMilestones = (milestonesData || []).map(m => ({
         ...m,
         normalizedDate: normalizeMDate(m.NGÀY_KẾ_HOẠCH)
      }));

      // INJECT LOCALSTORAGE MILESTONES (To perfectly match MilestoneTimeline)
      const parseLocalD = (dStr) => {
         if (!dStr) return null;
         const p = String(dStr).split('/');
         if (p.length === 3) return new Date(p[2], parseInt(p[1])-1, parseInt(p[0]));
         return new Date(dStr);
      };

      const getLocalMDate = (moduleKey) => {
         try {
            const id = project?.PROJECT_ID || project?.id;
            const d = localStorage.getItem(`dates_${moduleKey}_${id}`);
            if (d) {
               const parsed = JSON.parse(d);
               let dObj = null;
               if (parsed.start) {
                  if (parsed.start.includes('/')) {
                     dObj = parseLocalD(parsed.start);
                  } else {
                     dObj = parseLocalD(parsed.start.split('-').reverse().join('/'));
                  }
               }
               if (dObj && !isNaN(dObj.getTime())) {
                  if (parsed.days) {
                     dObj.setDate(dObj.getDate() + parseInt(parsed.days));
                  }
                  return dObj;
               }
            }
         } catch(e) {}
         return null;
      };

      const localMilestones = [
         { key: 'permit', name: 'PHÁP LÝ' },
         { key: 'design', name: 'THIẾT KẾ' },
         { key: 'procurement', name: 'VẬT TƯ' },
         { key: 'construction', name: 'THI CÔNG' },
         { key: 'handover', name: 'BÀN GIAO HỒ SƠ' }
      ];

      localMilestones.forEach(lm => {
         const existingRow = (milestonesData || []).find(m => String(m.MILESTONE).toUpperCase().includes(lm.name));
         const hasValidDate = existingRow && existingRow.NGÀY_KẾ_HOẠCH && existingRow.NGÀY_KẾ_HOẠCH !== '-';
         
         if (!hasValidDate) {
            const dObj = getLocalMDate(lm.key);
            if (dObj && !isNaN(dObj.getTime())) {
               const dayStr = String(dObj.getDate()).padStart(2, '0');
               const monthStr = String(dObj.getMonth() + 1).padStart(2, '0');
               normalizedMilestones.push({
                  MILESTONE: lm.name,
                  normalizedDate: `${dayStr}/${monthStr}`,
                  dObj: dObj
               });
               allDates.push(dObj.getTime()); // Add to allDates so globalEnd extends to 07/06!
            }
         }
      });
      
      let globalStart = allDates.length > 0 ? new Date(Math.min(...allDates)) : kickoff;
      let globalEnd = allDates.length > 0 ? new Date(Math.max(...allDates)) : cod;
      
      const today = new Date();
      today.setHours(0,0,0,0);

      // Determine today's plan percentage
      let todayPlanPercent = 0;
      if (today >= globalEnd) {
        todayPlanPercent = 100;
      } else if (today > globalStart) {
        const totalDuration = globalEnd.getTime() - globalStart.getTime();
        if (totalDuration > 0) {
           const elapsed = today.getTime() - globalStart.getTime();
           const t = elapsed / totalDuration;
           todayPlanPercent = ((Math.sin((t - 0.5) * Math.PI) + 1) / 2) * 100;
        } else {
           todayPlanPercent = 100;
        }
      }

      if (todayPlanPercent > 100) todayPlanPercent = 100;
      if (isNaN(todayPlanPercent)) todayPlanPercent = 0;
      
      if (typeof onPlanCalculated === 'function') {
        const roundedPlan = Math.round(todayPlanPercent);
        if (lastPlanCalculated.current !== roundedPlan) {
           lastPlanCalculated.current = roundedPlan;
           // Push state update to next tick to avoid synchronous dispatch warnings
           setTimeout(() => onPlanCalculated(roundedPlan), 0);
        }
      }

      const totalTime = globalEnd.getTime() - globalStart.getTime();
      if (totalTime <= 0) return;

      const ONE_DAY = 24 * 60 * 60 * 1000;
      const numDays = Math.ceil(totalTime / ONE_DAY);
      const generated = [];

      for (let i = 0; i <= numDays; i++) {
        const currentDate = new Date(globalStart.getTime() + ONE_DAY * i);
        
        // Mathematical Sine Wave S-Curve
        const t = i / numDays;
        let planPercent = ((Math.sin((t - 0.5) * Math.PI) + 1) / 2) * 100;

        if (i === 0) planPercent = 0;
        if (i === numDays) planPercent = 100;

        let actualPercent = null;
        if (currentDate <= today) {
          const timeElapsedSinceKickoff = today.getTime() - globalStart.getTime();
          if (timeElapsedSinceKickoff > 0) {
            const currentPointElapsed = currentDate.getTime() - globalStart.getTime();
            const progressRatio = Math.min(1, currentPointElapsed / timeElapsedSinceKickoff);
            actualPercent = progressRatio * (project.actualProgress || 0);
          } else {
            actualPercent = 0;
          }
        }

        const day = String(currentDate.getDate()).padStart(2, '0');
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const year = currentDate.getFullYear();
        
        let actualVal = actualPercent !== null ? Math.round(actualPercent) : null;
        let planVal = Math.round(planPercent);
        let delayRange = null;
        if (actualVal !== null && actualVal < planVal) {
           delayRange = [actualVal, planVal];
        }

        const dateStrMatch = `${day}/${month}`;
        const matchedMilestones = normalizedMilestones.filter(m => m.normalizedDate === dateStrMatch);
        let milestoneColor = null;
        let milestoneTitle = null;
        
        if (matchedMilestones.length > 0) {
           const titles = [];
           let finalColor = '#ef4444';
           matchedMilestones.forEach(matchedMilestone => {
             const t = String(matchedMilestone.MILESTONE).toUpperCase();
             if (t.includes('KICKOFF')) { finalColor = '#10b981'; titles.push('Kickoff'); }
             else if (t.includes('PHÁP LÝ')) { finalColor = '#10b981'; titles.push('Pháp lý'); }
             else if (t.includes('THIẾT KẾ')) { finalColor = '#3b82f6'; titles.push('Thiết kế'); }
             else if (t.includes('VẬT TƯ')) { finalColor = '#3b82f6'; titles.push('Vật tư'); }
             else if (t.includes('COD') || t.includes('ĐÓNG ĐIỆN')) { finalColor = '#a855f7'; titles.push('COD'); }
             else if (t.includes('BÀN GIAO')) { finalColor = '#a855f7'; titles.push('Handover'); }
             else { finalColor = '#ef4444'; titles.push('Thi công'); }
           });
           milestoneColor = finalColor;
           milestoneTitle = [...new Set(titles)].join(' & ');
        }
        
        generated.push({
          name: day, // Keeping name as day for easy reference
          monthStr: `THÁNG ${month}/${year}`,
          originalDate: `${day}/${month}/${year}`, // This is strictly unique
          plan: planVal,
          actual: actualVal,
          delayRange: delayRange,
          milestoneColor: milestoneColor,
          milestoneTitle: milestoneTitle
        });
      }
      
      setChartData(generated);
    };

    if (project?.PROJECT_ID || project?.id) fetchSCurve();
  }, [project, milestonesData]);

  useEffect(() => {
    if (!chartData || chartData.length === 0) return;
    
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const todayStr = `${day}/${month}/${year}`;
    
    let todayPoint = chartData.find(p => p.originalDate === todayStr);
    
    // If today is not explicitly plotted (e.g. gaps in data), find the closest past date
    if (!todayPoint) {
       const todayTime = today.getTime();
       const pastPoints = chartData.filter(p => {
           const parts = p.originalDate ? p.originalDate.split('/') : [];
           if (parts.length === 3) {
               const d = new Date(parts[2], parseInt(parts[1]) - 1, parts[0]);
               return d.getTime() <= todayTime;
           }
           return false;
       });
       if (pastPoints.length > 0) {
           todayPoint = pastPoints[pastPoints.length - 1];
       }
    }
    
    if (todayPoint && typeof todayPoint.plan === 'number' && onPlanCalculated) {
       if (lastPlanCalculated.current !== todayPoint.plan) {
          lastPlanCalculated.current = todayPoint.plan;
          onPlanCalculated(todayPoint.plan);
       }
    }
  }, [chartData, onPlanCalculated]);

  // Find latest actual point for reference dot
  const latestActualPoint = [...chartData].reverse().find(p => p.actual !== null && p.actual !== undefined);

  const renderChartContent = (isModal = false) => (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          ĐƯỜNG ĐỒ THỊ TIẾN ĐỘ (S-CURVE)
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)]" />}
        </h3>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <div className="w-4 h-0 border-t-2 border-dashed border-[#64748b]"></div>
              Kế hoạch (%)
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <div className="w-4 h-1 bg-[#10b981] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              Thực tế (%)
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <div className="w-4 h-1 bg-[#ef4444] rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)] opacity-80"></div>
              Chênh lệch (%)
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full relative min-h-0">
        {!chartData || chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-[var(--text-muted)] p-8">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <p className="font-semibold mb-1">Đang thiết lập biểu đồ...</p>
              <p className="text-xs opacity-70">Vui lòng cập nhật Ngày Kickoff và COD để biểu đồ tự động nội suy.</p>
            </div>
          </div>
        ) : (
        <div style={{ width: '100%', height: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 60, right: 30, left: -10, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorDelay" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
            <XAxis 
              dataKey="originalDate" 
              stroke="#4d5e7a" 
              tickMargin={10}
              axisLine={false}
              tickLine={false}
              interval={0}
              height={60}
              tick={(props) => {
                const { x, y, payload, index } = props;
                if (!payload || !payload.value) return null;
                const dataPoint = chartData[index];
                
                const dayString = payload.value.split('/')[0];
                
                const hasMilestone = dataPoint && dataPoint.milestoneColor;
                const showText = hasMilestone || (index % 3 === 0);
                
                return (
                  <g>
                    {showText && (
                      <text 
                        x={x} 
                        y={y + 15} 
                        fill={hasMilestone ? dataPoint.milestoneColor : "var(--text-muted)"} 
                        fontSize={9} 
                        fontWeight={hasMilestone ? 700 : 500} 
                        textAnchor="middle"
                      >
                        {dayString}
                      </text>
                    )}
                    {dataPoint && dayString === '15' && (
                      <text 
                        x={x} 
                        y={y + 35} 
                        fill="#64748b" 
                        fontSize={10} 
                        fontWeight={700} 
                        textAnchor="middle"
                        className="uppercase tracking-widest"
                      >
                        {dataPoint.monthStr}
                      </text>
                    )}
                  </g>
                );
              }}
            />
            <YAxis 
              stroke="#4d5e7a" 
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
              tickFormatter={(val) => val <= 100 ? `${val}%` : ''}
              axisLine={false}
              tickLine={false}
              domain={[0, 140]}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Area 
              type="monotone" 
              dataKey="delayRange" 
              name="Chênh lệch"
              stroke="none" 
              fillOpacity={1} 
              fill="url(#colorDelay)" 
              isAnimationActive={true}
              animationDuration={1500}
            />
            
            <Line 
              type="monotone" 
              dataKey="plan" 
              name="Kế hoạch" 
              stroke="#64748b" 
              strokeWidth={2}
              strokeDasharray="6 4" 
              dot={false}
              isAnimationActive={true}
              animationDuration={1500}
              activeDot={{ r: 4, fill: '#64748b', stroke: 'var(--bg-panel)', strokeWidth: 2 }}
            />
            
            <Area 
              type="monotone" 
              dataKey="actual" 
              name="Thực tế"
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorActual)" 
              dot={{ r: 3, fill: '#10b981', stroke: 'none' }}
              isAnimationActive={true}
              animationDuration={1500}
              activeDot={{ r: 6, fill: '#10b981', stroke: 'var(--bg-panel)', strokeWidth: 2, className: 'animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]' }}
            />
            
            {chartData.map((d, index) => {
                if (d.milestoneTitle) {
                  return (
                    <ReferenceDot 
                      key={index}
                      x={d.originalDate} 
                      y={d.plan} 
                      r={4} 
                      fill={d.milestoneColor} 
                      stroke="var(--bg-panel)" 
                      strokeWidth={2}
                      className="z-50"
                    >
                      <Label 
                        content={(props) => {
                           const { viewBox } = props;
                           const isRightEdge = index > chartData.length - 12;
                           const isLeftEdge = index < 12;
                           
                           // Determine if dot is in upper or lower half of the drawing area (max ~360)
                           const isUpper = viewBox.y < 200;
                           
                           // Deterministically calculate mIndex to avoid React closure bugs with Recharts
                           const currentMIndex = chartData.slice(0, index + 1).filter(item => item.milestoneTitle).length - 1;
                           
                           // 4 Absolute Y-Lanes to mathematically guarantee zero vertical overlap
                           const slot = currentMIndex % 4;
                           let fy;
                           if (isUpper) {
                               // Upper safe zone (sky)
                               fy = 15 + (slot * 30); // 15, 45, 75, 105
                           } else {
                               // Lower safe zone (above X-axis)
                               fy = 210 + (slot * 30); // 210, 240, 270, 300
                           }
                           
                           // Dynamic width based on text length
                           const fw = d.milestoneTitle.length * 6.5 + 40;
                           const fh = 26;
                           
                           let fx = viewBox.x - (fw / 2); // Center horizontally by default
                           
                           // Edge protection
                           if (isLeftEdge) {
                             fx = viewBox.x - 5; // Shift right so left edge is inside SVG
                           } else if (isRightEdge) {
                             fx = viewBox.x - fw + 5; // Shift left so right edge is inside SVG
                           }
                           
                           // Perfectly vertical line
                           const lineX = viewBox.x;
                           const lineY2 = viewBox.y < fy ? fy : fy + fh; // Connect to top or bottom of badge
                           
                           const IconComponent = getIconForTitle(d.milestoneTitle);
                           
                           return (
                             <g className="animate-in fade-in zoom-in duration-500 delay-1000 fill-mode-both">
                               <line 
                                 x1={lineX} 
                                 y1={viewBox.y} 
                                 x2={lineX} 
                                 y2={lineY2} 
                                 stroke={d.milestoneColor} 
                                 strokeWidth={1} 
                                 strokeDasharray="3 3" 
                                 opacity={0.6} 
                               />
                               <foreignObject x={fx} y={fy} width={fw} height={fh} className="overflow-visible">
                                 <div 
                                   className="flex items-center justify-center gap-1.5 px-2 py-1 rounded-md border backdrop-blur-md shadow-lg"
                                   style={{ 
                                     borderColor: d.milestoneColor, 
                                     color: d.milestoneColor, 
                                     backgroundColor: 'rgba(15, 23, 42, 0.85)' 
                                   }}
                                 >
                                   <IconComponent className="w-3.5 h-3.5" />
                                   <span className="text-[10px] font-bold whitespace-nowrap">{d.milestoneTitle}</span>
                                 </div>
                               </foreignObject>
                             </g>
                           );
                        }}
                      />
                    </ReferenceDot>
                  );
                }
                return null;
              })}
            
            {/* Current status point */}
            {latestActualPoint && (
              <ReferenceDot 
                x={latestActualPoint.name} 
                y={latestActualPoint.actual} 
                r={5} 
                fill="#10b981" 
                stroke="var(--bg-panel)" 
                strokeWidth={2} 
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
        </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <div className="glass-panel p-6 rounded-xl shadow-lg border border-[var(--border-main)] h-[500px] flex flex-col print:break-inside-avoid relative">
        {renderChartContent(false)}
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
          <div 
            className="absolute inset-0" 
            onClick={() => setIsFullscreen(false)} 
          />
          <div className="glass-panel w-full max-w-[95vw] h-[85vh] p-6 sm:p-8 rounded-2xl shadow-2xl border border-[var(--border-main)] flex flex-col relative bg-[#0b1120] z-10 animate-in fade-in zoom-in-95 duration-200">
            {renderChartContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
