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
    <>
      <style>
        {`
          .titlebar-container { width: 100%; height: 100%; display: flex; flex-direction: column; background-color: white; min-width: 0; min-height: 0; }
          .dark .titlebar-container { background-color: transparent; }
          .titlebar-header { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 1rem; background-color: white; border-bottom: 1px solid #e5e7eb; }
          .dark .titlebar-header { background-color: #1e293b; border-color: #334155; }
          .titlebar-title-section { display: flex; align-items: center; gap: 1rem; }
          .titlebar-icon-wrapper { display: flex; align-items: center; justify-content: center; width: 2.5rem; height: 2.5rem; border-radius: 0.75rem; }
          .titlebar-icon-inner { color: white; font-size: 1.25rem; line-height: 1.75rem; display: flex; align-items: center; justify-content: center; }
          .titlebar-text-group { display: flex; flex-direction: row; align-items: center; gap: 1rem; }
          .titlebar-title { font-weight: 900; font-size: 1rem; line-height: 1; color: #1e293b; letter-spacing: -0.025em; margin: 0; }
          .dark .titlebar-title { color: #f1f5f9; }
          .titlebar-description { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: Capitalize; letter-spacing: 0.025em; margin: 0; }
          .dark .titlebar-description { color: #64748b; }
          .titlebar-extra-content { display: flex; align-items: center; gap: 0.75rem; }
          .titlebar-content { width: 100%; flex-grow: 1; display: flex; flex-direction: column; position: relative; overflow: hidden; padding: 5px; min-width: 0; min-height: 0; }
        `}
      </style>
      <div className="titlebar-container">
        <div className="titlebar-header">
          <div className="titlebar-title-section">
            {icon && (
              <div className={`titlebar-icon-wrapper ${iconBgColor}`}>
                <div className="titlebar-icon-inner">{icon}</div>
              </div>
            )}
            <div className="titlebar-text-group">
              <h1 className="titlebar-title">{title}</h1>
              {description && (
                <>
                  <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div>
                  <p className="titlebar-description">{description}</p>
                </>
              )}
            </div>
          </div>

          <div className="titlebar-extra-content">{extraContent}</div>
        </div>
        <div className={className || "titlebar-content"}>
          {children}
        </div>
      </div>
    </>
  );
};

export default TitleBar;
