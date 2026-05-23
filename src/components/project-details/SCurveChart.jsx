import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, ReferenceDot } from 'recharts';
import { Maximize2, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

// Removed mock data

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-panel)] border border-[#263554] p-3 rounded-lg shadow-xl shadow-black/50">
        <p className="text-[var(--text-muted)] text-xs font-bold mb-2 uppercase">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-300 font-medium">{entry.name}:</span>
              <span className="text-white font-bold">{entry.value}%</span>
            </div>
          ))}
          {payload.length === 2 && payload[1].value !== null && (
            <div className="mt-2 pt-2 border-t border-[var(--border-main)] flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Độ lệch:</span>
              <span className={`font-bold ${
                payload[1].value - payload[0].value < 0 ? "text-[#ef4444]" : "text-[#10b981]"
              }`}>
                {Math.round(payload[1].value - payload[0].value)}%
              </span>
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
          const formatted = data.map(r => {
            let name = r.NGÀY || '';
            if (name.includes('/')) {
              const parts = name.split('/');
              if (parts.length >= 2) name = `${parts[0]}/${parts[1]}`;
            }
            return {
              name,
              plan: toPercentageVal(r['KẾ_HOẠCH_%']),
              actual: toPercentageVal(r['THỰC_TẾ_%'])
            };
          });
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
      
      const getModuleDates = (moduleKey) => {
        let startDate = null;
        let endDate = null;
        try {
          const id = project?.PROJECT_ID || project?.id;
          const data = localStorage.getItem(`dates_${moduleKey}_${id}`);
          if (data) {
            const parsed = JSON.parse(data);
            if (parsed.start) {
              // YYYY-MM-DD
              const p = parsed.start.split('-');
              if (p.length === 3) startDate = new Date(p[0], p[1]-1, p[2]);
            }
            if (startDate && parsed.days) {
              endDate = new Date(startDate);
              endDate.setDate(endDate.getDate() + parseInt(parsed.days));
            }
          }
        } catch(e) {}
        return { startDate, endDate };
      };

      const modules = [
        { key: 'permit', weight: 0.10 },
        { key: 'design', weight: 0.15 },
        { key: 'procurement', weight: 0.25 },
        { key: 'construction', weight: 0.40 },
        { key: 'handover', weight: 0.10 }
      ].map(m => {
        const dates = getModuleDates(m.key);
        let s = dates.startDate || kickoff;
        let e = dates.endDate || cod;
        if (e <= s) {
          e = new Date(s);
          e.setDate(e.getDate() + 1);
        }
        return { ...m, startDate: s, endDate: e };
      });

      // Find absolute global start and end
      let globalStart = new Date(Math.min(...modules.map(m => m.startDate.getTime()), kickoff.getTime()));
      let globalEnd = new Date(Math.max(...modules.map(m => m.endDate.getTime()), cod.getTime()));
      
      const today = new Date();
      today.setHours(0,0,0,0);

      // Calculate EXACT plan progress for TODAY
      let todayPlanPercent = 0;
      modules.forEach(m => {
        if (today >= m.endDate) {
          todayPlanPercent += m.weight * 100;
        } else if (today > m.startDate) {
          const duration = m.endDate.getTime() - m.startDate.getTime();
          const elapsed = today.getTime() - m.startDate.getTime();
          todayPlanPercent += (elapsed / duration) * m.weight * 100;
        }
      });
      if (todayPlanPercent < 0) todayPlanPercent = 0;
      if (todayPlanPercent > 100) todayPlanPercent = 100;
      
      if (typeof onPlanCalculated === 'function') {
        onPlanCalculated(Math.round(todayPlanPercent));
      }

      const totalTime = globalEnd.getTime() - globalStart.getTime();
      if (totalTime <= 0) return;

      const numPoints = 12;
      const step = totalTime / numPoints;
      const generated = [];

      for (let i = 0; i <= numPoints; i++) {
        const currentDate = new Date(globalStart.getTime() + step * i);
        
        let planPercent = 0;
        modules.forEach(m => {
          if (currentDate >= m.endDate) {
            planPercent += m.weight * 100;
          } else if (currentDate > m.startDate) {
            const duration = m.endDate.getTime() - m.startDate.getTime();
            const elapsed = currentDate.getTime() - m.startDate.getTime();
            planPercent += (elapsed / duration) * m.weight * 100;
          }
        });

        if (i === 0) planPercent = 0;
        if (i === numPoints) planPercent = 100;

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
        
        generated.push({
          name: `${day}/${month}`,
          plan: Math.round(planPercent),
          actual: actualPercent !== null ? Math.round(actualPercent) : null
        });
      }
      
      setChartData(generated);
    };

    if (project?.PROJECT_ID || project?.id) fetchSCurve();
  }, [project, milestonesData]);

  // Find latest actual point for reference dot
  const latestActualPoint = [...chartData].reverse().find(p => p.actual !== null && p.actual !== undefined);

  return (
    <div className="glass-panel p-6 rounded-xl shadow-lg border border-[var(--border-main)] h-[360px] flex flex-col print:break-inside-avoid">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          ĐƯỜNG ĐỒ THỊ TIẾN ĐỘ (S-CURVE)
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)]" />}
        </h3>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
              <div className="w-4 h-0.5 bg-[#4d5e7a] border border-dashed border-[#4d5e7a]"></div>
              Kế hoạch (%)
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
              <div className="w-4 h-1 bg-[#10b981] rounded-full"></div>
              Thực tế (%)
            </div>
          </div>
          <button className="p-1.5 hover:bg-[var(--border-main)] rounded text-slate-400 hover:text-white transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px] flex items-center justify-center">
        {!chartData || chartData.length === 0 ? (
          <div className="text-center text-[var(--text-muted)] p-8">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            <p className="font-semibold mb-1">Đang thiết lập biểu đồ...</p>
            <p className="text-xs opacity-70">Vui lòng cập nhật Ngày Kickoff và COD để biểu đồ tự động nội suy.</p>
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#4d5e7a" 
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="#4d5e7a" 
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
              tickFormatter={(val) => `${val}%`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Line 
              type="monotone" 
              dataKey="plan" 
              name="Kế hoạch" 
              stroke="#4d5e7a" 
              strokeWidth={2}
              strokeDasharray="5 5" 
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 4, fill: '#4d5e7a', stroke: 'var(--bg-panel)', strokeWidth: 2 }}
            />
            
            <Area 
              type="monotone" 
              dataKey="actual" 
              name="Thực tế"
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorActual)" 
              isAnimationActive={false}
              activeDot={{ r: 6, fill: '#10b981', stroke: 'var(--bg-panel)', strokeWidth: 2, className: 'animate-pulse' }}
            />
            
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
        )}
      </div>
    </div>
  );
}
