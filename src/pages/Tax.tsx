import React, { useEffect, useState } from "react";
import { Button, notification, Drawer, Typography, Select, DatePicker, Pagination } from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import TaxFormDrawer from "../components/Tax/TaxFormDrawer";
import TaxTable from "../components/TaxTable/TaxTable";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useHasPermission } from "../hooks/usePermission";
import {
  fetchTaxes,
  addTax,
  updateTax,
  updateTaxStatus,
  deleteTax,
} from "../store/slices/taxSlice";
import type { Tax, TaxPayload } from "../store/slices/taxSlice";
import dayjs from "dayjs";

const { Title, Text } = Typography;


const TaxPage: React.FC = () => {
  const canCreateTax = useHasPermission("taxes", "create");
  const canUpdateTax = useHasPermission("taxes", "update");
  const canDeleteTax = useHasPermission("taxes", "delete");

  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const [viewingTax, setViewingTax] = useState<Tax | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const dispatch = useAppDispatch();
  const { taxes, isLoading, error } = useAppSelector((state) => state.tax);
  const { role } = useAppSelector((state) => state.auth);
  const isSuperAdmin = role === "super_admin";

  const hasCreateAccess = isSuperAdmin || canCreateTax;
  const hasUpdateAccess = isSuperAdmin || canUpdateTax;
  const hasDeleteAccess = isSuperAdmin || canDeleteTax;

  // Sidebar Layout States
  const [mainTab, setMainTab] = useState<"ALL" | "CENTRAL" | "STATE" | "COMPOSITE" | "UNION_TERRITORY">("ALL");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateRange, setDateRange] = useState<any>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [mainTab, statusFilter, searchQuery, dateRange]);

  useEffect(() => {
    dispatch(fetchTaxes());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      notification.error({ message: "Error", description: error });
    }
  }, [error]);

  const handleAddClick = () => {
    setEditingTax(null);
    setDrawerVisible(true);
  };

  const handleEdit = (tax: Tax) => {
    setEditingTax(tax);
    setDrawerVisible(true);
  };

  const handleView = (tax: Tax) => setViewingTax(tax);

  const handleDelete = (id: string) => {
    dispatch(deleteTax(id)).then((res: any) => {
      if (!res.hasOwnProperty("error")) {
        notification.success({ message: "Tax deleted successfully" });
      }
    });
  };

  const handleToggleStatus = (id: string, is_active: boolean) => {
    dispatch(updateTaxStatus({ id, is_active }));
  };

  const onFinish = (values: TaxPayload) => {
    if (editingTax) {
      dispatch(updateTax({ id: editingTax.id, taxData: values })).then((res: any) => {
        if (!res.hasOwnProperty("error")) {
          notification.success({ message: "Tax updated successfully" });
          setDrawerVisible(false);
        }
      });
    } else {
      dispatch(addTax(values)).then((res: any) => {
        if (!res.hasOwnProperty("error")) {
          notification.success({ message: "Tax added successfully" });
          setDrawerVisible(false);
        }
      });
    }
  };

  // Filter computation logic
  const filteredData = React.useMemo(() => {
    let result = [...taxes];

    // 1. Sidenav Tab Filter
    if (mainTab !== "ALL") {
      result = result.filter((item) => item.tax_type === mainTab);
    }

    // 2. Status Filter
    if (statusFilter === "ACTIVE") {
      result = result.filter((item) => item.is_active === true);
    } else if (statusFilter === "INACTIVE") {
      result = result.filter((item) => item.is_active === false);
    }

    // 3. Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.tax_name?.toLowerCase().includes(q) ||
          item.tax_code?.toLowerCase().includes(q)
      );
    }

    // 4. Date Range Filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf("day");
      const end = dateRange[1].endOf("day");
      result = result.filter((item) => {
        if (!item.created_at) return false;
        const date = dayjs(item.created_at);
        return (date.isAfter(start) || date.isSame(start)) && (date.isBefore(end) || date.isSame(end));
      });
    }

    return result;
  }, [taxes, mainTab, statusFilter, searchQuery, dateRange]);

  // Paginated subset
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Dynamically calculate stats
  const stats = React.useMemo(() => {
    const list = filteredData;
    const activeCount = list.filter((item) => item.is_active).length;
    const defaultCount = list.filter((item) => item.is_default).length;
    const activeTaxes = list.filter((item) => item.is_active);
    const avgRate = activeTaxes.length > 0
      ? activeTaxes.reduce((sum, item) => sum + (parseFloat(item.percentage as any) || 0), 0) / activeTaxes.length
      : 0;

    return [
      {
        title: "Total Rules",
        value: list.length,
        label: "tax rules",
        icon: <SafetyCertificateOutlined />,
        iconColor: "text-blue-500 dark:text-blue-400",
        iconBg: "bg-blue-50 dark:bg-blue-500/10",
        sparklineColor: "blue",
      },
      {
        title: "Active Rules",
        value: activeCount,
        label: "operational",
        icon: <CheckCircleOutlined />,
        iconColor: "text-emerald-500 dark:text-emerald-400",
        iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
        sparklineColor: "green",
      },
      {
        title: "Default Rules",
        value: defaultCount,
        label: "auto-applied",
        icon: <InfoCircleOutlined />,
        iconColor: "text-amber-500 dark:text-amber-400",
        iconBg: "bg-amber-50 dark:bg-amber-500/10",
        sparklineColor: "orange",
      },
      {
        title: "Avg Tax Rate",
        value: `${avgRate.toFixed(1)}%`,
        label: "active rules avg",
        icon: <SafetyCertificateOutlined />,
        iconColor: "text-rose-500 dark:text-rose-400",
        iconBg: "bg-rose-50 dark:bg-rose-500/10",
        sparklineColor: "red",
      },
    ];
  }, [filteredData]);

  const renderViewDrawer = () => (
    <Drawer
      placement="right"
      width={500}
      onClose={() => setViewingTax(null)}
      open={!!viewingTax}
      closable={false}
      rootClassName="dark-drawer compact-tax-drawer"
      styles={{
        header: { display: "none" },
        body: { padding: 0, background: "#f8fafc" },
        footer: { borderTop: "1px solid #f1f5f9", padding: "8px 16px", background: "#fff" },
      }}
      footer={
        <div className="flex justify-end gap-2 px-2">
          <Button
            key="close"
            className="rounded-none h-8 px-4 font-bold text-gray-400 hover:text-gray-600 border-gray-200 transition-all text-xs"
            onClick={() => setViewingTax(null)}
          >
            Close
          </Button>
          {hasUpdateAccess && (
            <Button
              key="edit"
              type="primary"
              className="rounded-none h-8 px-6 font-bold !bg-blue-600 hover:!bg-blue-700 border-none flex items-center gap-1.5 text-xs text-white"
              onClick={() => {
                const current = viewingTax;
                setViewingTax(null);
                if (current) handleEdit(current);
              }}
            >
              Edit Rule
            </Button>
          )}
        </div>
      }
    >
      {/* ─── Immersive Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden pt-4 pb-2 px-4 bg-white dark:bg-slate-805 border-b border-gray-100 dark:border-slate-700">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -translate-y-12 translate-x-12" />

        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="relative w-9 h-9 bg-blue-50 dark:bg-blue-500/10 border border-white dark:border-slate-800 flex items-center justify-center rounded-none text-blue-600 dark:text-blue-400 text-base shadow-sm">
                <InfoCircleOutlined />
              </div>
            </div>
            <div>
              <Title level={4} className="!m-0 !mb-0.5 font-extrabold text-gray-800 dark:text-slate-100 tracking-tight">
                Tax Rule Intel
              </Title>
              <Text className="text-gray-450 dark:text-slate-500 font-bold text-[9px] uppercase tracking-widest">
                Comprehensive configuration overview
              </Text>
            </div>
          </div>
          <Button
            type="text"
            icon={<CloseOutlined className="text-gray-400" />}
            onClick={() => setViewingTax(null)}
            className="hover:bg-gray-100 dark:hover:bg-slate-700 rounded-none h-7 w-7 flex items-center justify-center"
          />
        </div>
      </div>

      {viewingTax && (
        <div className="p-4 space-y-4">
          {/* Overview Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 flex items-center justify-between shadow-sm rounded-none">
            <div>
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                Levy Weight
              </span>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400 leading-none">
                {viewingTax.percentage}%
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1.5">
                Status
              </span>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`inline-flex px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${viewingTax.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'} rounded-none`}>
                  {viewingTax.is_active ? "Active" : "Inactive"}
                </span>
                {viewingTax.is_default && (
                  <span className="inline-flex px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 rounded-none">
                    Default
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Rule Metadata */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 shadow-sm rounded-none">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-50 dark:border-slate-700/50">
              <div className="w-5 h-5 bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400 rounded-none text-[10px]">
                <SafetyCertificateOutlined />
              </div>
              <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                Rule Metadata
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-3">
              <div>
                <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Formal Name</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{viewingTax.tax_name}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-0.5">System Code</span>
                <code className="bg-slate-50 dark:bg-slate-750 text-blue-500 dark:text-blue-400 px-2 py-0.5 font-mono text-[10px] font-bold border border-slate-100 dark:border-slate-700 rounded-none inline-block">
                  {viewingTax.tax_code}
                </code>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Classification</span>
                <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  {viewingTax.tax_type?.replace(/_/g, " ")}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-0.5">Rule Role</span>
                <span className="font-bold text-slate-600 dark:text-slate-400">
                  {viewingTax.is_default ? "Primary Default Levy" : "Standard Supplementary"}
                </span>
              </div>
            </div>
          </div>

          {/* Legal Context & Notes */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 shadow-sm rounded-none">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-50 dark:border-slate-700/50">
              <div className="w-5 h-5 bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400 rounded-none text-[10px]">
                <InfoCircleOutlined />
              </div>
              <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                Legal Context & Notes
              </span>
            </div>
            <div className="mt-3 text-xs text-slate-600 dark:text-slate-350 leading-relaxed border-l-2 border-blue-500 pl-3 py-0.5 italic">
              {viewingTax.description || "No additional context or legal reference notes provided for this tax rule."}
            </div>
          </div>

          {/* Audit History Log */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 shadow-sm rounded-none">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-50 dark:border-slate-700/50">
              <div className="w-5 h-5 bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400 rounded-none text-[10px]">
                <HistoryOutlined />
              </div>
              <span className="text-[10px] font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                Rule History Log
              </span>
            </div>
            <div className="mt-3 flex flex-col gap-2 text-[10px] text-slate-450 dark:text-slate-500 pl-1 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircleOutlined className="text-[10px] text-emerald-500" />
                <span>Created Rule: <strong>{dayjs(viewingTax.created_at).format("DD MMM YYYY, hh:mm A")}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <HistoryOutlined className="text-[10px] text-blue-500" />
                <span>Last Updated: <strong>{dayjs(viewingTax.updated_at).format("DD MMM YYYY, hh:mm A")}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-slate-900">
      {/* Top Navbar */}
      <div className="bg-white dark:bg-slate-800 h-12 px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 z-0 flex-shrink-0 w-full">
        {/* Title & Description */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <SafetyCertificateOutlined className="text-base" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 !m-0 !mb-1 leading-none">Tax Config</h1>
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0">Levy configurations</p>
        </div>

        <div className="relative flex-1 max-w-xl mx-auto flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all h-9">
          <SearchOutlined className="absolute left-3 text-slate-400 text-[16px]" />
          <input
            type="text"
            placeholder="Search tax rule name or code..."
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
              {filteredData.length} RESULTS
            </span>
          </div>

          <button
            onClick={() => dispatch(fetchTaxes())}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all shrink-0"
          >
            <ReloadOutlined className={`text-lg ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {hasCreateAccess && (
            <Button
              type="primary"
              icon={<PlusOutlined className="text-lg" />}
              onClick={handleAddClick}
              className="px-4 h-10 rounded-lg font-bold text-xs uppercase tracking-wider border-none !bg-blue-600 hover:!bg-blue-700 text-white shadow-sm flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-all"
            >
              Create Tax Rule
            </Button>
          )}
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
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-440"
                }`}>
                {taxes.length}
              </span>
            </div>

            {/* View: Central Taxes */}
            <div
              onClick={() => setMainTab("CENTRAL")}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "CENTRAL"
                ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <SafetyCertificateOutlined className="text-xs" />
                <span>Central Taxes</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainTab === "CENTRAL"
                ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}>
                {taxes.filter(t => t.tax_type === "CENTRAL").length}
              </span>
            </div>

            {/* View: State Taxes */}
            <div
              onClick={() => setMainTab("STATE")}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "STATE"
                ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <SafetyCertificateOutlined className="text-xs" />
                <span>State Taxes</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainTab === "STATE"
                ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}>
                {taxes.filter(t => t.tax_type === "STATE").length}
              </span>
            </div>

            {/* View: Composite Taxes */}
            <div
              onClick={() => setMainTab("COMPOSITE")}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "COMPOSITE"
                ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <SafetyCertificateOutlined className="text-xs" />
                <span>Composite</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainTab === "COMPOSITE"
                ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}>
                {taxes.filter(t => t.tax_type === "COMPOSITE").length}
              </span>
            </div>

            {/* View: Union Territory */}
            <div
              onClick={() => setMainTab("UNION_TERRITORY")}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "UNION_TERRITORY"
                ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                }`}
            >
              <div className="flex items-center gap-2 text-xs">
                <SafetyCertificateOutlined className="text-xs" />
                <span>Union Territory</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainTab === "UNION_TERRITORY"
                ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}>
                {taxes.filter(t => t.tax_type === "UNION_TERRITORY").length}
              </span>
            </div>
          </div>


        </div>

        {/* ─── Right Content Area ─────────────────────────────────────── */}
        <div className="flex-grow flex flex-col min-w-0 relative h-full">
          <div className="flex-grow flex flex-col p-3 overflow-hidden gap-2 pb-20">



            {/* Status Cards Grid Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-0">
              {stats.map((card, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 flex items-center justify-center text-base ${card.iconBg} ${card.iconColor} z-10 rounded-lg`}>
                        {card.icon}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest z-10">
                        {card.title}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-2 z-10">
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-1.5">
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">
                          {card.value}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider uppercase">
                          {card.label}
                        </span>
                      </div>
                    </div>
                    {/* Background Icon */}
                    <div className={`absolute -bottom-4 -right-4 text-[100px] opacity-[0.04] pointer-events-none ${card.iconColor}`}>
                      {card.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Horizontal Filters Toolbar */}
            <div className="bg-white dark:bg-[#0f172a] shadow-sm flex items-center gap-4 py-1 border-y border-slate-100 dark:border-slate-800/80 mb-2 mt-2 bg-slate-50/50 dark:bg-[#0f172a] px-4 rounded-none dark-theme-select-override">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status:
                </span>
                <Select
                  placeholder="All Statuses"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  allowClear
                  className="w-40 text-xs premium-select-sidebar custom-driver-select"
                  options={[
                    { value: "ACTIVE", label: "Active" },
                    { value: "INACTIVE", label: "Inactive" },
                  ]}
                />
              </div>

              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Created Date:
                </span>
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  className="w-64 text-xs premium-range-picker-sidebar"
                  placeholder={["Start Date", "End Date"]}
                />
              </div>
            </div>

            {/* Table Container */}
            <div className="flex-grow min-h-0 flex flex-col h-full overflow-hidden">
              <TaxTable
                data={paginatedData}
                loading={isLoading}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
                onToggleStatus={handleToggleStatus}
                canUpdate={hasUpdateAccess}
                canDelete={hasDeleteAccess}
              />
            </div>
          </div>

          {/* Sticky Bottom Pagination Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-805 px-6 flex items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Showing {filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} rules
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

      <TaxFormDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onSubmit={onFinish}
        initialValues={editingTax}
        loading={isLoading}
      />

      {renderViewDrawer()}

      <style>{`
        /* Sidebar input styling overrides */
        .premium-select-sidebar.ant-select .ant-select-selector {
          border-radius: 8px !important;
          border-color: #cbd5e1 !important;
          height: 34px !important;
        }
        .dark .dark-theme-select-override .custom-driver-select{
          border-color: #334155 !important;
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
        }
        .dark .dark-theme-select-override .custom-driver-select .ant-select-selector,
        .dark .dark-theme-select-override .ant-select-selector {
          border-color: #334155 !important;
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
        }
        
        .dark .dark-theme-select-override .ant-select-selection-item {
          color: #f1f5f9 !important;
          background-color: #1e293b !important;
          border-color: #334155 !important;
        }
        
        .dark .dark-theme-select-override .ant-select-selection-placeholder {
          color: #64748b !important;
        }
        
        .dark .dark-theme-select-override .ant-select-arrow {
          color: #64748b !important;
        }
        
        .dark .dark-theme-select-override .ant-select-clear {
          background-color: transparent !important;
          color: #64748b !important;
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

        /* Drawer zero border radius overrides */
        .compact-tax-drawer .ant-drawer-content-wrapper,
        .compact-tax-drawer .ant-drawer-content {
          border-radius: 0px !important;
        }
        .compact-tax-drawer .ant-btn {
          border-radius: 0px !important;
        }
      `}</style>
    </div>
  );
};

export default TaxPage;
