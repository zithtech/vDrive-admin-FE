import React from "react";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

interface EarningsStatCardProps {
  title: string;
  value: string;
  trend: number; // positive for up, negative for down
  trendText: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
}

const EarningsStatCard: React.FC<EarningsStatCardProps> = ({
  title,
  value,
  trend,
  trendText,
  icon,
  iconBgColor,
  iconColor,
}) => {
  const isPositive = trend >= 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 border border-gray-100 dark:border-slate-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center gap-3 transition-all hover:shadow-[0_4px_15px_-4px_rgba(0,0,0,0.1)]">
      <div
        className="w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 shadow-sm"
        style={{ background: iconBgColor, color: iconColor }}
      >
        <div className="text-xl">{icon}</div>
      </div>
      <div className="flex flex-col flex-1 justify-center min-w-0">
        <span className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1 truncate w-full">
          {title}
        </span>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1.5">
          <span className="text-[20px] font-extrabold text-slate-800 dark:text-white leading-none tracking-tight truncate max-w-full">
            {value}
          </span>
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`flex items-center text-xs font-bold tracking-tight px-1.5 py-0.5 rounded-md shrink-0 ${
                isPositive ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" : "text-red-600 bg-red-50 dark:bg-red-500/10"
              }`}
            >
              {isPositive ? <ArrowUpOutlined className="mr-1 text-[10px]" /> : <ArrowDownOutlined className="mr-1 text-[10px]" />}
              {Math.abs(trend)}%
            </span>
            <span className="text-slate-400 font-medium text-xs truncate">
              {trendText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsStatCard;
