import React, { useState, useEffect } from "react";
import { Card, Row, Col, Typography, Spin, Progress, Space, DatePicker, Input, Button } from "antd";
import {
  CustomerServiceOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  AlertOutlined,
  ThunderboltOutlined,
  PieChartOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axiosIns from "../api/axios";

const { Text } = Typography;

// Dynamic Sparkline helper
const Sparkline: React.FC<{ color: string }> = ({ color }) => {
  let strokeColor = "#3b82f6";
  let gradientId = "blue-grad-analytics";
  let stopColor = "#3b82f6";

  if (color === "green") {
    strokeColor = "#10b981";
    gradientId = "green-grad-analytics";
    stopColor = "#10b981";
  } else if (color === "orange") {
    strokeColor = "#f59e0b";
    gradientId = "orange-grad-analytics";
    stopColor = "#f59e0b";
  } else if (color === "red") {
    strokeColor = "#ef4444";
    gradientId = "red-grad-analytics";
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

const CATEGORY_META: Record<string, { label: string; color: string; icon: string }> = {
  payment: { label: "Payment", color: "#faad14", icon: "💰" },
  documents: { label: "Documents", color: "#13c2c2", icon: "📄" },
  app_crash: { label: "App Issue", color: "#f5222d", icon: "🐛" },
  account: { label: "Account", color: "#722ed1", icon: "👤" },
  subscription: { label: "Subscription", color: "#2f54eb", icon: "📦" },
  rides: { label: "Rides", color: "#52c41a", icon: "🚗" },
  general: { label: "General", color: "#8c8c8c", icon: "❓" },
};

const SupportAnalytics: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mainTab, setMainTab] = useState<"ALL" | "OPEN" | "RESOLVED">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await axiosIns.get("/api/support-management/tickets/stats");
      setStats(data.data);
    } catch (error) {
      console.error("Failed to fetch support stats", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <Text>Failed to load analytics.</Text>
      </div>
    );
  }

  const { overall, today, categories, avg_response_minutes } = stats;
  const totalCategories = categories.reduce((sum: number, c: any) => sum + parseInt(c.count), 0);

  // Filter categories based on search query
  const filteredCategories = categories.filter((cat: any) => {
    const meta = CATEGORY_META[cat.category] || CATEGORY_META.general;
    return meta.label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate stats based on selected view
  const currentTotal =
    mainTab === "ALL"
      ? overall?.total || 0
      : mainTab === "OPEN"
        ? overall?.open_count || 0
        : parseInt(overall?.resolved_count || 0) + parseInt(overall?.closed_count || 0);

  const currentOpen =
    mainTab === "ALL"
      ? overall?.open_count || 0
      : mainTab === "OPEN"
        ? overall?.open_count || 0
        : 0;

  const currentResolved =
    mainTab === "ALL"
      ? parseInt(overall?.resolved_count || 0) + parseInt(overall?.closed_count || 0)
      : mainTab === "OPEN"
        ? 0
        : parseInt(overall?.resolved_count || 0) + parseInt(overall?.closed_count || 0);

  // Today stats based on selected view
  const todayTotal =
    mainTab === "ALL"
      ? today?.today_total || 0
      : mainTab === "OPEN"
        ? today?.today_open || 0
        : today?.today_resolved || 0;

  const todayOpen =
    mainTab === "ALL"
      ? today?.today_open || 0
      : mainTab === "OPEN"
        ? today?.today_open || 0
        : 0;

  const todayResolved =
    mainTab === "ALL"
      ? today?.today_resolved || 0
      : mainTab === "OPEN"
        ? 0
        : today?.today_resolved || 0;

  const resolutionRate =
    mainTab === "ALL"
      ? today?.today_total > 0
        ? Math.round((parseInt(today.today_resolved || 0) / parseInt(today.today_total)) * 100)
        : 0
      : mainTab === "OPEN"
        ? 0
        : 100;

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900">
      <div className="w-full h-full flex flex-col md:flex-row bg-slate-50/50 dark:bg-slate-950/25 overflow-hidden">
        {/* ─── Left Sidebar Panel ─────────────────────────────────────── */}
        <div className="w-full md:w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/80 flex flex-col p-4 gap-4 overflow-y-auto custom-scrollbar">
          {/* Header Title / Context */}
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <PieChartOutlined className="text-base" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-800 dark:text-slate-200 tracking-tight text-xs uppercase leading-none">
                Support Analytics
              </span>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Real-time overview
              </span>
            </div>
          </div>

          {/* Sidenav views section */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase px-2 mb-0.5">
              Views
            </span>

            {/* View: All Issues */}
            <div
              onClick={() => setMainTab("ALL")}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "ALL"
                ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <PieChartOutlined className="text-xs" />
                <span>All Issues</span>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainTab === "ALL"
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
              >
                {overall?.total || 0}
              </span>
            </div>

            {/* View: Open Tickets */}
            <div
              onClick={() => setMainTab("OPEN")}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "OPEN"
                ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <AlertOutlined className="text-xs" />
                <span>Open Tickets</span>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainTab === "OPEN"
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
              >
                {overall?.open_count || 0}
              </span>
            </div>

            {/* View: Resolved */}
            <div
              onClick={() => setMainTab("RESOLVED")}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "RESOLVED"
                ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <CheckCircleOutlined className="text-xs" />
                <span>Resolved</span>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainTab === "RESOLVED"
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
              >
                {parseInt(overall?.resolved_count || 0) + parseInt(overall?.closed_count || 0)}
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
                  placeholder="Search issue category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                  prefix={<SearchOutlined className="text-slate-400 text-xs" />}
                  className="w-48 text-xs rounded-xl border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 h-9"
                />
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {filteredCategories.length} categories
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <Button
                  icon={<ReloadOutlined className={loading ? "animate-spin" : ""} />}
                  onClick={fetchStats}
                  className="rounded-full h-8 w-8 flex items-center justify-center border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-600 transition-all bg-white dark:bg-slate-900"
                />
                <span className="text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider">
                  {mainTab === "ALL" ? "All Issues" : mainTab === "OPEN" ? "Open Tickets" : "Resolved"}
                </span>
              </div>
            </div>

            {/* Row 1: Key Metrics */}
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 flex flex-col relative overflow-hidden shadow-sm transition-all rounded-none min-h-[100px]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs flex-shrink-0">
                      <CustomerServiceOutlined />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450 tracking-wide uppercase leading-none">
                      Total Tickets
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-auto">
                    <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">
                      {currentTotal}
                    </span>
                    <span className="text-[9px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider">
                      tickets
                    </span>
                  </div>
                  <div className="absolute bottom-0 right-0 pointer-events-none">
                    <Sparkline color="blue" />
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 flex flex-col relative overflow-hidden shadow-sm transition-all rounded-none min-h-[100px]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center text-xs flex-shrink-0">
                      <AlertOutlined />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-505 dark:text-slate-450 tracking-wide uppercase leading-none">
                      Open Now
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-auto">
                    <span className="text-2xl font-extrabold text-amber-500 dark:text-amber-400 leading-none">
                      {currentOpen}
                    </span>
                    <span className="text-[9px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider">
                      active
                    </span>
                  </div>
                  <div className="absolute bottom-0 right-0 pointer-events-none">
                    <Sparkline color="orange" />
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 flex flex-col relative overflow-hidden shadow-sm transition-all rounded-none min-h-[100px]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs flex-shrink-0">
                      <CheckCircleOutlined />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-505 dark:text-slate-450 tracking-wide uppercase leading-none">
                      Resolved
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-auto">
                    <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">
                      {currentResolved}
                    </span>
                    <span className="text-[9px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider">
                      closed
                    </span>
                  </div>
                  <div className="absolute bottom-0 right-0 pointer-events-none">
                    <Sparkline color="green" />
                  </div>
                </div>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-4 flex flex-col relative overflow-hidden shadow-sm transition-all rounded-none min-h-[100px]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 flex items-center justify-center text-xs flex-shrink-0">
                      <ThunderboltOutlined />
                    </div>
                    <span className="text-[10px] font-extrabold text-slate-550 dark:text-slate-450 tracking-wide uppercase leading-none">
                      Avg Response
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-auto">
                    <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 leading-none">
                      {avg_response_minutes ? `${avg_response_minutes}m` : "N/A"}
                    </span>
                    <span className="text-[9px] text-slate-405 dark:text-slate-500 font-bold uppercase tracking-wider">
                      response time
                    </span>
                  </div>
                  <div className="absolute bottom-0 right-0 pointer-events-none">
                    <Sparkline color="red" />
                  </div>
                </div>
              </Col>
            </Row>

            {/* Row 2: Today + Category Breakdown */}
            <Row gutter={[16, 16]}>
              {/* Today's Summary Card */}
              <Col xs={24} lg={8}>
                <Card
                  className="border border-slate-100 dark:border-slate-850 shadow-sm h-full !bg-white dark:!bg-slate-900 rounded-none"
                  title={
                    <div className="flex items-center gap-2">
                      <ClockCircleOutlined className="text-blue-600 dark:text-blue-400 text-xs" />
                      <span className="font-extrabold text-xs uppercase tracking-tight dark:text-slate-100">Today's Summary</span>
                    </div>
                  }
                  styles={{ body: { padding: "16px" } }}
                >
                  <Space direction="vertical" className="w-full" size="middle">
                    <div className="flex justify-between items-center">
                      <Text className="text-slate-500 dark:text-slate-400 font-bold text-xs">
                        New Tickets
                      </Text>
                      <span className="inline-flex px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-none">
                        {todayTotal}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text className="text-slate-550 dark:text-slate-400 font-bold text-xs">
                        Active
                      </Text>
                      <span className="inline-flex px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 rounded-none">
                        {todayOpen}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text className="text-slate-555 dark:text-slate-400 font-bold text-xs">
                        Resolved
                      </Text>
                      <span className="inline-flex px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-none">
                        {todayResolved}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                      <Text className="text-[10px] uppercase font-bold text-slate-400 block mb-2 dark:text-slate-500">
                        Resolution Rate
                      </Text>
                      <Progress
                        percent={resolutionRate}
                        strokeColor={{ from: "#3b82f6", to: "#10b981" }}
                        className="!mb-0"
                      />
                    </div>
                  </Space>
                </Card>
              </Col>

              {/* Category Breakdown Card */}
              <Col xs={24} lg={16}>
                <Card
                  className="border border-slate-100 dark:border-slate-850 shadow-sm h-full !bg-white dark:!bg-slate-900 rounded-none"
                  title={
                    <div className="flex items-center gap-2">
                      <PieChartOutlined className="text-blue-600 dark:text-blue-400 text-xs" />
                      <span className="font-extrabold text-xs uppercase tracking-tight dark:text-slate-100">Issue Categories</span>
                    </div>
                  }
                  styles={{ body: { padding: "16px" } }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredCategories.map((cat: any) => {
                      const meta = CATEGORY_META[cat.category] || CATEGORY_META.general;
                      const percent =
                        totalCategories > 0
                          ? Math.round((parseInt(cat.count) / totalCategories) * 100)
                          : 0;
                      return (
                        <div
                          key={cat.category}
                          className="flex items-center gap-3 p-3 rounded-none bg-slate-50/70 dark:bg-slate-850/50 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 transition-colors"
                        >
                          <div className="text-2xl">{meta.icon}</div>
                          <div className="flex-grow">
                            <div className="flex justify-between items-center mb-1">
                              <Text className="font-extrabold text-xs dark:text-slate-205">
                                {meta.label}
                              </Text>
                              <Text className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                                {cat.count} tickets
                              </Text>
                            </div>
                            <Progress
                              percent={percent}
                              showInfo={false}
                              strokeColor={meta.color}
                              size="small"
                              className="!mb-0"
                            />
                          </div>
                          <Text className="text-[10px] font-black text-slate-550 dark:text-slate-400 min-w-[30px] text-right">
                            {percent}%
                          </Text>
                        </div>
                      );
                    })}
                    {filteredCategories.length === 0 && (
                      <div className="col-span-2 text-center text-slate-400 py-8">
                        No categories found matching "{searchQuery}".
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </div>

      <style>{`
        /* Enforce sharp zero-radius layout rules */
        .ant-card,
        .ant-progress-inner,
        .ant-progress-bg,
        .ant-tag {
          border-radius: 0px !important;
        }
        .dark .ant-card-head {
          border-bottom-color: #1e293b !important;
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
      `}</style>
    </div>
  );
};

export default SupportAnalytics;
