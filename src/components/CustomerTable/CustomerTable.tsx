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
  Pagination,
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
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, size: number) => void;
}

type DataIndex = keyof Customer;

const CustomerTable = ({ data, isSuperAdmin = false, currentPage, pageSize, onPageChange }: CustomerTableProps) => {
  const canUpdateCustomer = useHasPermission("customers", "update");
  const contentRef = useRef<HTMLDivElement>(null);
  const tableHeight = useGetHeight(contentRef);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);

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
          <div className="customer-avatar-wrapper">
            <Avatar
              icon={<UserOutlined />}
              size={32}
              className="customer-avatar"
            >
              {record.full_name?.charAt(0)}
            </Avatar>
            <div className="customer-name-wrapper">
              <Text className="customer-name-text">
                {record.full_name}
              </Text>
              <div className="customer-id-wrapper group/copy">
                <Text className="customer-id-text">
                  {record.user_code || "VDU-NEW"}
                </Text>
                <Tooltip title="Copy ID">
                  <CopyOutlined
                    className="customer-copy-icon"
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
          <div className="customer-contact-wrapper">
            <Text className="customer-phone-text">
              {record.phone_number}
            </Text>
            <div className="customer-contact-separator" />
            <Text className="customer-email-text">
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
              <span className="customer-no-contacts">
                No contacts registered
              </span>
            );
          }

          const firstContact = contacts[0];
          const othersCount = contacts.length - 1;

          const popoverContent = (
            <div className="customer-popover-wrapper">
              {contacts.map((contact, index) => (
                <div
                  key={index}
                  className="customer-popover-item"
                >
                  <span className="customer-popover-name">
                    {contact.name}
                  </span>
                  <span className="customer-popover-phone">
                    {contact.phone}
                  </span>
                </div>
              ))}
            </div>
          );

          return (
            <div className="customer-emergency-wrapper">
              <div className="customer-emergency-info">
                <span className="customer-emergency-name">
                  {firstContact.name}
                </span>
                <span className="customer-emergency-phone">
                  {firstContact.phone}
                </span>
              </div>
              {othersCount > 0 && (
                <Popover
                  content={popoverContent}
                  title={<span className="customer-popover-title-text">Emergency Contacts</span>}
                  trigger="click"
                  placement="topRight"
                >
                  <Tag className="customer-emergency-tag">
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
              className="customer-status-tag"
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
        minWidth: 180,
        key: "updated_at",
        render: (text: string) => (
          <div className="customer-updated-wrapper">
            <Text className="customer-updated-date">
              {text ? format(new Date(text), "MMM dd, yyyy") : "-"}
            </Text>
            <div className="customer-contact-separator" />
            <Text className="customer-updated-time">
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
        fixed: "right",
        width: 80,
        render: (_, record) => {
          const menuItems = [
            {
              key: "view",
              icon: <EyeOutlined className="customer-menu-icon" size={12} />,
              label: <span className="customer-menu-label">View Details</span>,
            },
            ...(canUpdateCustomer
              ? [
                {
                  key: "block",
                  icon: <StopOutlined />,
                  label: <span className="customer-menu-label-bold">Block Customer</span>,
                  danger: true,
                },
                {
                  key: "suspend",
                  icon: <ClockCircleOutlined className="customer-menu-icon-suspend" />,
                  label: <span className="customer-menu-label-suspend">Suspend Customer</span>,
                },
              ]
              : []),
          ];
          return (
            <Space className="customer-action">
              <Tooltip title="View Details">
                <Button
                  type="text"
                  className="customer-action-view"
                  icon={<EyeOutlined />}
                  onClick={() => openDrawer(record)}
                />
              </Tooltip>
              <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
                <Button
                  type="text"
                  className="customer-action-ellipsis"
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
                        font-size: 9px !important;
                        letter-spacing: 0.05em !important;
                        border-bottom: 2px solid #f1f5f9 !important;
                        padding: 5px 16px !important;
                    }
                    .premium-table-flat .ant-table-tbody > tr:not(.ant-table-measure-row) > td {
                        padding: 3px 16px !important;
                        border-bottom: 1px solid #f8fafc !important;
                    }
                    .dark .premium-table-flat .ant-table-thead > tr > th {
                        background: #1e293b !important;
                        color: #94a3b8 !important;
                        border-bottom: 2px solid #334155 !important;
                    }
                    .dark .premium-table-flat .ant-table-tbody > tr:not(.ant-table-measure-row) > td {
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
                    .premium-table-flat.ant-table-wrapper,
                    .premium-table-flat .ant-spin-nested-loading,
                    .premium-table-flat .ant-spin-container,
                    .premium-table-flat .ant-table,
                    .premium-table-flat .ant-table-container {
                        display: flex;
                        flex-direction: column;
                        flex-grow: 1;
                        min-height: 0;
                        min-width: 0;
                    }
                    .premium-table-flat .ant-table {
                        background: transparent !important;
                    }
                    .premium-table-flat .ant-table-body,
                    .premium-table-flat .ant-table-content {
                        flex-grow: 1;
                        min-height: 0;
                        min-width: 0;
                        overflow: auto !important;
                    }
                    .premium-table-flat .ant-pagination {
                        display: none !important;
                    }
                    .customer-avatar-wrapper { display: flex; align-items: center; gap: 0.5rem; }
                    .customer-avatar { border: 2px solid white; flex-shrink: 0; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2); }
                    .customer-name-wrapper { display: flex; flex-direction: column; justify-content: center; gap: 0.125rem; }
                    .customer-name-text { font-weight: 800; color: #1e293b; letter-spacing: -0.025em; font-size: 12px; line-height: 1; }
                    .dark .customer-name-text { color: #f1f5f9; }
                    .customer-id-wrapper { display: flex; align-items: center; gap: 0.375rem; }
                    .customer-id-wrapper:hover .customer-copy-icon { opacity: 1; }
                    .customer-id-text { font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.025em; font-family: monospace; line-height: 1; color: #6b7280; }
                    .dark .customer-id-text { color: #94a3b8; }
                    .customer-copy-icon { font-size: 10px; color: #cbd5e1; cursor: pointer; transition: color 0.15s; opacity: 0; }
                    .customer-copy-icon:hover { color: #6366f1; }
                    .customer-contact-wrapper, .customer-updated-wrapper { display: flex; align-items: center; gap: 0.5rem; }
                    .customer-phone-text { font-size: 10px; font-weight: 600; color: #475569; }
                    .dark .customer-phone-text { color: #cbd5e1; }
                    .customer-contact-separator { height: 0.75rem; width: 1.5px; background-color: rgba(199, 210, 254, 0.6); border-radius: 9999px; margin-left: 0.25rem; margin-right: 0.25rem; }
                    .dark .customer-contact-separator { background-color: rgba(55, 48, 163, 0.6); }
                    .customer-email-text { font-size: 10px; font-weight: 900; color: #94a3b8; }
                    .dark .customer-email-text { color: #64748b; }
                    .customer-no-contacts { color: #9ca3af; font-size: 10px; font-style: italic; font-weight: 500; }
                    .customer-popover-wrapper { display: flex; flex-direction: column; gap: 0.75rem; padding: 0.25rem; }
                    .customer-popover-item { display: flex; flex-direction: column; border-bottom: 1px solid #f3f4f6; padding-bottom: 0.5rem; }
                    .customer-popover-item:last-child { border-bottom: 0; padding-bottom: 0; }
                    .dark .customer-popover-item { border-color: #334155; }
                    .customer-popover-name { font-weight: 700; font-size: 12px; color: #1f2937; }
                    .dark .customer-popover-name { color: #e2e8f0; }
                    .customer-popover-phone { font-size: 10px; font-weight: 600; color: #6b7280; }
                    .dark .customer-popover-phone { color: #94a3b8; }
                    .customer-emergency-wrapper { display: flex; align-items: center; gap: 0.5rem; }
                    .customer-emergency-info { display: flex; flex-direction: column; }
                    .customer-emergency-name { font-size: 10px; font-weight: 700; color: #374151; line-height: 1.25; }
                    .dark .customer-emergency-name { color: #cbd5e1; }
                    .customer-emergency-phone { font-size: 8px; font-weight: 600; color: #9ca3af; }
                    .dark .customer-emergency-phone { color: #64748b; }
                    .customer-emergency-tag { cursor: pointer; transition: transform 0.15s; font-size: 9px; font-weight: 700; margin: 0; border: none; border-radius: 9999px; padding-left: 0.5rem; padding-right: 0.5rem; background-color: #eff6ff; color: #2563eb; }
                    .customer-emergency-tag:hover { transform: scale(1.05); }
                    .customer-status-tag { margin: 0; border-radius: 6px; padding: 0px 4px; font-weight: 700; font-size: 7px; border-width: 1px; text-transform: uppercase; letter-spacing: 0.025em; }
                    .customer-updated-date { font-size: 10px; font-weight: 700; color: #1e293b; text-transform: Capitalize; letter-spacing: -0.025em; }
                    .dark .customer-updated-date { color: #e2e8f0; }
                    .customer-updated-time { font-size: 9px; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 0.1em; }
                    .dark .customer-updated-time { color: #a5b4fc; }
                    .customer-action-view { color: #2563eb; transition: background-color 0.15s, color 0.15s; }
                    .customer-action-view:hover { background-color: #eff6ff; }
                    .customer-action-ellipsis { color: #9ca3af; }
                    .customer-action-ellipsis:hover { color: #4b5563; }
                    .customer-table-container { flex-grow: 1; background-color: white; border-radius: 6px; border: 1px solid #f1f5f9; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); overflow: hidden; display: flex; flex-direction: column; min-height: 0; padding-bottom: 0.5rem; }
                    .dark .customer-table-container { background-color: #1e293b; border-color: #334155; }
                    .customer-row-even { background-color: rgba(248, 250, 252, 0.5); transition: background-color 0.15s; }
                    .dark .customer-row-even { background-color: rgba(30, 41, 59, 0.5); }
                    .customer-row-even:hover { background-color: rgba(238, 242, 255, 0.3) !important; }
                    .dark .customer-row-even:hover { background-color: #334155 !important; }
                    .customer-row-odd { background-color: white; transition: background-color 0.15s; }
                    .dark .customer-row-odd { background-color: #1e293b; }
                    .customer-row-odd:hover { background-color: rgba(238, 242, 255, 0.3) !important; }
                    .dark .customer-row-odd:hover { background-color: #334155 !important; }
                    .customer-menu-icon { color: #9ca3af; }
                    .customer-menu-label { font-weight: 700; color: #374151; }
                    .customer-menu-label-bold { font-weight: 700; }
                    .customer-menu-icon-suspend { color: #fb923c; }
                    .customer-menu-label-suspend { font-weight: 700; color: #ea580c; }
                    .customer-popover-title-text { font-weight: 700; }
                `}
      </style>
      <div
        ref={contentRef}
        className="customer-table-container"
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
            position: ["none"],
            onChange: onPageChange,
          }}
          showSorterTooltip={false}
          tableLayout="auto"
          size="small"
          scroll={{ x: "max-content" }}
          sticky={true}
          className="premium-table-flat"
          rowClassName={(_, index) =>
            (index || 0) % 2 === 0
              ? "customer-row-even"
              : "customer-row-odd"
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
