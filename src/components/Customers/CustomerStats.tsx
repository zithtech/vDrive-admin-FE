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
          className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 flex items-center justify-center text-base ${card.iconBg} ${card.iconColor} z-10 rounded-lg`}>
                {card.icon}
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest z-10">
                {card.title}
              </p>
            </div>
          </div>
          <div className="flex items-end justify-between mt-2 z-10">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">
                  {card.value.toLocaleString()}
                </h3>
                <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider uppercase">
                  {card.label}
                </span>
              </div>
            </div>
            {/* Background Icon */}
            <div className={`absolute -bottom-4 -right-4 text-[100px] opacity-[0.04] pointer-events-none ${card.iconColor}`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomerStats;
