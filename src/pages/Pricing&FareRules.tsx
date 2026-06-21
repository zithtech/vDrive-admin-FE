import React, { useEffect, useState } from "react";
import { Button, Table, Modal, Dropdown, Pagination, Input, DatePicker } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  LoadingOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchPricingFareRules, setPage, setPageSize } from "../store/slices/pricingFareRulesSlice";
import type { PricingFareRule } from "../store/slices/pricingFareRulesSlice";
import type { ColumnsType } from "antd/es/table";
import PricingPreview from "../components/DriverPricing/PricingPreview";
import axiosIns from "../api/axios";
import dayjs from "dayjs";
import { useHasPermission } from "../hooks/usePermission";

// Helper to transform PricingFareRule time_slots to PricingPreview format
const transformSlotsForPreview = (rule: PricingFareRule) => {
  const transformed: any = {
    "normal-driver": [],
    "premium-driver": [],
    "elite-driver": [],
  };

  if (rule.time_slots) {
    rule.time_slots.forEach((slot, index) => {
      if (transformed[slot.driver_types]) {
        transformed[slot.driver_types].push({
          id: index + 1,
          day: slot.day,
          timeRange: [dayjs(slot.from_time, "HH:mm:ss"), dayjs(slot.to_time, "HH:mm:ss")],
          price: slot.price,
        });
      }
    });
  }
  return transformed;
};

// Dynamic Sparkline helper
const Sparkline: React.FC<{ color: string }> = ({ color }) => {
  let strokeColor = "#3b82f6";
  let gradientId = "blue-grad-pricing";
  let stopColor = "#3b82f6";

  if (color === "green") {
    strokeColor = "#10b981";
    gradientId = "green-grad-pricing";
    stopColor = "#10b981";
  } else if (color === "orange") {
    strokeColor = "#f59e0b";
    gradientId = "orange-grad-pricing";
    stopColor = "#f59e0b";
  } else if (color === "red") {
    strokeColor = "#ef4444";
    gradientId = "red-grad-pricing";
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

const PricingAndFareRules: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [previewRule, setPreviewRule] = useState<PricingFareRule | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const canCreatePricing = useHasPermission("pricing", "create");
  const canUpdatePricing = useHasPermission("pricing", "update");

  // Sidebar Layout States
  const [mainTab, setMainTab] = useState<"ALL" | "HOTSPOT" | "STANDARD">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<any>(null);
  const [counts, setCounts] = useState({ all: 0, hotspot: 0, standard: 0 });

  // Redux state
  const { fareRules, isLoading, total, currentPage, pageSize } = useAppSelector(
    (state) => state.pricingFareRules,
  );

  // Fetch counts on changes to maintain accurate sidebar badges
  const fetchCounts = async () => {
    try {
      const [allRes, hotspotRes] = await Promise.all([
        axiosIns.get("/api/pricing-fare-rules?limit=1"),
        axiosIns.get("/api/pricing-fare-rules?limit=1&is_hotspot=true"),
      ]);
      const allVal = allRes.data.data.total || 0;
      const hotspotVal = hotspotRes.data.data.total || 0;
      setCounts({
        all: allVal,
        hotspot: hotspotVal,
        standard: allVal - hotspotVal,
      });
    } catch (error) {
      console.error("Failed to fetch pricing counts", error);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, [fareRules]);

  // Fetch data on parameters change
  useEffect(() => {
    dispatch(
      fetchPricingFareRules({
        page: currentPage,
        limit: pageSize,
        search: searchQuery,
        is_hotspot: mainTab === "ALL" ? undefined : mainTab === "HOTSPOT" ? true : false,
        include_time_slots: true,
      }),
    );
  }, [dispatch, currentPage, pageSize, searchQuery, mainTab]);

  // Reset page when filters change
  useEffect(() => {
    dispatch(setPage(1));
  }, [mainTab, searchQuery, dispatch]);

  const handleEdit = (record: PricingFareRule) => {
    navigate(`/PricingAndFareRules/pricing/${record.id}`);
  };

  const handleView = (record: PricingFareRule) => {
    setPreviewRule(record);
    setIsPreviewOpen(true);
  };

  const handleReload = () => {
    dispatch(
      fetchPricingFareRules({
        page: currentPage,
        limit: pageSize,
        search: searchQuery,
        is_hotspot: mainTab === "ALL" ? undefined : mainTab === "HOTSPOT" ? true : false,
        include_time_slots: true,
      }),
    );
  };

  // Dynamically calculate average base price
  const avgPrice = React.useMemo(() => {
    if (fareRules.length === 0) return 0;
    const sum = fareRules.reduce((s, rule) => s + (parseFloat(rule.global_price as any) || 0), 0);
    return sum / fareRules.length;
  }, [fareRules]);

  // Column definitions
  const columns: ColumnsType<PricingFareRule> = [
    {
      title: "COUNTRY",
      dataIndex: "country_id",
      key: "country_name",
      width: 120,
      render: () => (
        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">
          India
        </span>
      ),
    },
    {
      title: "STATE",
      dataIndex: "state_id",
      key: "state_name",
      width: 130,
      render: (_, record) => (
        <span className="font-semibold text-slate-650 dark:text-slate-350 text-xs">
          {record.state_name}
        </span>
      ),
    },
    {
      title: "DISTRICT / CITY",
      dataIndex: "district_name",
      key: "district_name",
      width: 160,
      ellipsis: true,
      render: (_, record) => (
        <span className="font-extrabold text-slate-800 dark:text-slate-100 text-xs tracking-tight">
          {record.district_name || "All Districts"}
        </span>
      ),
    },
    {
      title: "AREA",
      dataIndex: "area_name",
      key: "area_name",
      width: 160,
      ellipsis: true,
      render: (text) => (
        <span className="font-bold text-slate-600 dark:text-slate-350 text-xs">
          {text || "All Areas"}
        </span>
      ),
    },
    {
      title: "HOTSPOT NAME",
      dataIndex: "hotspot_name",
      key: "hotspot_name",
      width: 160,
      ellipsis: true,
      render: (text) => (
        <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
          {text || "—"}
        </span>
      ),
    },
    {
      title: "HOTSPOT STATUS",
      dataIndex: "is_hotspot",
      key: "is_hotspot",
      width: 140,
      align: "center" as const,
      render: (value: boolean) => (
        <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider inline-block ${value
            ? "bg-blue-50 text-blue-750 dark:bg-blue-500/10 dark:text-blue-400"
            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-450"
          }`}>
          {value ? "Hotspot Zone" : "Standard Zone"}
        </span>
      ),
    },
    {
      title: "GLOBAL BASE PRICE",
      dataIndex: "global_price",
      key: "global_price",
      width: 150,
      align: "right" as const,
      render: (value: number | string) => (
        <span className="px-2 py-0.5 rounded font-black text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
          ₹{Number(value).toFixed(2)}
        </span>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 80,
      align: "center" as const,
      fixed: "right" as const,
      render: (_, record) => {
        const menuItems = [
          {
            key: "view",
            icon: <EyeOutlined className="text-slate-500" />,
            label: <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">View Preview</span>,
          },
          ...(canUpdatePricing
            ? [
              {
                key: "edit",
                icon: <EditOutlined className="text-slate-500" />,
                label: <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">Edit Rule</span>,
              },
            ]
            : []),
        ];

        return (
          <Dropdown
            menu={{
              items: menuItems,
              onClick: ({ key }) => {
                if (key === "view") {
                  handleView(record);
                } else if (key === "edit") {
                  handleEdit(record);
                }
              },
            }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              shape="circle"
              icon={<MoreOutlined />}
              className="hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
            />
          </Dropdown>
        );
      },
    },
  ];

  if (location.pathname !== "/PricingAndFareRules") {
    return <Outlet />;
  }

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900">
      <div className="w-full h-full flex flex-col md:flex-row bg-slate-50/50 dark:bg-slate-950/25 overflow-hidden">
        {/* ─── Left Sidebar Panel ─────────────────────────────────────── */}
        <div className="w-full md:w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/80 flex flex-col p-4 gap-4 overflow-y-auto custom-scrollbar">
          {/* Header Title / Context */}
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <SafetyCertificateOutlined className="text-base" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 tracking-tight text-xs uppercase leading-none">
                Pricing & Fare Rules
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Rate configurations
              </span>
            </div>
          </div>

          {/* Action Button: Create */}
          {canCreatePricing && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate("/PricingAndFareRules/pricing")}
              className="w-full h-9 rounded-lg font-bold text-xs uppercase tracking-wider border-none !bg-blue-600 hover:!bg-blue-700 text-white shadow-sm flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-all"
            >
              Create Pricing
            </Button>
          )}

          {/* Sidenav views section */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase px-2 mb-0.5">
              Views
            </span>

            {/* View: All Rules */}
            <div
              onClick={() => setMainTab("ALL")}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "ALL"
                  ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <SafetyCertificateOutlined className="text-xs" />
                <span>All Rules</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainTab === "ALL"
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}>
                {counts.all}
              </span>
            </div>

            {/* View: Hotspots */}
            <div
              onClick={() => setMainTab("HOTSPOT")}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "HOTSPOT"
                  ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <InfoCircleOutlined className="text-xs" />
                <span>Hotspots Only</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainTab === "HOTSPOT"
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}>
                {counts.hotspot}
              </span>
            </div>

            {/* View: Standard */}
            <div
              onClick={() => setMainTab("STANDARD")}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "STANDARD"
                  ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <CheckCircleOutlined className="text-xs" />
                <span>Standard Zones</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainTab === "STANDARD"
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}>
                {counts.standard}
              </span>
            </div>
          </div>

          <div className="h-[1px] bg-slate-100 dark:bg-slate-800/80" />

          {/* Filters section */}
          <div className="flex flex-col gap-3">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase px-2">
              Filters
            </span>

            {/* Filter: Date Range */}
            <div className="flex flex-col gap-1 px-2">
              <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Timeframe
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
            {/* Top Bar: Search Input & Results Count */}
            <div className="flex items-center justify-between gap-4 px-0 py-0.5 md:flex-nowrap flex-wrap border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3 flex-grow flex-shrink-0">
                <Input
                  placeholder="Search district, area, or hotspot..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                  prefix={<SearchOutlined className="text-slate-400 text-xs" />}
                  className="w-48 text-xs rounded-xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 h-9"
                />
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {total} results
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Button
                  icon={<ReloadOutlined className={isLoading ? "animate-spin" : ""} />}
                  onClick={handleReload}
                  className="rounded-full h-8 w-8 flex items-center justify-center border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-600 transition-all bg-white dark:bg-slate-900"
                />
                <span className="text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider">
                  {mainTab === "ALL" ? "All" : mainTab} Pricing Rules
                </span>
              </div>
            </div>

            {/* Status Cards Grid Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-0">
              {/* Card 1: Total Rules */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 flex flex-col relative overflow-hidden shadow-sm transition-all rounded-none min-h-[100px]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm flex-shrink-0">
                    <SafetyCertificateOutlined />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450 tracking-wide uppercase leading-none">
                    Total Rules
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-auto">
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">
                    {counts.all}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    pricing rules
                  </span>
                </div>
                <div className="absolute bottom-0 right-0 pointer-events-none">
                  <Sparkline color="blue" />
                </div>
              </div>

              {/* Card 2: Hotspot Rules */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 flex flex-col relative overflow-hidden shadow-sm transition-all rounded-none min-h-[100px]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center text-sm flex-shrink-0">
                    <InfoCircleOutlined />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450 tracking-wide uppercase leading-none">
                    Hotspot Rules
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-auto">
                  <span className="text-2xl font-extrabold text-amber-550 dark:text-amber-400 leading-none">
                    {counts.hotspot}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    active hotspots
                  </span>
                </div>
                <div className="absolute bottom-0 right-0 pointer-events-none">
                  <Sparkline color="orange" />
                </div>
              </div>

              {/* Card 3: Standard Rules */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 flex flex-col relative overflow-hidden shadow-sm transition-all rounded-none min-h-[100px]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm flex-shrink-0">
                    <CheckCircleOutlined />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450 tracking-wide uppercase leading-none">
                    Standard Zones
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-auto">
                  <span className="text-2xl font-extrabold text-emerald-650 dark:text-emerald-400 leading-none">
                    {counts.standard}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    standard zones
                  </span>
                </div>
                <div className="absolute bottom-0 right-0 pointer-events-none">
                  <Sparkline color="green" />
                </div>
              </div>

              {/* Card 4: Avg Base Price */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 flex flex-col relative overflow-hidden shadow-sm transition-all rounded-none min-h-[100px]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center text-sm flex-shrink-0">
                    <SafetyCertificateOutlined />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450 tracking-wide uppercase leading-none">
                    Avg Base Price
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mt-auto">
                  <span className="text-2xl font-extrabold text-rose-650 dark:text-rose-400 leading-none">
                    ₹{avgPrice.toFixed(1)}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    active rules avg
                  </span>
                </div>
                <div className="absolute bottom-0 right-0 pointer-events-none">
                  <Sparkline color="red" />
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="flex-grow min-h-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <Table
                columns={columns}
                dataSource={fareRules}
                loading={{
                  spinning: isLoading,
                  indicator: <LoadingOutlined style={{ fontSize: 48 }} spin />,
                  tip: "Loading pricing rules...",
                }}
                rowKey="id"
                pagination={false}
                scroll={{ x: 1200 }}
                size="small"
                className="premium-table-compact"
              />
            </div>
          </div>

          {/* Sticky Bottom Pagination Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-805 px-6 flex items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Showing {total > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, total)} of {total} rules
            </span>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={total}
              onChange={(page, size) => {
                dispatch(setPage(page));
                dispatch(setPageSize(size));
              }}
              showSizeChanger
              pageSizeOptions={["10", "20", "50", "100"]}
              size="small"
            />
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        title="Pricing Rule Preview"
        open={isPreviewOpen}
        onCancel={() => setIsPreviewOpen(false)}
        footer={null}
        width={800}
        rootClassName="compact-modal"
      >
        {previewRule && (
          <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
            <PricingPreview
              country={previewRule.country_name || ""}
              state={previewRule.state_name || ""}
              district={previewRule.district_name || ""}
              area={previewRule.area_name || ""}
              pincode={previewRule.pincode || ""}
              globalPrice={Number(previewRule.global_price)}
              hotspotEnabled={previewRule.is_hotspot}
              hotspotId={previewRule.hotspot_name || ""}
              multiplier={Number(previewRule.multiplier || 1)}
              timeSlots={transformSlotsForPreview(previewRule)}
              extraKmStep={Number(previewRule.extra_km_step) || 5}
              extraKmPrice={Number(previewRule.extra_km_price) || 10}
              extraKmStartMultiplier={Number(previewRule.extra_km_start_multiplier) || 1}
              extraKmCheckpoints={(previewRule.extra_km_checkpoints ?? [])
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                .map((c: any, i: number) => ({ uid: i, multiplier: Number(c.multiplier) }))}
            />
          </div>
        )}
      </Modal>

      <style>{`
        /* Enforce sharp zero-radius layout rules */
        .ant-card,
        .ant-progress-inner,
        .ant-progress-bg,
        .ant-tag,
        .compact-modal .ant-modal-content {
          border-radius: 0px !important;
        }

        /* Sidebar input styling overrides */
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

        /* Custom scrollbar styling */
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
      `}</style>
    </div>
  );
};

export default PricingAndFareRules;
