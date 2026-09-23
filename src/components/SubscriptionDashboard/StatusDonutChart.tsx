import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface StatusDonutChartProps {
  data: {
    total: number;
    active: { count: number; percentage: number };
    expiringSoon: { count: number; percentage: number };
    expired: { count: number; percentage: number };
    cancelled: { count: number; percentage: number };
  };
}

const StatusDonutChart: React.FC<StatusDonutChartProps> = ({ data }) => {
  const chartData = [
    { name: "Active", value: data.active.count, color: "#10b981" },
    { name: "Expiring Soon", value: data.expiringSoon.count, color: "#f59e0b" },
    { name: "Expired", value: data.expired.count, color: "#8b5cf6" },
    { name: "Cancelled", value: data.cancelled.count, color: "#3b82f6" },
  ];

  const formatNumber = (num: number) => new Intl.NumberFormat("en-IN").format(num);

  return (
    <div className="p-5 h-full flex flex-col">
      <h2 className="text-lg font-bold text-slate-800 mb-2">Subscription Status</h2>
      
      <div className="flex-grow flex items-center justify-center relative min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              itemStyle={{ color: '#1e293b', fontWeight: 500 }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-800">{formatNumber(data.total)}</span>
          <span className="text-xs text-slate-500">Total</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-slate-600 font-medium">Active</span>
          </div>
          <div className="text-slate-500">
            <span className="font-semibold text-slate-800 mr-1">{formatNumber(data.active.count)}</span>
            ({data.active.percentage}%)
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-slate-600 font-medium">Expiring Soon</span>
          </div>
          <div className="text-slate-500">
            <span className="font-semibold text-slate-800 mr-1">{data.expiringSoon.count}</span>
            ({data.expiringSoon.percentage}%)
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span className="text-slate-600 font-medium">Expired</span>
          </div>
          <div className="text-slate-500">
            <span className="font-semibold text-slate-800 mr-1">{data.expired.count}</span>
            ({data.expired.percentage}%)
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-slate-600 font-medium">Cancelled</span>
          </div>
          <div className="text-slate-500">
            <span className="font-semibold text-slate-800 mr-1">{data.cancelled.count}</span>
            ({data.cancelled.percentage}%)
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusDonutChart;
