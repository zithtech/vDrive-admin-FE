import React from "react";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

interface StatCardProps {
  title: string;
  value: string | number;
  trend: number; // positive for up, negative for down
  trendText: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
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
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-gray-200 dark:border-slate-700 flex items-center gap-3">
      <div
        className={`w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 shadow-sm`}
        style={{ background: iconBgColor, color: iconColor }}
      >
        <div className="text-xl">{icon}</div>
      </div>
      <div className="flex flex-col flex-1 justify-center">
        <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px] mb-0.5">
          {title}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[20px] font-bold text-slate-800 dark:text-white leading-none tracking-tight">
            {value}
          </span>
          <div className="flex flex-col">
            <span
              className={`flex items-center text-xs font-bold tracking-tight ${
                isPositive ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {isPositive ? <ArrowUpOutlined className="mr-1 text-[10px]" /> : <ArrowDownOutlined className="mr-1 text-[10px]" />}
              {Math.abs(trend)}%
            </span>
            <span className="text-slate-400 font-medium text-[11px] whitespace-nowrap mt-0.5">
              {trendText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
