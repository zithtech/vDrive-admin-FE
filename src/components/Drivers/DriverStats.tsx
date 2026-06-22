import React from "react";
import { CarOutlined, CheckCircleOutlined, StopOutlined, RiseOutlined } from "@ant-design/icons";
import type { Driver } from "../../store/slices/driverSlice";
import dayjs from "dayjs";

interface DriverStatsProps {
  drivers: Driver[];
  loading?: boolean;
}

const generatePath = (data: number[]) => {
  if (!data || data.length === 0) return "M0,35 L100,35";
  if (data.length === 1) return `M0,20 L100,20`;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const width = 100;
  const height = 30;
  const yOffset = 35;

  const step = width / (data.length - 1);

  const points = data.map((val, i) => {
    const x = i * step;
    const y = yOffset - ((val - min) / range) * height;
    return { x, y };
  });

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L${points[i].x},${points[i].y}`;
  }
  return d;
};

const StatCard = ({ title, value, icon, trend, bg, strokeColor, secondaryValue, secondaryText, chartData }: any) => {
  const pathD = chartData ? generatePath(chartData) : "M0,35 C20,35 30,20 50,20 C70,20 80,5 100,5";

  return (
    <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] rounded-[10px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${bg}`}>
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
        <div className="w-24 h-10 mb-[-5px]">
          <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
            <path d={pathD} fill="none" stroke={strokeColor || "#cbd5e1"} strokeWidth="2" strokeLinecap="round" />
            <path d={`${pathD} L100,40 L0,40 Z`} fill={`url(#gradient-${strokeColor?.replace('#', '') || 'default'})`} opacity="0.1" />
            <defs>
              <linearGradient id={`gradient-${strokeColor?.replace('#', '') || 'default'}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={strokeColor || "#cbd5e1"} />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </svg>
        </div>
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

  // Calculate dynamic weekly data (last 7 days)
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    return dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD');
  });

  const totalDriversData = last7DaysData.map(date =>
    drivers.filter(d => dayjs(d.created_at).isBefore(dayjs(date).endOf('day'))).length
  );

  const activeDriversData = last7DaysData.map(date =>
    drivers.filter(d => d.status === "active" && dayjs(d.created_at).isBefore(dayjs(date).endOf('day'))).length
  );

  const newDriversData = last7DaysData.map(date =>
    drivers.filter(d => dayjs(d.created_at).isSame(dayjs(date), 'day')).length
  );

  const restrictedDriversData = last7DaysData.map(date =>
    drivers.filter(d => (d.status === "suspended" || d.status === "blocked") && dayjs(d.created_at).isBefore(dayjs(date).endOf('day'))).length
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Drivers"
        value={total}
        icon={<CarOutlined className="text-blue-600 dark:text-blue-400 text-base" />}
        trend="+14"
        bg="bg-blue-50 dark:bg-blue-500/10"
        strokeColor="#3b82f6"
        chartData={totalDriversData}
      />
      <StatCard
        title="Active Drivers"
        value={active}
        icon={<CheckCircleOutlined className="text-slate-500" />}
        trend="+31"
        bg="bg-slate-100 dark:bg-slate-800"
        strokeColor="#34d399"
        chartData={activeDriversData}
      />
      <StatCard
        title="New Drivers"
        value={newToday}
        icon={<RiseOutlined className="text-indigo-500" />}
        trend="+11"
        bg="bg-indigo-50 dark:bg-indigo-900/20"
        strokeColor="#34d399"
        chartData={newDriversData}
      />
      <StatCard
        title="Restricted"
        value={suspended}
        icon={<StopOutlined className="text-emerald-500" />}
        trend="+14"
        bg="bg-emerald-50 dark:bg-emerald-900/20"
        strokeColor="#e2e8f0"
        chartData={restrictedDriversData}
      />
    </div>
  );
};

export default DriverStats;
