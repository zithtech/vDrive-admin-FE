import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosIns from "../../api/axios";
import { logger } from "../../utils/logger";


export type DriverStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "pending"
  | "pending_verification"
  | "rejected"
  | "blocked";

export type DriverRole = "premium" | "elite" | "normal";

export interface Driver {
  id?: string;
  driver_id: string;
  driverId?: string; // Backend fallback
  vdrive_id?: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  phone_number: string;
  email: string;
  profile_pic_url: string;
  profilePicUrl?: string; // Backend fallback
  dob: string;
  date_of_birth?: string; // Backend fallback
  gender: "male" | "female" | "other";
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  role: DriverRole;
  status: DriverStatus;
  status_reason?: string;
  status_updated_at?: string;
  rating: number;
  total_trips: number;
  availability: {
    online: boolean;
    last_active: string | null;
  };
  kyc?: {
    overall_status: "verified" | "pending" | "rejected" | string;
    verified_at: string | null;
  };
  kyc_status?: string; // Backend fallback
  onboarding_status?: string;
  documents_submitted?: boolean;
  is_trip_verified?: boolean;
  language?: string;
  is_vibration_enabled?: boolean;
  fcm_token?: string;
  created_at?: string;
  updated_at?: string;
  credit: {
    limit: number;
    balance: number;
    total_recharged: number;
    total_used: number;
    last_recharge_at: string | null;
  };
  recharges: any[];
  credit_usage?: any[];
  creditUsage?: any[]; // Backend fallback
  activity_logs?: any[];
  activityLogs?: any[]; // Backend fallback
  documents: {
    document_id: string;
    document_type: string;
    document_url: string;
    document_number: string;
    license_status: string;
    expiry_date: string;
  }[];
  performance: {
    average_rating: number;
    total_trips: number;
    cancellations: number;
    last_active: string | null;
  };
  payments: {
    total_earnings: number;
    pending_payout?: number;
    commission_paid: number;
  };
  vehicle: {
    vehicle_id: string;
    vehicle_number: string;
    vehicle_type: string;
    vehicle_model: string;
    fuel_type: string;
    registration_date: string;
    insurance_expiry: string;
    rc_document_url?: string;
    status?: boolean;
  } | null;
  active_subscription?: {
    platform_subscription_id?: number;
    plan_name: string;
    billing_cycle: string;
    start_date: string;
    expiry_date: string;
    status: string;
  };
}

interface DriverState {
  drivers: Driver[];
  loading: boolean;
  error: string | null;
}

const initialState: DriverState = {
  drivers: [],
  loading: false,
  error: null,
};

export const fetchDrivers = createAsyncThunk(
  "drivers/fetchDrivers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosIns.get("/api/drivers");
      const respData = response.data;
      logger.debug("DRIVER API RESPONSE:", respData);
      let extractedData: any[] = [];

      // Attempt to extract the array from various common response structures
      if (Array.isArray(respData)) {
        extractedData = respData;
      } else if (Array.isArray(respData?.data)) {
        extractedData = respData.data;
      } else if (Array.isArray(respData?.data?.data)) {
        extractedData = respData.data.data;
      } else if (Array.isArray(respData?.data?.drivers)) {
        extractedData = respData.data.drivers;
      } else if (Array.isArray(respData?.drivers)) {
        extractedData = respData.drivers;
      } else if (respData.data?.items && Array.isArray(respData.data.items)) {
        extractedData = respData.data.items;
      } else if (respData.items && Array.isArray(respData.items)) {
        extractedData = respData.items;
      } else if (respData.data?.results && Array.isArray(respData.data.results)) {
        extractedData = respData.data.results;
      } else if (respData.results && Array.isArray(respData.results)) {
        extractedData = respData.results;
      } else if (respData.data?.list && Array.isArray(respData.data.list)) {
        extractedData = respData.data.list;
      } else if (respData.list && Array.isArray(respData.list)) {
        extractedData = respData.list;
      } else if (respData.payload && Array.isArray(respData.payload)) {
        extractedData = respData.payload;
      } else if (respData.data?.payload && Array.isArray(respData.data.payload)) {
        extractedData = respData.data.payload;
      }

      return extractedData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Something went wrong");
    }
  }
);

export const updateDriverStatus = createAsyncThunk(
  "drivers/updateDriverStatus",
  async (
    { driver_id, status, status_reason }: { driver_id: string; status: DriverStatus; status_reason?: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosIns.patch(`/api/drivers/${driver_id}`, {
        status,
        ...(status_reason ? { status_reason } : {}),
      });
      return response.data?.data || response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update status",
      );
    }
  },
);

export const updateDriverProfile = createAsyncThunk(
  "drivers/updateDriverProfile",
  async (
    { driver_id, data }: { driver_id: string; data: Partial<Driver> },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosIns.patch(`/api/drivers/${driver_id}`, data);
      return response.data?.data || response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update profile",
      );
    }
  },
);

export const updateDocumentStatus = createAsyncThunk(
  "drivers/updateDocumentStatus",
  async (
    {
      document_id,
      status,
      reason,
    }: {
      driver_id: string;
      document_id: string;
      status: string;
      reason?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosIns.patch(
        `/api/drivers/documents/verify/${document_id}`,
        { status, reason },
      );
      return response.data?.data || response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to update document status",
      );
    }
  },
);

export const bulkVerifyDocuments = createAsyncThunk(
  "drivers/bulkVerifyDocuments",
  async (driver_id: string, { rejectWithValue }) => {
    try {
      const response = await axiosIns.patch(`/api/drivers/documents/bulk-verify/${driver_id}`);
      return response.data?.data || response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to bulk verify documents",
      );
    }
  },
);

export const fetchDocumentHistory = createAsyncThunk(
  "drivers/fetchDocumentHistory",
  async (document_id: string, { rejectWithValue }) => {
    try {
      const response = await axiosIns.get(`/api/drivers/documents/history/${document_id}`);
      return response.data?.data || response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to fetch document history",
      );
    }
  },
);

export const resetDriverPassword = createAsyncThunk(
  "drivers/resetDriverPassword",
  async (driver_id: string, { rejectWithValue }) => {
    try {
      const response = await axiosIns.post(
        `/api/drivers/${driver_id}/reset-password`,
      );
      return response.data?.data || response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to reset password",
      );
    }
  },
);

export const verifyDriverAccount = createAsyncThunk(
  "drivers/verifyDriverAccount",
  async (driver_id: string, { rejectWithValue }) => {
    try {
      const response = await axiosIns.post(`/api/drivers/admin-verify/${driver_id}`);
      return response.data?.data || response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to verify driver account",
      );
    }
  },
);

const driverSlice = createSlice({
  name: "drivers",
  initialState,
  reducers: {
    clearDrivers: (state) => {
      state.drivers = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDrivers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDrivers.fulfilled, (state, action) => {
        state.loading = false;
        state.drivers = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchDrivers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateDriverStatus.fulfilled, (state, action) => {
        const updatedDriver = action.payload;
        const index = state.drivers.findIndex((d) => {
          const dId = d.driverId || d.driver_id || d.id;
          const uId = updatedDriver.driverId || updatedDriver.driver_id || updatedDriver.id;
          return dId === uId;
        });
        if (index !== -1) {
          state.drivers[index] = updatedDriver;
        }
      })
      .addCase(updateDriverProfile.fulfilled, (state, action) => {
        const updatedDriver = action.payload;
        const index = state.drivers.findIndex((d) => {
          const dId = d.driverId || d.driver_id || d.id;
          const uId = updatedDriver.driverId || updatedDriver.driver_id || updatedDriver.id;
          return dId === uId;
        });
        if (index !== -1) {
          state.drivers[index] = updatedDriver;
        }
      })
      .addCase(updateDocumentStatus.fulfilled, (state, action) => {
        const updatedDriver = action.payload;
        const index = state.drivers.findIndex((d) => {
          const dId = d.driverId || d.driver_id || d.id;
          const uId = updatedDriver.driverId || updatedDriver.driver_id || updatedDriver.id;
          return dId === uId;
        });
        if (index !== -1) {
          state.drivers[index] = updatedDriver;
        }
      })
      .addCase(bulkVerifyDocuments.fulfilled, (state, action) => {
        const updatedDriver = action.payload;
        const index = state.drivers.findIndex((d) => {
          const dId = d.driverId || d.driver_id || d.id;
          const uId = updatedDriver.driverId || updatedDriver.driver_id || updatedDriver.id;
          return dId === uId;
        });
        if (index !== -1) {
          state.drivers[index] = updatedDriver;
        }
      })
      .addCase(verifyDriverAccount.fulfilled, (state, action) => {
        const updatedDriver = action.payload;
        const index = state.drivers.findIndex((d) => {
          const dId = d.driverId || d.driver_id || d.id;
          const uId = updatedDriver.driverId || updatedDriver.driver_id || updatedDriver.id;
          return dId === uId;
        });
        if (index !== -1) {
          state.drivers[index] = { ...state.drivers[index], ...updatedDriver };
        }
      });
  },
});

export const { clearDrivers } = driverSlice.actions;
export default driverSlice.reducer;
