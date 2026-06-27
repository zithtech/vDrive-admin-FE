import { useAppSelector } from "../store/hooks";
import type { CurrentUser } from "../store/slices/authSlice";

/**
 * Pure module-access check (read permission), usable outside React render — e.g.
 * building the sidebar menu from the module registry without a hook per module.
 * super_admin is bypassed; otherwise requires read on at least one of the modules.
 */
export const hasModuleAccess = (
  currentUser: CurrentUser | null,
  module: string | string[],
): boolean => {
  if (!currentUser) return false;
  if (currentUser.role === "super_admin") return true;
  const modules = Array.isArray(module) ? module : [module];
  return modules.some((m) => !!currentUser.permissions?.[m]?.read);
};

/**
 * Hook to verify individual granular permission.
 * Checks if the current authenticated user has a specific action permission for a module.
 */
export const useHasPermission = (
  module: string,
  action: "create" | "read" | "update" | "delete",
): boolean => {
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  if (!currentUser) return false;

  // Super Admin Bypass Override
  if (currentUser.role === "super_admin") return true;

  const modulePerms = currentUser.permissions?.[module];
  return !!(modulePerms && modulePerms[action]);
};

/**
 * Hook to verify general view availability for a module (read permission).
 * Supports checking a single module or an array of modules.
 */
export const useModuleAccess = (module: string | string[]): boolean => {
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  return hasModuleAccess(currentUser, module);
};

/**
 * Hook to verify if a user has at least one matching module-action permission in a specified array.
 * Useful for enabling top-level tab buttons or bulk operational actions.
 */
interface PermissionTarget {
  module: string;
  action: "create" | "read" | "update" | "delete";
}

export const useAnyPermission = (targets: PermissionTarget[]): boolean => {
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  if (!currentUser) return false;
  if (currentUser.role === "super_admin") return true;

  return targets.some((target) => {
    const modulePerms = currentUser.permissions?.[target.module];
    return !!(modulePerms && modulePerms[target.action]);
  });
};
