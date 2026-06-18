import React from "react";
import DeductionTable from "../components/DeductionsTable/DeductionsTable"; // import the table component
import {
  CalculatorOutlined,
  DollarOutlined,
  SettingOutlined,
  ReloadOutlined,
  WarningOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import TitleBar from "../components/TitleBarCommon/TitleBar";
import { Button } from "antd";
import { IoMdRefresh } from "react-icons/io";

export interface Driver {
  fullName: string;
  id: string;
  phone: string;
}
export type DeductionStatus = "Success" | "Failed" | "Pending" | "Initiated" | "Reversed";

export interface Deduction {
  id: string;
  driver: Driver;
  amount: string;
  trip: string;
  type: string;
  balanceBefore: string;
  balanceAfter: string;
  status: DeductionStatus;
  date: string;
  reference: string;
  performedBy: string;
}
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className="flex flex-col justify-center rounded-2xl border border-neutral-300 dark:border-slate-700 gap-2 px-4 py-5 bg-white dark:bg-slate-800 hover:shadow-md transition-all">
      <div className="flex items-center gap-3  text-sm font-medium">
        <span className="text-gray-500 dark:text-slate-400">{title}</span>
        <span>{icon}</span>
      </div>
      <div className={`text-2xl font-bold text-gray-900 dark:text-slate-100 ${color}`}>{value}</div>
    </div>
  );
};
const Deductions = () => {
  const DATA: Deduction[] = [
    {
      id: "DED-2024-001",
      driver: { fullName: "John Smith", id: "DRV-001", phone: "+1234567890" },
      amount: "$125.50",
      trip: "TRP-2024-001",
      type: "Commission",
      balanceBefore: "$1,250.00",
      balanceAfter: "$1,124.50",
      status: "Success",
      date: "Jan 15, 2024",
      reference: "REF-001",
      performedBy: "System",
    },
    {
      id: "DED-2024-002",
      driver: {
        fullName: "Alice Johnson",
        id: "DRV-002",
        phone: "+1234567891",
      },
      amount: "$45.75",
      trip: "TRP-2024-002",
      type: "Penalty",
      balanceBefore: "$890.25",
      balanceAfter: "$844.50",
      status: "Failed",
      date: "Jan 14, 2024",
      reference: "REF-002",
      performedBy: "Admin",
    },
    {
      id: "DED-2024-002",
      driver: {
        fullName: "Alice Johnson",
        id: "DRV-002",
        phone: "+1234567891",
      },
      amount: "$45.75",
      trip: "TRP-2024-002",
      type: "Penalty",
      balanceBefore: "$890.25",
      balanceAfter: "$844.50",
      status: "Failed",
      date: "Jan 14, 2024",
      reference: "REF-002",
      performedBy: "Admin",
    },
    {
      id: "DED-2024-002",
      driver: {
        fullName: "Alice Johnson",
        id: "DRV-002",
        phone: "+1234567891",
      },
      amount: "$45.75",
      trip: "TRP-2024-002",
      type: "Penalty",
      balanceBefore: "$890.25",
      balanceAfter: "$844.50",
      status: "Failed",
      date: "Jan 14, 2024",
      reference: "REF-002",
      performedBy: "Admin",
    },
  ];

  const stats = [
    {
      title: "Total Deductions",
      value: "1,247",
      icon: (
        <span className="text-blue-500 text-base">
          <CalculatorOutlined />{" "}
        </span>
      ),
    },
    {
      title: "Total Commission",
      value: "$45,230.50",
      icon: (
        <span className="text-green-500">
          <DollarOutlined />
        </span>
      ),
    },
    {
      title: "Manual Adjustments",
      value: "$8,940.25",
      icon: (
        <span className="text-blue-400 text-base">
          <SettingOutlined />{" "}
        </span>
      ),
    },
    {
      title: "Total Refunds",
      value: "$2,150.75",
      icon: (
        <span className="text-yellow-500 text-base">
          <ReloadOutlined />{" "}
        </span>
      ),
    },
    {
      title: "Total Penalties",
      value: "$1,890.00",
      icon: (
        <span className="text-red-500 text-base">
          <WarningOutlined />{" "}
        </span>
      ),
    },
    {
      title: "Net Deduction Amount",
      value: "$58,211.50",
      icon: (
        <span className="text-green-500">
          <ArrowDownOutlined className="text-gray-400 dark:text-slate-500 text-base" />{" "}
        </span>
      ),
    },
  ];
  return (
    <TitleBar
      title="Deduction Management"
      description="Monitor and manage driver deductions"
      extraContent={
        <div>
          <Button icon={<IoMdRefresh />} loading={false} type="primary" onClick={() => {}}>
            Refresh
          </Button>
        </div>
      }
    >
      <div className="grid  grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <DeductionTable data={DATA} />

      <style>{`
        .dark .premium-table .ant-table-thead > tr > th {
          background: #1e293b;
          color: #94a3b8;
          border-bottom: 2px solid #334155;
        }
        .dark .premium-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #334155;
        }
        .dark .premium-table .ant-table-wrapper .ant-table-pagination.ant-pagination {
          color: #cbd5e1;
        }
        .dark .premium-table .ant-table-cell-row-hover {
          background: transparent !important;
        }
      `}</style>
    </TitleBar>
  );
};

export default Deductions;
