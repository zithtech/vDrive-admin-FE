import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axiosIns from "../../api/axios";

export type TaxType = "CENTRAL" | "STATE" | "UNION_TERRITORY" | "COMPOSITE";

// Mirrors the DB columns exactly (camelCase of snake_case)
export interface Tax {
  id: string;
  tax_name: string; // tax_name
  tax_code: string; // tax_code  (auto-generated)
  tax_type: TaxType; // tax_type  (auto-derived)
  indian_tax: string; // indian_tax e.g. "CGST", "GST"
  percentage: number; // percentage
  description: string; // description
  is_active: boolean; // is_active
  is_default: boolean; // is_default
  created_at: string; // created_at
  updated_at: string; // updated_at
}

// Payload sent to backend on create/update — no id or timestamps
export type TaxPayload = Omit<Tax, "id" | "created_at" | "updated_at">;

interface TaxState {
  taxes: Tax[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TaxState = {
  taxes: [],
  isLoading: false,
  error: null,
};

// ── Thunks ────────────────────────────────────────────────────────────────────

export const fetchTaxes = createAsyncThunk("tax/fetchTaxes", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosIns.get("/api/taxes");
    return response.data?.data || response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch taxes");
  }
});

export const addTax = createAsyncThunk(
  "tax/addTax",
  async (taxData: TaxPayload, { rejectWithValue, dispatch }) => {
    try {
      const response = await axiosIns.post("/api/taxes/create", taxData);
      dispatch(fetchTaxes());
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to add tax");
    }
  },
);

export const updateTax = createAsyncThunk(
  "tax/updateTax",
  async ({ id, taxData }: { id: string; taxData: TaxPayload }, { rejectWithValue, dispatch }) => {
    try {
      const response = await axiosIns.patch(`/api/taxes/update/${id}`, taxData);
      dispatch(fetchTaxes());
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update tax");
    }
  },
);

export const updateTaxStatus = createAsyncThunk(
  "tax/updateStatus",
  async ({ id, is_active }: { id: string; is_active: boolean }, { rejectWithValue, dispatch }) => {
    try {
      await axiosIns.patch(`/api/taxes/status/${id}`, { is_active });
      dispatch(fetchTaxes());
      return { id, is_active };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update tax status");
    }
  },
);

export const deleteTax = createAsyncThunk(
  "tax/deleteTax",
  async (id: string, { rejectWithValue, dispatch }) => {
    try {
      await axiosIns.delete(`/api/taxes/delete/${id}`);
      dispatch(fetchTaxes());
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete tax");
    }
  },
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const taxSlice = createSlice({
  name: "tax",
  initialState,
  reducers: {
    clearTaxError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchTaxes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTaxes.fulfilled, (state, action: PayloadAction<Tax[]>) => {
        state.isLoading = false;
        state.taxes = action.payload;
      })
      .addCase(fetchTaxes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // add
      .addCase(addTax.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addTax.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(addTax.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // update
      .addCase(updateTax.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateTax.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updateTax.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // toggle status
      .addCase(updateTaxStatus.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // delete
      .addCase(deleteTax.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearTaxError } = taxSlice.actions;
export default taxSlice.reducer;
