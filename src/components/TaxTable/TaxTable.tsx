import { Table, Switch, Button, Dropdown, Modal } from "antd";
import { EyeOutlined, EditOutlined, DeleteOutlined, EllipsisOutlined } from "@ant-design/icons";
import type { TableColumnsType } from "antd";
import type { Tax } from "../../store/slices/taxSlice";

interface TaxTableProps {
  data: Tax[];
  onEdit: (tax: Tax) => void;
  onView: (tax: Tax) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  loading?: boolean;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const TaxTable = ({
  data,
  onEdit,
  onView,
  onDelete,
  onToggleStatus,
  loading,
  canUpdate = false,
  canDelete = false,
}: TaxTableProps) => {
  const getCategoryBadge = (type: string) => {
    let bg = "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-350";
    switch (type) {
      case "CENTRAL":
        bg = "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";
        break;
      case "STATE":
        bg = "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";
        break;
      case "UNION_TERRITORY":
        bg = "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400";
        break;
      case "COMPOSITE":
        bg = "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";
        break;
      default:
        break;
    }
    return (
      <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider inline-block border-none ${bg}`}>
        {type?.replace(/_/g, " ")}
      </span>
    );
  };

  const columns: TableColumnsType<Tax> = [
    {
      title: "TAX IDENTITY",
      dataIndex: "tax_name",
      width: 220,
      sorter: (a, b) => a.tax_name.localeCompare(b.tax_name),
      render: (name: string, record: Tax) => (
        <div className="flex flex-col gap-0.5 py-1">
          <span className="font-extrabold text-slate-800 dark:text-slate-100 tracking-tight text-xs leading-none">
            {name}
          </span>
          <div>
            <span className="text-[9px] font-mono font-bold text-blue-500 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10 px-1.5 py-0.2 rounded border-none uppercase tracking-tighter">
              {record.tax_code}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "CATEGORY",
      dataIndex: "tax_type",
      width: 140,
      render: (type: string) => getCategoryBadge(type),
    },
    {
      title: "LEVY (%)",
      dataIndex: "percentage",
      width: 110,
      sorter: (a, b) => a.percentage - b.percentage,
      render: (percent: number) => (
        <span className="px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-none inline-block">
          {percent}%
        </span>
      ),
    },
    {
      title: "DEFAULT",
      dataIndex: "is_default",
      width: 110,
      render: (isDefault: boolean) =>
        isDefault ? (
          <div className="flex items-center gap-1 text-amber-500 font-extrabold text-[10px] uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Default
          </div>
        ) : (
          <span className="text-slate-300 dark:text-slate-655 text-[10px] font-bold tracking-widest">—</span>
        ),
    },
    {
      title: "STATUS",
      dataIndex: "is_active",
      width: 130,
      render: (isActive: boolean, record: Tax) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={isActive}
            size="small"
            disabled={!canUpdate}
            onChange={(checked) => onToggleStatus(record.id, checked)}
            className={`${isActive ? "!bg-emerald-500" : "!bg-gray-200"} ${!canUpdate ? "opacity-50" : ""}`}
          />
          <span
            className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? "text-emerald-600 dark:text-emerald-450" : "text-slate-400 dark:text-slate-500"}`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      fixed: "right" as const,
      width: 80,
      align: "center" as const,
      render: (_, record: Tax) => {
        const menuItems = [
          {
            key: "view",
            icon: <EyeOutlined className="text-slate-500" />,
            label: <span className="font-semibold text-xs text-slate-700 dark:text-slate-100">View Detail</span>,
          },
          ...(canUpdate
            ? [
              {
                key: "edit",
                icon: <EditOutlined className="text-slate-500" />,
                label: <span className="font-semibold text-xs text-slate-700 dark:text-slate-100">Modify Rule</span>,
              },
            ]
            : []),
          ...(canDelete
            ? [
              {
                key: "delete",
                icon: <DeleteOutlined className="text-rose-500" />,
                label: <span className="font-semibold text-xs text-rose-600">Delete Rule</span>,
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
                if (key === "view") {
                  onView(record);
                } else if (key === "edit") {
                  onEdit(record);
                } else if (key === "delete") {
                  Modal.confirm({
                    title: "Delete Tax Rule?",
                    content: `Are you sure you want to delete the "${record.tax_name}" tax rule?`,
                    okText: "Delete",
                    okType: "danger",
                    cancelText: "Keep",
                    onOk: () => onDelete(record.id),
                  });
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
          loading={loading}
          rowKey="id"
          pagination={false}
          className="premium-table-compact"
          scroll={{ x: 1000, y: 'calc(100vh - 430px)' }}
          size="small"
        />
      </div>
    </>
  );
};

export default TaxTable;
