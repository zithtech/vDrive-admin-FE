import React from "react";
import { Typography, Button, Avatar } from "antd";
import { StarFilled, UserOutlined } from "@ant-design/icons";

interface TopDriver {
  id?: string;
  _id?: string;
  name: string;
  rating: number;
  rides: number;
  profileImage?: string;
}

interface TopDriversListProps {
  drivers?: TopDriver[];
}

const TopDriversList: React.FC<TopDriversListProps> = ({ drivers }) => {
  const driverList = drivers && drivers.length > 0 ? drivers : [];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-200 dark:border-slate-700 flex flex-col h-full">
      <div className="flex justify-between items-center mb-1">
        <Typography.Title level={5} className="!m-0 text-gray-800 dark:text-gray-200 font-bold text-sm">
          Top Performing Drivers
        </Typography.Title>
        <Button type="primary" ghost className="rounded-md text-[10px] font-semibold px-2 py-0 h-6 border-blue-100 bg-blue-50 hover:bg-blue-100 text-blue-600">
          View All
        </Button>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto mt-1">
        {driverList.length > 0 ? (
          driverList.map((driver, idx) => (
            <div key={driver.id || driver._id || idx} className="flex items-center py-1 border-b border-gray-50 dark:border-slate-700 last:border-0 hover:bg-gray-50/50 rounded-lg px-2 transition-colors cursor-pointer">
              <span className="text-gray-400 font-medium w-4 text-xs">{idx + 1}</span>
              <Avatar size={20} icon={<UserOutlined />} src={driver.profileImage || `https://api.dicebear.com/7.x/notionists/svg?seed=${driver.name}`} className="mr-2" />
              <span className="font-semibold text-gray-700 dark:text-gray-200 flex-1 text-xs truncate pr-2">{driver.name}</span>
              <div className="flex items-center w-12 gap-1 justify-end">
                <span className="font-bold text-gray-800 dark:text-gray-100 text-xs">{driver.rating}</span>
                <StarFilled className="text-yellow-400 text-[10px]" />
              </div>
              <span className="text-gray-500 text-[10px] font-medium w-16 text-right truncate">{driver.rides} Rides</span>
            </div>
          ))
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-gray-400 text-xs">No driver data available</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopDriversList;
