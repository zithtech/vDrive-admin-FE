import React from "react";
import { Typography, Button } from "antd";
import { ArrowUpOutlined } from "@ant-design/icons";

interface TopUpSummaryProps {
  totalTopups: number;
  averageTopup: number;
  transactionCount: number;
}

const TopUpSummary: React.FC<TopUpSummaryProps> = ({ totalTopups, averageTopup, transactionCount }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col w-full">
      <div className="flex justify-between items-center mb-3">
        <Typography.Title level={5} className="!m-0 text-gray-800 dark:text-gray-200 font-bold text-sm">
          Top-up Summary (Today)
        </Typography.Title>
        <Button type="link" className="text-blue-600 text-xs p-0 h-auto">View Report</Button>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-700">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-lg shrink-0">
            <ArrowUpOutlined />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-medium">Total Top-ups</span>
            <span className="text-sm font-bold text-gray-800 dark:text-white leading-tight">₹{totalTopups.toLocaleString()}</span>
            <span className="text-[10px] text-emerald-600 font-medium mt-0.5"><ArrowUpOutlined className="mr-0.5 text-[8px]" /> {transactionCount} Transactions</span>
          </div>
        </div>
        
        <div className="flex-1 flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-700">
          <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-500 flex items-center justify-center text-lg shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-medium">Average Top-up</span>
            <span className="text-sm font-bold text-gray-800 dark:text-white leading-tight">₹{averageTopup.toLocaleString()}</span>
            <span className="text-[10px] text-gray-400 font-medium mt-0.5">Per Transaction</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopUpSummary;
