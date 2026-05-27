import { FiActivity } from "react-icons/fi";
import { Typography } from "antd";
import DashboardCard from "../components/DashBoard/DashBoardCard";
import DriverMetricsColumn from "../components/DashBoard/DriverMetricsColumn";
import OnboardingMetrics from "../components/DashBoard/OnboardingMetrics";
import ActivityFeed from "../components/DashBoard/ActivityFeed";
import TripManagement from "../components/DashBoard/TripManagement";
import QuickActions from "../components/DashBoard/QuickActions";


import { useEffect, useState } from "react";
import axiosIns from "../api/axios";
import { useSocket } from "../hooks/useSocket";

const Dashboard = () => {
  const { socket } = useSocket();
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
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.emit("JOIN_ADMIN_ROOM");

    const handleDriverEvent = () => {
      // Refresh stats when any driver event occurs (online/offline/trip)
      fetchStats();
    };

    const handleNewTrip = () => {
      fetchLatestTrips();
      fetchStats();
    };

    const handleTripUpdate = () => {
      fetchLatestTrips();
      fetchStats();
    };

    socket.on("driver_event", handleDriverEvent);
    socket.on("ADMIN_NEW_TRIP_ALERT", handleNewTrip);
    socket.on("ADMIN_TRIP_ACCEPTED", handleTripUpdate);
    socket.on("ADMIN_TRIP_STATUS_UPDATE", handleTripUpdate);

    return () => {
      socket.off("driver_event", handleDriverEvent);
      socket.off("ADMIN_NEW_TRIP_ALERT", handleNewTrip);
      socket.off("ADMIN_TRIP_ACCEPTED", handleTripUpdate);
      socket.off("ADMIN_TRIP_STATUS_UPDATE", handleTripUpdate);
    };
  }, [socket]);

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 gap-4 bg-gray-50/50">
      <div className="flex items-center space-x-3 shrink-0">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20">
          <FiActivity className="text-white text-2xl" />
        </div>
        <div>
          <Typography.Title
            level={4}
            className="!m-0 text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight"
          >
            Dashboard
          </Typography.Title>
          <Typography.Text className="block text-xs sm:text-sm text-gray-400 font-medium font-outfit uppercase tracking-widest text-[9px]">
            Live operational metrics and insights
          </Typography.Text>
        </div>
      </div>

      <div className="shrink-0">
        <DashboardCard stats={stats} />
      </div>

      <div className="flex items-center gap-4 shrink-0 py-1">
        <Typography.Title level={5} className="!m-0 text-gray-700 font-bold whitespace-nowrap text-sm tracking-tight uppercase">
          Operations & Live Feed
        </Typography.Title>
        <div className="h-px bg-gray-200 flex-1"></div>
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
