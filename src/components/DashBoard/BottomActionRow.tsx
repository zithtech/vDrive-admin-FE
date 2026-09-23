import React from "react";
import { UserOutlined, ClockCircleOutlined, FileTextOutlined, WalletOutlined, MessageOutlined } from "@ant-design/icons";

interface BottomActionRowProps {
  stats: any;
}

const BottomActionRow: React.FC<BottomActionRowProps> = ({ stats }) => {
  const activeDrivers = stats?.activeDrivers || 342;
  const totalDrivers = stats?.totalDrivers || 856;
  const driverPercent = totalDrivers > 0 ? Math.round((activeDrivers / totalDrivers) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 h-full">
      {/* Drivers Online */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-gray-200 dark:border-slate-700 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
        <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center text-lg shrink-0">
          <UserOutlined />
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-gray-500 dark:text-gray-400 text-[11px] font-semibold mb-1">Drivers Online</span>
          <div className="flex items-end gap-1 mb-1">
            <span className="text-base font-bold text-gray-800 leading-none">{activeDrivers}</span>
            <span className="text-gray-400 text-[10px] font-medium leading-none mb-0.5">/ {totalDrivers}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${driverPercent}%` }} />
            </div>
            <span className="text-[9px] text-gray-400 font-semibold">{driverPercent}%</span>
          </div>
        </div>
      </div>

      {/* Subscription Expiring */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-gray-200 dark:border-slate-700 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center text-lg shrink-0">
          <ClockCircleOutlined />
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-gray-500 dark:text-gray-400 text-[11px] font-semibold mb-0.5">Subscription Expiring</span>
          <span className="text-lg font-bold text-gray-800 leading-none mb-0.5">24</span>
          <span className="text-orange-500 text-[9px] font-semibold">Next 7 days</span>
        </div>
      </div>

      {/* Documents Pending */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-gray-200 dark:border-slate-700 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-lg shrink-0">
          <FileTextOutlined />
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-gray-500 dark:text-gray-400 text-[11px] font-semibold mb-0.5">Documents Pending</span>
          <span className="text-lg font-bold text-gray-800 leading-none mb-0.5">18</span>
          <span className="text-amber-500 text-[9px] font-semibold">Verification</span>
        </div>
      </div>

      {/* Low Balance Drivers */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-gray-200 dark:border-slate-700 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center text-lg shrink-0">
          <WalletOutlined />
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-gray-500 dark:text-gray-400 text-[11px] font-semibold mb-0.5">Low Balance Drivers</span>
          <span className="text-lg font-bold text-gray-800 leading-none mb-0.5">32</span>
          <span className="text-red-500 text-[9px] font-semibold">Recharge</span>
        </div>
      </div>

      {/* Support Tickets */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-gray-200 dark:border-slate-700 flex items-center gap-3 cursor-pointer hover:shadow-md transition-shadow">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-lg shrink-0">
          <MessageOutlined />
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-gray-500 dark:text-gray-400 text-[11px] font-semibold mb-0.5">Support Tickets</span>
          <span className="text-lg font-bold text-gray-800 leading-none mb-0.5">12</span>
          <span className="text-blue-500 text-[9px] font-semibold">Open</span>
        </div>
      </div>
    </div>
  );
};

export default BottomActionRow;
