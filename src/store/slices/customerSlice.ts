import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosIns from "../../api/axios";
import { logger } from "../../utils/logger";

import type { Customer } from "../../pages/Customers";

// ─── State ────────────────────────────────────────────────────────────────────
interface CustomerState {
    customers: Customer[];
    selectedCustomer: Customer | null;
    loading: boolean;
    actionLoading: boolean;
    error: string | null;
}

const initialState: CustomerState = {
    customers: [],
    selectedCustomer: null,
    loading: false,
    actionLoading: false,
    error: null,
};

// ─── Helper: fetch a single customer by id after an action ───────────────────
// This ensures we always sync the latest data from the server.
// Fallback to null if 404 is encountered (backend might not have GET /:id)
const refetchCustomer = async (id: string): Promise<Customer | null> => {
    try {
        const response = await axiosIns.get(`/api/users/${id}`);
        return response.data?.data || response.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            logger.warn(`Customer info not found at /api/users/${id}. Backend might not support single fetch.`);
            return null;
        }
        throw error;
    }
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchCustomers = createAsyncThunk(
    "customers/fetchCustomers",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosIns.get("/api/users");
            const candidate = response.data?.data || response.data?.users || response.data;

            if (Array.isArray(candidate)) {
                return candidate;
            }

            // If data is nested one level deeper: response.data.data.users
            if (response.data?.data && Array.isArray(response.data.data.users)) {
                return response.data.data.users;
            }

            logger.error("fetchCustomers: expected array but got:", candidate);
            return []; // Fallback to empty array to avoid .map errors
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message || "Failed to fetch customers");
        }
    }
);

export const deleteCustomer = createAsyncThunk(
    "customers/delete",
    async (id: string, { rejectWithValue }) => {
        try {
            await axiosIns.delete(`/api/users/${id}`);
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message ?? "Failed to delete customer");
        }
    }
);

export const blockCustomer = createAsyncThunk(
    "customers/block",
    async ({ id, reason }: { id: string; reason: string }, { rejectWithValue }) => {
        try {
            const response = await axiosIns.patch(`/api/users/block/${id}`, { notes: reason });
            const updatedFromPatch = response.data?.data || response.data;

            // If patch returns the full object, use it. Otherwise try re-fetching.
            if (updatedFromPatch && updatedFromPatch.id) return updatedFromPatch;

            const refetched = await refetchCustomer(id);
            return refetched || { id, status: 'blocked' } as any;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message ?? "Failed to block customer");
        }
    }
);

export const unblockCustomer = createAsyncThunk(
    "customers/unblock",
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await axiosIns.patch(`/api/users/unblock/${id}`);
            const updatedFromPatch = response.data?.data || response.data;

            if (updatedFromPatch && updatedFromPatch.id) return updatedFromPatch;

            const refetched = await refetchCustomer(id);
            return refetched || { id, status: 'active' } as any;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message ?? "Failed to unblock customer");
        }
    }
);

export const disableCustomer = createAsyncThunk(
    "customers/disable",
    async ({ id, reason }: { id: string; reason: string }, { rejectWithValue }) => {
        try {
            const response = await axiosIns.patch(`/api/users/suspend/${id}`, { notes: reason });
            const updatedFromPatch = response.data?.data || response.data;

            if (updatedFromPatch && updatedFromPatch.id) return updatedFromPatch;

            const refetched = await refetchCustomer(id);
            return refetched || { id, status: 'suspended' } as any;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message ?? "Failed to disable customer");
        }
    }
);

export const enableCustomer = createAsyncThunk(
    "customers/enable",
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await axiosIns.patch(`/api/users/enable/${id}`);
            const updatedFromPatch = response.data?.data || response.data;

            if (updatedFromPatch && updatedFromPatch.id) return updatedFromPatch;

            const refetched = await refetchCustomer(id);
            return refetched || { id, status: 'active' } as any;

        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message ?? "Failed to enable customer");
        }
    }
);

// ─── Helper: sync updated customer into list + open drawer ────────────────────


// ─── Slice ────────────────────────────────────────────────────────────────────
const customerSlice = createSlice({
    name: "customers",
    initialState,
    reducers: {
        clearCustomers: (state) => {
            state.customers = [];
        },
        setSelectedCustomer: (state, action) => {
            state.selectedCustomer = action.payload;
        },
        clearSelectedCustomer: (state) => {
            state.selectedCustomer = null;
        },
    },
    extraReducers: (builder) => {

        // ── Fetch ───────────────────────────────────────────────────────────────
        builder
            .addCase(fetchCustomers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCustomers.fulfilled, (state, action) => {
                state.loading = false;
                state.customers = action.payload;
            })
            .addCase(fetchCustomers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

        // ── Delete ──────────────────────────────────────────────────────────────
        builder
            .addCase(deleteCustomer.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(deleteCustomer.fulfilled, (state, action) => {
                state.actionLoading = false;
                if (Array.isArray(state.customers)) {
                    state.customers = state.customers.filter((c) => c.id !== action.payload);
                }
                if (state.selectedCustomer?.id === action.payload) {
                    state.selectedCustomer = null;
                }
            })
            .addCase(deleteCustomer.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload as string;
            });

        // ── Block ───────────────────────────────────────────────────────────────
        builder
            .addCase(blockCustomer.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(blockCustomer.fulfilled, (state, action) => {
                state.actionLoading = false;
                if (Array.isArray(state.customers)) {
                    state.customers = state.customers.map((c) =>
                        c.id === action.payload.id ? action.payload : c
                    );
                }
                if (state.selectedCustomer?.id === action.payload.id) {
                    state.selectedCustomer = action.payload;
                }
            })
            .addCase(blockCustomer.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload as string;
            });

        // ── Unblock ─────────────────────────────────────────────────────────────
        builder
            .addCase(unblockCustomer.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(unblockCustomer.fulfilled, (state, action) => {
                state.actionLoading = false;
                if (Array.isArray(state.customers)) {
                    state.customers = state.customers.map((c) =>
                        c.id === action.payload.id ? action.payload : c
                    );
                }
                if (state.selectedCustomer?.id === action.payload.id) {
                    state.selectedCustomer = action.payload;
                }
            })
            .addCase(unblockCustomer.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload as string;
            });

        // ── Disable (Suspend) ───────────────────────────────────────────────────
        builder
            .addCase(disableCustomer.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(disableCustomer.fulfilled, (state, action) => {
                state.actionLoading = false;
                if (Array.isArray(state.customers)) {
                    state.customers = state.customers.map((c) =>
                        c.id === action.payload.id ? action.payload : c
                    );
                }
                if (state.selectedCustomer?.id === action.payload.id) {
                    state.selectedCustomer = action.payload;
                }
            })
            .addCase(disableCustomer.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload as string;
            });

        // ── Enable (Activate) ───────────────────────────────────────────────────
        builder
            .addCase(enableCustomer.pending, (state) => {
                state.actionLoading = true;
                state.error = null;
            })
            .addCase(enableCustomer.fulfilled, (state, action) => {
                state.actionLoading = false;
                if (Array.isArray(state.customers)) {
                    state.customers = state.customers.map((c) =>
                        c.id === action.payload.id ? action.payload : c
                    );
                }
                if (state.selectedCustomer?.id === action.payload.id) {
                    state.selectedCustomer = action.payload;
                }
            })
            .addCase(enableCustomer.rejected, (state, action) => {
                state.actionLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearCustomers, setSelectedCustomer, clearSelectedCustomer } = customerSlice.actions;
export default customerSlice.reducer;