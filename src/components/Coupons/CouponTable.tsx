import React, { useState } from "react";
import { Table, Button, Switch, Tooltip, Space, Tag } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { type Coupon } from "../../store/slices/couponSlice";
import dayjs from "dayjs";
import NotifyModal from "./NotifyModal";

interface CouponTableProps {
  data: Coupon[];
  loading: boolean;
  onEdit: (record: Coupon) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, is_active: boolean) => void;
  onRefresh: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number, size: number) => void;
}

const CouponTable: React.FC<CouponTableProps> = ({
  data,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  onRefresh,
  canUpdate = false,
  canDelete = false,
  currentPage = 1,
  pageSize = 15,
  onPageChange,
}) => {
  const [notifyModalVisible, setNotifyModalVisible] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const handleNotify = (record: Coupon) => {
    setSelectedCoupon(record);
    setNotifyModalVisible(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Tag icon={<ClockCircleOutlined />} color="warning">Pending</Tag>;
      case "PROCESSING":
        return <Tag icon={<SyncOutlined spin />} color="processing">Processing</Tag>;
      case "COMPLETED":
        return <Tag icon={<CheckCircleOutlined />} color="success">Completed</Tag>;
      case "FAILED":
        return <Tag color="error">Failed</Tag>;
      default:
        return null;
    }
  };

  const columns = [
    {
      title: "Promo Code",
      dataIndex: "code",
      key: "code",
      render: (text: string) => (
        <span className="font-mono text-blue-600 font-semibold">{text}</span>
      ),
    },
    {
      title: "Discount Offer",
      key: "discount",
      render: (_: any, record: any) => {
        if (record.discount_type?.toUpperCase() === "PERCENTAGE") {
          return <Tag color="blue">{record.discount_value}% OFF</Tag>;
        }
        if (record.discount_type?.toUpperCase() === "FIXED") {
          return <Tag color="green">₹{record.discount_value} OFF</Tag>;
        }
        return <Tag color="purple">FREE RIDE</Tag>;
      },
    },
    {
      title: "Validity Period",
      key: "validity",
      render: (_: any, record: any) => {
        const fromDate = record.valid_from || record.start_date;
        const untilDate = record.valid_until || record.expiry_date;
        const isExpired = dayjs().isAfter(dayjs(untilDate));
        return (
          <div className="flex flex-col text-xs gap-1">
            <div><span className="text-gray-500">From:</span> {dayjs(fromDate).format("MMM DD, YYYY")}</div>
            <div className={isExpired ? "text-red-500" : ""}>
              <span className="text-gray-500">To:</span> {dayjs(untilDate).format("MMM DD, YYYY")}
              {isExpired && <span className="ml-1 text-red-500">(Expired)</span>}
            </div>
          </div>
        );
      },
    },
    {
      title: "Notify Status",
      key: "notify_status",
      render: (_: any, record: any) => (
        <div className="flex flex-col gap-1 text-xs">
          <div>{getStatusBadge(record.notify_status)}</div>
          {record.notify_sent_at && (
            <span className="text-gray-400">
              Last: {dayjs(record.notify_sent_at).format("MMM DD, HH:mm")}
            </span>
          )}
          {record.notify_count > 0 && (
            <span className="text-blue-500 font-semibold">
              Total Sent: {record.notify_count}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Notification",
      key: "notify_action",
      render: (_: any, record: any) => {
        const isExpired = dayjs().isAfter(dayjs(record.valid_until || record.expiry_date));
        const isActive = record.is_active;
        const isProcessing = record.notify_status === "PROCESSING";
        const isDisabled = !isActive || isExpired || isProcessing;

        let tooltipMsg = "Send campaign email to target audience";
        if (!isActive) tooltipMsg = "Coupon is currently disabled";
        else if (isExpired) tooltipMsg = "Coupon has expired and cannot be sent";
        else if (isProcessing) tooltipMsg = "Campaign is currently being processed";

        return (
          <Tooltip title={tooltipMsg}>
            <Button
              type="default"
              icon={<SendOutlined />}
              onClick={() => handleNotify(record)}
              disabled={isDisabled}
              size="small"
            >
              Email
            </Button>
          </Tooltip>
        );
      },
    },
    {
      title: "Status",
      key: "is_active",
      render: (_: any, record: any) => {
        const isExpired = dayjs().isAfter(dayjs(record.valid_until || record.expiry_date));
        const finalActive = record.is_active && !isExpired;

        const switchDisabled = !canUpdate || isExpired;
        const switchTooltip = isExpired
          ? "This coupon has expired and cannot be reactivated until you update the expiry date"
          : !canUpdate
            ? "Insufficient permissions to change status"
            : "";

        return (
          <div className="flex items-center gap-2">
            <Tooltip title={switchTooltip}>
              <Switch
                size="small"
                checked={finalActive}
                disabled={switchDisabled}
                onChange={(checked) => onToggleStatus(record.id, checked)}
              />
            </Tooltip>
            <span className={`text-xs ${finalActive ? "text-green-600" : "text-gray-400"}`}>
              {finalActive ? "Active" : isExpired ? "Expired" : "Disabled"}
            </span>
          </div>
        );
      },
    },
    ...(canUpdate || canDelete
      ? [
          {
            title: "Actions",
            key: "actions",
            render: (_: any, record: Coupon) => (
              <Space size="small">
                {canUpdate && (
                  <Tooltip title="Edit Promotion">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => onEdit(record)}
                      size="small"
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
                      size="small"
                    />
                  </Tooltip>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ position: ["none"], current: currentPage, pageSize: pageSize, onChange: onPageChange }}
        size="small"
      />

      {selectedCoupon && (
        <NotifyModal
          visible={notifyModalVisible}
          onCancel={() => setNotifyModalVisible(false)}
          coupon={selectedCoupon}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
};

export default CouponTable;
