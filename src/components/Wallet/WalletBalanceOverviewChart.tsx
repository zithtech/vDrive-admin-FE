import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Typography, Select } from "antd";

interface ChartDataItem {
  date: string;
  balance: number;
}

interface WalletBalanceOverviewChartProps {
  data: ChartDataItem[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 border border-gray-100 dark:border-slate-700 shadow-lg rounded-xl flex flex-col min-w-[120px] items-center">
        <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-1">
          {label} 2025
        </span>
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Balance</span>
        <span className="text-sm font-bold text-gray-800 dark:text-white">
          ₹{payload[0].value.toLocaleString()}
        </span>
      </div>
    );
  }
  return null;
};

const WalletBalanceOverviewChart: React.FC<WalletBalanceOverviewChartProps> = ({ data }) => {
  const [period, setPeriod] = useState<string>("this_week");

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-4">
        <Typography.Title level={5} className="!m-0 text-gray-800 dark:text-gray-200 font-bold text-base">
          Wallet Balance Overview
        </Typography.Title>
        <Select
          value={period}
          onChange={(val) => setPeriod(val)}
          variant="borderless"
          className="bg-gray-50 dark:bg-slate-700 rounded-lg min-w-[110px]"
          options={[
            { value: "this_week", label: "This Week" },
            { value: "last_week", label: "Last Week" },
          ]}
        />
      </div>
      <div className="flex-1 w-full min-h-[200px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickFormatter={(value) => `${value >= 1000 ? value / 1000 + "K" : value}`}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: "5 5" }} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#3b82f6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorBalance)"
              activeDot={{ r: 6, strokeWidth: 0, fill: "#3b82f6" }}
              dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#3b82f6" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WalletBalanceOverviewChart;
