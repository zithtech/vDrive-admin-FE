import React from "react";
import { Table, Button, Switch, Tooltip, Space, Tag } from "antd";
import { EditOutlined, DeleteOutlined, UserOutlined, CarOutlined } from "@ant-design/icons";
import { type ReferralConfig } from "../../store/slices/referralSlice";

interface ReferralTableProps {
  data: ReferralConfig[];
  loading: boolean;
  onEdit: (record: ReferralConfig) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, is_active: boolean) => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number, size: number) => void;
}

const ReferralTable: React.FC<ReferralTableProps> = ({
  data,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  canUpdate = false,
  canDelete = false,
  currentPage = 1,
  pageSize = 15,
  onPageChange,
}) => {
  const columns = [
    {
      title: "Target Audience",
      dataIndex: "user_type",
      key: "user_type",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          {text === "CUSTOMER" ? <UserOutlined className="text-blue-500" /> : <CarOutlined className="text-purple-500" />}
          <span className="text-gray-700 capitalize">
            {text.toLowerCase()}
          </span>
        </div>
      ),
    },
    {
      title: "Referrer Reward",
      key: "referrer_reward",
      render: (_: any, record: ReferralConfig) => (
        <Tag color="orange">
          {record.referrer_reward_type === "PERCENTAGE"
            ? `${record.referrer_reward}% DISCOUNT`
            : `₹${record.referrer_reward} CREDIT`}
        </Tag>
      ),
    },
    {
      title: "Referee Reward",
      key: "referee_reward",
      render: (_: any, record: ReferralConfig) => (
        <Tag color="cyan">
          {record.referee_reward_type === "PERCENTAGE"
            ? `${record.referee_reward}% DISCOUNT`
            : `₹${record.referee_reward} CREDIT`}
        </Tag>
      ),
    },
    {
      title: "Status",
      key: "is_active",
      render: (_: any, record: ReferralConfig) => (
        <div className="flex items-center gap-2">
          <Switch
            size="small"
            checked={record.is_active}
            disabled={!canUpdate}
            onChange={(checked) => onToggleStatus(record.id, checked)}
          />
          <span className={`text-xs ${record.is_active ? "text-green-600" : "text-gray-400"}`}>
            {record.is_active ? "Live" : "Paused"}
          </span>
        </div>
      ),
    },
    ...(canUpdate || canDelete
      ? [
          {
            title: "Actions",
            key: "actions",
            render: (_: any, record: ReferralConfig) => (
              <Space size="small">
                {canUpdate && (
                  <Tooltip title="Configure Rule">
                    <Button
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => onEdit(record)}
                      size="small"
                    />
                  </Tooltip>
                )}
                {canDelete && (
                  <Tooltip title="Archive Rule">
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => onDelete(record.id)}
                      size="small"
                    />
                  </Tooltip>
                )}
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={{ position: ["none"], current: currentPage, pageSize: pageSize, onChange: onPageChange }}
      size="middle"
    />
  );
};

export default ReferralTable;
