import React, { useState, useEffect, useCallback } from "react";
import { Table, Tag, Upload, message, Typography, Empty, Tooltip, DatePicker, Select, Button } from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  SyncOutlined,
  CloudUploadOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { FileSpreadsheet } from "lucide-react";
import { IoMdRefresh } from "react-icons/io";
import * as XLSX from "xlsx";
import axiosIns from "../api/axios";
import dayjs from "dayjs";
import { useHasPermission } from "../hooks/usePermission";

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface DriverData {
  driver_name: string;
  phone: string;
  mail: string;
  address: string;
  pincode: string;
  district: string;
  state: string;
  country: string;
  status: string;
  onboarding_status?: string;
  has_account?: boolean;
  is_onboarded?: boolean;
  created_at: string;
  updated_at: string;
  joined_date: string;
}

export interface Filters {
  search: string;
  status: string[];
  state: string[];
  joined_range: [dayjs.Dayjs, dayjs.Dayjs] | null;
}

const DriverReconciliation: React.FC = () => {
  const canUpdate = useHasPermission("drivers_outreach", "update");
  const canCreate = useHasPermission("drivers_outreach", "create");

  const [drivers, setDrivers] = useState<DriverData[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<DriverData[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    search: "",
    status: [],
    state: [],
    joined_range: null,
  });

  const [currentView, setCurrentView] = useState<"all" | "active" | "verified" | "pending" | "inactive">("all");

  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const rowsResponse = await axiosIns.get("/api/driver-reconciliation/rows?limit=1000");
      const rows = rowsResponse.data?.data?.rows || [];
      setDrivers(rows);

      if (rows.length > 0 && !lastSyncedAt) {
        const latestUpdate = rows.reduce(
          (max: string, r: any) => (r.updated_at > max ? r.updated_at : max),
          rows[0].updated_at,
        );
        setLastSyncedAt(latestUpdate);
      }
    } catch (err: any) {
      console.error("Failed to load reconciliation data:", err);
      message.error("Failed to load driver data");
    } finally {
      setLoading(false);
    }
  }, [lastSyncedAt]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await axiosIns.post("/api/driver-reconciliation/sync");
      if (response.data.success) {
        message.success(response.data.message);
        setLastSyncedAt(dayjs().toISOString());
        loadData();
      }
    } catch (err: any) {
      console.error("Sync failed:", err);
      message.error("Failed to sync driver records");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let result = [...drivers];

    // View Filtering
    if (currentView !== "all") {
      result = result.filter((d) => d.status?.toLowerCase() === currentView);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (d) =>
          d.driver_name?.toLowerCase().includes(search) ||
          d.phone?.includes(search) ||
          d.mail?.toLowerCase().includes(search),
      );
    }

    if (filters.status && filters.status.length > 0) {
      result = result.filter((d) => filters.status.includes(d.status?.toLowerCase()));
    }

    if (filters.state && filters.state.length > 0) {
      result = result.filter((d) => filters.state.includes(d.state));
    }

    if (filters.joined_range) {
      const [start, end] = filters.joined_range;
      result = result.filter((d) => {
        if (!d.joined_date) return false;
        const jDate = dayjs(d.joined_date);
        return (jDate.isAfter(start.startOf("day")) || jDate.isSame(start.startOf("day"))) &&
               (jDate.isBefore(end.endOf("day")) || jDate.isSame(end.endOf("day")));
      });
    }

    setFilteredDrivers(result);
  }, [drivers, filters, currentView]);

  const applyFilters = (values: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...values }));
  };

  const hasActiveFilters =
    filters.search || filters.status.length > 0 || filters.state.length > 0 || filters.joined_range;

  // Keyboard Shortcuts: Alt+E for Export, Alt+I for Import
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        exportTemplate();
      }
      if (e.altKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        if (canCreate) {
          const uploadEl = document.querySelector(".import-upload input") as HTMLInputElement;
          uploadEl?.click();
        } else {
          message.warning("You do not have permission to import data.");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canCreate]);

  const exportTemplate = () => {
    const headers = [
      "Driver Name",
      "Phone",
      "Email",
      "Address",
      "Pincode",
      "District",
      "State",
      "Country",
      "Status",
      "Created At",
      "Updated At",
      "Joined Date",
    ];

    const sampleRow = {
      "Driver Name": "John Doe",
      Phone: "9876543210",
      Email: "john@example.com",
      Address: "123 Main St",
      Pincode: "110001",
      District: "Central Delhi",
      State: "Delhi",
      Country: "India",
      Status: "active",
      "Created At": dayjs().format("YYYY-MM-DD"),
      "Updated At": dayjs().format("YYYY-MM-DD"),
      "Joined Date": dayjs().format("YYYY-MM-DD"),
    };

    const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers });

    const wscols = headers.map(() => ({ wch: 20 }));
    ws["!cols"] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Drivers");
    XLSX.writeFile(wb, `Driver_Template_${dayjs().format("YYYYMMDD")}.xlsx`);
    message.success("Template exported successfully!");
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    setImporting(true);
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<DriverData>(worksheet);

        if (jsonData.length === 0) {
          message.error("The uploaded file is empty.");
          return;
        }

        try {
          const payload = {
            filename: file.name,
            data: jsonData,
          };
          await axiosIns.post("/api/driver-reconciliation/process", payload);
          message.success(`${jsonData.length} driver records imported successfully!`);
          loadData();
        } catch (err: any) {
          console.error("Backend import failed:", err);
          message.warning("Import failed: " + (err.response?.data?.message || err.message));
        }
      } catch (error) {
        message.error("Failed to parse the file. Please ensure it's a valid Excel/CSV.");
      } finally {
        setImporting(false);
      }
    };
    reader.onerror = () => {
      message.error("File reading failed.");
      setImporting(false);
    };
    reader.readAsBinaryString(file);
    return false;
  };

  const columns = [
    {
      title: "Driver Name",
      dataIndex: "driver_name",
      key: "name",
      render: (text: string) => (
        <Text strong className="text-slate-700 dark:text-slate-200">
          {text}
        </Text>
      ),
    },
    {
      title: "Contact Info",
      key: "contact",
      render: (_: any, record: DriverData) => (
        <div className="flex items-center gap-2">
          <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {record.phone}
          </Text>
          <div className="h-3 w-[1.5px] bg-indigo-200/60 dark:bg-indigo-500/30 rounded-full mx-1" />
          <Text className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            {record.mail}
          </Text>
        </div>
      ),
    },
    {
      title: "Location",
      key: "location",
      render: (_: any, record: DriverData) => (
        <Tooltip
          title={`${record.address}, ${record.district}, ${record.state}, ${record.pincode}`}
        >
          <div className="max-w-[200px] truncate text-[12px] text-slate-500 dark:text-slate-400">
            {record.address}, {record.state}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "District",
      dataIndex: "district",
      key: "district",
      render: (text: string) => (
        <Text className="text-[12px] text-slate-600 dark:text-slate-300 font-medium">{text}</Text>
      ),
    },
    {
      title: "Onboarding Status",
      key: "onboarding",
      render: (_: any, record: DriverData) => {
        if (!record.has_account) {
          return (
            <Tag color="default" className="rounded-full px-3 text-[10px] font-bold uppercase">
              Not Registered
            </Tag>
          );
        }

        const status = record.onboarding_status || "PHONE_VERIFIED";
        let color = "cyan";

        if (["ACTIVE", "SUBSCRIPTION_ACTIVE"].includes(status)) color = "green";
        else if (["DOCUMENTS_APPROVED", "DOCS_SUBMITTED"].includes(status)) color = "blue";
        else if (status === "DOCS_REJECTED") color = "red";
        else if (["PROFILE_COMPLETED", "ADDRESS_COMPLETED"].includes(status)) color = "cyan";
        else color = "geekblue";

        return (
          <Tag
            color={color}
            className="rounded-full px-3 text-[10px] font-bold uppercase border-none"
          >
            {status.replace(/_/g, " ")}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        let icon = null;
        if (status?.toLowerCase() === "active" || status?.toLowerCase() === "verified") {
          color = "success";
          icon = <CheckCircleFilled />;
        } else if (status?.toLowerCase() === "inactive" || status?.toLowerCase() === "suspended") {
          color = "error";
          icon = <ExclamationCircleFilled />;
        } else if (status?.toLowerCase() === "pending") {
          color = "processing";
        }
        return (
          <Tag
            icon={icon}
            color={color}
            className="rounded-full px-3 py-0.5 font-bold uppercase text-[10px]"
          >
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Joined Date",
      dataIndex: "joined_date",
      key: "joined",
      render: (date: string) => (
        <Text className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
          {date ? dayjs(date).format("MMM DD, YYYY") : "N/A"}
        </Text>
      ),
    },
    {
      title: "Last Update",
      dataIndex: "updated_at",
      key: "updated",
      render: (date: string) => (
        <Text type="secondary" className="text-[11px]">
          {date ? dayjs(date).format("DD/MM/YYYY") : "N/A"}
        </Text>
      ),
    },
  ];

  const ViewItem = ({ label, count, isActive, onClick, bgActiveColorClass = "bg-blue-50/80 dark:bg-blue-900/30", badgeColorClass = "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" }: any) => (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2 rounded-[10px] cursor-pointer transition-all ${
        isActive
          ? `${bgActiveColorClass} text-slate-800 dark:text-slate-100 font-bold`
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-[13px] tracking-tight uppercase">{label}</span>
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

  return (
    <div className="flex flex-row h-full w-full bg-[#f8f9fa] dark:bg-[#0b0f19] overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-[260px] flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
        {/* Sidebar Header */}
        <div className="p-6 pb-4 border-b border-slate-200 dark:border-slate-800/50">
          <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <FileSpreadsheet size={16} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col justify-center mt-0.5">
              <h2 className="font-black text-sm uppercase tracking-wider leading-none m-0">OUTREACH</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Driver Sync</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
          {/* VIEWS SECTION */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2 mb-4">
              Views
            </p>
            <div className="flex flex-col gap-1">
              <ViewItem
                label="All Drivers"
                count={drivers.length}
                isActive={currentView === "all"}
                onClick={() => setCurrentView("all")}
                activeColorClass="text-indigo-500"
                bgActiveColorClass="bg-indigo-50/80 dark:bg-indigo-900/30"
                badgeColorClass="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
              />
              <ViewItem
                label="Active"
                count={drivers.filter((d) => d.status?.toLowerCase() === "active").length}
                isActive={currentView === "active"}
                onClick={() => setCurrentView("active")}
                activeColorClass="text-emerald-500"
                bgActiveColorClass="bg-emerald-50/80 dark:bg-emerald-900/30"
                badgeColorClass="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
              />
              <ViewItem
                label="Verified"
                count={drivers.filter((d) => d.status?.toLowerCase() === "verified").length}
                isActive={currentView === "verified"}
                onClick={() => setCurrentView("verified")}
                activeColorClass="text-blue-500"
                bgActiveColorClass="bg-blue-50/80 dark:bg-blue-900/30"
                badgeColorClass="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
              />
              <ViewItem
                label="Pending"
                count={drivers.filter((d) => d.status?.toLowerCase() === "pending").length}
                isActive={currentView === "pending"}
                onClick={() => setCurrentView("pending")}
                activeColorClass="text-amber-500"
                bgActiveColorClass="bg-amber-50/80 dark:bg-amber-900/30"
                badgeColorClass="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
              />
              <ViewItem
                label="Inactive"
                count={drivers.filter((d) => d.status?.toLowerCase() === "inactive").length}
                isActive={currentView === "inactive"}
                onClick={() => setCurrentView("inactive")}
                activeColorClass="text-rose-500"
                bgActiveColorClass="bg-rose-50/80 dark:bg-rose-900/30"
                badgeColorClass="bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400"
              />
            </div>
          </div>

          {/* FILTERS SECTION */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2 mb-4">
              Filters
            </p>
            <div className="flex flex-col gap-4 px-2">
              <div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5 uppercase tracking-wide">
                  State
                </span>
                <Select
                  mode="multiple"
                  placeholder="All States"
                  className="w-full custom-select-compact"
                  value={filters.state}
                  onChange={(val) => applyFilters({ state: val })}
                  options={Array.from(new Set(drivers.map((d) => d.state))).filter(Boolean).map((s) => ({ value: s, label: s }))}
                  maxTagCount="responsive"
                />
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5 uppercase tracking-wide">
                  Joined Date
                </span>
                <RangePicker
                  className="w-full custom-select-compact"
                  value={filters.joined_range}
                  onChange={(dates) => applyFilters({ joined_range: dates as [dayjs.Dayjs, dayjs.Dayjs] | null })}
                />
              </div>

              {hasActiveFilters && (
                <Button
                  type="text"
                  danger
                  icon={<CloseCircleOutlined />}
                  className="text-[11px] font-black uppercase tracking-widest w-full hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl mt-2"
                  onClick={() => setFilters({ search: "", status: [], state: [], joined_range: null })}
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
          <div className="relative flex-1 max-w-2xl flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
            <SearchOutlined className="absolute left-3 text-slate-400 text-[16px]" />
            <input
              type="text"
              placeholder="Search drivers by name, phone or email..."
              className="w-full pl-10 pr-4 py-2 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400"
              value={filters.search}
              onChange={(e) => applyFilters({ search: e.target.value })}
            />
            <div className="absolute right-3">
              <span className="text-[11px] font-bold text-slate-400 border border-slate-200 dark:border-slate-600 rounded-[4px] px-1.5 py-[1px] bg-slate-50/50 dark:bg-slate-800 tracking-wide">
                ⌘K
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Tooltip title="Shortcut: Alt + E">
              <Button
                type="default"
                icon={<DownloadOutlined />}
                onClick={exportTemplate}
                className="rounded-lg font-bold !bg-indigo-50 !text-indigo-600 hover:!bg-indigo-100 border-none flex items-center gap-2"
              >
                Template
              </Button>
            </Tooltip>
            
            <Tooltip title={canCreate ? "Shortcut: Alt + I" : "You do not have permission to import data"}>
              <span>
                <Upload
                  beforeUpload={handleImport}
                  showUploadList={false}
                  accept=".xlsx,.xls,.csv"
                  className="import-upload"
                  disabled={!canCreate}
                >
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    loading={importing}
                    disabled={!canCreate}
                    className="rounded-lg font-bold border-none flex items-center !bg-gradient-to-r !from-indigo-600 !to-blue-500"
                  >
                    Import
                  </Button>
                </Upload>
              </span>
            </Tooltip>

            <div className="w-[1px] h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

            <Tooltip title={canUpdate ? "Sync records" : "You do not have permission to sync records"}>
              <Button
                type="text"
                icon={<SyncOutlined spin={syncing} />}
                onClick={handleSync}
                loading={syncing}
                disabled={!canUpdate}
                className="flex items-center gap-2 font-bold text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Sync
              </Button>
            </Tooltip>

            <button
              onClick={loadData}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all"
            >
              <IoMdRefresh className={`text-lg ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-[#0f172a] flex flex-col gap-6">
          
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Total Imported */}
            <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center text-base bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <CloudUploadOutlined className="text-sm" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest">TOTAL IMPORTED</p>
                </div>
              </div>
              <div className="flex items-end justify-between mt-2">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{drivers.length}</h3>
                    <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider">RECORDS</span>
                  </div>
                </div>
                <div className="w-24 h-10 mb-[-5px]">
                  <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,40 L10,30 L20,35 L40,10 L60,25 L80,5 L100,20" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
                    <path d="M0,40 L10,30 L20,35 L40,10 L60,25 L80,5 L100,20 L100,40 Z" fill="url(#gradient-indigo)" opacity="0.1" />
                    <defs>
                      <linearGradient id="gradient-indigo" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* 2. Active Drivers */}
            <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center text-base bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                    <SafetyCertificateOutlined className="text-sm" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest">ACTIVE DRIVERS</p>
                </div>
              </div>
              <div className="flex items-end justify-between mt-2">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">
                      {drivers.filter(d => d.status?.toLowerCase() === "active" || d.status?.toLowerCase() === "verified").length}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider">LIVE</span>
                  </div>
                </div>
                <div className="w-24 h-10 mb-[-5px]">
                  <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,40 L20,35 L40,20 L60,25 L80,10 L100,5" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                    <path d="M0,40 L20,35 L40,20 L60,25 L80,10 L100,5 L100,40 Z" fill="url(#gradient-emerald)" opacity="0.1" />
                    <defs>
                      <linearGradient id="gradient-emerald" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            {/* 3. Pending Review */}
            <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center text-base bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400">
                    <ClockCircleOutlined className="text-sm" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest">PENDING REVIEW</p>
                </div>
              </div>
              <div className="flex items-end justify-between mt-2">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">
                      {drivers.filter(d => d.status?.toLowerCase() === "pending").length}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider">AWAITING</span>
                  </div>
                </div>
                <div className="w-24 h-10 mb-[-5px]">
                  <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,10 L20,15 L40,10 L60,20 L80,25 L100,40" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                    <path d="M0,10 L20,15 L40,10 L60,20 L80,25 L100,40 L100,40 L0,40 Z" fill="url(#gradient-amber)" opacity="0.1" />
                    <defs>
                      <linearGradient id="gradient-amber" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-white dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 m-0">Outreach Records</h3>
                <div className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                  {filteredDrivers.length} matching
                </div>
              </div>
              {lastSyncedAt && (
                <Text type="secondary" className="text-[11px] font-medium">
                  Last Synced: {dayjs(lastSyncedAt).format("MMM DD, hh:mm A")}
                </Text>
              )}
            </div>

            <Table
              columns={columns}
              dataSource={filteredDrivers}
              loading={importing || loading}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: filteredDrivers.length,
                className: "px-6 py-4",
                showSizeChanger: true,
                size: "small",
                position: ["bottomRight"],
                showTotal: (total) => (total > 0 ? `Total ${total} drivers` : ""),
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                },
              }}
              size="small"
              scroll={{ x: "max-content", y: "calc(100vh - 440px)" }}
              rowKey={(record, index) => (record?.phone || index || 0).toString() + (index || 0)}
              locale={{
                emptyText: (
                  <div className="py-12">
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={
                        <div className="flex flex-col gap-2">
                          <Text className="text-slate-400 dark:text-slate-500 font-medium">
                            No driver data found
                          </Text>
                          {canCreate ? (
                            <Text type="secondary" className="text-[12px]">
                              Please export the template and import your data to get started.
                            </Text>
                          ) : (
                            <Text type="secondary" className="text-[12px]">
                              No driver records are available. Contact an administrator to import data.
                            </Text>
                          )}
                        </div>
                      }
                    />
                  </div>
                ),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverReconciliation;
