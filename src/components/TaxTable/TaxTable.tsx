import { Table, Switch, Button, Popconfirm, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
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

const TAX_TYPE_GRADIENTS: Record<string, string> = {
  CENTRAL: "from-amber-400 to-orange-300 shadow-amber-100",
  STATE: "from-emerald-400 to-teal-400 shadow-emerald-100",
  UNION_TERRITORY: "from-purple-500 to-indigo-400 shadow-purple-100",
  COMPOSITE: "from-blue-500 to-indigo-500 shadow-blue-100",
};

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

  const columns: TableColumnsType<Tax> = [
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Tax Identity</span>,
      dataIndex: "tax_name",
      width: 240,
      sorter: (a, b) => a.tax_name.localeCompare(b.tax_name),
      render: (name: string, record: Tax) => (
        <div className="flex flex-col gap-1.5 py-1">
          <span className="text-sm font-black text-gray-800 tracking-tight leading-none">{name}</span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold text-indigo-400 bg-indigo-50/50 px-2 py-0.5 rounded border border-indigo-100/50 uppercase tracking-tighter">
              {record.tax_code}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Category</span>,
      dataIndex: "tax_type",
      width: 160,
      render: (type: string) => (
        <div className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-lg bg-gradient-to-br ${TAX_TYPE_GRADIENTS[type] || "from-slate-400 to-slate-500 shadow-slate-100"}`}>
          {type?.replace(/_/g, " ")}
        </div>
      ),
    },
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Levy (%)</span>,
      dataIndex: "percentage",
      width: 120,
      sorter: (a, b) => a.percentage - b.percentage,
      render: (percent: number) => (
        <div className="inline-flex bg-indigo-50 text-indigo-600 px-3 py-1 rounded-xl text-xs font-black ring-1 ring-indigo-100">
          {percent}%
        </div>
      ),
    },
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Default</span>,
      dataIndex: "is_default",
      width: 100,
      render: (isDefault: boolean) =>
        isDefault ? (
          <div className="flex items-center gap-1.5 text-amber-500 font-black text-[10px] uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Default
          </div>
        ) : (
          <span className="text-gray-200">—</span>
        ),
    },
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Status</span>,
      dataIndex: "is_active",
      width: 130,
      render: (isActive: boolean, record: Tax) => (
        <div className="flex items-center gap-3">
          <Switch
            checked={isActive}
            size="small"
            disabled={!canUpdate}
            onChange={(checked) => onToggleStatus(record.id, checked)}
            className={`${isActive ? "!bg-emerald-500" : "!bg-gray-200"} ${!canUpdate ? "opacity-50" : ""}`}
          />
          <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "text-emerald-600" : "text-gray-400"}`}>
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      fixed: "right",
      width: 140,
      render: (_, record: Tax) => (
        <div className="flex items-center justify-end gap-1">
          <Tooltip title="View Detail">
            <Button
              type="text"
              icon={<EyeOutlined className="text-indigo-500 text-lg" />}
              onClick={() => onView(record)}
              className="hover:bg-indigo-50 rounded-full h-9 w-9 flex items-center justify-center p-0"
            />
          </Tooltip>
          
          {canUpdate && (
            <Tooltip title="Modify Rule">
              <Button
                type="text"
                icon={<EditOutlined className="text-indigo-500 text-lg" />}
                onClick={() => onEdit(record)}
                className="hover:bg-indigo-50 rounded-full h-9 w-9 flex items-center justify-center p-0"
              />
            </Tooltip>
          )}
          {canDelete && (
            <Popconfirm
              title="Delete Tax Rule"
              description={`Are you sure you want to delete the "${record.tax_name}" tax rule?`}
              onConfirm={() => onDelete(record.id)}
              okText="Delete"
              okButtonProps={{ danger: true, className: "rounded-lg" }}
              cancelText="Keep"
              className="premium-popconfirm"
            >
              <Tooltip title="Delete Rule">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined className="text-lg" />}
                  className="hover:bg-rose-50 rounded-full h-9 w-9 flex items-center justify-center p-0"
                />
              </Tooltip>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex-grow overflow-hidden h-full">
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={false}
        loading={loading}
        scroll={{ y: 'calc(100vh - 400px)', x: "max-content" }}
        sticky
        className="premium-table-container tax-ledger-table"
      />
    </div>
  );
};

export default TaxTable;