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
            <div className={`absolute -bottom-4 -right-4 opacity-[0.04] pointer-events-none ${card.iconColor}`}>
              {card.bgIcon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;
