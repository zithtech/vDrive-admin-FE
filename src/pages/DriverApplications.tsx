import { useState, useEffect, useMemo } from "react";
import { IoMdRefresh } from "react-icons/io";
import { FilterOutlined, CloseCircleOutlined, SafetyCertificateOutlined, FileExclamationOutlined } from "@ant-design/icons";
import { Button, Select, DatePicker, Divider, Input, Spin, Tabs } from "antd";
import DriverTable from "../components/DriverTable/DriverTable";
import dayjs from "dayjs";
import TitleBar from "../components/TitleBarCommon/TitleBar";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchDrivers } from "../store/slices/driverSlice";
import type { Driver, DriverStatus } from "../store/slices/driverSlice";
import DriverApprovalModal from "../components/DriverApplications/DriverApprovalModal";

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
  { value: "DOCS_REJECTED", label: "Docs Rejected" }
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

  useEffect(() => {
    dispatch(fetchDrivers());
  }, [dispatch]);

  useEffect(() => {
    let tempData = Array.isArray(DATA) ? [...DATA] : [];

    // Filter ONLY pending drivers for this page
    tempData = tempData.filter(d => 
      d.status === "pending" || 
      d.status === "pending_verification" || 
      (d.onboarding_status && !["ONBOARDING_COMPLETED", "SUBSCRIPTION_ACTIVE", "ACTIVE"].includes(d.onboarding_status))
    );

    // Search by Name, System ID, or vDrive ID
    if (filters.search) {
      const searchText = filters.search.toLowerCase();
      tempData = tempData.filter((d) =>
        d.full_name?.toLowerCase().includes(searchText) ||
        d.driver_id?.toLowerCase().includes(searchText) ||
        d.vdrive_id?.toLowerCase().includes(searchText) ||
        d.id?.toLowerCase().includes(searchText)
      );
    }

    if (filters.status.length > 0) {
      const selectedStatuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      tempData = tempData.filter((driver) =>
        selectedStatuses.includes(driver.status),
      );
    }

    if (filters.onboarding_status.length > 0) {
      const selectedOnboardingStatuses = Array.isArray(filters.onboarding_status)
        ? filters.onboarding_status
        : [filters.onboarding_status];
      tempData = tempData.filter((driver) =>
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

  const { pendingApplications, docRejectedApplications, rejectedApplications } = useMemo(() => {
    return {
      pendingApplications: filteredData.filter(d => d.status !== "rejected" && d.onboarding_status !== "DOCS_REJECTED"),
      docRejectedApplications: filteredData.filter(d => d.status !== "rejected" && d.onboarding_status === "DOCS_REJECTED"),
      rejectedApplications: filteredData.filter(d => d.status === "rejected"),
    };
  }, [filteredData]);

  const applyFilters = (values: Partial<Filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...values,
    }));
  };

  const hasActiveFilters = filters.search || filters.status.length > 0 || filters.joined_at || filters.onboarding_status.length > 0;

  return (
    <>
    <TitleBar
      title="Driver Applications"
      description="Review and approve new driver applications and document submissions."
      icon={
        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center">
          <SafetyCertificateOutlined className="text-white" />
        </div>
      }
      iconBgColor="bg-orange-500"
      extraContent={
        <div className="flex items-center gap-3">
          <Button
            icon={<IoMdRefresh />}
            loading={loading}
            type="primary"
            className="rounded-xl h-11 px-6 font-bold !bg-gradient-to-br !from-orange-500 !to-amber-500 border-none"
            onClick={() => dispatch(fetchDrivers())}
          >
            Refresh Data
          </Button>
        </div>
      }
    >
      <div className="w-full h-full flex flex-col gap-6 bg-slate-50/50 dark:bg-[#0f172a] p-6 overflow-hidden">
        {/* Inline Filter Bar */}
        <div className="bg-white dark:bg-slate-800 p-2 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-grow flex-wrap">
            <div className="flex items-center gap-2">
              <FilterOutlined className="text-slate-400" />
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Filters</span>
            </div>
            <Divider type="vertical" className="h-6 border-slate-100" />

            <Input
              placeholder="Search driver..."
              style={{ maxWidth: 250 }}
              className="premium-input-inline"
              value={filters.search}
              onChange={(e) => applyFilters({ search: e.target.value })}
              allowClear
            />

            <Select
              mode="multiple"
              placeholder="Status"
              style={{ minWidth: 200 }}
              className="premium-select-inline"
              value={filters.status}
              onChange={(val) => applyFilters({ status: val })}
              options={STATUSES.map(s => ({ label: s.toUpperCase(), value: s }))}
              maxTagCount="responsive"
            />

            <Select
              mode="multiple"
              placeholder="Onboarding Status"
              style={{ minWidth: 220 }}
              className="premium-select-inline"
              value={filters.onboarding_status}
              onChange={(val) => applyFilters({ onboarding_status: val })}
              options={ONBOARDING_STATUSES}
              maxTagCount="responsive"
            />

            <DatePicker
              placeholder="Applied At"
              className="premium-datepicker-inline"
              onChange={(date) => applyFilters({ joined_at: date ? date.toDate() : null })}
            />
          </div>

          {hasActiveFilters && (
            <Button
              type="text"
              danger
              icon={<CloseCircleOutlined />}
              className="text-[10px] font-black uppercase tracking-widest px-4 hover:bg-rose-50 rounded-xl"
              onClick={() => setFilters({ search: "", status: [], joined_at: null, onboarding_status: [] })}
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="flex-grow overflow-hidden flex flex-col pb-4">
          {loading && DATA.length === 0 ? (
            <div className="flex items-center justify-center p-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
              <Spin size="large" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-20 bg-rose-50 dark:bg-rose-900/20 rounded-3xl border border-rose-100 dark:border-rose-900/50 text-rose-500 font-bold">
              {error}
            </div>
          ) : (
            <Tabs
              defaultActiveKey="pending"
              className="premium-driver-tabs"
              items={[
                {
                  key: 'pending',
                  label: (
                    <div className="flex items-center gap-2 px-1">
                      <SafetyCertificateOutlined />
                      <span>Pending Verification</span>
                      <div className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black min-w-[20px] text-center">
                        {pendingApplications.length}
                      </div>
                    </div>
                  ),
                  children: (
                    <div className={`flex-1 flex flex-col min-h-[400px] bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden`}>
                      <div className={`px-6 py-4 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-orange-50 via-orange-50/10 to-white dark:from-orange-900/20 dark:via-orange-900/5 dark:to-slate-800`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl bg-orange-500 shadow-lg shadow-orange-500/40 flex items-center justify-center text-white text-xs`}>
                            <SafetyCertificateOutlined />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 m-0 tracking-tight leading-none">Pending Verification</h3>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium m-0 mt-1 uppercase tracking-wider">Awaiting Admin Action</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full border-orange-200 text-orange-700 bg-orange-100/50 font-black border text-[11px] tracking-tighter`}>
                          {pendingApplications.length} {pendingApplications.length === 1 ? 'DRIVER' : 'DRIVERS'}
                        </div>
                      </div>
                      <div className="flex-grow overflow-hidden">
                        <DriverTable 
                          data={pendingApplications} 
                          onViewDetails={(driver) => {
                            setSelectedDriverForApproval(driver);
                            setApprovalModalOpen(true);
                          }}
                        />
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'doc_rejected',
                  label: (
                    <div className="flex items-center gap-2 px-1">
                      <FileExclamationOutlined />
                      <span>Docs Rejected</span>
                      <div className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black min-w-[20px] text-center">
                        {docRejectedApplications.length}
                      </div>
                    </div>
                  ),
                  children: (
                    <div className={`flex-1 flex flex-col min-h-[400px] bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden`}>
                      <div className={`px-6 py-4 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-amber-50 via-amber-50/10 to-white dark:from-amber-900/20 dark:via-amber-900/5 dark:to-slate-800`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl bg-amber-500 shadow-lg shadow-amber-500/40 flex items-center justify-center text-white text-xs`}>
                            <FileExclamationOutlined />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 m-0 tracking-tight leading-none">Documents Rejected</h3>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium m-0 mt-1 uppercase tracking-wider">Awaiting Re-upload</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full border-amber-200 text-amber-700 bg-amber-100/50 font-black border text-[11px] tracking-tighter`}>
                          {docRejectedApplications.length} {docRejectedApplications.length === 1 ? 'DRIVER' : 'DRIVERS'}
                        </div>
                      </div>
                      <div className="flex-grow overflow-hidden">
                        <DriverTable 
                          data={docRejectedApplications} 
                          onViewDetails={(driver) => {
                            setSelectedDriverForApproval(driver);
                            setApprovalModalOpen(true);
                          }}
                        />
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'rejected',
                  label: (
                    <div className="flex items-center gap-2 px-1">
                      <CloseCircleOutlined />
                      <span>Rejected Applications</span>
                      <div className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black min-w-[20px] text-center">
                        {rejectedApplications.length}
                      </div>
                    </div>
                  ),
                  children: (
                    <div className={`flex-1 flex flex-col min-h-[400px] bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden`}>
                      <div className={`px-6 py-4 border-b border-slate-50 dark:border-slate-700/50 flex items-center justify-between bg-gradient-to-r from-rose-50 via-rose-50/10 to-white dark:from-rose-900/20 dark:via-rose-900/5 dark:to-slate-800`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl bg-rose-500 shadow-lg shadow-rose-500/40 flex items-center justify-center text-white text-xs`}>
                            <CloseCircleOutlined />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 m-0 tracking-tight leading-none">Rejected Applications</h3>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium m-0 mt-1 uppercase tracking-wider">Unsuccessful Onboarding</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full border-rose-200 text-rose-700 bg-rose-100/50 font-black border text-[11px] tracking-tighter`}>
                          {rejectedApplications.length} {rejectedApplications.length === 1 ? 'DRIVER' : 'DRIVERS'}
                        </div>
                      </div>
                      <div className="flex-grow overflow-hidden">
                        <DriverTable 
                          data={rejectedApplications} 
                          onViewDetails={(driver) => {
                            setSelectedDriverForApproval(driver);
                            setApprovalModalOpen(true);
                          }}
                        />
                      </div>
                    </div>
                  ),
                }
              ]}
            />
          )}
        </div>
      </div>
    </TitleBar>
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
