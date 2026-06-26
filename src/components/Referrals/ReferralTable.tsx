import React from "react";
import { Table, Button, Switch, Dropdown } from "antd";
import { EditOutlined, DeleteOutlined, UserOutlined, CarOutlined, EllipsisOutlined } from "@ant-design/icons";
import { type ReferralConfig } from "../../store/slices/referralSlice";

interface ReferralTableProps {
  data: ReferralConfig[];
  loading: boolean;
  onEdit: (record: ReferralConfig) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, is_active: boolean) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number, size: number) => void;
}

const ReferralTable: React.FC<ReferralTableProps> = ({
  data,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  canUpdate = false,
  canDelete = false,
  currentPage = 1,
  pageSize = 15,
  onPageChange,
}) => {
  const columns = [
    {
      title: "TARGET AUDIENCE",
      dataIndex: "user_type",
      key: "user_type",
      render: (text: string) => (
        <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider border-none w-fit inline-flex items-center gap-1 ${text === "CUSTOMER"
            ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
            : "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
          }`}>
          {text === "CUSTOMER" ? <UserOutlined /> : <CarOutlined />}
          {text.toLowerCase()}
        </span>
      ),
    },
    {
      title: "REFERRER REWARD",
      key: "referrer_reward",
      render: (_: any, record: ReferralConfig) => (
        <span className="px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border-none w-fit inline-block">
          {record.referrer_reward_type === "PERCENTAGE"
            ? `${record.referrer_reward}% DISCOUNT`
            : `₹${record.referrer_reward} CREDIT`}
        </span>
      ),
    },
    {
      title: "REFEREE REWARD",
      key: "referee_reward",
      render: (_: any, record: ReferralConfig) => (
        <span className="px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 border-none w-fit inline-block">
          {record.referee_reward_type === "PERCENTAGE"
            ? `${record.referee_reward}% DISCOUNT`
            : `₹${record.referee_reward} CREDIT`}
        </span>
      ),
    },
    {
      title: "STATUS",
      key: "is_active",
      render: (_: any, record: ReferralConfig) => (
        <div className="flex items-center gap-2">
          <Switch
            size="small"
            checked={record.is_active}
            disabled={!canUpdate}
            onChange={(checked) => onToggleStatus(record.id, checked)}
          />
          <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider border-none w-fit inline-block ${record.is_active
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }`}>
            {record.is_active ? "Live" : "Paused"}
          </span>
        </div>
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
          render: (_: any, record: ReferralConfig) => {
            const menuItems = [
              ...(canUpdate
                ? [
                  {
                    key: "edit",
                    icon: <EditOutlined className="text-slate-500" />,
                    label: <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">Configure Rule</span>,
                  },
                ]
                : []),
              ...(canDelete
                ? [
                  {
                    key: "delete",
                    icon: <DeleteOutlined />,
                    label: <span className="font-semibold text-xs">Archive Rule</span>,
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

export default ReferralTable;
