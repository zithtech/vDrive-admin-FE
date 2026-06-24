import React, { useEffect, useState, useMemo } from "react";
import { Button, Table, Space, Card, Tag, Modal, Pagination, Tooltip, Dropdown } from "antd";
import { DownloadOutlined, EyeOutlined, EditOutlined, LoadingOutlined, EllipsisOutlined } from "@ant-design/icons";
import { Search, IndianRupee, MapPin, Filter, Layers, Navigation } from "lucide-react";
import { IoAdd } from "react-icons/io5";
import TitleBar from "../components/TitleBarCommon/TitleBar";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchPricingFareRules, setPage, setPageSize } from "../store/slices/pricingFareRulesSlice";
import type { PricingFareRule } from "../store/slices/pricingFareRulesSlice";
import type { ColumnsType } from "antd/es/table";
import PricingPreview from "../components/DriverPricing/PricingPreview";
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
          perKmRate: Number(slot.per_km_rate),
          perHourRate: Number(slot.per_hour_rate),
        });
      }
    });
  }
  return transformed;
};

const PricingAndFareRules: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [previewRule, setPreviewRule] = useState<PricingFareRule | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const canCreatePricing = useHasPermission("pricing", "create");
  const canUpdatePricing = useHasPermission("pricing", "update");

  // Redux state
  const { fareRules, isLoading, total, currentPage, pageSize } = useAppSelector(
    (state) => state.pricingFareRules,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [viewFilter, setViewFilter] = useState("all");

  const filteredRules = useMemo(() => {
    let filtered = fareRules || [];
    if (viewFilter === "hotspot") filtered = filtered.filter((r) => r.is_hotspot);
    if (viewFilter === "standard") filtered = filtered.filter((r) => !r.is_hotspot);

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.district_name?.toLowerCase().includes(lowerSearch) ||
          r.area_name?.toLowerCase().includes(lowerSearch) ||
          r.state_name?.toLowerCase().includes(lowerSearch)
      );
    }
    return filtered;
  }, [fareRules, viewFilter, searchTerm]);

  // Fetch data on mount
  useEffect(() => {
    dispatch(
      fetchPricingFareRules({
        page: currentPage,
        limit: pageSize,
        include_time_slots: true,
      }),
    );

    return () => {
      // dispatch(clearFareRules());
    };
  }, [dispatch, currentPage, pageSize]);

  // Handle pagination change
  const handleTableChange = (pagination: any) => {
    if (pagination.current !== currentPage) {
      dispatch(setPage(pagination.current));
    }
    if (pagination.pageSize !== pageSize) {
      dispatch(setPageSize(pagination.pageSize));
    }
  };

  const handleEdit = (record: PricingFareRule) => {
    navigate(`/PricingAndFareRules/pricing/${record.id}`);
  };

  const handleView = (record: PricingFareRule) => {
    setPreviewRule(record);
    setIsPreviewOpen(true);
  };

  // Column definitions
  const columns: ColumnsType<PricingFareRule> = [
    {
      title: "Country",
      dataIndex: "country_id", // Should probably resolve name
      key: "country_name",
      width: 120,
      render: () => <span className="font-bold text-slate-700 dark:text-slate-200">India</span>, // Placeholder
    },
    {
      title: "State",
      dataIndex: "state_id", // Should probably resolve name
      key: "state_name",
      width: 120,
      render: (_, record) => <span className="font-semibold text-slate-600 dark:text-slate-300">{record.state_name}</span>, // Placeholder
    },
    {
      title: "District", // Updated label based on schema confusion
      dataIndex: "district_name", // Displaying City Name for "District" column
      key: "district_name",
      width: 150,
      ellipsis: true,
      render: (_, record) => <span className="font-semibold text-slate-600 dark:text-slate-300">{record.district_name || "All"}</span>,
    },
    {
      title: "Area",
      dataIndex: "area_name", // Displaying Area Name
      key: "area_name",
      width: 150,
      ellipsis: true,
      render: (text) => text || "All",
    },
    {
      title: "Hotspot Name",
      dataIndex: "hotspot_name",
      key: "hotspot_name",
      width: 150,
      ellipsis: true,
      render: (text) => text || "-",
    },
    {
      title: "Is Hotspot",
      dataIndex: "is_hotspot",
      key: "is_hotspot",
      width: 120,
      align: "center",
      render: (value: boolean) => (
        <Tag color={value ? "blue" : "default"}>{value ? "Yes" : "No"}</Tag>
      ),
    },
    {
      title: "Price / KM",
      dataIndex: "per_km_price",
      key: "per_km_price",
      width: 110,
      align: "right",
      render: (value: number | string) => `₹${Number(value).toFixed(2)}/km`,
    },
    {
      title: "Price / Hr",
      dataIndex: "per_hour_price",
      key: "per_hour_price",
      width: 110,
      align: "right",
      render: (value: number | string) => `₹${Number(value || 0).toFixed(2)}/hr`,
    },
    {
      title: "Min Fare",
      dataIndex: "minimum_fare",
      key: "minimum_fare",
      width: 100,
      align: "right",
      render: (value: number | string) => `₹${Number(value || 0).toFixed(2)}`,
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      fixed: "right",
      render: (_, record) => {
        const menuItems = [
          {
            key: "view",
            icon: <EyeOutlined className="pricing-menu-icon" />,
            label: <span className="pricing-menu-label">View Details</span>,
            onClick: () => handleView(record)
          },
          ...(canUpdatePricing
            ? [
              {
                key: "edit",
                icon: <EditOutlined />,
                label: <span className="pricing-menu-label-bold">Edit Rule</span>,
                onClick: () => handleEdit(record)
              },
            ]
            : []),
        ];
        return (
          <Space className="pricing-action">
            <Tooltip title="View Details">
              <Button
                type="text"
                className="pricing-action-view"
                icon={<EyeOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleView(record);
                }}
              />
            </Tooltip>
            <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
              <Button
                type="text"
                className="pricing-action-ellipsis"
                icon={<EllipsisOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  if (location.pathname !== "/PricingAndFareRules") {
    return <Outlet />;
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#f8f9fa] dark:bg-[#0b0f19] overflow-hidden">
      <style>
        {`
                    .premium-table-flat .ant-table-thead > tr > th {
                        background: #f8fafc !important;
                        color: #64748b !important;
                        font-weight: 700 !important;
                        text-transform: uppercase !important;
                        font-size: 12px !important;
                        letter-spacing: 0.05em !important;
                        border-bottom: 2px solid #f1f5f9 !important;
                        padding: 10px 12px !important;
                    }
                    .premium-table-flat .ant-table-thead > tr > th::before {
                        display: none !important;
                    }
                    .premium-table-flat .ant-table-tbody > tr:not(.ant-table-measure-row) > td {
                        padding: 4px 12px !important;
                        border-bottom: 1px solid #f8fafc !important;
                    }
                    .dark .premium-table-flat .ant-table-thead > tr > th {
                        background: #1e293b !important;
                        color: #94a3b8 !important;
                        border-bottom: 2px solid #334155 !important;
                    }
                    .dark .premium-table-flat .ant-table-tbody > tr:not(.ant-table-measure-row) > td {
                        border-bottom: 1px solid #1e293b !important;
                        color: #f1f5f9 !important;
                        background: #0f172a !important;
                    }
                    .dark .premium-table-flat .ant-table-row:hover > td {
                        background: #1e293b !important;
                    }
                    .premium-table-flat .ant-table-row {
                        cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    .premium-table-flat.ant-table-wrapper,
                    .premium-table-flat .ant-spin-nested-loading,
                    .premium-table-flat .ant-spin-container,
                    .premium-table-flat .ant-table,
                    .premium-table-flat .ant-table-container {
                        display: flex;
                        flex-direction: column;
                        flex-grow: 1;
                        min-height: 0;
                        min-width: 0;
                    }
                    .premium-table-flat .ant-table {
                        background: transparent !important;
                    }
                    .premium-table-flat .ant-table-body,
                    .premium-table-flat .ant-table-content {
                        flex-grow: 1;
                        min-height: 0;
                        min-width: 0;
                        overflow: auto !important;
                    }
                    .premium-table-flat .ant-pagination {
                        display: none !important;
                    }
                    .pricing-row-even { background-color: rgba(248, 250, 252, 0.5); transition: background-color 0.15s; }
                    .dark .pricing-row-even { background-color: #0f172a; }
                    .pricing-row-even:hover { background-color: rgba(238, 242, 255, 0.3) !important; }
                    .dark .pricing-row-even:hover { background-color: #1e293b !important; }
                    .pricing-row-odd { background-color: white; transition: background-color 0.15s; }
                    .dark .pricing-row-odd { background-color: #0f172a; }
                    .pricing-row-odd:hover { background-color: rgba(238, 242, 255, 0.3) !important; }
                    .dark .pricing-row-odd:hover { background-color: #1e293b !important; }
                    .pricing-table-container { flex-grow: 1; background-color: white; border-radius: 6px; border: 1px solid #f1f5f9; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); overflow: hidden; display: flex; flex-direction: column; min-height: 0; padding-bottom: 0.5rem; }
                                        .pricing-table-container { flex-grow: 1; background-color: white; border-radius: 6px; border: 1px solid #f1f5f9; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); overflow: hidden; display: flex; flex-direction: column; min-height: 0; padding-bottom: 0.5rem; }
                    .dark .pricing-table-container { background-color: #0f172a; border-color: #334155; }
                    .pricing-action-view { color: #2563eb; transition: background-color 0.15s, color 0.15s; }
                    .dark .pricing-action-view { color: #60a5fa; }
                    .pricing-action-view:hover { background-color: #eff6ff; }
                    .dark .pricing-action-view:hover { background-color: rgba(30, 58, 138, 0.5); }
                    .pricing-action-ellipsis { color: #9ca3af; font-size: 18px; }
                    .dark .pricing-action-ellipsis { color: #64748b; }
                    .pricing-action-ellipsis:hover { color: #4b5563; }
                    .dark .pricing-action-ellipsis:hover { color: #f1f5f9; }
                    .pricing-menu-icon { color: #9ca3af; }
                    .pricing-menu-label { font-weight: 700; color: #374151; }
                    .pricing-menu-label-bold { font-weight: 700; color: #1e293b; }
                    .dark .pricing-menu-label-bold { color: #f1f5f9; }
        `}
      </style>

      {/* Top Navbar */}
      <div className="bg-white dark:bg-slate-800 h-12 px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 z-0 flex-shrink-0">
        <div className="flex items-center gap-4 flex-shrink-0">
          <h1 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 m-0 leading-none">Pricing Rules</h1>
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div>
          <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 m-0 hidden lg:block">Fare Management</p>
        </div>

        <div className="relative flex-1 max-w-xl mx-auto flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all h-9">
          <Search className="absolute left-3 text-slate-400 text-[16px]" />
          <input
            type="text"
            placeholder="Search rules by district or area..."
            className="w-full pl-10 pr-4 py-1.5 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400 border-none shadow-none focus:ring-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {total} rules
          </span>

          <Space>
            <Button size="middle" icon={<DownloadOutlined />} onClick={() => { }}>
              CSV
            </Button>
            <Button size="middle" icon={<DownloadOutlined />} onClick={() => { }}>
              Excel
            </Button>
            {canCreatePricing && (
              <button
                onClick={() => navigate("/PricingAndFareRules/pricing")}
                className="h-8 rounded-lg font-bold text-xs uppercase tracking-wider border-none bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center px-4 gap-1.5 hover:scale-[1.01] transition-all"
              >
                <IoAdd size={16} /> Add Pricing
              </button>
            )}
          </Space>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-[220px] flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
            {/* Sidenav views section */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase px-2 mb-0.5">
                Views
              </span>

              <div
                onClick={() => setViewFilter("all")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${viewFilter === "all"
                  ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <Layers size={14} />
                  <span>All Rules</span>
                </div>
              </div>

              <div
                onClick={() => setViewFilter("hotspot")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${viewFilter === "hotspot"
                  ? "bg-amber-50/80 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <MapPin size={14} className="text-rose-500" />
                  <span>Hotspots</span>
                </div>
              </div>

              <div
                onClick={() => setViewFilter("standard")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${viewFilter === "standard"
                  ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <IndianRupee size={14} className="text-emerald-500" />
                  <span>Standard</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ─── Right Content Area ─────────────────────────────────────── */}
        <div className="flex-grow flex flex-col min-w-0 relative h-full">
          <div className="flex-grow flex flex-col p-6 overflow-y-auto custom-scrollbar gap-5 pb-20">
            {/* HORIZONTAL FILTERS BAR */}
            <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4 shadow-sm rounded-none">
              <div className="flex items-center gap-2 px-3 border-r border-slate-200 dark:border-slate-700 text-slate-400 shrink-0">
                <Filter size={16} className="text-indigo-500" />
                <span className="text-[11px] font-black uppercase tracking-widest">FILTERS</span>
              </div>

              <div className="flex-1 flex flex-wrap items-center gap-4">
                <span className="text-[11px] text-slate-500 font-medium">Use the search bar above to filter results.</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-slate-800 rounded-lg">
              <div className="pricing-table-container border-t-0 rounded-t-none">
                <Table
                  columns={columns}
                  dataSource={filteredRules}
                  loading={{
                    spinning: isLoading,
                    indicator: <LoadingOutlined style={{ fontSize: 48 }} spin />,
                    tip: "Loading pricing rules...",
                  }}
                  rowKey="id"
                  pagination={{ position: ["none"] }}
                  scroll={{ x: 1200, y: "calc(100vh - 480px)" }}
                  size="small"
                  className="premium-table-flat"
                  rowClassName={(_, index) =>
                    (index || 0) % 2 === 0
                      ? "pricing-row-even"
                      : "pricing-row-odd"
                  }
                />
              </div>
            </div>

            {/* Sticky Pagination Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 flex-shrink-0 -mx-6 -mb-6 mt-auto">
              <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                Showing <span className="font-bold text-slate-800 dark:text-slate-200">{total === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, total)}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{total}</span> items
              </div>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={total}
                onChange={(page, size) => {
                  handleTableChange({ current: page, pageSize: size });
                }}
                showSizeChanger
                pageSizeOptions={["10", "20", "50", "100"]}
                size="small"
              />
            </div>
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
      >
        {previewRule && (
          <div className="max-h-[70vh] overflow-y-auto">
            {/* Reuse existing Preview Component */}
            <PricingPreview
              country={previewRule.country_name || ""}
              state={previewRule.state_name || ""}
              district={previewRule.district_name || ""}
              area={previewRule.area_name || ""}
              pincode={previewRule.pincode || ""}
              perKmPrice={Number(previewRule.per_km_price)}
              perHourPrice={Number(previewRule.per_hour_price) || 0}
              minimumFare={Number(previewRule.minimum_fare) || 0}
              oneWayReturnPct={Number(previewRule.one_way_return_pct) || 0}
              hotspotEnabled={previewRule.is_hotspot}
              hotspotId={previewRule.hotspot_name || ""}
              multiplier={Number(previewRule.multiplier || 1)}
              timeSlots={transformSlotsForPreview(previewRule)}
              extraKmCheckpoints={(previewRule.extra_km_checkpoints ?? [])
                .slice()
                .sort((a: any, b: any) => a.from_km - b.from_km)
                .map((c: any, i: number) => ({
                  uid: i,
                  from_km: Number(c.from_km),
                  price: Number(c.price),
                }))}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PricingAndFareRules;
