import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Table,
  Tag,
  Space,
  Upload,
  message,
  Typography,
  Card,
  Empty,
  Tooltip,
} from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  TableOutlined,
  SyncOutlined,
  CloudUploadOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import TitleBar from "../components/TitleBarCommon/TitleBar";
import AdvancedFilters, {
  type FilterField,
  type FilterValues,
} from "../components/AdvancedFilters/AdvanceFilters";
import axiosIns from "../api/axios";
import dayjs from "dayjs";

const { Text } = Typography;

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

const DriverReconciliation: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverData[]>([]);
  const [filteredDrivers, setFilteredDrivers] = useState<DriverData[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    globalSearch: "",
    status: [],
    state: [],
    from: null,
    to: null,
  });
  const [summaryStats, setSummaryStats] = useState({
    total_processed_rows: 0,
    active_drivers: 0,
    pending_drivers: 0
  });
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all reconciliation rows
      const rowsResponse = await axiosIns.get("/api/driver-reconciliation/rows?limit=1000");
      const rows = rowsResponse.data?.data?.rows || [];
      setDrivers(rows);

      // Find the most recent update as "last synced" if not manually synced yet
      if (rows.length > 0 && !lastSyncedAt) {
        const latestUpdate = rows.reduce((max: string, r: any) =>
          (r.updated_at > max ? r.updated_at : max), rows[0].updated_at);
        setLastSyncedAt(latestUpdate);
      }

      // Derive stats from rows
      setSummaryStats({
        total_processed_rows: rows.length,
        active_drivers: rows.filter((d: any) => d.status?.toLowerCase() === 'active' || d.status?.toLowerCase() === 'verified').length,
        pending_drivers: rows.filter((d: any) => d.status?.toLowerCase() === 'pending').length
      });
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

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtering Logic
  useEffect(() => {
    let result = [...drivers];

    if (filters.globalSearch) {
      const search = filters.globalSearch.toLowerCase();
      result = result.filter(
        (d) =>
          d.driver_name?.toLowerCase().includes(search) ||
          d.phone?.includes(search) ||
          d.mail?.toLowerCase().includes(search)
      );
    }

    if (filters.status && filters.status.length > 0) {
      result = result.filter((d) => filters.status.includes(d.status?.toLowerCase()));
    }

    if (filters.state && filters.state.length > 0) {
      result = result.filter((d) => filters.state.includes(d.state));
    }

    if (filters.from) {
      const fromDate = dayjs(filters.from).startOf("day");
      result = result.filter((d) => d.joined_date && dayjs(d.joined_date).isAfter(fromDate) || dayjs(d.joined_date).isSame(fromDate));
    }

    if (filters.to) {
      const toDate = dayjs(filters.to).endOf("day");
      result = result.filter((d) => d.joined_date && dayjs(d.joined_date).isBefore(toDate) || dayjs(d.joined_date).isSame(toDate));
    }

    setFilteredDrivers(result);
  }, [drivers, filters]);

  const applyFilters = (values: FilterValues) => {
    setFilters((prev) => ({ ...prev, ...values }));
  };

  const filterFields: FilterField[] = [
    {
      name: "globalSearch",
      label: "Search Name / Phone / Email",
      type: "input",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "verified", label: "Verified" },
        { value: "pending", label: "Pending" },
        { value: "inactive", label: "Inactive" },
      ],
      mode: "multiple",
    },
    {
      name: "state",
      label: "State",
      type: "select",
      options: Array.from(new Set(drivers.map((d) => d.state))).filter(Boolean).map(s => ({ value: s, label: s })),
      mode: "multiple",
    },
    {
      name: "from",
      label: "Joined From",
      type: "date",
    },
    {
      name: "to",
      label: "Joined To",
      type: "date",
    },
  ];

  // Keyboard Shortcuts: Alt+E for Export, Alt+I for Import
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        exportTemplate();
      }
      if (e.altKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
        const uploadEl = document.querySelector(".import-upload input") as HTMLInputElement;
        uploadEl?.click();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

    // Set column widths
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

        // Send to backend
        try {
          const payload = {
            filename: file.name,
            data: jsonData
          };
          await axiosIns.post("/api/driver-reconciliation/process", payload);
          message.success(`${jsonData.length} driver records imported successfully!`);
          loadData(); // Refresh data from server
        } catch (err: any) {
          console.error("Backend import failed:", err);
          // Only fallback to local if absolutely necessary, but better to show real state
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
    return false; // Prevent default upload behavior
  };

  const columns = [
    {
      title: "Driver Name",
      dataIndex: "driver_name",
      key: "name",
      render: (text: string) => <Text strong className="text-slate-700 dark:text-slate-200">{text}</Text>,
    },
    {
      title: "Contact Info",
      key: "contact",
      render: (_: any, record: DriverData) => (
        <div className="flex items-center gap-2">
          <Text className="text-xs font-semibold text-slate-600 dark:text-slate-300">{record.phone}</Text>
          <div className="h-3 w-[1.5px] bg-indigo-200/60 dark:bg-indigo-500/30 rounded-full mx-1" />
          <Text className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{record.mail}</Text>
        </div>
      ),
    },
    {
      title: "Location",
      key: "location",
      render: (_: any, record: DriverData) => (
        <Tooltip title={`${record.address}, ${record.district}, ${record.state}, ${record.pincode}`}>
          <div className="max-w-[200px] truncate text-[12px] text-slate-500 dark:text-slate-400 dark:text-slate-500">
            {record.address}, {record.state}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "District",
      dataIndex: "district",
      key: "district",
      render: (text: string) => <Text className="text-[12px] text-slate-600 dark:text-slate-300 font-medium">{text}</Text>,
    },
    {
      title: "Onboarding Status",
      key: "onboarding",
      render: (_: any, record: DriverData) => {
        if (!record.has_account) {
          return <Tag color="default" className="rounded-full px-3 text-[10px] font-bold uppercase">Not Registered</Tag>;
        }

        const status = record.onboarding_status || 'PHONE_VERIFIED';
        let color = 'cyan';

        if (['ACTIVE', 'SUBSCRIPTION_ACTIVE'].includes(status)) color = 'green';
        else if (['DOCUMENTS_APPROVED', 'DOCS_SUBMITTED'].includes(status)) color = 'blue';
        else if (status === 'DOCS_REJECTED') color = 'red';
        else if (['PROFILE_COMPLETED', 'ADDRESS_COMPLETED'].includes(status)) color = 'cyan';
        else color = 'geekblue';

        return (
          <Tag color={color} className="rounded-full px-3 text-[10px] font-bold uppercase border-none">
            {status.replace(/_/g, ' ')}
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
          <Tag icon={icon} color={color} className="rounded-full px-3 py-0.5 font-bold uppercase text-[10px]">
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
        <Text className="text-[12px] font-medium text-slate-500 dark:text-slate-400 dark:text-slate-500">
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

  return (
    <TitleBar
      title="Driver Outreach"
      description="Streamline driver onboarding and data management through bulk import/export."
      icon={
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center">
          <TableOutlined className="text-white" />
        </div>
      }
      iconBgColor="bg-indigo-600"
      extraContent={
        <Space size="middle">
          {lastSyncedAt && (
            <Text type="secondary" className="text-[11px] font-medium mr-1">
              Last Synced: {dayjs(lastSyncedAt).format("MMM DD, hh:mm A")}
            </Text>
          )}
          <Button
            icon={<SyncOutlined spin={syncing} />}
            onClick={handleSync}
            loading={syncing}
            className="flex items-center gap-2 font-bold shadow-sm border-slate-200 text-slate-600 dark:text-slate-300 h-9"
          >
            Sync
          </Button>
          <Tooltip title="Shortcut: Alt + E">
            <Button
              type="default"
              icon={<DownloadOutlined />}
              onClick={exportTemplate}
              className="rounded-full h-11 px-10 font-bold !bg-gradient-to-r !from-amber-500 !to-orange-500 border-none flex items-center gap-2"
            >
              Export Template
            </Button>
          </Tooltip>
          <Tooltip title="Shortcut: Alt + I">
            <Upload
              beforeUpload={handleImport}
              showUploadList={false}
              accept=".xlsx,.xls,.csv"
              className="import-upload"
            >
              <Button
                type="primary"
                icon={<UploadOutlined />}
                loading={importing}
                className="rounded-xl h-12 px-6 font-bold border-none !bg-gradient-to-r !from-indigo-600 !to-blue-500 hover:scale-[1.02] transition-transform flex items-center"
              >
                Import Data
              </Button>
            </Upload>
          </Tooltip>
        </Space>
      }
    >
      <div className="w-full h-full flex flex-col gap-6 animate-in fade-in duration-500">
        {/* Stats Summary Style Card (Optional but looks premium) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          <Card size="small" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-300 hover:shadow-md group">
            <div className="flex justify-between items-center py-1 px-1">
              <div className="flex flex-col">
                <Text className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider leading-none">Total Imported</Text>
                <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none mt-1.5 italic">Overall records processed</Text>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">{summaryStats.total_processed_rows}</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 flex items-center justify-center transition-all duration-300 group-hover:scale-105 border border-indigo-100/50 dark:border-indigo-500/20">
                  <CloudUploadOutlined className="text-sm" />
                </div>
              </div>
            </div>
          </Card>

          <Card size="small" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-300 hover:shadow-md group">
            <div className="flex justify-between items-center py-1 px-1">
              <div className="flex flex-col">
                <Text className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider leading-none">Active Drivers</Text>
                <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none mt-1.5 italic">Verified and operational</Text>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-emerald-600 tracking-tight leading-none">{summaryStats.active_drivers}</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 flex items-center justify-center transition-all duration-300 group-hover:scale-105 border border-emerald-100/50 dark:border-emerald-500/20">
                  <SafetyCertificateOutlined className="text-sm" />
                </div>
              </div>
            </div>
          </Card>

          <Card size="small" className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all duration-300 hover:shadow-md group">
            <div className="flex justify-between items-center py-1 px-1">
              <div className="flex flex-col">
                <Text className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider leading-none">Pending Review</Text>
                <Text className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none mt-1.5 italic">Awaiting verification</Text>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-amber-500 tracking-tight leading-none">{summaryStats.pending_drivers}</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center transition-all duration-300 group-hover:scale-105 border border-amber-100/50 dark:border-amber-500/20">
                  <ClockCircleOutlined className="text-sm" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Section */}
        <div className="px-2">
          <AdvancedFilters
            filterFields={filterFields}
            applyFilters={applyFilters}
            isStandalone
            onClear={() => setFilters({
              globalSearch: "",
              status: [],
              state: [],
              from: null,
              to: null,
            })}
          />
        </div>

        <div className="flex-grow bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col min-h-0 pb-2">
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
              showTotal: (total) => total > 0 ? `Total ${total} drivers` : "",
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }
            }}
            size="small"
            scroll={{ x: 'max-content', y: 'calc(100vh - 440px)' }}
            sticky
            rowKey={(record, index) => (record?.phone || index || 0).toString() + (index || 0)}
            rowClassName={(_, index) =>
              (index || 0) % 2 === 0 ? "bg-slate-50/50 dark:bg-slate-800/50 hover:bg-indigo-50/30 dark:hover:bg-slate-700/50 transition-colors" : "bg-white dark:bg-slate-800 hover:bg-indigo-50/30 dark:hover:bg-slate-700/50 transition-colors"
            }
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div className="flex flex-col gap-2">
                      <Text className="text-slate-400 dark:text-slate-500 font-medium">No driver data found</Text>
                      <Text type="secondary" className="text-[12px]">Please export the template and import your data to get started.</Text>
                      <div className="mt-2">
                        <Button
                          type="dashed"
                          icon={<DownloadOutlined />}
                          onClick={exportTemplate}
                          className="rounded-lg text-indigo-500 border-indigo-200 dark:border-indigo-500/30"
                        >
                          Download Template
                        </Button>
                      </div>
                    </div>
                  }
                />
              ),
            }}
            className="premium-table"
          />
        </div>
      </div>

      <style>{`
        .premium-table .ant-table-thead > tr > th {
          background: #f8fafc;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #f1f5f9;
          padding: 16px 24px;
        }
        .premium-table .ant-table-tbody > tr > td {
          padding: 16px 24px;
          border-bottom: 1px solid #f8fafc;
        }
        .animate-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dark .premium-table .ant-table-thead > tr > th {
          background: #1e293b;
          color: #94a3b8;
          border-bottom: 2px solid #334155;
        }
        .dark .premium-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #334155;
        }
        .dark .premium-table .ant-table-wrapper .ant-table-pagination.ant-pagination {
          color: #cbd5e1;
        }
        .dark .premium-table .ant-table-cell-row-hover {
          background: transparent !important;
        }
      `}</style>
    </TitleBar>
  );
};

export default DriverReconciliation;
