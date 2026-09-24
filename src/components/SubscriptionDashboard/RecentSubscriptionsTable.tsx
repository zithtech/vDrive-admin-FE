import React from "react";
import { Table, Avatar, Switch, Dropdown, type MenuProps, Input, Select, Button } from "antd";
import { MoreHorizontal, Search, Filter } from "lucide-react";

interface RecentSubscription {
  id: string;
  driver: { name: string; vehicle: string };
  plan: string;
  amount: number;
  startDate: string;
  nextRenewal: string;
  status: string;
  autoRenew: boolean;
}

interface RecentSubscriptionsTableProps {
  data: RecentSubscription[];
}

const RecentSubscriptionsTable: React.FC<RecentSubscriptionsTableProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-emerald-600 bg-emerald-50";
      case "Expiring Soon":
        return "text-amber-600 bg-amber-50";
      case "Expired":
        return "text-rose-600 bg-rose-50";
      case "Cancelled":
        return "text-slate-600 bg-slate-50";
      default:
        return "text-blue-600 bg-blue-50";
    }
  };

  const actionMenu: MenuProps['items'] = [
    { key: '1', label: 'View Details' },
    { key: '2', label: 'Edit Plan' },
    { key: '3', label: 'Cancel Subscription', danger: true },
  ];

  const columns = [
    {
      title: "Subscription ID",
      dataIndex: "id",
      key: "id",
      className: "font-semibold text-slate-800 text-xs",
    },
    {
      title: "Driver / User",
      key: "driver",
      render: (_: any, record: RecentSubscription) => (
        <div className="flex items-center gap-3">
          <Avatar src={`https://api.dicebear.com/7.x/notionists/svg?seed=${record.driver.name}`} size={32} className="bg-slate-100" />
          <div>
            <div className="text-xs font-bold text-slate-800">{record.driver.name}</div>
            <div className="text-[11px] text-slate-500 font-medium">{record.driver.vehicle}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Plan",
      dataIndex: "plan",
      key: "plan",
      render: (plan: string) => (
        <span className="text-xs font-semibold text-blue-600">{plan}</span>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      className: "font-bold text-slate-800 text-xs",
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      className: "text-xs text-slate-600 font-medium",
    },
    {
      title: "Next Renewal",
      dataIndex: "nextRenewal",
      key: "nextRenewal",
      className: "text-xs text-slate-600 font-medium",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${getStatusColor(status)}`}>
          {status}
        </span>
      ),
    },
    {
      title: "Auto Renew",
      dataIndex: "autoRenew",
      key: "autoRenew",
      render: (autoRenew: boolean) => (
        <Switch defaultChecked={autoRenew} size="small" />
      ),
    },
    {
      title: "Action",
      key: "action",
      render: () => (
        <Dropdown menu={{ items: actionMenu }} trigger={['click']}>
          <button className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Recent Subscriptions</h2>
          <div className="flex gap-6 text-sm font-medium border-b border-slate-200">
            <button className="pb-2 text-blue-600 border-b-2 border-blue-600">All</button>
            <button className="pb-2 text-slate-500 hover:text-slate-800">Active</button>
            <button className="pb-2 text-slate-500 hover:text-slate-800">Expiring Soon</button>
            <button className="pb-2 text-slate-500 hover:text-slate-800">Expired</button>
            <button className="pb-2 text-slate-500 hover:text-slate-800">Cancelled</button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select
            defaultValue="All Plans"
            options={[{ value: "All Plans", label: "All Plans" }]}
            className="w-32"
          />
          <Button icon={<Filter size={14} className="text-slate-600"/>} className="flex items-center text-slate-600 text-sm">
            Filter
          </Button>
          <Input 
            prefix={<Search size={14} className="text-slate-400" />} 
            placeholder="Search driver / booking ID" 
            className="w-64 text-sm"
          />
        </div>
      </div>

      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        pagination={{ 
          pageSize: 5,
          showSizeChanger: false,
          showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} subscriptions`
        }}
        className="custom-table"
      />
    </div>
  );
};

export default RecentSubscriptionsTable;
