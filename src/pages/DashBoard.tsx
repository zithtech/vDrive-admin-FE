import { useEffect, useState, useCallback } from "react";
import { Typography, Select } from "antd";
import { CarOutlined, UserOutlined, CalendarOutlined } from "@ant-design/icons";
import { PiCurrencyInr } from "react-icons/pi";

import StatCard from "../components/DashBoard/StatCard";
import RidesOverviewChart from "../components/DashBoard/RidesOverviewChart";
import RideStatusChart from "../components/DashBoard/RideStatusChart";
import DashboardLiveMap from "../components/DashBoard/DashboardLiveMap";
import RecentBookingsTable from "../components/DashBoard/RecentBookingsTable";
import TopDriversList from "../components/DashBoard/TopDriversList";
import BottomActionRow from "../components/DashBoard/BottomActionRow";

import axiosIns from "../api/axios";
import { useSocket } from "../hooks/useSocket";

const Dashboard = () => {
  const { socket } = useSocket();

  const [timeRange, setTimeRange] = useState("today");

  const [stats, setStats] = useState<any>({
    activeDrivers: 0,
    totalDrivers: 0,
    totalScheduledRides: 0,
    todayTrips: 0,
    totalEarnings: 0,
    chartData: [],
    rideStatus: [],
    topDrivers: [],
    recentBookings: [],
    loading: true,
  });

  const fetchStats = useCallback(async () => {
    try {
      const response = await axiosIns.get("/api/drivers/dashboard-stats");

      if (response.data.success) {
        setStats((prev: any) => ({
          ...prev,
          ...response.data.data,
          loading: false,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      setStats((prev: any) => ({ ...prev, loading: false }));
    }
  }, []);

  // Fetch on mount and whenever the dateRange changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;
    socket.emit("JOIN_ADMIN_ROOM");

    const handleUpdate = () => fetchStats();

    socket.on("driver_event", handleUpdate);
    socket.on("ADMIN_NEW_TRIP_ALERT", handleUpdate);
    socket.on("ADMIN_TRIP_ACCEPTED", handleUpdate);
    socket.on("ADMIN_TRIP_STATUS_UPDATE", handleUpdate);

    return () => {
      socket.off("driver_event", handleUpdate);
      socket.off("ADMIN_NEW_TRIP_ALERT", handleUpdate);
      socket.off("ADMIN_TRIP_ACCEPTED", handleUpdate);
      socket.off("ADMIN_TRIP_STATUS_UPDATE", handleUpdate);
    };
  }, [socket, fetchStats]);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 md:p-4 gap-4 bg-white dark:bg-slate-900 transition-colors duration-300">
      
      {/* Header Row */}
      <div className="shrink-0 flex justify-between items-center">
        <Typography.Title
          level={3}
          className="!m-0 text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight"
        >
          Overview of T2Drive platform
        </Typography.Title>
        <Select
          value={timeRange}
          onChange={(val) => setTimeRange(val)}
          options={[
            { value: "today", label: "Today" },
            { value: "overall", label: "Overall" },
          ]}
          className="w-32"
          size="large"
        />
      </div>

      {/* Row 1: Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <StatCard
          title="Total Rides"
          value={(timeRange === 'today' ? (stats.todayTrips || 0) : (stats.totalTrips || 0)).toLocaleString()}
          trend={stats.todayTripsTrend ?? 0}
          trendText="vs yesterday"
          icon={<CarOutlined />}
          iconBgColor="linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)"
          iconColor="#ffffff"
        />
        <StatCard
          title="Total Drivers"
          value={(timeRange === 'today' ? (stats.todayNewDrivers || 0) : (stats.totalDrivers || 0)).toLocaleString()}
          trend={stats.totalDriversTrend ?? 0}
          trendText="vs yesterday"
          icon={<UserOutlined />}
          iconBgColor="linear-gradient(135deg, #34d399 0%, #059669 100%)"
          iconColor="#ffffff"
        />
        <StatCard
          title="Total Earnings"
          value={`₹ ${(timeRange === 'today' ? (stats.todayRevenue || 0) : (stats.totalEarnings || 0)).toLocaleString()}`}
          trend={stats.totalEarningsTrend ?? 0}
          trendText="vs yesterday"
          icon={<PiCurrencyInr />}
          iconBgColor="linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)"
          iconColor="#ffffff"
        />
        <StatCard
          title="Total Bookings"
          value={(timeRange === 'today' ? (stats.todayScheduledRides || 0) : (stats.totalScheduledRides || 0)).toLocaleString()}
          trend={stats.totalScheduledRidesTrend ?? 0}
          trendText="vs yesterday"
          icon={<CalendarOutlined />}
          iconBgColor="linear-gradient(135deg, #fbbf24 0%, #d97706 100%)"
          iconColor="#ffffff"
        />
      </div>

      {/* Row 2: Charts and Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 shrink-0 min-h-[210px]">
        <div className="lg:col-span-5 h-full">
          <RidesOverviewChart />
        </div>
        <div className="lg:col-span-4 h-full">
          <RideStatusChart data={stats.rideStatus} />
        </div>
        <div className="lg:col-span-3 h-full">
          <TopDriversList drivers={stats.topDrivers} />
        </div>
      </div>

      {/* Row 3: Tables and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 shrink-0 min-h-[280px]">
        <div className="lg:col-span-7 h-full">
          <RecentBookingsTable bookings={stats.recentBookings} />
        </div>
        <div className="lg:col-span-5 h-full">
          <DashboardLiveMap />
        </div>
      </div>

      {/* Row 4: Bottom Action Cards */}
      <div className="shrink-0 mb-3">
        <BottomActionRow stats={stats} />
      </div>

    </div>
  );
};

export default Dashboard;
