import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Select } from "antd";
import { ArrowUp } from "lucide-react";

interface RevenueBarChartProps {
  data: {
    date: string;
    amount: number;
  }[];
}

const RevenueBarChart: React.FC<RevenueBarChartProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `${value / 1000}K`;
    }
    return value.toString();
  };

  const totalRevenue = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="p-5 h-full flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Revenue from Subscriptions</h2>
          <div className="flex items-end gap-3">
            <span className="text-2xl font-bold text-slate-800">{formatCurrency(totalRevenue)}</span>
            <span className="flex items-center text-sm font-medium text-emerald-500 mb-1">
              <ArrowUp size={14} className="mr-0.5" /> 14.8% <span className="text-slate-400 font-normal ml-1">vs last month</span>
            </span>
          </div>
        </div>
        <Select
          defaultValue="This Month"
          options={[{ value: "This Month", label: "This Month" }]}
          className="w-32"
        />
      </div>

      <div className="flex-grow min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              tickFormatter={formatYAxis}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{ fill: '#f8fafc' }}
              formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
            />
            <Bar 
              dataKey="amount" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]} 
              barSize={12}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueBarChart;
