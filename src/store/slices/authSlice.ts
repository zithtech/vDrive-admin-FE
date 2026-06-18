import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axiosIns from "../../api/axios";
import type { Login } from "../../login/Login";

export interface ModulePermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
}

export interface PermissionMap {
  [moduleName: string]: ModulePermissions;
}

export const DEFAULT_PERMISSIONS: PermissionMap = {
  dashboard: { create: true, read: true, update: true, delete: true },
  customers: { create: true, read: true, update: true, delete: true },
  drivers: { create: true, read: true, update: true, delete: true },
  admins: { create: true, read: true, update: true, delete: true },
  pricing: { create: true, read: true, update: true, delete: true },
  deductions: { create: true, read: true, update: true, delete: true },
  recharge: { create: true, read: true, update: true, delete: true },
  taxes: { create: true, read: true, update: true, delete: true },
  coupons: { create: true, read: true, update: true, delete: true },
  notifications: { create: true, read: true, update: true, delete: true },
};

export const RESTRICTED_ADMIN_PERMISSIONS: PermissionMap = {
  dashboard: { create: false, read: true, update: false, delete: false },
  customers: { create: true, read: true, update: true, delete: false },
  drivers: { create: true, read: true, update: true, delete: false },
  admins: { create: false, read: false, update: false, delete: false },
  pricing: { create: false, read: true, update: false, delete: false },
  deductions: { create: false, read: true, update: false, delete: false },
  recharge: { create: false, read: true, update: false, delete: false },
  taxes: { create: false, read: true, update: false, delete: false },
  coupons: { create: true, read: true, update: true, delete: false },
  notifications: { create: true, read: true, update: false, delete: false },
};

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  contact: string | null;
  role: "admin" | "super_admin";
  permissions?: PermissionMap;
}

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  accessToken: string | null;
  role: "admin" | "super_admin" | null;
  currentUser: CurrentUser | null;
}

const initialState: AuthState = {
  isAuthenticated: !!localStorage.getItem("accessToken"),
  loading: false,
  error: null,
  accessToken: localStorage.getItem("accessToken"),
  role: null,
  currentUser: null,
};

export const loginAsync = createAsyncThunk(
  "auth/login",
  async (credentials: Login, { dispatch, rejectWithValue }) => {
    try {
      const response = await axiosIns.post("/api/auth/signIn", {
        user_name: credentials.userName,
        password: credentials.password,
      });

      const token = response.data.data.accessToken;

      if (!token) {
        throw new Error("Authentication failed: token not found.");
      }

      localStorage.setItem("accessToken", token);

      await dispatch(fetchCurrentUser());

      return { accessToken: token };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || error.message || "Login failed"
      );
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosIns.get("/api/auth/me");
      return response.data.data as CurrentUser;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch user profile"
      );
    }
  }
);

export const logoutAsync = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosIns.post("/api/auth/signout");

      if (data?.success) {
        localStorage.removeItem("accessToken");
        return;
      }

      throw new Error("Logout failed");
    } catch (error: any) {
      localStorage.removeItem("accessToken");
      return rejectWithValue(
        error.response?.data?.message || error.message || "Logout failed"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthenticated: (state, action: PayloadAction<boolean>) => {
      state.isAuthenticated = action.payload;
    },
    setAccessToken: (state, action: PayloadAction<string | null>) => {
      state.accessToken = action.payload;
      if (action.payload) {
        localStorage.setItem("accessToken", action.payload);
        state.isAuthenticated = true;
      } else {
        localStorage.removeItem("accessToken");
        state.isAuthenticated = false;
        state.role = null;
        state.currentUser = null;
      }
    },
    clearCountryError: (state) => {
      state.error = null;
    },
    checkAuthStatus: (state) => {
      const token = localStorage.getItem("accessToken");
      state.isAuthenticated = !!token;
      state.accessToken = token;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.error = null;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.role = null;
        state.currentUser = null;
        state.error = action.payload as string;
      });

    builder
      .addCase(fetchCurrentUser.fulfilled, (state, action: PayloadAction<CurrentUser>) => {
        const user = { ...action.payload };
        if (!user.permissions) {
          user.permissions = user.role === 'super_admin' ? DEFAULT_PERMISSIONS : RESTRICTED_ADMIN_PERMISSIONS;
        }
        state.currentUser = user;
        state.role = user.role;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.role = null;
        state.currentUser = null;
      });

    builder
      .addCase(logoutAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutAsync.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.role = null;
        state.currentUser = null;
        state.error = null;
      })
      .addCase(logoutAsync.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.role = null;
        state.currentUser = null;
        state.error = action.payload as string;
      });
  },
});

export const {
  setAuthenticated,
  setAccessToken,
  clearCountryError,
  checkAuthStatus,
} = authSlice.actions;
export default authSlice.reducer;
