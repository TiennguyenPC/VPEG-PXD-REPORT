import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { buildAssigneeStatusChartData } from '../utils/assigneeHelpers';

export default function TaskListCharts({ tasks, chartStyles }) {
  const statusData = [
    { name: 'Chưa bắt đầu', value: tasks.filter((t) => t.computedStatus === 'Chưa bắt đầu').length, color: '#a0a0ff' },
    { name: 'Đang diễn ra', value: tasks.filter((t) => t.computedStatus === 'Đang diễn ra').length, color: '#3b82f6' },
    { name: 'Trễ', value: tasks.filter((t) => t.computedStatus === 'Trễ').length, color: '#ef4444' },
    { name: 'Đã hoàn thành', value: tasks.filter((t) => t.computedStatus === 'Đã hoàn thành').length, color: '#10b981' },
  ].filter((d) => d.value > 0);

  const priorityData = ['Khẩn cấp', 'Important', 'Medium', 'Low'].map((p) => {
    const pts = tasks.filter((t) => t.ƯU_TIÊN === p || (p === 'Khẩn cấp' && t.ƯU_TIÊN === 'Important'));
    return {
      name: p,
      'Chưa bắt đầu': pts.filter((t) => t.computedStatus === 'Chưa bắt đầu').length,
      'Đang diễn ra': pts.filter((t) => t.computedStatus === 'Đang diễn ra').length,
      'Trễ': pts.filter((t) => t.computedStatus === 'Trễ').length,
      'Đã hoàn thành': pts.filter((t) => t.computedStatus === 'Đã hoàn thành').length,
    };
  });

  const assigneeData = buildAssigneeStatusChartData(tasks);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 gap-y-4 pb-4 pr-1 max-md:overflow-visible md:h-full md:overflow-y-auto">
      <div className="border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] p-4 col-span-1 shadow-lg">
        <h3 className="text-[var(--text-strong)] font-bold mb-4 uppercase text-sm border-b border-[var(--border-main)] pb-2">Trạng thái</h3>
        <div className="h-64 relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-6">
            <span className="text-3xl font-bold text-[var(--text-strong)]">{tasks.length}</span>
            <span className="text-[10px] text-[var(--text-muted)] uppercase">Tác vụ</span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip contentStyle={chartStyles.tooltip} itemStyle={chartStyles.tooltipItem} />
              <Legend wrapperStyle={{ ...chartStyles.legend, paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] p-4 col-span-1 lg:col-span-2 shadow-lg">
        <h3 className="text-[var(--text-strong)] font-bold mb-4 uppercase text-sm border-b border-[var(--border-main)] pb-2">Ưu tiên</h3>
        <div className="h-64 overflow-visible">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData} margin={chartStyles.margin}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.grid} vertical={false} />
              <XAxis dataKey="name" stroke={chartStyles.axis} tick={{ ...chartStyles.tick, fontSize: 11 }} tickLine={false} />
              <YAxis stroke={chartStyles.axis} tick={{ ...chartStyles.tick, fontSize: 11 }} tickLine={false} axisLine={false} />
              <RechartsTooltip cursor={chartStyles.cursor} contentStyle={chartStyles.tooltip} itemStyle={chartStyles.tooltipItem} />
              <Legend wrapperStyle={chartStyles.legend} />
              <Bar dataKey="Chưa bắt đầu" stackId="a" fill="#a0a0ff" radius={[0, 0, 4, 4]} maxBarSize={40} />
              <Bar dataKey="Đang diễn ra" stackId="a" fill="#3b82f6" maxBarSize={40} />
              <Bar dataKey="Trễ" stackId="a" fill="#ef4444" maxBarSize={40} />
              <Bar dataKey="Đã hoàn thành" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-[var(--border-main)] rounded-lg bg-[var(--bg-panel)] p-4 col-span-1 lg:col-span-3 shadow-lg">
        <h3 className="text-[var(--text-strong)] font-bold mb-4 uppercase text-sm border-b border-[var(--border-main)] pb-2">Thành viên</h3>
        <div className="h-72 overflow-visible">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={assigneeData} margin={chartStyles.margin}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartStyles.grid} vertical={false} />
              <XAxis
                dataKey="name"
                stroke={chartStyles.axis}
                tick={{ ...chartStyles.tick, fontSize: 11 }}
                tickLine={false}
                interval={0}
              />
              <YAxis stroke={chartStyles.axis} tick={{ ...chartStyles.tick, fontSize: 11 }} tickLine={false} axisLine={false} />
              <RechartsTooltip
                cursor={chartStyles.cursor}
                contentStyle={chartStyles.tooltip}
                itemStyle={chartStyles.tooltipItem}
                labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullName || _label}
              />
              <Legend wrapperStyle={chartStyles.legend} />
              <Bar dataKey="Chưa bắt đầu" stackId="a" fill="#a0a0ff" radius={[0, 0, 4, 4]} maxBarSize={40} />
              <Bar dataKey="Đang diễn ra" stackId="a" fill="#3b82f6" maxBarSize={40} />
              <Bar dataKey="Trễ" stackId="a" fill="#ef4444" maxBarSize={40} />
              <Bar dataKey="Đã hoàn thành" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
