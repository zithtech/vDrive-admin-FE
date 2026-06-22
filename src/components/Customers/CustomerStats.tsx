import React from "react";
import { UserOutlined, CheckCircleOutlined, StopOutlined, RiseOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import type { Customer } from "../../pages/Customers";
import dayjs from "dayjs";

const { Text } = Typography;

interface CustomerStatsProps {
  customers: Customer[];
  loading: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  tagColor: "blue" | "emerald" | "purple" | "rose" | "indigo";
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, tagColor }) => {
  return (
    <div className="stat-card-container">
      <div className="stat-card-content">
        <Text className="stat-card-title">
          {title}
        </Text>
        <div className="stat-card-value-wrapper">
          <span className="stat-card-value">
            {value.toLocaleString()}
          </span>
        </div>
        <Text className="stat-card-description">
          {description}
        </Text>
      </div>

      <div className={`stat-card-icon-wrapper stat-card-icon-${tagColor}`}>
        {React.cloneElement(icon as React.ReactElement, { className: "stat-card-icon" })}
      </div>
    </div>
  );
};

const CustomerStats: React.FC<CustomerStatsProps> = ({ customers }) => {
  const total = customers.length;
  const active = customers.filter((c) => c.status === "active").length;
  const suspended = customers.filter(
    (c) => c.status === "suspended" || c.status === "blocked",
  ).length;

  const lastMonth = dayjs().subtract(30, "days");
  const newThisMonth = customers.filter((c) => dayjs(c.created_at).isAfter(lastMonth)).length;

  const stats: StatCardProps[] = [
    {
      title: "Total User",
      value: total,
      icon: <UserOutlined />,
      description: "All registered records",
      tagColor: "blue",
    },
    {
      title: "Active Users",
      value: active,
      icon: <CheckCircleOutlined />,
      description: "Active status verified",
      tagColor: "emerald",
    },
    {
      title: "New Members",
      value: newThisMonth,
      icon: <RiseOutlined />,
      description: "Joined in last 30 days",
      tagColor: "purple",
    },
    {
      title: "Restricted",
      value: suspended,
      icon: <StopOutlined />,
      description: "Accounts limited/blocked",
      tagColor: "rose",
    },
  ];

  return (
    <>
      <style>{`
        .customer-stats-grid { display: grid; grid-template-columns: repeat(1, minmax(0, 1fr)); gap: 1rem; padding: 0px 2px; }
        @media (min-width: 640px) { .customer-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 1024px) { .customer-stats-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        
        .stat-card-container { background-color: white; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0.75rem; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s; cursor: default; }
        .dark .stat-card-container { background-color: #1e293b; border-color: #334155; }
        .stat-card-container:hover { border-color: #e0e7ff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .dark .stat-card-container:hover { border-color: rgba(49, 46, 129, 0.5); }
        
        .stat-card-content { display: flex; flex-direction: column; gap: 0.25rem; }
        .stat-card-title { font-size: 10px; font-weight: 600; color: #0f172a; text-transform: Capitalize; line-height: 1; }
        .dark .stat-card-title { color: #64748b; }
        .stat-card-value-wrapper { display: flex; align-items: baseline; gap: 0.25rem; margin-top: 0.125rem; }
        .stat-card-value { font-size: 1rem; font-weight: 900; color: #0f172a; letter-spacing: -0.05em; line-height: 1; }
        .dark .stat-card-value { color: #f1f5f9; }
        .stat-card-description { font-size: 9px; color: #94a3b8; font-weight: 500; line-height: 1; margin-top: 0.125rem; }
        .dark .stat-card-description { color: #64748b; }
        
        .stat-card-icon-wrapper { width: 2rem; height: 2rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; transition: all 0.3s; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .stat-card-container:hover .stat-card-icon-wrapper { transform: scale(1.1); }
        .stat-card-icon { font-size: 1rem; }
        
        .stat-card-icon-blue { background-color: #eff6ff; color: #2563eb; border: 1px solid #e0e7ff; }
        .dark .stat-card-icon-blue { background-color: rgba(30, 58, 138, 0.2); color: #60a5fa; border-color: rgba(30, 58, 138, 0.3); }
        
        .stat-card-icon-emerald { background-color: #ecfdf5; color: #059669; border: 1px solid #d1fae5; }
        .dark .stat-card-icon-emerald { background-color: rgba(6, 78, 59, 0.2); color: #34d399; border-color: rgba(6, 78, 59, 0.3); }
        
        .stat-card-icon-purple { background-color: #faf5ff; color: #9333ea; border: 1px solid #f3e8ff; }
        .dark .stat-card-icon-purple { background-color: rgba(88, 28, 135, 0.2); color: #c084fc; border-color: rgba(88, 28, 135, 0.3); }
        
        .stat-card-icon-rose { background-color: #fff1f2; color: #e11d48; border: 1px solid #ffe4e6; }
        .dark .stat-card-icon-rose { background-color: rgba(136, 19, 55, 0.2); color: #fb7185; border-color: rgba(136, 19, 55, 0.3); }
        
        .stat-card-icon-indigo { background-color: #eef2ff; color: #4f46e5; border: 1px solid #e0e7ff; }
        .dark .stat-card-icon-indigo { background-color: rgba(49, 46, 129, 0.2); color: #818cf8; border-color: rgba(49, 46, 129, 0.3); }
      `}</style>
      <div className="customer-stats-grid">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </>
  );
};

export default CustomerStats;
