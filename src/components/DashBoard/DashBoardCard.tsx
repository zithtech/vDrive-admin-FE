import React from "react";
import { ThunderboltOutlined, TeamOutlined, DollarOutlined, CarOutlined } from "@ant-design/icons";


interface Metric {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  pillColor: string;
  chartData?: number[];
  strokeColor?: string;
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

const MetricCard: React.FC<Metric> = ({ title, value, subtitle, icon, pillColor, chartData, strokeColor }) => {
  const pathD = chartData ? generatePath(chartData) : null;

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 flex flex-col justify-between hover:shadow-sm transition-all duration-300 min-h-[120px]">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-[#8c8c8c] dark:text-gray-400 text-[13px] font-medium tracking-tight whitespace-nowrap">
          {title}
        </h3>
        <div className="text-gray-300 dark:text-gray-500 text-lg opacity-60 font-light">{icon}</div>
      </div>

      <div className="flex items-end justify-between gap-2 mt-auto">
        <div className="flex flex-col gap-1.5">
          <p
            className={`font-bold text-[#262626] dark:text-white leading-none tracking-tighter ${value.length > 12 ? "text-[16px]" : "text-[22px]"}`}
          >
            {value}
          </p>
          {subtitle && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${pillColor} w-fit mt-0.5`}
            >
              {subtitle}
            </span>
          )}
        </div>
        
        {pathD && (
          <div className="w-20 h-8 mb-[-5px]">
            <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
              <path d={pathD} fill="none" stroke={strokeColor || "#cbd5e1"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d={`${pathD} L100,40 L0,40 Z`} fill={`url(#gradient-${strokeColor?.replace('#', '') || 'default'})`} opacity="0.15" />
              <defs>
                <linearGradient id={`gradient-${strokeColor?.replace('#', '') || 'default'}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor || "#cbd5e1"} />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

interface DashboardCardProps {
  stats: {
    activeDrivers: number;
    totalDrivers: number;
    availableDrivers: number;
    onTripDrivers: number;
    totalScheduledRides: number;
    acceptedScheduledRides: number;
    totalUsers: number;
    activeUsers: number;
    todayNewDrivers: number;
    todaySubscriptions: number;
    totalSubscriptions: number;
    totalEarnings: number;
    todayRevenue: number;
    loading: boolean;
  };
}

const DashboardCard: React.FC<DashboardCardProps> = ({ stats }) => {
  const metrics: Metric[] = [
    {
      title: "Active / Total Users",
      value: stats.loading
        ? "..."
        : `${stats.activeUsers.toLocaleString()} / ${stats.totalUsers.toLocaleString()}`,
      subtitle: "Verified Customers",
      pillColor: "bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400",
      icon: <TeamOutlined />,
      chartData: [20, 35, 25, 45, 55, 40, 65],
      strokeColor: "#3b82f6",
    },
    {
      title: "Active / Total Drivers",
      value: stats.loading ? "..." : `${stats.activeDrivers} / ${stats.totalDrivers}`,
      subtitle: "Verified",
      pillColor: "bg-green-50 text-green-500 dark:bg-green-900/30 dark:text-green-400",
      icon: <CarOutlined />,
      chartData: [15, 25, 20, 30, 45, 35, 50],
      strokeColor: "#10b981",
    },
    {
      title: "Subscriptions Today / Total",
      value: stats.loading
        ? "..."
        : `${stats.todaySubscriptions.toLocaleString()} / ${stats.totalSubscriptions.toLocaleString()}`,
      subtitle: "Active Plans",
      pillColor: "bg-purple-50 text-purple-500 dark:bg-purple-900/30 dark:text-purple-400",
      icon: <ThunderboltOutlined />,
      chartData: [5, 10, 8, 15, 12, 20, 25],
      strokeColor: "#a855f7",
    },
    {
      title: "Earnings Today / Total",
      value: stats.loading
        ? "..."
        : `₹${stats.todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / ₹${stats.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      subtitle: "",
      pillColor: "bg-green-50 text-green-500 dark:bg-green-900/30 dark:text-green-400",
      icon: <DollarOutlined />,
      chartData: [100, 150, 120, 200, 180, 250, 300],
      strokeColor: "#10b981",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};

export default DashboardCard;
