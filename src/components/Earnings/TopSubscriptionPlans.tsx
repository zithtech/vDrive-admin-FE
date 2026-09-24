import React, { useState } from "react";
import { Typography, Select } from "antd";

interface PlanData {
  rank: number;
  name: string;
  revenue: number;
  count: number;
}

interface TopSubscriptionPlansProps {
  plans: PlanData[];
}

const formatRevenue = (num: number) => {
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num}`;
};

const TopSubscriptionPlans: React.FC<TopSubscriptionPlansProps> = ({ plans }) => {
  const [period, setPeriod] = useState<string>("this_month");

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-3">
        <Typography.Title level={5} className="!m-0 text-gray-800 dark:text-gray-200 font-bold text-sm">
          Top Subscription Plans
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

      <div className="flex justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3 px-1 border-b border-gray-100 dark:border-slate-700 pb-2">
        <span>Plan</span>
        <div className="flex gap-4">
          <span className="w-16 text-right">Revenue</span>
          <span className="w-10 text-right">Users</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-4 mt-1">
        {plans.map((plan) => (
          <div key={plan.rank} className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                plan.rank === 1 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                plan.rank === 2 ? 'bg-slate-100 text-slate-500 dark:bg-slate-600/30 dark:text-slate-300' :
                plan.rank === 3 ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' :
                'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
              }`}>
                {plan.rank}
              </span>
              <span className="font-semibold text-gray-700 dark:text-gray-300 text-sm truncate max-w-[110px] xl:max-w-[140px]">{plan.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm w-16 text-right whitespace-nowrap">
                {formatRevenue(plan.revenue)}
              </span>
              <span className="text-gray-600 font-medium text-sm w-10 text-right bg-gray-50 dark:bg-slate-700 px-1.5 py-0.5 rounded whitespace-nowrap">
                {plan.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopSubscriptionPlans;
