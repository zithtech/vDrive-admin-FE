import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axiosIns from "../../api/axios";

export interface PricingCombination {
  id: string;
  tier: number;
  duration: number;
  distance: number;
  type: "Base" | "Extra KM";
  price: number;
  per_km_rate: number;
  created_at: string;
  updated_at: string;
}

export type PricingCombinationPayload = Omit<
  PricingCombination,
  "id" | "created_at" | "updated_at"
>;

interface PricingCombinationState {
  combinations: PricingCombination[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PricingCombinationState = {
  combinations: [],
  isLoading: false,
  error: null,
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchPricingCombinations = createAsyncThunk(
  "pricingCombination/fetchPricingCombinations",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosIns.get("/api/pricing-combinations");
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch pricing combinations",
      );
    }
  },
);

export const addPricingCombination = createAsyncThunk(
  "pricingCombination/addPricingCombination",
  async (combinationData: PricingCombinationPayload, { rejectWithValue, dispatch }) => {
    try {
      const response = await axiosIns.post("/api/pricing-combinations/create", combinationData);
      dispatch(fetchPricingCombinations());
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to add pricing combination");
    }
  },
);

export const updatePricingCombination = createAsyncThunk(
  "pricingCombination/updatePricingCombination",
  async (
    { id, combinationData }: { id: string; combinationData: PricingCombinationPayload },
    { rejectWithValue, dispatch },
  ) => {
    try {
      const response = await axiosIns.patch(
        `/api/pricing-combinations/update/${id}`,
        combinationData,
      );
      dispatch(fetchPricingCombinations());
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update pricing combination",
      );
    }
  },
);

export const deletePricingCombination = createAsyncThunk(
  "pricingCombination/deletePricingCombination",
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      await axiosIns.delete(`/api/pricing-combinations/delete/${id}`);
      dispatch(fetchPricingCombinations());
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete pricing combination",
      );
    }
  },
);

export const bulkCreatePricingCombinations = createAsyncThunk(
  "pricingCombination/bulkCreate",
  async (combinations: PricingCombinationPayload[], { rejectWithValue, dispatch }) => {
    try {
      const response = await axiosIns.post("/api/pricing-combinations/", {
        combinations,
      });
      dispatch(fetchPricingCombinations());
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to save pricing matrix");
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const pricingCombinationSlice = createSlice({
  name: "pricingCombination",
  initialState,
  reducers: {
    clearPricingError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchPricingCombinations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchPricingCombinations.fulfilled,
        (state, action: PayloadAction<PricingCombination[]>) => {
          state.isLoading = false;
          state.combinations = action.payload;
        },
      )
      .addCase(fetchPricingCombinations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // add
      .addCase(addPricingCombination.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addPricingCombination.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(addPricingCombination.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // update
      .addCase(updatePricingCombination.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePricingCombination.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updatePricingCombination.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // delete
      .addCase(deletePricingCombination.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deletePricingCombination.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(deletePricingCombination.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // bulk create
      .addCase(bulkCreatePricingCombinations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkCreatePricingCombinations.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(bulkCreatePricingCombinations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearPricingError } = pricingCombinationSlice.actions;
export default pricingCombinationSlice.reducer;
