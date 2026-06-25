import React from "react";
import { Table } from "antd";
import {
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { type ReferralLog } from "../../store/slices/referralSlice";

interface ReferralLogsTableProps {
  data: ReferralLog[];
  loading: boolean;
  type: "CUSTOMER" | "DRIVER";
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number, size: number) => void;
}

const ReferralLogsTable: React.FC<ReferralLogsTableProps> = ({ 
  data, 
  loading, 
  type,
  currentPage = 1,
  pageSize = 15,
  onPageChange
}) => {
  const isDriver = type === "DRIVER";

  const columns = [
    {
      title: "DATE",
      dataIndex: "referred_at",
      key: "referred_at",
      render: (text: string) => (
        <div className="flex flex-col gap-0.5 justify-center">
          <span className="text-slate-700 dark:text-slate-300 font-semibold text-xs whitespace-nowrap">
            {dayjs(text).format("DD MMM YYYY")}
          </span>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
            {dayjs(text).format("hh:mm A")}
          </span>
        </div>
      ),
    },
    {
      title: `REFERRER (${isDriver ? "DRIVER" : "USER"})`,
      key: "referrer",
      render: (_: any, record: ReferralLog) => (
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${isDriver ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400' : 'bg-purple-50 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400'} flex items-center justify-center shadow-sm flex-shrink-0`}>
            <UserOutlined className="text-xs" />
          </div>
          <div className="flex flex-col min-w-0 justify-center gap-0.5">
            <span className="font-extrabold text-slate-800 dark:text-slate-100 tracking-tight text-xs leading-none truncate">
              {record.referrer_name}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              {record.referrer_phone}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "REFERRAL CODE",
      dataIndex: "referral_code",
      key: "referral_code",
      render: (text: string) => (
        <span className="px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider border-none w-fit inline-block bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-mono">
          {text}
        </span>
      ),
    },
    {
      title: `REFEREE (${isDriver ? "DRIVER" : "USER"})`,
      key: "referee",
      render: (_: any, record: ReferralLog) => (
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${isDriver ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400' : 'bg-pink-50 dark:bg-pink-500/10 text-pink-500 dark:text-pink-400'} flex items-center justify-center shadow-sm flex-shrink-0`}>
            <UserOutlined className="text-xs" />
          </div>
          <div className="flex flex-col min-w-0 justify-center gap-0.5">
            <span className="font-extrabold text-slate-800 dark:text-slate-100 tracking-tight text-xs leading-none truncate">
              {record.referee_name || "Unknown"}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              {record.referee_phone || "N/A"}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let bg = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
        let icon = null;
        let label = status;

        if (status === "COMPLETED") {
          bg = "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";
          icon = <CheckCircleOutlined className="text-[10px]" />;
          label = "Rewarded";
        } else if (status === "PENDING") {
          bg = "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
          icon = <ClockCircleOutlined className="text-[10px]" />;
          label = isDriver ? "Pending Ride" : "Pending Activity";
        } else if (status === "EXPIRED") {
          bg = "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400";
          icon = <ExclamationCircleOutlined className="text-[10px]" />;
        }

        return (
          <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider inline-flex items-center gap-1 border-none ${bg}`}>
            {icon}
            {label}
          </span>
        );
      },
    },
    {
      title: "REWARD",
      dataIndex: "reward_amount",
      key: "reward_amount",
      render: (amount: any, record: ReferralLog) => (
        <div className="flex flex-col gap-0.5 justify-center">
          <span className={`font-semibold text-xs whitespace-nowrap ${record.status === "COMPLETED" ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
            ₹{parseFloat((amount as string) || "0").toFixed(2)}
          </span>
          {record.completed_at && (
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
              Issued {dayjs(record.completed_at).format("DD MMM")}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <style>{`
        /* Compact premium table flat styles */
        .premium-table-compact .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          font-size: 10px !important;
          letter-spacing: 0.05em !important;
          border-bottom: 1px solid #e2e8f0 !important;
          padding: 8px 12px !important;
        }
        .premium-table-compact .ant-table-tbody > tr:not(.ant-table-measure-row) > td {
          padding: 8px 12px !important;
          border-bottom: 1px solid #f1f5f9 !important;
          background: #ffffff !important;
        }
        .premium-table-compact .ant-table-tbody > tr:not(.ant-table-measure-row):hover > td {
          background: #f8fafc !important;
        }
        .premium-table-compact .ant-table-cell-row-hover {
          background: #f8fafc !important;
        }
        .premium-table-compact .ant-table {
          background: transparent !important;
        }
        .premium-table-compact table {
          border-collapse: collapse !important;
          border-spacing: 0 !important;
        }

        /* Dark mode overrides for compact table */
        .dark .premium-table-compact .ant-table-thead > tr > th {
          background: #1e293b !important;
          color: #94a3b8 !important;
          border-bottom: 1px solid #334155 !important;
        }
        .dark .premium-table-compact .ant-table-tbody > tr:not(.ant-table-measure-row) > td {
          background: #0f172a !important;
          border-bottom: 1px solid #1e293b !important;
          color: #cbd5e1 !important;
        }
        .dark .premium-table-compact .ant-table-tbody > tr:not(.ant-table-measure-row):hover > td {
          background: #1e293b !important;
        }
        .dark .premium-table-compact .ant-table-cell-row-hover {
          background: #1e293b !important;
        }
      `}</style>
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0 h-full">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ position: ["none"], current: currentPage, pageSize: pageSize, onChange: onPageChange }}
          className="premium-table-compact"
          scroll={{ x: 1000, y: 'calc(100vh - 350px)' }}
          size="small"
        />
      </div>
    </>
  );
};

export default ReferralLogsTable;
