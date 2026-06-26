import React from "react";
import { CarOutlined, CheckCircleOutlined, StopOutlined, RiseOutlined } from "@ant-design/icons";
import type { Driver } from "../../store/slices/driverSlice";
import dayjs from "dayjs";

interface DriverStatsProps {
  drivers: Driver[];
  loading?: boolean;
}

const StatCard = ({ title, value, icon, bgIcon, trend, bg, secondaryValue, secondaryText }: any) => {
  return (
    <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${bg}`}>
            {icon}
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0">{title}</p>
        </div>
        {trend && (
          <div className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
            <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {trend}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between mt-2">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{value}</h3>
            <span className="text-[10px] text-slate-400 font-semibold mb-0.5">this week</span>
          </div>
          {secondaryValue !== undefined && (
            <span className="text-[10px] text-slate-400 font-medium mt-1">
              {secondaryValue} {secondaryText}
            </span>
          )}
        </div>
      </div>

      {/* Background Icon */}
      <div className="absolute -bottom-4 -right-4 text-[100px] opacity-[0.04] pointer-events-none">
        {bgIcon}
      </div>
    </div>
  );
};

const DriverStats: React.FC<DriverStatsProps> = ({ drivers }) => {
  const total = drivers.length;
  const active = drivers.filter((d) => d.status === "active").length;
  const suspended = drivers.filter(
    (d) => d.status === "suspended" || d.status === "blocked",
  ).length;

  const today = dayjs().startOf("day");
  const newToday = drivers.filter((d) => dayjs(d.created_at).isSame(today, "day")).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Drivers"
        value={total}
        icon={<CarOutlined className="text-blue-600 dark:text-blue-400 text-base" />}
        bgIcon={<CarOutlined className="text-blue-600 dark:text-blue-400" />}
        trend="+14"
        bg="bg-blue-50 dark:bg-blue-500/10"
      />
      <StatCard
        title="Active Drivers"
        value={active}
        icon={<CheckCircleOutlined className="text-slate-500 text-base" />}
        bgIcon={<CheckCircleOutlined className="text-slate-500" />}
        trend="+31"
        bg="bg-slate-100 dark:bg-slate-800"
      />
      <StatCard
        title="New Drivers"
        value={newToday}
        icon={<RiseOutlined className="text-indigo-500 text-base" />}
        bgIcon={<RiseOutlined className="text-indigo-500" />}
        trend="+11"
        bg="bg-indigo-50 dark:bg-indigo-900/20"
      />
      <StatCard
        title="Restricted"
        value={suspended}
        icon={<StopOutlined className="text-emerald-500 text-base" />}
        bgIcon={<StopOutlined className="text-emerald-500" />}
        trend="+14"
        bg="bg-emerald-50 dark:bg-emerald-900/20"
      />
    </div>
  );
};

export default DriverStats;
