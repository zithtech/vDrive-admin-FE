import { useState, useEffect, useMemo } from "react";
import { IoMdRefresh } from "react-icons/io";
import { ClipboardCheck } from "lucide-react";
import {
  SafetyCertificateOutlined,
  FileExclamationOutlined,
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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

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

    setCurrentPage(1);
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
    setCurrentPage(1);
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

  const TableSection = ({
    data,
    flexClass = "flex-1",
    extraClasses = "",
  }: any) => (
    <div
      className={`${flexClass} flex flex-col min-h-[400px] bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden pb-1 ${extraClasses}`}
    >
      <div className="flex-grow min-h-0 overflow-hidden">
        <DriverTable
          data={data}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          }}
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
      <div className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-slate-900">
        {/* Top Navbar */}
        <div className="bg-white dark:bg-slate-800 h-12 px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 z-0 flex-shrink-0">
          {/* Title & Description */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
              <ClipboardCheck size={16} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 !m-0 !mb-1 leading-none">Driver Applications</h1>
            <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0">Review pending driver onboarding</p>
          </div>

          <div className="relative flex-1 max-w-xl mx-auto flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all h-9">
            <SearchOutlined className="absolute left-3 text-slate-400 text-[16px]" />
            <input
              type="text"
              placeholder="Search applications..."
              className="w-full pl-10 pr-4 py-1.5 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400"
              value={filters.search}
              onChange={(e) => applyFilters({ search: e.target.value })}
            />
            <div className="absolute right-3">
              <span className="text-[11px] font-bold text-slate-400 border border-slate-200 dark:border-slate-600 rounded-[4px] px-1.5 py-[1px] bg-slate-50/50 dark:bg-slate-800 tracking-wide">
                ⌘K
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 px-3 py-1.5 rounded-full border border-orange-100 dark:border-orange-500/20">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span className="text-[11px] font-black tracking-widest uppercase">
                {filteredData.length} RESULTS
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

        {/* Bottom Content Area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* LEFT SIDEBAR */}
          <div className="w-[220px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0">
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {/* VIEWS */}
              <div className="px-4 pt-6 pb-6 border-b border-slate-200 dark:border-slate-800/50">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2 mb-5">
                  Views
                </p>
                <div className="flex flex-col gap-1">
                  <ViewItem
                    icon={<SafetyCertificateOutlined />}
                    label="Pending Auth"
                    count={pendingApplications.length}
                    isActive={currentView === "pending"}
                    onClick={() => setCurrentView("pending")}
                    activeColorClass="text-orange-500"
                    bgActiveColorClass="bg-orange-50/80 dark:bg-orange-900/30"
                    badgeColorClass="bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400"
                  />
                  <ViewItem
                    icon={<FileExclamationOutlined />}
                    label="Docs Rejected"
                    count={docRejectedApplications.length}
                    isActive={currentView === "doc_rejected"}
                    onClick={() => setCurrentView("doc_rejected")}
                    activeColorClass="text-amber-500"
                    bgActiveColorClass="bg-amber-50/80 dark:bg-amber-900/30"
                    badgeColorClass="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
                  />
                  <ViewItem
                    icon={<CloseCircleOutlined />}
                    label="Rejected"
                    count={rejectedApplications.length}
                    isActive={currentView === "rejected"}
                    onClick={() => setCurrentView("rejected")}
                    activeColorClass="text-rose-500"
                    bgActiveColorClass="bg-rose-50/80 dark:bg-rose-900/30"
                    badgeColorClass="bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT MAIN CONTENT */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-[#0f172a] relative">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 pb-20">
              <ApplicationStats drivers={DATA} loading={loading} />

              {/* FILTERS TOOLBAR */}
              <div className="bg-white dark:bg-slate-800 py-1 px-2 rounded-sm border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4 shadow-sm flex-shrink-0 dark-theme-select-override">
                <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">
                    Status:
                  </span>
                  <Select
                    mode="multiple"
                    placeholder="Select status..."
                    className="flex-1 text-xs custom-driver-select min-w-0"
                    options={STATUSES.map((s) => ({ label: s.toUpperCase(), value: s }))}
                    value={filters.status}
                    onChange={(val) => applyFilters({ status: val })}
                    maxTagCount="responsive"
                  />
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">
                    Step:
                  </span>
                  <Select
                    mode="multiple"
                    placeholder="Filter step..."
                    className="flex-1 text-xs custom-driver-select min-w-0"
                    options={ONBOARDING_STATUSES}
                    value={filters.onboarding_status}
                    onChange={(val) => applyFilters({ onboarding_status: val })}
                    maxTagCount="responsive"
                  />
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">
                    Applied Date:
                  </span>
                  <DatePicker
                    placeholder="Select Date"
                    className="flex-1 text-xs custom-picker-compact min-w-0"
                    onChange={(date) => applyFilters({ joined_at: date ? date.toDate() : null })}
                  />
                </div>

                {hasActiveFilters && (
                  <Button
                    type="text"
                    danger
                    icon={<CloseCircleOutlined />}
                    className="text-[11px] font-bold uppercase tracking-wider"
                    onClick={() =>
                      setFilters({ search: "", status: [], joined_at: null, onboarding_status: [] })
                    }
                  >
                    Clear
                  </Button>
                )}
              </div>

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
                      data={pendingApplications}
                      flexClass="flex-1 h-full"
                      extraClasses="border-none rounded-none !min-h-0"
                    />
                  )}
                  {currentView === "doc_rejected" && (
                    <TableSection
                      data={docRejectedApplications}
                      flexClass="flex-1 h-full"
                      extraClasses="border-none rounded-none !min-h-0"
                    />
                  )}
                  {currentView === "rejected" && (
                    <TableSection
                      data={rejectedApplications}
                      flexClass="flex-1 h-full"
                      extraClasses="border-none rounded-none !min-h-0"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Sticky Pagination Footer */}
            {(() => {
              const currentViewData = currentView === "pending" ? pendingApplications : currentView === "doc_rejected" ? docRejectedApplications : rejectedApplications;
              return (
                <div className="absolute bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-805 px-6 flex items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                    Showing {currentViewData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
                    {Math.min(currentPage * pageSize, currentViewData.length)} of {currentViewData.length} applications
                  </span>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={currentViewData.length}
                    onChange={(page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    }}
                    showSizeChanger
                    pageSizeOptions={[10, 15, 20, 50, 100]}
                    size="small"
                  />
                </div>
              );
            })()}
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
      <style>{`
        /* Filter input styling overrides to match dark mode search bar */
        .custom-driver-select .ant-select-selector {
          border-radius: 8px !important;
        }

         .dark .dark-theme-select-override .custom-driver-select {
           border-color: #334155 !important;
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
        }
        
        .dark .dark-theme-select-override .ant-select-selector,
        html.dark .dark-theme-select-override .ant-select-selector {
          border-color: #334155 !important;
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
        }
        
        .dark .dark-theme-select-override .ant-select-selection-item,
        html.dark .dark-theme-select-override .ant-select-selection-item {
          color: #f1f5f9 !important;
          background-color: #1e293b !important;
          border-color: #334155 !important;
        }
        
        .dark .dark-theme-select-override .ant-select-selection-placeholder,
        html.dark .dark-theme-select-override .ant-select-selection-placeholder {
          color: #64748b !important;
        }
        
        .dark .dark-theme-select-override .ant-select-arrow,
        html.dark .dark-theme-select-override .ant-select-arrow {
          color: #64748b !important;
        }
        
        .dark .dark-theme-select-override .ant-select-clear,
        html.dark .dark-theme-select-override .ant-select-clear {
          background-color: transparent !important;
          color: #64748b !important;
        }
        
        /* Picker compact styling */
        .custom-picker-compact.ant-picker {
          border-radius: 8px !important;
        }
        .dark .custom-picker-compact.ant-picker {
          border-color: #334155 !important;
          background-color: #0f172a !important;
        }
      `}</style>
    </>
  );
};

export default DriverApplications;
