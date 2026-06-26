import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  Button,
  Tag,
  Modal,
  Image,
  message,
  Typography,
  Form,
  Input,
  Row,
  Col,
  Select,
  Pagination,
  Dropdown,
  Space,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  EllipsisOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axiosIns from "../api/axios";
import dayjs from "dayjs";

const { Text } = Typography;
const { TextArea } = Input;

export interface TripVerification {
  id: string;
  driver_id: string;
  trip_id: string;
  driver_name: string;
  driver_phone: string;
  selfie_url: string;
  car_image_url: string;
  status: string;
  selfie_status: string;
  car_image_status: string;
  attempt_number: number;
  created_at: string;
}



const TripVerifications: React.FC = () => {
  const [data, setData] = useState<TripVerification[]>([]);
  const [loading, setLoading] = useState(false);
  const [comparisonModalVisible, setComparisonModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [verificationHistory, setVerificationHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rejectingImage, setRejectingImage] = useState<"selfie" | "car" | null>(null);
  const [form] = Form.useForm();

  // Sidebar Layout States
  const [mainTab, setMainTab] = useState<"ALL" | "FIRST" | "REATTEMPT">("ALL");
  const [selfieFilter, setSelfieFilter] = useState<string | null>(null);
  const [carFilter, setCarFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [mainTab, selfieFilter, carFilter, searchQuery]);

  const fetchPendingVerifications = async () => {
    setLoading(true);
    try {
      const res = await axiosIns.get("/api/trip-verification/pending");
      if (res.data?.success) {
        setData(res.data.data || []);
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to fetch verifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const openComparisonModal = async (record: TripVerification) => {
    try {
      const res = await axiosIns.get(`/api/trip-verification/details/${record.id}`);
      if (res.data?.success) {
        setSelectedVerification({
          ...res.data.data.verification,
          profileSelfie: res.data.data.profileSelfie,
          driver: res.data.data.driver,
        });
        setComparisonModalVisible(true);
      }
    } catch (error: any) {
      message.error("Failed to fetch verification details");
    }
  };

  const openHistoryModal = async (record: TripVerification) => {
    setHistoryLoading(true);
    try {
      const res = await axiosIns.get(`/api/trip-verification/history/${record.id}`);
      if (res.data?.success) {
        setVerificationHistory(res.data.data || []);
        setHistoryModalVisible(true);
      }
    } catch (error: any) {
      message.error("Failed to fetch verification history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleGranularVerify = async (
    selfie_status: "approved" | "rejected" | undefined,
    car_status: "approved" | "rejected" | undefined,
    selfie_remarks?: string,
    car_remarks?: string,
  ) => {
    if (!selectedVerification) return;

    try {
      const res = await axiosIns.put(
        `/api/trip-verification/verify-granular/${selectedVerification.id}`,
        {
          selfie_status,
          car_image_status: car_status,
          selfie_remarks,
          car_image_remarks: car_remarks,
        },
      );

      if (res.data?.success) {
        message.success("Verification status updated");
        const updatedVerification = res.data.data;

        if (updatedVerification.status === "pending") {
          setSelectedVerification({
            ...selectedVerification,
            ...updatedVerification,
          });
          setRejectingImage(null);
          form.resetFields();
        } else {
          setComparisonModalVisible(false);
          setRejectingImage(null);
          form.resetFields();
          fetchPendingVerifications();
        }
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to update verification");
    }
  };

  const handleApproveAll = async () => {
    if (!selectedVerification) return;

    try {
      const res = await axiosIns.put(
        `/api/trip-verification/verify-granular/${selectedVerification.id}`,
        {
          selfie_status: "approved",
          car_image_status: "approved",
        },
      );

      if (res.data?.success) {
        message.success("✅ Both selfie & vehicle approved — trip starting!");
        setComparisonModalVisible(false);
        setRejectingImage(null);
        form.resetFields();
        fetchPendingVerifications();
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to approve verification");
    }
  };

  const onRejectSubmit = (values: any) => {
    if (rejectingImage === "selfie") {
      handleGranularVerify("rejected", undefined, values.reason, undefined);
    } else if (rejectingImage === "car") {
      handleGranularVerify(undefined, "rejected", undefined, values.reason);
    }
  };

  // Filter computation logic
  const filteredData = React.useMemo(() => {
    let result = [...data];

    // 1. Sidenav Tab Filter
    if (mainTab === "FIRST") {
      result = result.filter((item) => item.attempt_number === 1);
    } else if (mainTab === "REATTEMPT") {
      result = result.filter((item) => item.attempt_number > 1);
    }

    // 2. Selfie filter
    if (selfieFilter) {
      result = result.filter((item) => item.selfie_status === selfieFilter.toLowerCase());
    }

    // 3. Vehicle Filter
    if (carFilter) {
      result = result.filter((item) => item.car_image_status === carFilter.toLowerCase());
    }

    // 4. Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.driver_name?.toLowerCase().includes(q) ||
          item.driver_phone?.toLowerCase().includes(q) ||
          item.trip_id?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [data, mainTab, selfieFilter, carFilter, searchQuery]);

  // Paginated subset
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Dynamic statistics
  const stats = React.useMemo(() => {
    const list = filteredData;
    const pendingSelfie = list.filter((item) => item.selfie_status === "pending").length;
    const pendingCar = list.filter((item) => item.car_image_status === "pending").length;
    const reattempts = list.filter((item) => item.attempt_number > 1).length;

    return [
      {
        title: "Pending Selfie",
        value: pendingSelfie,
        label: "reviews",
        icon: <EyeOutlined />,
        iconColor: "text-blue-500 dark:text-blue-400",
        iconBg: "bg-blue-50 dark:bg-blue-500/10",
        sparklineColor: "blue",
      },
      {
        title: "Pending Vehicle",
        value: pendingCar,
        label: "reviews",
        icon: <SafetyCertificateOutlined />,
        iconColor: "text-emerald-500 dark:text-emerald-400",
        iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
        sparklineColor: "green",
      },
      {
        title: "Re-attempts",
        value: reattempts,
        label: "submissions",
        icon: <ReloadOutlined />,
        iconColor: "text-amber-500 dark:text-amber-400",
        iconBg: "bg-amber-50 dark:bg-amber-500/10",
        sparklineColor: "orange",
      },
      {
        title: "Total Queued",
        value: list.length,
        label: "trips blocked",
        icon: <SafetyCertificateOutlined />,
        iconColor: "text-rose-500 dark:text-rose-400",
        iconBg: "bg-rose-50 dark:bg-rose-500/10",
        sparklineColor: "red",
      },
    ];
  }, [filteredData]);

  const columns = [
    {
      title: "DATE & TIME",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (text: string) => (
        <span className="font-semibold text-xs text-slate-700 dark:text-slate-350">{dayjs(text).format("MMM DD, YYYY HH:mm")}</span>
      ),
    },
    {
      title: "DRIVER",
      key: "driver",
      width: 200,
      render: (_: any, record: TripVerification) => (
        <div className="flex flex-col min-w-0 gap-0.5">
          <span className="font-extrabold text-slate-800 dark:text-slate-100 tracking-tight text-xs leading-none truncate">
            {record.driver_name || "Unknown"}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {record.driver_phone}
          </span>
        </div>
      ),
    },
    {
      title: "TRIP ID",
      dataIndex: "trip_id",
      key: "trip_id",
      width: 140,
      render: (id: string) => (
        <Text copyable className="dark:text-slate-300 font-medium text-xs dark:[&_.anticon]:text-slate-400">
          {id}
        </Text>
      ),
    },
    {
      title: "ATTEMPT",
      dataIndex: "attempt_number",
      key: "attempt_number",
      width: 110,
      render: (attempt: number) => (
        <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider border-none inline-block ${attempt > 1 ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" : "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"}`}>
          Attempt #{attempt}
        </span>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 80,
      fixed: "right" as const,
      align: "center" as const,
      render: (_: any, record: TripVerification) => {
        const menuItems = [
          {
            key: "review",
            icon: <CheckOutlined className="text-emerald-500" />,
            label: <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">Review Images</span>,
          },
          {
            key: "history",
            icon: <EyeOutlined className="text-blue-500" />,
            label: <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">Audit History</span>,
          },
        ];

        return (
          <Dropdown
            menu={{
              items: menuItems,
              onClick: ({ key }) => {
                if (key === "review") {
                  openComparisonModal(record);
                } else if (key === "history") {
                  openHistoryModal(record);
                }
              },
            }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<EllipsisOutlined className="text-slate-500 dark:text-slate-400 text-base" />}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700/80 p-0 cursor-pointer"
            />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#f8f9fa] dark:bg-[#0b0f19] overflow-hidden">
      {/* Top Navbar */}
      <div className="bg-white dark:bg-slate-800 h-12 px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 z-0 flex-shrink-0">
        {/* Title & Description */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <SafetyCertificateOutlined className="text-base" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 !m-0 !mb-1 leading-none">Verifications</h1>
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0">Driver safety reviews</p>
        </div>

        <div className="relative flex-1 max-w-xl mx-auto flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all h-9">
          <SearchOutlined className="absolute left-3 text-slate-400 text-[16px]" />
          <input
            type="text"
            placeholder="Search driver or trip ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-1.5 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400 border-none shadow-none focus:ring-0"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {filteredData.length} results
          </span>

          <Button
            type="primary"
            icon={<ReloadOutlined className={loading ? "animate-spin" : ""} />}
            onClick={fetchPendingVerifications}
            className="h-9 rounded-lg font-bold text-xs uppercase tracking-wider border-none !bg-slate-800 hover:!bg-slate-700 dark:!bg-slate-700 dark:hover:!bg-slate-600 text-white shadow-sm flex items-center justify-center gap-1.5"
          >
            Refresh Queue
          </Button>
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

              {/* View: All Attempts */}
              <div
                onClick={() => setMainTab("ALL")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "ALL"
                  ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <SafetyCertificateOutlined className="text-xs" />
                  <span>All Attempts</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainTab === "ALL"
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-440"
                  }`}>
                  {data.length}
                </span>
              </div>

              {/* View: First Attempts */}
              <div
                onClick={() => setMainTab("FIRST")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "FIRST"
                  ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <SafetyCertificateOutlined className="text-xs" />
                  <span>First Attempts</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainTab === "FIRST"
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {data.filter(d => d.attempt_number === 1).length}
                </span>
              </div>

              {/* View: Re-attempts */}
              <div
                onClick={() => setMainTab("REATTEMPT")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "REATTEMPT"
                  ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <ReloadOutlined className="text-xs" />
                  <span>Re-attempts</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mainTab === "REATTEMPT"
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {data.filter(d => d.attempt_number > 1).length}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ─── Right Content Area ─────────────────────────────────────── */}
        <div className="flex-grow flex flex-col min-w-0 relative h-full">
          <div className="flex-grow flex flex-col p-3 overflow-y-auto custom-scrollbar gap-2 pb-20">

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

            {/* FILTERS TOOLBAR */}
            <div className="bg-white dark:bg-slate-800 py-1 px-2 rounded-sm border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4 shadow-sm flex-shrink-0 dark-theme-select-override">
              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">
                  Selfie Status:
                </span>
                <Select
                  placeholder="All Statuses"
                  value={selfieFilter}
                  onChange={setSelfieFilter}
                  allowClear
                  className="flex-1 text-xs premium-select-sidebar custom-driver-select min-w-0"
                  options={[
                    { value: "APPROVED", label: "Approved" },
                    { value: "REJECTED", label: "Rejected" },
                    { value: "PENDING", label: "Pending" },
                  ]}
                />
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">
                  Vehicle Status:
                </span>
                <Select
                  placeholder="All Statuses"
                  value={carFilter}
                  onChange={setCarFilter}
                  allowClear
                  className="flex-1 text-xs premium-select-sidebar custom-driver-select min-w-0"
                  options={[
                    { value: "APPROVED", label: "Approved" },
                    { value: "REJECTED", label: "Rejected" },
                    { value: "PENDING", label: "Pending" },
                  ]}
                />
              </div>
            </div>

            {/* Table Container */}
            <div className="flex-grow min-h-0 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden pb-1">
              <Table
                className="premium-table-compact"
                columns={columns}
                dataSource={paginatedData}
                rowKey="id"
                loading={loading}
                pagination={false}
                scroll={{ x: 800 }}
                size="small"
              />
            </div>
          </div>

          {/* Sticky Bottom Pagination Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-805 px-6 flex items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              Showing {filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
              {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} verifications
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

      {/* Comparison Modal */}
      <Modal
        title="Verification Review"
        open={comparisonModalVisible}
        onCancel={() => {
          setComparisonModalVisible(false);
          setRejectingImage(null);
          form.resetFields();
        }}
        width={800}
        footer={null}
        className="dark-modal rounded-none"
      >
        {selectedVerification && (
          <div>
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-none border border-slate-200 dark:border-slate-700">
              <Row gutter={16}>
                <Col span={12} className="dark:text-slate-300">
                  <Text strong className="dark:text-slate-100">
                    Driver:
                  </Text>{" "}
                  {selectedVerification.driver?.name} ({selectedVerification.driver?.phone})
                </Col>
                <Col span={12} className="dark:text-slate-300">
                  <Text strong className="dark:text-slate-100">
                    Trip ID:
                  </Text>{" "}
                  {selectedVerification.trip_id}
                </Col>
              </Row>
            </div>

            {/* Approve All Banner — only when both are still pending */}
            {selectedVerification.selfie_status === "pending" &&
              selectedVerification.car_image_status === "pending" && (
                <div
                  className="mb-4 p-4 rounded-none border border-green-200 bg-green-50 text-center"
                >
                  <Button
                    type="primary"
                    size="large"
                    icon={<SafetyCertificateOutlined />}
                    onClick={handleApproveAll}
                    className="rounded-none h-11 px-8 font-bold !bg-emerald-600 hover:!bg-emerald-700 border-none shadow-[0_4px_14px_rgba(16,185,129,0.2)]"
                  >
                    Approve Both &amp; Start Trip
                  </Button>
                  <div className="mt-2 text-gray-500 text-xs">
                    Or review individually below
                  </div>
                </div>
              )}

            <Row gutter={24}>
              {/* Identity Verification (Selfie) */}
              <Col span={12}>
                <Card title="Identity Verification" size="small" className="h-full rounded-none">
                  <div className="flex gap-4 mb-4">
                    <div className="flex-1 flex flex-col items-center">
                      <Text type="secondary" className="mb-2 text-xs">
                        Profile Photo
                      </Text>
                      {selectedVerification.profileSelfie ? (
                        <Image
                          src={selectedVerification.profileSelfie}
                          alt="Profile"
                          className="rounded-none object-cover"
                          height={150}
                          width={150}
                        />
                      ) : (
                        <div className="w-[150px] h-[150px] bg-gray-100 dark:bg-slate-700 flex items-center justify-center rounded-none text-gray-400 dark:text-slate-400">
                          No Profile Photo
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                      <Text type="secondary" className="mb-2 text-xs">
                        Live Trip Selfie
                      </Text>
                      <Image
                        src={selectedVerification.selfie_url}
                        alt="Live Selfie"
                        className="rounded-none object-cover"
                        height={150}
                        width={150}
                      />
                    </div>
                  </div>

                  {selectedVerification.selfie_status === "pending" &&
                    rejectingImage !== "selfie" ? (
                    <div className="flex gap-2">
                      <Button
                        type="primary"
                        className="bg-green-500 flex-1 rounded-none"
                        icon={<CheckOutlined />}
                        onClick={() => handleGranularVerify("approved", undefined)}
                      >
                        Approve Selfie
                      </Button>
                      <Button
                        danger
                        className="flex-1 rounded-none"
                        icon={<CloseOutlined />}
                        onClick={() => setRejectingImage("selfie")}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : selectedVerification.selfie_status === "pending" &&
                    rejectingImage === "selfie" ? (
                    <Form form={form} onFinish={onRejectSubmit} layout="vertical">
                      <Form.Item
                        name="reason"
                        label="Rejection Reason"
                        rules={[{ required: true, message: "Reason is required" }]}
                      >
                        <TextArea
                          rows={2}
                          className="rounded-none"
                          placeholder="E.g., Face is blurry, not matching profile"
                        />
                      </Form.Item>
                      <Space>
                        <Button danger type="primary" htmlType="submit" className="rounded-none">
                          Confirm Reject
                        </Button>
                        <Button onClick={() => setRejectingImage(null)} className="rounded-none">Cancel</Button>
                      </Space>
                    </Form>
                  ) : (
                    <div className="text-center">
                      <Tag
                        color={selectedVerification.selfie_status === "approved" ? "green" : "red"}
                        className="w-full text-center py-1 rounded-none border-none uppercase tracking-wider font-bold"
                      >
                        Selfie {selectedVerification.selfie_status.toUpperCase()}
                      </Tag>
                    </div>
                  )}
                </Card>
              </Col>

              {/* Vehicle Verification (Car Images) */}
              <Col span={12}>
                <Card title="Vehicle Verification" size="small" className="h-full rounded-none">
                  <div className="flex flex-col items-center mb-4 w-full">
                    <Text type="secondary" className="mb-2 text-xs">
                      Live Car Images (4 Sides)
                    </Text>
                    {selectedVerification.car_images &&
                      selectedVerification.car_images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 w-full">
                        {selectedVerification.car_images.map((img: string, idx: number) => (
                          <div key={idx} className="flex flex-col items-center w-full">
                            <Text type="secondary" className="mb-1 text-[10px] uppercase">
                              View {idx + 1}
                            </Text>
                            <Image
                              src={img}
                              alt={`Car Image ${idx + 1}`}
                              className="rounded-none object-cover w-full"
                              height={100}
                              style={{ width: "100%", objectFit: "cover" }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Image
                        src={selectedVerification.car_image_url}
                        alt="Car Image"
                        className="rounded-none object-cover"
                        height={150}
                        width={250}
                      />
                    )}
                  </div>

                  {selectedVerification.car_image_status === "pending" &&
                    rejectingImage !== "car" ? (
                    <div className="flex gap-2 mt-auto">
                      <Button
                        type="primary"
                        className="bg-green-500 flex-1 rounded-none"
                        icon={<CheckOutlined />}
                        onClick={() => handleGranularVerify(undefined, "approved")}
                      >
                        Approve Car
                      </Button>
                      <Button
                        danger
                        className="flex-1 rounded-none"
                        icon={<CloseOutlined />}
                        onClick={() => setRejectingImage("car")}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : selectedVerification.car_image_status === "pending" &&
                    rejectingImage === "car" ? (
                    <Form form={form} onFinish={onRejectSubmit} layout="vertical">
                      <Form.Item
                        name="reason"
                        label="Rejection Reason"
                        rules={[{ required: true, message: "Reason is required" }]}
                      >
                        <TextArea rows={2} className="rounded-none" placeholder="E.g., License plate not visible" />
                      </Form.Item>
                      <Space>
                        <Button danger type="primary" htmlType="submit" className="rounded-none">
                          Confirm Reject
                        </Button>
                        <Button onClick={() => setRejectingImage(null)} className="rounded-none">Cancel</Button>
                      </Space>
                    </Form>
                  ) : (
                    <div className="text-center mt-auto">
                      <Tag
                        color={
                          selectedVerification.car_image_status === "approved" ? "green" : "red"
                        }
                        className="w-full text-center py-1 rounded-none border-none uppercase tracking-wider font-bold"
                      >
                        Car Image {selectedVerification.car_image_status.toUpperCase()}
                      </Tag>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        title="Verification Audit History"
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        width={900}
        className="dark-modal"
        footer={[
          <Button key="close" className="rounded-none" onClick={() => setHistoryModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        <Table
          dataSource={verificationHistory}
          loading={historyLoading}
          rowKey="id"
          pagination={false}
          className="premium-table-compact"
          columns={[
            {
              title: "TIME",
              dataIndex: "created_at",
              key: "created_at",
              width: 180,
              render: (text: string) => (
                <span className="font-semibold text-xs text-slate-700 dark:text-slate-350">
                  {text ? dayjs(text).format("MMM DD, YYYY HH:mm:ss") : "—"}
                </span>
              ),
            },
            {
              title: "EVENT",
              dataIndex: "event_type",
              key: "event_type",
              render: (type: string) => (
                <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider border-none inline-block ${type === "initial_submission"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                  : type === "reupload"
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                    : "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
                  }`}>
                  {type?.replace("_", " ")}
                </span>
              ),
            },
            {
              title: "IMAGES",
              key: "images",
              render: (_: any, record: any) => (
                <Space>
                  <Image
                    src={record.selfie_url}
                    width={50}
                    height={50}
                    className="rounded-none object-cover"
                  />
                  {record.car_images && record.car_images.length > 0 ? (
                    <Space size={4}>
                      {record.car_images.map((img: string, i: number) => (
                        <Image
                          key={i}
                          src={img}
                          width={40}
                          height={40}
                          className="rounded-none object-cover"
                        />
                      ))}
                    </Space>
                  ) : record.car_image_url ? (
                    <Image
                      src={record.car_image_url}
                      width={80}
                      height={50}
                      className="rounded-none object-cover"
                    />
                  ) : null}
                </Space>
              ),
            },
            {
              title: "STATUS",
              key: "status",
              render: (_: any, record: any) => (
                <div>
                  <div className="flex gap-1.5 mb-1">
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider border-none inline-block ${record.selfie_status === "approved" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                      record.selfie_status === "rejected" ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" :
                        "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-350"
                      }`}>
                      S: {record.selfie_status}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider border-none inline-block ${record.car_image_status === "approved" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                      record.car_image_status === "rejected" ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400" :
                        "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-350"
                      }`}>
                      C: {record.car_image_status}
                    </span>
                  </div>
                  {record.remarks && (
                    <div className="text-[10px] text-gray-500 dark:text-slate-450 italic">"{record.remarks}"</div>
                  )}
                </div>
              ),
            },
            {
              title: "REVIEWER",
              dataIndex: "admin_id",
              key: "admin_id",
              render: (id: string) =>
                id ? (
                  <span className="text-slate-500 dark:text-slate-400 font-semibold text-xs">
                    Admin ID: {id.split("-")[0]}...
                  </span>
                ) : (
                  <span className="text-slate-300 dark:text-slate-750 font-bold">—</span>
                ),
            },
          ]}
        />
      </Modal>

      <style>{`
        /* Filter input styling overrides to match dark mode search bar */
        .custom-driver-select .ant-select-selector {
          border-radius: 8px !important;
          border-color: #cbd5e1 !important;
          height: 34px !important;
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

        /* Table dark mode overrides */
        .dark .premium-table-compact .ant-table {
          background-color: transparent !important;
          color: #cbd5e1 !important;
        }
        .dark .premium-table-compact .ant-table-thead > tr > th {
          background-color: #0f172a !important;
          border-bottom: 1px solid #334155 !important;
          color: #94a3b8 !important;
        }
        .dark .premium-table-compact .ant-table-tbody > tr > td {
          border-bottom: 1px solid #1e293b !important;
        }
        .dark .premium-table-compact .ant-table-tbody > tr.ant-table-row:hover > td {
          background-color: #1e293b !important;
        }
        .dark .premium-table-compact .ant-table-placeholder {
          background-color: transparent !important;
          border-color: #334155 !important;
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

export default TripVerifications;
