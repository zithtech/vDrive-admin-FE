import React from "react";
import { CarOutlined, CheckCircleOutlined, StopOutlined, RiseOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import type { Driver } from "../../store/slices/driverSlice";
import dayjs from "dayjs";

const { Text } = Typography;

interface DriverStatsProps {
  drivers: Driver[];
  loading: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  tagColor: "blue" | "emerald" | "purple" | "rose" | "indigo";
}

const StatCard: React.FC<StatCardProps & { secondaryValue?: string | number }> = ({
  title,
  value,
  icon,
  description,
  tagColor,
  secondaryValue,
}) => {
  const colorMap = {
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800",
    emerald:
      "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
    purple:
      "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800",
    rose: "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800",
    indigo:
      "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800",
  };

  const textColorMap = {
    blue: "text-blue-600 dark:text-blue-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    purple: "text-purple-600 dark:text-purple-400",
    rose: "text-rose-600 dark:text-rose-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-2xl p-5 flex justify-between items-center transition-all duration-300 group">
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center gap-2">
          <span
            className={`text-2xl font-black tracking-tighter leading-none ${textColorMap[tagColor]}`}
          >
            {value.toLocaleString()}
          </span>
          <Text className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-1">
            {title}
          </Text>
        </div>
        <Text className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none mt-1 whitespace-nowrap">
          {secondaryValue !== undefined ? (
            <span className="flex items-center gap-1">
              <span className="font-bold text-slate-600 dark:text-slate-300">{value} today</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>{secondaryValue} in last 30 days</span>
            </span>
          ) : (
            description
          )}
        </Text>
      </div>

      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${colorMap[tagColor]} bg-opacity-100 group-hover:scale-110`}
      >
        {React.cloneElement(icon as React.ReactElement, { className: "text-lg" })}
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

  const lastMonth = dayjs().subtract(30, "days");
  const newThisMonth = drivers.filter((d) => dayjs(d.created_at).isAfter(lastMonth)).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Drivers"
        value={total}
        icon={<CarOutlined />}
        description="All registered drivers"
        tagColor="blue"
      />
      <StatCard
        title="Active Drivers"
        value={active}
        icon={<CheckCircleOutlined />}
        description="Active status verified"
        tagColor="emerald"
      />
      <StatCard
        title="New Drivers"
        value={newToday}
        secondaryValue={newThisMonth}
        icon={<RiseOutlined />}
        description="Joined recently"
        tagColor="purple"
      />
      <StatCard
        title="Restricted"
        value={suspended}
        icon={<StopOutlined />}
        description="Accounts limited/blocked"
        tagColor="rose"
      />
    </div>
  );
};

export default DriverStats;
