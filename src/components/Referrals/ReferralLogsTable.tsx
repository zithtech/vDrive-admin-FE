import React from "react";
import { Table, Tag,Typography } from "antd";
import { UserOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { type ReferralLog } from "../../store/slices/referralSlice";

const { Text } = Typography;

interface ReferralLogsTableProps {
  data: ReferralLog[];
  loading: boolean;
  type: "CUSTOMER" | "DRIVER";
}

const ReferralLogsTable: React.FC<ReferralLogsTableProps> = ({ data, loading, type }) => {
  const isDriver = type === "DRIVER";

  const columns = [
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Date</span>,
      dataIndex: "referred_at",
      key: "referred_at",
      render: (text: string) => (
        <div className="flex flex-col">
          <span className="text-xs font-bold text-gray-700 dark:text-slate-200">{dayjs(text).format("DD MMM YYYY")}</span>
          <span className="text-[10px] text-gray-400 font-medium">{dayjs(text).format("hh:mm A")}</span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Referrer ({isDriver ? 'Driver' : 'User'})</span>,
      key: "referrer",
      render: (_: any, record: ReferralLog) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${isDriver ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400' : 'bg-purple-50 dark:bg-purple-500/10 text-purple-500 dark:text-purple-400'} flex items-center justify-center`}>
            <UserOutlined />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none mb-1">{record.referrer_name}</span>
            <Text className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">{record.referrer_phone}</Text>
          </div>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Referral Code</span>,
      dataIndex: "referral_code",
      key: "referral_code",
      render: (text: string) => (
        <Tag className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded">
          {text}
        </Tag>
      ),
    },
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Referee ({isDriver ? 'Driver' : 'User'})</span>,
      key: "referee",
      render: (_: any, record: ReferralLog) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${isDriver ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400' : 'bg-pink-50 dark:bg-pink-500/10 text-pink-500 dark:text-pink-400'} flex items-center justify-center`}>
            <UserOutlined />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none mb-1">{record.referee_name || "Unknown"}</span>
            <Text className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">{record.referee_phone || "N/A"}</Text>
          </div>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Status</span>,
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "gray";
        let icon = <ClockCircleOutlined />;
        let label = status;

        if (status === "COMPLETED") {
          color = "emerald";
          icon = <CheckCircleOutlined />;
          label = "Rewarded";
        } else if (status === "PENDING") {
          color = "amber";
          icon = <ClockCircleOutlined />;
          label = isDriver ? "Pending Ride" : "Pending Activity";
        } else if (status === "EXPIRED") {
          color = "rose";
          icon = <ExclamationCircleOutlined />;
        }

        return (
          <Tag className={`bg-${color}-50 dark:bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 border-${color}-100 dark:border-${color}-500/30 flex items-center gap-1.5 w-fit px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-widest`}>
            {icon} {label}
          </Tag>
        );
      },
    },
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Reward</span>,
      dataIndex: "reward_amount",
      key: "reward_amount",
      render: (amount: any, record: ReferralLog) => (
        <div className="flex flex-col">
          <span className={`text-xs font-black ${record.status === 'COMPLETED' ? 'text-emerald-600' : 'text-gray-400'}`}>
            ₹{parseFloat(amount as string || "0").toFixed(2)}
          </span>
          {record.completed_at && (
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
              Issued {dayjs(record.completed_at).format("DD MMM")}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ 
          pageSize: 10,
          className: "px-6 pb-4",
          showTotal: (total) => <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{total} Referrals Total</span>
        }}
        className="premium-table"
      />
    </div>
  );
};

export default ReferralLogsTable;
