import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Tag,
  Avatar,
  Badge,
  Tooltip,
  Input,
  Space,
  Empty,
} from "antd";
import {
  VideoCameraOutlined,
  PhoneOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  IdcardOutlined,
  CarOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { Driver } from "../../store/slices/driverSlice";

dayjs.extend(relativeTime);

interface VideoKycQueueSectionProps {
  drivers: Driver[];
  loading?: boolean;
  onJoinCall: (driver: Driver) => void;
  onViewDetails: (driver: Driver) => void;
  onRefresh?: () => void;
  kycLoadingDriverId?: string | null;
}

// Live ticking timer component for each waiting driver
const LiveWaitTimer: React.FC<{ requestedAt?: string; createdAt?: string }> = ({
  requestedAt,
  createdAt,
}) => {
  const baseTime = requestedAt || createdAt || new Date().toISOString();
  const [secondsElapsed, setSecondsElapsed] = useState(() => {
    return Math.max(0, dayjs().diff(dayjs(baseTime), "second"));
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsElapsed(Math.max(0, dayjs().diff(dayjs(baseTime), "second")));
    }, 1000);
    return () => clearInterval(interval);
  }, [baseTime]);

  const mins = Math.floor(secondsElapsed / 60);
  const secs = secondsElapsed % 60;
  const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const isUrgent = mins >= 3;

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs">
      <ClockCircleOutlined
        className={isUrgent ? "text-rose-500 animate-spin" : "text-amber-500"}
      />
      <span
        className={`font-bold ${
          isUrgent
            ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800"
            : "text-slate-700 dark:text-slate-300"
        }`}
      >
        {formatted}
      </span>
      <span className="text-[10px] text-slate-400 font-sans">
        ({dayjs(baseTime).fromNow()})
      </span>
    </div>
  );
};

export const VideoKycQueueSection: React.FC<VideoKycQueueSectionProps> = ({
  drivers,
  loading = false,
  onJoinCall,
  onViewDetails,
  onRefresh,
  kycLoadingDriverId,
}) => {
  const [subTab, setSubTab] = useState<"queue" | "eligible" | "all">("queue");
  const [searchText, setSearchText] = useState("");

  // Categorize drivers
  const waitingDrivers = drivers.filter(
    (d) =>
      d.onboarding_status === "VIDEO_KYC_WAITING" ||
      d.onboarding_status === "VIDEO_KYC_IN_PROGRESS",
  );

  const eligibleDrivers = drivers.filter(
    (d) =>
      d.onboarding_status !== "VIDEO_KYC_WAITING" &&
      d.onboarding_status !== "VIDEO_KYC_IN_PROGRESS" &&
      d.status !== "rejected" &&
      d.onboarding_status !== "DOCS_REJECTED",
  );

  // Active dataset based on subTab
  const activeDataset =
    subTab === "queue"
      ? waitingDrivers
      : subTab === "eligible"
      ? eligibleDrivers
      : drivers;

  // Search filter
  const filteredData = activeDataset.filter((d) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      d.full_name?.toLowerCase().includes(q) ||
      d.phone_number?.includes(q) ||
      d.driver_id?.toLowerCase().includes(q) ||
      d.t2driver?.toLowerCase().includes(q) ||
      d.address?.city?.toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      title: "DRIVER",
      key: "driver",
      width: 260,
      render: (_: any, record: Driver) => {
        const name = record.full_name || `${record.first_name || ""} ${record.last_name || ""}`.trim() || "Applicant";
        const phone = record.phone_number || "—";
        const driverId = record.t2driver || record.driver_id || record.id || "";
        const city = record.address?.city || (record as any).city || "—";

        return (
          <div className="flex items-center gap-3">
            <Avatar
              size={40}
              src={record.profile_pic_url}
              icon={<UserOutlined />}
              className="bg-blue-600 text-white font-bold flex-shrink-0"
            >
              {name[0]?.toUpperCase()}
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                {name}
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>{phone}</span>
                <span>•</span>
                <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                  {driverId}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">{city}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: "KYC STATUS",
      key: "status",
      width: 170,
      render: (_: any, record: Driver) => {
        if (record.onboarding_status === "VIDEO_KYC_WAITING") {
          return (
            <div className="flex flex-col gap-1 items-start">
              <Tag
                color="cyan"
                className="m-0 font-bold text-[11px] uppercase tracking-wider px-2 py-0.5 animate-pulse border-cyan-400"
              >
                📹 Waiting In Call
              </Tag>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">
                Driver online in room
              </span>
            </div>
          );
        }
        if (record.onboarding_status === "VIDEO_KYC_IN_PROGRESS") {
          return (
            <div className="flex flex-col gap-1 items-start">
              <Tag
                color="orange"
                className="m-0 font-bold text-[11px] uppercase tracking-wider px-2 py-0.5 border-orange-400"
              >
                📞 KYC In Progress
              </Tag>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                Session active
              </span>
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-1 items-start">
            <Tag color="purple" className="m-0 text-[11px] uppercase font-semibold">
              {record.onboarding_status || "DOCS SUBMITTED"}
            </Tag>
            <span className="text-[10px] text-slate-400">Eligible for Live Call</span>
          </div>
        );
      },
    },
    {
      title: "QUEUE TIME / REQUESTED",
      key: "queue_time",
      width: 200,
      render: (_: any, record: Driver) => {
        const isWaiting =
          record.onboarding_status === "VIDEO_KYC_WAITING" ||
          record.onboarding_status === "VIDEO_KYC_IN_PROGRESS";

        if (isWaiting) {
          return (
            <LiveWaitTimer
              requestedAt={record.status_updated_at || record.updated_at}
              createdAt={record.created_at}
            />
          );
        }

        return (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {record.created_at ? dayjs(record.created_at).format("DD MMM YYYY, hh:mm A") : "—"}
          </span>
        );
      },
    },
    {
      title: "DOCUMENTS",
      key: "documents",
      width: 220,
      render: (_: any, record: Driver) => {
        const docs = record.documents || [];
        const hasAadhaar = docs.some((d) => d.document_type?.toLowerCase().includes("aadhaar"));
        const hasDL = docs.some((d) => d.document_type?.toLowerCase().includes("license") || d.document_type?.toLowerCase().includes("dl"));
        const hasPAN = docs.some((d) => d.document_type?.toLowerCase().includes("pan"));
        const hasRC = docs.some((d) => d.document_type?.toLowerCase().includes("rc") || d.document_type?.toLowerCase().includes("vehicle"));

        return (
          <div className="flex flex-wrap gap-1">
            <Tooltip title={hasDL ? "Driving License Uploaded" : "Driving License Missing"}>
              <Tag
                icon={<CarOutlined />}
                color={hasDL ? "success" : "default"}
                className="text-[10px] m-0"
              >
                DL
              </Tag>
            </Tooltip>
            <Tooltip title={hasAadhaar ? "Aadhaar Card Uploaded" : "Aadhaar Missing"}>
              <Tag
                icon={<IdcardOutlined />}
                color={hasAadhaar ? "success" : "default"}
                className="text-[10px] m-0"
              >
                Aadhaar
              </Tag>
            </Tooltip>
            <Tooltip title={hasPAN ? "PAN Card Uploaded" : "PAN Missing"}>
              <Tag
                icon={<CheckCircleOutlined />}
                color={hasPAN ? "success" : "default"}
                className="text-[10px] m-0"
              >
                PAN
              </Tag>
            </Tooltip>
            <Tooltip title={hasRC ? "Vehicle RC Uploaded" : "RC Missing"}>
              <Tag color={hasRC ? "success" : "default"} className="text-[10px] m-0">
                RC
              </Tag>
            </Tooltip>
          </div>
        );
      },
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 200,
      render: (_: any, record: Driver) => {
        const isWaiting = record.onboarding_status === "VIDEO_KYC_WAITING";
        const isInProgress = record.onboarding_status === "VIDEO_KYC_IN_PROGRESS";
        const driverId = record.driver_id || record.id || "";
        const isThisLoading = kycLoadingDriverId === driverId;

        return (
          <Space orientation="horizontal" size="small">
            {isWaiting || isInProgress ? (
              <Button
                type="primary"
                size="small"
                icon={<VideoCameraOutlined />}
                className="bg-emerald-600 hover:bg-emerald-500 border-0 font-bold text-xs shadow-sm flex items-center"
                loading={isThisLoading}
                onClick={() => onJoinCall(record)}
              >
                {isInProgress ? "Rejoin Call" : "Answer Call"}
              </Button>
            ) : (
              <Button
                type="primary"
                size="small"
                icon={<VideoCameraOutlined />}
                className="bg-blue-600 hover:bg-blue-500 border-0 font-bold text-xs shadow-sm flex items-center"
                loading={isThisLoading}
                onClick={() => onJoinCall(record)}
              >
                Start Video KYC
              </Button>
            )}

            <Tooltip title="Inspect Documents & Full Application">
              <Button
                size="small"
                icon={<EyeOutlined />}
                className="text-slate-600 dark:text-slate-300"
                onClick={() => onViewDetails(record)}
              />
            </Tooltip>

            {record.phone_number && (
              <Tooltip title={`Call: ${record.phone_number}`}>
                <Button
                  size="small"
                  icon={<PhoneOutlined />}
                  className="text-slate-600 dark:text-slate-300"
                  href={`tel:${record.phone_number}`}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-sm shadow-sm">
      {/* Top Banner / Notification if drivers are waiting */}
      {waitingDrivers.length > 0 && (
        <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-transparent border-b border-cyan-200 dark:border-cyan-800/40 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <div>
              <span className="font-bold text-xs text-cyan-900 dark:text-cyan-200">
                📹 {waitingDrivers.length} Driver{waitingDrivers.length > 1 ? "s" : ""} waiting in the Live Video KYC Room!
              </span>
              <p className="text-[11px] text-cyan-700 dark:text-cyan-400 m-0">
                Please pick up pending requests to complete driver document verification.
              </p>
            </div>
          </div>
          <Button
            type="primary"
            size="small"
            className="bg-cyan-600 hover:bg-cyan-500 border-0 text-xs font-bold shadow-sm"
            onClick={() => setSubTab("queue")}
          >
            View Live Queue ({waitingDrivers.length})
          </Button>
        </div>
      )}

      {/* Control Bar */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 flex-shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
        {/* Sub-tab pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab("queue")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === "queue"
                ? "bg-cyan-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <span>Live Waiting Queue</span>
            <Badge
              count={waitingDrivers.length}
              style={{
                backgroundColor: subTab === "queue" ? "#fff" : "#06b6d4",
                color: subTab === "queue" ? "#0891b2" : "#fff",
              }}
              size="small"
            />
          </button>

          <button
            onClick={() => setSubTab("eligible")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === "eligible"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <span>Eligible Applicants</span>
            <span className="text-[10px] opacity-80">({eligibleDrivers.length})</span>
          </button>

          <button
            onClick={() => setSubTab("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === "all"
                ? "bg-slate-700 dark:bg-slate-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <span>All ({drivers.length})</span>
          </button>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <Input
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Search driver by name, phone, city..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            size="small"
            className="w-64"
          />
          {onRefresh && (
            <Tooltip title="Refresh Queue">
              <Button
                size="small"
                icon={<ReloadOutlined className={loading ? "animate-spin" : ""} />}
                onClick={onRefresh}
              />
            </Tooltip>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey={(r) => r.driver_id || r.id || String(Math.random())}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            size: "small",
            className: "!px-4 !py-2",
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  subTab === "queue" ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                        No drivers currently waiting in the video queue.
                      </span>
                      <p className="text-xs text-slate-400 max-w-sm text-center">
                        When a driver opens the video KYC screen on their app, they will appear here instantly.
                        You can also proactively initiate a call from the <strong>Eligible Applicants</strong> tab.
                      </p>
                      <Button
                        type="default"
                        size="small"
                        onClick={() => setSubTab("eligible")}
                        className="mt-1"
                      >
                        Browse Eligible Applicants
                      </Button>
                    </div>
                  ) : (
                    "No applications match the search criteria"
                  )
                }
              />
            ),
          }}
          rowClassName={(record) =>
            record.onboarding_status === "VIDEO_KYC_WAITING"
              ? "bg-cyan-50/40 dark:bg-cyan-950/20"
              : ""
          }
        />
      </div>
    </div>
  );
};

export default VideoKycQueueSection;
