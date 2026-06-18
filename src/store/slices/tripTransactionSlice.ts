import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosIns from "../../api/axios";

export interface TripTransactionEvent {
  id: string;
  trip_id: string;
  trip_code: string;
  sequence_no: number;
  event_type: string;
  status: string;
  actor_type: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_ip: string | null;
  actor_device: string | null;
  entity_snapshot: any;
  changed_fields: string[];
  old_value: any;
  new_value: any;
  notes: string | null;
  metadata: any;
  failure_reason: string | null;
  parent_transaction_id: string | null;
  event_at: string;
  created_at: string;
}

interface TripTransactionResponse {
  total: number;
  transactions: TripTransactionEvent[];
  user: {
    id: string;
    name: string;
    phone_number: string;
  } | null;
  driver: {
    id: string;
    name: string;
    phone_number: string;
  } | null;
}

interface TripTransactionState {
  tripData: TripTransactionResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: TripTransactionState = {
  tripData: null,
  loading: false,
  error: null,
};

export const fetchTripTransaction = createAsyncThunk(
  "tripTransaction/fetchTripTransaction",
  async (tripId: string, { rejectWithValue }) => {
    try {
      const response = await axiosIns.get(`/api/triptransactions/bytripid/${tripId}`);
      return response.data?.data || response.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || err.message || "Failed to fetch trip transaction",
      );
    }
  },
);

const tripTransactionSlice = createSlice({
  name: "tripTransaction",
  initialState,
  reducers: {
    clearTripTransaction: (state) => {
      state.tripData = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTripTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.tripData = null;
      })
      .addCase(fetchTripTransaction.fulfilled, (state, action) => {
        state.loading = false;
        state.tripData = action.payload;
      })
      .addCase(fetchTripTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTripTransaction } = tripTransactionSlice.actions;
export default tripTransactionSlice.reducer;
