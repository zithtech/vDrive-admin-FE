import React from "react";
import { Typography, Badge } from "antd";
import { Users, ShieldCheck, FileWarning, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

interface OnboardingMetricsProps {
  stats: {
    onboardingPending?: number;
    onboardingDocRejected?: number;
    onboardingRejected?: number;
    loading: boolean;
  };
}

const OnboardingMetrics: React.FC<OnboardingMetricsProps> = ({ stats }) => {
  const navigate = useNavigate();
  // Counts come from the dashboard payload (gated by dashboard.read) — no separate
  // /api/drivers fetch, so the panel works for any dashboard viewer.
  const driversLoading = stats.loading;
  const counts = {
    pending: stats.onboardingPending ?? 0,
    docRejected: stats.onboardingDocRejected ?? 0,
    rejected: stats.onboardingRejected ?? 0,
  };

  const MetricItem = ({
    title,
    value,
    icon: Icon,
    iconBgColor,
    iconColor,
    onClick,
  }: {
    title: string;
    value: number | string;
    icon: any;
    iconBgColor: string;
    iconColor: string;
    onClick?: () => void;
  }) => (
    <div
      onClick={onClick}
      className={`flex items-center p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl transition-all duration-300 group h-[50px] ${onClick ? "cursor-pointer hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/50" : "cursor-default hover:shadow-sm"}`}
    >
      {/* Icon Section */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${iconBgColor} shrink-0`}
      >
        <Badge dot={typeof value === "number" && value > 0}>
          <Icon size={18} className={iconColor} />
        </Badge>
      </div>

      {/* Info Section */}
      <div className="flex flex-col flex-1 min-w-0">
        <Text
          className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mb-0 tracking-tight leading-none truncate w-full"
          title={title}
        >
          {title}
        </Text>
        <Title
          level={4}
          className="!m-0 text-gray-900 dark:text-white font-bold !text-[17px] leading-tight"
        >
          {value}
        </Title>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-gray-500 dark:text-gray-400" />
          <span className="font-bold text-gray-900 dark:text-white text-[14px] tracking-tight">
            Onboarding
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-emerald-500 font-medium text-[12px]">Live</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          <MetricItem
            title="Pending"
            value={driversLoading ? "..." : counts.pending}
            icon={ShieldCheck}
            iconBgColor="bg-orange-50 dark:bg-orange-900/30"
            iconColor="text-orange-500"
            onClick={() => navigate("/driver-applications")}
          />

          <MetricItem
            title="Docs Rejected"
            value={driversLoading ? "..." : counts.docRejected}
            icon={FileWarning}
            iconBgColor="bg-amber-50 dark:bg-amber-900/30"
            iconColor="text-amber-500"
            onClick={() => navigate("/driver-applications")}
          />

          <MetricItem
            title="Rejected"
            value={driversLoading ? "..." : counts.rejected}
            icon={XCircle}
            iconBgColor="bg-rose-50 dark:bg-rose-900/30"
            iconColor="text-rose-500"
            onClick={() => navigate("/driver-applications")}
          />
        </div>
      </div>
    </div>
  );
};

export default OnboardingMetrics;
