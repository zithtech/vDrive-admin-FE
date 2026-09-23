import React from "react";
import { Table, Typography, Button, Tag, Avatar } from "antd";
import { ArrowRightOutlined, UserOutlined } from "@ant-design/icons";

interface Booking {
  id?: string;
  _id?: string;
  bookingId?: string;
  customerName: string;
  pickup: string;
  drop: string;
  time: string;
  status: string;
  fare: number;
}

interface RecentBookingsTableProps {
  bookings?: Booking[];
}

const STATUS_COLORS: Record<string, string> = {
  Scheduled: "blue",
  Completed: "green",
  Cancelled: "red",
  Ongoing: "orange",
  "In Progress": "orange",
};

const RecentBookingsTable: React.FC<RecentBookingsTableProps> = ({ bookings }) => {
  const dataSource = bookings && bookings.length > 0 ? bookings : [];

  const columns = [
    {
      title: "BOOKING ID",
      dataIndex: "bookingId",
      key: "bookingId",
      render: (text: string, record: Booking) => (
        <span className="font-bold text-gray-800 dark:text-gray-200">{text || record.id || record._id}</span>
      ),
    },
    {
      title: "CUSTOMER",
      dataIndex: "customerName",
      key: "customerName",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <Avatar icon={<UserOutlined />} size="small" src={`https://api.dicebear.com/7.x/notionists/svg?seed=${text}`} />
          <span className="font-medium text-gray-700 dark:text-gray-300">{text}</span>
        </div>
      ),
    },
    {
      title: "PICKUP & DROP",
      key: "route",
      render: (_: any, record: Booking) => (
        <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs gap-2">
          <span className="truncate max-w-[120px]">{record.pickup}</span>
          <ArrowRightOutlined className="text-gray-300 dark:text-gray-600" />
          <span className="truncate max-w-[120px]">{record.drop}</span>
        </div>
      ),
    },
    {
      title: "TIME",
      dataIndex: "time",
      key: "time",
      render: (text: string) => <span className="text-gray-500 dark:text-gray-400 text-xs">{text}</span>,
    },
    {
      title: "STATUS",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || "default"} className="rounded-md px-2 py-0.5 border-none font-semibold">
          {status}
        </Tag>
      ),
    },
    {
      title: "FARE",
      dataIndex: "fare",
      key: "fare",
      render: (fare: number) => <span className="font-bold text-gray-800 dark:text-gray-200">₹{(fare || 0).toLocaleString()}</span>,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-200 dark:border-slate-700 flex flex-col h-full">
      <div className="flex justify-between items-center mb-3">
        <Typography.Title level={5} className="!m-0 text-gray-800 dark:text-gray-200 font-bold">
          Recent Bookings
        </Typography.Title>
        <Button type="primary" ghost className="rounded-lg text-xs font-semibold px-4 border-blue-100 bg-blue-50 hover:bg-blue-100 text-blue-600">
          View All
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        rowKey={(record) => record.bookingId || record.id || record._id || Math.random().toString()}
        size="small"
        className="w-full text-sm dashboard-table"
        locale={{ emptyText: "No bookings available for selected dates" }}
        components={{
          header: {
            cell: (props: any) => <th {...props} className="bg-transparent text-gray-400 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider border-none py-3" />
          }
        }}
        rowClassName={() => "border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-700/50 cursor-pointer"}
      />
    </div>
  );
};

export default RecentBookingsTable;
