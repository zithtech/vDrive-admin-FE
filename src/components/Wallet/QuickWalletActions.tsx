import React from "react";
import { Typography } from "antd";
import { PlusCircleOutlined, MinusCircleOutlined, ControlOutlined, LockOutlined, GiftOutlined, DownloadOutlined } from "@ant-design/icons";

const actions = [
  { id: "add", title: "Add Money", subtitle: "To Driver Wallet", icon: <PlusCircleOutlined />, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  { id: "deduct", title: "Deduct Money", subtitle: "From Wallet", icon: <MinusCircleOutlined />, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
  { id: "adjust", title: "Wallet Adjustment", subtitle: "Manual Adjustment", icon: <ControlOutlined />, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
  { id: "freeze", title: "Freeze Wallet", subtitle: "Block Wallet", icon: <LockOutlined />, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
  { id: "bonus", title: "Add Bonus", subtitle: "To Driver Wallet", icon: <GiftOutlined />, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  { id: "export", title: "Export Wallet Report", subtitle: "Download Report", icon: <DownloadOutlined />, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
];

const QuickWalletActions: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-slate-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col w-full mb-4">
      <Typography.Title level={5} className="!m-0 text-gray-800 dark:text-gray-200 font-bold text-base mb-4">
        Quick Wallet Actions
      </Typography.Title>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action) => (
          <div key={action.id} className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-blue-100 dark:hover:border-blue-500/30 hover:shadow-sm cursor-pointer transition-all bg-gray-50/50 dark:bg-slate-800/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2 ${action.bg} ${action.color}`}>
              {action.icon}
            </div>
            <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs text-center leading-tight mb-1">{action.title}</span>
            <span className="text-[10px] text-gray-500 text-center leading-tight">{action.subtitle}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuickWalletActions;
