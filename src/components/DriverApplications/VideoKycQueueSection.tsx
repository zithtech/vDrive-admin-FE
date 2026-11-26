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
  EyeOutlined,
  ClockCircleOutlined,
  UserOutlined,
  SearchOutlined,
  ReloadOutlined,
  CalendarOutlined,
  HistoryOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { Driver } from "../../store/slices/driverSlice";
import ScheduleKycAppointmentModal, {
  type TimeSlotOption,
  DEFAULT_TIME_SLOTS,
} from "./ScheduleKycAppointmentModal";
import AdminAvailabilityManager from "./AdminAvailabilityManager";
import VideoKycCallHistorySection from "./VideoKycCallHistorySection";

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

  // Stage 1 (0-2m: waiting), Stage 2 (2-4m: retrying), Stage 3 (4m+: timeout)
  const isRetrying = mins >= 2 && mins < 4;
  const isTimeout = mins >= 4;

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs">
      <ClockCircleOutlined
        className={
          isTimeout
            ? "text-rose-500 animate-spin"
            : isRetrying
              ? "text-amber-500 animate-pulse"
              : "text-blue-500"
        }
      />
      <span
        className={`font-bold px-1.5 py-0.5 rounded border ${
          isTimeout
            ? "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800"
            : isRetrying
              ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
              : "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800"
        }`}
      >
        {formatted}
      </span>
      <span className="text-[10px] text-slate-400 font-sans">
        {isTimeout
          ? "(Wait > 4m)"
          : isRetrying
            ? "(Attempt 2)"
            : "(Initial wait)"}
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
  // 5 Main Tabs
  const [activeTab, setActiveTab] = useState<
    "queue" | "needs_scheduling" | "scheduled" | "history" | "availability"
  >("queue");
  const [searchText, setSearchText] = useState("");

  // Scheduling Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [driverToSchedule, setDriverToSchedule] = useState<Driver | null>(null);

  // Time Slots & Double-Booking State
  const [timeSlots, setTimeSlots] = useState<TimeSlotOption[]>(DEFAULT_TIME_SLOTS);

  // Scheduled Appointments tracking state
  const [scheduledDriversMap, setScheduledDriversMap] = useState<
    Record<string, { date: string; slot: TimeSlotOption; officerName: string }>
  >({});

  // Categorize drivers based on status and elapsed time
  const liveWaitingDrivers = drivers.filter((d) => {
    const isWaiting =
      d.onboarding_status === "VIDEO_KYC_WAITING" ||
      d.onboarding_status === "VIDEO_KYC_RETRYING" ||
      d.onboarding_status === "VIDEO_KYC_IN_PROGRESS";

    // If driver already scheduled, don't show in live waiting
    if (scheduledDriversMap[d.driver_id || d.id || ""]) return false;

    // Check if waiting > 4 minutes (240s)
    const baseTime = (d as any).kyc_requested_at || (d as any).updated_at || d.created_at;
    const diffSeconds = baseTime ? dayjs().diff(dayjs(baseTime), "second") : 0;
    const isOver4Mins = diffSeconds >= 240;

    return isWaiting && !isOver4Mins;
  });

  const needsSchedulingDrivers = drivers.filter((d) => {
    // If already scheduled, exclude from needs scheduling
    if (scheduledDriversMap[d.driver_id || d.id || ""]) return false;

    const isPendingScheduleStatus =
      d.onboarding_status === "VIDEO_KYC_PENDING_SCHEDULING";

    const isWaiting =
      d.onboarding_status === "VIDEO_KYC_WAITING" ||
      d.onboarding_status === "VIDEO_KYC_RETRYING";

    const baseTime = (d as any).kyc_requested_at || (d as any).updated_at || d.created_at;
    const diffSeconds = baseTime ? dayjs().diff(dayjs(baseTime), "second") : 0;
    const isOver4Mins = diffSeconds >= 240;

    return isPendingScheduleStatus || (isWaiting && isOver4Mins);
  });

  const scheduledDrivers = drivers.filter((d) => {
    const driverId = d.driver_id || d.id || "";
    return (
      d.onboarding_status === "VIDEO_KYC_SCHEDULED" ||
      Boolean(scheduledDriversMap[driverId])
    );
  });

  // Handle opening schedule modal
  const handleOpenScheduleModal = (driver: Driver) => {
    setDriverToSchedule(driver);
    setScheduleModalOpen(true);
  };

  // Handle successful schedule
  const handleScheduleSuccess = (appointment: {
    driverId: string;
    date: string;
    slot: TimeSlotOption;
    officerName: string;
    notes?: string;
  }) => {
    // 1. Mark slot as booked in timeSlots to prevent double booking
    setTimeSlots((prev) =>
      prev.map((s) => {
        if (s.id === appointment.slot.id) {
          return {
            ...s,
            isBooked: true,
            bookedDriverName:
              driverToSchedule?.full_name ||
              `${driverToSchedule?.first_name || ""} ${driverToSchedule?.last_name || ""}`.trim() ||
              appointment.driverId,
          };
        }
        return s;
      }),
    );

    // 2. Track scheduled appointment
    setScheduledDriversMap((prev) => ({
      ...prev,
      [appointment.driverId]: {
        date: appointment.date,
        slot: appointment.slot,
        officerName: appointment.officerName,
      },
    }));

    // 3. Switch to Scheduled tab
    setActiveTab("scheduled");
  };

  // Filter current tab dataset by search text
  const getActiveData = () => {
    let list: Driver[] = [];
    if (activeTab === "queue") list = liveWaitingDrivers;
    else if (activeTab === "needs_scheduling") list = needsSchedulingDrivers;
    else if (activeTab === "scheduled") list = scheduledDrivers;

    if (!searchText) return list;
    const q = searchText.toLowerCase();
    return list.filter(
      (d) =>
        d.full_name?.toLowerCase().includes(q) ||
        d.phone_number?.includes(q) ||
        d.driver_id?.toLowerCase().includes(q) ||
        d.t2driver?.toLowerCase().includes(q) ||
        d.address?.city?.toLowerCase().includes(q),
    );
  };

  // Table Columns
  const columns = [
    {
      title: "DRIVER",
      key: "driver",
      width: 250,
      render: (_: any, record: Driver) => {
        const name =
          record.full_name ||
          `${record.first_name || ""} ${record.last_name || ""}`.trim() ||
          "Applicant";
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
                <span className="font-mono">{phone}</span>
                <span>•</span>
                <span>{city}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                ID: {driverId}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      title: "REQUEST STATUS",
      key: "status",
      width: 180,
      render: (_: any, record: Driver) => {
        const driverId = record.driver_id || record.id || "";
        const isScheduled =
          record.onboarding_status === "VIDEO_KYC_SCHEDULED" ||
          Boolean(scheduledDriversMap[driverId]);

        if (isScheduled) {
          const appointmentInfo = scheduledDriversMap[driverId];
          return (
            <div className="flex flex-col gap-0.5">
              <Tag color="green" icon={<CalendarOutlined />} className="font-bold text-xs uppercase m-0">
                Scheduled
              </Tag>
              {appointmentInfo && (
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  {appointmentInfo.slot.label}
                </span>
              )}
            </div>
          );
        }

        if (
          record.onboarding_status === "VIDEO_KYC_PENDING_SCHEDULING" ||
          activeTab === "needs_scheduling"
        ) {
          return (
            <Tag color="orange" icon={<ClockCircleOutlined />} className="font-bold text-xs uppercase">
              Needs Scheduling (&gt;4m)
            </Tag>
          );
        }

        if (record.onboarding_status === "VIDEO_KYC_RETRYING") {
          return (
            <Tag color="warning" className="font-bold text-xs uppercase animate-pulse">
              Retrying (Attempt 2)
            </Tag>
          );
        }

        if (record.onboarding_status === "VIDEO_KYC_IN_PROGRESS") {
          return (
            <Tag color="processing" className="font-bold text-xs uppercase">
              Call in Progress
            </Tag>
          );
        }

        return (
          <Tag color="cyan" className="font-bold text-xs uppercase">
            Waiting for Admin
          </Tag>
        );
      },
    },
    {
      title: activeTab === "scheduled" ? "APPOINTMENT TIME" : "ELAPSED WAIT",
      key: "time",
      width: 200,
      render: (_: any, record: Driver) => {
        const driverId = record.driver_id || record.id || "";
        const appointmentInfo = scheduledDriversMap[driverId];

        if (activeTab === "scheduled" && appointmentInfo) {
          return (
            <div className="flex flex-col text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {appointmentInfo.date}
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {appointmentInfo.slot.label}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {appointmentInfo.officerName}
              </span>
            </div>
          );
        }

        return (
          <LiveWaitTimer
            requestedAt={(record as any).kyc_requested_at}
            createdAt={record.created_at}
          />
        );
      },
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 220,
      align: "right" as const,
      render: (_: any, record: Driver) => {
        const driverId = record.driver_id || record.id || "";
        const isScheduled =
          record.onboarding_status === "VIDEO_KYC_SCHEDULED" ||
          Boolean(scheduledDriversMap[driverId]);
        const isNeedsSchedule =
          record.onboarding_status === "VIDEO_KYC_PENDING_SCHEDULING" ||
          activeTab === "needs_scheduling";

        return (
          <Space size="small">
            <Tooltip title="View Driver Details">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onViewDetails(record)}
              />
            </Tooltip>

            {isNeedsSchedule ? (
              <Button
                type="primary"
                size="small"
                icon={<CalendarOutlined />}
                className="bg-amber-600 hover:bg-amber-700 font-bold"
                onClick={() => handleOpenScheduleModal(record)}
              >
                Schedule Appointment
              </Button>
            ) : isScheduled ? (
              <Button
                type="primary"
                size="small"
                icon={<VideoCameraOutlined />}
                className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                onClick={() => onJoinCall(record)}
              >
                Start Call
              </Button>
            ) : (
              <Button
                type="primary"
                size="small"
                icon={<VideoCameraOutlined />}
                loading={kycLoadingDriverId === driverId}
                className="bg-blue-600 hover:bg-blue-700 font-bold"
                onClick={() => onJoinCall(record)}
              >
                Accept & Connect
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
      {/* Top Bar with Navigation Tabs */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/40">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Tab 1: Live Queue */}
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "queue"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <VideoCameraOutlined />
            <span>Live Waiting Queue</span>
            <Badge
              count={liveWaitingDrivers.length}
              style={{
                backgroundColor: activeTab === "queue" ? "#fff" : "#2563eb",
                color: activeTab === "queue" ? "#2563eb" : "#fff",
              }}
              size="small"
            />
          </button>

          {/* Tab 2: Needs Scheduling */}
          <button
            onClick={() => setActiveTab("needs_scheduling")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "needs_scheduling"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <ClockCircleOutlined />
            <span>Needs Scheduling (&gt;4m)</span>
            <Badge
              count={needsSchedulingDrivers.length}
              style={{
                backgroundColor: activeTab === "needs_scheduling" ? "#fff" : "#d97706",
                color: activeTab === "needs_scheduling" ? "#d97706" : "#fff",
              }}
              size="small"
            />
          </button>

          {/* Tab 3: Scheduled Appointments */}
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "scheduled"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <CalendarOutlined />
            <span>Scheduled Appointments</span>
            <Badge
              count={scheduledDrivers.length}
              style={{
                backgroundColor: activeTab === "scheduled" ? "#fff" : "#059669",
                color: activeTab === "scheduled" ? "#059669" : "#fff",
              }}
              size="small"
            />
          </button>

          {/* Tab 4: Call History */}
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "history"
                ? "bg-slate-700 dark:bg-slate-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <HistoryOutlined />
            <span>Call History</span>
          </button>

          {/* Tab 5: Admin Availability */}
          <button
            onClick={() => setActiveTab("availability")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "availability"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
            }`}
          >
            <SettingOutlined />
            <span>Admin Availability & Slots</span>
          </button>
        </div>

        {/* Search & Refresh (Only shown on queue/scheduling/scheduled tabs) */}
        {(activeTab === "queue" ||
          activeTab === "needs_scheduling" ||
          activeTab === "scheduled") && (
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
              <Tooltip title="Refresh Data">
                <Button
                  size="small"
                  icon={<ReloadOutlined className={loading ? "animate-spin" : ""} />}
                  onClick={onRefresh}
                />
              </Tooltip>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        {/* TAB 1, 2, 3: TABLES */}
        {(activeTab === "queue" ||
          activeTab === "needs_scheduling" ||
          activeTab === "scheduled") && (
          <Table
            columns={columns}
            dataSource={getActiveData()}
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
                    activeTab === "queue" ? (
                      <div className="flex flex-col items-center gap-1.5 py-4">
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          No drivers currently waiting in the live queue.
                        </span>
                        <p className="text-xs text-slate-400 max-w-sm text-center">
                          When a driver requests Video KYC on the Driver App, they will appear here with live 2-minute countdowns.
                        </p>
                      </div>
                    ) : activeTab === "needs_scheduling" ? (
                      <div className="flex flex-col items-center gap-1.5 py-4">
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          No pending scheduling requests.
                        </span>
                        <p className="text-xs text-slate-400 max-w-sm text-center">
                          Drivers whose live wait reaches 4 minutes without connection automatically move here for appointment slot booking.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 py-4">
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          No scheduled Video KYC appointments yet.
                        </span>
                      </div>
                    )
                  }
                />
              ),
            }}
          />
        )}

        {/* TAB 4: CALL HISTORY */}
        {activeTab === "history" && <VideoKycCallHistorySection />}

        {/* TAB 5: ADMIN AVAILABILITY */}
        {activeTab === "availability" && (
          <AdminAvailabilityManager
            slots={timeSlots}
            onSlotsChange={(newSlots) => setTimeSlots(newSlots)}
          />
        )}
      </div>

      {/* SCHEDULE MODAL */}
      <ScheduleKycAppointmentModal
        open={scheduleModalOpen}
        driver={driverToSchedule}
        onClose={() => {
          setScheduleModalOpen(false);
          setDriverToSchedule(null);
        }}
        onSuccess={handleScheduleSuccess}
        availableSlots={timeSlots}
      />
    </div>
  );
};

export default VideoKycQueueSection;
