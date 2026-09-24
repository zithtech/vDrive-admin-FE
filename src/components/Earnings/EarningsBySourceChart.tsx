import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Typography } from "antd";

interface EarningsBySourceChartProps {
  total: number;
  subscriptions: { amount: number; percentage: number };
  walletTopUps: { amount: number; percentage: number };
}

const EarningsBySourceChart: React.FC<EarningsBySourceChartProps> = ({ total, subscriptions, walletTopUps }) => {
  const data = [
    { name: "Subscriptions", value: subscriptions.amount, percentage: subscriptions.percentage, color: "#10b981" },
    { name: "Wallet Top-ups", value: walletTopUps.amount, percentage: walletTopUps.percentage, color: "#f59e0b" },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 border border-gray-100 dark:border-slate-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col h-full w-full">
      <Typography.Title level={5} className="!m-0 text-gray-800 dark:text-gray-200 font-bold text-base mb-2">
        Earnings by Source
      </Typography.Title>
      
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-between">
        <div className="w-full sm:w-[55%] h-[160px] sm:h-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => `₹${Number(value || 0).toLocaleString()}`}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px', padding: '8px' }} 
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-lg font-bold text-gray-800 dark:text-white leading-none">
              ₹{total.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500 font-medium mt-1">Total</span>
          </div>
        </div>
        
        <div className="w-full sm:w-[45%] flex flex-col gap-3 pl-0 sm:pl-4 mt-4 sm:mt-0 sm:border-l border-gray-100 dark:border-slate-700">
          {data.map((item, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{item.name}</span>
              </div>
              <div className="flex items-center justify-between pl-4.5">
                <span className="text-sm font-bold text-gray-800 dark:text-white">₹{item.value.toLocaleString()}</span>
                <span className="text-xs text-gray-500">{item.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EarningsBySourceChart;
