import React from "react";
import { Calendar, UserPlus, Clock, CalendarX2, IndianRupee, ArrowUp, ArrowDown } from "lucide-react";

interface StatsHeaderProps {
  data: {
    totalActive: number;
    totalActiveTrend: number;
    newSubscriptions: number;
    newSubscriptionsTrend: number;
    expiringIn7Days: number;
    expiringIn7DaysTrend: number;
    expiredSubscriptions: number;
    expiredSubscriptionsTrend: number;
    subscriptionRevenue: number;
    subscriptionRevenueTrend: number;
  };
}

const StatsHeader: React.FC<StatsHeaderProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-IN").format(value);
  };

  const StatCard = ({
    title,
    value,
    trend,
    trendLabel,
    icon: Icon,
    iconBg,
    iconColor,
  }: {
    title: string;
    value: string | number;
    trend: number;
    trendLabel: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
  }) => {
    const isPositive = trend > 0;
    const TrendIcon = isPositive ? ArrowUp : ArrowDown;
    const trendColor = isPositive ? "text-emerald-500" : "text-rose-500";

    return (
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg} ${iconColor}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800 mb-1">{value}</h3>
          <div className="flex items-center gap-1 text-xs">
            <span className={`flex items-center font-medium ${trendColor}`}>
              <TrendIcon size={12} className="mr-0.5" />
              {Math.abs(trend)}%
            </span>
            <span className="text-slate-400">vs {trendLabel}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        title="Total Active Subscriptions"
        value={formatNumber(data.totalActive)}
        trend={data.totalActiveTrend}
        trendLabel="previous period"
        icon={Calendar}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
      />
      <StatCard
        title="New Subscriptions (Today)"
        value={formatNumber(data.newSubscriptions)}
        trend={data.newSubscriptionsTrend}
        trendLabel="yesterday"
        icon={UserPlus}
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
      />
      <StatCard
        title="Expiring in 7 Days"
        value={formatNumber(data.expiringIn7Days)}
        trend={data.expiringIn7DaysTrend}
        trendLabel="yesterday"
        icon={Clock}
        iconBg="bg-orange-50"
        iconColor="text-orange-500"
      />
      <StatCard
        title="Expired Subscriptions"
        value={formatNumber(data.expiredSubscriptions)}
        trend={data.expiredSubscriptionsTrend}
        trendLabel="yesterday"
        icon={CalendarX2}
        iconBg="bg-purple-50"
        iconColor="text-purple-600"
      />
      <StatCard
        title="Subscription Revenue (Today)"
        value={formatCurrency(data.subscriptionRevenue)}
        trend={data.subscriptionRevenueTrend}
        trendLabel="yesterday"
        icon={IndianRupee}
        iconBg="bg-cyan-50"
        iconColor="text-cyan-500"
      />
    </div>
  );
};

export default StatsHeader;
