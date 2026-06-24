import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { store } from "../store";
import type { RootState, AppDispatch } from "../store";
import { fetchTripTransaction, clearTripTransaction } from "../store/slices/tripTransactionSlice";
import { fetchTrips, selectTripIdByCode } from "../store/slices/tripSlice";
import { Input, Button, Empty, Spin } from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  HistoryOutlined,
  UserAddOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";



// interface TimelineEvent {
//     title: string;
//     time: string;
//     type: string;
//     icon: React.ReactNode;
//     color: string;
//     details?: React.ReactNode;
// }

const FIELD_LABELS: Record<string, string> = {
  driver_id: "Driver",
  vehicle_id: "Vehicle",
  status: "Status",
  pickup_location: "Pickup",
  dropoff_location: "Drop-off",
  fare: "Fare",
  distance: "Distance",
  duration: "Duration",
  payment_method: "Payment",
  cancellation_reason: "Cancel Reason",
  rating: "Rating",
  notes: "Notes",
  trip_id: "Trip ID",
  user_id: "User",
  service_type: "Service Type",
  ride_type: "Ride Type",
  total_fare: "Total Fare",
  trip_status: "Trip Status",
  payment_status: "Payment Status",
};

const formatValue = (key: string, value: unknown) => {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (
    (key.includes("at") || key.includes("time")) &&
    typeof value === "string" &&
    dayjs(value).isValid()
  ) {
    return dayjs(value).format("DD MMM YYYY, hh:mm A");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

const TripTransactions: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchId, setSearchId] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const { tripData, loading, error } = useSelector((state: RootState) => state.tripTransaction);

  React.useEffect(() => {
    dispatch(fetchTrips());
  }, [dispatch]);

  const handleSearch = async () => {
    if (!searchId.trim()) return;

    const q = searchId.trim();
    const state = store.getState() as RootState;
    let resolvedTripId = selectTripIdByCode(state, q);

    // If not found locally (could happen on reload), it might be a UUID directly
    // or we might need to wait for trips to load.
    // For simplicity, if it's not a UUID format, we assume it's a code.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);

    if (!resolvedTripId && !isUuid) {
      // If it's a code but not found, try one more time by ensuring trips are fetched
      // (The useEffect already starts this, but we can wait here if needed)
      await dispatch(fetchTrips()).unwrap();
      const newState = store.getState() as RootState;
      resolvedTripId = selectTripIdByCode(newState, q);
    }

    const idToFetch = resolvedTripId || q;
    dispatch(fetchTripTransaction(idToFetch));
    setHasSearched(true);
  };

  const handleClear = () => {
    setSearchId("");
    setHasSearched(false);
    dispatch(clearTripTransaction());
  };

  const getEventConfig = (eventType: string) => {
    // const base = "w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm border-2 border-white dark:border-slate-800 ring-8";
    switch (eventType) {
      case "trip_requested":
        return {
          title: "Ride Requested",
          color: "indigo",
          bg: "bg-indigo-50 dark:bg-indigo-500/10",
          ring: "ring-indigo-50/50",
          icon: <ClockCircleOutlined className="text-indigo-600" />,
        };
      case "trip_assigned":
        return {
          title: "Driver Assigned",
          color: "blue",
          bg: "bg-blue-50 dark:bg-blue-500/10",
          ring: "ring-blue-50/50",
          icon: <UserAddOutlined className="text-blue-600" />,
        };
      case "trip_started":
        return {
          title: "Journey Started",
          color: "emerald",
          bg: "bg-emerald-50 dark:bg-emerald-500/10",
          ring: "ring-emerald-50/50",
          icon: <PlayCircleOutlined className="text-emerald-600" />,
        };
      case "trip_completed":
        return {
          title: "Journey Completed",
          color: "emerald",
          bg: "bg-emerald-500",
          ring: "ring-emerald-50/50",
          icon: <CheckCircleOutlined className="text-white" />,
        };
      case "trip_cancelled":
        return {
          title: "Trip Cancelled",
          color: "rose",
          bg: "bg-rose-50 dark:bg-rose-500/10",
          ring: "ring-rose-50/50",
          icon: <StopOutlined className="text-rose-600" />,
        };
      default:
        return {
          title: eventType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          color: "slate",
          bg: "bg-slate-50 dark:bg-slate-800",
          ring: "ring-slate-50/50",
          icon: <EnvironmentOutlined className="text-slate-600" />,
        };
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-slate-900">
      {/* Top Navbar */}
      <div className="bg-white dark:bg-slate-800 h-12 px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 z-10 flex-shrink-0">
        <div className="flex items-center gap-4 flex-shrink-0">
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 m-0 leading-none">Trip Transaction Activity</h1>
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0">A chronological source of truth for every event, status change, and administrative action associated with this trip.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 pb-32 max-w-[1600px] mx-auto space-y-4">
          {/* ─── Premium Search Surface (Sticky) ────────────────────────── */}
          <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 pt-2 pb-2 -mt-2">
            <div className="relative max-w-2xl mx-auto">
              <div className="relative bg-white border border-gray-200 dark:border-slate-700 shadow-sm p-3 sm:p-2 rounded-lg">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex-grow w-full relative group">
                    <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-lg transition-transform group-focus-within:scale-110" />
                    <Input
                      size="large"
                      placeholder="Enter Trip ID (e.g. VDT-00343)"
                      className="!pl-12 !h-10 !rounded-none !bg-gray-50 dark:!bg-slate-900 !border-none !text-gray-700 dark:text-slate-200 dark:!text-slate-100 !font-bold !text-base placeholder:text-gray-300 dark:text-slate-500 dark:text-slate-400 dark:placeholder:text-slate-500 dark:text-slate-400 focus:!bg-white dark:focus:!bg-slate-800 focus:!shadow-inner transition-all"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      onPressEnter={handleSearch}
                      onClear={handleClear}
                      allowClear
                    />
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    loading={loading}
                    onClick={handleSearch}
                    className="w-full sm:w-auto !h-10 !px-8 !rounded-lg !text-base !font-bold !bg-[#3b82f6] hover:!bg-[#2563eb] border-none shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                  >
                    Track Trip
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Spin size="large" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 dark:text-slate-500 dark:text-slate-400">
                Synchronizing Ledger...
              </span>
            </div>
          )}

          {hasSearched && !loading && error && (
            <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 p-6 rounded-[2rem] text-center max-w-lg mx-auto shadow-sm">
              <StopOutlined className="text-4xl text-rose-400 mb-3" />
              <p className="text-sm font-bold text-rose-600 mb-1">Retrieval Failed</p>
              <p className="text-xs text-rose-400 font-medium">{error}</p>
            </div>
          )}

          {hasSearched && !loading && !tripData?.transactions?.length && !error && (
            <div className="text-center py-24 opacity-40 grayscale">
              <Empty description={false} />
              <p className="mt-4 text-xs font-black uppercase tracking-widest text-gray-400 dark:text-slate-500 dark:text-slate-400">
                Empty Record Set
              </p>
            </div>
          )}

          {hasSearched && !loading && tripData?.transactions?.length && (
            <div className="space-y-6">
              {/* ─── Minimal Summary Header ────────────────────────────── */}
              <div className="border-b border-gray-200 dark:border-slate-700 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-gray-800 dark:text-slate-200 tracking-tight leading-none mb-2">
                    Trip Lifecycle
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-sm font-mono font-bold tracking-tighter border border-slate-200 dark:border-slate-700">
                      ID: {searchId}
                    </span>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-sm font-bold uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/30">
                      {tripData.total} Events
                    </span>
                    <span className="text-[10px] bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-sm font-bold uppercase tracking-widest border border-gray-200 dark:border-slate-700">
                      RIDER: {tripData.user?.name || "N/A"}
                    </span>
                    <span className="text-[10px] bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-sm font-bold uppercase tracking-widest border border-gray-200 dark:border-slate-700">
                      DRIVER: {tripData.driver?.name || "Assign Pending..."}
                    </span>
                  </div>
                </div>
              </div>

              {/* ─── Card-Based Activity Timeline ──────────── */}
              <div className="relative pt-4 pb-12 ml-2 sm:ml-6">
                {/* Vertical Stem */}
                <div className="absolute left-[5px] top-8 bottom-0 w-px bg-gray-200 dark:bg-slate-700 hidden sm:block" />

                <div className="space-y-3 sm:pl-8">
                  {[...(tripData.transactions ?? [])]
                    .sort((a, b) => dayjs(a.event_at).valueOf() - dayjs(b.event_at).valueOf())
                    .map((txn, idx) => {
                      const config = getEventConfig(txn.event_type);

                      // Simple dot colors
                      let dotColor = "bg-slate-400";
                      if (config.color === "indigo") dotColor = "bg-indigo-500";
                      if (config.color === "blue") dotColor = "bg-blue-500";
                      if (config.color === "emerald") dotColor = "bg-emerald-500";
                      if (config.color === "rose") dotColor = "bg-rose-500";

                      return (
                        <div
                          key={txn.id ?? idx}
                          className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-4 flex flex-col gap-2 rounded-sm shadow-sm"
                        >
                          {/* Timeline Dot (Outside Card) */}
                          <div className={`absolute -left-[1.85rem] top-6 w-2.5 h-2.5 rounded-full ring-4 ring-gray-50 dark:ring-slate-900 z-10 hidden sm:block ${dotColor}`} />

                          {/* Top Row: Actor Tag & Timestamp */}
                          <div className="flex items-center gap-3">
                            <span className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-blue-100 dark:border-blue-500/30">
                              {txn.actor_name ?? txn.actor_type}
                            </span>
                            <span className="text-gray-500 dark:text-slate-400 text-xs">
                              {dayjs(txn.event_at).format("h:mm:ss A")} - {txn.status === "success" ? "Completed" : "Failed"}
                            </span>
                          </div>

                          {/* Main Title Row */}
                          <div className="flex flex-wrap items-center gap-2 pr-24">
                            <span className="text-blue-500 dark:text-blue-400 font-mono text-sm font-bold">
                              [{txn.event_type}]
                            </span>
                            <span className="text-gray-800 dark:text-slate-200 text-sm font-bold ml-1">
                              {config.title}
                            </span>

                            {/* Data/Audit Tags Next to Title */}
                            {txn.notes && (
                              <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest border border-emerald-100 dark:border-emerald-500/30 ml-2">
                                {txn.notes}
                              </span>
                            )}

                            {txn.event_type === "trip_requested" && txn.entity_snapshot && (
                              <span className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100 dark:border-emerald-500/30 ml-2">
                                Pickup → Dropoff Logged
                              </span>
                            )}

                            {txn.changed_fields && txn.changed_fields.length > 0 && txn.event_type !== "trip_requested" && (
                              <div className="flex flex-wrap gap-1 ml-2">
                                {Object.entries(txn.new_value ?? {}).map(([key, val]) => (
                                  <span key={key} className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-200 dark:border-slate-600">
                                    {FIELD_LABELS[key] || key}: {formatValue(key, val)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Absolute Right Badge */}
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                            {txn.status === "success" ? (
                              <span className="border border-blue-200 dark:border-blue-500/50 text-blue-500 dark:text-blue-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
                                Success
                              </span>
                            ) : (
                              <span className="border border-rose-200 dark:border-rose-500/50 text-rose-500 dark:text-rose-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
                                {txn.status}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripTransactions;
