import React from 'react';
import TitleBarCommon from '../components/TitleBarCommon/TitleBar';

const Settings: React.FC = () => {
  return (
    <div className="p-6 h-full flex flex-col">
      <TitleBarCommon title="Settings" />
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex-grow mt-6 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">Settings page content goes here.</p>
      </div>
    </div>
  );
};

export default Settings;
