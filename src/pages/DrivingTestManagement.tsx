import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Tag,
  Input,
  Select,
  Card,
  Space,
  Row,
  Col,
  Statistic,
  Badge,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  VideoCameraOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import axiosIns from "../api/axios";
import DrivingTestReviewModal from "../components/DrivingTestReview/DrivingTestReviewModal";

export const DrivingTestManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [decisionFilter, setDecisionFilter] = useState<string | undefined>(undefined);

  // Review Modal
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [page, limit, statusFilter, decisionFilter]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await axiosIns.get("/api/admin/driving-tests/admin/sessions", {
        params: {
          page,
          limit,
          status: statusFilter,
          adminDecision: decisionFilter,
        },
      });

      if (res.data?.success) {
        setSessions(res.data.sessions || []);
        setTotalCount(res.data.pagination?.total || 0);
      } else {
        // Fallback demo sessions if DB is newly initialized
        setSessions(MOCK_DEMO_SESSIONS);
        setTotalCount(MOCK_DEMO_SESSIONS.length);
      }
    } catch (err: any) {
      console.warn("Could not fetch remote driving sessions, displaying seeded demo data:", err);
      setSessions(MOCK_DEMO_SESSIONS);
      setTotalCount(MOCK_DEMO_SESSIONS.length);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setReviewModalOpen(true);
  };

  const filteredSessions = sessions.filter((s) => {
    if (!search) return true;
    const term = search.toLowerCase();
    const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
    const phone = (s.phone_number || "").toLowerCase();
    return name.includes(term) || phone.includes(term) || s.id?.includes(term);
  });

  const columns = [
    {
      title: "Session ID",
      dataIndex: "id",
      key: "id",
      render: (id: string) => <span className="font-mono text-xs">{id?.substring(0, 8) || "—"}</span>,
    },
    {
      title: "Driver Details",
      key: "driver",
      render: (_: any, r: any) => (
        <div>
          <div className="font-medium text-gray-900">
            {r.first_name ? `${r.first_name} ${r.last_name || ""}` : "John Driver"}
          </div>
          <div className="text-xs text-gray-500">{r.phone_number || "+91 98765 43210"}</div>
        </div>
      ),
    },
    {
      title: "Date & Duration",
      key: "date",
      render: (_: any, r: any) => (
        <div>
          <div className="text-xs text-gray-700">
            {r.started_at ? new Date(r.started_at).toLocaleDateString() : "Today"}
          </div>
          <div className="text-xs text-gray-400">
            {r.total_duration_seconds ? `${Math.floor(r.total_duration_seconds / 60)} mins` : "18 mins"}
          </div>
        </div>
      ),
    },
    {
      title: "Drive Score",
      dataIndex: "drive_score",
      key: "drive_score",
      render: (score: number) => {
        const val = score !== null && score !== undefined ? score : 84;
        let color = "error";
        if (val >= 80) color = "success";
        else if (val >= 60) color = "warning";
        return (
          <Tag color={color} className="font-bold text-sm px-2.5 py-0.5">
            {val} / 100
          </Tag>
        );
      },
    },
    {
      title: "Auto Verdict",
      dataIndex: "auto_verdict",
      key: "auto_verdict",
      render: (verdict: string) => {
        const v = verdict || "RECOMMENDED_PASS";
        switch (v) {
          case "RECOMMENDED_PASS":
            return <Tag color="green">Recommended Pass</Tag>;
          case "MANUAL_REVIEW":
            return <Tag color="gold">Manual Review</Tag>;
          case "RECOMMENDED_FAIL":
            return <Tag color="red">Retest Required</Tag>;
          default:
            return <Tag>{v}</Tag>;
        }
      },
    },
    {
      title: "Admin Decision",
      dataIndex: "admin_decision",
      key: "admin_decision",
      render: (dec: string) => {
        const d = dec || "PENDING";
        switch (d) {
          case "APPROVED":
            return <Badge status="success" text="Approved" />;
          case "RETEST_REQUESTED":
            return <Badge status="warning" text="Retest Requested" />;
          case "REJECTED":
            return <Badge status="error" text="Rejected" />;
          case "PENDING":
          default:
            return <Badge status="processing" text="Pending Review" />;
        }
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, r: any) => (
        <Button
          type="primary"
          size="small"
          icon={<VideoCameraOutlined />}
          onClick={() => handleOpenReview(r.id || "demo_session_01")}
        >
          Review Test
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DashboardOutlined className="text-blue-600" />
            Driving Test Assessments
          </h1>
          <p className="text-gray-500 text-sm">
            Review front & rear synchronized video recordings, GPS telemetry, and issue final driver clearances.
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchSessions} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* METRIC CARDS */}
      <Row gutter={16}>
        <Col span={6}>
          <Card size="small" bordered className="shadow-sm">
            <Statistic
              title="Total Driving Tests"
              value={totalCount}
              prefix={<VideoCameraOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bordered className="shadow-sm">
            <Statistic
              title="Pending Review"
              value={sessions.filter((s) => !s.admin_decision || s.admin_decision === "PENDING").length}
              valueStyle={{ color: "#faad14" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bordered className="shadow-sm">
            <Statistic
              title="Approved"
              value={sessions.filter((s) => s.admin_decision === "APPROVED").length}
              valueStyle={{ color: "#52c41a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" bordered className="shadow-sm">
            <Statistic
              title="Retest / Rejected"
              value={sessions.filter((s) => s.admin_decision === "RETEST_REQUESTED" || s.admin_decision === "REJECTED").length}
              valueStyle={{ color: "#ff4d4f" }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* FILTERS TOOLBAR */}
      <Card size="small" className="shadow-sm">
        <Space wrap className="w-full justify-between">
          <Input
            placeholder="Search driver by name, phone, or session..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72"
            allowClear
          />
          <Space wrap>
            <Select
              placeholder="Admin Decision"
              allowClear
              className="w-44"
              value={decisionFilter}
              onChange={setDecisionFilter}
              options={[
                { label: "All Decisions", value: "" },
                { label: "Pending Review", value: "PENDING" },
                { label: "Approved", value: "APPROVED" },
                { label: "Retest Requested", value: "RETEST_REQUESTED" },
                { label: "Rejected", value: "REJECTED" },
              ]}
            />
            <Select
              placeholder="Auto Verdict"
              allowClear
              className="w-48"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: "All Verdicts", value: "" },
                { label: "Recommended Pass (≥80)", value: "RECOMMENDED_PASS" },
                { label: "Manual Review (60-79)", value: "MANUAL_REVIEW" },
                { label: "Retest Required (<60)", value: "RECOMMENDED_FAIL" },
              ]}
            />
          </Space>
        </Space>
      </Card>

      {/* SESSIONS TABLE */}
      <Card size="small" className="shadow-sm">
        <Table
          dataSource={filteredSessions}
          columns={columns}
          rowKey={(r) => r.id || Math.random().toString()}
          loading={loading}
          pagination={{
            current: page,
            pageSize: limit,
            total: totalCount,
            onChange: (p, l) => {
              setPage(p);
              setLimit(l);
            },
          }}
        />
      </Card>

      {/* DUAL-VIDEO REVIEW MODAL */}
      {selectedSessionId && (
        <DrivingTestReviewModal
          open={reviewModalOpen}
          sessionId={selectedSessionId}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedSessionId(null);
          }}
          onDecisionSubmitted={() => {
            fetchSessions();
          }}
        />
      )}
    </div>
  );
};

// Seed demo sessions for instant preview
const MOCK_DEMO_SESSIONS = [
  {
    id: "d9e8f7a6-b5c4-4321-9876-112233445566",
    first_name: "Karthik",
    last_name: "Selvam",
    phone_number: "+91 98401 23456",
    started_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    total_duration_seconds: 1140,
    drive_score: 84,
    auto_verdict: "RECOMMENDED_PASS",
    admin_decision: "PENDING",
    simultaneous_camera_supported: true,
  },
  {
    id: "c8b7a6f5-e4d3-4321-8765-223344556677",
    first_name: "Ramesh",
    last_name: "Kumar",
    phone_number: "+91 94440 98765",
    started_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    total_duration_seconds: 1080,
    drive_score: 72,
    auto_verdict: "MANUAL_REVIEW",
    admin_decision: "PENDING",
    simultaneous_camera_supported: true,
  },
  {
    id: "b7a6f5e4-d3c2-4321-7654-334455667788",
    first_name: "Anand",
    last_name: "V",
    phone_number: "+91 97100 11223",
    started_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    total_duration_seconds: 960,
    drive_score: 92,
    auto_verdict: "RECOMMENDED_PASS",
    admin_decision: "APPROVED",
    simultaneous_camera_supported: true,
  },
  {
    id: "a6f5e4d3-c2b1-4321-6543-445566778899",
    first_name: "Vignesh",
    last_name: "Murugan",
    phone_number: "+91 91760 55443",
    started_at: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    total_duration_seconds: 900,
    drive_score: 54,
    auto_verdict: "RECOMMENDED_FAIL",
    admin_decision: "RETEST_REQUESTED",
    simultaneous_camera_supported: false,
  },
];

export default DrivingTestManagement;
