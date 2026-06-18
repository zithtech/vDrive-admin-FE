import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface SosAlert {
  sos_id: string;
  driver_id?: string;
  user_id?: string;
  user_type?: string;
  name?: string;
  driver_name?: string;
  trip_id?: string;
  latitude?: number;
  longitude?: number;
  status: "ACTIVE" | "RESOLVED";
  created_at: string;
  pickup_address?: string;
  trip_status?: string;
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
