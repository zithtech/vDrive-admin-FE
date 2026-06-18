// components/DriverTable/DriverTable.tsx
import { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Table,
  Tag,
  Avatar,
  Tooltip,
  Button,
  Input,
  Space,
  Dropdown,
  AutoComplete,
  Typography,
  message,
  Modal,
} from "antd";
import { useAppDispatch } from "../../store/hooks";
import { updateDriverStatus } from "../../store/slices/driverSlice";
import dayjs from "dayjs";
import { format } from "date-fns-tz";
import type { ColumnsType } from "antd/es/table";

const { Text } = Typography;

import Highlighter from "react-highlight-words";
import type { Driver } from "../../store/slices/driverSlice";
import {
  CopyOutlined,
  EllipsisOutlined,
  EyeOutlined,
  EditOutlined,
  StopOutlined,
  ClockCircleOutlined,
  StarFilled,
  IdcardOutlined,
  CreditCardOutlined,
  SolutionOutlined,
  FileTextOutlined,
  UserOutlined
} from "@ant-design/icons";
import type { FilterDropdownProps } from "antd/es/table/interface";
import type { InputRef, TableColumnType } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import DriverDetails, { getMediaUrl } from "../DriverDetails/DriverDetails";
import { useGetHeight } from "../../utilities/customheightWidth";
import { useHasPermission } from "../../hooks/usePermission";

interface DriverTableProps {
  data: Driver[];
  onViewDetails?: (driver: Driver) => void;
}

type DataIndex = keyof Driver;

const DriverTable = ({ data, onViewDetails }: DriverTableProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const tableHeight = useGetHeight(contentRef);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef<InputRef>(null);

  const dispatch = useAppDispatch();
  const canUpdateDriver = useHasPermission("drivers", "update");
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<"blocked" | "suspended" | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [selectedDriverForStatus, setSelectedDriverForStatus] = useState<Driver | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openDriverDrawer && data.length > 0) {
      const targetDriverId = location.state.openDriverDrawer;
      const foundDriver = data.find(d => String(d.driverId || d.driver_id || d.id || "") === String(targetDriverId));
      
      if (foundDriver) {
        setSelectedDriverId(targetDriverId);
        setDrawerOpen(true);
        // Clear state to avoid reopening on refresh
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, data]);

  const selectedDriver = selectedDriverId
    ? data.find(
      (d) =>
        String(d.driverId || d.driver_id || "") === selectedDriverId ||
        (d.id && String(d.id) === selectedDriverId),
    )
    : null;

  const openDrawer = (driver: Driver) => {
    if (onViewDetails) {
      onViewDetails(driver);
      return;
    }
    const id = String(driver.driverId || driver.driver_id || driver.id || "");
    if (id) {
      setSelectedDriverId(id);
      setDrawerOpen(true);
    } else {
      message.error("Driver ID missing.");
    }
  };

  const handleMenuClick = (key: string, record: Driver) => {
    switch (key) {
      case "view":
      case "edit":
        openDrawer(record);
        break;
      case "block":
        setSelectedDriverForStatus(record);
        setStatusAction("blocked");
        setStatusReason("");
        setStatusModalOpen(true);
        break;
      case "suspend":
        setSelectedDriverForStatus(record);
        setStatusAction("suspended");
        setStatusReason("");
        setStatusModalOpen(true);
        break;
      default:
        break;
    }
  };

  const handleStatusSubmit = async () => {
    if (!statusReason.trim()) {
      message.error("Please provide a reason for this action.");
      return;
    }
    if (selectedDriverForStatus && statusAction) {
      const driverId = String(selectedDriverForStatus.driverId || selectedDriverForStatus.driver_id || selectedDriverForStatus.id);
      try {
        await dispatch(updateDriverStatus({
          driver_id: driverId,
          status: statusAction as any,
          status_reason: statusReason
        })).unwrap();
        message.success(`Driver ${statusAction} successfully.`);
        setStatusModalOpen(false);
        setStatusReason("");
      } catch (err) {
        message.error("Failed to update driver status.");
      }
    }
  };

  const BLOCK_REASONS = [
    "Serious safety violation or physical altercation.",
    "Fraudulent activity or trip manipulation detected.",
    "Sharing account with unauthorized persons.",
    "Repeat offenses after multiple suspensions."
  ];

  const SUSPEND_REASONS = [
    "Pending investigation of a recent customer complaint.",
    "Low completion rate consistently below threshold.",
    "Vehicle maintenance or document audit required.",
    "Inappropriate behavior reported by passenger."
  ];
  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps["confirm"],
    dataIndex: DataIndex,
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (
    clearFilters: () => void,
    confirm: FilterDropdownProps["confirm"],
  ) => {
    clearFilters();
    setSearchText("");
    confirm();
  };

  const getColumnSearchProps = (
    dataIndex: DataIndex,
    copyKey?: keyof Driver,
    additionalSearchFields: (keyof Driver)[] = [],
  ): TableColumnType<Driver> => {
    // Generate unique suggestions for this column based on all data
    const suggestions = Array.from(
      new Set(
        data.flatMap((record) => {
          const primaryVal = record[dataIndex]?.toString() || "";
          const extraVals = additionalSearchFields.map((f) => record[f]?.toString() || "");
          return [primaryVal, ...extraVals].filter((v) => v.trim() !== "");
        })
      )
    )
      .sort()
      .map((val) => ({ value: val }));

    return {
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div className="p-4" onKeyDown={(e) => e.stopPropagation()}>
          <AutoComplete
            options={suggestions}
            style={{ marginBottom: 8, display: "block" }}
            value={selectedKeys[0] as string}
            onSelect={(value) => {
              setSelectedKeys([value]);
              handleSearch([value], confirm, dataIndex);
            }}
            onChange={(value) => setSelectedKeys(value ? [value] : [])}
            filterOption={(inputValue, option) =>
              option!.value.toUpperCase().includes(inputValue.toUpperCase())
            }
          >
            <Input
              ref={searchInput}
              placeholder={`Search ${String(dataIndex)}`}
              onPressEnter={() =>
                handleSearch(selectedKeys as string[], confirm, dataIndex)
              }
            />
          </AutoComplete>
          <Space>
            <Button
              type="primary"
              onClick={() =>
                handleSearch(selectedKeys as string[], confirm, dataIndex)
              }
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
        const searchFields = [dataIndex, ...additionalSearchFields];
        return searchFields.some((field) =>
          (record[field] ?? "")
            .toString()
            .toLowerCase()
            .includes((value as string).toLowerCase()),
        );
      },
      filterDropdownProps: {
        onOpenChange(open) {
          if (open) {
            setTimeout(() => searchInput.current?.select(), 100);
          }
        },
      },
      render: (text, record) => {
        const content =
          searchedColumn === dataIndex ? (
            <Highlighter
              highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={text ? text.toString() : ""}
            />
          ) : (
            text
          );

        return copyKey ? (
          <div className="flex gap-6 items-center">
            <span>{content}</span>
            <Tooltip title={`Copy ${String(copyKey)}`}>
              <CopyOutlined
                style={{ cursor: "pointer" }}
                onClick={() => {
                  const idToCopy = String(record.driver_id || record.id || "");
                  navigator.clipboard.writeText(idToCopy);
                  message.success(`${String(copyKey === "driver_id" ? "ID" : copyKey)} copied!`);
                }}
              />
            </Tooltip>
          </div>
        ) : (
          content
        );
      },
    };
  };
  const columns: ColumnsType<Driver> = [
    {
      title: "Driver",
      dataIndex: "full_name",
      key: "driver",
      width: 220,
      fixed: "left" as const,
      onCell: () => ({ className: "!bg-white dark:!bg-slate-800" } as any),
      onHeaderCell: () => ({ className: "!bg-[#f8fafc] dark:!bg-[#0f172a]" } as any),
      sorter: (a: Driver, b: Driver) => a.full_name.localeCompare(b.full_name),
      ...getColumnSearchProps("full_name", "driver_id", ["vdrive_id", "id"]),
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={getMediaUrl(record.profilePicUrl || record.profile_pic_url)}
            size={38}
            style={{
              background: (record.profilePicUrl || record.profile_pic_url)
                ? undefined
                : "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)"
            }}
            className="border-2 border-white flex-shrink-0"
          >
            {record.full_name?.charAt(0)}
          </Avatar>
          <div className="flex flex-col justify-center gap-0.5 min-w-0">
            <Text className="font-extrabold text-slate-800 dark:text-slate-100 tracking-tight text-[13px] leading-none truncate">{record.full_name}</Text>
            <div className="flex items-center gap-1.5 group/copy">
              <Text style={{ color: '#6b7280' }} className="text-[10px] font-black uppercase tracking-tight font-mono leading-none truncate">
                {record.vdrive_id || record.driverId || record.driver_id || record.id || "VDD-NEW"}
              </Text>
              <Tooltip title="Copy ID">
                <CopyOutlined
                  className="text-[10px] text-slate-300 hover:text-indigo-500 cursor-pointer transition-colors opacity-0 group-hover/copy:opacity-100 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    const idToCopy = record.vdrive_id || record.driver_id || record.id || "";
                    navigator.clipboard.writeText(idToCopy);
                    message.success({
                      content: 'Driver ID copied',
                      className: 'premium-message',
                      icon: <CopyOutlined className="text-indigo-500" />
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
      width: 200,
      render: (_, record) => (
        <div className="flex flex-col gap-0.5">
          <Text className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">{record.phone_number}</Text>
          <Text className="text-[11px] font-medium text-slate-400 dark:text-slate-500 leading-tight truncate" style={{ maxWidth: 180 }}>{record.email}</Text>
        </div>
      ),
    },
    {
      title: "Docs",
      key: "documents",
      width: 130,
      align: "center" as const,
      render: (_, record) => {
        const getStatusIcon = (type: string, title: string) => {
          let status = 'missing';
          // Check for both spelling variations of Aadhaar
          const searchType = type === 'aadhar_card' ? ['aadhar_card', 'aadhaar_card'] : [type];
          const doc = record.documents?.find((d: any) => searchType.includes(d.document_type?.toLowerCase()));
          if (doc) {
            status = doc.license_status || (doc as any).status || 'pending';
          }

          let cls = 'text-slate-400 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500';

          if (status === 'verified') cls = 'text-emerald-500 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400';
          else if (status === 'pending') cls = 'text-amber-500 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400';
          else if (status === 'rejected') cls = 'text-rose-500 bg-rose-50 border-rose-200 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400';

          let Icon: any = FileTextOutlined;
          if (type === 'aadhar_card') Icon = IdcardOutlined;
          if (type === 'pan_card') Icon = CreditCardOutlined;
          if (type === 'driving_license') Icon = SolutionOutlined;
          if (type === 'profile_selfie') Icon = UserOutlined;

          return (
            <Tooltip title={`${title}: ${status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}`}>
              <div 
                className={`w-6 h-6 rounded-full flex items-center justify-center border transition-transform hover:scale-110 cursor-help ${status === 'missing' ? 'opacity-50 grayscale' : 'shadow-sm'} ${cls}`}
              >
                <Icon style={{ fontSize: '11px' }} />
              </div>
            </Tooltip>
          );
        };

        return (
          <div className="flex items-center justify-center gap-1.5">
            {getStatusIcon('profile_selfie', 'Profile')}
            {getStatusIcon('aadhar_card', 'Aadhar')}
            {getStatusIcon('pan_card', 'PAN')}
            {getStatusIcon('driving_license', 'License')}
          </div>
        );
      }
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 180,
      key: "status",
      align: "center" as const,
      sorter: (a: Driver, b: Driver) => a.status.localeCompare(b.status),
      render: (status: string) => {
        let cls = "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400";
        if (status === "inactive") cls = "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400";
        if (status === "suspended") cls = "text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400";
        if (status === "pending" || status === "pending_verification") cls = "text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400";
        if (status === "blocked") cls = "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400";

        return (
          <Tag
            className={`m-0 rounded-full px-3 py-0.5 font-bold text-[10px] border shadow-sm uppercase tracking-wider truncate max-w-[150px] ${cls}`}
          >
            {status.replace('_', ' ')}
          </Tag>
        );
      },
    },
    {
      title: "Plan",
      key: "recharge_plan",
      width: 140,
      render: (_, record) => {
        const plan = record.active_subscription;
        if (!plan) {
          return (
            <Tag
              className="m-0 rounded-full px-3 py-0.5 font-bold text-[11px] border shadow-sm uppercase tracking-wider text-slate-500 bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
            >
              No Plan
            </Tag>
          );
        }

        const isExpired = dayjs(plan.expiry_date).isBefore(dayjs());
        const cls = isExpired ? "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400" : "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400";

        return (
          <div className="flex flex-col gap-0.5">
            <Tag
              className={`m-0 rounded-full px-3 py-0.5 font-bold text-[11px] border shadow-sm uppercase tracking-wider w-fit ${cls}`}
            >
              {plan.plan_name}
            </Tag>
            <Text className="text-[10px] text-slate-400 font-medium leading-none mt-1 ml-0.5">
              {dayjs(plan.expiry_date).format("DD MMM YY")}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Rating",
      dataIndex: "rating",
      width: 90,
      key: "rating",
      align: "center" as const,
      sorter: (a: Driver, b: Driver) => (Number(a.rating) || 0) - (Number(b.rating) || 0),
      render: (rating: any) => {
        const numericRating = Number(rating) || 0;
        const isHigh = numericRating >= 4.5;
        const isGood = numericRating >= 4.0;

        return (
          <Tooltip title={`${numericRating.toFixed(1)} / 5.0 Rating`}>
            <div className={`
              inline-flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all duration-300
              ${isHigh ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/30 dark:border-amber-800' : isGood ? 'bg-orange-50 border-orange-100 dark:bg-orange-900/30 dark:border-orange-800' : 'bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700'}
            `}>
              <StarFilled style={{ color: "#EAB308", fontSize: 12 }} />
              <span className={`text-[12px] font-black tracking-tight ${isHigh ? 'text-amber-700' : isGood ? 'text-orange-700' : 'text-slate-600'}`}>
                {numericRating.toFixed(1)}
              </span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Trips",
      dataIndex: "total_trips",
      width: 80,
      key: "total_trips",
      align: "center" as const,
      sorter: (a: Driver, b: Driver) => (a.total_trips || 0) - (b.total_trips || 0),
      render: (trips: number) => (
        <Text className="text-[13px] font-black text-slate-800 dark:text-slate-100 tracking-tight">
          {(trips || 0).toLocaleString()}
        </Text>
      ),
    },
    {
      title: "Earnings",
      dataIndex: ["payments", "total_earnings"],
      width: 110,
      key: "earnings",
      align: "right" as const,
      sorter: (a: Driver, b: Driver) => (a.payments?.total_earnings || 0) - (b.payments?.total_earnings || 0),
      render: (earnings: number) => (
        <Text className="text-[13px] text-emerald-600 font-black tracking-tight">
          ₹{(earnings || 0).toLocaleString()}
        </Text>
      ),
    },
    {
      title: "Joined",
      dataIndex: "created_at",
      width: 150,
      key: "joined",
      sorter: (a: Driver, b: Driver) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeA - timeB;
      },
      render: (text: string) => (
        <div className="flex flex-col gap-0.5">
          <Text className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight leading-tight">
            {text ? format(new Date(text), "MMM dd, yyyy") : "-"}
          </Text>
          <Text className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-tight">
            {text ? format(new Date(text), "hh:mm a") : "-"}
          </Text>
        </div>
      ),
    },
    {
      title: "",
      key: "action",
      width: 90,
      fixed: "right" as const,
      onCell: () => ({ className: "!bg-white dark:!bg-slate-800" } as any),
      onHeaderCell: () => ({ className: "!bg-[#f8fafc] dark:!bg-[#0f172a]" } as any),
      render: (_, record) => {
        const menuItems = [
          {
            key: "view",
            icon: <EyeOutlined className="text-gray-400" />,
            label: <span className="font-bold text-gray-700">View Details</span>,
          },
          ...(canUpdateDriver ? [
            {
              key: "edit",
              icon: <EditOutlined />,
              label: "Edit Profile",
            },
            {
              key: "block",
              icon: <StopOutlined />,
              label: "Block Driver",
              danger: true,
            },
            {
              key: "suspend",
              icon: <ClockCircleOutlined />,
              label: "Suspend Driver",
              style: { color: "#fa8c16" },
            },
          ] : []),
        ];
        return (
          <Space className="driver-action">
            <Tooltip title="View Details">
              <Button
                type="text"
                size="small"
                className="hover:bg-blue-50 text-blue-600 transition-colors"
                icon={<EyeOutlined />}
                onClick={() => openDrawer(record)}
              />
            </Tooltip>
            <Dropdown
              menu={{
                items: menuItems,
                onClick: ({ key }) => handleMenuClick(key, record),
              }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button type="text" size="small" className="text-gray-400 hover:text-gray-600" icon={<EllipsisOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <style>
        {`
          .premium-table-flat .ant-table-thead > tr > th {
            background: #f8fafc !important;
            border-bottom: 1px solid #e2e8f0 !important;
            color: #64748b !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            font-size: 10px !important;
            padding: 10px 16px !important;
          }
          .premium-table-flat .ant-table-row {
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .premium-table-flat .ant-table-row:hover > td {
            background: #f1f5f9 !important;
          }
          .premium-table-flat .ant-table {
            background: transparent !important;
          }
          .premium-table-flat .ant-table-cell {
            padding: 10px 16px !important;
            vertical-align: middle !important;
          }
          .premium-table-flat .ant-table-cell-fix-left,
          .premium-table-flat .ant-table-cell-fix-right {
            background: #ffffff !important;
          }
          .premium-table-flat .ant-table-row:hover > .ant-table-cell-fix-left,
          .premium-table-flat .ant-table-row:hover > .ant-table-cell-fix-right {
            background: #f1f5f9 !important;
          }
          .premium-table-flat .ant-table-thead > tr > .ant-table-cell-fix-left,
          .premium-table-flat .ant-table-thead > tr > .ant-table-cell-fix-right {
            background: #f8fafc !important;
          }
          .premium-table-flat .ant-table-cell-fix-left-last::after {
            box-shadow: inset 10px 0 8px -8px rgba(0,0,0,0.04) !important;
          }
          .premium-table-flat .ant-table-cell-fix-right-first::after {
            box-shadow: inset -10px 0 8px -8px rgba(0,0,0,0.04) !important;
          }
          
          /* BULLETPROOF DARK MODE OVERRIDES */
          html.dark .premium-table-flat .ant-table-thead > tr > th {
            background: #0f172a !important;
            border-bottom: 1px solid #334155 !important;
            color: #94a3b8 !important;
          }
          html.dark .premium-table-flat .ant-table-cell-fix-left,
          html.dark .premium-table-flat .ant-table-cell-fix-right {
            background: #1e293b !important;
          }
          html.dark .premium-table-flat .ant-table-row:hover > td,
          html.dark .premium-table-flat .ant-table-row:hover > .ant-table-cell-fix-left,
          html.dark .premium-table-flat .ant-table-row:hover > .ant-table-cell-fix-right {
            background: #334155 !important;
          }
          html.dark .premium-table-flat .ant-table-thead > tr > .ant-table-cell-fix-left,
          html.dark .premium-table-flat .ant-table-thead > tr > .ant-table-cell-fix-right {
            background: #0f172a !important;
          }
        `}
      </style>
      <div ref={contentRef} className="h-full w-full bg-white dark:bg-slate-800">
        <Table
          key={tableHeight}
          columns={columns}
          dataSource={data}
          rowKey={(record) => record.driver_id || record.id || ""}
          pagination={false}
          showSorterTooltip={false}
          tableLayout="fixed"
          size="middle"
          scroll={{ y: Math.floor(tableHeight || 0), x: 1200 }}
          className="premium-table-flat"
          onRow={(record) => ({
            onClick: (event) => {
              const isActionClick = (event.target as HTMLElement).closest(
                ".driver-action",
              );
              if (!isActionClick) {
                openDrawer(record);
              }
            },
          })}
        />
      </div>
      <DriverDetails
        driver={selectedDriver || null}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedDriverId(null);
        }}
      />
      <Modal
        title={statusAction === "blocked" ? "Block Driver Account" : "Suspend Driver Account"}
        open={statusModalOpen}
        onOk={handleStatusSubmit}
        onCancel={() => setStatusModalOpen(false)}
        okText={statusAction === "blocked" ? "Block Driver" : "Suspend Driver"}
        okButtonProps={{ danger: statusAction === "blocked", className: statusAction === "suspended" ? "bg-orange-500 hover:bg-orange-600" : "" }}
      >
        <div className="py-4">
          <p className="mb-4 text-slate-600">
            You are about to {statusAction === "blocked" ? "permanently block" : "temporarily suspend"}{" "}
            <span className="font-bold text-slate-800">{selectedDriverForStatus?.full_name}</span>.
            The driver will be notified immediately.
          </p>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">
              Reason <span className="text-red-500">*</span>
            </label>
            <Input.TextArea
              rows={3}
              placeholder={`Enter the reason for ${statusAction}...`}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              className="rounded-xl"
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {(statusAction === "blocked" ? BLOCK_REASONS : SUSPEND_REASONS).map((reason, idx) => (
                <Tag
                  key={idx}
                  className="cursor-pointer hover:border-blue-400 transition-all m-0 px-2 py-0.5 text-[10px] rounded-md bg-slate-50 text-slate-500 font-medium"
                  onClick={() => setStatusReason(reason)}
                >
                  {reason}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DriverTable;
