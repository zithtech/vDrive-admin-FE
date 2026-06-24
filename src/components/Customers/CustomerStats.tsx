import React from "react";
import { UserOutlined, CheckCircleOutlined, StopOutlined, RiseOutlined } from "@ant-design/icons";
import type { Customer } from "../../pages/Customers";
import dayjs from "dayjs";


interface CustomerStatsProps {
  customers: Customer[];
  loading: boolean;
}

const CustomerStats: React.FC<CustomerStatsProps> = ({ customers }) => {
  const total = customers.length;
  const active = customers.filter((c) => c.status === "active").length;
  const suspended = customers.filter(
    (c) => c.status === "suspended" || c.status === "blocked",
  ).length;

  const lastMonth = dayjs().subtract(30, "days");
  const newThisMonth = customers.filter((c) => dayjs(c.created_at).isAfter(lastMonth)).length;

  const stats = [
    {
      title: "Total User",
      value: total,
      label: "records",
      icon: <UserOutlined />,
      iconColor: "text-blue-500 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-500/10",
      sparklineColor: "blue",
    },
    {
      title: "Active Users",
      value: active,
      label: "verified",
      icon: <CheckCircleOutlined />,
      iconColor: "text-emerald-500 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
      sparklineColor: "green",
    },
    {
      title: "New Members",
      value: newThisMonth,
      label: "this month",
      icon: <RiseOutlined />,
      iconColor: "text-amber-500 dark:text-amber-400",
      iconBg: "bg-amber-50 dark:bg-amber-500/10",
      sparklineColor: "orange",
    },
    {
      title: "Restricted",
      value: suspended,
      label: "blocked",
      icon: <StopOutlined />,
      iconColor: "text-rose-500 dark:text-rose-400",
      iconBg: "bg-rose-50 dark:bg-rose-500/10",
      sparklineColor: "red",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-0">
      {stats.map((card, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 flex flex-col relative overflow-hidden shadow-sm transition-all rounded-[10px]"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-7 h-7 rounded-lg ${card.iconBg} ${card.iconColor} flex items-center justify-center text-sm flex-shrink-0`}>
              {card.icon}
            </div>
            <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450 tracking-wide uppercase leading-none">
              {card.title}
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-auto">
            <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">
              {card.value.toLocaleString()}
            </span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              {card.label}
            </span>
          </div>

          {/* Background Icon */}
          <div className={`absolute -bottom-6 -right-6 text-[100px] opacity-[0.06] pointer-events-none ${card.iconColor}`}>
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomerStats;
