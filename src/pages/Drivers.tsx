import { useState, useEffect, useMemo } from "react";
import { IoMdRefresh } from "react-icons/io";
import { Users, Car, ShieldAlert } from "lucide-react";
import {
  SearchOutlined,
} from "@ant-design/icons";
import { Select, DatePicker, Spin, Pagination } from "antd";
import DriverTable from "../components/DriverTable/DriverTable";
import dayjs from "dayjs";
import DriverStats from "../components/Drivers/DriverStats";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchDrivers } from "../store/slices/driverSlice";
import type { Driver, DriverStatus } from "../store/slices/driverSlice";

export interface Filters {
  search: string;
  status: DriverStatus[];
  plan: string[];
  rating: [number, number];
  joined_at: Date | null;
}

const STATUSES: DriverStatus[] = ["active", "inactive", "suspended", "rejected", "blocked"];

const Drivers = () => {
  const dispatch = useAppDispatch();
  const { drivers: DATA, loading, error } = useAppSelector((state) => state.drivers);
  const [filteredData, setFilteredData] = useState<Driver[]>(DATA);

  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: [],
    plan: [],
    rating: [0, 5],
    joined_at: null,
  });

  const [currentView, setCurrentView] = useState<"all" | "active" | "restricted">("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset page to 1 when filters or view changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, currentView]);

  useEffect(() => {
    dispatch(fetchDrivers());
  }, [dispatch]);

  // Dynamic plan options from data
  const planOptions = useMemo(() => {
    const plans = new Set<string>();
    DATA.forEach((d) => {
      if (d.active_subscription?.plan_name) {
        plans.add(d.active_subscription.plan_name);
      }
    });
    return Array.from(plans)
      .sort()
      .map((p) => ({ value: p, label: p }));
  }, [DATA]);

  useEffect(() => {
    let tempData = Array.isArray(DATA) ? [...DATA] : [];

    // Exclude pending / awaiting approval drivers from this page
    tempData = tempData.filter(
      (d) =>
        d.status !== "pending" &&
        d.status !== "pending_verification" &&
        d.onboarding_status !== "DOCS_SUBMITTED" &&
        d.onboarding_status !== "DOCS_REJECTED",
    );

    // Search by Name, System ID, or vDrive ID
    if (filters.search) {
      const searchText = filters.search.toLowerCase();
      tempData = tempData.filter(
        (d) =>
          d.full_name?.toLowerCase().includes(searchText) ||
          d.driver_id?.toLowerCase().includes(searchText) ||
          d.vdrive_id?.toLowerCase().includes(searchText) ||
          d.id?.toLowerCase().includes(searchText),
      );
    }

    if (filters.status.length > 0) {
      const selectedStatuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      tempData = tempData.filter((driver) => selectedStatuses.includes(driver.status));
    }

    // Subscription Plan Filter
    if (filters.plan.length > 0) {
      const selectedPlans = Array.isArray(filters.plan) ? filters.plan : [filters.plan];
      tempData = tempData.filter((driver) =>
        selectedPlans.includes(driver.active_subscription?.plan_name || ""),
      );
    }

    // Rating range filter
    if (filters.rating && (filters.rating[0] > 0 || filters.rating[1] < 5)) {
      const [min, max] = filters.rating;
      tempData = tempData.filter((item) => {
        const itemValue = Number(item.rating ?? 0);
        return itemValue >= min && itemValue <= max;
      });
    }

    if (filters.joined_at) {
      tempData = tempData.filter((driver) =>
        dayjs(driver.created_at).isSame(filters.joined_at, "day"),
      );
    }

    setFilteredData(tempData);
  }, [DATA, filters]);

  const { allFleetDrivers, activeDrivers, restrictedDrivers } = useMemo(() => {
    return {
      allFleetDrivers: filteredData.filter((d) => d.status !== "rejected"),
      activeDrivers: filteredData.filter((d) => d.status === "active"),
      restrictedDrivers: filteredData.filter(
        (d) =>
          d.status !== "active" &&
          d.status !== "pending" &&
          d.onboarding_status !== "DOCS_SUBMITTED" &&
          d.onboarding_status !== "DOCS_REJECTED",
      ),
    };
  }, [filteredData]);

  const applyFilters = (values: Partial<Filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...values,
    }));
  };

  const hasActiveFilters =
    filters.search ||
    filters.status.length > 0 ||
    filters.plan.length > 0 ||
    filters.joined_at ||
    filters.rating[0] > 0 ||
    filters.rating[1] < 5;

  const TableSection = ({
    data,
    flexClass = "flex-1",
    extraClasses = "",
  }: any) => (
    <div
      className={`${flexClass} flex flex-col bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden ${extraClasses}`}
    >
      <div className="flex-grow overflow-hidden">
        <DriverTable data={data} />
      </div>
    </div>
  );

  return (
    <div className="flex flex-row h-full w-full bg-[#f8f9fa] dark:bg-[#0b0f19] overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-[260px] flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
        {/* Sidebar Header */}
        <div className="p-6 pb-6 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3 mb-1 text-slate-800 dark:text-slate-100">
            <div className="w-10 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Users size={20} />
            </div>
            <h2 className="text-[24px] font-bold text-slate-900 dark:text-white tracking-wider whitespace-nowrap"><b>Drivers</b></h2>
          </div>
          <p className="text-[11px] text-slate-500 font-medium leading-snug mt-1">
            Manage driver profiles, documents, and account status
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
          {/* VIEWS SECTION */}
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">
              Views
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setCurrentView("all")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${currentView === "all" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"}`}
              >
                <div className="flex items-center gap-2">
                  <Users size={16} className={currentView === "all" ? "text-blue-500" : "text-slate-400"} />
                  All Drivers
                </div>
                <span className={currentView === "all" ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold"}>
                  {allFleetDrivers.length}
                </span>
              </button>

              <button
                onClick={() => setCurrentView("active")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${currentView === "active" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"}`}
              >
                <div className="flex items-center gap-2">
                  <Car size={16} className={currentView === "active" ? "text-blue-500" : "text-slate-400"} />
                  Active
                </div>
                <span className={currentView === "active" ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold"}>
                  {activeDrivers.length}
                </span>
              </button>

              <button
                onClick={() => setCurrentView("restricted")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${currentView === "restricted" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"}`}
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className={currentView === "restricted" ? "text-blue-500" : "text-slate-400"} />
                  Restricted
                </div>
                <span className={currentView === "restricted" ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold"}>
                  {restrictedDrivers.length}
                </span>
              </button>
            </div>
          </div>

          {/* FILTERS SECTION */}
          <div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">
              Filters
            </h3>

            <div className="space-y-2.5 px-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                  Status
                </label>
                <Select
                  mode="multiple"
                  placeholder="Select status..."
                  className="w-full custom-select-compact h-9"
                  options={STATUSES.map((s) => ({ label: s.toUpperCase(), value: s }))}
                  value={filters.status}
                  onChange={(val) => applyFilters({ status: val })}
                  maxTagCount="responsive"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Plan</label>
                <Select
                  mode="multiple"
                  placeholder="Filter by plan..."
                  className="w-full custom-select-compact h-9"
                  options={planOptions}
                  value={filters.plan}
                  onChange={(val) => applyFilters({ plan: val })}
                  maxTagCount="responsive"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Joined Date</label>
                <DatePicker
                  placeholder="Select Date"
                  className="w-full h-9"
                  onChange={(date) => applyFilters({ joined_at: date ? date.toDate() : null })}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Rating</label>
                <Select
                  placeholder="Select rating..."
                  className="w-full custom-select-compact h-9"
                  options={[
                    { label: "All Ratings", value: "0,5" },
                    { label: "4.0 Stars & Above", value: "4,5" },
                    { label: "3.0 Stars & Above", value: "3,5" },
                    { label: "Under 3.0 Stars", value: "0,2.9" },
                  ]}
                  value={`${filters.rating[0]},${filters.rating[1]}`}
                  onChange={(val) => {
                    const [min, max] = val.split(',').map(Number);
                    applyFilters({ rating: [min, max] });
                  }}
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => setFilters({ search: "", status: [], plan: [], rating: [0, 5], joined_at: null })}
                  className="w-full h-[36px] flex items-center justify-center rounded-lg text-[11px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-all mt-4"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT MAIN CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0b0f19]">
        {/* Top Navbar */}
        <div className="bg-white dark:bg-slate-800 px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 z-0 flex-shrink-0">
          <div className="relative flex-1 max-w-md flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
            <SearchOutlined className="absolute left-3 text-slate-400 text-[15px]" />
            <input
              type="text"
              placeholder="Search drivers by name or ID..."
              className="w-full pl-9 pr-4 py-1.5 bg-transparent text-[13px] font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400"
              value={filters.search}
              onChange={(e) => applyFilters({ search: e.target.value })}
            />
            <div className="absolute right-3">
              <span className="text-[10px] font-bold text-slate-400 border border-slate-200 dark:border-slate-600 rounded-[4px] px-1.5 py-[1px] bg-slate-50/50 dark:bg-slate-800 tracking-wide">
                ⌘K
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-[10px] font-black tracking-widest uppercase">
                {activeDrivers.length} ACTIVE
              </span>
            </div>
            <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-500/20">
              <span className="text-[10px] font-black tracking-widest uppercase">
                {DATA.length} TOTAL
              </span>
            </div>

            <button
              onClick={() => dispatch(fetchDrivers())}
              className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all"
            >
              <IoMdRefresh className={`text-[15px] ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Outer wrapper for scrollable content and sticky footer */}
        <div className="flex-grow flex flex-col min-w-0 relative h-full">
          {/* Scrollable Main Content */}
          <div className="flex-grow overflow-y-auto p-4 bg-white dark:bg-slate-900 flex flex-col gap-4 pb-20 custom-scrollbar">
            <DriverStats drivers={DATA} loading={loading} />

            {loading && DATA.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-20 bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700">
                <Spin size="large" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center p-20 bg-rose-50 rounded-sm border border-rose-100 text-rose-500 font-bold shadow-sm">
                {error}
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {currentView === "all" && (
                  <TableSection
                    title="Fleet Overview"
                    icon={<Users size={16} />}
                    data={allFleetDrivers.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                    count={allFleetDrivers.length}
                    flexClass="flex-1 h-full"
                    extraClasses="border-none rounded-none !min-h-0"
                    colorClass="bg-indigo-600"
                    bgColorClass="from-indigo-50 dark:from-indigo-900/30"
                    borderColorClass="border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 bg-indigo-100/50 dark:bg-indigo-900/30 font-black"
                  />
                )}
                {currentView === "active" && (
                  <TableSection
                    title="Verified & Active"
                    icon={<Car size={16} />}
                    data={activeDrivers.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                    count={activeDrivers.length}
                    flexClass="flex-1 h-full"
                    extraClasses="border-none rounded-none !min-h-0"
                    colorClass="bg-emerald-500 shadow-lg shadow-emerald-500/40"
                    bgColorClass="from-emerald-50 dark:from-emerald-900/30 via-emerald-50/10 dark:via-emerald-900/10"
                    borderColorClass="border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-100/50 dark:bg-emerald-900/30 font-black"
                  />
                )}
                {currentView === "restricted" && (
                  <TableSection
                    title="Suspended / Blocked / Rejected"
                    icon={<ShieldAlert size={16} />}
                    data={restrictedDrivers.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                    count={restrictedDrivers.length}
                    flexClass="flex-1 h-full"
                    extraClasses="border-none rounded-none !min-h-0"
                    colorClass="bg-slate-400"
                    bgColorClass="from-slate-50 dark:from-slate-800/50"
                    borderColorClass="border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 font-black"
                  />
                )}
              </div>
            )}
          </div>

          {/* Sticky Bottom Pagination Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 px-6 flex items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] overflow-x-auto gap-4 custom-scrollbar">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap flex-shrink-0">
              Showing {(() => {
                const total = currentView === "all" ? allFleetDrivers.length : currentView === "active" ? activeDrivers.length : restrictedDrivers.length;
                return total > 0 ? (currentPage - 1) * pageSize + 1 : 0;
              })()}-{(() => {
                const total = currentView === "all" ? allFleetDrivers.length : currentView === "active" ? activeDrivers.length : restrictedDrivers.length;
                return Math.min(currentPage * pageSize, total);
              })()} of {currentView === "all" ? allFleetDrivers.length : currentView === "active" ? activeDrivers.length : restrictedDrivers.length} {currentView === "all" ? "drivers" : currentView === "active" ? "active drivers" : "restricted drivers"}
            </span>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={currentView === "all" ? allFleetDrivers.length : currentView === "active" ? activeDrivers.length : restrictedDrivers.length}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              showSizeChanger
              pageSizeOptions={["10", "20", "50", "100"]}
              size="small"
              className="premium-pagination"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Drivers;
