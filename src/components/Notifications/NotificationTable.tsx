import React from "react";
import { Table, Button, Dropdown } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  BellOutlined,
  SendOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  EllipsisOutlined,
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

  const getTargetAudienceBadge = (target: string) => {
    let bg = "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
    if (target === "TOP_RIDE") {
      bg = "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
    } else if (target === "LOW_RIDE") {
      bg = "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400";
    } else if (target === "SPECIFIC") {
      bg = "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400";
    }

    return (
      <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider border-none w-fit inline-block ${bg}`}>
        {target?.replace("_", " ") || "ALL"}
      </span>
    );
  };

  const getOfferBadge = (record: any) => {
    const code = record.coupon_code || record.promo_code;
    if (code) {
      return (
        <span className="px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-none w-fit inline-block">
          {code}
        </span>
      );
    }
    return (
      <span className="text-slate-300 dark:text-slate-650 text-[10px] font-bold tracking-widest">
        —
      </span>
    );
  };

  const columns = [
    {
      title: "NOTIFICATION",
      key: "notification",
      width: 250,
      render: (record: any) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400 shadow-sm flex-shrink-0">
            <BellOutlined className="text-xs" />
          </div>
          <div className="flex flex-col min-w-0 justify-center gap-0.5">
            <span className="font-extrabold text-slate-800 dark:text-slate-100 tracking-tight text-xs leading-none truncate">
              {record.title}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1">
              {record.body}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "TARGET AUDIENCE",
      dataIndex: "target_audience",
      key: "target_audience",
      width: 140,
      render: (target: string) => getTargetAudienceBadge(target),
    },
    {
      title: "ATTACHED OFFER",
      key: "attached_offer",
      width: 140,
      render: (record: any) => getOfferBadge(record),
    },
    {
      title: "DELIVERY STATUS",
      key: "notify_status",
      width: 170,
      render: (record: any) => (
        <div className="flex flex-col gap-0.5 justify-center">
          <div>{getStatusBadge(record.notify_status)}</div>
          {(record.notify_sent_at || record.notify_count > 0) && (
            <div className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500 font-semibold whitespace-nowrap">
              {record.notify_sent_at && (
                <span>{dayjs(record.notify_sent_at).format("MMM DD, HH:mm")}</span>
              )}
              {record.notify_sent_at && record.notify_count > 0 && (
                <span className="text-slate-300 dark:text-slate-700">•</span>
              )}
              {record.notify_count > 0 && (
                <span className="text-blue-500 dark:text-blue-400">
                  {record.notify_count} sent
                </span>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "CREATED AT",
      dataIndex: "created_at",
      key: "created_at",
      width: 130,
      render: (date: string) => (
        <div className="flex flex-col gap-0.5 justify-center">
          <span className="text-slate-700 dark:text-slate-300 font-semibold text-xs whitespace-nowrap">
            {dayjs(date).format("DD MMM YYYY")}
          </span>
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
            {dayjs(date).format("hh:mm A")}
          </span>
        </div>
      ),
    },
    {
      title: "NOTIFY",
      key: "notify",
      width: 100,
      render: (record: any) => (
        <Button
          type="primary"
          icon={<SendOutlined style={{ fontSize: "10px" }} />}
          onClick={() => onOpenNotifyModal(record)}
          className="rounded-md font-bold text-[9px] uppercase tracking-wider h-7 px-2.5 !bg-blue-600 hover:!bg-blue-700 text-white border-none shadow-sm flex items-center gap-1 transition-all"
        >
          Send
        </Button>
      ),
    },
    ...(canUpdate || canDelete
      ? [
          {
            title: "ACTIONS",
            key: "actions",
            fixed: "right" as const,
            width: 80,
            align: "center" as const,
            render: (record: any) => {
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
                        icon: <DeleteOutlined className="text-rose-500" />,
                        label: <span className="font-semibold text-xs text-rose-600">Delete</span>,
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
        .premium-table-compact .ant-table-tbody > tr > td {
          padding: 8px 12px !important;
          border-bottom: 1px solid #f1f5f9 !important;
          background: #ffffff !important;
        }
        .premium-table-compact .ant-table-tbody > tr:hover > td {
          background: #f8fafc !important;
        }
        .premium-table-compact .ant-table-cell-row-hover {
          background: #f8fafc !important;
        }
        .premium-table-compact .ant-table {
          background: transparent !important;
        }

        /* Dark mode overrides for compact table */
        .dark .premium-table-compact .ant-table-thead > tr > th {
          background: #1e293b !important;
          color: #94a3b8 !important;
          border-bottom: 1px solid #334155 !important;
        }
        .dark .premium-table-compact .ant-table-tbody > tr > td {
          background: #0f172a !important;
          border-bottom: 1px solid #1e293b !important;
          color: #cbd5e1 !important;
        }
        .dark .premium-table-compact .ant-table-tbody > tr:hover > td {
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
          loading={loading}
          rowKey="id"
          pagination={false}
          className="premium-table-compact"
          scroll={{ x: 800 }}
          size="small"
        />
      </div>
    </>
  );
};

export default NotificationTable;
