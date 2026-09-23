import React from 'react';
import { Badge } from 'antd';

interface DetailsCardProps {
  title: string;
  badgeText?: string;
  badgeStatus?: 'success' | 'processing' | 'default' | 'error' | 'warning';
  children: React.ReactNode;
}

const DetailsCard: React.FC<DetailsCardProps> = ({ title, badgeText, badgeStatus, children }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col h-full shadow-sm">
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
        <h3 className="font-semibold text-slate-800 dark:text-white m-0 text-[15px]">{title}</h3>
        {badgeText && (
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
            badgeStatus === 'success' ? 'bg-green-100 text-green-700' :
            badgeStatus === 'processing' ? 'bg-blue-100 text-blue-700' :
            badgeStatus === 'error' ? 'bg-red-100 text-red-700' :
            badgeStatus === 'warning' ? 'bg-orange-100 text-orange-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {badgeText}
          </span>
        )}
      </div>
      <div className="p-4 flex-1">
        {children}
      </div>
    </div>
  );
};

export default DetailsCard;
