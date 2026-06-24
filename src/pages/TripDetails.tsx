import React, { useEffect, useState, useMemo } from "react";
import { Button, Select, Input, DatePicker, Pagination } from "antd";
import {
  IoCarOutline,
} from "react-icons/io5";
import { LuDownload } from "react-icons/lu";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";

import { fetchTrips, type TripDetailsType } from "../store/slices/tripSlice";
import {
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CarOutlined,
  StopOutlined,
  BellOutlined,
  UserAddOutlined,
  CheckOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import TripDetailsTable from "../components/TripDetails/TripDetailsTable";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";



export const exportTripsToExcel = (data: TripDetailsType[], fileName: string) => {
  if (!data.length) return;

  const worksheet = XLSX.utils.json_to_sheet(
    data.map((trip) => ({
      TripID: trip.trip_id,
      User: trip.user_name,
      UserPhone: trip.user_phone,
      Driver: trip.driver_name ?? "Not Assigned",
      DriverPhone: trip.driver_phone ?? "-",
      Pickup: trip.pickup_address,
      Drop: trip.drop_address,
      Status: trip.trip_status,
      Fare: trip.total_fare,
      Payment: trip.payment_status,
      Service: trip.service_type,
      Type: trip.ride_type,
    })),
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Trips");

  XLSX.writeFile(workbook, fileName);
};

dayjs.extend(utc);

const TripDetails = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { trips, loading } = useSelector((state: RootState) => state.trips);
  const { role } = useSelector((state: RootState) => state.auth);
  const isSuperAdmin = role === "super_admin";

  const [mainView, setMainView] = useState<"ALL" | "REQUESTED" | "ASSIGNED" | "ACCEPTED" | "SCHEDULED" | "LIVE" | "COMPLETED" | "CANCELLED" | "MID_CANCELLED">("ALL");

  // Filters state
  const [driverStatusFilter, setDriverStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<any>([dayjs().startOf("day"), dayjs().endOf("day")]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [driverStatusFilter, searchQuery, dateRange, mainView]);

  useEffect(() => {
    dispatch(fetchTrips());
  }, [dispatch]);

  const handleExport = () => {
    exportTripsToExcel(filteredTrips, "Trip_Report.xlsx");
  };

  // Filter computation logic
  const filteredTrips = useMemo(() => {
    if (!trips) return [];
    let temp = [...trips];

    // 1. Main View Filter
    if (mainView === "REQUESTED") {
      temp = temp.filter((t) => t.trip_status?.toLowerCase() === "requested");
    } else if (mainView === "ASSIGNED") {
      temp = temp.filter((t) => t.trip_status?.toLowerCase() === "assigned");
    } else if (mainView === "ACCEPTED") {
      temp = temp.filter((t) => t.trip_status?.toLowerCase() === "accepted");
    } else if (mainView === "SCHEDULED") {
      // Upcoming: booking_type = scheduled AND trip_status = requested
      temp = temp.filter(
        (t) =>
          t.booking_type?.toLowerCase() === "scheduled" &&
          t.trip_status?.toLowerCase() === "requested",
      );
    } else if (mainView === "LIVE") {
      temp = temp.filter((t) => t.trip_status?.toLowerCase() === "live");
    } else if (mainView === "COMPLETED") {
      temp = temp.filter((t) => t.trip_status?.toLowerCase() === "completed");
    } else if (mainView === "CANCELLED") {
      temp = temp.filter((t) => t.trip_status?.toLowerCase() === "cancelled");
    } else if (mainView === "MID_CANCELLED") {
      temp = temp.filter((t) => t.trip_status?.toLowerCase() === "mid_cancelled");
    }

    // 2. Global Search
    if (searchQuery) {
      const s = searchQuery.toLowerCase();
      temp = temp.filter(
        (t) =>
          t.trip_id?.toLowerCase().includes(s) ||
          t.trip_code?.toLowerCase().includes(s) ||
          t.user_name?.toLowerCase().includes(s) ||
          t.user_phone?.includes(s) ||
          t.driver_name?.toLowerCase().includes(s) ||
          t.driver_phone?.includes(s) ||
          t.pickup_address?.toLowerCase().includes(s) ||
          t.drop_address?.toLowerCase().includes(s),
      );
    }

    // 3. Driver Assigned Filter
    if (driverStatusFilter === "driverAssigned") {
      temp = temp.filter((t) => typeof t.driver_id === "string");
    } else if (driverStatusFilter === "driverNotAssigned") {
      temp = temp.filter((t) => t.driver_id === null);
    }

    // 4. Date Range Filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf("day");
      const end = dateRange[1].endOf("day");
      temp = temp.filter((item) => {
        if (!item.created_at) return false;
        const tripDate = dayjs.utc(item.created_at).local();
        return (tripDate.isAfter(start) || tripDate.isSame(start)) && (tripDate.isBefore(end) || tripDate.isSame(end));
      });
    }

    return temp;
  }, [trips, mainView, driverStatusFilter, searchQuery, dateRange]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTrips.slice(startIndex, startIndex + pageSize);
  }, [filteredTrips, currentPage, pageSize]);

  // Count function for sidebar views
  const getViewCount = (view: string) => {
    if (!trips) return 0;
    if (view === "ALL") return trips.length;
    if (view === "REQUESTED") return trips.filter((t) => t.trip_status?.toLowerCase() === "requested").length;
    if (view === "ASSIGNED") return trips.filter((t) => t.trip_status?.toLowerCase() === "assigned").length;
    if (view === "ACCEPTED") return trips.filter((t) => t.trip_status?.toLowerCase() === "accepted").length;
    if (view === "SCHEDULED")
      return trips.filter(
        (t) =>
          t.booking_type?.toLowerCase() === "scheduled" &&
          t.trip_status?.toLowerCase() === "requested",
      ).length;
    if (view === "LIVE") return trips.filter((t) => t.trip_status?.toLowerCase() === "live").length;
    if (view === "COMPLETED") return trips.filter((t) => t.trip_status?.toLowerCase() === "completed").length;
    if (view === "CANCELLED") return trips.filter((t) => t.trip_status?.toLowerCase() === "cancelled").length;
    if (view === "MID_CANCELLED") return trips.filter((t) => t.trip_status?.toLowerCase() === "mid_cancelled").length;
    return 0;
  };

  // Dynamic statistics for top status cards
  const stats = useMemo(() => {
    return [
      {
        title: "Total Trips",
        value: trips?.length || 0,
        label: "rides",
        icon: <CarOutlined />,
        iconColor: "text-blue-500 dark:text-blue-400",
        iconBg: "bg-blue-50 dark:bg-blue-500/10",
        sparklineColor: "blue",
      },
      {
        title: "Live",
        value: trips?.filter((n) => n.trip_status === "LIVE").length || 0,
        label: "on-road",
        icon: <ClockCircleOutlined />,
        iconColor: "text-emerald-500 dark:text-emerald-400",
        iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
        sparklineColor: "green",
      },
      {
        title: "Completed",
        value: trips?.filter((n) => n.trip_status === "COMPLETED").length || 0,
        label: "finished",
        icon: <CheckCircleOutlined />,
        iconColor: "text-purple-500 dark:text-purple-400",
        iconBg: "bg-purple-50 dark:bg-purple-500/10",
        sparklineColor: "purple",
      },
      {
        title: "Cancelled",
        value: trips?.filter((n) => n.trip_status === "CANCELLED" || n.trip_status === "MID_CANCELLED").length || 0,
        label: "failed",
        icon: <StopOutlined />,
        iconColor: "text-rose-500 dark:text-rose-400",
        iconBg: "bg-rose-50 dark:bg-rose-500/10",
        sparklineColor: "red",
      },
    ];
  }, [trips]);

  return (
    <div className="w-full h-full flex flex-col bg-[#f8f9fa] dark:bg-[#0b0f19] overflow-hidden">
      {/* Top Navbar */}
      <div className="bg-white dark:bg-slate-800 h-12 px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 z-0 flex-shrink-0">
        {/* Title & Description */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <IoCarOutline className="text-lg" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 !m-0 !mb-1 leading-none">Trip Details</h1>
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0">Orchestrate ride activities</p>
        </div>

        <div className="relative flex-1 max-w-xl mx-auto flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all h-9">
          <SearchOutlined className="absolute left-3 text-slate-400 text-[16px]" />
          <input
            type="text"
            placeholder="Search trip, driver, user..."
            className="w-full pl-10 pr-4 py-1.5 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400 border-none shadow-none focus:ring-0"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-3">
            <span className="text-[11px] font-bold text-slate-400 border border-slate-200 dark:border-slate-600 rounded-[4px] px-1.5 py-[1px] bg-slate-50/50 dark:bg-slate-800 tracking-wide">
              ⌘K
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {filteredTrips.length} results
          </span>

          <Button
            type="primary"
            icon={<LuDownload className="text-sm" />}
            onClick={handleExport}
            className="h-9 rounded-lg font-bold text-xs uppercase tracking-wider border-none !bg-blue-600 hover:!bg-blue-700 text-white shadow-sm flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-all"
          >
            Export Report
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-[220px] flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
            {/* Sidenav views section */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase px-2 mb-0.5">
                Views
              </span>

              {/* View: All Trips */}
              <div
                onClick={() => setMainView("ALL")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainView === "ALL"
                  ? "bg-slate-100/80 dark:bg-slate-500/10 text-slate-700 dark:text-slate-300 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <CarOutlined className="text-xs" />
                  <span>All Trips</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainView === "ALL"
                  ? "bg-slate-200 dark:bg-slate-500/20 text-slate-800 dark:text-slate-200"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {getViewCount("ALL")}
                </span>
              </div>

              {/* View: Requested */}
              <div
                onClick={() => setMainView("REQUESTED")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainView === "REQUESTED"
                  ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <BellOutlined className="text-xs" />
                  <span>Requested</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainView === "REQUESTED"
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {getViewCount("REQUESTED")}
                </span>
              </div>

              {/* View: Assigned */}
              <div
                onClick={() => setMainView("ASSIGNED")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainView === "ASSIGNED"
                  ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <UserAddOutlined className="text-xs" />
                  <span>Assigned</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainView === "ASSIGNED"
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {getViewCount("ASSIGNED")}
                </span>
              </div>

              {/* View: Accepted */}
              <div
                onClick={() => setMainView("ACCEPTED")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainView === "ACCEPTED"
                  ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <CheckOutlined className="text-xs" />
                  <span>Accepted</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainView === "ACCEPTED"
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {getViewCount("ACCEPTED")}
                </span>
              </div>

              {/* View: Scheduled (Upcoming) */}
              <div
                onClick={() => setMainView("SCHEDULED")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainView === "SCHEDULED"
                  ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <ClockCircleOutlined className="text-xs" />
                  <span>Upcoming</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainView === "SCHEDULED"
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {getViewCount("SCHEDULED")}
                </span>
              </div>

              {/* View: Live Rides */}
              <div
                onClick={() => setMainView("LIVE")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainView === "LIVE"
                  ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <EnvironmentOutlined className="text-xs" />
                  <span>Live</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainView === "LIVE"
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {getViewCount("LIVE")}
                </span>
              </div>

              {/* View: Completed */}
              <div
                onClick={() => setMainView("COMPLETED")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainView === "COMPLETED"
                  ? "bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircleOutlined className="text-xs" />
                  <span>Completed</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainView === "COMPLETED"
                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {getViewCount("COMPLETED")}
                </span>
              </div>

              {/* View: Cancelled */}
              <div
                onClick={() => setMainView("CANCELLED")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainView === "CANCELLED"
                  ? "bg-slate-200/80 dark:bg-slate-600/30 text-slate-700 dark:text-slate-300 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <StopOutlined className="text-xs text-slate-500" />
                  <span>Cancelled</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainView === "CANCELLED"
                  ? "bg-slate-300/50 dark:bg-slate-500/40 text-slate-800 dark:text-slate-200"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {getViewCount("CANCELLED")}
                </span>
              </div>

              {/* View: Mid-Cancelled */}
              <div
                onClick={() => setMainView("MID_CANCELLED")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainView === "MID_CANCELLED"
                  ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <StopOutlined className="text-xs text-rose-500" />
                  <span>Mid-Cancelled</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainView === "MID_CANCELLED"
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {getViewCount("MID_CANCELLED")}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ─── Right Content Area ─────────────────────────────────────── */}
        <div className="flex-grow flex flex-col min-w-0 relative h-full">
          <div className="flex-grow flex flex-col p-6 overflow-y-auto custom-scrollbar gap-5 pb-20">

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

                  {/* Background Icon */}
                  <div className={`absolute -bottom-6 -right-6 text-[100px] opacity-[0.06] pointer-events-none ${card.iconColor}`}>
                    {card.icon}
                  </div>
                </div>
              ))}
            </div>

            {/* FILTERS TOOLBAR */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-sm border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4 shadow-sm flex-shrink-0">
              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">
                  Driver:
                </span>
                <Select
                  placeholder="All Records"
                  value={driverStatusFilter}
                  onChange={setDriverStatusFilter}
                  className="flex-1 text-xs premium-select-sidebar min-w-0"
                  options={[
                    { value: "all", label: "All Records" },
                    { value: "driverAssigned", label: "Driver Assigned" },
                    { value: "driverNotAssigned", label: "Not Assigned" },
                  ]}
                />
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">
                  Date Range:
                </span>
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  format="DD/MM/YYYY"
                  className="flex-1 text-xs premium-range-picker-sidebar min-w-0"
                  placeholder={["Start", "End"]}
                />
              </div>

              {(driverStatusFilter !== "all" || dateRange) && (
                <Button
                  type="text"
                  danger
                  className="text-[11px] font-bold uppercase tracking-wider"
                  onClick={() => {
                    setDriverStatusFilter("all");
                    setDateRange(null);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>

            {/* Table Container */}
            <div className="flex-grow flex flex-col min-h-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden pb-1">
              <TripDetailsTable
                data={paginatedData}
                isSuperAdmin={isSuperAdmin}
                loading={loading}
                pagination={false}
              />
            </div>
          </div>

          {/* Sticky Bottom Pagination Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 px-6 flex items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Showing {filteredTrips.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredTrips.length)} of {filteredTrips.length} trips
            </span>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredTrips.length}
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

      <style>{`
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
        .premium-range-picker-sidebar.ant-picker .ant-picker-input > input {
          font-size: 11px !important;
          font-weight: 600 !important;
          letter-spacing: -0.2px !important;
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

        /* Disable table default margin */
        .premium-table-container .ant-table-wrapper {
          margin: 0 !important;
        }
        
      `}</style>
    </div>
  );
};

export default TripDetails;
