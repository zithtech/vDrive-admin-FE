import React from "react";
import { Typography } from "antd";

interface EarningsSummaryData {
  today: number;
  yesterday: number;
  thisWeek: number;
  thisMonth: number;
  lastMonth: number;
}

interface EarningsSummaryCardProps {
  data: EarningsSummaryData;
}

const summaryConfig = [
  { key: "today", label: "Today's Earnings", iconColor: "text-emerald-500", iconBg: "bg-emerald-50 dark:bg-emerald-500/10", icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  ) },
  { key: "yesterday", label: "Yesterday's Earnings", iconColor: "text-blue-500", iconBg: "bg-blue-50 dark:bg-blue-500/10", icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ) },
  { key: "thisWeek", label: "This Week (So far)", iconColor: "text-purple-500", iconBg: "bg-purple-50 dark:bg-purple-500/10", icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ) },
  { key: "thisMonth", label: "This Month (So far)", iconColor: "text-orange-500", iconBg: "bg-orange-50 dark:bg-orange-500/10", icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
  ) },
  { key: "lastMonth", label: "Last Month", iconColor: "text-emerald-500", iconBg: "bg-emerald-50 dark:bg-emerald-500/10", icon: (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2-9 5 18 3-9h5"/></svg>
  ) },
];

const EarningsSummaryCard: React.FC<EarningsSummaryCardProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 border border-gray-100 dark:border-slate-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col h-full w-full">
      <Typography.Title level={5} className="!m-0 text-gray-800 dark:text-gray-200 font-bold text-base mb-3">
        Earnings Summary
      </Typography.Title>
      
      <div className="flex flex-col">
        {summaryConfig.map((item, index) => (
          <div 
            key={item.key} 
            className={`flex items-center justify-between py-2.5 ${
              index !== summaryConfig.length - 1 ? "border-b border-gray-100 dark:border-slate-700" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.iconBg} ${item.iconColor}`}>
                {item.icon}
              </div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {item.label}
              </span>
            </div>
            <span className="text-sm font-bold text-gray-800 dark:text-white">
              ₹{(data as any)[item.key]?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EarningsSummaryCard;
