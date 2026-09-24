import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Typography } from "antd";

interface RideStatusItem {
  name: string;
  value: number;
  percentage?: string;
  color: string;
}

interface RideStatusChartProps {
  data?: RideStatusItem[];
}

const STATUS_COLORS: Record<string, string> = {
  Completed: "#10b981",
  Cancelled: "#ef4444",
  Ongoing: "#3b82f6",
  Scheduled: "#f59e0b",
};

const defaultData: RideStatusItem[] = [
  { name: "Completed", value: 0, color: "#10b981" },
  { name: "Cancelled", value: 0, color: "#ef4444" },
  { name: "Ongoing", value: 0, color: "#3b82f6" },
  { name: "Scheduled", value: 0, color: "#f59e0b" },
];

const RideStatusChart: React.FC<RideStatusChartProps> = ({ data }) => {
  // Merge incoming data with default colours
  const chartData: RideStatusItem[] = (data && data.length > 0)
    ? data.map((item) => ({
        ...item,
        color: item.color || STATUS_COLORS[item.name] || "#9ca3af",
      }))
    : defaultData;

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  // Compute percentages dynamically
  const withPercentage = chartData.map((item) => ({
    ...item,
    percentage: total > 0 ? `${((item.value / total) * 100).toFixed(1)}%` : "0%",
  }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-200 dark:border-slate-700 flex flex-col h-full w-full">
      <Typography.Title level={5} className="!m-0 text-gray-800 dark:text-gray-200 font-bold mb-2 text-sm">
        Ride Status
      </Typography.Title>
      <div className="flex-1 flex items-center justify-between">
        <div className="w-1/2 h-full min-h-[120px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {/* Empty gray ring shown when there is no data */}
              {total === 0 && (
                <Pie
                  data={[{ name: "Empty", value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={false}
                >
                  <Cell fill="#e5e7eb" />
                </Pie>
              )}
              {/* Actual data ring */}
              {total > 0 && (
                <Pie
                  data={withPercentage}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {withPercentage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              )}
              {total > 0 && (
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', padding: '6px' }} 
                  itemStyle={{ color: '#1f2937', fontWeight: 600 }}
                />
              )}
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-gray-800 dark:text-white leading-none">
              {total.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 font-medium mt-0.5">Total</span>
          </div>
        </div>
        
        <div className="w-1/2 flex flex-col gap-2.5 pl-3 border-l border-gray-100 dark:border-slate-700">
          {withPercentage.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 truncate">{item.name}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-gray-800 dark:text-white leading-none">{item.value}</span>
                <span className="text-[9px] text-gray-400 leading-tight">{item.percentage}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RideStatusChart;
