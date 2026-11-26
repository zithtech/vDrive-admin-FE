import React, { useState } from "react";
import {
  Table,
  Tag,
  Avatar,
  Input,
  Button,
  Select,
  Modal,
  Descriptions,
} from "antd";
import {
  PhoneOutlined,
  UserOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  EyeOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

export interface KycCallRecord {
  id: string;
  driverId: string;
  driverName: string;
  phone: string;
  profilePic?: string;
  callDate: string; // YYYY-MM-DD
  callTime: string; // HH:mm
  durationSeconds: number;
  status: "completed" | "missed" | "rejected" | "cancelled";
  officerName: string;
  verdict?: "APPROVED" | "REJECTED";
  rejectionReasons?: string[];
  notes?: string;
}

// Initial realistic call history data
export const MOCK_KYC_CALL_HISTORY: KycCallRecord[] = [
  {
    id: "call_101",
    driverId: "DRV-1029",
    driverName: "Karthik Subramanian",
    phone: "+91 98401 23456",
    callDate: dayjs().format("YYYY-MM-DD"),
    callTime: "02:30 PM",
    durationSeconds: 245,
    status: "completed",
    officerName: "Compliance Officer - Desk 1",
    verdict: "APPROVED",
    notes: "All original documents (DL, PAN, RC) verified clearly. Face match verified.",
  },
  {
    id: "call_102",
    driverId: "DRV-1044",
    driverName: "Praveen Kumar",
    phone: "+91 97890 87654",
    callDate: dayjs().subtract(1, "day").format("YYYY-MM-DD"),
    callTime: "04:15 PM",
    durationSeconds: 180,
    status: "rejected",
    officerName: "Senior Officer - Desk 2",
    verdict: "REJECTED",
    rejectionReasons: ["BLURRY_DOCUMENT", "EXPIRED_INSURANCE"],
    notes: "Driver was unable to produce original Driving License, showed photocopy.",
  },
  {
    id: "call_103",
    driverId: "DRV-1088",
    driverName: "Manoj Sundaram",
    phone: "+91 90435 22612",
    callDate: dayjs().subtract(1, "day").format("YYYY-MM-DD"),
    callTime: "11:00 AM",
    durationSeconds: 0,
    status: "missed",
    officerName: "Compliance Officer - Desk 1",
    notes: "Driver did not join the scheduled call within the designated time slot.",
  },
  {
    id: "call_104",
    driverId: "DRV-1102",
    driverName: "Senthil Nathan",
    phone: "+91 94441 55667",
    callDate: dayjs().subtract(2, "day").format("YYYY-MM-DD"),
    callTime: "05:45 PM",
    durationSeconds: 45,
    status: "cancelled",
    officerName: "KYC Specialist - Desk 3",
    notes: "Driver cancelled the request before call initialization.",
  },
];

interface VideoKycCallHistorySectionProps {
  historyRecords?: KycCallRecord[];
}

export const VideoKycCallHistorySection: React.FC<VideoKycCallHistorySectionProps> = ({
  historyRecords = MOCK_KYC_CALL_HISTORY,
}) => {
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<KycCallRecord | null>(null);

  // Filter
  const filtered = historyRecords.filter((rec) => {
    const matchesSearch =
      !searchText ||
      rec.driverName.toLowerCase().includes(searchText.toLowerCase()) ||
      rec.driverId.toLowerCase().includes(searchText.toLowerCase()) ||
      rec.phone.includes(searchText);

    const matchesStatus =
      statusFilter === "all" || rec.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatDuration = (seconds: number) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const renderStatusTag = (status: KycCallRecord["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Tag color="success" icon={<CheckCircleOutlined />} className="font-semibold text-xs uppercase">
            Completed (Approved)
          </Tag>
        );
      case "rejected":
        return (
          <Tag color="error" icon={<CloseCircleOutlined />} className="font-semibold text-xs uppercase">
            Rejected
          </Tag>
        );
      case "missed":
        return (
          <Tag color="warning" icon={<ExclamationCircleOutlined />} className="font-semibold text-xs uppercase">
            Missed
          </Tag>
        );
      case "cancelled":
        return (
          <Tag color="default" icon={<StopOutlined />} className="font-semibold text-xs uppercase">
            Cancelled
          </Tag>
        );
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: "DRIVER",
      key: "driver",
      width: 250,
      render: (_: any, r: KycCallRecord) => (
        <div className="flex items-center gap-3">
          <Avatar
            size={38}
            src={r.profilePic}
            icon={<UserOutlined />}
            className="bg-blue-600 text-white font-bold flex-shrink-0"
          >
            {r.driverName[0]}
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
              {r.driverName}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {r.driverId} • {r.phone}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "DATE & TIME",
      key: "datetime",
      width: 170,
      render: (_: any, r: KycCallRecord) => (
        <div className="flex flex-col text-xs font-medium">
          <span className="text-slate-700 dark:text-slate-200 font-semibold">
            {r.callDate}
          </span>
          <span className="text-slate-400 font-mono">{r.callTime}</span>
        </div>
      ),
    },
    {
      title: "DURATION",
      key: "duration",
      width: 120,
      render: (_: any, r: KycCallRecord) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
          {formatDuration(r.durationSeconds)}
        </span>
      ),
    },
    {
      title: "CALL STATUS",
      key: "status",
      width: 180,
      render: (_: any, r: KycCallRecord) => renderStatusTag(r.status),
    },
    {
      title: "OFFICER",
      key: "officer",
      width: 180,
      render: (_: any, r: KycCallRecord) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
          {r.officerName}
        </span>
      ),
    },
    {
      title: "AUDIT & NOTES",
      key: "actions",
      width: 100,
      align: "center" as const,
      render: (_: any, r: KycCallRecord) => (
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setSelectedRecord(r)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="p-4 flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/40 rounded-lg">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <PhoneOutlined className="text-blue-600" />
            <span>Video KYC Call History & Audit Trail</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Historical log of all completed, rejected, missed, and cancelled driver Video KYC calls.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Input
            prefix={<SearchOutlined className="text-slate-400" />}
            placeholder="Search by driver, ID, phone..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            size="middle"
            className="w-60"
          />

          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            className="w-40"
            size="middle"
          >
            <Select.Option value="all">All Call Statuses</Select.Option>
            <Select.Option value="completed">Completed (Approved)</Select.Option>
            <Select.Option value="rejected">Rejected</Select.Option>
            <Select.Option value="missed">Missed</Select.Option>
            <Select.Option value="cancelled">Cancelled</Select.Option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
        />
      </div>

      {/* Call Details Modal */}
      <Modal
        open={!!selectedRecord}
        title={
          <div className="flex items-center gap-2">
            <FileTextOutlined className="text-blue-600" />
            <span>Call Record Audit Details</span>
          </div>
        }
        onCancel={() => setSelectedRecord(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedRecord(null)}>
            Close
          </Button>,
        ]}
        width={560}
        centered
      >
        {selectedRecord && (
          <div className="py-2">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Driver Name">
                <strong>{selectedRecord.driverName}</strong> ({selectedRecord.driverId})
              </Descriptions.Item>
              <Descriptions.Item label="Phone Number">
                {selectedRecord.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Call Date & Time">
                {selectedRecord.callDate} at {selectedRecord.callTime}
              </Descriptions.Item>
              <Descriptions.Item label="Call Duration">
                {formatDuration(selectedRecord.durationSeconds)}
              </Descriptions.Item>
              <Descriptions.Item label="Call Status">
                {renderStatusTag(selectedRecord.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Verification Officer">
                {selectedRecord.officerName}
              </Descriptions.Item>
              {selectedRecord.rejectionReasons && (
                <Descriptions.Item label="Rejection Reasons">
                  <div className="flex flex-wrap gap-1">
                    {selectedRecord.rejectionReasons.map((r, i) => (
                      <Tag color="red" key={i}>
                        {r}
                      </Tag>
                    ))}
                  </div>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Officer Audit Notes">
                {selectedRecord.notes || "No notes recorded."}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VideoKycCallHistorySection;
