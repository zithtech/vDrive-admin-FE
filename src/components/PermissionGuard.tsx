import React from "react";
import { useHasPermission } from "../hooks/usePermission";

interface PermissionGuardProps {
  module: string;
  action: "create" | "read" | "update" | "delete";
  children: React.ReactNode;
  fallback?: React.ReactNode;
  behavior?: "hide" | "disable";
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  module,
  action,
  children,
  fallback = null,
  behavior = "hide",
}) => {
  const isAllowed = useHasPermission(module, action);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (behavior === "disable" && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      disabled: true,
      title: "Action restricted. Insufficient privileges.",
      className: `${children.props.className || ""} opacity-40 cursor-not-allowed pointer-events-none`,
    });
  }

  return <>{fallback}</>;
};
