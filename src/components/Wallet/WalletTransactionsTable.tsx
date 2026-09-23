import React, { useState } from "react";
import { Table, Tabs, Avatar, Button, Input, Typography } from "antd";
import { UserOutlined, FilterOutlined, SearchOutlined } from "@ant-design/icons";

interface Transaction {
  id: string;
  driver: { name: string; phone: string; image?: string };
  type: string;
  amount: number;
  walletBalance: number;
  paymentMethod: string;
  date: string;
  status: string;
}

interface WalletTransactionsTableProps {
  transactions: Transaction[];
}

const TYPE_COLORS: Record<string, string> = {
  "Top-up": "emerald",
  "Adjustment": "purple",
  "Withdrawal": "amber",
  "Bonus": "blue",
};

const WalletTransactionsTable: React.FC<WalletTransactionsTableProps> = ({ transactions }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const filteredData = transactions.filter(t => {
    if (activeTab === "topups") return t.type === "Top-up";
    if (activeTab === "adjustments") return t.type === "Adjustment";
    if (activeTab === "withdrawals") return t.type === "Withdrawal";
    if (activeTab === "bonuses") return t.type === "Bonus";
    return true;
  });

  const columns = [
    {
      title: "Transaction ID",
      dataIndex: "id",
      key: "id",
      render: (text: string) => <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">{text}</span>,
    },
    {
      title: "Driver / User",
      dataIndex: "driver",
      key: "driver",
      render: (driver: any) => (
        <div className="flex items-center gap-2">
          <Avatar icon={<UserOutlined />} size="small" src={driver.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${driver.name}`} />
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">{driver.name}</span>
            <span className="text-[10px] text-gray-500">{driver.phone}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => {
        const color = TYPE_COLORS[type] || "gray";
        return (
          <span className={`px-2 py-1 rounded-md text-[10px] font-semibold bg-${color}-50 text-${color}-600 dark:bg-${color}-500/10 dark:text-${color}-400`}>
            {type}
          </span>
        );
      },
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => (
        <span className={`font-bold text-xs ${amount < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
          {amount > 0 ? '+' : ''}{amount < 0 ? '-' : ''}₹{Math.abs(amount).toLocaleString()}
        </span>
      ),
    },
    {
      title: "Wallet Balance",
      dataIndex: "walletBalance",
      key: "walletBalance",
      render: (amount: number) => <span className="font-bold text-gray-800 dark:text-gray-200 text-xs">₹{amount.toLocaleString()}</span>,
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (text: string) => <span className="text-gray-500 dark:text-gray-400 text-xs">{text}</span>,
    },
    {
      title: "Date & Time",
      dataIndex: "date",
      key: "date",
      render: (text: string) => <span className="text-gray-500 dark:text-gray-400 text-[11px]">{text}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          {status}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: () => (
        <Button size="small" type="link" className="text-blue-600 text-[11px] font-medium border border-blue-100 dark:border-blue-900 rounded bg-blue-50/50 dark:bg-blue-900/20 px-2 h-6">
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col h-full w-full overflow-hidden">
      <div className="px-4 pt-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <Typography.Title level={5} className="!m-0 text-gray-800 dark:text-gray-200 font-bold text-base hidden sm:block">
          Wallet Transactions
        </Typography.Title>
        <div className="flex items-center gap-2">
          <Button icon={<FilterOutlined />} size="small" className="text-xs h-7">All Types</Button>
          <Button icon={<FilterOutlined />} size="small" className="text-xs h-7">Filter</Button>
          <Input prefix={<SearchOutlined className="text-gray-400" />} placeholder="Search transaction ID / driver" size="small" className="text-xs h-7 rounded-md w-full sm:w-[200px]" />
        </div>
      </div>

      <div className="px-4 mt-2 border-b border-gray-100 dark:border-slate-700">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: "all", label: "All Transactions" },
            { key: "topups", label: "Top-ups" },
            { key: "adjustments", label: "Adjustments" },
            { key: "withdrawals", label: "Withdrawals" },
            { key: "bonuses", label: "Bonuses" },
            { key: "failed", label: "Failed Transactions" },
          ]}
          className="mb-[-1px] text-xs"
          size="small"
        />
      </div>
      
      <div className="px-4 pb-4 mt-2">
        <Table
          columns={columns}
          dataSource={filteredData}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredData.length,
            onChange: (page) => setCurrentPage(page),
            showSizeChanger: false,
            position: ['bottomRight'],
            itemRender: (_, type, originalElement) => {
              if (type === 'prev') return <a>&lt;</a>;
              if (type === 'next') return <a>&gt;</a>;
              return originalElement;
            },
          }}
          rowKey="id"
          size="small"
          className="w-full text-xs"
          components={{
            header: {
              cell: (props: any) => <th {...props} className="bg-transparent text-gray-400 text-[10px] font-semibold uppercase tracking-wider border-b border-gray-100 dark:border-slate-700 py-2" />
            }
          }}
          rowClassName={() => "border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 cursor-pointer"}
        />
        <div className="text-[10px] text-gray-500 mt-[-24px]">
          Showing {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} transactions
        </div>
      </div>
    </div>
  );
};

export default WalletTransactionsTable;
