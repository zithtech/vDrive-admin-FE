import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axiosIns from "../../api/axios";
import axios from "axios";

export interface Hotspot {
  id: string;
  hotspot_name: string;
  fare: number;
  multiplier: number;
}

interface HotspotState {
  hotspots: Hotspot[];
  isLoading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  pageSize: number;
}

const initialState: HotspotState = {
  hotspots: [],
  isLoading: false,
  error: null,
  total: 0,
  currentPage: 1,
  pageSize: 20,
};

// Cancel token for managing concurrent requests
let cancelTokenSource: ReturnType<typeof axios.CancelToken.source> | null = null;

// Async thunk to fetch hotspots
export const fetchHotspots = createAsyncThunk(
  "hotspot/fetchHotspots",
  async (
    {
      page = 1,
      limit = 20,
      search = "",
    }: {
      page?: number;
      limit?: number;
      search?: string;
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

      const response = await axiosIns.get(`/api/hotspots?${params.toString()}`, {
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

// Async thunk to fetch single hotspot
export const fetchHotspotById = createAsyncThunk(
  "hotspot/fetchHotspotById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosIns.get(`/api/hotspots/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch hotspot");
    }
  },
);

// Async thunk to create hotspot
export const createHotspot = createAsyncThunk(
  "hotspot/createHotspot",
  async (
    data: {
      hotspot_name: string;
      fare: number;
      multiplier: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosIns.post("/api/hotspots", data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to create hotspot");
    }
  },
);

// Async thunk to update hotspot
export const updateHotspot = createAsyncThunk(
  "hotspot/updateHotspot",
  async (
    {
      id,
      data,
    }: {
      id: string;
      data: {
        hotspot_name?: string;
        fare?: number;
        multiplier?: number;
      };
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosIns.put(`/api/hotspots/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update hotspot");
    }
  },
);

// Async thunk to delete hotspot
export const deleteHotspot = createAsyncThunk(
  "hotspot/deleteHotspot",
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosIns.delete(`/api/hotspots/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete hotspot");
    }
  },
);

const hotspotSlice = createSlice({
  name: "hotspot",
  initialState,
  reducers: {
    clearHotspots: (state) => {
      state.hotspots = [];
      state.total = 0;
    },
    clearError: (state) => {
      state.error = null;
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
      // Fetch hotspots
      .addCase(fetchHotspots.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchHotspots.fulfilled,
        (
          state,
          action: PayloadAction<{
            data: Hotspot[];
            total: number;
            page: number;
            limit: number;
          }>,
        ) => {
          state.isLoading = false;
          state.hotspots = action.payload.data;
          state.total = action.payload.total;
          state.currentPage = action.payload.page;
          state.pageSize = action.payload.limit;
        },
      )
      .addCase(fetchHotspots.rejected, (state, action) => {
        if (action.payload !== "cancelled") {
          state.isLoading = false;
          state.error = action.error.message || "Failed to fetch hotspots";
        } else {
          state.isLoading = false;
        }
      })
      // Fetch single hotspot
      .addCase(fetchHotspotById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHotspotById.fulfilled, (state, _action: PayloadAction<Hotspot>) => {
        state.isLoading = false;
      })
      .addCase(fetchHotspotById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch hotspot";
      })
      // Create hotspot
      .addCase(createHotspot.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createHotspot.fulfilled, (state, action: PayloadAction<Hotspot>) => {
        state.isLoading = false;
        // Add new hotspot to the list
        state.hotspots.unshift(action.payload);
        state.total += 1;
      })
      .addCase(createHotspot.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Failed to create hotspot";
      })
      // Update hotspot
      .addCase(updateHotspot.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateHotspot.fulfilled, (state, action: PayloadAction<Hotspot>) => {
        state.isLoading = false;
        // Update hotspot in the list
        const index = state.hotspots.findIndex((h) => h.id === action.payload.id);
        if (index !== -1) {
          state.hotspots[index] = action.payload;
        }
      })
      .addCase(updateHotspot.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Failed to update hotspot";
      })
      // Delete hotspot
      .addCase(deleteHotspot.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteHotspot.fulfilled, (state, action: PayloadAction<string>) => {
        state.isLoading = false;
        // Remove hotspot from the list
        state.hotspots = state.hotspots.filter((h) => h.id !== action.payload);
        state.total -= 1;
      })
      .addCase(deleteHotspot.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Failed to delete hotspot";
      });
  },
});

export const { clearHotspots, clearError, setPage, setPageSize } = hotspotSlice.actions;
export default hotspotSlice.reducer;
