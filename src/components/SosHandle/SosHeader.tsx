import React from 'react';
import { Button } from 'antd';
import { PhoneOutlined } from '@ant-design/icons';
import { MapPin } from 'lucide-react';
import type { SosAlert } from '../../store/slices/sosSlice';

interface SosHeaderProps {
  activeAlert?: SosAlert;
}

const SosHeader: React.FC<SosHeaderProps> = ({ activeAlert }) => {
  if (!activeAlert) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-3 shadow-sm flex items-center justify-center text-gray-500 dark:text-slate-400 min-h-[80px]">
        No active SOS alert selected
      </div>
    );
  }

  const isDriver = activeAlert.user_type?.toLowerCase() === 'driver';
  const name = activeAlert.name || activeAlert.driver_name || 'Unknown User';
  const displayId = activeAlert.driver_id || activeAlert.user_id || 'Unknown ID';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-3 shadow-sm flex flex-wrap lg:flex-nowrap items-center gap-4 justify-between">
      
      {/* User Info */}
      <div className="flex items-center gap-3 min-w-[240px]">
        <div className="bg-red-600 text-white font-bold text-lg px-2.5 py-2.5 rounded-lg shadow-sm flex items-center justify-center leading-none">
          SOS
        </div>
        <div className="relative">
          <img 
            src={`https://i.pravatar.cc/150?u=${displayId}`} 
            alt="User" 
            className="w-10 h-10 rounded-full border border-gray-200 dark:border-slate-700 object-cover"
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-white text-[14px]">{name}</span>
            <span className="text-[9px] bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Online
            </span>
          </div>
          <span className="text-gray-500 dark:text-slate-400 text-[11px] font-medium mt-0.5">{isDriver ? 'Driver' : 'Customer'} • {displayId}</span>
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
            <div className="flex items-center gap-1">
              <PhoneOutlined className="text-[10px]" />
              <span>{activeAlert.phone || 'N/A'}</span>
            </div>
            <span className="text-gray-300 dark:text-slate-600">|</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">Alt:</span>
              <span>{activeAlert.alt_phone || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block w-px h-10 bg-gray-200 dark:bg-slate-700"></div>

      {/* Type */}
      <div className="flex flex-col">
        <span className="text-gray-500 dark:text-slate-400 text-[11px] font-medium">Type</span>
        <span className="text-slate-800 dark:text-white font-semibold text-[13px] mt-0.5">{isDriver ? 'Driver Emergency' : 'Customer Emergency'}</span>
      </div>

      <div className="hidden lg:block w-px h-10 bg-gray-200 dark:bg-slate-700"></div>

      {/* Time */}
      <div className="flex flex-col">
        <span className="text-gray-500 dark:text-slate-400 text-[11px] font-medium">Time</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-slate-800 dark:text-white font-semibold text-[13px]">
            {new Date(activeAlert.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
          <span className="text-[9px] bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded flex items-center font-medium border border-red-100 dark:border-red-800/50 h-[18px]">
            Just now
          </span>
        </div>
      </div>

      <div className="hidden lg:block w-px h-10 bg-gray-200 dark:bg-slate-700"></div>

      {/* Location */}
      <div className="flex flex-col max-w-[200px]">
        <span className="text-gray-500 dark:text-slate-400 text-[11px] font-medium">Location</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-blue-600 font-semibold text-[13px] truncate" title={activeAlert.pickup_address}>
            {activeAlert.pickup_address || 'Fetching location...'}
          </span>
          <Button size="small" type="default" className="text-blue-600 border-blue-200 bg-blue-50/50 text-[11px] flex items-center gap-1 h-5 px-1.5 py-0 min-w-fit">
            <MapPin size={10} /> Navigate
          </Button>
        </div>
      </div>

      <div className="hidden lg:block w-px h-10 bg-gray-200 dark:bg-slate-700"></div>

      {/* Status */}
      <div className="flex flex-col pr-4">
        <span className="text-gray-500 dark:text-slate-400 text-[11px] font-medium">Status</span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold mt-0.5 self-start ${activeAlert.status === 'ACTIVE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} dark:bg-opacity-20`}>
          {activeAlert.status}
        </span>
      </div>

    </div>
  );
};

export default SosHeader;
