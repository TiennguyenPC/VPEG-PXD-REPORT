import React, { useState, useEffect, useMemo } from 'react';
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, ReferenceDot, useXAxisScale, useYAxisScale, usePlotArea } from 'recharts';
import { Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useI18n } from '../../context/I18nContext';

const MILESTONE_LABEL_KEYS = {
  Kickoff: 'scurve.milestone.kickoff',
  'Pháp lý': 'scurve.milestone.legal',
  'Giấy phép': 'scurve.milestone.legal',
  'Thiết kế': 'scurve.milestone.design',
  'Vật tư': 'scurve.milestone.materials',
  COD: 'scurve.milestone.cod',
  Handover: 'scurve.milestone.handover',
  'Thi công': 'scurve.milestone.construction',
};

const translateMilestoneTitle = (title, tr) => {
  if (!title) return title;
  return title.split(' & ').map((part) => {
    const key = MILESTONE_LABEL_KEYS[part.trim()];
    return key ? tr(key) : part;
  }).join(' & ');
};

const formatMonthLabel = (monthStr, monthPrefix) => {
  if (!monthStr) return monthStr;
  return monthStr.replace(/^THÁNG\s/, `${monthPrefix} `);
};

/** Trục X: bước đều + đầu/cuối tháng — không chen thêm milestone (tránh lệch nhãn) */
const buildXAxisTickPlan = (chartData) => {
  const n = chartData.length;
  if (!n) return { tickIndices: new Set(), monthLabels: new Map(), tickLabels: new Map() };

  let step = 3;
  if (n > 120) step = 10;
  else if (n > 90) step = 7;
  else if (n > 60) step = 5;
  else if (n > 30) step = 4;

  const tickIndices = new Set([0, n - 1]);
  for (let i = 0; i < n; i += step) tickIndices.add(i);

  const monthLabels = new Map();
  const tickLabels = new Map();
  let prevMonthKey = null;

  chartData.forEach((d, i) => {
    const parts = (d.originalDate || '').split('/');
    if (parts.length < 3) return;
    const monthKey = `${parts[1]}/${parts[2]}`;
    if (monthKey !== prevMonthKey) {
      monthLabels.set(i, d.monthStr);
      tickIndices.add(i);
      prevMonthKey = monthKey;
    }
  });

  const sortedTicks = [...tickIndices].sort((a, b) => a - b);
  const filteredTicks = new Set([0, n - 1]);
  let lastKept = -999;
  sortedTicks.forEach((idx) => {
    if (monthLabels.has(idx)) {
      filteredTicks.add(idx);
      lastKept = idx;
      return;
    }
    if (idx - lastKept >= 2) {
      filteredTicks.add(idx);
      lastKept = idx;
    }
  });

  sortedTicks.forEach((idx, tickPos) => {
    if (!filteredTicks.has(idx)) return;
    const parts = (chartData[idx].originalDate || '').split('/');
    if (parts.length < 3) return;
    const [day, month] = parts;
    const prevTickIdx = tickPos > 0 ? sortedTicks[tickPos - 1] : null;
    const prevMonth = prevTickIdx != null
      ? (chartData[prevTickIdx].originalDate || '').split('/')[1]
      : null;

    tickLabels.set(
      idx,
      monthLabels.has(idx) || month !== prevMonth ? `${day}/${month}` : day
    );
  });

  return { tickIndices: filteredTicks, monthLabels, tickLabels };
};

const DOT_R = 6;
const BADGE_H = 22;
const BADGE_PAD_X = 8;
const CHAR_W = 6.2;
const EDGE_PAD = 6;
const LABEL_GAP = 8;
const STACK_STEP = 22;
const LABEL_OFFSET_X = 10;

const CHART_MARGIN = { top: 48, right: 36, left: 8, bottom: 44 };

const measureBadge = (title) => ({
  w: Math.min(148, Math.max(72, title.length * CHAR_W + BADGE_PAD_X * 2)),
  h: BADGE_H,
});

const boxesOverlap = (a, b, gap = 5) => !(
  a.x + a.w + gap <= b.x
  || b.x + b.w + gap <= a.x
  || a.y + a.h + gap <= b.y
  || b.y + b.h + gap <= a.y
);

const clampBoxInPlot = (box, plot) => {
  let { x, y, w, h } = box;
  x = Math.max(plot.left + EDGE_PAD, Math.min(x, plot.right - w - EDGE_PAD));
  y = Math.max(plot.top + EDGE_PAD, Math.min(y, plot.bottom - h - EDGE_PAD));
  return { ...box, x, y, w, h };
};

const prefersBelowDot = (entry, cy, plot) => (
  entry.planPct >= 78
  || /cod|handover|bàn giao|đóng điện/i.test(entry.title)
  || cy < plot.top + plot.height * 0.22
);

/** Nhãn sát chấm + lệch ngang — zigzag khi gần nhau, không chồng */
const layoutMilestoneBadges = (entries, plot, bandCenter, yScale, chartLen) => {
  const placed = [];

  entries.forEach((entry, mIdx) => {
    const cx = bandCenter(entry.date);
    const cy = yScale(entry.planPct);
    if (cx == null || cy == null) return;

    const { w, h } = measureBadge(entry.title);
    const isRightEdge = entry.index > chartLen - 14;
    const isLeftEdge = entry.index < 14;
    const prev = mIdx > 0 ? entries[mIdx - 1] : null;
    const prevPlaced = prev ? placed.find((p) => p.index === prev.index) : null;
    const indexGap = prev ? entry.index - prev.index : Infinity;
    const sameAltitude = prev && Math.abs(entry.planPct - prev.planPct) <= 12;

    let placeAbove = !prefersBelowDot(entry, cy, plot);
    let stackLevel = 0;

    if (sameAltitude || indexGap <= 12) {
      placeAbove = prevPlaced ? !prevPlaced.placeAbove : placeAbove;
      stackLevel = sameAltitude && prevPlaced ? (prevPlaced.stackLevel || 0) + 1 : 0;
    }

    const makeBox = (above, stack, nudgeX = 0) => {
      const stackOff = stack * STACK_STEP;
      const labelY = above
        ? cy - DOT_R - LABEL_GAP - h - stackOff
        : cy + DOT_R + LABEL_GAP + stackOff;

      let labelX = cx - w / 2 + nudgeX;
      if (above) {
        labelX = cx - w - LABEL_OFFSET_X + nudgeX;
        if (isLeftEdge) labelX = Math.max(plot.left + EDGE_PAD, cx - w * 0.35);
        else if (isRightEdge) labelX = Math.min(plot.right - w - EDGE_PAD, cx - w + 8);
      } else if (isRightEdge) {
        labelX = cx - w + 6 + nudgeX;
      }

      return clampBoxInPlot({
        index: entry.index,
        cx,
        cy,
        x: labelX,
        y: labelY,
        w,
        h,
        title: entry.title,
        color: entry.color,
        placeAbove: above,
        stackLevel: stack,
      }, plot);
    };

    let box = makeBox(placeAbove, stackLevel);
    let attempts = 0;

    while (placed.some((p) => boxesOverlap(box, p)) && attempts < 14) {
      attempts += 1;
      if (attempts % 3 === 1) {
        placeAbove = !placeAbove;
        stackLevel = 0;
      } else if (attempts % 3 === 2) {
        stackLevel += 1;
      } else {
        const nudgeX = (attempts % 2 === 0 ? 1 : -1) * Math.ceil(attempts / 3) * 14;
        box = makeBox(placeAbove, stackLevel, nudgeX);
        continue;
      }
      box = makeBox(placeAbove, stackLevel);
    }

    placed.push(box);
  });

  return placed;
};

const buildLeaderPoints = (b) => {
  const anchorX = b.x + b.w / 2;
  const dotY = b.placeAbove ? b.cy - DOT_R : b.cy + DOT_R;
  const labelEdgeY = b.placeAbove ? b.y + b.h : b.y;

  if (Math.abs(anchorX - b.cx) < 10) {
    return `${b.cx},${dotY} ${b.cx},${labelEdgeY}`;
  }

  const elbowY = b.placeAbove ? b.y + b.h + 3 : b.y - 3;
  return `${b.cx},${dotY} ${b.cx},${elbowY} ${anchorX},${elbowY} ${anchorX},${labelEdgeY}`;
};

/** Vẽ nhãn milestone bằng hook Recharts 3 — tọa độ khớp chấm, có đường nối */
function MilestoneLabelsGroup({ chartData, tr }) {
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const plotArea = usePlotArea();

  if (!xScale || !yScale || !plotArea?.width || !chartData?.length) return null;

  const plot = {
    left: plotArea.x,
    top: plotArea.y,
    right: plotArea.x + plotArea.width,
    bottom: plotArea.y + plotArea.height,
  };

  const bandCenter = (date) => {
    const x = xScale(date, { position: 'middle' });
    if (x == null || Number.isNaN(x)) return null;
    return x;
  };

  const entries = chartData
    .map((d, index) => (
      d.milestoneTitle && d.plan != null
        ? {
          index,
          date: d.originalDate,
          planPct: d.plan,
          title: translateMilestoneTitle(d.milestoneTitle, tr),
          color: d.milestoneColor || '#64748b',
        }
        : null
    ))
    .filter(Boolean);

  if (!entries.length) return null;

  const badges = layoutMilestoneBadges(entries, plot, bandCenter, yScale, chartData.length);

  return (
    <g className="recharts-milestone-labels">
      {badges.map((b) => {
        const labelCenterX = b.x + b.w / 2;

        return (
          <g key={b.index}>
            <polyline
              points={buildLeaderPoints(b)}
              fill="none"
              stroke={b.color}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              opacity={0.8}
            />
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx={6}
              fill="rgba(15, 23, 42, 0.96)"
              stroke={b.color}
              strokeWidth={1}
            />
            <text
              x={labelCenterX}
              y={b.y + b.h / 2 + 3.5}
              textAnchor="middle"
              fill={b.color}
              fontSize={10}
              fontWeight={700}
            >
              {b.title}
            </text>
          </g>
        );
      })}
    </g>
  );
}

const CustomTooltip = ({ active, payload, label, tr }) => {
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
          {data.milestoneTitle && (
            <div className="flex items-center gap-1.5 text-xs pb-1.5 mb-1 border-b border-[#263554]">
              <span className="font-medium" style={{ color: data.milestoneColor || '#64748b' }}>
                {translateMilestoneTitle(data.milestoneTitle, tr)}
              </span>
            </div>
          )}
          {actual !== null && (
            <div className="flex justify-between items-center gap-4 text-xs">
              <span className="text-[#10b981] font-medium">{tr('scurve.actualShort')}:</span>
              <span className="text-white font-bold">{actual}%</span>
            </div>
          )}
          <div className="flex justify-between items-center gap-4 text-xs">
            <span className="text-[#64748b] font-medium">{tr('scurve.planShort')}:</span>
            <span className="text-white font-bold">{plan}%</span>
          </div>
          {diff !== null && diff !== 0 && (
            <div className={`mt-2 pt-2 border-t border-[#263554] flex justify-between items-center gap-4 text-xs ${diff < 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
              <span className="font-medium">{tr('scurve.varianceShort')}:</span>
              <span className="font-bold">{diff > 0 ? '+' : ''}{diff}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function SCurveChart({ project, milestonesData = [], initialData, onPlanCalculated }) {
  const { t } = useI18n();
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(initialData === undefined);
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
        let data = initialData;
        const useBundledData = initialData !== undefined;

        if (!useBundledData) {
          setIsLoading(true);
          data = await api.getSCurves(project?.PROJECT_ID || project?.id);
        }

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

      const startDateStr = project?.startDate || project?.NGÀY_BẮT_ĐẦU;
      const kDateStr = kickoffSheetData?.NGÀY_KẾ_HOẠCH || project?.kickoffDate || project?.KICKOFF_DATE;
      const cDateStr = codSheetData?.NGÀY_KẾ_HOẠCH || project?.cod || project?.codDate;

      const projectStart = parseD(startDateStr);
      const kickoff = parseD(kDateStr) || new Date(new Date().setMonth(new Date().getMonth() - 1));
      const cod = parseD(cDateStr) || new Date(new Date().setMonth(new Date().getMonth() + 1));
      
      // Ensure global span covers all milestones
      const allDates = [];
      if (projectStart && !isNaN(projectStart.getTime())) allDates.push(projectStart.getTime());
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
  }, [project, milestonesData, initialData]);

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
  const xAxisTickPlan = useMemo(() => buildXAxisTickPlan(chartData), [chartData]);

  const renderChartContent = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          {t('scurve.title')}
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--text-muted)]" />}
        </h3>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <div className="w-4 h-0 border-t-2 border-dashed border-[#64748b]" />
              {t('scurve.plan')}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <div className="w-4 h-1 bg-[#10b981] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              {t('scurve.actual')}
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <div className="w-4 h-1 bg-[#ef4444] rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)] opacity-80" />
              {t('scurve.variance')}
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
              <p className="font-semibold mb-1">{t('scurve.loading')}</p>
              <p className="text-xs opacity-70">{t('scurve.loadingHint')}</p>
            </div>
          </div>
        ) : (
        <div className="relative w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={CHART_MARGIN}
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
                const { x, y, payload } = props;
                if (!payload?.value) return null;

                const dataIndex = chartData.findIndex((d) => d.originalDate === payload.value);
                if (dataIndex < 0 || !xAxisTickPlan.tickIndices.has(dataIndex)) return null;

                const dataPoint = chartData[dataIndex];
                const label = xAxisTickPlan.tickLabels.get(dataIndex) || payload.value.split('/')[0];
                const monthLabel = xAxisTickPlan.monthLabels.get(dataIndex);
                const hasMilestone = Boolean(dataPoint?.milestoneColor);

                return (
                  <g>
                    <text
                      x={x}
                      y={y + 14}
                      fill={hasMilestone ? dataPoint.milestoneColor : 'var(--text-muted)'}
                      fontSize={9}
                      fontWeight={hasMilestone ? 700 : 500}
                      textAnchor="middle"
                    >
                      {label}
                    </text>
                    {monthLabel && (
                      <text
                        x={x}
                        y={y + 28}
                        fill="#64748b"
                        fontSize={9}
                        fontWeight={700}
                        textAnchor="middle"
                        className="uppercase tracking-wider"
                      >
                        {formatMonthLabel(monthLabel, t('scurve.monthPrefix'))}
                      </text>
                    )}
                  </g>
                );
              }}
            />
            <YAxis
              stroke="#4d5e7a"
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}
              tickFormatter={(val) => `${val}%`}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
            />
            <Tooltip content={<CustomTooltip tr={t} />} />

            <Area
              type="monotone"
              dataKey="delayRange"
              name={t('scurve.varianceShort')}
              stroke="none"
              fillOpacity={1}
              fill="url(#colorDelay)"
              isAnimationActive
              animationDuration={1500}
            />

            <Line
              type="monotone"
              dataKey="plan"
              name={t('scurve.planShort')}
              stroke="#64748b"
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={false}
              isAnimationActive
              animationDuration={1500}
              activeDot={{ r: 4, fill: '#64748b', stroke: 'var(--bg-panel)', strokeWidth: 2 }}
            />

            <Area
              type="monotone"
              dataKey="actual"
              name={t('scurve.actualShort')}
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorActual)"
              dot={{ r: 3, fill: '#10b981', stroke: 'none' }}
              isAnimationActive
              animationDuration={1500}
              activeDot={{ r: 6, fill: '#10b981', stroke: 'var(--bg-panel)', strokeWidth: 2, className: 'animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]' }}
            />

            {chartData.map((d, index) => {
              if (!d.milestoneTitle) return null;
              return (
                <ReferenceDot
                  key={`dot-${index}`}
                  x={d.originalDate}
                  y={d.plan}
                  r={5}
                  fill={d.milestoneColor}
                  stroke="var(--bg-panel)"
                  strokeWidth={2}
                  isFront
                />
              );
            })}

            {latestActualPoint && (
              <ReferenceDot
                x={latestActualPoint.originalDate}
                y={latestActualPoint.actual}
                r={5}
                fill="#10b981"
                stroke="var(--bg-panel)"
                strokeWidth={2}
              />
            )}

            <MilestoneLabelsGroup chartData={chartData} tr={t} />
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
        {renderChartContent()}
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8">
          <div
            className="absolute inset-0"
            onClick={() => setIsFullscreen(false)}
          />
          <div className="glass-panel w-full max-w-[95vw] h-[85vh] p-6 sm:p-8 rounded-2xl shadow-2xl border border-[var(--border-main)] flex flex-col relative bg-[#0b1120] z-10 animate-in fade-in zoom-in-95 duration-200">
            {renderChartContent()}
          </div>
        </div>
      )}
    </>
  );
}
