import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axiosIns from "../../api/axios";

export interface Coupon {
  id: string;
  code: string;
  discount_type: "PERCENTAGE" | "FIXED" | "FREE_RIDE";
  discount_value: number;
  min_ride_amount?: number;
  max_discount_amount?: number;
  usage_limit?: number;
  per_user_limit?: number;
  valid_from: string;
  valid_until: string;
  applicable_ride_types?: any;
  user_eligibility?: string;
  applicable_to: "CUSTOMER" | "DRIVER";
  is_active: boolean;
  created_at: string;
  updated_at: string;
  notify_status?: "NONE" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  notify_sent_at?: string;
  notify_count?: number;
}

export type CouponPayload = Omit<Coupon, "id" | "created_at" | "updated_at">;

interface CouponState {
  coupons: Coupon[];
  isLoading: boolean;
  error: string | null;
  total: number;
}

const initialState: CouponState = {
  coupons: [],
  isLoading: false,
  error: null,
  total: 0,
};

export const fetchCoupons = createAsyncThunk(
  "coupon/fetchCoupons",
  async (params: { page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await axiosIns.get("/api/coupons", { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch coupons");
    }
  },
);

export const addCoupon = createAsyncThunk(
  "coupon/addCoupon",
  async (couponData: CouponPayload, { rejectWithValue, dispatch }) => {
    try {
      const response = await axiosIns.post("/api/coupons/create", couponData);
      dispatch(fetchCoupons());
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to add coupon");
    }
  },
);

export const updateCoupon = createAsyncThunk(
  "coupon/updateCoupon",
  async (
    { id, couponData }: { id: string; couponData: Partial<CouponPayload> },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const response = await axiosIns.patch(`/api/coupons/update/${id}`, couponData);
      dispatch(fetchCoupons());
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update coupon");
    }
  },
);

export const updateCouponStatus = createAsyncThunk(
  "coupon/updateStatus",
  async ({ id, is_active }: { id: string; is_active: boolean }, { rejectWithValue, dispatch }) => {
    try {
      await axiosIns.patch(`/api/coupons/status/${id}`, { is_active });
      dispatch(fetchCoupons());
      return { id, is_active };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to toggle coupon status");
    }
  },
);

export const deleteCoupon = createAsyncThunk(
  "coupon/deleteCoupon",
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      await axiosIns.delete(`/api/coupons/delete/${id}`);
      dispatch(fetchCoupons());
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete coupon");
    }
  },
);

const couponSlice = createSlice({
  name: "coupon",
  initialState,
  reducers: {
    clearCouponError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchCoupons.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchCoupons.fulfilled,
        (state, action: PayloadAction<{ coupons: Coupon[]; total: number }>) => {
          state.isLoading = false;
          state.coupons = action.payload.coupons || [];
          state.total = action.payload.total || 0;
        },
      )
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // add
      .addCase(addCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addCoupon.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(addCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // update
      .addCase(updateCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCoupon.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // toggle status & delete
      .addCase(updateCouponStatus.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearCouponError } = couponSlice.actions;
export default couponSlice.reducer;
