import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Typography } from "antd";

interface DistributionData {
  range: string;
  percentage: number;
  amount: number;
  color: string;
}

interface WalletDistributionChartProps {
  data: DistributionData[];
  total: number;
}

const WalletDistributionChart: React.FC<WalletDistributionChartProps> = ({ data, total }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col h-full w-full">
      <Typography.Title level={5} className="!m-0 text-gray-800 dark:text-gray-200 font-bold text-base mb-4">
        Wallet Distribution
      </Typography.Title>
      
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-between">
        <div className="w-full sm:w-[50%] h-[200px] relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={2}
                dataKey="percentage"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any, _name: any, props: any) => [`${value}%`, props.payload.range]}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px', padding: '8px' }} 
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-gray-800 dark:text-white leading-none">
              ₹{total.toLocaleString()}
            </span>
            <span className="text-xs text-gray-500 font-medium mt-1">Total</span>
          </div>
        </div>
        
        <div className="w-full sm:w-[50%] flex flex-col gap-4 pl-0 sm:pl-4 mt-6 sm:mt-0">
          {data.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <div className="flex items-start gap-2">
                <div className="w-2.5 h-2.5 rounded-full mt-1 shrink-0" style={{ backgroundColor: item.color }} />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-none">{item.range}</span>
                  <span className="text-[10px] text-gray-500 mt-1">{item.percentage}%</span>
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">₹{item.amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WalletDistributionChart;
