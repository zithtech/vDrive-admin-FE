import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axiosIns from "../../api/axios";

export interface Notification {
  id: string;
  title: string;
  body: string;
  target_type: "CUSTOMER" | "DRIVER";
  target_audience: "ALL" | "TOP_RIDE" | "LOW_RIDE" | "SPECIFIC";
  specific_user_id?: string[] | null;
  attached_offer?: string | null;
  coupon_code?: string | null;
  promo_code?: string | null;
  created_at: string;
  updated_at: string;
  notify_status?: "NONE" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  notify_sent_at?: string;
  notify_count?: number;
}

export type NotificationPayload = Omit<Notification, "id" | "created_at" | "updated_at">;

interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  isLoading: false,
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  "notification/fetchNotifications",
  async (target_type: "CUSTOMER" | "DRIVER", { rejectWithValue }) => {
    try {
      const response = await axiosIns.get(
        `/api/notification-management?target_type=${target_type}`,
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch notifications");
    }
  },
);

export const createNotification = createAsyncThunk(
  "notification/createNotification",
  async (notificationData: NotificationPayload, { rejectWithValue, dispatch }) => {
    try {
      // API call
      const response = await axiosIns.post("/api/notification-management/create", notificationData);

      // Simulate slight delay for UX
      await new Promise((resolve) => setTimeout(resolve, 600));
      dispatch(fetchNotifications(notificationData.target_type));
      return response.data || { success: true, message: "Notification created" };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to create notification");
    }
  },
);

export const updateNotification = createAsyncThunk(
  "notification/updateNotification",
  async (
    { id, notificationData }: { id: string; notificationData: Partial<NotificationPayload> },
    { rejectWithValue, dispatch },
  ) => {
    try {
      // API call
      const response = await axiosIns.patch(
        `/api/notification-management/update/${id}`,
        notificationData,
      );

      // Simulate slight delay for UX
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (notificationData.target_type) {
        dispatch(fetchNotifications(notificationData.target_type));
      }
      return response.data || { success: true, message: "Notification updated" };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update notification");
    }
  },
);

export const deleteNotification = createAsyncThunk(
  "notification/deleteNotification",
  async (
    { id, target_type }: { id: string; target_type: "CUSTOMER" | "DRIVER" },
    { rejectWithValue, dispatch },
  ) => {
    try {
      // API call
      await axiosIns.delete(`/api/notification-management/delete/${id}`);

      // Simulate slight delay for UX
      await new Promise((resolve) => setTimeout(resolve, 600));
      dispatch(fetchNotifications(target_type));
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete notification");
    }
  },
);

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<any>) => {
        state.isLoading = false;
        // Handle potentially different response structures (e.g. data array inside response)
        state.notifications = action.payload?.data || action.payload || [];
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // add
      .addCase(createNotification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createNotification.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(createNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // update
      .addCase(updateNotification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateNotification.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updateNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // delete
      .addCase(deleteNotification.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearNotificationError } = notificationSlice.actions;
export default notificationSlice.reducer;
