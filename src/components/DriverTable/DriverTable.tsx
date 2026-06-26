// components/DriverTable/DriverTable.tsx
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Table,
  Tag,
  Avatar,
  Tooltip,
  Button,
  Input,
  Dropdown,
  message,
  Modal,
} from "antd";
import { useAppDispatch } from "../../store/hooks";
import { updateDriverStatus } from "../../store/slices/driverSlice";
import type { ColumnsType } from "antd/es/table";
import type { Driver } from "../../store/slices/driverSlice";
import {
  CopyOutlined,
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  StopOutlined,
  ClockCircleOutlined,
  FileTextOutlined,

} from "@ant-design/icons";

import DriverDetails, { getMediaUrl } from "../DriverDetails/DriverDetails";
import { useHasPermission } from "../../hooks/usePermission";

interface DriverTableProps {
  data: Driver[];
  onViewDetails?: (driver: Driver) => void;
}



const DriverTable = ({ data, onViewDetails }: DriverTableProps) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);


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
      const foundDriver = data.find(
        (d) => String(d.driverId || d.driver_id || d.id || "") === String(targetDriverId),
      );

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
      const driverId = String(
        selectedDriverForStatus.driverId ||
        selectedDriverForStatus.driver_id ||
        selectedDriverForStatus.id,
      );
      try {
        await dispatch(
          updateDriverStatus({
            driver_id: driverId,
            status: statusAction as any,
            status_reason: statusReason,
          }),
        ).unwrap();
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
    "Repeat offenses after multiple suspensions.",
  ];

  const SUSPEND_REASONS = [
    "Pending investigation of a recent customer complaint.",
    "Low completion rate consistently below threshold.",
    "Vehicle maintenance or document audit required.",
    "Inappropriate behavior reported by passenger.",
  ];

  const columns: ColumnsType<Driver> = [
    {
      title: "DRIVER",
      dataIndex: "full_name",
      key: "driver",
      width: 170,
      fixed: "left" as const,
      render: (_, record) => (
        <div className="flex items-center gap-2.5">
          <Avatar
            src={getMediaUrl(record.profilePicUrl || record.profile_pic_url)}
            size={28}
            style={{
              backgroundColor: "#eff6ff",
              color: "#2563eb",
              fontWeight: 600,
              fontSize: "12px",
            }}
            className="flex-shrink-0"
          >
            {record.full_name?.charAt(0)}
          </Avatar>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-[13px] truncate">
              {record.full_name}
            </span>
            <Tooltip title="Verified Profile">
              <span className="text-emerald-500 flex items-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </span>
            </Tooltip>
          </div>
        </div>
      ),
    },
    {
      title: "DRIVER ID",
      key: "driver_id",
      width: 130,
      render: (_, record) => (
        <div className="flex items-center gap-1.5 group/copy">
          <span className="text-slate-500 dark:text-slate-400 text-[12px] font-medium font-mono truncate">
            {record.vdrive_id || record.driverId || record.driver_id || record.id || "VDD-NEW"}
          </span>
          <Tooltip title="Copy ID">
            <CopyOutlined
              className="text-[12px] text-slate-300 hover:text-indigo-500 cursor-pointer transition-colors opacity-0 group-hover/copy:opacity-100 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                const idToCopy = record.vdrive_id || record.driverId || record.driver_id || record.id || "";
                navigator.clipboard.writeText(idToCopy);
                message.success({
                  content: "Driver ID copied",
                  className: "premium-message",
                  icon: <CopyOutlined className="text-indigo-500" />,
                });
              }}
            />
          </Tooltip>
        </div>
      ),
    },
    {
      title: "DUTY",
      key: "duty_status",
      width: 110,
      render: (_, record) => {
        const isOnline = record.availability?.online === true || record.is_online === true || record.isOnDuty === true || record.duty_status === "online";
        return (
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}></span>
            <span className={`text-[11px] font-bold tracking-wider uppercase ${isOnline ? "text-emerald-600 dark:text-emerald-500" : "text-slate-500 dark:text-slate-400"}`}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        );
      },
    },
    {
      title: "SOURCE / DOCS",
      key: "documents",
      width: 160,
      render: (_, record) => {
        const allDocs = ["profile_selfie", "aadhar_card", "pan_card", "driving_license"];
        const submittedDocs = record.documents?.filter(d => allDocs.includes(d.document_type?.toLowerCase() === "aadhaar_card" ? "aadhar_card" : d.document_type?.toLowerCase() || "")) || [];
        const verifiedCount = submittedDocs.filter(d => (d.license_status || (d as any).status) === "verified").length;

        return (
          <div className="inline-flex items-center gap-1.5 px-1 py-0.5">
            <FileTextOutlined className="text-slate-400 text-[12px]" />
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
              {verifiedCount}/{allDocs.length} Verified
            </span>
          </div>
        );
      },
    },
    {
      title: "STATUS",
      dataIndex: "status",
      width: 150,
      key: "status",
      sorter: (a: Driver, b: Driver) => a.status.localeCompare(b.status),
      render: (status: string) => {
        const isActive = status?.toLowerCase() === "active";
        return (
          <div className="inline-flex items-center px-1 py-0.5">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isActive ? "text-emerald-600 dark:text-emerald-500" : "text-slate-500 dark:text-slate-400"}`}>
              {status.replace("_", " ")}
            </span>
          </div>
        );
      },
    },
    {
      title: "CONTACT",
      key: "contact",
      width: 180,
      render: (_, record) => (
        <div className="flex flex-col">
          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-200 truncate">
            {record.phone_number}
          </span>
          <span className="text-[12px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
            {record.email}
          </span>
        </div>
      ),
    },
    {
      title: "RATING",
      dataIndex: "rating",
      width: 110,
      key: "rating",
      sorter: (a: Driver, b: Driver) => (Number(a.rating) || 0) - (Number(b.rating) || 0),
      render: (rating: any) => {
        const numericRating = Number(rating) || 0;
        return (
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
              {numericRating.toFixed(1)}
            </span>
            <span className="text-amber-400 text-[14px] leading-none -mt-[2px]">★</span>
          </div>
        );
      },
    },
    {
      title: "EARNINGS",
      dataIndex: ["payments", "total_earnings"],
      width: 150,
      key: "earnings",
      sorter: (a: Driver, b: Driver) =>
        (a.payments?.total_earnings || 0) - (b.payments?.total_earnings || 0),
      render: (earnings: number) => (
        <div className="flex items-center text-[14px]">
          <span className="text-slate-400 mr-1.5 font-medium text-[13px]">₹</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {(earnings || 0).toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      title: "ACTIONS",
      key: "action",
      width: 90,
      fixed: "right" as const,
      align: "center" as const,
      render: (_, record) => {
        const menuItems = [
          {
            key: "view",
            icon: <EyeOutlined className="text-gray-400" />,
            label: "View Details",
          },
          ...(canUpdateDriver
            ? [
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
            ]
            : []),
        ];
        return (
          <Dropdown
            menu={{
              items: menuItems,
              onClick: ({ key }) => handleMenuClick(key, record),
            }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              icon={<MoreOutlined className="text-[18px]" />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
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
            border-bottom: 1px solid #f1f5f9 !important;
            border-top: 1px solid #f1f5f9 !important;
            color: #64748b !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            font-size: 12px !important;
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
          .premium-table-flat .ant-table-row {
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .premium-table-flat .ant-table-row > td {
            border-bottom: 1px solid #f8fafc !important;
            padding: 4px 12px !important;
            background: #ffffff !important;
          }
          .premium-table-flat .ant-table-row:hover > td {
            background: #f8fafc !important;
          }
          .premium-table-flat .ant-table-tbody > tr > td.ant-table-column-sort {
            background: #ffffff !important;
          }
          .premium-table-flat .ant-table-row:hover > td.ant-table-column-sort {
            background: #f8fafc !important;
          }
          .premium-table-flat .ant-table-thead > tr > th.ant-table-column-has-sorters:hover {
            background: #f8fafc !important;
          }
          .premium-table-flat .ant-table {
            background: transparent !important;
          }
          .premium-table-flat .ant-table-cell-fix-left,
          .premium-table-flat .ant-table-cell-fix-right {
            background: #ffffff !important;
          }
          .premium-table-flat .ant-table-cell-fix-left::after,
          .premium-table-flat .ant-table-cell-fix-right::after {
            box-shadow: none !important;
          }
          .premium-table-flat .ant-table-row:hover > .ant-table-cell-fix-left,
          .premium-table-flat .ant-table-row:hover > .ant-table-cell-fix-right {
            background: #f8fafc !important;
          }
          .premium-table-flat .ant-table-thead > tr > .ant-table-cell-fix-left,
          .premium-table-flat .ant-table-thead > tr > .ant-table-cell-fix-right {
            background: #ffffff !important;
          }
          .premium-table-flat .ant-table-cell-fix-left-last::after,
          .premium-table-flat .ant-table-cell-fix-right-first::after {
            box-shadow: none !important;
          }
          
          /* BULLETPROOF DARK MODE OVERRIDES */
          html.dark .premium-table-flat .ant-table-thead > tr > th {
            background: #1e293b !important;
            border-bottom: 1px solid #334155 !important;
            border-top: 1px solid #334155 !important;
            color: #94a3b8 !important;
          }
          html.dark .premium-table-flat .ant-table-thead > tr > th::before {
            background-color: #334155 !important;
          }
          html.dark .premium-table-flat .ant-table-cell-fix-left,
          html.dark .premium-table-flat .ant-table-cell-fix-right {
            background: #1e293b !important;
          }
          html.dark .premium-table-flat .ant-table-row > td {
            background: #1e293b !important;
            border-bottom: 1px solid #334155 !important;
          }
          html.dark .premium-table-flat .ant-table-row:hover > td,
          html.dark .premium-table-flat .ant-table-row:hover > .ant-table-cell-fix-left,
          html.dark .premium-table-flat .ant-table-row:hover > .ant-table-cell-fix-right {
            background: #334155 !important;
          }
          html.dark .premium-table-flat .ant-table-thead > tr > .ant-table-cell-fix-left,
          html.dark .premium-table-flat .ant-table-thead > tr > .ant-table-cell-fix-right {
            background: #1e293b !important;
          }
          
          /* Visual Table Box */
          .premium-table-flat,
          .premium-table-flat .ant-spin-nested-loading,
          .premium-table-flat .ant-spin-container {
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          .premium-table-flat .ant-table {
            flex: 1;
          }
          
          .premium-table-flat .ant-table-container {
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            background: #ffffff;
            overflow: hidden;
            height: 100%;
          }
          html.dark .premium-table-flat .ant-table-container {
            border-color: #334155;
            background: #1e293b;
          }

          /* PAGINATION OUTSIDE BOX */
          .premium-pagination {
            display: flex !important;
            align-items: center !important;
            justify-content: flex-end !important;
            padding: 16px 8px !important;
            margin: 0 !important;
            margin-top: auto !important;
            background: transparent !important;
            border-top: none !important;
          }
          .premium-pagination .ant-pagination-total-text {
            margin-right: auto !important;
            color: #64748b !important;
          }
        `}
      </style>
      <div className="h-full w-full flex flex-col">
        <Table
          rowSelection={{
            type: 'checkbox',
            onChange: (selectedRowKeys) => {
              console.log('selectedRowKeys: ', selectedRowKeys);
            },
            columnWidth: 40,
          }}
          columns={columns}
          dataSource={data}
          rowKey={(record) => record.driver_id || record.id || ""}
          pagination={false}
          showSorterTooltip={false}
          tableLayout="fixed"
          size="small"
          scroll={{ x: 1200 }}
          className="premium-table-flat"
          onRow={(record) => ({
            onClick: (event) => {
              const target = event.target as HTMLElement;
              const isActionClick = target.closest(".ant-dropdown-trigger") || target.closest(".ant-checkbox-wrapper");
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
        okButtonProps={{
          danger: statusAction === "blocked",
          className: statusAction === "suspended" ? "bg-orange-500 hover:bg-orange-600" : "",
        }}
      >
        <div className="py-4">
          <p className="mb-4 text-slate-600">
            You are about to{" "}
            {statusAction === "blocked" ? "permanently block" : "temporarily suspend"}{" "}
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
