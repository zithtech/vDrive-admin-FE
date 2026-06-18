import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import axiosIns from "../../api/axios";
import axios from "axios";

export interface Country {
  id: string;
  code: string;
  name: string;
  flag: string;
}
export interface State {
  id: string;
  code: string;
  name: string;
  country_id: string;
}
export interface District {
  id: string;
  name: string;
  state_id: string;
  country_id: string;
}

export interface Area {
  id: string;
  name: string;
  district_id: string;
  state_id: string;
  country_id: string;
  pincode: string;
}

interface LocationState {
  countries: Country[];
  isLoadingCountries: boolean;
  countryError: string | null;
  totalCountries: number;
  states: State[];
  isLoadingStates: boolean;
  stateError: string | null;
  totalStates: number;
  districts: District[];
  isLoadingCities: boolean;
  cityError: string | null;
  totalCities: number;
  areas: Area[];
  isLoadingAreas: boolean;
  areaError: string | null;
  totalAreas: number;
}

const initialState: LocationState = {
  countries: [],
  isLoadingCountries: false,
  countryError: null,
  totalCountries: 0,
  states: [],
  isLoadingStates: false,
  stateError: null,
  totalStates: 0,
  districts: [],
  isLoadingCities: false,
  cityError: null,
  totalCities: 0,
  areas: [],
  isLoadingAreas: false,
  areaError: null,
  totalAreas: 0,
};

// Cancel token for managing concurrent requests
let cancelTokenSource: ReturnType<typeof axios.CancelToken.source> | null = null;
let stateCancelTokenSource: ReturnType<typeof axios.CancelToken.source> | null = null;
let cityCancelTokenSource: ReturnType<typeof axios.CancelToken.source> | null = null;
let areaCancelTokenSource: ReturnType<typeof axios.CancelToken.source> | null = null;

// Async thunk to fetch countries with cancel token support
export const fetchCountries = createAsyncThunk(
  "location/fetchCountries",
  async ({ limit = 20, search = "" }: { limit?: number; search?: string }, { rejectWithValue }) => {
    try {
      // Cancel previous request if it exists
      if (cancelTokenSource) {
        cancelTokenSource.cancel("Operation canceled due to new request.");
      }

      // Create new cancel token
      cancelTokenSource = axios.CancelToken.source();

      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      if (search) {
        params.append("search", search);
      }

      const response = await axiosIns.get(`/api/locations/countries?${params.toString()}`, {
        cancelToken: cancelTokenSource.token,
      });

      return response.data.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        // Request was cancelled, don't treat as error
        return rejectWithValue("cancelled");
      }
      throw error;
    }
  },
);
export const fetchState = createAsyncThunk(
  "location/fetchState",
  async (
    {
      countryId = "",
      search = "",
      limit = 20,
    }: { search?: string; countryId?: string; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      if (stateCancelTokenSource) {
        stateCancelTokenSource.cancel("Operation canceled due to new request.");
      }

      stateCancelTokenSource = axios.CancelToken.source();
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      if (search) {
        params.append("search", search);
      }
      const response = await axiosIns.get(
        `/api/locations/states/${countryId}?${params.toString()}`,
        {
          cancelToken: stateCancelTokenSource.token,
        },
      );

      return response.data.data;
    } catch (error) {
      if (axios.isCancel(error)) {
        // Request was cancelled, don't treat as error
        return rejectWithValue("cancelled");
      }
      throw error;
    }
  },
);

export const fetchCities = createAsyncThunk(
  "location/fetchCities",
  async (
    {
      stateId = null,
      search = "",
      limit = 20,
    }: {
      stateId?: string | null;
      search?: string;
      limit?: number;
    },
    { rejectWithValue },
  ) => {
    try {
      if (cityCancelTokenSource) {
        cityCancelTokenSource.cancel("Operation canceled due to new request.");
      }
      cityCancelTokenSource = axios.CancelToken.source();

      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      if (search) params.append("search", search);

      const response = await axiosIns.get(
        `/api/locations/districts/${stateId}?${params.toString()}`,
        { cancelToken: cityCancelTokenSource.token },
      );
      return response.data.data;
    } catch (error) {
      if (axios.isCancel(error)) return rejectWithValue("cancelled");
      throw error;
    }
  },
);

export const fetchAreas = createAsyncThunk(
  "location/fetchAreas",
  async (
    {
      countryId: _countryId,
      stateId: _stateId = null,
      districtId = null,
      search = "",
      limit = 20,
    }: {
      countryId: string;
      stateId?: string | null;
      districtId?: string | null;
      search?: string;
      limit?: number;
    },
    { rejectWithValue },
  ) => {
    try {
      if (areaCancelTokenSource) {
        areaCancelTokenSource.cancel("Operation canceled due to new request.");
      }
      areaCancelTokenSource = axios.CancelToken.source();

      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      if (search) params.append("search", search);

      const response = await axiosIns.get(
        `/api/locations/areas/${districtId}?${params.toString()}`,
        { cancelToken: areaCancelTokenSource.token },
      );
      return response.data.data;
    } catch (error) {
      if (axios.isCancel(error)) return rejectWithValue("cancelled");
      throw error;
    }
  },
);

export const createArea = createAsyncThunk(
  "location/createArea",
  async (
    data: {
      place: string;
      country_id: string;
      state_id?: string | null;
      district_id?: string | null;
      zipcode?: string | null;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await axiosIns.post("/api/locations/areas", data);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to create area");
    }
  },
);

export const fetchLocationByZipcode = createAsyncThunk(
  "location/fetchLocationByZipcode",
  async (zipcode: string, { rejectWithValue }) => {
    try {
      const response = await axiosIns.get(`/api/locations/zipcode/${zipcode}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return rejectWithValue("not_found");
      }
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch location by zipcode",
      );
    }
  },
);

export const fetchCountryById = createAsyncThunk(
  "location/fetchCountryById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosIns.get(`/api/locations/country/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch country");
    }
  },
);

export const fetchStateById = createAsyncThunk(
  "location/fetchStateById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosIns.get(`/api/locations/state/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch state");
    }
  },
);

export const fetchDistrictById = createAsyncThunk(
  "location/fetchDistrictById",
  async (districtId: string, { rejectWithValue }) => {
    try {
      const response = await axiosIns.get(`/api/locations/district/${districtId}`);
      return response.data.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(error.response?.data?.message || "Failed to fetch district");
      }
      return rejectWithValue("Failed to fetch district");
    }
  },
);

export const fetchAreaById = createAsyncThunk(
  "location/fetchAreaById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosIns.get(`/api/locations/area/${id}`);
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch area");
    }
  },
);

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    clearCountries: (state) => {
      state.countries = [];
      state.totalCountries = 0;
    },
    clearCountryError: (state) => {
      state.countryError = null;
    },
    clearStates: (state) => {
      state.countries = [];
      state.totalCountries = 0;
    },
    clearStateError: (state) => {
      state.stateError = null;
    },
    clearCities: (state) => {
      state.districts = [];
      state.totalCities = 0;
    },
    clearCityError: (state) => {
      state.cityError = null;
    },
    clearAreas: (state) => {
      state.areas = [];
      state.totalAreas = 0;
    },
    clearAreaError: (state) => {
      state.areaError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCountries.pending, (state) => {
        state.isLoadingCountries = true;
        state.countryError = null;
      })
      .addCase(
        fetchCountries.fulfilled,
        (state, action: PayloadAction<{ data: Country[]; total: number }>) => {
          state.isLoadingCountries = false;
          state.countries = action.payload.data;
          state.totalCountries = action.payload.total;
        },
      )
      .addCase(fetchCountries.rejected, (state, action) => {
        // Don't set error state for cancelled requests
        if (action.payload !== "cancelled") {
          state.isLoadingCountries = false;
          state.countryError = action.error.message || "Failed to fetch countries";
        } else {
          state.isLoadingCountries = false;
        }
      })
      .addCase(fetchState.pending, (state) => {
        state.isLoadingStates = true;
        state.stateError = null;
      })
      .addCase(
        fetchState.fulfilled,
        (state, action: PayloadAction<{ data: State[]; total: number }>) => {
          state.isLoadingStates = false;
          state.states = action.payload.data;
          state.totalStates = action.payload.total;
        },
      )
      .addCase(fetchState.rejected, (state, action) => {
        // Don't set error state for cancelled requests
        if (action.payload !== "cancelled") {
          state.isLoadingStates = false;
          state.stateError = action.error.message || "Failed to fetch states";
        } else {
          state.isLoadingStates = false;
        }
      })
      .addCase(fetchCities.pending, (state) => {
        state.isLoadingCities = true;
        state.cityError = null;
      })
      .addCase(
        fetchCities.fulfilled,
        (state, action: PayloadAction<{ data: District[]; total: number }>) => {
          state.isLoadingCities = false;
          state.districts = action.payload.data;
          state.totalCities = action.payload.total;
        },
      )
      .addCase(fetchCities.rejected, (state, action) => {
        if (action.payload !== "cancelled") {
          state.isLoadingCities = false;
          state.cityError = action.error.message || "Failed to fetch districts";
        }
      })
      .addCase(fetchAreas.pending, (state) => {
        state.isLoadingAreas = true;
        state.areaError = null;
      })
      .addCase(
        fetchAreas.fulfilled,
        (state, action: PayloadAction<{ data: Area[]; total: number }>) => {
          state.isLoadingAreas = false;
          state.areas = action.payload.data;
          state.totalAreas = action.payload.total;
        },
      )
      .addCase(fetchAreas.rejected, (state, action) => {
        if (action.payload !== "cancelled") {
          state.isLoadingAreas = false;
          state.areaError = action.error.message || "Failed to fetch areas";
        }
      })
      .addCase(createArea.fulfilled, (state, action: PayloadAction<Area>) => {
        // We could either append it or just let the search find it.
        // Appending it might be better for UX so it appears immediately if we want to select it.
        // However, LocationConfiguration will likely use the returned payload to set the value.
        state.areas.push(action.payload);
      })
      .addCase(fetchLocationByZipcode.pending, () => {
        // You might want to track loading state for autofill specifically if needed
      })
      .addCase(fetchLocationByZipcode.fulfilled, () => {
        // Data handling happens in the component usually for autofill, but we could update state here if needed
        // For now, the component unwraps the result and uses it directly.
      })
      .addCase(fetchLocationByZipcode.rejected, () => {
        // Error handling
      })
      .addCase(fetchDistrictById.fulfilled, (state, action: PayloadAction<District>) => {
        // Add the district to the districts array if not already present
        const exists = state.districts.find((d) => d.id === action.payload.id);
        if (!exists) {
          state.districts.push(action.payload);
        }
      });
  },
});

export const {
  clearCountries,
  clearCountryError,
  clearStates,
  clearStateError,
  clearCities,
  clearCityError,
  clearAreas,
  clearAreaError,
} = locationSlice.actions;
export default locationSlice.reducer;
