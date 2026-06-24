import React from "react";
import { ShieldCheck, UserCheck, KeySquare, Clock } from "lucide-react";
import type { AdminUser } from "../../store/slices/adminSlice";
import dayjs from "dayjs";


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
      bgIcon: <ShieldCheck size={100} strokeWidth={1.5} />,
      iconColor: "text-blue-500 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-500/10",
    },
    {
      title: "Super Admins",
      value: superAdmins,
      label: "system",
      icon: <KeySquare size={14} strokeWidth={3} />,
      bgIcon: <KeySquare size={100} strokeWidth={1.5} />,
      iconColor: "text-purple-500 dark:text-purple-400",
      iconBg: "bg-purple-50 dark:bg-purple-500/10",
    },
    {
      title: "Platform Admins",
      value: standardAdmins,
      label: "active",
      icon: <UserCheck size={14} strokeWidth={3} />,
      bgIcon: <UserCheck size={100} strokeWidth={1.5} />,
      iconColor: "text-emerald-500 dark:text-emerald-400",
      iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      title: "New Additions",
      value: newThisMonth,
      label: "this month",
      icon: <Clock size={14} strokeWidth={3} />,
      bgIcon: <Clock size={100} strokeWidth={1.5} />,
      iconColor: "text-amber-500 dark:text-amber-400",
      iconBg: "bg-amber-50 dark:bg-amber-500/10",
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

          {/* Background Icon */}
          <div className={`absolute -bottom-6 -right-6 opacity-[0.06] pointer-events-none ${card.iconColor}`}>
            {card.bgIcon}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;
