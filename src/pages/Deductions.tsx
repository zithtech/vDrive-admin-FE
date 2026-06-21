import React, { useState, useEffect } from "react";
import DeductionTable from "../components/DeductionsTable/DeductionsTable";
import {
  CalculatorOutlined,
  DollarOutlined,
  WarningOutlined,
  ArrowDownOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Button, Select, Input, DatePicker, Pagination } from "antd";
import { IoMdRefresh } from "react-icons/io";
import dayjs from "dayjs";

export interface Driver {
  fullName: string;
  id: string;
  phone: string;
}
export type DeductionStatus = "Success" | "Failed" | "Pending" | "Initiated" | "Reversed";

export interface Deduction {
  id: string;
  driver: Driver;
  amount: string;
  trip: string;
  type: string;
  balanceBefore: string;
  balanceAfter: string;
  status: DeductionStatus;
  date: string;
  reference: string;
  performedBy: string;
}

// Dynamic Sparkline component for consistent charts
const Sparkline: React.FC<{ color: string }> = ({ color }) => {
  let strokeColor = "#3b82f6";
  let gradientId = "blue-grad-ded";
  let stopColor = "#3b82f6";

  if (color === "green") {
    strokeColor = "#10b981";
    gradientId = "green-grad-ded";
    stopColor = "#10b981";
  } else if (color === "orange") {
    strokeColor = "#f59e0b";
    gradientId = "orange-grad-ded";
    stopColor = "#f59e0b";
  } else if (color === "red") {
    strokeColor = "#ef4444";
    gradientId = "red-grad-ded";
    stopColor = "#ef4444";
  }

  return (
    <svg className="w-20 h-6 opacity-70" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stopColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={stopColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 25 C15 20, 30 28, 50 16 C70 4, 85 8, 100 2 L100 30 L0 30 Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M0 25 C15 20, 30 28, 50 16 C70 4, 85 8, 100 2"
        stroke={strokeColor}
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
};

const Deductions = () => {
  const DATA: Deduction[] = [
    {
      id: "DED-2024-001",
      driver: { fullName: "John Smith", id: "DRV-001", phone: "+1234567890" },
      amount: "$125.50",
      trip: "TRP-2024-001",
      type: "Commission",
      balanceBefore: "$1,250.00",
      balanceAfter: "$1,124.50",
      status: "Success",
      date: "Jan 15, 2024",
      reference: "REF-001",
      performedBy: "System",
    },
    {
      id: "DED-2024-002",
      driver: {
        fullName: "Alice Johnson",
        id: "DRV-002",
        phone: "+1234567891",
      },
      amount: "$45.75",
      trip: "TRP-2024-002",
      type: "Penalty",
      balanceBefore: "$890.25",
      balanceAfter: "$844.50",
      status: "Failed",
      date: "Jan 14, 2024",
      reference: "REF-002",
      performedBy: "Admin",
    },
    {
      id: "DED-2024-003",
      driver: {
        fullName: "Bob Williams",
        id: "DRV-003",
        phone: "+1234567892",
      },
      amount: "$15.00",
      trip: "TRP-2024-003",
      type: "Penalty",
      balanceBefore: "$500.00",
      balanceAfter: "$485.00",
      status: "Pending",
      date: "Jan 13, 2024",
      reference: "REF-003",
      performedBy: "System",
    },
    {
      id: "DED-2024-004",
      driver: {
        fullName: "David Brown",
        id: "DRV-004",
        phone: "+1234567893",
      },
      amount: "$60.00",
      trip: "TRP-2024-004",
      type: "Commission",
      balanceBefore: "$750.00",
      balanceAfter: "$690.00",
      status: "Success",
      date: "Jan 12, 2024",
      reference: "REF-004",
      performedBy: "System",
    },
  ];

  // Main navigation tab states
  const [mainTab, setMainTab] = useState<"ALL" | "COMMISSION" | "PENALTY">("ALL");

  // Filters state
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<any>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [mainTab, statusFilter, searchQuery, dateRange]);

  // Dynamic filter computation logic
  const filteredData = React.useMemo(() => {
    let result = [...DATA];

    // 1. Type Menu filter
    if (mainTab === "COMMISSION") {
      result = result.filter((item) => item.type === "Commission");
    } else if (mainTab === "PENALTY") {
      result = result.filter((item) => item.type === "Penalty");
    }

    // 2. Status Filter
    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }

    // 3. Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.id?.toLowerCase().includes(q) ||
          item.driver?.fullName?.toLowerCase().includes(q) ||
          item.driver?.id?.toLowerCase().includes(q) ||
          item.reference?.toLowerCase().includes(q)
      );
    }

    // 4. Date Range Filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf("day");
      const end = dateRange[1].endOf("day");
      result = result.filter((item) => {
        if (!item.date) return false;
        const date = dayjs(item.date);
        return (date.isAfter(start) || date.isSame(start)) && (date.isBefore(end) || date.isSame(end));
      });
    }

    return result;
  }, [mainTab, statusFilter, searchQuery, dateRange]);

  // Slice paginated subsets
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Statistics calculation helpers
  const parseAmount = (val: string) => {
    return parseFloat(val.replace(/[$,]/g, "")) || 0;
  };

  const formatCurrency = (val: number) => {
    return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const stats = React.useMemo(() => {
    const list = filteredData;
    const commissions = list.filter((item) => item.type === "Commission").reduce((sum, item) => sum + parseAmount(item.amount), 0);
    const penalties = list.filter((item) => item.type === "Penalty").reduce((sum, item) => sum + parseAmount(item.amount), 0);
    const netAmount = list.reduce((sum, item) => sum + parseAmount(item.amount), 0);

    return [
      {
        title: "Total Deductions",
        value: list.length,
        label: "transactions",
        icon: <CalculatorOutlined />,
        iconColor: "text-blue-500 dark:text-blue-400",
        iconBg: "bg-blue-50 dark:bg-blue-500/10",
        sparklineColor: "blue",
      },
      {
        title: "Total Commission",
        value: formatCurrency(commissions),
        label: "fees collected",
        icon: <DollarOutlined />,
        iconColor: "text-emerald-500 dark:text-emerald-400",
        iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
        sparklineColor: "green",
      },
      {
        title: "Total Penalties",
        value: formatCurrency(penalties),
        label: "fines charged",
        icon: <WarningOutlined />,
        iconColor: "text-rose-500 dark:text-rose-400",
        iconBg: "bg-rose-50 dark:bg-rose-500/10",
        sparklineColor: "red",
      },
      {
        title: "Net Deduction",
        value: formatCurrency(netAmount),
        label: "total debits",
        icon: <ArrowDownOutlined />,
        iconColor: "text-amber-500 dark:text-amber-400",
        iconBg: "bg-amber-50 dark:bg-amber-500/10",
        sparklineColor: "orange",
      },
    ];
  }, [filteredData]);

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900">
      <div className="w-full h-full flex flex-col md:flex-row bg-slate-50/50 dark:bg-slate-950/25 overflow-hidden">
        {/* ─── Left Sidebar Panel ─────────────────────────────────────── */}
        <div className="w-full md:w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/80 flex flex-col p-4 gap-4 overflow-y-auto custom-scrollbar">
          {/* Header Title / Context */}
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CalculatorOutlined className="text-base" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 tracking-tight text-xs uppercase leading-none">
                Deduction Management
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Monitor and manage driver deductions
              </span>
            </div>
          </div>

          {/* Action Button: Refresh */}
          <Button
            type="primary"
            icon={<IoMdRefresh />}
            onClick={() => { }}
            className="w-full h-9 rounded-lg font-bold text-xs uppercase tracking-wider border-none !bg-blue-600 hover:!bg-blue-700 text-white shadow-sm flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-all"
          >
            Refresh Data
          </Button>

          {/* Sidenav views section */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase px-2 mb-0.5">
              Views
            </span>

            {/* View: All Deductions */}
            <div
              onClick={() => setMainTab("ALL")}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "ALL"
                ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <CalculatorOutlined className="text-xs" />
                <span>All Deductions</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainTab === "ALL"
                ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-440"
                }`}>
                {DATA.length}
              </span>
            </div>

            {/* View: Commission Only */}
            <div
              onClick={() => setMainTab("COMMISSION")}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "COMMISSION"
                ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <DollarOutlined className="text-xs" />
                <span>Commissions</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainTab === "COMMISSION"
                ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}>
                {DATA.filter(d => d.type === "Commission").length}
              </span>
            </div>

            {/* View: Penalty Only */}
            <div
              onClick={() => setMainTab("PENALTY")}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "PENALTY"
                ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <WarningOutlined className="text-xs" />
                <span>Penalties Only</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainTab === "PENALTY"
                ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}>
                {DATA.filter(d => d.type === "Penalty").length}
              </span>
            </div>
          </div>

          <div className="h-[1px] bg-slate-100 dark:bg-slate-800/80" />

          {/* Filters section */}
          <div className="flex flex-col gap-3">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase px-2">
              Filters
            </span>

            {/* Filter: Status */}
            <div className="flex flex-col gap-1 px-2">
              <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Status
              </span>
              <Select
                placeholder="All Statuses"
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
                className="w-full text-xs premium-select-sidebar"
                options={[
                  { value: "Success", label: "Success" },
                  { value: "Failed", label: "Failed" },
                  { value: "Pending", label: "Pending" },
                  { value: "Initiated", label: "Initiated" },
                  { value: "Reversed", label: "Reversed" },
                ]}
              />
            </div>

            {/* Filter: Date Range */}
            <div className="flex flex-col gap-1 px-2">
              <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Created Date
              </span>
              <DatePicker.RangePicker
                value={dateRange}
                onChange={setDateRange}
                className="w-full text-xs premium-range-picker-sidebar"
                placeholder={["Start", "End"]}
              />
            </div>
          </div>
        </div>

        {/* ─── Right Content Area ─────────────────────────────────────── */}
        <div className="flex-grow flex flex-col min-w-0 relative h-full">
          <div className="flex-grow flex flex-col p-6 overflow-y-auto custom-scrollbar gap-5 pb-20">

            {/* Top Bar: Search Input & Results Count (mockup style) */}
            <div className="flex items-center justify-between gap-4 px-0 py-0.5 md:flex-nowrap flex-wrap">
              <div className="flex items-center gap-3 flex-grow flex-shrink-0">
                <Input
                  placeholder="Search driver, trip, or ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                  prefix={<SearchOutlined className="text-slate-400 text-xs" />}
                  className="w-48 text-xs rounded-xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 h-9"
                />
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {filteredData.length} results
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider">
                  {mainTab === "ALL" ? "All" : mainTab} Ledgers
                </span>
              </div>
            </div>

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

                  {/* Bottom Right Sparkline */}
                  <div className="absolute bottom-0 right-0 pointer-events-none">
                    <Sparkline color={card.sparklineColor} />
                  </div>
                </div>
              ))}
            </div>

            {/* Table Container */}
            <div className="flex-grow min-h-0">
              <DeductionTable data={paginatedData} />
            </div>
          </div>

          {/* Sticky Bottom Pagination Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-805 px-6 flex items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Showing {filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} deductions
            </span>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredData.length}
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
      `}</style>
    </div>
  );
};

export default Deductions;
