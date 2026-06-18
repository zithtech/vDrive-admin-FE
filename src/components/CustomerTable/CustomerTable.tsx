import {
  SearchOutlined,
  EyeOutlined,
  StopOutlined,
  ClockCircleOutlined,
  EllipsisOutlined,
  UserOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import type { InputRef, TableColumnsType, TableColumnType } from "antd";
import {
  Button,
  Input,
  Space,
  Table,
  Tag,
  Dropdown,
  Avatar,
  Popover,
  Typography,
  Tooltip,
  // Divider,
  message,
} from "antd";
import type { FilterDropdownProps } from "antd/es/table/interface";
import Highlighter from "react-highlight-words";
const { Text } = Typography;
import { useMemo, useRef, useState } from "react";
import { format } from "date-fns-tz";
import { useGetHeight } from "../../utilities/customheightWidth";
import type { Customer } from "../../pages/Customers";
import CustomerDetails from "../CustomerDetails/CustomerDetails";

import { useHasPermission } from "../../hooks/usePermission";

interface CustomerTableProps {
  data: Customer[];
  isSuperAdmin?: boolean;
}

type DataIndex = keyof Customer;

const CustomerTable = ({ data, isSuperAdmin = false }: CustomerTableProps) => {
  const canUpdateCustomer = useHasPermission("customers", "update");
  const contentRef = useRef<HTMLDivElement>(null);
  const tableHeight = useGetHeight(contentRef);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  const openDrawer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };

  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps["confirm"],
    dataIndex: DataIndex,
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex as string);
  };

  const handleReset = (clearFilters: () => void, confirm: FilterDropdownProps["confirm"]) => {
    clearFilters();
    setSearchText("");
    confirm();
  };

  const getColumnSearchProps = (dataIndex: DataIndex): TableColumnType<Customer> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${String(dataIndex)}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            type="link"
            onClick={() => clearFilters && handleReset(clearFilters, confirm)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) => {
      const cellValue = record[dataIndex];
      return cellValue
        ? cellValue
            .toString()
            .toLowerCase()
            .includes((value as string).toLowerCase())
        : false;
    },
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  const columns: TableColumnsType<Customer> = useMemo(
    () => [
      {
        title: "Customer",
        dataIndex: "full_name",
        key: "customer",
        minWidth: 200,
        sorter: (a: Customer, b: Customer) => a.full_name.localeCompare(b.full_name),
        ...getColumnSearchProps("full_name"),
        render: (_, record) => (
          <div className="flex items-center gap-2">
            <Avatar
              icon={<UserOutlined />}
              size={32}
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
              }}
              className="border-2 border-white flex-shrink-0"
            >
              {record.full_name?.charAt(0)}
            </Avatar>
            <div className="flex flex-col justify-center gap-0.5">
              <Text className="font-extrabold text-slate-800 dark:text-slate-100 tracking-tight text-sm leading-none">
                {record.full_name}
              </Text>
              <div className="flex items-center gap-1.5 group/copy">
                <Text
                  style={{ color: "#6b7280" }}
                  className="text-[10px] font-black uppercase tracking-tight font-mono leading-none dark:text-slate-400"
                >
                  {record.user_code || "VDU-NEW"}
                </Text>
                <Tooltip title="Copy ID">
                  <CopyOutlined
                    className="text-[10px] text-slate-300 hover:text-indigo-500 cursor-pointer transition-colors opacity-0 group-hover/copy:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(record.user_code || "");
                      message.success({
                        content: "Customer ID copied",
                        className: "premium-message",
                        icon: <CopyOutlined className="text-indigo-500" />,
                      });
                    }}
                  />
                </Tooltip>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: "Contact",
        key: "contact",
        minWidth: 160,
        render: (_, record) => (
          <div className="flex items-center gap-2">
            <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {record.phone_number}
            </Text>
            <div className="h-3 w-[1.5px] bg-indigo-200/60 dark:bg-indigo-800/60 rounded-full mx-1" />
            <Text className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {record.email}
            </Text>
          </div>
        ),
      },
      {
        title: "Emergency Contacts",
        key: "emergency_contacts",
        minWidth: 180,
        render: (_, record) => {
          const contacts = record.emergency_contacts || [];
          if (contacts.length === 0) {
            return (
              <span className="text-gray-400 text-[11px] italic font-medium">
                No contacts registered
              </span>
            );
          }

          const firstContact = contacts[0];
          const othersCount = contacts.length - 1;

          const popoverContent = (
            <div className="flex flex-col gap-3 p-1">
              {contacts.map((contact, index) => (
                <div
                  key={index}
                  className="flex flex-col border-b border-gray-100 dark:border-slate-700 last:border-0 pb-2 last:pb-0"
                >
                  <span className="font-bold text-[13px] text-gray-800 dark:text-slate-200">
                    {contact.name}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                    {contact.phone}
                  </span>
                </div>
              ))}
            </div>
          );

          return (
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="text-[12px] font-bold text-gray-700 dark:text-slate-300 leading-tight">
                  {firstContact.name}
                </span>
                <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500">
                  {firstContact.phone}
                </span>
              </div>
              {othersCount > 0 && (
                <Popover
                  content={popoverContent}
                  title={<span className="font-bold">Emergency Contacts</span>}
                  trigger="click"
                  placement="topRight"
                >
                  <Tag
                    className="cursor-pointer hover:scale-105 transition-transform text-[10px] font-bold m-0 border-none rounded-full px-2"
                    style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}
                  >
                    +{othersCount}
                  </Tag>
                </Popover>
              )}
            </div>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        minWidth: 120,
        key: "status",
        sorter: (a: Customer, b: Customer) => a.status.localeCompare(b.status),
        render: (status: string) => {
          let config = { color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" }; // active
          if (status === "inactive")
            config = { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" };
          if (status === "suspended" || status === "blocked")
            config = { color: "#ef4444", bg: "#fef2f2", border: "#fecaca" };

          return (
            <Tag
              className="m-0 rounded-full px-3 py-0.5 font-bold text-[11px] border shadow-sm uppercase tracking-wider"
              style={{
                color: config.color,
                backgroundColor: config.bg,
                borderColor: config.border,
              }}
            >
              {status}
            </Tag>
          );
        },
      },
      {
        title: "Updated At",
        dataIndex: "updated_at",
        minWidth: 240,
        key: "updated_at",
        render: (text: string) => (
          <div className="flex items-center gap-2">
            <Text className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
              {text ? format(new Date(text), "MMM dd, yyyy") : "-"}
            </Text>
            <div className="h-3 w-[1.5px] bg-indigo-200/60 dark:bg-indigo-800/60 rounded-full mx-1" />
            <Text className="text-[10px] font-black text-indigo-400 dark:text-indigo-300 uppercase tracking-widest">
              {text ? format(new Date(text), "hh:mm a") : "-"}
            </Text>
          </div>
        ),
        sorter: (a: Customer, b: Customer) => {
          const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return timeA - timeB;
        },
      },
      {
        title: "Action",
        key: "action",
        render: (_, record) => {
          const menuItems = [
            {
              key: "view",
              icon: <EyeOutlined className="text-gray-400" />,
              label: <span className="font-bold text-gray-700">View Details</span>,
            },
            ...(canUpdateCustomer
              ? [
                  {
                    key: "block",
                    icon: <StopOutlined />,
                    label: <span className="font-bold">Block Customer</span>,
                    danger: true,
                  },
                  {
                    key: "suspend",
                    icon: <ClockCircleOutlined className="text-orange-400" />,
                    label: <span className="font-bold text-orange-600">Suspend Customer</span>,
                  },
                ]
              : []),
          ];
          return (
            <Space className="customer-action">
              <Tooltip title="View Details">
                <Button
                  type="text"
                  className="hover:bg-blue-50 text-blue-600 transition-colors"
                  icon={<EyeOutlined />}
                  onClick={() => openDrawer(record)}
                />
              </Tooltip>
              <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
                <Button
                  type="text"
                  className="text-gray-400 hover:text-gray-600"
                  icon={<EllipsisOutlined />}
                />
              </Dropdown>
            </Space>
          );
        },
      },
    ],
    [searchText, searchedColumn],
  );

  return (
    <>
      <style>
        {`
                    .premium-table-flat .ant-table-thead > tr > th {
                        background: #f8fafc !important;
                        color: #64748b !important;
                        font-weight: 700 !important;
                        text-transform: uppercase !important;
                        font-size: 11px !important;
                        letter-spacing: 0.05em !important;
                        border-bottom: 2px solid #f1f5f9 !important;
                        padding: 10px 24px !important;
                    }
                    .premium-table-flat .ant-table-tbody > tr > td {
                        padding: 8px 24px !important;
                        border-bottom: 1px solid #f8fafc !important;
                    }
                    .dark .premium-table-flat .ant-table-thead > tr > th {
                        background: #1e293b !important;
                        color: #94a3b8 !important;
                        border-bottom: 2px solid #334155 !important;
                    }
                    .dark .premium-table-flat .ant-table-tbody > tr > td {
                        border-bottom: 1px solid #1e293b !important;
                        color: #f1f5f9 !important;
                    }
                    .dark .premium-table-flat .ant-table-row:hover > td {
                        background: #334155 !important;
                    }
                    .premium-table-flat .ant-table-row {
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    .premium-table-flat .ant-table {
                        background: transparent !important;
                    }
                `}
      </style>
      <div
        ref={contentRef}
        className="flex-grow bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-0 pb-2"
      >
        <Table
          key={tableHeight}
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: data.length,
            className: "px-6 py-4",
            showSizeChanger: true,
            size: "small",
            placement: ["bottomEnd"],
            pageSizeOptions: [10, 15, 20, 50, 100],
            showTotal: (total) => (total > 0 ? `Total ${total} customers` : ""),
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
          showSorterTooltip={false}
          tableLayout="auto"
          size="small"
          scroll={{ x: "max-content", y: "calc(100vh - 440px)" }}
          sticky
          className="premium-table-flat"
          rowClassName={(_, index) =>
            (index || 0) % 2 === 0
              ? "bg-slate-50/50 dark:bg-slate-800/50 hover:bg-indigo-50/30 dark:hover:bg-slate-700 transition-colors"
              : "bg-white dark:bg-slate-800 hover:bg-indigo-50/30 dark:hover:bg-slate-700 transition-colors"
          }
          onRow={(record) => ({
            onClick: (event) => {
              const isActionClick = (event.target as HTMLElement).closest(".customer-action");
              if (!isActionClick) {
                openDrawer(record);
              }
            },
          })}
        />
      </div>
      {selectedCustomer && (
        <CustomerDetails
          customer={selectedCustomer}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          isSuperAdmin={isSuperAdmin}
        />
      )}
    </>
  );
};

export default CustomerTable;
