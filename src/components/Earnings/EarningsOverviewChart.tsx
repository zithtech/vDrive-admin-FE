import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Typography, Select } from "antd";

interface ChartDataItem {
  date: string;
  total: number;
  subscription: number;
  topups: number;
}

interface EarningsOverviewChartProps {
  data: ChartDataItem[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 border border-gray-100 dark:border-slate-700 shadow-lg rounded-xl flex flex-col min-w-[150px]">
        <span className="text-gray-500 dark:text-gray-400 text-xs font-semibold mb-2 pb-2 border-b border-gray-100 dark:border-slate-700">
          {label}
        </span>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex justify-between items-center gap-4 my-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs text-gray-600 dark:text-gray-300 capitalize">{entry.name}</span>
            </div>
            <span className="text-sm font-bold text-gray-800 dark:text-white">
              ₹{entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const EarningsOverviewChart: React.FC<EarningsOverviewChartProps> = ({ data }) => {
  const [period, setPeriod] = useState<string>("this_week");

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 border border-gray-100 dark:border-slate-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-2">
        <Typography.Title level={5} className="!m-0 text-gray-800 dark:text-gray-200 font-bold text-base">
          Earnings Overview
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
      <div className="flex-1 w-full min-h-[180px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
              tickFormatter={(value) => `${value >= 1000 ? value / 1000 + "k" : value}`}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: "5 5" }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Line
              name="Total"
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#3b82f6" }}
              activeDot={{ r: 6, strokeWidth: 0, fill: "#3b82f6" }}
            />
            <Line
              name="Subscription"
              type="monotone"
              dataKey="subscription"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#10b981" }}
              activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981" }}
            />
            <Line
              name="Top-ups"
              type="monotone"
              dataKey="topups"
              stroke="#f59e0b"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: "#fff", stroke: "#f59e0b" }}
              activeDot={{ r: 6, strokeWidth: 0, fill: "#f59e0b" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EarningsOverviewChart;
