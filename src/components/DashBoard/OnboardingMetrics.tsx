import React from "react";
import { Typography, Progress } from "antd";
import { Users, ShieldCheck, Bell, Clock } from "lucide-react";

const { Title, Text } = Typography;

interface OnboardingMetricsProps {
  stats: {
    pendingVerifications: number;
    documentExpiryAlerts: number;
    complianceHealth: number;
    lastSyncAt: string;
    loading: boolean;
  };
}

const OnboardingMetrics: React.FC<OnboardingMetricsProps> = ({ stats }) => {
  const [timeAgo, setTimeAgo] = React.useState("0m");

  React.useEffect(() => {
    const calculateTimeAgo = () => {
      const diff = Math.floor((new Date().getTime() - new Date(stats.lastSyncAt).getTime()) / 60000);
      if (diff < 1) setTimeAgo("now");
      else if (diff < 60) setTimeAgo(`${diff}m`);
      else setTimeAgo(`${Math.floor(diff / 60)}h`);
    };

    calculateTimeAgo();
    const interval = setInterval(calculateTimeAgo, 60000);
    return () => clearInterval(interval);
  }, [stats.lastSyncAt]);

  const MetricItem = ({
    title,
    value,
    icon: Icon,
    iconBgColor,
    iconColor,
  }: {
    title: string;
    value: number | string;
    icon: any;
    iconBgColor: string;
    iconColor: string;
  }) => (
    <div className="flex items-center p-3 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-all duration-300 group cursor-default h-[50px]">
      {/* Icon Section */}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${iconBgColor} shrink-0`}>
        <Icon size={18} className={iconColor} />
      </div>

      {/* Info Section */}
      <div className="flex flex-col flex-1 min-w-0">
        <Text className="text-[10px] text-gray-400 font-medium mb-0 tracking-tight">
          {title}
        </Text>
        <Title level={4} className="!m-0 text-gray-900 font-bold !text-[17px] leading-tight">
          {stats.loading ? "..." : value}
        </Title>
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-gray-500" />
          <span className="font-bold text-gray-900 text-[14px] tracking-tight">Onboarding</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-emerald-500 font-medium text-[12px]">Live</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <MetricItem
            title="Pending Verification"
            value={stats.pendingVerifications}
            icon={ShieldCheck}
            iconBgColor="bg-orange-50"
            iconColor="text-orange-500"
          />

          <MetricItem
            title="Document Expiry"
            value={stats.documentExpiryAlerts}
            icon={Bell}
            iconBgColor="bg-red-50"
            iconColor="text-red-400"
          />
        </div>

        {/* Compliance Health Section */}
        <div className="bg-gray-50/30 rounded-xl p-2.5 border border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-gray-800 tracking-tight">Compliance Health</span>
            <span className="text-[12px] font-bold text-gray-900">
              {stats.loading ? "..." : `${stats.complianceHealth}%`}
            </span>
          </div>
          
          <div className="relative">
            <Progress 
              percent={stats.complianceHealth} 
              size="small" 
              showInfo={false} 
              strokeColor="#3b82f6"
              trailColor="#e5e7eb"
              strokeWidth={4}
              strokeLinecap="round"
            />
            <div className="flex items-center justify-end gap-1 mt-1">
              <Clock size={9} className="text-gray-400" />
              <span className="text-[9px] text-gray-400 font-medium tracking-tight">Sync: {timeAgo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingMetrics;

