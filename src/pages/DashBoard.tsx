import { FiActivity } from "react-icons/fi";
import { Typography } from "antd";
import DashboardCard from "../components/DashBoard/DashBoardCard";
import DriverMetricsColumn from "../components/DashBoard/DriverMetricsColumn";
import OnboardingMetrics from "../components/DashBoard/OnboardingMetrics";
import ActivityFeed from "../components/DashBoard/ActivityFeed";
import TripManagement from "../components/DashBoard/TripManagement";
import QuickActions from "../components/DashBoard/QuickActions";

import { useEffect, useState, useMemo } from "react";
import axiosIns from "../api/axios";
import { useSocket } from "../hooks/useSocket";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Tooltip, Space } from "antd";
import {
  CustomerServiceOutlined,
  SafetyCertificateOutlined,
  UserAddOutlined,
  MoonOutlined,
  SunOutlined,
} from "@ant-design/icons";
import { useAppSelector } from "../store/hooks";
import { useTheme } from "../contexts/ThemeContext";

const Dashboard = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const [trips, setTrips] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeDrivers: 0,
    totalDrivers: 0,
    availableDrivers: 0,
    onTripDrivers: 0,
    totalScheduledRides: 0,
    acceptedScheduledRides: 0,
    totalUsers: 0,
    activeUsers: 0,
    todayNewUsers: 0,
    todayNewDrivers: 0,
    todaySubscriptions: 0,
    totalSubscriptions: 0,
    todayTrips: 0,
    todayRevenue: 0,
    totalEarnings: 0,
    totalCancellationsToday: 0,
    pendingVerifications: 0,
    documentExpiryAlerts: 0,
    complianceHealth: 0,
    lastSyncAt: new Date().toISOString(),
    trends: {
      users: "0%",
      drivers: "0%",
      subscriptions: "0%",
      trips: "0%",
      revenue: "0%",
    },
    loading: true,
  });
  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState(0);

  const { drivers } = useAppSelector((state) => state.drivers);
  const awaitingCount = useMemo(() => {
    if (!drivers || !Array.isArray(drivers)) return 0;
    return drivers.filter(
      (d) =>
        d.status === "pending" ||
        d.status === "pending_verification" ||
        d.onboarding_status === "DOCS_SUBMITTED" ||
        d.onboarding_status === "DOCS_REJECTED",
    ).length;
  }, [drivers]);

  const fetchStats = async () => {
    try {
      const response = await axiosIns.get("/api/drivers/dashboard-stats");
      if (response.data.success) {
        const data = response.data.data;
        setStats((prev) => ({
          ...prev,
          ...data,
          todaySubscriptions: data.todaySubscriptions,
          loading: false,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchLatestTrips = async () => {
    try {
      const response = await axiosIns.get("/api/trips");
      if (response.data.success) {
        // Take only the last 15 trips for the dashboard feed
        setTrips(response.data.data.slice(0, 15));
      }
    } catch (error) {
      console.error("Failed to fetch latest trips:", error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchLatestTrips();

    // Fetch initial open support tickets count
    const fetchOpenTickets = async () => {
      try {
        const { data } = await axiosIns.get("/api/support-management/tickets");
        const openTickets = data.data.tickets.filter((t: any) => t.status === "open");
        setOpenTicketsCount(openTickets.length);
      } catch (e) {
        console.error("Failed to fetch support tickets", e);
      }
    };

    // Fetch initial pending trip verifications
    const fetchPendingVerifications = async () => {
      try {
        const { data } = await axiosIns.get("/api/trip-verification/pending");
        if (data?.success) {
          setPendingVerificationsCount(data.data.length || 0);
        }
      } catch (e) {
        console.error("Failed to fetch pending verifications", e);
      }
    };

    fetchOpenTickets();
    fetchPendingVerifications();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.emit("JOIN_ADMIN_ROOM");

    const handleDriverEvent = (data?: any) => {
      // Refresh stats when any driver event occurs (online/offline/trip)
      fetchStats();

      // Decrement pending verifications if resolved via driver_event
      if (
        data?.eventType === "TRIP_VERIFICATION_APPROVED" ||
        data?.eventType === "TRIP_VERIFICATION_REJECTED"
      ) {
        setPendingVerificationsCount((prev) => Math.max(0, prev - 1));
      }
    };

    const handleNewTrip = () => {
      fetchLatestTrips();
      fetchStats();
    };

    const handleTripUpdate = () => {
      fetchLatestTrips();
      fetchStats();
    };

    const handleNewSupportTicket = () => setOpenTicketsCount((prev) => prev + 1);
    const handleSupportTicketClosed = () => setOpenTicketsCount((prev) => Math.max(0, prev - 1));
    const handleNewVerification = () => setPendingVerificationsCount((prev) => prev + 1);

    socket.on("driver_event", handleDriverEvent);
    socket.on("ADMIN_NEW_TRIP_ALERT", handleNewTrip);
    socket.on("ADMIN_TRIP_ACCEPTED", handleTripUpdate);
    socket.on("ADMIN_TRIP_STATUS_UPDATE", handleTripUpdate);
    socket.on("ADMIN_SUPPORT_TICKET_ALERT", handleNewSupportTicket);
    socket.on("ADMIN_SUPPORT_TICKET_CLOSED", handleSupportTicketClosed);
    socket.on("ADMIN_TRIP_VERIFICATION_REQUESTED", handleNewVerification);

    return () => {
      socket.off("driver_event", handleDriverEvent);
      socket.off("ADMIN_NEW_TRIP_ALERT", handleNewTrip);
      socket.off("ADMIN_TRIP_ACCEPTED", handleTripUpdate);
      socket.off("ADMIN_TRIP_STATUS_UPDATE", handleTripUpdate);
      socket.off("ADMIN_SUPPORT_TICKET_ALERT", handleNewSupportTicket);
      socket.off("ADMIN_SUPPORT_TICKET_CLOSED", handleSupportTicketClosed);
      socket.off("ADMIN_TRIP_VERIFICATION_REQUESTED", handleNewVerification);
    };
  }, [socket]);

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 gap-4 bg-gray-50/50 dark:bg-slate-900 transition-colors duration-300">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
            <FiActivity className="text-white text-2xl" />
          </div>
          <div>
            <Typography.Title
              level={4}
              className="!m-0 text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white tracking-tight"
            >
              Dashboard
            </Typography.Title>
            <Typography.Text className="block text-xs sm:text-sm text-gray-400 dark:text-gray-400 font-medium font-outfit uppercase tracking-widest text-[9px]">
              Live operational metrics and insights
            </Typography.Text>
          </div>
        </div>

        <Space size="middle">
          <Tooltip title={isDarkMode ? "Light Mode" : "Dark Mode"}>
            <Button
              type="text"
              icon={
                isDarkMode ? (
                  <SunOutlined className="text-xl text-yellow-500" />
                ) : (
                  <MoonOutlined className="text-xl text-slate-600" />
                )
              }
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
            />
          </Tooltip>

          <Tooltip title="Awaiting Approval">
            <Badge
              count={awaitingCount}
              dot={false}
              color="blue"
              showZero={false}
              size="small"
              offset={[-2, 2]}
            >
              <Button
                type="text"
                icon={<UserAddOutlined className="text-xl text-blue-600 dark:text-blue-400" />}
                onClick={() => navigate("/driver-applications")}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
              />
            </Badge>
          </Tooltip>

          <Tooltip title="Trip Verifications">
            <Badge
              count={pendingVerificationsCount}
              dot={false}
              color="orange"
              showZero={false}
              size="small"
              offset={[-2, 2]}
            >
              <Button
                type="text"
                icon={
                  <SafetyCertificateOutlined className="text-xl text-orange-600 dark:text-orange-400" />
                }
                onClick={() => navigate("/trip-verifications")}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
              />
            </Badge>
          </Tooltip>

          <Tooltip title="Support Tickets">
            <Badge
              count={openTicketsCount}
              dot={false}
              color="red"
              showZero={false}
              size="small"
              offset={[-2, 2]}
            >
              <Button
                type="text"
                icon={
                  <CustomerServiceOutlined className="text-xl text-indigo-600 dark:text-indigo-400" />
                }
                onClick={() => navigate("/support-tickets")}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
              />
            </Badge>
          </Tooltip>
        </Space>
      </div>

      <div className="shrink-0">
        <DashboardCard stats={stats} />
      </div>

      <div className="flex items-center gap-4 shrink-0 py-1">
        <Typography.Title
          level={5}
          className="!m-0 text-gray-700 dark:text-gray-200 font-bold whitespace-nowrap text-sm tracking-tight uppercase"
        >
          Operations & Live Feed
        </Typography.Title>
        <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1"></div>
      </div>

      {/* Main Dashboard Layout - 4 Column Top Grid with adjusted widths (3:2:3:2) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-3 min-h-0 overflow-hidden text-sm">
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <DriverMetricsColumn stats={stats} />
        </div>
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <TripManagement stats={stats} trips={trips} />
        </div>
        <div className="lg:col-span-4 flex flex-col min-h-0 gap-4 h-105">
          <OnboardingMetrics stats={stats} />
          <ActivityFeed />
        </div>
      </div>

      {/* Bottom Horizontal Row - Full Width Quick Actions */}
      <div className="shrink-0 h-32 mt-1">
        <QuickActions />
      </div>
    </div>
  );
};

export default Dashboard;
