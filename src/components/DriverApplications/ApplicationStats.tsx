import React from "react";
import { FileProtectOutlined, SafetyCertificateOutlined, FileExclamationOutlined, CloseCircleOutlined } from "@ant-design/icons";
import type { Driver } from "../../store/slices/driverSlice";

interface ApplicationStatsProps {
  drivers: Driver[];
  loading?: boolean;
}

const StatCard = ({ title, value, icon, bgIcon, trend, bg }: any) => {
  return (
    <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] rounded-[10px] shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0 ${bg}`}>
            {icon}
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest">{title}</p>
        </div>
        {trend && (
          <div className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
            <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {trend}
          </div>
        )}
      </div>

      <div className="flex items-end justify-between mt-2">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{value}</h3>
            <span className="text-[10px] text-slate-400 font-semibold mb-0.5">APPLICATIONS</span>
          </div>
        </div>
      </div>

      {/* Background Icon */}
      <div className="absolute -bottom-6 -right-6 text-[100px] opacity-[0.06] pointer-events-none">
        {bgIcon}
      </div>
    </div>
  );
};

const ApplicationStats: React.FC<ApplicationStatsProps> = ({ drivers }) => {
  const totalPending = drivers.filter((d) => d.status !== "rejected" && d.onboarding_status !== "DOCS_REJECTED").length;
  const docsRejected = drivers.filter((d) => d.status !== "rejected" && d.onboarding_status === "DOCS_REJECTED").length;
  const rejected = drivers.filter((d) => d.status === "rejected").length;
  const total = drivers.length; // Basically total tracked in this page

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Applications"
        value={total}
        icon={<FileProtectOutlined className="text-blue-600 dark:text-blue-400 text-base" />}
        bgIcon={<FileProtectOutlined className="text-blue-600 dark:text-blue-400" />}
        trend="+5"
        bg="bg-blue-50 dark:bg-blue-500/10"
      />
      <StatCard
        title="Pending Verification"
        value={totalPending}
        icon={<SafetyCertificateOutlined className="text-orange-500 text-base" />}
        bgIcon={<SafetyCertificateOutlined className="text-orange-500" />}
        trend="+3"
        bg="bg-orange-50 dark:bg-orange-900/20"
      />
      <StatCard
        title="Docs Rejected"
        value={docsRejected}
        icon={<FileExclamationOutlined className="text-amber-500 text-base" />}
        bgIcon={<FileExclamationOutlined className="text-amber-500" />}
        bg="bg-amber-50 dark:bg-amber-900/20"
      />
      <StatCard
        title="Rejected"
        value={rejected}
        icon={<CloseCircleOutlined className="text-rose-500 text-base" />}
        bgIcon={<CloseCircleOutlined className="text-rose-500" />}
        bg="bg-rose-50 dark:bg-rose-900/20"
      />
    </div>
  );
};

export default ApplicationStats;
