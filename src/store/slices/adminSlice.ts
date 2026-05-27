import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axiosIns from "../../api/axios";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  contact: string | null;
  role: string;
  role_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_deleted: boolean;
}

interface AdminState {
  admins: AdminUser[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
}

const initialState: AdminState = {
  admins: [],
  loading: false,
  submitting: false,
  error: null,
};

export const fetchAdminUsers = createAsyncThunk(
  "admin/fetchAdminUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosIns.get("/api/admin-users");
      return response.data.data as AdminUser[];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch admin users"
      );
    }
  }
);

export const createAdminUser = createAsyncThunk(
  "admin/createAdminUser",
  async (
    data: {
      name: string;
      email: string;
      password: string;
      role: string;
      role_id?: string;
      contact?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosIns.post("/api/admin-users", data);
      return response.data.data as AdminUser;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create admin user"
      );
    }
  }
);

export const updateAdminUser = createAsyncThunk(
  "admin/updateAdminUser",
  async (
    {
      id,
      data,
    }: {
      id: string;
      data: {
        name?: string;
        email?: string;
        contact?: string;
        role?: string;
        role_id?: string;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosIns.put(`/api/admin-users/${id}`, data);
      return response.data.data as AdminUser;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update admin user"
      );
    }
  }
);

export const deleteAdminUser = createAsyncThunk(
  "admin/deleteAdminUser",
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosIns.delete(`/api/admin-users/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete admin user"
      );
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAdminUsers.fulfilled,
        (state, action: PayloadAction<AdminUser[]>) => {
          state.loading = false;
          state.admins = action.payload;
        }
      )
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch admin users";
      })

      .addCase(createAdminUser.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(
        createAdminUser.fulfilled,
        (state, action: PayloadAction<AdminUser>) => {
          state.submitting = false;
          state.admins.unshift(action.payload);
        }
      )
      .addCase(createAdminUser.rejected, (state, action) => {
        state.submitting = false;
        state.error = (action.payload as string) || "Failed to create admin user";
      })

      .addCase(updateAdminUser.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(
        updateAdminUser.fulfilled,
        (state, action: PayloadAction<AdminUser>) => {
          state.submitting = false;
          const index = state.admins.findIndex(
            (a) => a.id === action.payload.id
          );
          if (index !== -1) {
            state.admins[index] = action.payload;
          }
        }
      )
      .addCase(updateAdminUser.rejected, (state, action) => {
        state.submitting = false;
        state.error = (action.payload as string) || "Failed to update admin user";
      })

      .addCase(deleteAdminUser.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(
        deleteAdminUser.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.submitting = false;
          state.admins = state.admins.filter((a) => a.id !== action.payload);
        }
      )
      .addCase(deleteAdminUser.rejected, (state, action) => {
        state.submitting = false;
        state.error = (action.payload as string) || "Failed to delete admin user";
      });
  },
});

export const { clearError } = adminSlice.actions;
export default adminSlice.reducer;
