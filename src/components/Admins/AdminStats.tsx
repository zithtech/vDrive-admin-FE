import React from "react";
import { ShieldCheck, UserCheck, KeySquare, Clock } from "lucide-react";
import type { AdminUser } from "../../store/slices/adminSlice";
import dayjs from "dayjs";

// Beautiful SVG Sparkline helper component matching the mockup designs
const Sparkline: React.FC<{ color: string }> = ({ color }) => {
  let strokeColor = "#3b82f6";
  let gradientId = "blue-grad-admin";
  let stopColor = "#3b82f6";

  if (color === "green") {
    strokeColor = "#10b981";
    gradientId = "green-grad-admin";
    stopColor = "#10b981";
  } else if (color === "purple") {
    strokeColor = "#8b5cf6";
    gradientId = "purple-grad-admin";
    stopColor = "#8b5cf6";
  } else if (color === "orange") {
    strokeColor = "#f59e0b";
    gradientId = "orange-grad-admin";
    stopColor = "#f59e0b";
  }

  return (
    <svg className="w-20 h-6 opacity-70" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stopColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={stopColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 25 C15 20, 30 28, 50 16 C70 4, 85 8, 100 2 L100 30 L0 30 Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M0 25 C15 20, 30 28, 50 16 C70 4, 85 8, 100 2"
        stroke={strokeColor}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
};

interface AdminStatsProps {
  admins: AdminUser[];
  loading: boolean;
}

const AdminStats: React.FC<AdminStatsProps> = ({ admins }) => {
  const total = admins.length;
  const superAdmins = admins.filter((a) => a.role === "super_admin").length;
  const standardAdmins = admins.filter((a) => a.role !== "super_admin").length;

  const lastMonth = dayjs().subtract(30, "days");
  const newThisMonth = admins.filter((a) => dayjs(a.created_at).isAfter(lastMonth)).length;

  const stats = [
    {
      title: "Total Admins",
      value: total,
      label: "records",
      icon: <ShieldCheck size={14} strokeWidth={3} />,
      iconColor: "text-blue-500 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-500/10",
      sparklineColor: "blue",
    },
    {
      title: "Super Admins",
      value: superAdmins,
      label: "system",
      icon: <KeySquare size={14} strokeWidth={3} />,
      iconColor: "text-purple-500 dark:text-purple-400",
      iconBg: "bg-purple-50 dark:bg-purple-500/10",
      sparklineColor: "purple",
    },
    {
      title: "Platform Admins",
      value: standardAdmins,
      label: "active",
      icon: <UserCheck size={14} strokeWidth={3} />,
      iconColor: "text-emerald-500 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
      sparklineColor: "green",
    },
    {
      title: "New Additions",
      value: newThisMonth,
      label: "this month",
      icon: <Clock size={14} strokeWidth={3} />,
      iconColor: "text-amber-500 dark:text-amber-400",
      iconBg: "bg-amber-50 dark:bg-amber-500/10",
      sparklineColor: "orange",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-0">
      {stats.map((card, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 flex flex-col relative overflow-hidden shadow-sm transition-all rounded-sm"
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

          {/* Bottom Right Sparkline */}
          <div className="absolute bottom-0 right-0 pointer-events-none">
            <Sparkline color={card.sparklineColor} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;
