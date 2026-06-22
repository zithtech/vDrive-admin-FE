import React from "react";
import { Progress } from "antd";
import { Activity, CheckCircle, Clock, Navigation, XCircle, Users } from "lucide-react";

interface DriverMetricsColumnProps {
  stats: {
    activeDrivers: number;
    totalDrivers: number;
    availableDrivers: number;
    onTripDrivers: number;
    totalScheduledRides: number;
    acceptedScheduledRides: number;
    totalCancellationsToday: number;
    loading: boolean;
  };
}

const DriverMetricsColumn: React.FC<DriverMetricsColumnProps> = ({ stats }) => {
  const MiniMetricCard = ({
    title,
    value,
    icon: Icon,
    iconColor,
    iconBgColor,
    subtitle,
  }: {
    title: string;
    value: string | number;
    icon: any;
    iconColor: string;
    iconBgColor: string;
    subtitle?: string;
  }) => (
    <div className="relative bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-3 flex flex-col justify-between hover:shadow-sm transition-all duration-300 h-[80px] overflow-hidden group">
      <div className="flex flex-col">
        <h3 className="text-gray-400 text-[10px] font-bold leading-tight uppercase tracking-wider">
          {title}
        </h3>
      </div>

      <div className="flex items-baseline justify-between mt-auto">
        <div className="flex items-baseline gap-1">
          <p className="text-lg font-bold text-gray-900 dark:text-white leading-none m-0">
            {stats.loading ? "..." : value}
          </p>
          {subtitle && (
            <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium lowercase italic">
              {subtitle}
            </span>
          )}
        </div>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconBgColor}`}>
          <Icon size={14} className={iconColor} />
        </div>
      </div>
    </div>
  );

  const availabilityPercent =
    stats.totalDrivers > 0 ? Math.round((stats.availableDrivers / stats.totalDrivers) * 100) : 0;

  const activePercent =
    stats.totalDrivers > 0 ? Math.round((stats.activeDrivers / stats.totalDrivers) * 100) : 0;

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-blue-500" />
          <span className="font-bold text-gray-900 dark:text-white text-[14px] tracking-tight">
            Live Driver Status
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-500 font-medium text-[12px]">Live</span>
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex-1 p-3 flex flex-col justify-between bg-gray-50/20 dark:bg-slate-900/50 overflow-hidden">
        <div className="grid grid-cols-2 gap-2.5">
          <MiniMetricCard
            title="Available"
            value={stats.availableDrivers}
            icon={CheckCircle}
            iconColor="text-emerald-500"
            iconBgColor="bg-emerald-50 dark:bg-emerald-900/30"
            subtitle="online"
          />
          <MiniMetricCard
            title="On Trip"
            value={stats.onTripDrivers}
            icon={Navigation}
            iconColor="text-orange-500"
            iconBgColor="bg-orange-50 dark:bg-orange-900/30"
            subtitle="active"
          />
          <MiniMetricCard
            title="Scheduled"
            value={`${stats.acceptedScheduledRides}/${stats.totalScheduledRides}`}
            icon={Clock}
            iconColor="text-indigo-500"
            iconBgColor="bg-indigo-50 dark:bg-indigo-900/30"
            subtitle="acc/tot"
          />
          <MiniMetricCard
            title="Cancelled"
            value={stats.totalCancellationsToday}
            icon={XCircle}
            iconColor="text-rose-500"
            iconBgColor="bg-rose-50 dark:bg-rose-900/30"
            subtitle="today"
          />
        </div>

        <div className="flex items-center gap-3 my-2">
          <div className="h-px bg-gray-100 dark:bg-slate-700 flex-1"></div>
          <span className="text-[10px] font-bold text-gray-300 dark:text-gray-500 uppercase tracking-widest">
            Fleet Health
          </span>
          <div className="h-px bg-gray-100 dark:bg-slate-700 flex-1"></div>
        </div>

        {/* Fleet Progress Section */}
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-3 shadow-sm/5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center">
              <Progress
                type="circle"
                percent={availabilityPercent}
                size={64}
                strokeColor={{ "0%": "#10b981", "100%": "#34d399" }}
                strokeWidth={10}
                format={(percent) => (
                  <span className="text-[12px] font-bold text-gray-900 dark:text-white">
                    {percent}%
                  </span>
                )}
              />
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-wider">
                Availability
              </span>
            </div>
            <div className="flex flex-col items-center">
              <Progress
                type="circle"
                percent={activePercent}
                size={64}
                strokeColor={{ "0%": "#3b82f6", "100%": "#60a5fa" }}
                strokeWidth={10}
                format={(percent) => (
                  <span className="text-[12px] font-bold text-gray-900 dark:text-white">
                    {percent}%
                  </span>
                )}
              />
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-wider">
                Active Fleet
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-gray-400 dark:text-gray-500" />
            <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Total Drivers
            </span>
          </div>
          <span className="text-[13px] font-black text-gray-900 dark:text-white">
            {stats.totalDrivers}
          </span>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default DriverMetricsColumn;
