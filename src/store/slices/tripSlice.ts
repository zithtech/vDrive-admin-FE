import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosIns from "../../api/axios";

// ─── Trip Transaction (replaces TripHistoryItem + old trip_changes) ───────────
export interface TripTransaction {
  id: string;
  trip_id: string;
  sequence_no: number;
  event_type: string;
  status: string;
  actor_type: string;
  actor_id: string | null;
  actor_name: string | null;
  changed_fields: string[] | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown>;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  event_at: string;
}

export interface TripDetailsType {
  trip_id: string;
  user_id: string;
  user_name: string;
  user_phone: string;
  driver_id: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  vehicle_id: string | null;
  car_number: string | null;
  car_type: string | null;
  ride_type: "ONE_WAY" | "ROUND_TRIP" | "DAILY" | "OUTSTATION";
  service_type: "DRIVER_ONLY" | "CAB+DRIVER";
  booking_type: "SCHEDULED" | "LIVE";
  trip_status:
    | "LIVE"
    | "COMPLETED"
    | "CANCELLED"
    | "UPCOMING"
    | "REQUESTED"
    | "MID_CANCELLED"
    | "ASSIGNED";
  original_scheduled_start_time: string;
  scheduled_start_time: string;
  actual_pickup_time: string | null;
  actual_drop_time: string | null;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address: string;
  drop_lat: number;
  drop_lng: number;
  drop_address: string;
  distance_km: number;
  trip_duration_minutes: number;
  waiting_time_minutes: number;
  Estimate_km: number;
  distance_fare_per_km: number;
  distance_fare: number;
  base_fare: number;
  time_fare_per_minute: number;
  time_fare: number;
  waiting_charges: number;
  driver_allowance: number;
  return_compensation: number;
  platform_fee: number;
  total_fare: number;
  surge_multiplier: number;
  surge_pricing: number;
  tip: number;
  toll_charges: number;
  night_charges: number;
  discount: number;
  gst_percentage: number;
  gst_amount: number;
  subtotal: number;
  paid_amount: number;
  payment_status: "PAID" | "PENDING" | "FAILED";
  payment_method: "UPI" | "CASH" | "CARD" | "WALLET";
  cancel_reason: string | null;
  cancel_by: "USER" | "DRIVER" | "ADMIN" | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  assigned_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  trip_code: string;
  trip_transactions: TripTransaction[]; // ← replaced trip_changes
}

// ─── buildTripHistory now uses trip_transactions ──────────────────────────────
export const buildTripHistory = (trip: TripDetailsType): TripTransaction[] => {
  if (!Array.isArray(trip.trip_transactions)) return [];

  // Already ordered by sequence_no ASC from the backend
  // Just return them — no need to reconstruct manually anymore
  return trip.trip_transactions;
};

// ─── State ────────────────────────────────────────────────────────────────────
interface TripState {
  trips: TripDetailsType[];
  loading: boolean;
  error: string | null;
}

const initialState: TripState = {
  trips: [
    {
      trip_id: "trip_124",
      user_id: "user_111aaa",
      user_name: "Arun",
      user_phone: "9876543210",
      driver_id: "driver_111bbb",
      driver_name: "Ramesh",
      driver_phone: "9123456789",
      vehicle_id: "vehicle_11",
      car_number: "TN01AB1234",
      car_type: "Sedan",
      ride_type: "ONE_WAY",
      service_type: "DRIVER_ONLY",
      booking_type: "LIVE",
      trip_status: "COMPLETED",
      original_scheduled_start_time: "2025-12-15T09:00:00Z",
      scheduled_start_time: "2025-12-15T09:00:00Z",
      actual_pickup_time: "2025-12-15T09:05:00Z",
      actual_drop_time: "2025-12-15T10:10:00Z",
      pickup_lat: 13.0604,
      pickup_lng: 80.2496,
      pickup_address: "Koramangala 4th Block, Bangalore",
      drop_lat: 13.0827,
      drop_lng: 80.2707,
      drop_address: "Whitefield Main Road, Bangalore",
      Estimate_km: 13,
      distance_km: 14.2,
      trip_duration_minutes: 65,
      waiting_time_minutes: 0,
      base_fare: 300,
      distance_fare_per_km: 13,
      distance_fare: 184.6,
      time_fare_per_minute: 1.5,
      time_fare: 97.5,
      waiting_charges: 0,
      driver_allowance: 150,
      return_compensation: 0,
      surge_multiplier: 1.2,
      surge_pricing: 96,
      tip: 20,
      toll_charges: 35,
      night_charges: 0,
      discount: 50,
      subtotal: 833.1,
      gst_percentage: 5,
      gst_amount: 41.66,
      platform_fee: 80,
      total_fare: 954.76,
      paid_amount: 954.76,
      payment_status: "PAID",
      payment_method: "UPI",
      cancel_reason: null,
      cancel_by: null,
      notes: null,
      created_at: "2025-12-15T08:30:00Z",
      updated_at: "2025-12-15T10:10:00Z",
      assigned_at: "2025-12-15T08:50:00Z",
      started_at: "2025-12-15T09:05:00Z",
      ended_at: "2025-12-15T10:10:00Z",
      trip_code: "TRIP_124",
      // ── Replaced trip_changes with trip_transactions ──────────────────────
      trip_transactions: [
        {
          id: "tx_001",
          trip_id: "trip_124",
          sequence_no: 1,
          event_type: "trip_requested",
          status: "success",
          actor_type: "user",
          actor_id: "user_111aaa",
          actor_name: "Arun",
          changed_fields: null,
          old_value: null,
          new_value: { trip_status: "REQUESTED" },
          notes: "Trip created by user",
          metadata: null,
          event_at: "2025-12-15T08:30:00Z",
        },
        {
          id: "tx_002",
          trip_id: "trip_124",
          sequence_no: 2,
          event_type: "driver_assigned",
          status: "success",
          actor_type: "system",
          actor_id: null,
          actor_name: "Auto-Assign",
          changed_fields: ["driver_id"],
          old_value: { driver_id: null },
          new_value: { driver_id: "driver_111bbb" },
          notes: "Driver auto-assigned",
          metadata: null,
          event_at: "2025-12-15T08:50:00Z",
        },
        {
          id: "tx_003",
          trip_id: "trip_124",
          sequence_no: 3,
          event_type: "trip_accepted",
          status: "success",
          actor_type: "driver",
          actor_id: "driver_111bbb",
          actor_name: "Ramesh",
          changed_fields: ["trip_status"],
          old_value: { trip_status: "REQUESTED" },
          new_value: { trip_status: "ACCEPTED" },
          notes: "Trip accepted by driver",
          metadata: null,
          event_at: "2025-12-15T08:55:00Z",
        },
        {
          id: "tx_004",
          trip_id: "trip_124",
          sequence_no: 4,
          event_type: "trip_started",
          status: "success",
          actor_type: "driver",
          actor_id: "driver_111bbb",
          actor_name: "Ramesh",
          changed_fields: ["trip_status", "actual_pickup_time"],
          old_value: { trip_status: "ACCEPTED" },
          new_value: { trip_status: "LIVE" },
          notes: "Trip started",
          metadata: null,
          event_at: "2025-12-15T09:05:00Z",
        },
        {
          id: "tx_005",
          trip_id: "trip_124",
          sequence_no: 5,
          event_type: "trip_completed",
          status: "success",
          actor_type: "driver",
          actor_id: "driver_111bbb",
          actor_name: "Ramesh",
          changed_fields: ["trip_status", "actual_drop_time"],
          old_value: { trip_status: "LIVE" },
          new_value: { trip_status: "COMPLETED" },
          notes: "Trip completed",
          metadata: null,
          event_at: "2025-12-15T10:10:00Z",
        },
      ],
    },
  ],
  loading: false,
  error: null,
};

// ─── Async thunk ──────────────────────────────────────────────────────────────
export const fetchTrips = createAsyncThunk("trips/fetchTrips", async (_, { rejectWithValue }) => {
  try {
    const response = await axiosIns.get("/api/trips");
    return response.data.data;
  } catch (err: any) {
    return rejectWithValue(err.response?.data?.data || "Something went wrong");
  }
});

// ─── Selectors ────────────────────────────────────────────────────────────────
export const selectTripByCode = (state: { trips: { trips: any[] } }, tripCode: string) =>
  state.trips.trips.find((t) => t.trip_code === tripCode);

export const selectTripIdByCode = (state: { trips: { trips: any[] } }, tripCode: string) => {
  return state.trips.trips.find((t) => t.trip_code === tripCode)?.trip_id;
};

// ─── Slice ────────────────────────────────────────────────────────────────────
const tripSlice = createSlice({
  name: "trips",
  initialState,
  reducers: {
    clearTrips: (state) => {
      state.trips = [];
    },

    assignDriverUI: (
      state,
      action: {
        payload: {
          trip_id: string;
          driver_id: string;
          driver_name: string;
          driver_phone: string;
        };
      },
    ) => {
      const trip = state.trips.find((t) => t.trip_id === action.payload.trip_id);
      if (trip) {
        trip.driver_id = action.payload.driver_id;
        trip.driver_name = action.payload.driver_name;
        trip.driver_phone = action.payload.driver_phone;
        trip.assigned_at = new Date().toISOString();

        // ── Also append a transaction log entry locally ───────────────────────
        trip.trip_transactions.push({
          id: `local_${Date.now()}`,
          trip_id: trip.trip_id,
          sequence_no: trip.trip_transactions.length + 1,
          event_type: "driver_assigned",
          status: "success",
          actor_type: "admin",
          actor_id: null,
          actor_name: "Admin",
          changed_fields: ["driver_id"],
          old_value: { driver_id: null },
          new_value: { driver_id: action.payload.driver_id },
          notes: "Driver assigned by admin",
          metadata: null,
          event_at: new Date().toISOString(),
        });
      }
    },

    adjustFareUI: (
      state,
      action: {
        payload: {
          trip_id: string;
          total_fare: number;
        };
      },
    ) => {
      const trip = state.trips.find((t) => t.trip_id === action.payload.trip_id);
      if (trip) {
        const oldFare = trip.total_fare;
        trip.total_fare = action.payload.total_fare;
        trip.updated_at = new Date().toISOString();

        // ── Also append a transaction log entry locally ───────────────────────
        trip.trip_transactions.push({
          id: `local_${Date.now()}`,
          trip_id: trip.trip_id,
          sequence_no: trip.trip_transactions.length + 1,
          event_type: "fare_updated",
          status: "success",
          actor_type: "admin",
          actor_id: null,
          actor_name: "Admin",
          changed_fields: ["total_fare"],
          old_value: { total_fare: oldFare },
          new_value: { total_fare: action.payload.total_fare },
          notes: "Fare adjusted by admin",
          metadata: null,
          event_at: new Date().toISOString(),
        });
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchTrips.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.loading = false;
        state.trips = action.payload;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTrips, assignDriverUI, adjustFareUI } = tripSlice.actions;
export default tripSlice.reducer;
