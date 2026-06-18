import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axiosIns from "../../api/axios";

export interface Promo {
  id: number;
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  target_type: "global" | "specific_driver" | "ride_count_based";
  target_driver_id?: string;
  min_rides_required?: number;
  max_uses?: number;
  max_uses_per_driver?: number;
  start_date: string;
  expiry_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  notify_status?: "NONE" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  notify_sent_at?: string;
  notify_count?: number;
}

export type PromoPayload = Omit<Promo, "id" | "created_at" | "updated_at">;

interface PromoState {
  promos: Promo[];
  isLoading: boolean;
  error: string | null;
  total: number;
}

const initialState: PromoState = {
  promos: [],
  isLoading: false,
  error: null,
  total: 0,
};

export const fetchPromos = createAsyncThunk(
  "promo/fetchPromos",
  async (params: { page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await axiosIns.get("/api/promos", { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch promos");
    }
  },
);

export const addPromo = createAsyncThunk(
  "promo/addPromo",
  async (promoData: PromoPayload, { rejectWithValue, dispatch }) => {
    try {
      const response = await axiosIns.post("/api/promos", promoData);
      dispatch(fetchPromos());
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to add promo");
    }
  },
);

export const updatePromo = createAsyncThunk(
  "promo/updatePromo",
  async (
    { id, promoData }: { id: number; promoData: Partial<PromoPayload> },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const response = await axiosIns.put(`/api/promos/${id}`, promoData);
      dispatch(fetchPromos());
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update promo");
    }
  },
);

export const updatePromoStatus = createAsyncThunk(
  "promo/updateStatus",
  async ({ id, is_active }: { id: number; is_active: boolean }, { rejectWithValue, dispatch }) => {
    try {
      await axiosIns.patch(`/api/promos/${id}/toggle`, { is_active });
      dispatch(fetchPromos());
      return { id, is_active };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to toggle promo status");
    }
  },
);

export const deletePromo = createAsyncThunk(
  "promo/deletePromo",
  async (id: number, { rejectWithValue, dispatch }) => {
    try {
      await axiosIns.delete(`/api/promos/${id}`);
      dispatch(fetchPromos());
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete promo");
    }
  },
);

export const notifyPromo = createAsyncThunk(
  "promo/notify",
  async (
    { id, target, driverId }: { id: number; target: string; driverId?: string },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const response = await axiosIns.post(`/api/promos/notify/${id}`, { target, driverId });
      dispatch(fetchPromos());
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to trigger notification");
    }
  },
);

const promoSlice = createSlice({
  name: "promo",
  initialState,
  reducers: {
    clearPromoError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPromos.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchPromos.fulfilled,
        (state, action: PayloadAction<{ data: Promo[]; total: number }>) => {
          state.isLoading = false;
          state.promos = action.payload.data || [];
          state.total = action.payload.total || 0;
        },
      )
      .addCase(fetchPromos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearPromoError } = promoSlice.actions;
export default promoSlice.reducer;
