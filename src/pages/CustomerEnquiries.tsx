import React, { useState, useEffect, useCallback } from "react";
import {
  Layout,
  Tag,
  Button,
  Typography,
  Input,
  Select,
  DatePicker,
  Table,
  Drawer,
  Spin,
  Empty,
  Tooltip,
  message,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  MailOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  MessageOutlined,
  CloseCircleOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import axiosIns from "../api/axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Content, Sider } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

/* ─── Types ─────────────────────────────────────────────────────── */

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  status: "new" | "read" | "replied" | "closed";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface EnquiryStats {
  total: string;
  new: string;
  read: string;
  replied: string;
  closed: string;
}

/* ─── Status Meta ───────────────────────────────────────────────── */

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  new: {
    label: "New",
    color: "text-blue-700 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-500/10",
    icon: <InboxOutlined />,
  },
  read: {
    label: "Read",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    icon: <EyeOutlined />,
  },
  replied: {
    label: "Replied",
    color: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    icon: <MessageOutlined />,
  },
  closed: {
    label: "Closed",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-500/10",
    icon: <CloseCircleOutlined />,
  },
};

/* ─── Stat Card Component ───────────────────────────────────────── */

const StatCard: React.FC<{
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  active?: boolean;
  onClick?: () => void;
}> = ({ title, count, icon, color, bgColor, borderColor, active, onClick }) => (
  <button
    onClick={onClick}
    className={`stat-card ${active ? "stat-card--active" : ""}`}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "16px 20px",
      borderRadius: 14,
      border: active ? `2px solid ${borderColor}` : "1px solid var(--border-color, #e5e7eb)",
      background: active ? bgColor : "var(--card-bg, #fff)",
      cursor: "pointer",
      transition: "all 0.2s ease",
      width: "100%",
      textAlign: "left",
    }}
  >
    <span
      style={{
        width: 42,
        height: 42,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        background: bgColor,
        color,
      }}
    >
      {icon}
    </span>
    <div>
      <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1.1 }}>{count}</div>
      <div style={{ fontSize: 12, color: "var(--text-secondary, #6b7280)", marginTop: 2 }}>{title}</div>
    </div>
  </button>
);

/* ─── Main Component ────────────────────────────────────────────── */

const CustomerEnquiries: React.FC = () => {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [stats, setStats] = useState<EnquiryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Detail drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [notesLoading, setNotesLoading] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  /* ─── Fetch Data ──────────────────────────────────────────────── */

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axiosIns.get("/api/enquiries/stats");
      if (data.success) setStats(data.data);
    } catch {
      // silently fail
    }
  }, []);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize };
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchText.trim()) params.search = searchText.trim();
      if (dateRange?.[0]) params.startDate = dateRange[0].startOf("day").toISOString();
      if (dateRange?.[1]) params.endDate = dateRange[1].endOf("day").toISOString();

      const { data } = await axiosIns.get("/api/enquiries", { params });
      if (data.success) {
        setEnquiries(data.data);
        setTotal(data.pagination.total);
      }
    } catch {
      message.error("Failed to load enquiries");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, searchText, dateRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  /* ─── Actions ─────────────────────────────────────────────────── */

  const handleStatusChange = async (enquiryId: string, newStatus: string) => {
    setStatusUpdateLoading(true);
    try {
      const { data } = await axiosIns.patch(`/api/enquiries/${enquiryId}/status`, {
        status: newStatus,
      });
      if (data.success) {
        message.success(`Status updated to ${newStatus}`);
        if (selectedEnquiry?.id === enquiryId) {
          setSelectedEnquiry(data.data);
        }
        fetchEnquiries();
        fetchStats();
      }
    } catch {
      message.error("Failed to update status");
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedEnquiry) return;
    setNotesLoading(true);
    try {
      const { data } = await axiosIns.patch(`/api/enquiries/${selectedEnquiry.id}/notes`, {
        admin_notes: adminNotes,
      });
      if (data.success) {
        message.success("Notes saved");
        setSelectedEnquiry(data.data);
        fetchEnquiries();
      }
    } catch {
      message.error("Failed to save notes");
    } finally {
      setNotesLoading(false);
    }
  };

  const openDrawer = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setAdminNotes(enquiry.admin_notes || "");
    setDrawerOpen(true);

    // Auto-mark as read if new
    if (enquiry.status === "new") {
      handleStatusChange(enquiry.id, "read");
    }
  };

  const handleRefresh = () => {
    fetchEnquiries();
    fetchStats();
  };

  /* ─── Table Columns ───────────────────────────────────────────── */

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: 180,
      render: (name: string, record: Enquiry) => (
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50"
            style={{ width: 34, height: 34, fontSize: 13, fontWeight: 600, flexShrink: 0 }}
          >
            {name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate text-gray-900 dark:text-gray-100">
              {name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      width: 140,
      render: (phone: string) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">{phone}</span>
      ),
    },
    {
      title: "Service Needed",
      dataIndex: "service",
      key: "service",
      ellipsis: true,
      render: (service: string) => (
        <Tooltip title={service}>
          <span className="text-sm text-gray-600 dark:text-gray-400">{service}</span>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status: string) => {
        const meta = STATUS_META[status] || STATUS_META.new;
        return (
          <Tag
            className={`${meta.bg} ${meta.color} border-0 rounded-full px-2.5 py-0.5 text-xs font-semibold`}
          >
            {meta.icon} {meta.label}
          </Tag>
        );
      },
    },
    {
      title: "Received",
      dataIndex: "created_at",
      key: "created_at",
      width: 150,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format("DD MMM YYYY, hh:mm A")}>
          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <ClockCircleOutlined /> {dayjs(date).fromNow()}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_: any, record: Enquiry) => (
        <Button
          type="link"
          size="small"
          onClick={() => openDrawer(record)}
          className="text-blue-600 dark:text-blue-400"
        >
          View
        </Button>
      ),
    },
  ];

  /* ─── Render ──────────────────────────────────────────────────── */

  return (
    <div className="w-full h-full flex flex-col">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700/60">
        <div>
          <Title level={4} className="!mb-0 !text-gray-900 dark:!text-gray-100">
            Customer Enquiries
          </Title>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            Manage enquiries submitted from the T2Drive landing page
          </Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          className="dark:text-gray-300 dark:border-gray-600"
        >
          Refresh
        </Button>
      </div>

      {/* ─── Stats Cards ─────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-2">
        <div className="grid grid-cols-5 gap-3">
          <StatCard
            title="Total"
            count={parseInt(stats?.total || "0")}
            icon={<MailOutlined />}
            color="#6366f1"
            bgColor="#eef2ff"
            borderColor="#6366f1"
            active={statusFilter === "all"}
            onClick={() => { setStatusFilter("all"); setPage(1); }}
          />
          <StatCard
            title="New"
            count={parseInt(stats?.new || "0")}
            icon={<InboxOutlined />}
            color="#3b82f6"
            bgColor="#eff6ff"
            borderColor="#3b82f6"
            active={statusFilter === "new"}
            onClick={() => { setStatusFilter("new"); setPage(1); }}
          />
          <StatCard
            title="Read"
            count={parseInt(stats?.read || "0")}
            icon={<EyeOutlined />}
            color="#f59e0b"
            bgColor="#fffbeb"
            borderColor="#f59e0b"
            active={statusFilter === "read"}
            onClick={() => { setStatusFilter("read"); setPage(1); }}
          />
          <StatCard
            title="Replied"
            count={parseInt(stats?.replied || "0")}
            icon={<CheckCircleOutlined />}
            color="#10b981"
            bgColor="#ecfdf5"
            borderColor="#10b981"
            active={statusFilter === "replied"}
            onClick={() => { setStatusFilter("replied"); setPage(1); }}
          />
          <StatCard
            title="Closed"
            count={parseInt(stats?.closed || "0")}
            icon={<CloseCircleOutlined />}
            color="#6b7280"
            bgColor="#f9fafb"
            borderColor="#6b7280"
            active={statusFilter === "closed"}
            onClick={() => { setStatusFilter("closed"); setPage(1); }}
          />
        </div>
      </div>

      {/* ─── Main Area ───────────────────────────────────────────── */}
      <Layout className="flex-1 bg-transparent">
        {/* ─── Left Sidebar ──────────────────────────────────────── */}
        <Sider
          width={280}
          className="!bg-white dark:!bg-[#111827] border-r border-gray-200 dark:border-gray-700/60 p-4"
          style={{ overflow: "auto" }}
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Search
              </label>
              <Input
                placeholder="Name, email, or phone"
                prefix={<SearchOutlined className="text-gray-400" />}
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
                allowClear
                className="dark:bg-gray-800 dark:border-gray-600"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Status
              </label>
              <Select
                value={statusFilter}
                onChange={(v) => { setStatusFilter(v); setPage(1); }}
                className="w-full"
                options={[
                  { value: "all", label: "All Statuses" },
                  { value: "new", label: "🔵 New" },
                  { value: "read", label: "🟡 Read" },
                  { value: "replied", label: "🟢 Replied" },
                  { value: "closed", label: "⚫ Closed" },
                ]}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Date Range
              </label>
              <RangePicker
                value={dateRange as any}
                onChange={(dates) => { setDateRange(dates as any); setPage(1); }}
                className="w-full dark:bg-gray-800 dark:border-gray-600"
                allowClear
              />
            </div>

            <Button
              block
              onClick={() => {
                setStatusFilter("all");
                setSearchText("");
                setDateRange(null);
                setPage(1);
              }}
              className="dark:text-gray-300 dark:border-gray-600"
            >
              Clear Filters
            </Button>
          </div>
        </Sider>

        {/* ─── Table Content ─────────────────────────────────────── */}
        <Content className="p-4 overflow-auto">
          <Spin spinning={loading}>
            {enquiries.length === 0 && !loading ? (
              <Empty
                description="No enquiries found"
                className="mt-20"
              />
            ) : (
              <Table
                dataSource={enquiries}
                columns={columns}
                rowKey="id"
                size="middle"
                onRow={(record) => ({
                  onClick: () => openDrawer(record),
                  style: {
                    cursor: "pointer",
                    background: record.status === "new" ? "var(--new-enquiry-bg, #f0f7ff)" : undefined,
                  },
                })}
                pagination={{
                  current: page,
                  pageSize,
                  total,
                  showTotal: (t) => `${t} enquiries`,
                  onChange: (p) => setPage(p),
                  showSizeChanger: false,
                }}
                className="enquiries-table"
              />
            )}
          </Spin>
        </Content>
      </Layout>

      {/* ─── Detail Drawer ───────────────────────────────────────── */}
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <MailOutlined className="text-blue-500" />
            <span>Enquiry Details</span>
          </div>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
        destroyOnClose
      >
        {selectedEnquiry && (
          <div className="space-y-6">
            {/* Contact Info */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                  style={{ width: 48, height: 48, fontSize: 18, fontWeight: 700 }}
                >
                  {selectedEnquiry.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {selectedEnquiry.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {dayjs(selectedEnquiry.created_at).format("DD MMM YYYY, hh:mm A")}
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm">
                  <MailOutlined className="text-gray-400" />
                  <a
                    href={`mailto:${selectedEnquiry.email}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {selectedEnquiry.email}
                  </a>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <PhoneOutlined className="text-gray-400" />
                  <a
                    href={`tel:${selectedEnquiry.phone}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {selectedEnquiry.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Service Description */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Service Needed
              </label>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {selectedEnquiry.service}
              </div>
            </div>

            {/* Status Control */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Status
              </label>
              <Select
                value={selectedEnquiry.status}
                onChange={(v) => handleStatusChange(selectedEnquiry.id, v)}
                className="w-full"
                loading={statusUpdateLoading}
                options={[
                  { value: "new", label: "🔵 New" },
                  { value: "read", label: "🟡 Read" },
                  { value: "replied", label: "🟢 Replied" },
                  { value: "closed", label: "⚫ Closed" },
                ]}
              />
            </div>

            {/* Admin Notes */}
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Admin Notes
              </label>
              <Input.TextArea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                placeholder="Add internal notes about this enquiry…"
                className="dark:bg-gray-800 dark:border-gray-600"
              />
              <Button
                type="primary"
                className="mt-2"
                loading={notesLoading}
                onClick={handleSaveNotes}
              >
                Save Notes
              </Button>
            </div>

            {/* Timeline */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">
                Timeline
              </label>
              <div className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined />
                  <span>Received: {dayjs(selectedEnquiry.created_at).format("DD MMM YYYY, hh:mm A")}</span>
                </div>
                {selectedEnquiry.updated_at !== selectedEnquiry.created_at && (
                  <div className="flex items-center gap-2">
                    <CheckCircleOutlined />
                    <span>Last updated: {dayjs(selectedEnquiry.updated_at).format("DD MMM YYYY, hh:mm A")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ─── Inline Styles ───────────────────────────────────────── */}
      <style>{`
        .dark .stat-card {
          --border-color: #374151;
          --card-bg: #111827;
          --text-secondary: #9ca3af;
        }
        .stat-card {
          --border-color: #e5e7eb;
          --card-bg: #fff;
          --text-secondary: #6b7280;
        }
        .stat-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .dark .stat-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .dark .enquiries-table .ant-table {
          background: #111827 !important;
        }
        .dark .enquiries-table .ant-table-thead > tr > th {
          background: #1f2937 !important;
          color: #d1d5db !important;
          border-color: #374151 !important;
        }
        .dark .enquiries-table .ant-table-tbody > tr > td {
          border-color: #1f2937 !important;
          color: #e5e7eb !important;
        }
        .dark .enquiries-table .ant-table-tbody > tr:hover > td {
          background: #1f2937 !important;
        }
        .dark {
          --new-enquiry-bg: rgba(59, 130, 246, 0.06);
        }
        :root {
          --new-enquiry-bg: #f0f7ff;
        }
        .enquiries-table .ant-table-tbody > tr {
          transition: background-color 0.15s ease;
        }
      `}</style>
    </div>
  );
};

export default CustomerEnquiries;
