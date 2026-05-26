import { useState, useEffect } from "react";
import { IoMdRefresh } from "react-icons/io";
import { FilterOutlined, CloseCircleOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Button, Select, DatePicker, Divider, Input, Spin } from "antd";
import DriverTable from "../components/DriverTable/DriverTable";
import dayjs from "dayjs";
import TitleBar from "../components/TitleBarCommon/TitleBar";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchDrivers } from "../store/slices/driverSlice";
import type { Driver, DriverStatus } from "../store/slices/driverSlice";

export interface Filters {
  search: string;
  status: DriverStatus[];
  joined_at: Date | null;
}

const STATUSES: DriverStatus[] = ["pending", "pending_verification"];

const DriverApplications = () => {
  const dispatch = useAppDispatch();
  const { drivers: DATA, loading, error } = useAppSelector((state) => state.drivers);
  const [filteredData, setFilteredData] = useState<Driver[]>([]);

  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: [],
    joined_at: null,
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
      d.onboarding_status === "DOCS_SUBMITTED" || 
      d.onboarding_status === "DOCS_REJECTED"
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

    if (filters.joined_at) {
      tempData = tempData.filter((driver) =>
        dayjs(driver.created_at).isSame(filters.joined_at, "day"),
      );
    }

    setFilteredData(tempData);
  }, [DATA, filters]);

  const applyFilters = (values: Partial<Filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...values,
    }));
  };

  const hasActiveFilters = filters.search || filters.status.length > 0 || filters.joined_at;

  return (
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
      <div className="w-full h-full flex flex-col gap-6 bg-slate-50/50 p-6 overflow-hidden">
        {/* Inline Filter Bar */}
        <div className="bg-white p-2 px-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
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
              onClick={() => setFilters({ search: "", status: [], joined_at: null })}
            >
              Clear Filters
            </Button>
          )}
        </div>

        <div className="flex-grow overflow-hidden flex flex-col pb-4">
          {loading && DATA.length === 0 ? (
            <div className="flex items-center justify-center p-20 bg-white rounded-3xl border border-slate-100">
              <Spin size="large" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-20 bg-rose-50 rounded-3xl border border-rose-100 text-rose-500 font-bold">
              {error}
            </div>
          ) : (
            <div className={`flex-1 flex flex-col min-h-[400px] bg-white rounded-3xl border border-orange-500/20 shadow-lg shadow-orange-500/5 ring-4 ring-orange-500/5 overflow-hidden`}>
              <div className={`px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-orange-50 via-orange-50/10 to-white`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl bg-orange-500 shadow-lg shadow-orange-500/40 flex items-center justify-center text-white text-xs`}>
                    <SafetyCertificateOutlined />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 m-0 tracking-tight leading-none">Pending Verification</h3>
                    <p className="text-[10px] text-slate-400 font-medium m-0 mt-1 uppercase tracking-wider">Awaiting Admin Action</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full border-orange-200 text-orange-700 bg-orange-100/50 font-black border text-[11px] tracking-tighter`}>
                  {filteredData.length} {filteredData.length === 1 ? 'DRIVER' : 'DRIVERS'}
                </div>
              </div>
              <div className="flex-grow overflow-hidden">
                <DriverTable data={filteredData} />
              </div>
            </div>
          )}
        </div>
      </div>
    </TitleBar>
  );
};

export default DriverApplications;
