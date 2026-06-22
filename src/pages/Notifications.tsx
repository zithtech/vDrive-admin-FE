import React, { useState, useEffect } from "react";
import { Button, Modal, notification, Select, Input, DatePicker, Pagination } from "antd";
import {
  PlusOutlined,
  ExclamationCircleOutlined,
  BellOutlined,
  UserOutlined,
  CarOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchCoupons } from "../store/slices/couponSlice";
import { fetchPromos } from "../store/slices/promoSlice";
import { fetchCustomers } from "../store/slices/customerSlice";
import { fetchDrivers } from "../store/slices/driverSlice";
import NotificationTable from "../components/Notifications/NotificationTable";
import NotificationDrawer from "../components/Notifications/NotificationDrawer";
import NotificationNotifyModal from "../components/Notifications/NotificationNotifyModal";
import {
  fetchNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
} from "../store/slices/notificationSlice";
import { useHasPermission } from "../hooks/usePermission";
import dayjs from "dayjs";

const { confirm } = Modal;

// Beautiful SVG Sparkline helper component matching the mockup designs
const Sparkline: React.FC<{ color: string }> = ({ color }) => {
  let strokeColor = "#3b82f6";
  let gradientId = "blue-grad";
  let stopColor = "#3b82f6";

  if (color === "green") {
    strokeColor = "#10b981";
    gradientId = "green-grad";
    stopColor = "#10b981";
  } else if (color === "orange") {
    strokeColor = "#f59e0b";
    gradientId = "orange-grad";
    stopColor = "#f59e0b";
  } else if (color === "red") {
    strokeColor = "#ef4444";
    gradientId = "red-grad";
    stopColor = "#ef4444";
  }

  return (
    <svg className="w-20 h-6 opacity-70" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stopColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={stopColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 25 C15 20, 30 28, 50 16 C70 4, 85 8, 100 2 L100 30 L0 30 Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M0 25 C15 20, 30 28, 50 16 C70 4, 85 8, 100 2"
        stroke={strokeColor}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
};

const NotificationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const canCreate = useHasPermission("notifications", "create");
  const canUpdate = useHasPermission("notifications", "update");
  const canDelete = useHasPermission("notifications", "delete");
  const hasCouponsRead = useHasPermission("coupons", "read");
  const hasPromosRead = useHasPermission("promos", "read");
  const hasCustomersRead = useHasPermission("customers", "read");
  const hasDriversRead = useHasPermission("drivers", "read");
  const { role } = useAppSelector((state) => state.auth);
  const isSuperAdmin = role === "super_admin";

  const hasCreateAccess = isSuperAdmin || canCreate;
  const hasUpdateAccess = isSuperAdmin || canUpdate;
  const hasDeleteAccess = isSuperAdmin || canDelete;

  const [mainTab, setMainTab] = useState<"CUSTOMER" | "DRIVER">("CUSTOMER");
  const [subTab, setSubTab] = useState<"NOTIFICATIONS">("NOTIFICATIONS");

  // Filters state
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<any>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, dateRange, mainTab]);

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [notifyModalVisible, setNotifyModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [editingNotification, setEditingNotification] = useState<any>(null);

  const { notifications: data, isLoading: loading } = useAppSelector((state) => state.notification);

  useEffect(() => {
    if (isSuperAdmin || hasCouponsRead) {
      dispatch(fetchCoupons());
    }
    if (isSuperAdmin || hasPromosRead) {
      dispatch(fetchPromos());
    }
    if (isSuperAdmin || hasCustomersRead) {
      dispatch(fetchCustomers());
    }
    if (isSuperAdmin || hasDriversRead) {
      dispatch(fetchDrivers());
    }
    dispatch(fetchNotifications(mainTab));
  }, [
    dispatch,
    mainTab,
    isSuperAdmin,
    hasCouponsRead,
    hasPromosRead,
    hasCustomersRead,
    hasDriversRead,
  ]);

  const handleCreateNew = () => {
    setEditingNotification(null);
    setDrawerVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingNotification(record);
    setDrawerVisible(true);
  };

  const handleDelete = (id: string) => {
    confirm({
      title: "Delete Notification?",
      icon: <ExclamationCircleOutlined />,
      content: "This will remove the notification record from the system.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await dispatch(deleteNotification({ id, target_type: mainTab })).unwrap();
          notification.success({ message: "Notification deleted" });
        } catch (err: any) {
          notification.error({ message: err || "Failed to delete notification" });
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingNotification?.id) {
        await dispatch(
          updateNotification({
            id: editingNotification.id,
            notificationData: { ...values, target_type: mainTab },
          }),
        ).unwrap();
        notification.success({ message: "Notification template updated successfully" });
      } else {
        await dispatch(createNotification({ ...values, target_type: mainTab })).unwrap();
        notification.success({ message: "Notification template created successfully" });
      }
      setDrawerVisible(false);
    } catch (err: any) {
      notification.error({ message: err || "Failed to save notification" });
    }
  };

  const handleOpenNotifyModal = (record: any) => {
    setSelectedNotification(record);
    setNotifyModalVisible(true);
  };

  // Filter computation logic
  const filteredData = React.useMemo(() => {
    if (!data) return [];
    let result = [...data];

    // 1. Status Filter
    if (statusFilter) {
      result = result.filter((item) => item.notify_status === statusFilter);
    }

    // 2. Search Query (Title or Body)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.body?.toLowerCase().includes(q)
      );
    }

    // 3. Date Range Filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf("day");
      const end = dateRange[1].endOf("day");
      result = result.filter((item) => {
        if (!item.created_at) return false;
        const date = dayjs(item.created_at);
        return (date.isAfter(start) || date.isSame(start)) && (date.isBefore(end) || date.isSame(end));
      });
    }

    return result;
  }, [data, statusFilter, searchQuery, dateRange]);

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Dynamic statistics for top status cards
  const stats = React.useMemo(() => {
    const list = data || [];
    return [
      {
        title: "Total Notifications",
        value: list.length,
        label: "templates",
        icon: <BellOutlined />,
        iconColor: "text-blue-500 dark:text-blue-400",
        iconBg: "bg-blue-50 dark:bg-blue-500/10",
        sparklineColor: "blue",
      },
      {
        title: "Completed",
        value: list.filter((n) => n.notify_status === "COMPLETED").length,
        label: "dispatches",
        icon: <CheckCircleOutlined />,
        iconColor: "text-emerald-500 dark:text-emerald-400",
        iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
        sparklineColor: "green",
      },
      {
        title: "Pending",
        value: list.filter((n) => n.notify_status === "PENDING").length,
        label: "scheduled",
        icon: <ClockCircleOutlined />,
        iconColor: "text-amber-500 dark:text-amber-400",
        iconBg: "bg-amber-50 dark:bg-amber-500/10",
        sparklineColor: "orange",
      },
      {
        title: "Failed",
        value: list.filter((n) => n.notify_status === "FAILED").length,
        label: "undelivered",
        icon: <ExclamationCircleOutlined />,
        iconColor: "text-rose-500 dark:text-rose-400",
        iconBg: "bg-rose-50 dark:bg-rose-500/10",
        sparklineColor: "red",
      },
    ];
  }, [data]);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900">
      <div className="w-full h-full flex flex-col md:flex-row bg-slate-50/50 dark:bg-slate-950/25 overflow-hidden">
        {/* ─── Left Sidebar Panel ─────────────────────────────────────── */}
        <div className="w-full md:w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/80 flex flex-col p-4 gap-4 overflow-y-auto custom-scrollbar">
          {/* Header Title / Context */}
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BellOutlined className="text-base" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 tracking-tight text-xs uppercase leading-none">
                Notification Center
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Design and dispatch push notifications
              </span>
            </div>
          </div>

          {/* Action Button: Compose */}
          {hasCreateAccess && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateNew}
              className="w-full h-9 rounded-lg font-bold text-xs uppercase tracking-wider border-none !bg-blue-600 hover:!bg-blue-700 text-white shadow-sm flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-all"
            >
              Compose New
            </Button>
          )}

          {/* Sidenav views section */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase px-2 mb-0.5">
              Views
            </span>

            {/* View: Notifications */}
            <div
              onClick={() => setSubTab("NOTIFICATIONS")}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${subTab === "NOTIFICATIONS"
                ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <BellOutlined className="text-xs" />
                <span>Notifications</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${subTab === "NOTIFICATIONS"
                ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}>
                {data.length}
              </span>
            </div>

            {/* View: Customers Only */}
            <div
              onClick={() => {
                setMainTab("CUSTOMER");
              }}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "CUSTOMER"
                ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <UserOutlined className="text-xs" />
                <span>Customers Only</span>
              </div>
              {mainTab === "CUSTOMER" && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                  {data.length}
                </span>
              )}
            </div>

            {/* View: Drivers Only */}
            <div
              onClick={() => {
                setMainTab("DRIVER");
              }}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "DRIVER"
                ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <CarOutlined className="text-xs" />
                <span>Drivers Only</span>
              </div>
              {mainTab === "DRIVER" && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                  {data.length}
                </span>
              )}
            </div>
          </div>

          <div className="h-[1px] bg-slate-100 dark:bg-slate-800/80" />

          {/* Filters section */}
          <div className="flex flex-col gap-3">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase px-2">
              Filters
            </span>

            {/* Filter: Status */}
            <div className="flex flex-col gap-1 px-2">
              <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Status
              </span>
              <Select
                placeholder="All Statuses"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                className="w-full text-xs premium-select-sidebar"
                options={[
                  { value: "PENDING", label: "Pending" },
                  { value: "PROCESSING", label: "Processing" },
                  { value: "COMPLETED", label: "Completed" },
                  { value: "FAILED", label: "Failed" },
                ]}
              />
            </div>

            {/* Filter: Date Range */}
            <div className="flex flex-col gap-1 px-2">
              <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Created Date
              </span>
              <DatePicker.RangePicker
                value={dateRange}
                onChange={setDateRange}
                className="w-full text-xs premium-range-picker-sidebar"
                placeholder={["Start", "End"]}
              />
            </div>
          </div>
        </div>

        {/* ─── Right Content Area ─────────────────────────────────────── */}
        <div className="flex-grow flex flex-col min-w-0 relative h-full">
          <div className="flex-grow flex flex-col p-6 overflow-y-auto custom-scrollbar gap-5 pb-20">

            {/* Top Bar: Search Input & Results Count (mockup style) */}
            <div className="flex items-center justify-between gap-4 px-0 py-0.5 md:flex-nowrap flex-wrap">
              <div className="flex items-center gap-3 flex-grow flex-shrink-0">
                <Input
                  placeholder="Search notification..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                  prefix={<SearchOutlined className="text-slate-400 text-xs" />}
                  className="w-48 text-xs rounded-xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 h-9"
                />
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {filteredData.length} results
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">

                <span className="text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider">
                  {mainTab} Ledger
                </span>
              </div>
            </div>

            {/* Status Cards Grid Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-0">
              {stats.map((card, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 flex flex-col relative overflow-hidden shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-7 h-7 rounded-lg ${card.iconBg} ${card.iconColor} flex items-center justify-center text-sm flex-shrink-0`}>
                      {card.icon}
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450 tracking-wide uppercase leading-none">
                      {card.title}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-auto">
                    <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">
                      {card.value}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                      {card.label}
                    </span>
                  </div>

                  {/* Bottom Right Sparkline */}
                  <div className="absolute bottom-0 right-0 pointer-events-none">
                    <Sparkline color={card.sparklineColor} />
                  </div>
                </div>
              ))}
            </div>

            {/* Table Container */}
            <div className="flex-grow min-h-0">
              <NotificationTable
                data={paginatedData}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onOpenNotifyModal={handleOpenNotifyModal}
                canUpdate={hasUpdateAccess}
                canDelete={hasDeleteAccess}
              />
            </div>
          </div>

          {/* Sticky Bottom Pagination Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 px-6 flex items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Showing {filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} notifications
            </span>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredData.length}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              showSizeChanger
              pageSizeOptions={["5", "10", "20", "50"]}
              size="small"
            />
          </div>
        </div>
      </div>

      <NotificationDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onSubmit={handleSubmit}
        initialValues={editingNotification}
        defaultTarget={mainTab}
        loading={loading}
      />

      {selectedNotification && (
        <NotificationNotifyModal
          visible={notifyModalVisible}
          onCancel={() => setNotifyModalVisible(false)}
          notificationData={selectedNotification}
          targetType={mainTab}
        />
      )}

      <style>{`
        .dark .ant-segmented {
          background-color: transparent !important;
        }
        .dark .ant-segmented-item-selected {
          background-color: #1e293b !important;
        }
        .dark .ant-segmented-item {
          color: #94a3b8;
        }

        /* Sidebar input styling overrides */
        .premium-select-sidebar.ant-select .ant-select-selector {
          border-radius: 8px !important;
          border-color: #cbd5e1 !important;
          height: 34px !important;
        }
        .dark .premium-select-sidebar.ant-select .ant-select-selector {
          border-color: #334155 !important;
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
        }
        .premium-range-picker-sidebar.ant-picker {
          border-radius: 8px !important;
          border-color: #cbd5e1 !important;
          padding: 4px 8px !important;
          height: 34px !important;
        }
        .dark .premium-range-picker-sidebar.ant-picker {
          border-color: #334155 !important;
          background-color: #0f172a !important;
        }
        .dark .premium-range-picker-sidebar.ant-picker .ant-picker-input > input {
          color: #f1f5f9 !important;
        }

        /* Pagination sharp border-radius and style overrides */
        .ant-pagination .ant-pagination-item,
        .ant-pagination .ant-pagination-prev,
        .ant-pagination .ant-pagination-next,
        .ant-pagination .ant-pagination-options-size-changer .ant-select-selector {
          border-radius: 0px !important;
        }
        .dark .ant-pagination-item a {
          color: #cbd5e1 !important;
        }
        .dark .ant-pagination-item-active a {
          color: #ffffff !important;
        }
        .dark .ant-pagination-prev .ant-pagination-item-link,
        .dark .ant-pagination-next .ant-pagination-item-link {
          color: #cbd5e1 !important;
          background-color: #0f172a !important;
          border-color: #334155 !important;
        }
        .dark .ant-pagination-item {
          background-color: #0f172a !important;
          border-color: #334155 !important;
        }
        .dark .ant-pagination-item-active {
          background-color: #2563eb !important;
          border-color: #2563eb !important;
        }
      `}</style>
    </div>
  );
};

export default NotificationsPage;
