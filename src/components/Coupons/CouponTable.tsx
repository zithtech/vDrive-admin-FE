import React, { useState } from "react";
import { Table, Button, Switch, Tooltip, Dropdown } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  EllipsisOutlined,
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
    let bg = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    let icon = null;
    let label = status;

    switch (status) {
      case "PENDING":
        bg = "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
        icon = <ClockCircleOutlined className="text-[10px]" />;
        label = "Pending";
        break;
      case "PROCESSING":
        bg = "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
        icon = <SyncOutlined spin className="text-[10px]" />;
        label = "Processing";
        break;
      case "COMPLETED":
        bg = "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";
        icon = <CheckCircleOutlined className="text-[10px]" />;
        label = "Completed";
        break;
      case "FAILED":
        bg = "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400";
        icon = <CheckCircleOutlined className="text-[10px]" />;
        label = "Failed";
        break;
      default:
        break;
    }

    return (
      <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider inline-flex items-center gap-1 border-none ${bg}`}>
        {icon}
        {label}
      </span>
    );
  };

  const columns = [
    {
      title: "PROMO CODE",
      dataIndex: "code",
      key: "code",
      render: (text: string) => (
        <span className="font-extrabold text-blue-600 dark:text-blue-400 tracking-tight text-xs uppercase leading-none">
          {text}
        </span>
      ),
    },
    {
      title: "DISCOUNT OFFER",
      key: "discount",
      render: (_: any, record: any) => {
        let bg = "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400";
        let label = "FREE RIDE";
        if (record.discount_type?.toUpperCase() === "PERCENTAGE") {
          bg = "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
          label = `${record.discount_value}% OFF`;
        } else if (record.discount_type?.toUpperCase() === "FIXED") {
          bg = "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";
          label = `₹${record.discount_value} OFF`;
        }
        return (
          <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider border-none w-fit inline-block ${bg}`}>
            {label}
          </span>
        );
      },
    },
    {
      title: "VALIDITY PERIOD",
      key: "validity",
      render: (_: any, record: any) => {
        const fromDate = record.valid_from || record.start_date;
        const untilDate = record.valid_until || record.expiry_date;
        const isExpired = dayjs().isAfter(dayjs(untilDate));
        return (
          <div className="flex flex-col gap-0.5 justify-center">
            <span className="text-slate-700 dark:text-slate-300 font-semibold text-xs whitespace-nowrap">
              <span className="text-slate-400 font-normal">From:</span> {dayjs(fromDate).format("DD MMM YYYY")}
            </span>
            <span className={`text-[9px] font-medium ${isExpired ? "text-rose-500" : "text-slate-500"}`}>
              <span className="text-slate-400 font-normal text-xs">To:</span> {dayjs(untilDate).format("DD MMM YYYY")}
              {isExpired && <span className="ml-1 font-bold">(Expired)</span>}
            </span>
          </div>
        );
      },
    },
    {
      title: "NOTIFY STATUS",
      key: "notify_status",
      render: (_: any, record: any) => (
        <div className="flex flex-col gap-0.5 justify-center">
          <div>{getStatusBadge(record.notify_status || "PENDING")}</div>
          {(record.notify_sent_at || record.notify_count > 0) && (
            <div className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap mt-0.5">
              {record.notify_sent_at && (
                <span>Last: {dayjs(record.notify_sent_at).format("MMM DD, HH:mm")}</span>
              )}
              {record.notify_sent_at && record.notify_count > 0 && (
                <span className="text-slate-300 dark:text-slate-700">•</span>
              )}
              {record.notify_count > 0 && (
                <span className="text-blue-500 dark:text-blue-400">
                  Total Sent: {record.notify_count}
                </span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "NOTIFICATION",
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
              type="primary"
              icon={<SendOutlined style={{ fontSize: "10px" }} />}
              onClick={() => handleNotify(record)}
              disabled={isDisabled}
              className={`rounded-md font-bold text-[9px] uppercase tracking-wider h-7 px-2.5 shadow-sm flex items-center gap-1 transition-all border-none ${
                isDisabled
                  ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  : "!bg-blue-600 hover:!bg-blue-700 text-white"
              }`}
            >
              Email
            </Button>
          </Tooltip>
        );
      },
    },
    {
      title: "STATUS",
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
            <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider border-none w-fit inline-block ${
              finalActive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                : isExpired
                  ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }`}>
              {finalActive ? "Active" : isExpired ? "Expired" : "Disabled"}
            </span>
          </div>
        );
      },
    },
    ...(canUpdate || canDelete
      ? [
          {
            title: "ACTIONS",
            key: "actions",
            fixed: "right" as const,
            width: 80,
            align: "center" as const,
            render: (_: any, record: Coupon) => {
              const menuItems = [
                ...(canUpdate
                  ? [
                      {
                        key: "edit",
                        icon: <EditOutlined className="text-slate-500" />,
                        label: <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">Edit</span>,
                      },
                    ]
                  : []),
                ...(canDelete
                  ? [
                      {
                        key: "delete",
                        icon: <DeleteOutlined />,
                        label: <span className="font-semibold text-xs">Delete</span>,
                        danger: true,
                      },
                    ]
                  : []),
              ];

              return (
                <Dropdown
                  menu={{
                    items: menuItems,
                    onClick: ({ key }) => {
                      if (key === "edit") {
                        onEdit(record);
                      } else if (key === "delete") {
                        onDelete(record.id);
                      }
                    },
                  }}
                  trigger={["click"]}
                  placement="bottomRight"
                >
                  <Button
                    type="text"
                    icon={<EllipsisOutlined className="text-slate-500 dark:text-slate-400 text-base" />}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 p-0 cursor-pointer"
                  />
                </Dropdown>
              );
            },
          },
        ]
      : []),
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
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden pb-1">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ position: ["none"], current: currentPage, pageSize: pageSize, onChange: onPageChange }}
          className="premium-table-compact"
          scroll={{ x: 800 }}
          size="small"
        />
      </div>

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
