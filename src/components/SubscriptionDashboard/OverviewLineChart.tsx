import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Select } from "antd";

interface OverviewLineChartProps {
  data: {
    date: string;
    active: number;
  }[];
}

const OverviewLineChart: React.FC<OverviewLineChartProps> = ({ data }) => {
  return (
    <div className="p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-slate-800">Subscription Overview</h2>
        <div className="flex gap-2">
          <div className="flex bg-slate-100 rounded-lg p-1 text-xs font-medium">
            <button className="px-3 py-1 bg-white rounded shadow-sm text-slate-800">Active</button>
            <button className="px-3 py-1 text-slate-500 hover:text-slate-700">New</button>
            <button className="px-3 py-1 text-slate-500 hover:text-slate-700">Expired</button>
          </div>
          <Select
            defaultValue="This Week"
            options={[{ value: "This Week", label: "This Week" }]}
            className="w-32"
          />
        </div>
      </div>
      
      <div className="flex-grow min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "#94a3b8" }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              tickFormatter={(value) => value >= 1000 ? `${value / 1000}K` : value}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#3b82f6', fontWeight: 600 }}
              labelStyle={{ color: '#64748b', marginBottom: '4px' }}
            />
            <Area
              type="monotone"
              dataKey="active"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorActive)"
              activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default OverviewLineChart;
