import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface TrustedContactInfo {
  id?: string;
  name: string;
  phone: string;
  relationship?: string;
}

export interface TripDetailsInfo {
  trip_id?: string;
  trip_code?: string;
  ride_type?: string;
  service_type?: string;
  pickup_address?: string;
  drop_address?: string;
  distance_km?: number;
  total_fare?: number;
  base_fare?: number;
  vehicle_type?: string;
  vehicle_model?: string;
  vehicle_id?: string;
  status?: string;
  scheduled_start_time?: string;
  actual_pickup_time?: string;
  user_details?: any;
  driver_details?: any;
}

export interface SosUserInfo {
  full_name?: string;
  phone_number?: string;
  alternate_contact?: string;
  email?: string;
  address?: any;
  profile_pic_url?: string;
  profile_url?: string;
  t2driver?: string;
  type?: string;
  created_at?: string;
  trusted_contact?: any;
  emergency_contacts?: any;
}

export interface SosAlert {
  sos_id: string;
  driver_id?: string;
  user_id?: string;
  user_type?: string;
  phone?: string;
  alt_phone?: string;
  email?: string;
  name?: string;
  driver_name?: string;
  profile_pic?: string;
  trip_id?: string;
  latitude?: number;
  longitude?: number;
  status: "ACTIVE" | "RESOLVED";
  created_at: string;
  pickup_address?: string;
  drop_address?: string;
  trip_status?: string;
  // Enriched nested objects
  trip_details?: TripDetailsInfo;
  user_info?: SosUserInfo;
  trusted_contacts?: TrustedContactInfo[];
}

interface SosState {
  activeAlerts: SosAlert[];
}

const initialState: SosState = {
  activeAlerts: [],
};

const sosSlice = createSlice({
  name: "sos",
  initialState,
  reducers: {
    addSosAlert: (state, action: PayloadAction<SosAlert>) => {
      const existing = state.activeAlerts.find((a) => a.sos_id === action.payload.sos_id);
      if (!existing) {
        state.activeAlerts.unshift(action.payload);
      }
    },
    updateSosLocation: (
      state,
      action: PayloadAction<{ sos_id: string; latitude: number; longitude: number }>,
    ) => {
      const alert = state.activeAlerts.find((a) => a.sos_id === action.payload.sos_id);
      if (alert) {
        alert.latitude = action.payload.latitude;
        alert.longitude = action.payload.longitude;
      }
    },
    resolveSosAlert: (state, action: PayloadAction<string>) => {
      state.activeAlerts = state.activeAlerts.filter((a) => a.sos_id !== action.payload);
    },
    setSosAlerts: (state, action: PayloadAction<SosAlert[]>) => {
      state.activeAlerts = action.payload;
    },
  },
});

export const { addSosAlert, updateSosLocation, resolveSosAlert, setSosAlerts } = sosSlice.actions;
export default sosSlice.reducer;
