import React from "react";
import {
  Users,
  UserCheck,
  Navigation,
  ShieldCheck,
  Wallet,
  Zap,
  ChevronRight
} from "lucide-react";
import { Typography } from "antd";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    key: "drivers",
    icon: <UserCheck size={18} className="text-blue-500" />,
    title: "Drivers",
    description: "Fleet Management",
    path: "/drivers",
    color: "from-blue-500/10 to-blue-500/5",
    border: "border-blue-100/50",
  },
  {
    key: "customers",
    icon: <Users size={18} className="text-indigo-500" />,
    title: "Customers",
    description: "User Base",
    path: "/customers",
    color: "from-indigo-500/10 to-indigo-500/5",
    border: "border-indigo-100/50",
  },
  {
    key: "trips",
    icon: <Navigation size={18} className="text-emerald-500" />,
    title: "Trips",
    description: "Live Operations",
    path: "/TripDetails",
    color: "from-emerald-500/10 to-emerald-500/5",
    border: "border-emerald-100/50",
  },
  {
    key: "admins",
    icon: <ShieldCheck size={18} className="text-purple-500" />,
    title: "Admins",
    description: "System Access",
    path: "/admins",
    color: "from-purple-500/10 to-purple-500/5",
    border: "border-purple-100/50",
  },
  {
    key: "recharge",
    icon: <Wallet size={18} className="text-amber-500" />,
    title: "Recharge",
    description: "Subscription Plans",
    path: "/RechargePlan",
    color: "from-amber-500/10 to-amber-500/5",
    border: "border-amber-100/50",
  },
];

const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-sm flex flex-col w-full h-full overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center px-4 py-2 border-b border-gray-100 bg-gray-50/30">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap size={12} className="text-white fill-white" />
          </div>
          <span className="font-bold text-gray-800 text-[11px] uppercase tracking-widest">Admin Quick Actions</span>
        </div>
      </div>

      {/* Content - Horizontal Row */}
      <div className="p-2 px-3 flex-1 flex items-center">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 w-full">
          {actions.map((item) => (
            <div
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`group relative overflow-hidden bg-gradient-to-br ${item.color} border ${item.border} rounded-xl p-2 px-3 flex items-center cursor-pointer hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 min-w-0 shadow-sm hover:shadow-lg`}
            >
              {/* Icon Container */}
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-all duration-300 mr-3">
                {item.icon}
              </div>

              {/* Text Content */}
              <div className="flex flex-col flex-1 min-w-0">
                <Typography.Text className="text-[11px] font-extrabold text-gray-800 truncate leading-tight group-hover:text-blue-600 transition-colors">
                  {item.title}
                </Typography.Text>
                <Typography.Text className="text-[9px] text-gray-400 font-bold uppercase tracking-tight truncate">
                  {item.description}
                </Typography.Text>
              </div>

              {/* Arrow */}
              <div className="ml-1 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-300">
                <ChevronRight size={12} className="text-gray-400 group-hover:text-blue-500" />
              </div>

              {/* Decorative Background Element */}
              <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-white/50 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-500"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickActions;


