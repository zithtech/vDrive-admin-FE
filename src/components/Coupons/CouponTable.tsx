import React, { useState } from "react";
import { Table, Button, Switch, Tooltip, Space, Tag } from "antd";
import { EditOutlined, DeleteOutlined, SendOutlined, ClockCircleOutlined, CheckCircleOutlined, SyncOutlined } from "@ant-design/icons";
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
      title: <span className="text-[11px] uppercase tracking-widest font-bold text-gray-400">Promo Code</span>,
      dataIndex: "code",
      key: "code",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <div className="bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-500/30 shadow-sm">
            <span className="font-extrabold text-sm font-mono text-blue-700 tracking-widest">
              {text}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: <span className="text-[11px] uppercase tracking-widest font-bold text-gray-400">Discount Offer</span>,
      key: "discount",
      render: (_: any, record: any) => {
        if (record.discount_type?.toUpperCase() === "PERCENTAGE") {
          return (
            <div className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-md shadow-blue-100 w-fit">
              {record.discount_value}% OFF
            </div>
          );
        }
        if (record.discount_type?.toUpperCase() === "FIXED") {
          return (
            <div className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-md shadow-emerald-100 w-fit">
              ₹{record.discount_value} OFF
            </div>
          );
        }
        return (
          <div className="px-3 py-1 bg-gradient-to-r from-violet-600 to-purple-500 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-md shadow-violet-100 w-fit">
            FREE RIDE
          </div>
        );
      },
    },
    {
      title: <span className="text-[11px] uppercase tracking-widest font-bold text-gray-400">Validity Period</span>,
      key: "validity",
      render: (_: any, record: any) => {
        const fromDate = record.valid_from || record.start_date;
        const untilDate = record.valid_until || record.expiry_date;
        const isExpired = dayjs().isAfter(dayjs(untilDate));
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-slate-200">
              <span className="text-gray-300">FROM</span> {dayjs(fromDate).format("MMM DD, YYYY")}
            </div>
            <div className={`flex items-center gap-2 text-xs font-bold ${isExpired ? 'text-rose-500 dark:text-rose-400' : 'text-gray-700 dark:text-slate-200'}`}>
              <span className="text-gray-300 dark:text-slate-500 uppercase">THRU</span> {dayjs(untilDate).format("MMM DD, YYYY")}
              {isExpired && <span className="text-[10px] bg-rose-50 dark:bg-rose-500/10 px-1 rounded">EXPIRED</span>}
            </div>
          </div>
        )
      },
    },
    {
      title: <span className="text-[11px] uppercase tracking-widest font-bold text-gray-400">Notify Status</span>,
      key: "notify_status",
      render: (_: any, record: any) => (
        <div className="flex flex-col gap-1">
          {getStatusBadge(record.notify_status)}
          {record.notify_sent_at && (
            <span className="text-[9px] text-gray-400 italic">
              Last: {dayjs(record.notify_sent_at).format("MMM DD, HH:mm")}
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
      title: <span className="text-[11px] uppercase tracking-widest font-bold text-gray-400">Notification</span>,
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
            <div className="w-fit">
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => handleNotify(record)}
                disabled={isDisabled}
                className={`${isDisabled ? 'opacity-40 grayscale pointer-events-none' : '!bg-gradient-to-r !from-indigo-600 !to-blue-500 hover:scale-[1.05] hover:shadow-lg hover:shadow-blue-200'} transition-all border-none rounded-xl font-black text-[10px] uppercase tracking-widest h-10 px-5 flex items-center shadow-md shadow-indigo-100`}
              >
                Send in Email
              </Button>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: <span className="text-[11px] uppercase tracking-widest font-bold text-gray-400">Status</span>,
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
          <div className="flex items-center gap-3">
            <Tooltip title={switchTooltip}>
              <div className="flex items-center">
                <Switch
                  checked={finalActive}
                  disabled={switchDisabled}
                  onChange={(checked) => onToggleStatus(record.id, checked)}
                  className={`${finalActive ? '!bg-emerald-500' : 'bg-gray-300'} ${switchDisabled ? 'opacity-50' : ''}`}
                />
              </div>
            </Tooltip>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${finalActive ? 'text-emerald-600' : 'text-gray-400'}`}>
              {finalActive ? 'Active' : (isExpired ? 'Expired' : 'Disabled')}
            </span>
          </div>
        );
      },
    },
    ...(canUpdate || canDelete ? [
      {
        title: <span className="text-[11px] uppercase tracking-widest font-bold text-gray-400">Actions</span>,
        key: "actions",
        render: (_: any, record: Coupon) => (
          <Space size="small">
            {canUpdate && (
              <Tooltip title="Edit Promotion">
                <Button
                  type="text"
                  icon={<EditOutlined className="text-gray-500 dark:text-slate-400" />}
                  onClick={() => onEdit(record)}
                  className="hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-lg h-9 w-9 flex items-center justify-center transition-colors"
                />
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip title="Remove Permanent">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(record.id)}
                  className="hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg h-9 w-9 flex items-center justify-center transition-colors"
                />
              </Tooltip>
            )}
          </Space>
        ),
      }
    ] : []),
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        className="premium-table shadow-sm rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700"
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
