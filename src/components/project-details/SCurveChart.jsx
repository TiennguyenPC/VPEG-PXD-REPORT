import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, ReferenceDot } from 'recharts';
import { Maximize2 } from 'lucide-react';

const mockData = [
  { name: '01/04', plan: 0, actual: 0 },
  { name: '15/04', plan: 5, actual: 4 },
  { name: '01/05', plan: 15, actual: 12 },
  { name: '15/05', plan: 35, actual: 30 },
  { name: '01/06', plan: 50, actual: 45.2 }, // current point
  { name: '15/06', plan: 75, actual: null },
  { name: '30/06', plan: 95, actual: null },
  { name: '10/07', plan: 100, actual: null },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0b0f19] border border-[#263554] p-3 rounded-lg shadow-xl shadow-black/50">
        <p className="text-[#6b7d9b] text-xs font-bold mb-2 uppercase">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-300 font-medium">{entry.name}:</span>
              <span className="text-white font-bold">{entry.value}%</span>
            </div>
          ))}
          {payload.length === 2 && (
            <div className="mt-2 pt-2 border-t border-[#182135] flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Độ lệch:</span>
              <span className={`font-bold ${
                payload[1].value - payload[0].value < 0 ? "text-[#ef4444]" : "text-[#10b981]"
              }`}>
                {(payload[1].value - payload[0].value).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function SCurveChart({ project }) {
  // Use current project progress for the current dot if available
  const planProgress = project.progress - project.deviation;
  
  return (
    <div className="glass-panel p-6 rounded-xl shadow-lg border border-[#182135] h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          ĐƯỜNG ĐỒ THỊ TIẾN ĐỘ (S-CURVE)
        </h3>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6b7d9b]">
              <div className="w-4 h-0.5 bg-[#4d5e7a] border border-dashed border-[#4d5e7a]"></div>
              Kế hoạch (%)
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6b7d9b]">
              <div className="w-4 h-1 bg-[#10b981] rounded-full"></div>
              Thực tế (%)
            </div>
          </div>
          <button className="p-1.5 hover:bg-[#182135] rounded text-slate-400 hover:text-white transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={mockData}
            margin={{ top: 20, right: 30, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#182135" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#4d5e7a" 
              tick={{ fill: '#6b7d9b', fontSize: 10, fontWeight: 600 }}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              stroke="#4d5e7a" 
              tick={{ fill: '#6b7d9b', fontSize: 10, fontWeight: 600 }}
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
              activeDot={{ r: 4, fill: '#4d5e7a', stroke: '#0b0f19', strokeWidth: 2 }}
            />
            
            <Area 
              type="monotone" 
              dataKey="actual" 
              name="Thực tế"
              stroke="#10b981" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorActual)" 
              activeDot={{ r: 6, fill: '#10b981', stroke: '#0b0f19', strokeWidth: 2, className: 'animate-pulse' }}
            />
            
            {/* Current status point */}
            <ReferenceDot x="01/06" y={45.2} r={5} fill="#10b981" stroke="#0b0f19" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
