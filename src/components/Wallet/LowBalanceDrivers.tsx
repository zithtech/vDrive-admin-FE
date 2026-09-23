import React from "react";
import { Typography, Avatar, Button } from "antd";

interface Driver {
  id: string;
  name: string;
  vehicleNo: string;
  balance: number;
  image?: string;
}

interface LowBalanceDriversProps {
  drivers: Driver[];
}

const LowBalanceDrivers: React.FC<LowBalanceDriversProps> = ({ drivers }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col h-full w-full">
      <div className="flex justify-between items-center mb-4">
        <Typography.Title level={5} className="!m-0 text-gray-800 dark:text-gray-200 font-bold text-sm">
          Low Wallet Balance Drivers
        </Typography.Title>
        <Button type="link" className="text-blue-600 text-xs p-0 h-auto">View All</Button>
      </div>
      
      <div className="flex flex-col gap-4 mt-1 flex-1">
        {drivers.map((driver) => (
          <div key={driver.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={driver.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${driver.name}`} size={32} />
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">{driver.name}</span>
                <span className="text-[10px] text-gray-500">{driver.vehicleNo}</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-bold text-red-500 text-xs">₹{driver.balance}</span>
              <span className="text-[10px] text-red-400">Low Balance</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-50 dark:border-slate-700 text-center">
        <Button type="link" className="text-blue-600 text-xs font-semibold p-0 h-auto">
          View All Low Balance Drivers &rarr;
        </Button>
      </div>
    </div>
  );
};

export default LowBalanceDrivers;
