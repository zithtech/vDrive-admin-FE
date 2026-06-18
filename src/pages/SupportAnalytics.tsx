import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Spin,
  Tag,
  
  Progress,
  Space,
} from 'antd';
import {
  CustomerServiceOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  AlertOutlined,
  ThunderboltOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import axiosIns from '../api/axios';

const { Title, Text } = Typography;

const CATEGORY_META: Record<string, { label: string; color: string; icon: string }> = {
  payment: { label: 'Payment', color: '#faad14', icon: '💰' },
  documents: { label: 'Documents', color: '#13c2c2', icon: '📄' },
  app_crash: { label: 'App Issue', color: '#f5222d', icon: '🐛' },
  account: { label: 'Account', color: '#722ed1', icon: '👤' },
  subscription: { label: 'Subscription', color: '#2f54eb', icon: '📦' },
  rides: { label: 'Rides', color: '#52c41a', icon: '🚗' },
  general: { label: 'General', color: '#8c8c8c', icon: '❓' },
};

const SupportAnalytics: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data } = await axiosIns.get('/api/support-management/tickets/stats');
      setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch support stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <Text>Failed to load analytics.</Text>
      </div>
    );
  }

  const { overall, today, categories, avg_response_minutes } = stats;
  const totalCategories = categories.reduce((sum: number, c: any) => sum + parseInt(c.count), 0);

  return (
    <div className="p-6 overflow-y-auto h-full bg-slate-50/30 dark:bg-slate-900/50">
      <div className="flex items-center gap-3 mb-6">
        <PieChartOutlined className="text-2xl text-indigo-600" />
        <div>
          <Title level={3} className="!mb-0 dark:!text-slate-100">Support Analytics</Title>
          <Text type="secondary" className="text-xs dark:!text-slate-400">Real-time overview of your support performance</Text>
        </div>
      </div>

      {/* Row 1: Key Metrics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow !bg-white dark:!bg-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                <CustomerServiceOutlined className="text-xl text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <Text type="secondary" className="text-xs uppercase font-bold tracking-wider dark:!text-slate-400">Total Tickets</Text>
                <Title level={3} className="!mb-0 !mt-1 dark:!text-slate-100">{overall?.total || 0}</Title>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow !bg-white dark:!bg-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center">
                <AlertOutlined className="text-xl text-orange-500 dark:text-orange-400" />
              </div>
              <div>
                <Text type="secondary" className="text-xs uppercase font-bold tracking-wider dark:!text-slate-400">Open Now</Text>
                <Title level={3} className="!mb-0 !mt-1 text-orange-500 dark:text-orange-400">{overall?.open_count || 0}</Title>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow !bg-white dark:!bg-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                <CheckCircleOutlined className="text-xl text-green-600 dark:text-green-400" />
              </div>
              <div>
                <Text type="secondary" className="text-xs uppercase font-bold tracking-wider dark:!text-slate-400">Resolved</Text>
                <Title level={3} className="!mb-0 !mt-1 text-green-600 dark:text-green-400">{(parseInt(overall?.resolved_count || 0) + parseInt(overall?.closed_count || 0))}</Title>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-shadow !bg-white dark:!bg-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                <ThunderboltOutlined className="text-xl text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <Text type="secondary" className="text-xs uppercase font-bold tracking-wider dark:!text-slate-400">Avg Response</Text>
                <Title level={3} className="!mb-0 !mt-1 text-blue-600 dark:text-blue-400">
                  {avg_response_minutes ? `${avg_response_minutes}m` : 'N/A'}
                </Title>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 2: Today + Category Breakdown */}
      <Row gutter={[16, 16]}>
        {/* Today's Summary */}
        <Col xs={24} lg={8}>
          <Card className="rounded-2xl border-none shadow-sm h-full !bg-white dark:!bg-slate-800" title={
            <div className="flex items-center gap-2">
              <ClockCircleOutlined className="text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold dark:text-slate-100">Today's Summary</span>
            </div>
          }>
            <Space direction="vertical" className="w-full" size="large">
              <div className="flex justify-between items-center">
                <Text type="secondary" className="dark:!text-slate-400">New Tickets</Text>
                <Tag color="processing" className="rounded-full border-none text-xs font-bold px-3">{today?.today_total || 0}</Tag>
              </div>
              <div className="flex justify-between items-center">
                <Text type="secondary" className="dark:!text-slate-400">Active</Text>
                <Tag color="warning" className="rounded-full border-none text-xs font-bold px-3">{today?.today_open || 0}</Tag>
              </div>
              <div className="flex justify-between items-center">
                <Text type="secondary" className="dark:!text-slate-400">Resolved</Text>
                <Tag color="success" className="rounded-full border-none text-xs font-bold px-3">{today?.today_resolved || 0}</Tag>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <Text type="secondary" className="text-xs block mb-2 dark:!text-slate-400">Resolution Rate</Text>
                <Progress
                  percent={today?.today_total > 0 ? Math.round((parseInt(today.today_resolved || 0) / parseInt(today.today_total)) * 100) : 0}
                  strokeColor={{ from: '#6366F1', to: '#10B981' }}
                  className="!mb-0"
                />
              </div>
            </Space>
          </Card>
        </Col>

        {/* Category Breakdown */}
        <Col xs={24} lg={16}>
          <Card className="rounded-2xl border-none shadow-sm h-full !bg-white dark:!bg-slate-800" title={
            <div className="flex items-center gap-2">
              <PieChartOutlined className="text-indigo-600 dark:text-indigo-400" />
              <span className="font-bold dark:text-slate-100">Issue Categories</span>
            </div>
          }>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((cat: any) => {
                const meta = CATEGORY_META[cat.category] || CATEGORY_META.general;
                const percent = totalCategories > 0 ? Math.round((parseInt(cat.count) / totalCategories) * 100) : 0;
                return (
                  <div key={cat.category} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="text-2xl">{meta.icon}</div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-center mb-1">
                        <Text className="font-semibold text-sm dark:text-slate-200">{meta.label}</Text>
                        <Text className="text-xs text-slate-400 dark:text-slate-500">{cat.count} tickets</Text>
                      </div>
                      <Progress
                        percent={percent}
                        showInfo={false}
                        strokeColor={meta.color}
                        size="small"
                        className="!mb-0"
                      />
                    </div>
                    <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 min-w-[30px] text-right">{percent}%</Text>
                  </div>
                );
              })}
              {categories.length === 0 && (
                <div className="col-span-2 text-center text-slate-400 py-8">
                  No category data available yet.
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SupportAnalytics;
