import React from "react";
import { Table, Button, Switch, Tooltip, Space } from "antd";
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
}

const ReferralTable: React.FC<ReferralTableProps> = ({
  data,
  loading,
  onEdit,
  onDelete,
  onToggleStatus,
  canUpdate = false,
  canDelete = false,
}) => {
  const columns = [
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Target Audience</span>,
      dataIndex: "user_type",
      key: "user_type",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg ${text === 'CUSTOMER' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'} flex items-center justify-center`}>
            {text === 'CUSTOMER' ? <UserOutlined /> : <CarOutlined />}
          </div>
          <span className="font-bold text-gray-700 text-xs tracking-wide">{text}</span>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Referrer Reward</span>,
      key: "referrer_reward",
      render: (_: any, record: ReferralConfig) => (
        <div className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-md shadow-amber-100 w-fit">
          {record.referrer_reward_type === "PERCENTAGE"
            ? `${record.referrer_reward}% DISCOUNT`
            : `₹${record.referrer_reward} CREDIT`}
        </div>
      ),
    },
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Referee Reward</span>,
      key: "referee_reward",
      render: (_: any, record: ReferralConfig) => (
        <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-md shadow-blue-100 w-fit">
          {record.referee_reward_type === "PERCENTAGE"
            ? `${record.referee_reward}% DISCOUNT`
            : `₹${record.referee_reward} CREDIT`}
        </div>
      ),
    },
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Status</span>,
      key: "is_active",
      render: (_: any, record: ReferralConfig) => (
        <div className="flex items-center gap-3">
          <Switch
            checked={record.is_active}
            disabled={!canUpdate}
            onChange={(checked) => onToggleStatus(record.id, checked)}
            className={`${record.is_active ? 'bg-emerald-500' : 'bg-gray-300'} ${!canUpdate ? 'opacity-50' : ''}`}
          />
          <span className={`text-[10px] font-bold uppercase tracking-widest ${record.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>
            {record.is_active ? 'Live' : 'Paused'}
          </span>
        </div>
      ),
    },
    ...(canUpdate || canDelete ? [
      {
        title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Actions</span>,
        key: "actions",
        render: (_: any, record: ReferralConfig) => (
          <Space size="small">
            {canUpdate && (
              <Tooltip title="Configure Rule">
                <Button
                  type="text"
                  icon={<EditOutlined className="text-blue-500" />}
                  onClick={() => onEdit(record)}
                  className="hover:bg-blue-50 rounded-lg h-9 w-9 flex items-center justify-center transition-colors"
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
                  className="hover:bg-red-50 rounded-lg h-9 w-9 flex items-center justify-center transition-colors"
                />
              </Tooltip>
            )}
          </Space>
        ),
      }
    ] : []),
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 10 }}
    />
  );
};

export default ReferralTable;
