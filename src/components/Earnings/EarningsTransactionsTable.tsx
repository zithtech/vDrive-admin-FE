import React, { useState } from "react";
import { Table, Avatar, Tabs } from "antd";
import { UserOutlined } from "@ant-design/icons";

interface Transaction {
  id: string;
  type: "Subscription" | "Top-up";
  user: { name: string; phone: string; image?: string };
  planOrAmount: { title: string; subtitle: string };
  paymentMethod: string;
  date: string;
  amount: number;
  status: "Success" | "Pending" | "Failed";
}

interface EarningsTransactionsTableProps {
  transactions: Transaction[];
  total: number;
}

const STATUS_COLORS: Record<string, string> = {
  Success: "emerald",
  Pending: "orange",
  Failed: "red",
};

const EarningsTransactionsTable: React.FC<EarningsTransactionsTableProps> = ({ transactions }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const filteredData = transactions.filter(t => {
    if (activeTab === "subscriptions") return t.type === "Subscription";
    if (activeTab === "topups") return t.type === "Top-up";
    return true;
  });

  const columns = [
    {
      title: "Transaction ID",
      dataIndex: "id",
      key: "id",
      render: (text: string) => <span className="font-bold text-gray-800 dark:text-gray-200">{text}</span>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <span className={`px-2 py-1 rounded-md text-xs font-semibold ${
          type === 'Subscription' 
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' 
            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
        }`}>
          {type}
        </span>
      ),
    },
    {
      title: "Driver / User",
      dataIndex: "user",
      key: "user",
      render: (user: any) => (
        <div className="flex items-center gap-2">
          <Avatar icon={<UserOutlined />} size="small" src={user.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.name}`} />
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">{user.name}</span>
            <span className="text-[10px] text-gray-500">{user.phone}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Plan / Amount",
      dataIndex: "planOrAmount",
      key: "planOrAmount",
      render: (plan: any) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">{plan.title}</span>
          <span className="text-[10px] text-gray-500">{plan.subtitle}</span>
        </div>
      ),
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
      render: (text: string) => <span className="text-gray-500 dark:text-gray-400 text-xs">{text}</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number) => <span className="font-bold text-gray-800 dark:text-gray-200">₹{amount.toLocaleString()}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color = STATUS_COLORS[status] || "gray";
        return (
          <span className={`px-2 py-1 rounded-md text-xs font-semibold bg-${color}-50 text-${color}-600 dark:bg-${color}-500/10 dark:text-${color}-400`}>
            {status}
          </span>
        );
      },
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col h-full w-full overflow-hidden">
      <div className="px-4 pt-3">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: "all", label: "Transactions" },
            { key: "subscriptions", label: "Subscriptions" },
            { key: "topups", label: "Wallet Top-ups" },
          ]}
          className="mb-0"
        />
      </div>
      
      <div className="px-4 pb-4">
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
          size="middle"
          className="w-full text-sm"
          components={{
            header: {
              cell: (props: any) => <th {...props} className="bg-transparent text-gray-400 text-xs font-semibold uppercase tracking-wider border-none py-3" />
            }
          }}
          rowClassName={() => "border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 cursor-pointer"}
        />
        <div className="text-xs text-gray-500 mt-[-30px]">
          Showing {Math.min((currentPage - 1) * pageSize + 1, filteredData.length)} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} transactions
        </div>
      </div>
    </div>
  );
};

export default EarningsTransactionsTable;
