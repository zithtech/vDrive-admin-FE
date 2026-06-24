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
    <div className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-slate-900">
      {/* Top Navbar */}
      <div className="bg-white dark:bg-slate-800 h-12 px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 z-0 flex-shrink-0 w-full">
        {/* Title & Description */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <PieChartOutlined className="text-base" />
              </div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 !m-0 !mb-1 leading-none">Support Analytics</h1>
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0">Real-time overview</p>
        </div>

        <div className="relative flex-1 max-w-xl mx-auto flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all h-9">
          <SearchOutlined className="absolute left-3 text-slate-400 text-[16px]" />
          <input
            type="text"
            placeholder="Search issue category..."
            className="w-full pl-10 pr-4 py-1.5 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-3">
            <span className="text-[11px] font-bold text-slate-400 border border-slate-200 dark:border-slate-600 rounded-[4px] px-1.5 py-[1px] bg-slate-50/50 dark:bg-slate-800 tracking-wide">
              ⌘K
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[11px] font-black tracking-widest uppercase">
              {filteredCategories.length} CATEGORIES
            </span>
          </div>

          <button
            onClick={() => fetchStats()}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all shrink-0"
          >
            <ReloadOutlined className={`text-lg ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden bg-slate-50/50 dark:bg-slate-950/25">
        {/* ─── Left Sidebar Panel ─────────────────────────────────────── */}
        <div className="w-[220px] flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col overflow-y-auto custom-scrollbar">
          {/* Sidenav views section */}
          <div className="flex flex-col gap-1 pt-6 px-4">
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


        </div>

        {/* ─── Right Content Area ─────────────────────────────────────── */}
        <div className="flex-grow flex flex-col min-w-0 relative h-full">
          <div className="flex-grow flex flex-col p-6 overflow-y-auto custom-scrollbar gap-5 pb-20">


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
                  <div className="absolute -bottom-6 -right-6 text-[100px] opacity-[0.06] pointer-events-none text-blue-600 dark:text-blue-400">
                    <CustomerServiceOutlined />
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
                  <div className="absolute -bottom-6 -right-6 text-[100px] opacity-[0.06] pointer-events-none text-amber-500 dark:text-amber-400">
                    <AlertOutlined />
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
                  <div className="absolute -bottom-6 -right-6 text-[100px] opacity-[0.06] pointer-events-none text-emerald-600 dark:text-emerald-400">
                    <CheckCircleOutlined />
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
                  <div className="absolute -bottom-6 -right-6 text-[100px] opacity-[0.06] pointer-events-none text-rose-600 dark:text-rose-400">
                    <ThunderboltOutlined />
                  </div>
                </div>
              </Col>
            </Row>

            {/* Filters Toolbar */}
            <div className="flex items-center gap-4 py-3 border-y border-slate-100 dark:border-slate-800/80 mb-2 mt-2 bg-slate-50/50 dark:bg-slate-900/50 px-4 rounded-none">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Timeframe:
                </span>
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  className="w-64 text-xs premium-range-picker-sidebar"
                  placeholder={["Start Date", "End Date"]}
                />
              </div>
            </div>

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
