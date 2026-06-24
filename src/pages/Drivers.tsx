import { useState, useEffect, useMemo } from "react";
import { IoMdRefresh } from "react-icons/io";
import { Users, Filter } from "lucide-react";
import {
  CarOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  EnvironmentOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Select, DatePicker,  Slider, Spin } from "antd";
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
      className={`${flexClass} flex flex-col min-h-[400px] bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden ${extraClasses}`}
    >
      <div className="flex-grow overflow-hidden">
        <DriverTable data={data} />
      </div>
    </div>
  );

  const ViewItem = ({ icon, label, count, isActive, onClick, activeColorClass = "text-blue-600 dark:text-blue-400", bgActiveColorClass = "bg-blue-50/80 dark:bg-blue-500/10", badgeColorClass = "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300" }: any) => (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${isActive
        ? `${bgActiveColorClass} ${activeColorClass} font-bold`
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
        }`}
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="text-xs">{icon}</span>
        <span>{label}</span>
      </div>
      {count !== undefined && (
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isActive
          ? badgeColorClass
          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
          }`}>
          {count}
        </span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-[#f8f9fa] dark:bg-[#0b0f19] overflow-hidden">
      {/* Top Navbar */}
      <div className="bg-white dark:bg-slate-800 h-12 px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 z-0 flex-shrink-0">
        {/* Title & Description */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Users size={16} strokeWidth={2.5} />
              </div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 !m-0 !mb-1 leading-none">Drivers</h1>
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0 hidden lg:block">View and manage fleet drivers</p>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-xl mx-auto flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all h-9">
          <SearchOutlined className="absolute left-3 text-slate-400 text-[16px]" />
          <input
            type="text"
            placeholder="Search drivers by name or ID..."
            className="w-full pl-10 pr-4 py-1.5 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400 border-none shadow-none focus:ring-0"
            value={filters.search}
            onChange={(e) => applyFilters({ search: e.target.value })}
          />
          <div className="absolute right-3">
            <span className="text-[11px] font-bold text-slate-400 border border-slate-200 dark:border-slate-600 rounded-[4px] px-1.5 py-[1px] bg-slate-50/50 dark:bg-slate-800 tracking-wide">
              ⌘K
            </span>
          </div>
        </div>

        {/* Results & Refresh */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[11px] font-black tracking-widest uppercase">
              {activeDrivers.length} ACTIVE
            </span>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-500/20">
            <span className="text-[11px] font-black tracking-widest uppercase">
              {DATA.length} TOTAL
            </span>
          </div>

          <button
            onClick={() => dispatch(fetchDrivers())}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <IoMdRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-[220px] flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-8 custom-scrollbar">
            {/* VIEWS SECTION */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase px-2 mb-0.5 block">
                Views
              </span>
              
              <div className="space-y-1">
                <ViewItem
                  icon={<EnvironmentOutlined />}
                  label="All Drivers"
                  count={allFleetDrivers.length}
                  isActive={currentView === "all"}
                  onClick={() => setCurrentView("all")}
                  activeColorClass="text-blue-500"
                  bgActiveColorClass="bg-blue-50/80 dark:bg-blue-900/30"
                  badgeColorClass="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                />
                <ViewItem
                  icon={<CarOutlined />}
                  label="Active"
                  count={activeDrivers.length}
                  isActive={currentView === "active"}
                  onClick={() => setCurrentView("active")}
                  activeColorClass="text-emerald-600 dark:text-emerald-400"
                  bgActiveColorClass="bg-emerald-50/80 dark:bg-emerald-500/10"
                  badgeColorClass="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                />
                <ViewItem
                  icon={<ExclamationCircleOutlined />}
                  label="Restricted"
                  count={restrictedDrivers.length}
                  isActive={currentView === "restricted"}
                  onClick={() => setCurrentView("restricted")}
                  activeColorClass="text-rose-600 dark:text-rose-400"
                  bgActiveColorClass="bg-rose-50/80 dark:bg-rose-500/10"
                  badgeColorClass="bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300"
                />
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT MAIN CONTENT */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-[#0f172a]">
          {/* Scrollable Main Content */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            <DriverStats drivers={DATA} loading={loading} />
          
          {/* HORIZONTAL FILTERS BAR */}
          <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4 shadow-sm rounded-none">
            <div className="flex items-center gap-2 px-3 border-r border-slate-200 dark:border-slate-700 text-slate-400 shrink-0">
              <Filter size={16} className="text-indigo-500" />
              <span className="text-[11px] font-black uppercase tracking-widest">FILTERS</span>
            </div>

            <div className="flex-1 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status:</span>
                <Select
                  mode="multiple"
                  placeholder="All Statuses"
                  className="w-48 custom-select-compact"
                  options={STATUSES.map((s) => ({ label: s.toUpperCase(), value: s }))}
                  value={filters.status}
                  onChange={(val) => applyFilters({ status: val })}
                  maxTagCount="responsive"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan:</span>
                <Select
                  mode="multiple"
                  placeholder="All Plans"
                  className="w-48 custom-select-compact"
                  options={planOptions}
                  value={filters.plan}
                  onChange={(val) => applyFilters({ plan: val })}
                  maxTagCount="responsive"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Joined:</span>
                <DatePicker
                  placeholder="Select Date"
                  className="w-36"
                  value={filters.joined_at ? dayjs(filters.joined_at) : null}
                  onChange={(date) => applyFilters({ joined_at: date ? date.toDate() : null })}
                />
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-1 min-w-[150px] max-w-[250px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rating:</span>
                <Slider
                  range
                  min={0}
                  max={5}
                  step={0.1}
                  value={filters.rating}
                  onChange={(val) => applyFilters({ rating: val as [number, number] })}
                  tooltip={{ formatter: (v) => `${v}★` }}
                  className="flex-1 m-0"
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => setFilters({ search: "", status: [], plan: [], rating: [0, 5], joined_at: null })}
                  className="ml-auto px-3 py-1.5 rounded text-[11px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

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
                  icon={<EnvironmentOutlined />}
                  data={allFleetDrivers}
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
                  icon={<CarOutlined />}
                  data={activeDrivers}
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
                  icon={<CloseCircleOutlined />}
                  data={restrictedDrivers}
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
      </div>
    </div>
    </div>
  );
};

export default Drivers;
