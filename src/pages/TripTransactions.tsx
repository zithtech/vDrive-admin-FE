import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { store } from "../store";
import type { RootState, AppDispatch } from "../store";
import { fetchTripTransaction, clearTripTransaction } from "../store/slices/tripTransactionSlice";
import { fetchTrips, selectTripIdByCode } from "../store/slices/tripSlice";
import TitleBar from "../components/TitleBarCommon/TitleBar";
import { Input, Button, Typography, Empty, Spin, Avatar } from "antd";
import {
  SearchOutlined,
  EnvironmentOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  StopOutlined,
  HistoryOutlined,
  UserAddOutlined,
  PlayCircleOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

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
    <TitleBar
      title="Trip Transaction Activity"
      description="A chronological source of truth for every event, status change, and administrative action associated with this trip."
      className="w-full min-h-[calc(100vh-120px)] relative"
      icon={
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center">
          <HistoryOutlined className="text-white" />
        </div>
      }
      iconBgColor="bg-gradient-to-br from-indigo-600 to-violet-500"
    >
      <div className="p-8 pb-32 max-w-[1600px] mx-auto space-y-8">
        {/* ─── Premium Search Surface (Sticky) ────────────────────────── */}
        <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 pt-2 pb-6 -mt-2">
          <div className="relative max-w-2xl mx-auto">
            <div className="relative bg-white rounded-[2rem] border border-gray-100 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-grow w-full relative group">
                  <SearchOutlined className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-lg transition-transform group-focus-within:scale-110" />
                  <Input
                    size="large"
                    placeholder="Enter Trip ID (e.g. VDT-00343)"
                    className="!pl-12 !h-12 !rounded-xl !bg-gray-50 dark:!bg-slate-900 !border-none !text-gray-700 dark:text-slate-200 dark:!text-slate-100 !font-bold !text-base placeholder:text-gray-300 dark:text-slate-500 dark:text-slate-400 dark:placeholder:text-slate-500 dark:text-slate-400 focus:!bg-white dark:focus:!bg-slate-800 focus:!shadow-inner transition-all"
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
                  className="w-full sm:w-auto !h-12 !px-8 !rounded-xl !text-sm !font-black !uppercase !tracking-widest !bg-gradient-to-r !from-indigo-600 !to-blue-500 hover:!bg-black border-none transition-all active:scale-95"
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
          <div className="space-y-12">
            {/* ─── Immersive Summary Card ────────────────────────────── */}
            <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 dark:border-slate-700 bg-gray-50/30 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                    <HistoryOutlined className="text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-800 dark:text-slate-200 tracking-tight leading-none mb-1">
                      Trip Lifecycle
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-100 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded font-mono font-bold tracking-tighter border border-slate-200">
                        ID: {searchId}
                      </span>
                      <span className="text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded font-bold uppercase tracking-widest border border-indigo-100 dark:border-indigo-500/30">
                        {tripData.total} Events Recorded
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-[1.5rem] p-4">
                  <div className="flex items-center gap-3 pr-6 border-r border-gray-100 dark:border-slate-700">
                    <Avatar
                      className="bg-gradient-to-tr from-amber-400 to-orange-300 border-2 border-white dark:border-slate-800 w-10 h-10"
                      icon={<UserOutlined />}
                    />
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-400 dark:text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">
                        Rider
                      </span>
                      <span className="text-xs font-extrabold text-gray-700 dark:text-slate-200 leading-none">
                        {tripData.user?.name || "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar
                      className={`w-10 h-10 border-2 border-white dark:border-slate-800 ${tripData.driver ? "bg-gradient-to-tr from-emerald-400 to-teal-300" : "bg-gray-100 dark:bg-slate-700"}`}
                      icon={<CarOutlined />}
                    />
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-400 dark:text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider">
                        Driver Partner
                      </span>
                      <span className="text-xs font-extrabold text-gray-700 dark:text-slate-200 leading-none">
                        {tripData.driver?.name || "Assign Pending..."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Activity Timeline Activity ──────────── */}
              <div className="p-8 pt-10 space-y-12 relative bg-gray-50/20 dark:bg-slate-900/20">
                {/* Vertical Stem */}
                <div className="absolute left-[3.25rem] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                {[...(tripData.transactions ?? [])]
                  .sort((a, b) => dayjs(a.event_at).valueOf() - dayjs(b.event_at).valueOf())
                  .map((txn, idx) => {
                    const config = getEventConfig(txn.event_type);
                    return (
                      <div
                        key={txn.id ?? idx}
                        className="relative flex flex-col sm:flex-row gap-8 sm:items-start group"
                      >
                        {/* Left: Time Meta */}
                        <div className="sm:w-32 pt-2 text-right hidden sm:block">
                          <span className="text-[10px] font-black text-gray-300 dark:text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] block leading-none mb-1">
                            Recorded At
                          </span>
                          <span className="text-xs font-bold text-gray-500 dark:text-slate-400 dark:text-slate-500 dark:text-slate-400 tracking-tight">
                            {dayjs(txn.event_at).format("hh:mm A")}
                          </span>
                          <span className="text-[9px] font-medium text-gray-400 dark:text-slate-500 dark:text-slate-400 block mt-1">
                            {dayjs(txn.event_at).format("DD MMM · YYYY")}
                          </span>
                        </div>

                        {/* Center: Bubble */}
                        <div className="relative z-10 hidden sm:block">
                          <div
                            className={`w-14 h-14 rounded-[1.25rem] border-4 border-white dark:border-slate-800 flex items-center justify-center ${config.bg} transition-transform group-hover:scale-110`}
                          >
                            {config.icon}
                          </div>
                        </div>

                        {/* Right: Card */}
                        <div className="flex-1 bg-gray-50/50 rounded-[2rem] border border-gray-200 p-6 sm:p-8 hover:bg-white hover:shadow-xl transition-all duration-300">
                          <div className="flex flex-col lg:flex-row gap-6">
                            {/* Left: Event Meta */}
                            <div className="shrink-0 min-w-[200px]">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-base font-black text-gray-800 dark:text-slate-200 tracking-tight">
                                  {config.title}
                                </h4>
                                <span
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold tracking-widest uppercase border ${txn.status === "success" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/30" : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/30"}`}
                                >
                                  {txn.status}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-slate-500 dark:text-slate-400">
                                <UserOutlined className="text-[10px]" />
                                <span className="uppercase tracking-widest">
                                  {txn.actor_name ?? txn.actor_type}
                                </span>
                                <span className="opacity-30">•</span>
                                <span className="opacity-70">{txn.actor_type}</span>
                              </div>
                              <span className="lg:hidden block mt-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                {dayjs(txn.event_at).format("DD MMM, hh:mm A")}
                              </span>
                            </div>

                            {/* Right: Notes & Snapshot */}
                            <div className="flex-1 flex flex-col xl:flex-row items-stretch gap-4">
                              {txn.notes && (
                                <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm flex items-center min-w-[240px]">
                                  <div className="flex flex-col gap-1 w-full">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none">
                                      Activity Note
                                    </span>
                                    <Text className="text-xs font-bold text-gray-700 dark:text-slate-200 leading-tight italic">
                                      “{txn.notes}”
                                    </Text>
                                  </div>
                                </div>
                              )}

                              {/* Entity Snapshot (for requested trips) */}
                              {txn.event_type === "trip_requested" && txn.entity_snapshot && (
                                <div className="flex-[2] grid grid-cols-2 gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                                  <div className="flex items-center gap-3 pr-4 border-r border-gray-50 dark:border-slate-700">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
                                      <EnvironmentOutlined />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[9px] font-black text-gray-300 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none mb-1">
                                        Pickup
                                      </span>
                                      <span className="text-xs font-bold text-gray-700 dark:text-slate-200 leading-none truncate max-w-[150px]">
                                        {txn.entity_snapshot.pickup_address || "Specified Location"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 pl-2">
                                    <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm shrink-0">
                                      <EnvironmentOutlined />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[9px] font-black text-gray-300 dark:text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none mb-1">
                                        Endpoint
                                      </span>
                                      <span className="text-xs font-bold text-gray-700 dark:text-slate-200 leading-none truncate max-w-[150px]">
                                        {txn.entity_snapshot.drop_address || "Specified Location"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Change Auditing */}
                          {txn.changed_fields &&
                            txn.changed_fields.length > 0 &&
                            txn.event_type !== "trip_requested" && (
                              <div className="pt-4 border-t border-gray-100 dark:border-slate-700 mt-2">
                                <div className="flex items-center gap-3 mb-4">
                                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] leading-none">
                                    Field Mutation Audit
                                  </span>
                                  <div className="h-px flex-1 bg-gradient-to-r from-indigo-50 to-transparent" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {Object.entries(txn.new_value ?? {}).map(([key, val]) => (
                                    <div
                                      key={key}
                                      className="flex flex-col bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-gray-100/50 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors group/audit"
                                    >
                                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 group-hover/audit:text-indigo-400 transition-colors uppercase-font tracking-wide-font">
                                        {FIELD_LABELS[key] || key.replace(/_/g, " ")}
                                      </span>
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="bg-slate-50 text-slate-400 dark:text-slate-500 dark:text-slate-400 px-2 py-1 rounded text-[9px] font-mono line-through opacity-70 truncate max-w-[100px] shrink-0">
                                          {formatValue(key, (txn.old_value as any)?.[key])}
                                        </div>
                                        <ArrowRightOutlined className="text-indigo-200 text-[10px] shrink-0" />
                                        <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded text-[10px] font-black font-mono shadow-sm truncate">
                                          {formatValue(key, val)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
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
    </TitleBar>
  );
};

export default TripTransactions;
