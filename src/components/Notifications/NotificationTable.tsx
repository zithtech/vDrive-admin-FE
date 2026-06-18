import React from "react";
import { Table, Tag, Button, Space, Tooltip } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  BellOutlined,
  SendOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

interface NotificationTableProps {
  data: any[];
  loading: boolean;
  onEdit: (record: any) => void;
  onDelete: (id: string) => void;
  onOpenNotifyModal: (record: any) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const NotificationTable: React.FC<NotificationTableProps> = ({
  data,
  loading,
  onEdit,
  onDelete,
  onOpenNotifyModal,
  canUpdate = false,
  canDelete = false,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Tag icon={<ClockCircleOutlined />} color="warning" className="rounded-full px-3 py-0.5 font-bold text-[10px] uppercase">Pending</Tag>;
      case "PROCESSING":
        return <Tag icon={<SyncOutlined spin />} color="processing" className="rounded-full px-3 py-0.5 font-bold text-[10px] uppercase">Processing</Tag>;
      case "COMPLETED":
        return <Tag icon={<CheckCircleOutlined />} color="success" className="rounded-full px-3 py-0.5 font-bold text-[10px] uppercase">Completed</Tag>;
      case "FAILED":
        return <Tag color="error" className="rounded-full px-3 py-0.5 font-bold text-[10px] uppercase">Failed</Tag>;
      default:
        return null;
    }
  };

  const columns = [
    {
      title: "NOTIFICATION",
      key: "notification",
      width: 250,
      render: (record: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm">
            <BellOutlined />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 tracking-tight">{record.title}</span>
            <span className="text-[11px] text-slate-400 line-clamp-1">{record.body}</span>
          </div>
        </div>
      ),
    },
    {
      title: "TARGET AUDIENCE",
      dataIndex: "target_audience",
      key: "target_audience",
      width: 140,
      render: (target: string) => {
        let color = "blue";
        if (target === "TOP_RIDE") color = "gold";
        if (target === "LOW_RIDE") color = "orange";
        if (target === "SPECIFIC") color = "purple";

        return (
          <Tag color={color} className="rounded-full px-3 font-bold border-none text-[10px] uppercase tracking-wider">
            {target?.replace("_", " ") || "ALL"}
          </Tag>
        );
      },
    },
    {
      title: "ATTACHED OFFER",
      key: "attached_offer",
      width: 140,
      render: (record: any) => (
        record.coupon_code || record.promo_code ? (
          <Tag color="green" className="rounded-full px-3 font-bold border-none text-[10px] uppercase tracking-wider">
            {record.coupon_code || record.promo_code}
          </Tag>
        ) : (
          <span className="text-gray-300 text-[10px] font-bold uppercase tracking-widest">— None —</span>
        )
      ),
    },
    {
      title: "DELIVERY STATUS",
      key: "notify_status",
      width: 160,
      render: (record: any) => (
        <div className="flex flex-col gap-1">
          {getStatusBadge(record.notify_status)}
          {record.notify_sent_at && (
            <span className="text-[9px] text-gray-400 italic">
              Sent: {dayjs(record.notify_sent_at).format("MMM DD, HH:mm")}
            </span>
          )}
          {record.notify_count > 0 && (
            <span className="text-[9px] text-blue-500 font-bold">
              Total Sent: {record.notify_count}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "CREATED AT",
      dataIndex: "created_at",
      key: "created_at",
      width: 140,
      render: (date: string) => (
        <div className="flex flex-col">
          <span className="text-slate-600 font-bold text-xs">{dayjs(date).format("DD MMM YYYY")}</span>
          <span className="text-[10px] text-slate-400 font-medium">{dayjs(date).format("hh:mm A")}</span>
        </div>
      ),
    },
    {
      title: "NOTIFY",
      key: "notify",
      width: 180,
      render: (record: any) => (
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => onOpenNotifyModal(record)}
          className="rounded-xl font-bold text-[10px] uppercase tracking-widest h-9 px-4 !bg-gradient-to-r !from-indigo-600 !to-blue-500 border-none shadow-sm flex items-center gap-2"
        >
          Send Notification
        </Button>
      ),
    },
    ...(canUpdate || canDelete ? [
      {
        title: "ACTIONS",
        key: "actions",
        fixed: "right" as const,
        width: 100,
        render: (record: any) => (
          <Space size="middle">
            {canUpdate && (
              <Tooltip title="Edit Notification">
                <Button
                  type="text"
                  icon={<EditOutlined className="text-indigo-500" />}
                  onClick={() => onEdit(record)}
                  className="hover:bg-indigo-50 rounded-lg transition-all"
                />
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip title="Delete">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(record.id)}
                  className="hover:bg-rose-50 rounded-lg transition-all"
                />
              </Tooltip>
            )}
          </Space>
        ),
      }
    ] : []),
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        className: "premium-pagination pt-4",
      }}
      className="premium-table-alt"
      scroll={{ x: 800 }}
    />
  );
};

export default NotificationTable;
