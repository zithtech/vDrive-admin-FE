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
  // Pagination,
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
        width: 200,
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
        width: 160,
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
        width: 180,
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
        width: 120,
        key: "status",
        sorter: (a: Customer, b: Customer) => a.status.localeCompare(b.status),
        render: (status: string) => {
          let colorClass = "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20"; // active
          if (status === "inactive")
            colorClass = "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20";
          if (status === "suspended" || status === "blocked")
            colorClass = "text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20";

          return (
            <Tag
              className={`customer-status-tag border ${colorClass}`}
            >
              {status}
            </Tag>
          );
        },
      },
      {
        title: "Updated At",
        dataIndex: "updated_at",
        width: 180,
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
                        font-size: 10px !important;
                        letter-spacing: 0.05em !important;
                        border-bottom: 1px solid #f1f5f9 !important;
                        border-top: 1px solid #f1f5f9 !important;
                        padding: 10px 12px !important;
                    }
                    .premium-table-flat .ant-table-thead > tr > th::before {
                        display: block !important;
                        background-color: #e2e8f0 !important;
                        width: 1px !important;
                        height: 1.4em !important;
                        top: 50% !important;
                        transform: translateY(-50%) !important;
                    }
                    .premium-table-flat .ant-table-tbody > tr:not(.ant-table-measure-row) > td {
                        padding: 4px 12px !important;
                        border-bottom: 1px solid #f8fafc !important;
                    }
                    .dark .premium-table-flat .ant-table-thead > tr > th {
                        background: #0f172a !important;
                        color: #94a3b8 !important;
                        border-bottom: 1px solid #1e293b !important;
                    }
                    .dark .premium-table-flat .ant-table-tbody > tr:not(.ant-table-measure-row) > td {
                        border-bottom: 1px solid #1e293b !important;
                        color: #f1f5f9 !important;
                        background: #0f172a !important;
                    }
                    .dark .premium-table-flat .ant-table-cell-fix-left,
                    .dark .premium-table-flat .ant-table-cell-fix-right {
                        background: #0f172a !important;
                    }
                    .dark .premium-table-flat .ant-table-row:hover > td,
                    .dark .premium-table-flat .ant-table-row:hover > td.ant-table-cell-fix-left,
                    .dark .premium-table-flat .ant-table-row:hover > td.ant-table-cell-fix-right {
                        background: #1e293b !important;
                    }
                    .premium-table-flat .ant-table-row {
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    .premium-table-flat.ant-table-wrapper,
                    .premium-table-flat .ant-spin-nested-loading,
                    .premium-table-flat .ant-spin-container {
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                    }
                    .premium-table-flat .ant-table {
                        flex: 1;
                        background: transparent !important;
                    }
                    .premium-table-flat .ant-table-container {
                        height: 100%;
                        overflow: hidden;
                    }
                    .premium-table-flat .ant-pagination {
                        display: none !important;
                    }
                    .customer-avatar-wrapper { display: flex; align-items: center; gap: 0.5rem; }
                    .customer-avatar { border: 2px solid white; flex-shrink: 0; background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); color: white; }
                    .dark .customer-avatar { border-color: transparent; }
                    .customer-name-wrapper { display: flex; flex-direction: column; justify-content: center; gap: 0.125rem; }
                    .customer-name-text { font-weight: 800; color: #1e293b; letter-spacing: -0.025em; font-size: 13px; line-height: 1; }
                    .dark .customer-name-text { color: #f1f5f9; }
                    .customer-id-wrapper { display: flex; align-items: center; gap: 0.375rem; }
                    .customer-id-text { font-size: 11px; font-weight: 700;  letter-spacing: -0.025em; font-family: monospace; line-height: 1; color: #6b7280; }
                    .dark .customer-id-text { color: #94a3b8; }
                    .customer-contact-wrapper, .customer-updated-wrapper { display: flex; flex-direction: column; gap: 0.125rem; }
                    .customer-phone-text { font-size: 13px; font-weight: 600; color: #475569; }
                    .dark .customer-phone-text { color: #cbd5e1; }
                    .customer-contact-separator { display: none; }
                    .customer-email-text { font-size: 12px; font-weight: 900; color: #94a3b8; }
                    .dark .customer-email-text { color: #64748b; }
                    .customer-no-contacts { color: #9ca3af; font-size: 12px; font-style: italic; font-weight: 500; }
                    .customer-status-tag { margin: 0; border-radius: 6px; padding: 2px 6px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.025em; display: inline-block; text-align: center; border-width: 1px; }
                    .customer-popover-wrapper { display: flex; flex-direction: column; gap: 0.75rem; padding: 0.25rem; }
                    .customer-popover-item { display: flex; flex-direction: column; border-bottom: 1px solid #f3f4f6; padding-bottom: 0.5rem; }
                    .customer-popover-item:last-child { border-bottom: 0; padding-bottom: 0; }
                    .dark .customer-popover-item { border-color: #334155; }
                    .customer-popover-name { font-weight: 700; font-size: 13px; color: #1f2937; }
                    .dark .customer-popover-name { color: #e2e8f0; }
                    .customer-popover-phone { font-size: 12px; font-weight: 600; color: #6b7280; }
                    .dark .customer-popover-phone { color: #94a3b8; }
                    .customer-emergency-wrapper { display: flex; align-items: center; gap: 0.5rem; }
                    .customer-emergency-info { display: flex; flex-direction: column; }
                    .customer-emergency-name { font-size: 13px; font-weight: 700; color: #374151; line-height: 1.25; }
                    .dark .customer-emergency-name { color: #cbd5e1; }
                    .customer-emergency-phone { font-size: 12px; font-weight: 600; color: #9ca3af; }
                    .dark .customer-emergency-phone { color: #64748b; }
                    .customer-emergency-tag { cursor: pointer; transition: transform 0.15s; font-size: 11px; font-weight: 700; margin: 0; border: none; border-radius: 9999px; padding-left: 0.5rem; padding-right: 0.5rem; background-color: #eff6ff; color: #2563eb; }
                    .customer-emergency-tag:hover { transform: scale(1.05); }
                    .customer-status-tag { margin: 0; border-radius: 6px; padding: 2px 6px; font-weight: 700; font-size: 11px; border-width: 1px; text-transform: uppercase; letter-spacing: 0.025em; }
                    .customer-updated-date { font-size: 13px; font-weight: 700; color: #1e293b; text-transform: Capitalize; letter-spacing: -0.025em; }
                    .dark .customer-updated-date { color: #e2e8f0; }
                    .customer-updated-time { font-size: 12px; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 0.1em; }
                    .dark .customer-updated-time { color: #a5b4fc; }
                    .customer-action-view { color: #2563eb; transition: background-color 0.15s, color 0.15s; }
                    .dark .customer-action-view { color: #60a5fa; }
                    .customer-action-view:hover { background-color: #eff6ff; }
                    .dark .customer-action-view:hover { background-color: rgba(30, 58, 138, 0.5); }
                    .customer-action-ellipsis { color: #9ca3af; font-size: 18px; }
                    .dark .customer-action-ellipsis { color: #64748b; }
                    .customer-action-ellipsis:hover { color: #4b5563; }
                    .dark .customer-action-ellipsis:hover { color: #f1f5f9; }
                    .customer-table-container { flex-grow: 1; background-color: white; border-radius: 6px; border: 1px solid #f1f5f9; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); overflow: hidden; display: flex; flex-direction: column; min-height: 0; padding-bottom: 0.5rem; }
                    .dark .customer-table-container { background-color: #0f172a; border-color: #334155; }
                    .customer-row-even { background-color: rgba(248, 250, 252, 0.5); transition: background-color 0.15s; }
                    .dark .customer-row-even { background-color: #0f172a; }
                    .customer-row-even:hover { background-color: rgba(238, 242, 255, 0.3) !important; }
                    .dark .customer-row-even:hover { background-color: #1e293b !important; }
                    .customer-row-odd { background-color: white; transition: background-color 0.15s; }
                    .dark .customer-row-odd { background-color: #0f172a; }
                    .customer-row-odd:hover { background-color: rgba(238, 242, 255, 0.3) !important; }
                    .dark .customer-row-odd:hover { background-color: #1e293b !important; }
                    .customer-menu-icon { color: #9ca3af; }
                    .customer-menu-label { font-weight: 700; color: #374151; }
                    .dark .customer-menu-label { color: #f1f5f9; }
                    .customer-menu-label-bold { font-weight: 700; }
                    .customer-menu-icon-suspend { color: #fb923c; }
                    .customer-menu-label-suspend { font-weight: 700; color: #ea580c; }
                    .customer-popover-title-text { font-weight: 700; }
                `}
      </style>
      <div
        ref={contentRef}
        className="customer-table-container h-full w-full"
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
          tableLayout="fixed"
          size="small"
          scroll={{ y: tableHeight ? Math.max(0, Math.floor(tableHeight)) : undefined, x: 1200 }}
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
