import React, { useState, useEffect, useCallback } from "react";
import {
  Pagination,
  Avatar,
  Table, Tag, Upload, message, Typography, Empty, Tooltip, DatePicker, Select, Button
} from "antd";
import {
  UserOutlined,
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
  TeamOutlined,
  CheckCircleOutlined,
  MinusCircleOutlined,
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
      width: 200,
      render: (text: string, record: DriverData) => (
        <div className="reconciliation-driver-wrapper">
          <Avatar
            icon={<UserOutlined />}
            size={32}
            className="driver-avatar"
          >
            {text?.charAt(0)}
          </Avatar>
          <div className="driver-name-wrapper">
            <Text className="driver-name-text">
              {text}
            </Text>
            <div className="driver-id-wrapper group/copy">
              <Text className="driver-id-text">
                {record.phone || "NEW"}
              </Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Contact Info",
      key: "contact",
      width: 160,
      render: (_: any, record: DriverData) => (
        <div className="flex flex-col gap-[0.125rem]">
          <Text className="text-[13px] font-semibold text-[#475569] dark:text-[#cbd5e1]">
            {record.phone}
          </Text>
          <Text className="text-[12px] font-black text-[#94a3b8] dark:text-[#64748b]">
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

  const ViewItem = ({ icon, label, count, isActive, onClick, activeColorClass = "text-blue-600 dark:text-blue-400", bgActiveColorClass = "bg-blue-50/80 dark:bg-blue-500/10", badgeColorClass = "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300" }: any) => (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${isActive
        ? `${bgActiveColorClass} ${activeColorClass} font-bold`
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
        }`}
    >
      <div className="flex items-center gap-2 text-xs">
        <span className="text-xs">{icon}</span>
        <span>{label}</span>
      </div>
      {count !== undefined && (
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isActive
          ? badgeColorClass
          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
          }`}>
          {count}
        </span>
      )}
    </div>
  );

  return (
    <>
      <style>
        {`
                    .premium-table-flat .ant-table-thead > tr > th {
                        background: #f8fafc !important;
                        color: #64748b !important;
                        font-weight: 700 !important;
                        text-transform: uppercase !important;
                        font-size: 12px !important;
                        letter-spacing: 0.05em !important;
                        border-bottom: 1px solid #f1f5f9 !important;
                        border-top: 1px solid #f1f5f9 !important;
                        padding: 10px 12px !important;
                    }
                    .premium-table-flat .ant-table-thead > tr > th::before {
                        display: block !important;
                        background-color: #e2e8f0 !important;
                        width: 1px !important;
                        height: 1.4em !important;
                        top: 50% !important;
                        transform: translateY(-50%) !important;
                    }
                    .premium-table-flat .ant-table-tbody > tr:not(.ant-table-measure-row) > td {
                        padding: 4px 12px !important;
                        border-bottom: 1px solid #f8fafc !important;
                    }
                    .dark .premium-table-flat .ant-table-thead > tr > th {
                        background: #0f172a !important;
                        color: #64748b !important;
                        border-bottom: 1px solid #1e293b !important;
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
                    .premium-table-flat .ant-spin-container {
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                    }
                    .premium-table-flat .ant-table {
                        flex: 1;
                        background: transparent !important;
                    }
                    .premium-table-flat .ant-table-container {
                        height: 100%;
                        overflow: hidden;
                    }
                    .premium-table-flat .ant-pagination {
                        display: none !important;
                    }
                    .reconciliation-driver-wrapper { display: flex; align-items: center; gap: 0.5rem; }
                    .driver-avatar { border: 2px solid white; flex-shrink: 0; background: linear-gradient(135deg, #60a5fa 0%, #2563eb 100%); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); color: white; }
                    .dark .driver-avatar { border-color: transparent; }
                    .driver-name-wrapper { display: flex; flex-direction: column; justify-content: center; gap: 0.125rem; }
                    .driver-name-text { font-weight: 800; color: #1e293b; letter-spacing: -0.025em; font-size: 13px; line-height: 1; }
                    .dark .driver-name-text { color: #f1f5f9; }
                    .driver-id-wrapper { display: flex; align-items: center; gap: 0.375rem; }
                    .driver-id-text { font-size: 11px; font-weight: 700;  letter-spacing: -0.025em; font-family: monospace; line-height: 1; color: #6b7280; }
                    .dark .driver-id-text { color: #94a3b8; }
                    .driver-row-even { background-color: rgba(248, 250, 252, 0.5); transition: background-color 0.15s; }
                    .dark .driver-row-even { background-color: #0f172a; }
                    .driver-row-even:hover { background-color: rgba(238, 242, 255, 0.3) !important; }
                    .dark .driver-row-even:hover { background-color: #1e293b !important; }
                    .driver-row-odd { background-color: white; transition: background-color 0.15s; }
                    .dark .driver-row-odd { background-color: #0f172a; }
                    .driver-row-odd:hover { background-color: rgba(238, 242, 255, 0.3) !important; }
                    .dark .driver-row-odd:hover { background-color: #1e293b !important; }
                    .outreach-table-container { flex-grow: 1; background-color: white; border-radius: 6px; border: 1px solid #f1f5f9; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); overflow: hidden; display: flex; flex-direction: column; min-height: 0; padding-bottom: 0.5rem; }
                    .dark .outreach-table-container { background-color: #0f172a; border-color: #334155; }

                    .custom-driver-select .ant-select-selector {
                      border-radius: 8px !important;
                    }

                    .dark .dark-theme-select-override .custom-driver-select {
                      border-color: #334155 !important;
                      background-color: #0f172a !important;
                      color: #f1f5f9 !important;
                    }
                    
                    .dark .dark-theme-select-override .ant-select-selector,
                    html.dark .dark-theme-select-override .ant-select-selector {
                      border-color: #334155 !important;
                      background-color: #0f172a !important;
                      color: #f1f5f9 !important;
                    }
                    
                    .dark .dark-theme-select-override .ant-select-selection-item,
                    html.dark .dark-theme-select-override .ant-select-selection-item {
                      color: #f1f5f9 !important;
                      background-color: #1e293b !important;
                      border-color: #334155 !important;
                    }
                    
                    .dark .dark-theme-select-override .ant-select-selection-placeholder,
                    html.dark .dark-theme-select-override .ant-select-selection-placeholder {
                      color: #64748b !important;
                    }
                    
                    .dark .dark-theme-select-override .ant-select-arrow,
                    html.dark .dark-theme-select-override .ant-select-arrow {
                      color: #64748b !important;
                    }
                    
                    .dark .dark-theme-select-override .ant-select-clear,
                    html.dark .dark-theme-select-override .ant-select-clear {
                      background-color: transparent !important;
                      color: #64748b !important;
                    }
                    
                    /* Picker compact styling */
                    .custom-picker-compact.ant-picker {
                      border-radius: 8px !important;
                    }
                    .dark .custom-picker-compact.ant-picker {
                      border-color: #334155 !important;
                      background-color: #0f172a !important;
                    }

        `}
      </style>

      <div className="flex flex-col h-full w-full bg-[#f8f9fa] dark:bg-[#0b0f19] overflow-hidden">
        {/* Top Navbar */}
        <div className="bg-white dark:bg-slate-800 h-12 px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 z-0 flex-shrink-0">
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <FileSpreadsheet size={16} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 !m-0 !mb-1 leading-none whitespace-nowrap">Outreach Records</h1>
            <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div>
            <div className="flex items-center gap-3">
              <div className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold whitespace-nowrap">
                {filteredDrivers.length} matching
              </div>
              {lastSyncedAt && (
                <Text type="secondary" className="text-[11px] font-medium whitespace-nowrap">
                  Last Synced: {dayjs(lastSyncedAt).format("MMM DD, hh:mm A")}
                </Text>
              )}
            </div>
          </div>

          <div className="relative flex-1 max-w-2xl flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
            <SearchOutlined className="absolute left-3 text-slate-400 text-[16px]" />
            <input
              type="text"
              placeholder="Search drivers by name, phone or email..."
              className="w-full pl-10 pr-4 py-1.5 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400"
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

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* SIDEBAR */}
          <div className="w-[260px] flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
              {/* VIEWS SECTION */}
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2 mb-4">
                  Views
                </p>
                <div className="flex flex-col gap-1">
                  <ViewItem
                    icon={<TeamOutlined />}
                    label="All Drivers"
                    count={drivers.length}
                    isActive={currentView === "all"}
                    onClick={() => setCurrentView("all")}
                    activeColorClass="text-indigo-500"
                    bgActiveColorClass="bg-indigo-50/80 dark:bg-indigo-900/30"
                    badgeColorClass="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                  />
                  <ViewItem
                    icon={<CheckCircleOutlined />}
                    label="Active"
                    count={drivers.filter((d) => d.status?.toLowerCase() === "active").length}
                    isActive={currentView === "active"}
                    onClick={() => setCurrentView("active")}
                    activeColorClass="text-emerald-500"
                    bgActiveColorClass="bg-emerald-50/80 dark:bg-emerald-900/30"
                    badgeColorClass="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                  />
                  <ViewItem
                    icon={<SafetyCertificateOutlined />}
                    label="Verified"
                    count={drivers.filter((d) => d.status?.toLowerCase() === "verified").length}
                    isActive={currentView === "verified"}
                    onClick={() => setCurrentView("verified")}
                    activeColorClass="text-blue-500"
                    bgActiveColorClass="bg-blue-50/80 dark:bg-blue-900/30"
                    badgeColorClass="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                  />
                  <ViewItem
                    icon={<ClockCircleOutlined />}
                    label="Pending"
                    count={drivers.filter((d) => d.status?.toLowerCase() === "pending").length}
                    isActive={currentView === "pending"}
                    onClick={() => setCurrentView("pending")}
                    activeColorClass="text-amber-500"
                    bgActiveColorClass="bg-amber-50/80 dark:bg-amber-900/30"
                    badgeColorClass="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
                  />
                  <ViewItem
                    icon={<MinusCircleOutlined />}
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

            </div>
          </div>

          {/* RIGHT MAIN CONTENT */}
          <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0b0f19] relative h-full">
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-[#0f172a] flex flex-col gap-2 pb-20">

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Total Imported */}
                <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden">
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
                  </div>
                  {/* Background Icon */}
                  <div className="absolute -bottom-2 -right-2 text-[40px] opacity-[0.06] pointer-events-none text-indigo-600 dark:text-indigo-400">
                    <CloudUploadOutlined />
                  </div>
                </div>

                {/* 2. Active Drivers */}
                <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden">
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
                  </div>
                  {/* Background Icon */}
                  <div className="absolute -bottom-2 -right-2 text-[40px] opacity-[0.06] pointer-events-none text-emerald-500 dark:text-emerald-400">
                    <SafetyCertificateOutlined />
                  </div>
                </div>

                {/* 3. Pending Review */}
                <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden">
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
                  </div>
                  {/* Background Icon */}
                  <div className="absolute -bottom-2 -right-2 text-[40px] opacity-[0.06] pointer-events-none text-amber-500 dark:text-amber-400">
                    <ClockCircleOutlined />
                  </div>
                </div>
              </div>

              {/* FILTERS TOOLBAR */}
              <div className="bg-white dark:bg-slate-800 py-1 px-2 rounded-sm border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4 shadow-sm flex-shrink-0 dark-theme-select-override">
                <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">
                    State:
                  </span>
                  <Select
                    mode="multiple"
                    placeholder="All States"
                    className="flex-1 text-xs custom-driver-select min-w-0"
                    value={filters.state}
                    onChange={(val) => applyFilters({ state: val })}
                    options={Array.from(new Set(drivers.map((d) => d.state))).filter(Boolean).map((s) => ({ value: s, label: s }))}
                    maxTagCount="responsive"
                  />
                </div>

                <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">
                    Joined Date:
                  </span>
                  <RangePicker
                    className="flex-1 text-xs custom-picker-compact min-w-0"
                    value={filters.joined_range}
                    onChange={(dates) => applyFilters({ joined_range: dates as [dayjs.Dayjs, dayjs.Dayjs] | null })}
                  />
                </div>

                {hasActiveFilters && (
                  <Button
                    type="text"
                    danger
                    icon={<CloseCircleOutlined />}
                    className="text-[11px] font-bold uppercase tracking-wider"
                    onClick={() => setFilters({ search: "", status: [], state: [], joined_range: null })}
                  >
                    Clear
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-hidden p-0 flex flex-col gap-6">
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-slate-800 rounded-lg">
                  <div className="outreach-table-container rounded-t-lg border-t border-slate-100 dark:border-slate-700">
                    <Table
                      columns={columns}
                      dataSource={filteredDrivers}
                      loading={importing || loading}
                      pagination={{ position: ["none"], current: currentPage, pageSize: pageSize }}
                      tableLayout="fixed"
                      size="small"
                      className="premium-table-flat"
                      rowClassName={(_, index) =>
                        (index || 0) % 2 === 0
                          ? "driver-row-even"
                          : "driver-row-odd"
                      }
                      scroll={{ x: 1200, y: "calc(100vh - 480px)" }}
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

              {/* Sticky Pagination Footer */}
              <div className="absolute bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-805 px-6 flex items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  Showing {filteredDrivers.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
                  {Math.min(currentPage * pageSize, filteredDrivers.length)} of {filteredDrivers.length} drivers
                </span>
                <Pagination
                  current={currentPage}
                  pageSize={pageSize}
                  total={filteredDrivers.length}
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
        </div>
      </div>
    </>
  );
};

export default DriverReconciliation;
