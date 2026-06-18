import { useEffect, useState } from "react";
import { Button, Segmented } from "antd";
import { IoMdRefresh } from "react-icons/io";
import { IoCarOutline } from "react-icons/io5";
// import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import { LuDownload } from "react-icons/lu";
import { useDispatch, useSelector } from "react-redux";
// import { AppDispatch, RootState } from "../redux/store";
import type { AppDispatch, RootState } from "../store";

import { fetchTrips, type TripDetailsType } from "../store/slices/tripSlice";
import {
  // UserOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import TripDetailsTable from "../components/TripDetails/TripDetailsTable";
import TitleBar from "../components/TitleBarCommon/TitleBar";
import AdvancedFilters, { type FilterField } from "../components/AdvancedFilters/AdvanceFilters";
import * as XLSX from "xlsx";
import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
// import { Popover } from "antd";

type TripFilters = {
  status: string;
  booking_type: string;
  globalSearch: string;
  driverAssigned: string | string[];
  from: Dayjs | null;
  to: Dayjs | null;
};

const initialFilters: TripFilters = {
  status: "requested",
  booking_type: "live",
  globalSearch: "",
  driverAssigned: "all",
  // from: null,
  // to: null,
  from: dayjs().startOf("day"),
  to: dayjs().endOf("day"),
};

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
  const [filteredTrips, setFilteredTrips] = useState<TripDetailsType[]>([]);
  const [filters, setFilters] = useState(initialFilters);
  // const [filterVisible, setFilterVisible] = useState(false);

  const handleRefresh = () => {
    dispatch(fetchTrips());
  };

  const getBaseFilteredTrips = () => {
    let temp = [...trips];

    // 🔹 Global Search
    if (filters.globalSearch) {
      const s = filters.globalSearch.toLowerCase();
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

    // 🔹 Driver Assigned

    const driverAssignedValue = normalizeDriverAssigned(filters.driverAssigned);

    // 🔹 Driver Assigned (FIXED)
    if (driverAssignedValue === "driverAssigned") {
      temp = temp.filter((t) => typeof t.driver_id === "string");
    }

    if (driverAssignedValue === "driverNotAssigned") {
      temp = temp.filter((t) => t.driver_id === null);
    }

    // 🔹 Date filter

    // 🔹 Date filter (FIXED)
    if (filters.from || filters.to) {
      let fromDate: Dayjs | null = null;
      let toDate: Dayjs | null = null;

      // ✅ Only FROM selected → same day range
      if (filters.from && !filters.to) {
        fromDate = dayjs(filters.from).startOf("day");
        toDate = dayjs(filters.from).endOf("day");
      }

      // ✅ Only TO selected → same day range
      if (!filters.from && filters.to) {
        fromDate = dayjs(filters.to).startOf("day");
        toDate = dayjs(filters.to).endOf("day");
      }

      // ✅ Both selected → proper range
      if (filters.from && filters.to) {
        fromDate = dayjs(filters.from).startOf("day");
        toDate = dayjs(filters.to).endOf("day");
      }

      temp = temp.filter((t) => {
        if (!t.created_at) return false;

        const tripDate = dayjs.utc(t.created_at).local();

        if (fromDate && tripDate.isBefore(fromDate)) return false;
        if (toDate && tripDate.isAfter(toDate)) return false;

        return true;
      });
    }

    return temp;
  };

  useEffect(() => {
    let temp = getBaseFilteredTrips();

    // 🔹 Status (Segmented)
    if (filters.status === "scheduled") {
      // Upcoming: booking_type = scheduled AND trip_status = requested
      temp = temp.filter(
        (t) =>
          t.booking_type?.toLowerCase() === "scheduled" &&
          t.trip_status?.toLowerCase() === "requested",
      );
    } else if (filters.status !== "all") {
      temp = temp.filter((t) => t.trip_status?.toLowerCase() === filters.status);
    }

    setFilteredTrips(temp);
  }, [trips, filters]);

  useEffect(() => {
    dispatch(fetchTrips());
  }, [dispatch]);

  //apply filters

  const applyFilters = (values: Record<string, any>) => {
    setFilters((prev) => ({
      ...prev,
      ...values,
      from: values.from ?? null,
      to: values.to ?? null,
    }));
  };

  const normalizeDriverAssigned = (value: any) => {
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  };

  //count function

  const getStatusCount = (status: string) => {
    const base = getBaseFilteredTrips();

    if (status === "all") return base.length;
    if (status === "scheduled")
      return base.filter(
        (t) =>
          t.booking_type?.toLowerCase() === "scheduled" &&
          t.trip_status?.toLowerCase() === "requested",
      ).length;
    return base.filter((t) => t.trip_status?.toLowerCase() === status).length;
  };

  // export

  const handleExport = () => {
    exportTripsToExcel(filteredTrips, "Trip_Report.xlsx");
  };

  const fields: FilterField[] = [
    {
      name: "globalSearch",
      label: "Search Trip / Driver / User",
      type: "input",
    },
    {
      name: "driverAssigned",
      label: "Driver Assignment Status",
      type: "select",
      options: [
        { value: "all", label: "All Records" },
        { value: "driverAssigned", label: "Driver Assigned" },
        { value: "driverNotAssigned", label: "Not Assigned" },
      ],
    },

    {
      name: "from",
      label: "Starting From",
      type: "date",
      showTime: true,
    },
    {
      name: "to",
      label: "Ending At",
      type: "date",
      showTime: true,
    },
  ];

  const formatDateRange = () => {
    const { from, to } = filters;
    const today = dayjs().startOf("day");

    // Check if both are same as today's range
    if (from && to && from.isSame(today, "day") && to.isSame(dayjs().endOf("day"), "day")) {
      return "Today's Ride";
    }

    if (from && to) {
      if (from.isSame(to, "day")) {
        return from.format("MMM DD, YYYY");
      }
      return `${from.format("MMM DD")} - ${to.format("MMM DD, YYYY")}`;
    }
    if (from) return `${from.format("MMM DD, YYYY")} - Now`;
    if (to) return `Until ${to.format("MMM DD, YYYY")}`;

    return "Today's Ride";
  };

  return (
    <TitleBar
      title="Trip Management"
      description="Orchestrate and supervise all ride activities across the network."
      icon={
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center">
          <IoCarOutline className="text-white text-2xl" />
        </div>
      }
      extraContent={
        <div className="flex items-center gap-3">
          <Button
            icon={<IoMdRefresh className={`text-lg ${loading ? "animate-spin" : ""}`} />}
            onClick={handleRefresh}
            className="rounded-full h-11 w-11 flex items-center justify-center border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-all bg-white"
          />

          <Button
            type="primary"
            onClick={handleExport}
            className="rounded-full h-11 px-8 font-bold !bg-gradient-to-r !from-indigo-600 !to-blue-500 border-none flex items-center gap-2"
          >
            <LuDownload className="text-lg" />
            Export
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6 p-2">
        {/* Navigation Row: Segments & Date Indicator */}
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1 overflow-x-auto no-scrollbar scroll-smooth">
            <div className="inline-flex bg-indigo-50/40 p-1.5 rounded-[1rem] border border-indigo-100/50">
              <Segmented
                size="large"
                value={filters.status}
                onChange={(val) => setFilters((prev) => ({ ...prev, status: val }))}
                options={[
                  {
                    label: (
                      <span
                        className={`px-2 font-bold tracking-tight ${filters.status === "all" ? "text-slate-800" : "text-black"}`}
                      >
                        All ({getStatusCount("all")})
                      </span>
                    ),
                    value: "all",
                  },
                  {
                    label: (
                      <span
                        className={`px-2 font-bold tracking-tight ${filters.status === "requested" ? "text-blue-600" : "text-black"}`}
                      >
                        Requested ({getStatusCount("requested")})
                      </span>
                    ),
                    value: "requested",
                  },
                  {
                    label: (
                      <span
                        className={`px-2 font-bold tracking-tight ${filters.status === "assigned" ? "text-cyan-600" : "text-black"}`}
                      >
                        Assigned ({getStatusCount("assigned")})
                      </span>
                    ),
                    value: "assigned",
                  },
                  {
                    label: (
                      <span
                        className={`px-2 font-bold tracking-tight ${filters.status === "accepted" ? "text-emerald-600" : "text-black"}`}
                      >
                        Accepted ({getStatusCount("accepted")})
                      </span>
                    ),
                    value: "accepted",
                  },
                  {
                    label: (
                      <span
                        className={`px-2 font-bold tracking-tight ${filters.status === "scheduled" ? "text-purple-600" : "text-black"}`}
                      >
                        Upcoming ({getStatusCount("scheduled")})
                      </span>
                    ),
                    value: "scheduled",
                  },
                  {
                    label: (
                      <span
                        className={`px-2 font-bold tracking-tight ${filters.status === "live" ? "text-orange-500" : "text-black"}`}
                      >
                        Live ({getStatusCount("live")})
                      </span>
                    ),
                    value: "live",
                  },
                  {
                    label: (
                      <span
                        className={`px-2 font-bold tracking-tight ${filters.status === "completed" ? "text-indigo-600" : "text-black"}`}
                      >
                        Completed ({getStatusCount("completed")})
                      </span>
                    ),
                    value: "completed",
                  },
                  {
                    label: (
                      <span
                        className={`px-2 font-bold tracking-tight ${filters.status === "cancelled" ? "text-slate-500" : "text-black"}`}
                      >
                        Cancelled ({getStatusCount("cancelled")})
                      </span>
                    ),
                    value: "cancelled",
                  },
                  {
                    label: (
                      <span
                        className={`px-2 font-bold tracking-tight ${filters.status === "mid_cancelled" ? "text-rose-600" : "text-black"}`}
                      >
                        Mid-Cancelled ({getStatusCount("mid_cancelled")})
                      </span>
                    ),
                    value: "mid_cancelled",
                  },
                ]}
                className="premium-segmented-alt-enlarged !bg-transparent"
              />
            </div>
          </div>

          <div className="flex-shrink-0">
            <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border border-indigo-100 border-b-[3px] border-b-indigo-500/30">
              <CalendarOutlined className="text-indigo-500 text-lg" />
              <div className="flex flex-col leading-none">
                <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-1">
                  Active Range
                </span>
                <span className="text-sm font-black text-slate-800 tracking-tight">
                  {formatDateRange()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Row: Inline Filters */}
        <div className="px-2">
          <AdvancedFilters
            filterFields={fields}
            applyFilters={applyFilters}
            isStandalone
            onClear={() => setFilters((prev) => ({ ...prev, status: "all" }))}
          />
        </div>

        {/* List Row: Table */}
        <div className="flex-grow">
          <TripDetailsTable data={filteredTrips} isSuperAdmin={isSuperAdmin} />
        </div>
      </div>
    </TitleBar>
  );
};

export default TripDetails;
