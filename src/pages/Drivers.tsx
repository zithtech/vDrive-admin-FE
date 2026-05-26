import { useState, useEffect, useMemo } from "react";
import { IoMdRefresh } from "react-icons/io";
import { CarOutlined, FilterOutlined, CloseCircleOutlined, ExclamationCircleOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { Button, Select, DatePicker, Divider, Slider, Input, Spin, Tabs } from "antd";
import DriverTable from "../components/DriverTable/DriverTable";
import dayjs from "dayjs";
import TitleBar from "../components/TitleBarCommon/TitleBar";
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

  useEffect(() => {
    dispatch(fetchDrivers());
  }, [dispatch]);

  // Dynamic plan options from data
  const planOptions = useMemo(() => {
    const plans = new Set<string>();
    DATA.forEach(d => {
      if (d.active_subscription?.plan_name) {
        plans.add(d.active_subscription.plan_name);
      }
    });
    return Array.from(plans).sort().map(p => ({ value: p, label: p }));
  }, [DATA]);

  useEffect(() => {
    let tempData = Array.isArray(DATA) ? [...DATA] : [];

    // Exclude pending / awaiting approval drivers from this page
    tempData = tempData.filter(d => 
      d.status !== "pending" && 
      d.status !== "pending_verification" && 
      d.onboarding_status !== "DOCS_SUBMITTED" &&
      d.onboarding_status !== "DOCS_REJECTED"
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

    // Subscription Plan Filter
    if (filters.plan.length > 0) {
      const selectedPlans = Array.isArray(filters.plan)
        ? filters.plan
        : [filters.plan];
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

  const { activeDrivers, restrictedDrivers } = useMemo(() => {
    return {
      activeDrivers: filteredData.filter(d => d.status === "active"),
      restrictedDrivers: filteredData.filter(d => 
        d.status !== "active" && 
        d.status !== "pending" && 
        d.onboarding_status !== "DOCS_SUBMITTED" &&
        d.onboarding_status !== "DOCS_REJECTED"
      ),
    };
  }, [filteredData]);

  const applyFilters = (values: Partial<Filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...values,
    }));
  };

  const hasActiveFilters = filters.search || filters.status.length > 0 || filters.plan.length > 0 || filters.joined_at || filters.rating[0] > 0 || filters.rating[1] < 5;

  const TableSection = ({ title, data, icon, colorClass, bgColorClass, borderColorClass, count, flexClass = "flex-1", extraClasses = "" }: any) => (
    <div className={`${flexClass} flex flex-col min-h-[400px] bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden ${extraClasses}`}>
      <div className={`px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r ${bgColorClass} to-white`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl ${colorClass} flex items-center justify-center text-white text-xs shadow-sm`}>
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 m-0 tracking-tight leading-none">{title}</h3>
            <p className="text-[10px] text-slate-400 font-medium m-0 mt-1 uppercase tracking-wider">Management & Overview</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full ${borderColorClass} border text-[11px] font-black tracking-tighter`}>
          {count} {count === 1 ? 'DRIVER' : 'DRIVERS'}
        </div>
      </div>
      <div className="flex-grow overflow-hidden">
        <DriverTable data={data} />
      </div>
    </div>
  );

  return (
    <TitleBar
      title="Driver Management"
      description="Manage drivers, view details, and perform administrative actions."
      icon={
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center">
          <CarOutlined className="text-white" />
        </div>
      }
      iconBgColor="bg-blue-600"
      extraContent={
        <div className="flex items-center gap-3">
          <Button
            icon={<IoMdRefresh />}
            loading={loading}
            type="primary"
            className="rounded-xl h-11 px-6 font-bold !bg-gradient-to-br !from-indigo-600 !to-blue-500 border-none"
            onClick={() => dispatch(fetchDrivers())}
          >
            Refresh Data
          </Button>
        </div>
      }
    >
      <div className="w-full h-full flex flex-col gap-6 bg-slate-50/50 p-6 overflow-hidden">
        <DriverStats drivers={DATA} loading={loading} />

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
              style={{ maxWidth: 200 }}
              className="premium-input-inline"
              value={filters.search}
              onChange={(e) => applyFilters({ search: e.target.value })}
              allowClear
            />

            <Select
              mode="multiple"
              placeholder="Status"
              style={{ minWidth: 180 }}
              className="premium-select-inline"
              value={filters.status}
              onChange={(val) => applyFilters({ status: val })}
              options={STATUSES.map(s => ({ label: s.toUpperCase(), value: s }))}
              maxTagCount="responsive"
            />

            <Select
              mode="multiple"
              placeholder="Plan"
              style={{ minWidth: 160 }}
              className="premium-select-inline"
              value={filters.plan}
              onChange={(val) => applyFilters({ plan: val })}
              options={planOptions}
              maxTagCount="responsive"
            />

            <div className="flex items-center gap-2" style={{ minWidth: 160 }}>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">Rating</span>
              <Slider
                range
                min={0}
                max={5}
                step={0.1}
                value={filters.rating}
                onChange={(val) => applyFilters({ rating: val as [number, number] })}
                style={{ width: 120 }}
                tooltip={{ formatter: (v) => `${v}★` }}
              />
            </div>

            <DatePicker
              placeholder="Joined At"
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
              onClick={() => setFilters({ search: "", status: [], plan: [], rating: [0, 5], joined_at: null })}
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
            <Tabs
              defaultActiveKey="all"
              className="premium-driver-tabs"
              items={[
                {
                  key: 'all',
                  label: (
                    <div className="flex items-center gap-2 px-1">
                      <EnvironmentOutlined />
                      <span>All Drivers</span>
                      <div className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black min-w-[20px] text-center">
                        {filteredData.length}
                      </div>
                    </div>
                  ),
                  children: (
                    <TableSection
                      title="Fleet Overview"
                      icon={<EnvironmentOutlined />}
                      data={filteredData}
                      count={filteredData.length}
                      flexClass="h-[calc(100vh-480px)]"
                      colorClass="bg-indigo-600"
                      bgColorClass="from-indigo-50"
                      borderColorClass="border-indigo-200 text-indigo-700 bg-indigo-100/50 font-black"
                    />
                  ),
                },
                {
                  key: 'active',
                  label: (
                    <div className="flex items-center gap-2 px-1">
                      <CarOutlined />
                      <span>Active Drivers</span>
                      <div className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black min-w-[20px] text-center">
                        {activeDrivers.length}
                      </div>
                    </div>
                  ),
                  children: (
                    <TableSection
                      title="Verified & Active"
                      icon={<CarOutlined />}
                      data={activeDrivers}
                      count={activeDrivers.length}
                      flexClass="h-[calc(100vh-480px)]"
                      extraClasses="border-emerald-500/20 shadow-lg shadow-emerald-500/5 ring-4 ring-emerald-500/5"
                      colorClass="bg-emerald-500 shadow-lg shadow-emerald-500/40"
                      bgColorClass="from-emerald-50 via-emerald-50/10"
                      borderColorClass="border-emerald-200 text-emerald-700 bg-emerald-100/50 font-black"
                    />
                  ),
                },
                {
                  key: 'restricted',
                  label: (
                    <div className="flex items-center gap-2 px-1">
                      <ExclamationCircleOutlined />
                      <span>Restricted & Rejected</span>
                      <div className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black min-w-[20px] text-center">
                        {restrictedDrivers.length}
                      </div>
                    </div>
                  ),
                  children: (
                    <TableSection
                      title="Suspended / Blocked / Rejected"
                      icon={<CloseCircleOutlined />}
                      data={restrictedDrivers}
                      count={restrictedDrivers.length}
                      flexClass="h-[calc(100vh-480px)]"
                      colorClass="bg-slate-400"
                      bgColorClass="from-slate-50"
                      borderColorClass="border-slate-200 text-slate-500 bg-slate-50"
                    />
                  ),
                },
              ]}
            />
          )}
        </div>
      </div>
    </TitleBar>
  );
};

export default Drivers;
