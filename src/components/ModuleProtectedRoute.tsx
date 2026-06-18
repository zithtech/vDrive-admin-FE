import React from "react";
import { useModuleAccess } from "../hooks/usePermission";
import { useAppSelector } from "../store/hooks";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import FullScreenLoader from "./FullScreenLoader";

interface ModuleProtectedRouteProps {
  module: string | string[];
  children: React.ReactNode;
}

export const ModuleProtectedRoute: React.FC<ModuleProtectedRouteProps> = ({ module, children }) => {
  const navigate = useNavigate();
  const hasAccess = useModuleAccess(module);
  const { loading, isAuthenticated } = useAppSelector((state) => state.auth);

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  if (!hasAccess) {
    return (
      <div className="h-[90vh] flex items-center justify-center p-6 bg-slate-50">
        <Result
          status="403"
          title="403"
          subTitle="Access Restricted. Your account level does not have permissions for this administrative module."
          extra={
            <Button
              type="primary"
              className="bg-indigo-600 border-none rounded-xl h-11 px-6 font-bold hover:scale-105 transition-transform"
              onClick={() => navigate("/")}
            >
              Back to Dashboard
            </Button>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
};
export default ModuleProtectedRoute;
