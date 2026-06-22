import React from "react";
import { Table, Tag, Typography } from "antd";
import {
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { type ReferralLog } from "../../store/slices/referralSlice";

const { Text } = Typography;

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
      title: "Date",
      dataIndex: "referred_at",
      key: "referred_at",
      render: (text: string) => (
        <div className="flex flex-col text-xs">
          <span>{dayjs(text).format("DD MMM YYYY")}</span>
          <span className="text-gray-400">{dayjs(text).format("hh:mm A")}</span>
        </div>
      ),
    },
    {
      title: `Referrer (${isDriver ? "Driver" : "User"})`,
      key: "referrer",
      render: (_: any, record: ReferralLog) => (
        <div className="flex items-center gap-2">
          <UserOutlined className={isDriver ? "text-indigo-500" : "text-purple-500"} />
          <div className="flex flex-col text-xs">
            <span className="font-semibold">{record.referrer_name}</span>
            <Text className="text-gray-400 font-mono">{record.referrer_phone}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Referral Code",
      dataIndex: "referral_code",
      key: "referral_code",
      render: (text: string) => (
        <Tag className="font-mono">{text}</Tag>
      ),
    },
    {
      title: `Referee (${isDriver ? "Driver" : "User"})`,
      key: "referee",
      render: (_: any, record: ReferralLog) => (
        <div className="flex items-center gap-2">
          <UserOutlined className={isDriver ? "text-blue-500" : "text-pink-500"} />
          <div className="flex flex-col text-xs">
            <span className="font-semibold">{record.referee_name || "Unknown"}</span>
            <Text className="text-gray-400 font-mono">{record.referee_phone || "N/A"}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        let icon = <ClockCircleOutlined />;
        let label = status;

        if (status === "COMPLETED") {
          color = "success";
          icon = <CheckCircleOutlined />;
          label = "Rewarded";
        } else if (status === "PENDING") {
          color = "warning";
          icon = <ClockCircleOutlined />;
          label = isDriver ? "Pending Ride" : "Pending Activity";
        } else if (status === "EXPIRED") {
          color = "error";
          icon = <ExclamationCircleOutlined />;
        }

        return (
          <Tag color={color} icon={icon}>
            {label}
          </Tag>
        );
      },
    },
    {
      title: "Reward",
      dataIndex: "reward_amount",
      key: "reward_amount",
      render: (amount: any, record: ReferralLog) => (
        <div className="flex flex-col text-xs">
          <span className={record.status === "COMPLETED" ? "text-green-600 font-semibold" : "text-gray-500"}>
            ₹{parseFloat((amount as string) || "0").toFixed(2)}
          </span>
          {record.completed_at && (
            <span className="text-gray-400">
              Issued {dayjs(record.completed_at).format("DD MMM")}
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={{ position: ["none"], current: currentPage, pageSize: pageSize, onChange: onPageChange }}
      size="middle"
    />
  );
};

export default ReferralLogsTable;
