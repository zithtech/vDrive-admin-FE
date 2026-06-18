import React from "react";
import { TrendingUp, DollarSign, Users, UserCheck, Navigation, Award } from "lucide-react";

interface TodayGrowthColumnProps {
  stats: {
    todayNewUsers: number;
    todayNewDrivers: number;
    todaySubscriptions: number;
    todayTrips: number;
    todayRevenue: number;
    trends: {
      users: string;
      drivers: string;
      subscriptions: string;
      trips: string;
      revenue: string;
    };
    loading: boolean;
  };
  isHorizontal?: boolean;
}

const TodayGrowthColumn: React.FC<TodayGrowthColumnProps> = ({ stats }) => {
  const GrowthItem = ({ title, value, Icon, trend }: any) => {
    const isPositive = trend?.startsWith("+");
    const isNegative = trend && !isPositive && trend !== "0%";

    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-100 hover:bg-gray-50 transition min-w-[150px]">
        {/* Icon */}
        <div className="p-1.5 rounded-md bg-gray-50 text-gray-600">
          <Icon size={14} />
        </div>

        {/* Text */}
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-gray-500">{title}</span>
          <span className="text-sm font-semibold text-gray-900">
            {stats.loading ? "--" : value}
          </span>
        </div>

        {/* Trend */}
        <div
          className={`ml-auto text-[10px] font-medium ${
            isPositive ? "text-green-600" : isNegative ? "text-red-500" : "text-gray-400"
          }`}
        >
          {trend}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-900">Today</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
          <span className="text-[11px] text-green-600">Live</span>
        </div>
      </div>

      {/* Horizontal Scroll */}
      <div className="flex gap-2 overflow-x-auto p-3 scroll-smooth">
        <GrowthItem
          title="Revenue"
          value={`₹${stats.todayRevenue.toLocaleString()}`}
          Icon={DollarSign}
          trend={stats.trends.revenue}
        />

        <GrowthItem
          title="Users"
          value={stats.todayNewUsers}
          Icon={Users}
          trend={stats.trends.users}
        />

        <GrowthItem
          title="Drivers"
          value={stats.todayNewDrivers}
          Icon={UserCheck}
          trend={stats.trends.drivers}
        />

        <GrowthItem
          title="Trips"
          value={stats.todayTrips}
          Icon={Navigation}
          trend={stats.trends.trips}
        />

        <GrowthItem
          title="Subs"
          value={stats.todaySubscriptions}
          Icon={Award}
          trend={stats.trends.subscriptions}
        />
      </div>

      {/* Scrollbar */}
      <style>{`
        div::-webkit-scrollbar {
          height: 4px;
        }
        div::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default TodayGrowthColumn;
