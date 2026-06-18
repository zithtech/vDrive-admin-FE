import React from "react";

interface TitleBarProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  iconBgColor?: string;
  extraContent?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const TitleBar: React.FC<TitleBarProps> = ({
  title,
  extraContent,
  children,
  description,
  icon,
  iconBgColor = "bg-blue-600",
  className,
}) => {
  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900">
      <div className="flex justify-between items-center py-4 px-6 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          {icon && (
            <div className={`flex items-center justify-center w-10 h-10 ${iconBgColor} rounded-xl`}>
              <div className="text-white text-xl flex items-center justify-center">{icon}</div>
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <h1 className="font-black text-xl text-slate-800 dark:text-slate-100 tracking-tight leading-none">
              {title}
            </h1>
            {description && (
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 ">{extraContent}</div>
      </div>
      <div
        className={
          className?.length ? className : "w-full h-full relative overflow-hidden px-4 py-2 "
        }
      >
        {children}
      </div>
    </div>
  );
};

export default TitleBar;
