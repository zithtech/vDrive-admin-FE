import React, { createContext, useContext, useEffect, useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  loginAsync,
  logoutAsync,
  checkAuthStatus,
  fetchCurrentUser,
} from "../store/slices/authSlice";
import type { CurrentUser } from "../store/slices/authSlice";
import type { Login } from "../login/Login";

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  role: string | null;
  currentUser: CurrentUser | null;
  login: (credentials: Login) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, error, role, currentUser } = useAppSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    dispatch(checkAuthStatus());

    const handleStorageChange = () => {
      dispatch(checkAuthStatus());
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated && !currentUser) {
      dispatch(fetchCurrentUser());
    }
  }, [isAuthenticated, currentUser, dispatch]);

  const login = useCallback(
    async (credentials: Login) => {
      await dispatch(loginAsync(credentials)).unwrap();
    },
    [dispatch],
  );

  const logout = useCallback(async () => {
    await dispatch(logoutAsync()).unwrap();
  }, [dispatch]);

  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      loading,
      error,
      role,
      currentUser,
      login,
      logout,
    }),
    [isAuthenticated, loading, error, role, currentUser, login, logout],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
