import React from "react";
import { Outlet } from "react-router-dom";

const RechargeLayout: React.FC = () => {
  return (
    <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-[#F7F8FB] dark:bg-[#0b1121]">
      <Outlet />
    </div>
  );
};

export default RechargeLayout;
