import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axiosIns from "../../api/axios";
import axios from "axios";

export interface PricingFareRule {
  id: string;
  country_name: string;
  country_id: string;
  state_name: string | null;
  state_id: string | null;
  district_name: string | null;
  district_id: string | null;
  area_name: string;
  area_id: string;
  per_km_price: number;
  per_hour_price: number;
  minimum_fare: number;
  one_way_return_pct: number;
  is_hotspot: boolean;
  hotspot_id: string | null;
  hotspot_name: string | null;
  multiplier: number | null;
  pincode: string | null;
  extra_km_checkpoints?: Array<{ id: string; from_km: number; price: number; sort_order: number }>;
  time_slots?: DriverTimeSlot[];
}

export interface DriverTimeSlot {
  id: string;
  price_and_fare_rules_id: string;
  driver_types: string;
  day: string;
  from_time: string;
  to_time: string;
  per_km_rate: number;
  per_hour_rate: number;
}

interface PricingFareRulesState {
  fareRules: PricingFareRule[];
  isLoading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  pageSize: number;
  filters: {
    search?: string;
    area_id?: string;
    district_id?: string;
    is_hotspot?: boolean;
  };
}

const initialState: PricingFareRulesState = {
  fareRules: [],
  isLoading: false,
  error: null,
  total: 0,
  currentPage: 1,
  pageSize: 10,
  filters: {},
};

// Cancel token for managing concurrent requests
let cancelTokenSource: ReturnType<typeof axios.CancelToken.source> | null = null;

// Async thunk to fetch pricing fare rules
export const fetchPricingFareRules = createAsyncThunk(
  "pricingFareRules/fetchPricingFareRules",
  async (
    {
      page = 1,
      limit = 10,
      search = "",
      area_id,
      district_id,
      is_hotspot,
      include_time_slots = false,
    }: {
      page?: number;
      limit?: number;
      search?: string;
      area_id?: string;
      district_id?: string;
      is_hotspot?: boolean;
      include_time_slots?: boolean;
    },
    { rejectWithValue },
  ) => {
    try {
      // Cancel previous request if it exists
      if (cancelTokenSource) {
        cancelTokenSource.cancel("Operation canceled due to new request.");
      }

      // Create new cancel token
      cancelTokenSource = axios.CancelToken.source();

      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (search) params.append("search", search);
      if (area_id) params.append("area_id", area_id);
      if (district_id) params.append("district_id", district_id);
      if (is_hotspot !== undefined) params.append("is_hotspot", String(is_hotspot));
      if (include_time_slots) params.append("include_time_slots", "true");

      const response = await axiosIns.get(`/api/pricing-fare-rules?${params.toString()}`, {
        cancelToken: cancelTokenSource.token,
      });

      return {
        data: response.data.data.data,
        total: response.data.data.total,
        page,
        limit,
      };
    } catch (error) {
      if (axios.isCancel(error)) {
        return rejectWithValue("cancelled");
      }
      throw error;
    }
  },
);

// Async thunk to fetch single pricing fare rule by ID (includes time slots)
export const fetchPricingFareRuleById = createAsyncThunk(
  "pricingFareRules/fetchPricingFareRuleById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosIns.get(`/api/pricing-fare-rules/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch pricing fare rule");
    }
  },
);

// Async thunk to create pricing fare rule with time slots
export const createPricingRuleWithSlots = createAsyncThunk(
  "pricingFareRules/createPricingRuleWithSlots",
  async (
    data: {
      district_id: string;
      area_id?: string | null;
      per_km_price: number;
      per_hour_price?: number;
      minimum_fare?: number;
      one_way_return_pct?: number;
      is_hotspot: boolean;
      hotspot_id?: string | null;
      multiplier?: number | null;
      extra_km_checkpoints?: Array<{ from_km: number; price: number; sort_order: number }>;
      time_slots: Array<{
        driver_types: string;
        day: string;
        from_time: string;
        to_time: string;
        per_km_rate: number;
        per_hour_rate: number;
      }>;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosIns.post("/api/pricing-fare-rules/with-slots", data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create pricing fare rule with slots",
      );
    }
  },
);

// Async thunk to update pricing fare rule with time slots
export const updatePricingRuleWithSlots = createAsyncThunk(
  "pricingFareRules/updatePricingRuleWithSlots",
  async (
    {
      id,
      data,
    }: {
      id: string;
      data: {
        district_id?: string;
        area_id?: string | null;
        per_km_price?: number;
        per_hour_price?: number;
        minimum_fare?: number;
        one_way_return_pct?: number;
        is_hotspot?: boolean;
        hotspot_id?: string | null;
        multiplier?: number | null;
        extra_km_checkpoints?: Array<{ from_km: number; price: number; sort_order: number }>;
        time_slots?: Array<{
          driver_types: string;
          day: string;
          from_time: string;
          to_time: string;
          per_km_rate: number;
          per_hour_rate: number;
        }>;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosIns.put(`/api/pricing-fare-rules/with-slots/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update pricing fare rule with slots",
      );
    }
  },
);

const pricingFareRulesSlice = createSlice({
  name: "pricingFareRules",
  initialState,
  reducers: {
    clearFareRules: (state) => {
      state.fareRules = [];
      state.total = 0;
    },
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action: PayloadAction<typeof initialState.filters>) => {
      state.filters = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPricingFareRules.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchPricingFareRules.fulfilled,
        (
          state,
          action: PayloadAction<{
            data: PricingFareRule[];
            total: number;
            page: number;
            limit: number;
          }>,
        ) => {
          state.isLoading = false;
          state.fareRules = action.payload.data;
          state.total = action.payload.total;
          state.currentPage = action.payload.page;
          state.pageSize = action.payload.limit;
        },
      )
      .addCase(fetchPricingFareRules.rejected, (state, action) => {
        // Don't set isLoading to false if request was cancelled
        // because a new request is already in progress
        if (action.payload === "cancelled") {
          // Don't change isLoading state - let the new pending request handle it
        } else {
          state.isLoading = false;
          state.error = action.error.message || "Failed to fetch pricing fare rules";
        }
      })
      .addCase(fetchPricingFareRuleById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchPricingFareRuleById.fulfilled,
        (state, action: PayloadAction<PricingFareRule>) => {
          state.isLoading = false;
          // Optionally update the fareRules array with the detailed data
          const index = state.fareRules.findIndex((rule) => rule.id === action.payload.id);
          if (index !== -1) {
            state.fareRules[index] = action.payload;
          }
        },
      )
      .addCase(fetchPricingFareRuleById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch pricing fare rule";
      })
      .addCase(createPricingRuleWithSlots.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPricingRuleWithSlots.fulfilled, (state) => {
        state.isLoading = false;
        // Optionally refresh the list after creation
      })
      .addCase(createPricingRuleWithSlots.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to create pricing fare rule with slots";
      })
      .addCase(updatePricingRuleWithSlots.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePricingRuleWithSlots.fulfilled, (state) => {
        state.isLoading = false;
        // Optionally refresh list or update specific item here
      })
      .addCase(updatePricingRuleWithSlots.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to update pricing fare rule with slots";
      });
  },
});

export const { clearFareRules, clearError, setFilters, setPage, setPageSize } =
  pricingFareRulesSlice.actions;
export default pricingFareRulesSlice.reducer;
