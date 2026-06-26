import { useState, useEffect, useMemo } from "react";
import { IoMdRefresh } from "react-icons/io";
import { ClipboardCheck, ShieldAlert, FileWarning, XCircle } from "lucide-react";
import {
  CloseCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Select, DatePicker, Spin, Pagination } from "antd";
import DriverTable from "../components/DriverTable/DriverTable";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchDrivers } from "../store/slices/driverSlice";
import type { Driver, DriverStatus } from "../store/slices/driverSlice";
import DriverApprovalModal from "../components/DriverApplications/DriverApprovalModal";
import ApplicationStats from "../components/DriverApplications/ApplicationStats";

export interface Filters {
  search: string;
  status: DriverStatus[];
  joined_at: Date | null;
  onboarding_status: string[];
}

const STATUSES: DriverStatus[] = ["pending", "pending_verification"];

const ONBOARDING_STATUSES = [
  { value: "PHONE_VERIFIED", label: "Phone Verified" },
  { value: "PROFILE_COMPLETED", label: "Profile Completed" },
  { value: "ADDRESS_COMPLETED", label: "Address Completed" },
  { value: "DOCS_SUBMITTED", label: "Docs Submitted" },
  { value: "DOCUMENTS_APPROVED", label: "Documents Approved" },
  { value: "DOCS_REJECTED", label: "Docs Rejected" },
];

const DriverApplications = () => {
  const dispatch = useAppDispatch();
  const { drivers: DATA, loading, error } = useAppSelector((state) => state.drivers);
  const [filteredData, setFilteredData] = useState<Driver[]>([]);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [selectedDriverForApproval, setSelectedDriverForApproval] = useState<Driver | null>(null);

  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: [],
    joined_at: null,
    onboarding_status: [],
  });

  const [currentView, setCurrentView] = useState<"pending" | "doc_rejected" | "rejected">("pending");

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

  useEffect(() => {
    let tempData = Array.isArray(DATA) ? [...DATA] : [];

    // Filter ONLY pending drivers for this page
    tempData = tempData.filter(
      (d) =>
        d.status === "pending" ||
        d.status === "pending_verification" ||
        (d.onboarding_status &&
          !["ONBOARDING_COMPLETED", "SUBSCRIPTION_ACTIVE", "ACTIVE"].includes(d.onboarding_status)),
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

    if (filters.onboarding_status.length > 0) {
      const selectedOnboardingStatuses = Array.isArray(filters.onboarding_status)
        ? filters.onboarding_status
        : [filters.onboarding_status];
      tempData = tempData.filter(
        (driver) =>
          driver.onboarding_status && selectedOnboardingStatuses.includes(driver.onboarding_status),
      );
    }

    if (filters.joined_at) {
      tempData = tempData.filter((driver) =>
        dayjs(driver.created_at).isSame(filters.joined_at, "day"),
      );
    }

    setFilteredData(tempData);
  }, [DATA, filters]);

  const { pendingApplications, docRejectedApplications, rejectedApplications, allTrackedApplications } = useMemo(() => {
    return {
      allTrackedApplications: DATA.filter(
        (d) =>
          d.status === "pending" ||
          d.status === "pending_verification" ||
          (d.onboarding_status &&
            !["ONBOARDING_COMPLETED", "SUBSCRIPTION_ACTIVE", "ACTIVE"].includes(d.onboarding_status)),
      ),
      pendingApplications: filteredData.filter(
        (d) => d.status !== "rejected" && d.onboarding_status !== "DOCS_REJECTED",
      ),
      docRejectedApplications: filteredData.filter(
        (d) => d.status !== "rejected" && d.onboarding_status === "DOCS_REJECTED",
      ),
      rejectedApplications: filteredData.filter((d) => d.status === "rejected"),
    };
  }, [DATA, filteredData]);

  const applyFilters = (values: Partial<Filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...values,
    }));
  };

  const hasActiveFilters =
    filters.search ||
    filters.status.length > 0 ||
    filters.joined_at ||
    filters.onboarding_status.length > 0;



  const TableSection = ({
    data,
    flexClass = "flex-1",
    extraClasses = "",
  }: { data: Driver[]; flexClass?: string; extraClasses?: string }) => (
    <div
      className={`${flexClass} flex flex-col min-h-[400px] bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden ${extraClasses}`}
    >
      <div className="flex-grow overflow-hidden">
        <DriverTable
          data={data}
          onViewDetails={(driver) => {
            setSelectedDriverForApproval(driver);
            setApprovalModalOpen(true);
          }}
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-white dark:bg-slate-900">
        {/* LEFT SIDEBAR */}
        <div className="w-[260px] flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
          {/* Sidebar Header */}
          <div className="p-6 pb-6 border-b border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-3 mb-1 text-slate-800 dark:text-slate-100">
              <div className="w-10 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <ClipboardCheck size={20} />
              </div>
              <h2 className="text-[20px] text-slate-900 dark:text-white tracking-wider whitespace-nowrap"><b>Applications</b></h2>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-snug mt-1">
              Review, approve, and manage driver applications
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
                  onClick={() => setCurrentView("pending")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${currentView === "pending" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"}`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={16} className={currentView === "pending" ? "text-blue-500" : "text-slate-400"} />
                    Pending Auth
                  </div>
                  <span className={currentView === "pending" ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold"}>
                    {pendingApplications.length}
                  </span>
                </button>
                
                <button
                  onClick={() => setCurrentView("doc_rejected")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${currentView === "doc_rejected" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"}`}
                >
                  <div className="flex items-center gap-2">
                    <FileWarning size={16} className={currentView === "doc_rejected" ? "text-blue-500" : "text-slate-400"} />
                    Docs Rejected
                  </div>
                  <span className={currentView === "doc_rejected" ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold"}>
                    {docRejectedApplications.length}
                  </span>
                </button>

                <button
                  onClick={() => setCurrentView("rejected")}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${currentView === "rejected" ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"}`}
                >
                  <div className="flex items-center gap-2">
                    <XCircle size={16} className={currentView === "rejected" ? "text-blue-500" : "text-slate-400"} />
                    Rejected
                  </div>
                  <span className={currentView === "rejected" ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 text-[10px] px-2 py-0.5 rounded-full font-bold" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold"}>
                    {rejectedApplications.length}
                  </span>
                </button>
              </div>
            </div>

            {/* FILTERS SECTION */}
            <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">
                Filters
              </h3>
              <div className="space-y-4 px-2">
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                    Onboarding Step
                  </label>
                  <Select
                    mode="multiple"
                    placeholder="Filter step..."
                    className="w-full custom-select-compact h-9"
                    options={ONBOARDING_STATUSES}
                    value={filters.onboarding_status}
                    onChange={(val) => applyFilters({ onboarding_status: val })}
                    maxTagCount="responsive"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">
                    Applied Date
                  </label>
                  <DatePicker
                    placeholder="Select Date"
                    className="w-full custom-select-compact h-9"
                    onChange={(date) => applyFilters({ joined_at: date ? date.toDate() : null })}
                  />
                </div>

                {hasActiveFilters && (
                  <Button
                    type="text"
                    danger
                    icon={<CloseCircleOutlined />}
                    className="text-[11px] font-black uppercase tracking-widest w-full hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl mt-2"
                    onClick={() =>
                      setFilters({ search: "", status: [], joined_at: null, onboarding_status: [] })
                    }
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN CONTENT */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0b0f19]">
          {/* Top Navbar */}
          {/* Top Navbar */}
          <div className="bg-white dark:bg-slate-800 px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 shadow-sm z-0 flex-shrink-0">
            <div className="relative flex-1 max-w-md flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <SearchOutlined className="absolute left-3 text-slate-400 text-[15px]" />
              <input
                type="text"
                placeholder="Search applications..."
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-500/20">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span className="text-[11px] font-black tracking-widest uppercase">
                  {filteredData.length} RESULTS
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
            <div className="flex-grow overflow-y-auto p-6 bg-slate-50/50 dark:bg-[#0f172a] flex flex-col gap-6 pb-20 custom-scrollbar">
              <ApplicationStats drivers={allTrackedApplications} loading={loading} />

              {loading && allTrackedApplications.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-20 bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700">
                  <Spin size="large" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center p-20 bg-rose-50 rounded-sm border border-rose-100 text-rose-500 font-bold shadow-sm">
                  {error}
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {currentView === "pending" && (
                    <TableSection
                      data={pendingApplications.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                      flexClass="flex-1 h-full"
                      extraClasses="border-none rounded-none !min-h-0"
                    />
                  )}
                  {currentView === "doc_rejected" && (
                    <TableSection
                      data={docRejectedApplications.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                      flexClass="flex-1 h-full"
                      extraClasses="border-none rounded-none !min-h-0"
                    />
                  )}
                  {currentView === "rejected" && (
                    <TableSection
                      data={rejectedApplications.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
                      flexClass="flex-1 h-full"
                      extraClasses="border-none rounded-none !min-h-0"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Sticky Bottom Pagination Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 px-6 flex items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] overflow-x-auto gap-4 custom-scrollbar">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap flex-shrink-0">
                Showing {(() => {
                  const total = currentView === "pending" ? pendingApplications.length : currentView === "doc_rejected" ? docRejectedApplications.length : rejectedApplications.length;
                  return total > 0 ? (currentPage - 1) * pageSize + 1 : 0;
                })()}-{(() => {
                  const total = currentView === "pending" ? pendingApplications.length : currentView === "doc_rejected" ? docRejectedApplications.length : rejectedApplications.length;
                  return Math.min(currentPage * pageSize, total);
                })()} of {currentView === "pending" ? pendingApplications.length : currentView === "doc_rejected" ? docRejectedApplications.length : rejectedApplications.length} applications
              </span>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={currentView === "pending" ? pendingApplications.length : currentView === "doc_rejected" ? docRejectedApplications.length : rejectedApplications.length}
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

      <DriverApprovalModal
        driver={selectedDriverForApproval}
        open={approvalModalOpen}
        onClose={() => {
          setApprovalModalOpen(false);
          setTimeout(() => setSelectedDriverForApproval(null), 300); // Clear after animation
        }}
      />
    </>
  );
};

export default DriverApplications;
