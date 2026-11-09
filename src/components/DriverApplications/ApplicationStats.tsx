import React from "react";
import {
  FileProtectOutlined,
  SafetyCertificateOutlined,
  FileExclamationOutlined,
  CloseCircleOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import type { Driver } from "../../store/slices/driverSlice";

interface ApplicationStatsProps {
  drivers: Driver[];
  loading?: boolean;
  onSelectView?: (view: "pending" | "video_kyc" | "doc_rejected" | "rejected") => void;
  activeView?: string;
}

const StatCard = ({ title, value, icon, bgIcon, trend, bg, isPulsing, onClick, isActive }: any) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 px-4 py-3 border rounded-sm flex flex-col justify-between h-[105px] shadow-sm relative overflow-hidden transition-all ${
        onClick ? "cursor-pointer hover:border-blue-400 dark:hover:border-blue-500" : ""
      } ${
        isActive
          ? "border-blue-500 dark:border-blue-400 ring-1 ring-blue-500/30"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${bg}`}>
            {icon}
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-[11px] font-bold m-0 uppercase tracking-wider truncate">
            {title}
          </p>
        </div>
        {isPulsing && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
        )}
        {trend && !isPulsing && (
          <div className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
            <svg className="w-2.5 h-2.5 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {trend}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between mt-1">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{value}</h3>
            <span className="text-[9px] text-slate-400 font-semibold mb-0.5">DRIVERS</span>
          </div>
        </div>
      </div>

      {/* Background Icon */}
      <div className="absolute -bottom-3 -right-3 text-[90px] opacity-[0.04] pointer-events-none">
        {bgIcon}
      </div>
    </div>
  );
};

const ApplicationStats: React.FC<ApplicationStatsProps> = ({ drivers, onSelectView, activeView }) => {
  const videoKycCount = drivers.filter(
    (d) =>
      d.onboarding_status === "VIDEO_KYC_WAITING" ||
      d.onboarding_status === "VIDEO_KYC_IN_PROGRESS",
  ).length;

  const totalPending = drivers.filter(
    (d) =>
      d.status !== "rejected" &&
      d.onboarding_status !== "DOCS_REJECTED" &&
      d.onboarding_status !== "VIDEO_KYC_WAITING" &&
      d.onboarding_status !== "VIDEO_KYC_IN_PROGRESS",
  ).length;

  const docsRejected = drivers.filter(
    (d) => d.status !== "rejected" && d.onboarding_status === "DOCS_REJECTED",
  ).length;

  const rejected = drivers.filter((d) => d.status === "rejected").length;
  const total = drivers.length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatCard
        title="Total Applications"
        value={total}
        icon={<FileProtectOutlined className="text-blue-600 dark:text-blue-400 text-sm" />}
        bgIcon={<FileProtectOutlined className="text-blue-600 dark:text-blue-400" />}
        trend="+5"
        bg="bg-blue-50 dark:bg-blue-500/10"
      />
      <StatCard
        title="Video KYC Queue"
        value={videoKycCount}
        icon={<VideoCameraOutlined className="text-cyan-500 text-sm" />}
        bgIcon={<VideoCameraOutlined className="text-cyan-500" />}
        bg="bg-cyan-50 dark:bg-cyan-900/20"
        isPulsing={videoKycCount > 0}
        onClick={() => onSelectView?.("video_kyc")}
        isActive={activeView === "video_kyc"}
      />
      <StatCard
        title="Pending Auth"
        value={totalPending}
        icon={<SafetyCertificateOutlined className="text-orange-500 text-sm" />}
        bgIcon={<SafetyCertificateOutlined className="text-orange-500" />}
        bg="bg-orange-50 dark:bg-orange-900/20"
        onClick={() => onSelectView?.("pending")}
        isActive={activeView === "pending"}
      />
      <StatCard
        title="Docs Rejected"
        value={docsRejected}
        icon={<FileExclamationOutlined className="text-amber-500 text-sm" />}
        bgIcon={<FileExclamationOutlined className="text-amber-500" />}
        bg="bg-amber-50 dark:bg-amber-900/20"
        onClick={() => onSelectView?.("doc_rejected")}
        isActive={activeView === "doc_rejected"}
      />
      <StatCard
        title="Rejected"
        value={rejected}
        icon={<CloseCircleOutlined className="text-rose-500 text-sm" />}
        bgIcon={<CloseCircleOutlined className="text-rose-500" />}
        bg="bg-rose-50 dark:bg-rose-900/20"
        onClick={() => onSelectView?.("rejected")}
        isActive={activeView === "rejected"}
      />
    </div>
  );
};

export default ApplicationStats;
