import { useState, useEffect, useMemo } from "react";
import { IoMdRefresh } from "react-icons/io";
import { Users } from "lucide-react";
import {
  TeamOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { Button, Select, DatePicker, Input, Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import { fetchCustomers } from "../store/slices/customerSlice";
import CustomerTable from "../components/CustomerTable/CustomerTable";
import dayjs from "dayjs";
import CustomerStats from "../components/Customers/CustomerStats";
import { Pagination } from "antd";

export type CustomerStatus = "active" | "inactive" | "suspended" | "blocked";

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
}

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  status: CustomerStatus;
  updated_at: string;
  created_at: string;
  gender?: string;
  role?: string;
  emergency_contacts?: EmergencyContact[];
  user_code?: string;
  total_trips?: number;
}

export interface Filters {
  status: CustomerStatus[];
  updated_at: Date | null;
  created_at: Date | null;
}

const STATUSES = ["active", "inactive", "suspended", "blocked"];

const Customers = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { customers, loading } = useSelector((state: RootState) => state.customers);
  const { role } = useSelector((state: RootState) => state.auth);
  const isSuperAdmin = role === "super_admin";

  const [filters, setFilters] = useState<Filters>({
    status: [],
    updated_at: null,
    created_at: null,
  });

  const [globalSearch, setGlobalSearch] = useState("");
  const [currentView, setCurrentView] = useState<"all" | "active" | "inactive" | "restricted">("all");

  const [filteredData, setFilteredData] = useState<Customer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const customersArray = useMemo(() => {
    return Array.isArray(customers) ? customers : (customers as any)?.data || (customers as any)?.users || [];
  }, [customers]);

  useEffect(() => {
    let tempData = [...customersArray];
    if (filters?.status?.length > 0) {
      const selectedStatuses = Array.isArray(filters?.status) ? filters?.status : [filters?.status];
      tempData = tempData.filter((customer) => selectedStatuses.includes(customer?.status));
    }
    if (filters?.updated_at) {
      tempData = tempData.filter((customer) =>
        dayjs(customer?.updated_at).isSame(filters?.updated_at, "day"),
      );
    }
    if (filters?.created_at) {
      tempData = tempData.filter((customer) =>
        dayjs(customer?.created_at).isSame(filters?.created_at, "day"),
      );
    }

    if (globalSearch) {
      const searchLower = globalSearch.toLowerCase();
      tempData = tempData.filter((customer) =>
        customer?.full_name?.toLowerCase().includes(searchLower) ||
        customer?.email?.toLowerCase().includes(searchLower) ||
        customer?.phone_number?.toLowerCase().includes(searchLower) ||
        customer?.user_code?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredData(tempData);
  }, [customersArray, filters, globalSearch]);

  const { allCustomers, activeCustomers, inactiveCustomers, restrictedCustomers } = useMemo(() => {
    return {
      allCustomers: filteredData,
      activeCustomers: filteredData.filter((d) => d.status === "active"),
      inactiveCustomers: filteredData.filter((d) => d.status === "inactive"),
      restrictedCustomers: filteredData.filter((d) => d.status === "suspended" || d.status === "blocked"),
    };
  }, [filteredData]);

  const displayedData = useMemo(() => {
    if (currentView === "active") return activeCustomers;
    if (currentView === "inactive") return inactiveCustomers;
    if (currentView === "restricted") return restrictedCustomers;
    return allCustomers;
  }, [currentView, allCustomers, activeCustomers, inactiveCustomers, restrictedCustomers]);

  const applyFilters = (values: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...values }));
  };

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.updated_at ||
    filters.created_at;

  const ViewItem = ({ icon, label, count, isActive, onClick, activeColorClass = "text-blue-500", bgActiveColorClass = "bg-blue-50/80 dark:bg-blue-900/30", badgeColorClass = "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" }: any) => (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2 rounded-[10px] cursor-pointer transition-all ${isActive
        ? `${bgActiveColorClass} text-slate-800 dark:text-slate-100 font-bold`
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium"
        }`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`text-[15px] ${isActive ? activeColorClass : "text-slate-400"}`}>{icon}</span>
        <span className="text-[13px] tracking-tight">{label}</span>
      </div>
      {isActive ? (
        <div className={`px-2 py-0.5 rounded-md text-[10px] font-black min-w-[20px] text-center ${badgeColorClass}`}>
          {count}
        </div>
      ) : (
        <div className="text-[11px] font-bold text-slate-400 mr-1">
          {count}
        </div>
      )}
    </div>
  );

  const TableSection = ({
    data,
    flexClass = "flex-1",
    extraClasses = "",
  }: any) => (
    <div
      className={`${flexClass} flex flex-col min-h-[400px] bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden ${extraClasses}`}
    >
      <div className="flex-grow overflow-hidden">
        <CustomerTable
          data={data}
          isSuperAdmin={isSuperAdmin}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={(page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          }}
        />
      </div>
    </div>
  );

  return (
    <>
      <div className="flex h-full w-full overflow-hidden bg-white dark:bg-slate-900">
        {/* LEFT SIDEBAR */}
        <div className="w-[220px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0">
          {/* Sidebar Header */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Users size={16} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col justify-center mt-0.5">
                <h2 className="font-black text-sm uppercase tracking-wider leading-none m-0">ACCOUNTS</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Customers Mgmt</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* VIEWS */}
            <div className="px-4 pt-6 pb-6 border-b border-slate-200 dark:border-slate-800/50">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2 mb-5">
                Views
              </p>
              <div className="flex flex-col gap-1">
                <ViewItem
                  icon={<TeamOutlined />}
                  label="All Customers"
                  count={allCustomers.length}
                  isActive={currentView === "all"}
                  onClick={() => setCurrentView("all")}
                  activeColorClass="text-blue-500"
                  bgActiveColorClass="bg-blue-50/80 dark:bg-blue-900/30"
                  badgeColorClass="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                />
                <ViewItem
                  icon={<CheckCircleOutlined />}
                  label="Active"
                  count={activeCustomers.length}
                  isActive={currentView === "active"}
                  onClick={() => setCurrentView("active")}
                  activeColorClass="text-emerald-500"
                  bgActiveColorClass="bg-emerald-50/80 dark:bg-emerald-900/30"
                  badgeColorClass="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                />
                <ViewItem
                  icon={<MinusCircleOutlined />}
                  label="Inactive"
                  count={inactiveCustomers.length}
                  isActive={currentView === "inactive"}
                  onClick={() => setCurrentView("inactive")}
                  activeColorClass="text-amber-500"
                  bgActiveColorClass="bg-amber-50/80 dark:bg-amber-900/30"
                  badgeColorClass="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
                />
                <ViewItem
                  icon={<StopOutlined />}
                  label="Restricted"
                  count={restrictedCustomers.length}
                  isActive={currentView === "restricted"}
                  onClick={() => setCurrentView("restricted")}
                  activeColorClass="text-rose-500"
                  bgActiveColorClass="bg-rose-50/80 dark:bg-rose-900/30"
                  badgeColorClass="bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400"
                />
              </div>
            </div>

            {/* FILTERS */}
            <div className="px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2 mb-6">
                Filters
              </p>
              <div className="flex flex-col gap-3 px-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1 uppercase tracking-wide">
                    Status
                  </span>
                  <Select
                    mode="multiple"
                    placeholder="Select status..."
                    className="w-full premium-select-inline"
                    options={STATUSES.map((s) => ({ label: s.toUpperCase(), value: s }))}
                    value={filters.status}
                    onChange={(val) => applyFilters({ status: val as CustomerStatus[] })}
                    maxTagCount="responsive"
                  />
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1 uppercase tracking-wide">
                    Updated Date
                  </span>
                  <DatePicker
                    placeholder="Select Date"
                    className="w-full premium-datepicker-inline"
                    onChange={(date) => applyFilters({ updated_at: date ? date.toDate() : null })}
                  />
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1 uppercase tracking-wide">
                    Created Date
                  </span>
                  <DatePicker
                    placeholder="Select Date"
                    className="w-full premium-datepicker-inline"
                    onChange={(date) => applyFilters({ created_at: date ? date.toDate() : null })}
                  />
                </div>

                {hasActiveFilters && (
                  <Button
                    type="text"
                    danger
                    icon={<CloseCircleOutlined />}
                    className="text-[11px] font-black uppercase tracking-widest w-full hover:bg-rose-50 rounded-xl mt-2"
                    onClick={() =>
                      setFilters({ status: [], updated_at: null, created_at: null })
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
          <div className="bg-white dark:bg-slate-800 p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 shadow-sm z-0 flex-shrink-0">
            <div className="relative flex-1 max-w-3xl flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <SearchOutlined className="absolute left-3 text-slate-400 text-[16px]" />
              <input
                type="text"
                placeholder="Search customers..."
                className="w-full pl-10 pr-4 py-2 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
              <div className="absolute right-3">
                <span className="text-[11px] font-bold text-slate-400 border border-slate-200 dark:border-slate-600 rounded-[4px] px-1.5 py-[1px] bg-slate-50/50 dark:bg-slate-800 tracking-wide">
                  ⌘K
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 px-3 py-1.5 rounded-full border border-blue-100 dark:border-blue-500/20">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-[11px] font-black tracking-widest uppercase">
                  {displayedData.length} RESULTS
                </span>
              </div>

              <button
                onClick={() => dispatch(fetchCustomers())}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all"
              >
                <IoMdRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Scrollable Main Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-[#0f172a] flex flex-col gap-6">
            <CustomerStats customers={customersArray} loading={loading} />

            {loading && displayedData.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-20 bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700">
                <Spin size="large" />
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <TableSection
                  data={displayedData}
                  flexClass="flex-1 h-full"
                  extraClasses="border-none rounded-none !min-h-0"
                />
              </div>
            )}
          </div>

          {/* Sticky Pagination Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 flex-shrink-0">
            <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              Showing <span className="font-bold text-slate-800 dark:text-slate-200">{displayedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, displayedData.length)}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{displayedData.length}</span> customers
            </div>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={displayedData.length}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              showSizeChanger
              pageSizeOptions={[10, 15, 20, 50, 100]}
              size="small"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Customers;
