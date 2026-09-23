import React, { useState, useEffect, useCallback } from 'react';
import { Table, Select, DatePicker, Button, Typography, message, ConfigProvider, theme } from 'antd';
import { ReloadOutlined, UserOutlined } from '@ant-design/icons';
import * as sosApi from '../api/sosApi';
import dayjs from 'dayjs';
import { useTheme } from '../contexts/ThemeContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface SosHistoryItem {
  id: string;
  user_id: string;
  user_type: string;
  trip_id?: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  user_name?: string;
  user_phone?: string;
  user_code?: string;
  profile_pic?: string;
  trip_ref_id?: string;
  trip_code?: string;
  pickup_address?: string;
  drop_address?: string;
  trip_status?: string;
}

const SosHistory: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SosHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const { isDarkMode } = useTheme();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: pageSize };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.user_type = typeFilter;
      if (dateRange && dateRange[0]) params.from_date = dateRange[0].startOf('day').toISOString();
      if (dateRange && dateRange[1]) params.to_date = dateRange[1].endOf('day').toISOString();

      const response = await sosApi.getSosHistory(params);
      if (response.success && response.data) {
        setData(response.data.data || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch SOS history:', error);
      message.error('Failed to load SOS history');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, typeFilter, dateRange]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (text: string) => <Text strong className="text-[12px] dark:text-slate-300">{text?.substring(0, 8)}...</Text>,
    },
    {
      title: 'Driver / Customer',
      dataIndex: 'user_name',
      key: 'person',
      render: (_: any, record: SosHistoryItem) => (
        <div className="flex items-center gap-2">
          {record.profile_pic ? (
            <img
              src={record.profile_pic}
              alt={record.user_name || ''}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
              <UserOutlined className="text-gray-400 dark:text-slate-400 text-sm" />
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight text-slate-800 dark:text-slate-200">{record.user_name || 'Unknown'}</span>
            <span className="text-xs text-gray-500 dark:text-slate-400 leading-tight mt-0.5">{record.user_code || record.user_id?.substring(0, 12)}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'user_type',
      key: 'type',
      render: (text: string) => (
        <span className="text-gray-700 dark:text-slate-300 font-medium">
          {text?.toLowerCase() === 'driver' ? 'Driver Emergency' : 'Customer Emergency'}
        </span>
      ),
    },
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'time',
      render: (text: string) => (
        <span className="text-gray-700 dark:text-slate-300 font-medium">
          {text ? new Date(text).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
        </span>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'pickup_address',
      key: 'location',
      ellipsis: true,
      render: (text: string) => <span className="text-gray-700 dark:text-slate-300" title={text}>{text || 'N/A'}</span>,
    },
    {
      title: 'Trip ID',
      key: 'tripId',
      render: (_: any, record: SosHistoryItem) => (
        <span className="text-gray-700 dark:text-slate-300 font-medium">{record.trip_code || record.trip_ref_id?.substring(0, 8) || 'N/A'}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let bgColor = '';
        let textColor = '';
        let borderColor = '';
        const s = status?.toUpperCase();
        
        if (s === 'ACTIVE') {
          bgColor = 'bg-red-50 dark:bg-red-900/30';
          textColor = 'text-red-600 dark:text-red-400';
          borderColor = 'border-red-100 dark:border-red-800/50';
        } else if (s === 'RESOLVED') {
          bgColor = 'bg-green-50 dark:bg-green-900/30';
          textColor = 'text-green-600 dark:text-green-400';
          borderColor = 'border-green-100 dark:border-green-800/50';
        } else {
          bgColor = 'bg-gray-50 dark:bg-slate-700';
          textColor = 'text-gray-600 dark:text-slate-300';
          borderColor = 'border-gray-200 dark:border-slate-600';
        }

        return (
          <span className={`${bgColor} ${textColor} ${borderColor} border px-2 py-0.5 rounded text-[11px] font-semibold`}>
            {s}
          </span>
        );
      },
    },
    {
      title: 'Resolved At',
      dataIndex: 'resolved_at',
      key: 'resolved_at',
      render: (text: string) => (
        <span className="text-gray-600 dark:text-slate-400 text-[12px]">
          {text ? new Date(text).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
        </span>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorBgContainer: isDarkMode ? '#1e293b' : '#ffffff',
          colorBorder: isDarkMode ? '#334155' : '#d9d9d9',
          colorText: isDarkMode ? '#f1f5f9' : '#000000',
        },
        components: {
          Table: {
            headerBg: isDarkMode ? '#0f172a' : '#f8fafc',
            headerColor: isDarkMode ? '#f1f5f9' : '#1e293b',
            rowHoverBg: isDarkMode ? '#334155' : '#f8fafc',
          }
        }
      }}
    >
      <div className="p-2 md:p-3 bg-[#f8fafc] dark:bg-slate-900 min-h-full">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-3">
          
          {/* Header / Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <Title level={4} style={{ margin: 0 }} className="dark:!text-white text-slate-800">
              SOS Request History
            </Title>
          <div className="flex flex-wrap items-center gap-2">
            <RangePicker 
              className="rounded-lg" 
              size="small"
              onChange={(dates) => {
                setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null);
                setPage(1);
              }}
            />
            <Select
              value={statusFilter}
              className="w-32"
              size="small"
              onChange={(val) => { setStatusFilter(val); setPage(1); }}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'RESOLVED', label: 'Resolved' },
              ]}
            />
            <Select
              value={typeFilter}
              className="w-44"
              size="small"
              onChange={(val) => { setTypeFilter(val); setPage(1); }}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'driver', label: 'Driver Emergency' },
                { value: 'customer', label: 'Customer Emergency' },
              ]}
            />
            <Button 
              icon={<ReloadOutlined />} 
              size="small"
              className="rounded-lg font-medium flex items-center"
              onClick={() => fetchHistory()}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Table */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <Table
              columns={columns}
              dataSource={data}
              rowKey="id"
              loading={loading}
              size="small"
              pagination={{
                current: page,
                total: total,
                pageSize: pageSize,
                showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} entries`,
                onChange: (p, ps) => { setPage(p); setPageSize(ps || 20); },
                position: ['bottomCenter'],
                className: "px-4 pb-4",
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
              }}
              rowClassName={() => 'border-b border-gray-100 dark:border-slate-700/50'}
              className="sos-history-table"
            />
          </div>

        </div>
      </div>
    </ConfigProvider>
  );
};

export default SosHistory;
