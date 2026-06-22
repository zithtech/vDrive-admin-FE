import React from "react";
import { FileProtectOutlined, SafetyCertificateOutlined, FileExclamationOutlined, CloseCircleOutlined } from "@ant-design/icons";
import type { Driver } from "../../store/slices/driverSlice";
import dayjs from "dayjs";

interface ApplicationStatsProps {
  drivers: Driver[];
  loading?: boolean;
}

const generatePath = (data: number[]) => {
  if (!data || data.length === 0) return "M0,40 L100,40";
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

const StatCard = ({ title, value, icon, bg, strokeColor, chartData, subtitle = "APPS" }: any) => {
  const pathD = chartData ? generatePath(chartData) : "M0,40 L10,30 L20,35 L40,10 L60,25 L80,5 L100,20";

  return (
    <div className="bg-white dark:bg-slate-900 px-5 py-3 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[90px] shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 flex items-center justify-center text-[15px] ${bg}`}>
            {icon}
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest whitespace-nowrap truncate">{title}</p>
        </div>
      </div>

      <div className="flex items-end justify-between mt-2">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{value}</h3>
            <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider">{subtitle}</span>
          </div>
        </div>
        <div className="w-24 h-10 mb-[-5px]">
          <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
            <path d={pathD} fill="none" stroke={strokeColor || "#3b82f6"} strokeWidth="2" strokeLinecap="round" />
            <path d={`${pathD} L100,40 L0,40 Z`} fill={`url(#gradient-${strokeColor?.replace('#', '') || 'default'})`} opacity="0.1" />
            <defs>
              <linearGradient id={`gradient-${strokeColor?.replace('#', '') || 'default'}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={strokeColor || "#3b82f6"} />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
};

const ApplicationStats: React.FC<ApplicationStatsProps> = ({ drivers }) => {
  const totalPending = drivers.filter((d) => d.status !== "rejected" && d.onboarding_status !== "DOCS_REJECTED").length;
  const docsRejected = drivers.filter((d) => d.status !== "rejected" && d.onboarding_status === "DOCS_REJECTED").length;
  const rejected = drivers.filter((d) => d.status === "rejected").length;
  const total = drivers.length; // Basically total tracked in this page

  // Calculate dynamic weekly data (last 7 days)
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    return dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD');
  });

  const totalData = last7DaysData.map(date =>
    drivers.filter(d => dayjs(d.created_at).isBefore(dayjs(date).endOf('day'))).length
  );

  const pendingData = last7DaysData.map(date =>
    drivers.filter(d => d.status !== "rejected" && d.onboarding_status !== "DOCS_REJECTED" && dayjs(d.created_at).isBefore(dayjs(date).endOf('day'))).length
  );

  const docsRejectedData = last7DaysData.map(date =>
    drivers.filter(d => d.status !== "rejected" && d.onboarding_status === "DOCS_REJECTED" && dayjs(d.created_at).isBefore(dayjs(date).endOf('day'))).length
  );

  const rejectedData = last7DaysData.map(date =>
    drivers.filter(d => d.status === "rejected" && dayjs(d.created_at).isBefore(dayjs(date).endOf('day'))).length
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="TOTAL APPS"
        value={total}
        icon={<FileProtectOutlined />}
        bg="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
        strokeColor="#3b82f6"
        chartData={totalData}
      />
      <StatCard
        title="PENDING AUTH"
        value={totalPending}
        icon={<SafetyCertificateOutlined />}
        bg="bg-orange-50 dark:bg-orange-900/20 text-orange-600"
        strokeColor="#f97316"
        chartData={pendingData}
      />
      <StatCard
        title="DOCS REJECTED"
        value={docsRejected}
        icon={<FileExclamationOutlined />}
        bg="bg-amber-50 dark:bg-amber-900/20 text-amber-600"
        strokeColor="#f59e0b"
        chartData={docsRejectedData}
      />
      <StatCard
        title="REJECTED APPS"
        value={rejected}
        icon={<CloseCircleOutlined />}
        bg="bg-rose-50 dark:bg-rose-900/20 text-rose-600"
        strokeColor="#f43f5e"
        chartData={rejectedData}
      />
    </div>
  );
};

export default ApplicationStats;
