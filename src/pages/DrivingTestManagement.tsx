import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
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
  Tabs,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  VideoCameraOutlined,
  DashboardOutlined,
  SyncOutlined,
  EyeOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import axiosIns from "../api/axios";
import DrivingTestReviewModal from "../components/DrivingTestReview/DrivingTestReviewModal";

export type AssessmentViewKey = "pending" | "retest" | "approved" | "rejected";
export type AdminDecisionValue = "PENDING" | "RETEST_REQUESTED" | "APPROVED" | "REJECTED";
export type AutoVerdictValue = "RECOMMENDED_PASS" | "MANUAL_REVIEW" | "RECOMMENDED_FAIL";

export interface DrivingTestSession {
  id: string;
  driver_id?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  t2driver?: string;
  started_at?: string;
  submitted_at?: string;
  total_duration_seconds?: number;
  drive_score?: number | null;
  score_override?: number | null;
  auto_verdict?: AutoVerdictValue | string | null;
  admin_decision?: AdminDecisionValue | string | null;
  admin_notes?: string | null;
  notes?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  reviewed_by_name?: string | null;
  attempt_number?: number | null;
  is_retest?: boolean;
  previous_session_id?: string | null;
  latest_retest_session_id?: string | null;
  retest_submitted?: boolean;
  simultaneous_camera_supported?: boolean;
}

interface ViewCounts {
  total: number;
  pending: number;
  retest: number;
  approved: number;
  rejected: number;
}

const VIEW_TO_DECISION: Record<AssessmentViewKey, AdminDecisionValue> = {
  pending: "PENDING",
  retest: "RETEST_REQUESTED",
  approved: "APPROVED",
  rejected: "REJECTED",
};

const isValidView = (val: string | null): val is AssessmentViewKey =>
  val === "pending" || val === "retest" || val === "approved" || val === "rejected";

const formatDuration = (seconds?: number | null): string => {
  if (seconds == null || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins === 0) return `${secs}s`;
  return `${mins} mins`;
};

const formatDateTime = (iso?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const renderAutoVerdict = (verdict?: string | null) => {
  if (!verdict) return <Tag>—</Tag>;
  switch (verdict) {
    case "RECOMMENDED_PASS":
      return <Tag color="green">Recommended Pass</Tag>;
    case "MANUAL_REVIEW":
      return <Tag color="gold">Manual Review</Tag>;
    case "RECOMMENDED_FAIL":
      return <Tag color="red">Retest Required</Tag>;
    default:
      return <Tag>{verdict}</Tag>;
  }
};

const renderDriveScore = (score?: number | null, overrideScore?: number | null) => {
  const effectiveScore = overrideScore ?? score;
  if (effectiveScore == null) {
    return <span className="text-gray-400 dark:text-slate-500">—</span>;
  }
  let color = "error";
  if (effectiveScore >= 80) color = "success";
  else if (effectiveScore >= 60) color = "warning";

  return (
    <div className="flex flex-col items-start gap-0.5">
      <Tag color={color} className="font-bold text-sm px-2.5 py-0.5 m-0">
        {effectiveScore} / 100
      </Tag>
      {overrideScore != null && score != null && overrideScore !== score && (
        <span className="text-[11px] text-gray-500 dark:text-slate-400">
          Auto: {score} / 100
        </span>
      )}
    </div>
  );
};

const sharedSessionIdColumn: ColumnsType<DrivingTestSession>[number] = {
  title: "Session ID",
  dataIndex: "id",
  key: "id",
  width: 110,
  render: (id: string) => (
    <Tooltip title={id}>
      <span className="font-mono text-xs text-gray-700 dark:text-slate-300">
        {id ? id.substring(0, 8) : "—"}
      </span>
    </Tooltip>
  ),
};

const sharedDriverColumn: ColumnsType<DrivingTestSession>[number] = {
  title: "Driver Details",
  key: "driver",
  render: (_: unknown, r: DrivingTestSession) => {
    const fullName = [r.first_name, r.last_name].filter(Boolean).join(" ") || "Driver";
    const isRetestAttempt =
      Boolean(r.is_retest) || Boolean(r.previous_session_id) || (r.attempt_number ?? 1) > 1;
    return (
      <div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-gray-900 dark:text-slate-100">{fullName}</span>
          {isRetestAttempt && (
            <Tag color="purple" className="m-0 text-[11px] leading-tight">
              {r.attempt_number ? `Retest #${r.attempt_number}` : "Retest"}
            </Tag>
          )}
        </div>
        <div className="text-xs text-gray-500 dark:text-slate-400">
          {r.phone_number || "—"}
          {r.t2driver ? ` • ${r.t2driver}` : ""}
        </div>
      </div>
    );
  },
};

export const DrivingTestManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialViewParam = searchParams.get("view");
  const [activeView, setActiveView] = useState<AssessmentViewKey>(
    isValidView(initialViewParam) ? initialViewParam : "pending"
  );

  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<DrivingTestSession[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [counts, setCounts] = useState<ViewCounts>({
    total: 0,
    pending: 0,
    retest: 0,
    approved: 0,
    rejected: 0,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [verdictFilter, setVerdictFilter] = useState<AutoVerdictValue | undefined>(undefined);

  // Review Modal
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const requestSeqRef = useRef(0);

  // Sync view if URL query changes externally
  useEffect(() => {
    const param = searchParams.get("view");
    if (isValidView(param) && param !== activeView) {
      setActiveView(param);
      setPage(1);
    }
  }, [searchParams, activeView]);

  const applyMockFallback = useCallback(
    (view: AssessmentViewKey, verdict: AutoVerdictValue | undefined, currentPage: number, pageSize: number) => {
      const targetDecision = VIEW_TO_DECISION[view];
      const byView = MOCK_DEMO_SESSIONS.filter((s) => {
        const dec = s.admin_decision || "PENDING";
        return dec === targetDecision;
      });
      const byVerdict = verdict
        ? byView.filter((s) => s.auto_verdict === verdict)
        : byView;

      const start = (currentPage - 1) * pageSize;
      setSessions(byVerdict.slice(start, start + pageSize));
      setTotalCount(byVerdict.length);

      setCounts({
        total: MOCK_DEMO_SESSIONS.length,
        pending: MOCK_DEMO_SESSIONS.filter((s) => (s.admin_decision || "PENDING") === "PENDING").length,
        retest: MOCK_DEMO_SESSIONS.filter((s) => s.admin_decision === "RETEST_REQUESTED").length,
        approved: MOCK_DEMO_SESSIONS.filter((s) => s.admin_decision === "APPROVED").length,
        rejected: MOCK_DEMO_SESSIONS.filter((s) => s.admin_decision === "REJECTED").length,
      });
    },
    []
  );

  const fetchCounts = useCallback(async (seq: number) => {
    try {
      const decisions: AdminDecisionValue[] = ["PENDING", "RETEST_REQUESTED", "APPROVED", "REJECTED"];
      const responses = await Promise.all(
        decisions.map((adminDecision) =>
          axiosIns.get("/api/admin/driving-tests/admin/sessions", {
            params: { page: 1, limit: 1, adminDecision },
          })
        )
      );

      if (seq !== requestSeqRef.current) return;

      const totals = responses.map((r) => {
        if (!r.data?.success) return 0;
        return r.data.pagination?.total ?? r.data.sessions?.length ?? 0;
      });
      const [pending, retest, approved, rejected] = totals;
      setCounts({
        total: pending + retest + approved + rejected,
        pending,
        retest,
        approved,
        rejected,
      });
    } catch {
      // Counts fallback is handled if main fetchSessions falls back to mock data
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    const adminDecision = VIEW_TO_DECISION[activeView];
    setLoading(true);

    try {
      const res = await axiosIns.get("/api/admin/driving-tests/admin/sessions", {
        params: {
          page,
          limit,
          status: verdictFilter,
          adminDecision,
        },
      });

      if (seq !== requestSeqRef.current) return;

      if (res.data?.success) {
        const fetchedSessions: DrivingTestSession[] = res.data.sessions || [];
        // Defensive guard in case backend returns mixed rows when adminDecision is applied
        const matchingRows = fetchedSessions.filter(
          (s) => (s.admin_decision || "PENDING") === adminDecision
        );
        const rows =
          matchingRows.length === fetchedSessions.length ? fetchedSessions : matchingRows;

        setSessions(rows);
        setTotalCount(res.data.pagination?.total ?? rows.length);

        const serverCounts = res.data.counts || res.data.summary;
        if (serverCounts) {
          const pending = serverCounts.pending ?? serverCounts.PENDING ?? 0;
          const retest =
            serverCounts.retestRequested ??
            serverCounts.retest ??
            serverCounts.RETEST_REQUESTED ??
            0;
          const approved = serverCounts.approved ?? serverCounts.APPROVED ?? 0;
          const rejected = serverCounts.rejected ?? serverCounts.REJECTED ?? 0;
          setCounts({
            total: serverCounts.total ?? pending + retest + approved + rejected,
            pending,
            retest,
            approved,
            rejected,
          });
        } else {
          fetchCounts(seq);
        }
      } else {
        applyMockFallback(activeView, verdictFilter, page, limit);
      }
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      console.warn("Could not fetch remote driving sessions, displaying seeded demo data:", err);
      applyMockFallback(activeView, verdictFilter, page, limit);
    } finally {
      if (seq === requestSeqRef.current) {
        setLoading(false);
      }
    }
  }, [activeView, page, limit, verdictFilter, applyMockFallback, fetchCounts]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleViewChange = (nextView: AssessmentViewKey) => {
    setActiveView(nextView);
    setPage(1);
    setSearchParams({ view: nextView });
  };

  const handleVerdictChange = (val: AutoVerdictValue | undefined) => {
    setVerdictFilter(val);
    setPage(1);
  };

  const handleOpenReview = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setReviewModalOpen(true);
  };

  const filteredSessions = useMemo(() => {
    if (!search.trim()) return sessions;
    const term = search.trim().toLowerCase();
    return sessions.filter((s) => {
      const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
      const phone = (s.phone_number || "").toLowerCase();
      const driverCode = (s.t2driver || s.driver_id || "").toLowerCase();
      const remarks = (s.admin_notes || s.notes || "").toLowerCase();
      return (
        name.includes(term) ||
        phone.includes(term) ||
        driverCode.includes(term) ||
        remarks.includes(term) ||
        s.id?.toLowerCase().includes(term)
      );
    });
  }, [sessions, search]);

  const columns: ColumnsType<DrivingTestSession> = useMemo(() => {
    if (activeView === "retest") {
      return [
        sharedSessionIdColumn,
        sharedDriverColumn,
        {
          title: "Requested On",
          key: "requested_on",
          render: (_: unknown, r: DrivingTestSession) => (
            <div>
              <div className="text-xs text-gray-700 dark:text-slate-200">
                {formatDateTime(r.reviewed_at || r.started_at)}
              </div>
              <div className="text-xs text-gray-400 dark:text-slate-500">
                Test Duration: {formatDuration(r.total_duration_seconds)}
              </div>
            </div>
          ),
        },
        {
          title: "Prior Score",
          key: "drive_score",
          render: (_: unknown, r: DrivingTestSession) =>
            renderDriveScore(r.drive_score, r.score_override),
        },
        {
          title: "Retest Reason",
          key: "retest_reason",
          ellipsis: true,
          render: (_: unknown, r: DrivingTestSession) => {
            const note = r.admin_notes || r.notes;
            return note ? (
              <Tooltip title={note}>
                <span className="text-xs text-gray-700 dark:text-slate-300 line-clamp-2 max-w-[260px]">
                  {note}
                </span>
              </Tooltip>
            ) : (
              <span className="text-xs text-gray-400">No remarks recorded</span>
            );
          },
        },
        {
          title: "Retest Status",
          key: "retest_status",
          render: (_: unknown, r: DrivingTestSession) =>
            r.retest_submitted || r.latest_retest_session_id ? (
              <Badge status="processing" text="New Attempt Submitted" />
            ) : (
              <Badge status="warning" text="Awaiting Driver Retake" />
            ),
        },
        {
          title: "Action",
          key: "action",
          render: (_: unknown, r: DrivingTestSession) => (
            <Space size="small">
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleOpenReview(r.id)}
              >
                View Assessment
              </Button>
              {r.latest_retest_session_id && (
                <Button
                  type="primary"
                  size="small"
                  icon={<VideoCameraOutlined />}
                  onClick={() => handleOpenReview(r.latest_retest_session_id!)}
                >
                  Review New Attempt
                </Button>
              )}
            </Space>
          ),
        },
      ];
    }

    if (activeView === "approved" || activeView === "rejected") {
      const isApproved = activeView === "approved";
      return [
        sharedSessionIdColumn,
        sharedDriverColumn,
        {
          title: isApproved ? "Approved On" : "Rejected On",
          key: "reviewed_at",
          render: (_: unknown, r: DrivingTestSession) => (
            <div>
              <div className="text-xs text-gray-700 dark:text-slate-200">
                {formatDateTime(r.reviewed_at || r.started_at)}
              </div>
              {r.reviewed_by_name && (
                <div className="text-xs text-gray-400 dark:text-slate-500">
                  By {r.reviewed_by_name}
                </div>
              )}
            </div>
          ),
        },
        {
          title: "Final Score",
          key: "drive_score",
          render: (_: unknown, r: DrivingTestSession) =>
            renderDriveScore(r.drive_score, r.score_override),
        },
        {
          title: "Auto Verdict",
          dataIndex: "auto_verdict",
          key: "auto_verdict",
          render: (verdict: string | null) => renderAutoVerdict(verdict),
        },
        {
          title: "Review Remarks",
          key: "remarks",
          ellipsis: true,
          render: (_: unknown, r: DrivingTestSession) => {
            const note = r.admin_notes || r.notes;
            return note ? (
              <Tooltip title={note}>
                <span className="text-xs text-gray-700 dark:text-slate-300 line-clamp-2 max-w-[260px]">
                  {note}
                </span>
              </Tooltip>
            ) : (
              <span className="text-xs text-gray-400">—</span>
            );
          },
        },
        {
          title: "Decision",
          key: "decision",
          render: () =>
            isApproved ? (
              <Badge status="success" text="Approved" />
            ) : (
              <Badge status="error" text="Rejected" />
            ),
        },
        {
          title: "Action",
          key: "action",
          render: (_: unknown, r: DrivingTestSession) => (
            <Button
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => handleOpenReview(r.id)}
            >
              View Report
            </Button>
          ),
        },
      ];
    }

    // Default: "pending" (Pending Verification)
    return [
      sharedSessionIdColumn,
      sharedDriverColumn,
      {
        title: "Submitted & Duration",
        key: "date",
        render: (_: unknown, r: DrivingTestSession) => (
          <div>
            <div className="text-xs text-gray-700 dark:text-slate-200">
              {formatDateTime(r.submitted_at || r.started_at)}
            </div>
            <div className="text-xs text-gray-400 dark:text-slate-500">
              {formatDuration(r.total_duration_seconds)}
            </div>
          </div>
        ),
      },
      {
        title: "Drive Score",
        key: "drive_score",
        render: (_: unknown, r: DrivingTestSession) =>
          renderDriveScore(r.drive_score, r.score_override),
      },
      {
        title: "Auto Verdict",
        dataIndex: "auto_verdict",
        key: "auto_verdict",
        render: (verdict: string | null) => renderAutoVerdict(verdict),
      },
      {
        title: "Status",
        key: "status",
        render: () => <Badge status="processing" text="Pending Verification" />,
      },
      {
        title: "Action",
        key: "action",
        render: (_: unknown, r: DrivingTestSession) => (
          <Button
            type="primary"
            size="small"
            icon={<VideoCameraOutlined />}
            onClick={() => handleOpenReview(r.id)}
          >
            Review & Verify
          </Button>
        ),
      },
    ];
  }, [activeView]);

  const tabItems = [
    {
      key: "pending",
      label: (
        <span className="flex items-center gap-2">
          <ClockCircleOutlined className="text-amber-500" />
          <span>Pending Verification</span>
          <Badge count={counts.pending} showZero color="#faad14" />
        </span>
      ),
    },
    {
      key: "retest",
      label: (
        <span className="flex items-center gap-2">
          <SyncOutlined className="text-orange-500" />
          <span>Retest Assessments</span>
          <Badge count={counts.retest} showZero color="#f97316" />
        </span>
      ),
    },
    {
      key: "approved",
      label: (
        <span className="flex items-center gap-2">
          <CheckCircleOutlined className="text-green-600" />
          <span>Approved</span>
          <Badge count={counts.approved} showZero color="#52c41a" />
        </span>
      ),
    },
    {
      key: "rejected",
      label: (
        <span className="flex items-center gap-2">
          <CloseCircleOutlined className="text-red-500" />
          <span>Rejected</span>
          <Badge count={counts.rejected} showZero color="#ff4d4f" />
        </span>
      ),
    },
  ];

  const cardClass = (view?: AssessmentViewKey) =>
    `shadow-sm transition-all ${
      view
        ? `cursor-pointer hover:border-blue-400 ${
            activeView === view ? "ring-2 ring-blue-500/40 border-blue-500" : ""
          }`
        : ""
    }`;

  return (
    <div className="p-6 space-y-5">
      {/* PAGE HEADER */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2 m-0">
            <DashboardOutlined className="text-blue-600" />
            Driving Test Assessments
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-sm mt-1 mb-0">
            Verify pending assessments, track driver retest requests, and audit approved clearances separately.
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={fetchSessions} loading={loading}>
          Refresh
        </Button>
      </div>

      {/* SEPARATE METRIC CARDS */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={4}>
          <Card size="small" className={cardClass()}>
            <Statistic
              title="Total Tests"
              value={counts.total}
              prefix={<VideoCameraOutlined className="text-blue-500" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card
            size="small"
            className={cardClass("pending")}
            onClick={() => handleViewChange("pending")}
          >
            <Statistic
              title="Pending Verification"
              value={counts.pending}
              valueStyle={{ color: "#d97706" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card
            size="small"
            className={cardClass("retest")}
            onClick={() => handleViewChange("retest")}
          >
            <Statistic
              title="Retest Assessments"
              value={counts.retest}
              valueStyle={{ color: "#ea580c" }}
              prefix={<SyncOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card
            size="small"
            className={cardClass("approved")}
            onClick={() => handleViewChange("approved")}
          >
            <Statistic
              title="Approved"
              value={counts.approved}
              valueStyle={{ color: "#16a34a" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={5}>
          <Card
            size="small"
            className={cardClass("rejected")}
            onClick={() => handleViewChange("rejected")}
          >
            <Statistic
              title="Rejected"
              value={counts.rejected}
              valueStyle={{ color: "#dc2626" }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* VIEWS TABS + TOOLBAR + TABLE */}
      <Card size="small" className="shadow-sm">
        <Tabs
          activeKey={activeView}
          onChange={(k) => handleViewChange(k as AssessmentViewKey)}
          items={tabItems}
          className="mb-2"
        />

        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <Input
            placeholder="Search by driver name, phone, T2D ID, remarks, or session..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-80 max-w-full"
            allowClear
          />
          <Select
            placeholder="Filter by Auto Verdict"
            allowClear
            className="w-52"
            value={verdictFilter}
            onChange={handleVerdictChange}
            options={[
              { label: "Recommended Pass (≥80)", value: "RECOMMENDED_PASS" },
              { label: "Manual Review (60-79)", value: "MANUAL_REVIEW" },
              { label: "Retest Required (<60)", value: "RECOMMENDED_FAIL" },
            ]}
          />
        </div>

        <Table
          dataSource={filteredSessions}
          columns={columns}
          rowKey={(r) => r.id}
          loading={loading}
          scroll={{ x: 900 }}
          locale={{
            emptyText:
              activeView === "pending"
                ? "No assessments pending verification."
                : activeView === "retest"
                  ? "No drivers currently awaiting a retest assessment."
                  : activeView === "approved"
                    ? "No approved driving test assessments found."
                    : "No rejected driving test assessments found.",
          }}
          pagination={{
            current: page,
            pageSize: limit,
            total: search.trim() ? filteredSessions.length : totalCount,
            showSizeChanger: true,
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

// Seed demo sessions for fallback preview when API is unreachable
const MOCK_DEMO_SESSIONS: DrivingTestSession[] = [
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
    attempt_number: 1,
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
    attempt_number: 2,
    is_retest: true,
    simultaneous_camera_supported: true,
  },
  {
    id: "b7a6f5e4-d3c2-4321-7654-334455667788",
    first_name: "Anand",
    last_name: "V",
    phone_number: "+91 97100 11223",
    started_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    reviewed_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    total_duration_seconds: 960,
    drive_score: 92,
    auto_verdict: "RECOMMENDED_PASS",
    admin_decision: "APPROVED",
    admin_notes: "Smooth braking, lane discipline, and clean reverse parking verified.",
    simultaneous_camera_supported: true,
  },
  {
    id: "a6f5e4d3-c2b1-4321-6543-445566778899",
    first_name: "Vignesh",
    last_name: "Murugan",
    phone_number: "+91 91760 55443",
    started_at: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    reviewed_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    total_duration_seconds: 900,
    drive_score: 54,
    auto_verdict: "RECOMMENDED_FAIL",
    admin_decision: "RETEST_REQUESTED",
    admin_notes: "Multiple harsh braking events and missed reverse parking alignment. Retest requested.",
    attempt_number: 1,
    simultaneous_camera_supported: false,
  },
];

export default DrivingTestManagement;
