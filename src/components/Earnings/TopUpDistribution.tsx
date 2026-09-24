import React, { useState } from "react";
import { Typography, Select } from "antd";

interface DistributionData {
  range: string;
  percentage: number;
  count: number;
}

interface TopUpDistributionProps {
  data: DistributionData[];
}

const TopUpDistribution: React.FC<TopUpDistributionProps> = ({ data }) => {
  const [period, setPeriod] = useState<string>("this_month");

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-3">
        <Typography.Title level={5} className="!m-0 text-gray-800 dark:text-gray-200 font-bold text-sm">
          Top-up Amount Distribution
        </Typography.Title>
        <Select
          value={period}
          onChange={(val) => setPeriod(val)}
          variant="borderless"
          className="bg-gray-50 dark:bg-slate-700 rounded-lg min-w-[110px]"
          options={[
            { value: "this_month", label: "This Month" },
            { value: "last_month", label: "Last Month" },
          ]}
          size="small"
        />
      </div>
      
      <div className="flex flex-col gap-4 mt-1">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{item.range}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-gray-800 dark:text-white">{item.percentage}%</span>
                <span className="text-xs text-gray-400">({item.count.toLocaleString()})</span>
              </div>
            </div>
            <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-full rounded-full" 
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopUpDistribution;
