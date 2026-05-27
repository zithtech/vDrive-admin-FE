import React, { useState, useEffect } from "react";
import { logger } from "../../utils/logger";

import {
  Table,
  Tag,
  Dropdown,
  Select,
  Spin,
  Input,
  Tooltip,
  notification,
  Modal,
  Avatar,
  Button,
} from "antd";

import type { TableColumnsType } from "antd";

import { GrPhone } from "react-icons/gr";
import { IoCarOutline } from "react-icons/io5";

import {
  UserOutlined,
  CarOutlined,
  UserAddOutlined,
  DollarOutlined,
  BellOutlined,
  MoreOutlined,
  StopOutlined,
  EyeOutlined,
  RadarChartOutlined,
  CheckOutlined,
  EnvironmentOutlined,
  UserDeleteOutlined,
  VerticalAlignTopOutlined,
  CloudSyncOutlined,
} from "@ant-design/icons";

import {
  adjustFareUI,
  assignDriverUI,
  type TripDetailsType,
} from "../../store/slices/tripSlice";

import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store";
import TripDetailsDrawer from "./TripDetailsDrawer";
import axiosIns from "../../api/axios";

interface Props {
  data: TripDetailsType[];
  isSuperAdmin?: boolean;
}

type Driver = {
  id: string;
  name: string;
  status: "ACTIVE" | "INACTIVE";
  location: string;
  distanceKm: number;
  etaMinutes: number;
  phonenumber: string;
};

export type ActionType =
  | "ASSIGN_DRIVER"
  | "CANCEL_TRIP"
  | "ADJUST_FARE"
  | "TRIGGER_DRIVER"
  | null;

const ADMIN_CANCEL_REASONS = [
  { label: "Technical Issue", value: "TECHNICAL_ISSUE" },
  { label: "Passenger No-Show", value: "NO_SHOW" },
  { label: "Payment Issue", value: "PAYMENT_ISSUE" },
  { label: "Accident / Emergency", value: "ACCIDENT" },
  { label: "Admin Cancelled", value: "ADMIN_CANCELLED" },
  { label: "Other", value: "OTHER" },
];

const okTextMap = {
  ASSIGN_DRIVER: "Assign",
  CANCEL_TRIP: "Cancel Trip",
  ADJUST_FARE: "Update Fare",
  TRIGGER_DRIVER: "Broadcast Alert",
};

const titleMap = {
  ASSIGN_DRIVER: "Assign Driver Partner",
  CANCEL_TRIP: "Terminate Trip",
  ADJUST_FARE: "Adjust Trip Pricing",
  TRIGGER_DRIVER: "Trigger Broadcast Alert",
};



const TripDetailsTable: React.FC<Props> = ({ data, isSuperAdmin = false }) => {
  const dispatch = useDispatch();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const trips = useSelector((state: RootState) => state.trips.trips);

  const [actionTrip, setActionTrip] = useState<TripDetailsType | null>(null);

  const trip = React.useMemo(() => {
    if (!actionTrip) return null;
    return trips.find((t) => t.trip_id === actionTrip.trip_id) ?? null;
  }, [trips, actionTrip]);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driverLoading, setDriverLoading] = useState(false);
  const [searchRadius, setSearchRadius] = useState<number>(500);

  const [activeAction, setActiveAction] = useState<ActionType>(null);

  const [adjustedFare, setAdjustedFare] = useState<string>("");
  const adjustedFareNumber = Number(adjustedFare || 0);

  // Cancellation States
  const [cancelStep, setCancelStep] = useState<0 | 1>(0);
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const [cancelNotes, setCancelNotes] = useState<string>("");

  logger.debug("activeAction", { activeAction, trip });

  // Reset driver selection when trip changes
  React.useEffect(() => {
    setSelectedDriver(null);
    setSearchRadius(500);
  }, [trip]);

  const fetchAvailableDrivers = async (radius: number) => {
    logger.debug(`[DriverFetch] Triggered for trip ${trip?.trip_code} within ${radius}m`);
    if (!trip) return;
    try {
      setDriverLoading(true);
      const response = await axiosIns.post("/api/drivers/available-for-assignment", {
        lat: trip.pickup_lat,
        lng: trip.pickup_lng,
        radius: radius
      });

      const driverData = response.data?.data || [];
      logger.debug(`[DriverFetch] Successfully found ${response.data?.data?.length || 0} drivers`);

      const mappedDrivers: Driver[] = driverData.map((d: any) => ({
        id: d.id,
        name: d.name,
        status: "ACTIVE",
        location: d.current_address || 'Unknown',
        distanceKm: d.distance_km,
        etaMinutes: d.eta_minutes,
        phonenumber: d.phone_number || 'N/A'
      }));

      setDrivers(mappedDrivers);
    } catch (error) {
      logger.error("Error fetching available drivers:", error);
      notification.error({
        message: "Error",
        description: "Failed to fetch nearby drivers."
      });
    } finally {
      setDriverLoading(false);
    }
  };

  useEffect(() => {
    if (activeAction === "ASSIGN_DRIVER" && trip) {
      fetchAvailableDrivers(searchRadius);
    }
  }, [activeAction, trip, searchRadius]);

  const handleDriverChange = (driverId: string) => {
    const driver = drivers.find((d) => d.id === driverId) || null;
    setSelectedDriver(driver);
  };

  const menuItems = (r: TripDetailsType) => {
    const actionRestricted = isActionRestricted(r);

    const withTooltip = (label: string) =>
      actionRestricted ? (
        <Tooltip title={`Trip state is ${r.trip_status?.toLowerCase()}. No further actions allowed.`}>
          <span>{label}</span>
        </Tooltip>
      ) : (
        label
      );

    const items = [];

    if (isSuperAdmin) {
      items.push(
        {
          key: "assign_driver",
          label: withTooltip(
            isDriverAssigned(r) ? "Reassign Driver" : "Assign Driver",
          ),
          icon: <UserAddOutlined />,
          disabled: actionRestricted,
        },
        {
          key: "fare",
          label: withTooltip("Adjust Fare"),
          icon: <DollarOutlined />,
          disabled: actionRestricted,
        },
        {
          key: "cancel",
          label: withTooltip("Cancel Trip"),
          icon: <StopOutlined />,
          danger: true,
          disabled: actionRestricted,
        },
        {
          key: "trigger",
          label: withTooltip("Trigger to Drivers"),
          icon: <BellOutlined />,
          disabled: actionRestricted,
        }
      );
    }

    return items;
  };

  const isDriverAssigned = (trip: TripDetailsType | null) =>
    Boolean(trip?.driver_id && trip?.driver_name?.trim());

  const isActionRestricted = (trip: TripDetailsType | null) => {
    const status = trip?.trip_status;
    return status === "COMPLETED" || status === "CANCELLED" || status === "MID_CANCELLED";
  };

  const columns: TableColumnsType<TripDetailsType> = [
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Trip ID</span>,
      dataIndex: "trip_code",
      width: 140,
      render: (_, r) => (
        <Tooltip title="View Detailed Trip Analytics">
          <div
            onClick={(e) => {
              e.stopPropagation();
              setActionTrip(r);
              setDrawerOpen(true);
            }}
            className="group cursor-pointer flex items-center gap-2"
          >
            <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-mono text-[11px] font-extrabold tracking-tight border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
              {r.trip_code}
            </div>
          </div>
        </Tooltip>
      ),
    },
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Customer Details</span>,
      width: 200,
      render: (_, r) => (
        <div className="flex items-center gap-3">
          <Avatar
            className="flex-shrink-0 bg-gradient-to-tr from-amber-400 to-orange-300 border-2 border-white shadow-sm"
            icon={<UserOutlined />}
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-800 tracking-tight leading-none">{r.user_name}</span>
            <span className="text-[10px] text-gray-400 font-medium tracking-wider mt-1 flex items-center gap-1">
              <GrPhone className="text-[9px]" /> {r.user_phone}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Driver Partner</span>,
      width: 200,
      render: (_, r) => {
        const hasDriver = isDriverAssigned(r);
        return (
          <div className="flex items-center gap-3">
            <Avatar
              className={`flex-shrink-0 border-2 border-white shadow-sm ${hasDriver ? 'bg-gradient-to-tr from-emerald-400 to-teal-300' : 'bg-gray-100'}`}
              icon={hasDriver ? <CarOutlined /> : <UserAddOutlined className="text-gray-400" />}
            />
            <div className="flex flex-col">
              {hasDriver ? (
                <>
                  <span className="text-sm font-bold text-gray-800 tracking-tight leading-none">{r.driver_name}</span>
                  <span className="text-[10px] text-gray-400 font-medium tracking-wider mt-1 flex items-center gap-1">
                    <GrPhone className="text-[9px]" /> {r.driver_phone}
                  </span>
                </>
              ) : (
                <span className="text-xs font-medium text-gray-400 italic">Assign Pending...</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Route Geography</span>,
      width: 450,
      render: (_, r) => (
        <div className="flex flex-col gap-1 py-1">
          <div className="flex items-center gap-2 group">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50 flex-shrink-0" />
            <span className="text-[11px] font-bold text-gray-700 truncate max-w-[400px] leading-none">{r.pickup_address}</span>
          </div>
          <div className="ml-0.5 w-0.5 h-3 bg-gray-100" />
          <div className="flex items-center gap-2 group">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 ring-4 ring-rose-50 flex-shrink-0" />
            <span className="text-[11px] font-bold text-gray-700 truncate max-w-[400px] leading-none">{r.drop_address}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 pl-4">
            <Tag className="m-0 border-gray-100 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-lg px-2">
              {r.distance_km} KM
            </Tag>
            <Tag className="m-0 border-indigo-100 bg-indigo-50 text-indigo-500 text-[10px] font-bold rounded-lg px-2">
              ~{r.trip_duration_minutes} MINS
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Trip Status</span>,
      width: 140,
      render: (_, r) => {
        const getStatusColor = () => {
          switch (r.trip_status) {
            case "LIVE": return "from-emerald-500 to-teal-400 shadow-emerald-200";
            case "COMPLETED": return "from-indigo-600 to-blue-500 shadow-blue-200 text-white";
            case "ASSIGNED": return "from-blue-600 to-cyan-400 shadow-blue-200 text-white";
            case "REQUESTED": return "from-amber-400 to-orange-300 shadow-amber-200";
            case "CANCELLED": return "from-rose-500 to-pink-500 shadow-rose-200 text-white";
            default: return "from-slate-400 to-slate-500 shadow-slate-200 text-white";
          }
        };
        return (
          <div className={`inline-flex bg-gradient-to-r ${getStatusColor()} px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-lg`}>
            {r.trip_status}
          </div>
        );
      },
    },
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Total Revenue</span>,
      width: 120,
      render: (_, r) => (
        <div className="text-gray-800 font-extrabold text-sm tracking-tight">
          ₹{Number(r.total_fare || 0).toLocaleString()}
        </div>
      ),
    },
    {
      title: <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Service</span>,
      width: 120,
      render: (_, r) => (
        <span className="bg-slate-50 text-slate-500 border border-slate-100 px-2.5 py-1 rounded-lg text-[10px] font-extrabold tracking-widest uppercase">
          {r.service_type}
        </span>
      ),
    },
    {
      title: "",
      width: 80,
      render: (_, r) => (
        <div className="flex items-center justify-end gap-1">
          <Tooltip title="Deep Dive">
            <Button
              type="text"
              icon={<EyeOutlined className="text-indigo-600 text-lg" />}
              onClick={(e) => {
                e.stopPropagation();
                setActionTrip(r);
                setDrawerOpen(true);
              }}
              className="hover:bg-indigo-50 rounded-full"
            />
          </Tooltip>
          {isSuperAdmin && (
            <Dropdown
              trigger={["click"]}
              menu={{
                items: menuItems(r),
                onClick: ({ key }) => {
                  setActionTrip(r);
                  logger.debug(`[TableAction] Menu item clicked: ${key} for trip ${r.trip_code}`);
                  if (key === "assign_driver") setActiveAction("ASSIGN_DRIVER");
                  if (key === "fare") setActiveAction("ADJUST_FARE");
                  if (key === "cancel") setActiveAction("CANCEL_TRIP");
                  if (key === "trigger") setActiveAction("TRIGGER_DRIVER");
                },
              }}
            >
              <Button
                type="text"
                icon={<MoreOutlined className="text-gray-400 text-xl" />}
                className="hover:bg-gray-50 rounded-full"
              />
            </Dropdown>
          )}
        </div>
      ),
    },
  ];

  // ============================================
  // ASSIGN DRIVER CONTENT
  // ============================================

  // ============================================
  // ASSIGN DRIVER CONTENT
  // ============================================

  const AssignDriverContent = (
    <div className="flex gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 items-stretch">
      {/* Left Column: Trip Context */}
      <div className="w-80 shrink-0 flex flex-col">
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm h-full flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
              <IoCarOutline className="text-indigo-500" /> Trip Context
            </p>

            <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-gray-100 before:to-rose-500">
              <div className="relative">
                <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50 shadow-sm" />
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mb-1">Pick up</p>
                <p className="text-[11px] text-gray-700 font-extrabold leading-relaxed line-clamp-2">{trip?.pickup_address}</p>
              </div>

              <div className="relative">
                <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-rose-50 shadow-sm" />
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mb-1 font-mono">Drop off</p>
                <p className="text-[11px] text-gray-700 font-extrabold leading-relaxed line-clamp-2">{trip?.drop_address}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-dashed border-gray-100 space-y-4 bg-slate-50/50 -mx-6 -mb-6 p-6 rounded-b-3xl">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">Est. Distance</span>
              <span className="text-xs font-black text-gray-800 italic">{trip?.distance_km} KM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-tight">Gross Revenue</span>
              <span className="text-base font-black text-indigo-600 tabular-nums">₹{trip?.total_fare}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Driver Selection */}
      <div className="flex-grow flex flex-col">
        {/* Radius Header */}
        <div className="bg-gray-50/50 border border-gray-100 rounded-3xl p-5 mb-5 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
              <RadarChartOutlined /> Search Proximity
            </p>
            <div className="bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
              Scanning: {searchRadius >= 1000 ? `${searchRadius / 1000}km` : `${searchRadius}m`}
            </div>
          </div>
          <div className="flex flex-nowrap gap-2 justify-between">
            {[500, 1000, 2000, 5000, 10000, 20000].map(r => (
              <button
                key={r}
                onClick={(e) => {
                  e.preventDefault();
                  setSearchRadius(r);
                }}
                className={`flex-1 px-4 py-2 rounded-2xl text-[10px] font-black transition-all border duration-300
                    ${searchRadius === r
                    ? 'bg-indigo-500 border-indigo-500 !text-white transform scale-105'
                    : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-300 hover:text-indigo-500'}`}
              >
                {r >= 1000 ? `${r / 1000}km` : `${r}m`}
              </button>
            ))}
          </div>
        </div>

        {/* Driver List Area */}
        <div className="h-[480px] bg-white/30 rounded-[2.5rem] border-2 border-dashed border-gray-100 p-4 flex flex-col">
          <div className="flex-grow overflow-y-auto pr-2 space-y-4 custom-driver-scrollbar">
            {driverLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-indigo-500/20 blur-2xl animate-pulse rounded-full" />
                  <Spin size="large" className="relative" />
                </div>
                <p className="text-[11px] text-indigo-400 font-bold uppercase tracking-[0.2em] animate-pulse">Filtering Elite Partners...</p>
              </div>
            ) : drivers.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {drivers.map((driver) => (
                  <div
                    key={driver.id}
                    onClick={() => handleDriverChange(driver.id)}
                    className={`group py-2.5 px-4 rounded-3xl border-2 cursor-pointer transition-all duration-300
                          ${selectedDriver?.id === driver.id
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xl shadow-indigo-100/50 transform scale-[1.02]'
                        : 'border-gray-50 bg-white hover:border-indigo-200 hover:shadow-md'}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar
                          shape="square"
                          size={48}
                          className={`rounded-2xl border-2 border-white shadow-sm transition-colors duration-300 ${selectedDriver?.id === driver.id ? 'bg-indigo-600' : 'bg-slate-100'}`}
                          icon={<UserOutlined className={selectedDriver?.id === driver.id ? 'text-white' : 'text-slate-400'} />}
                        />
                        <div>
                          <div className="font-bold text-slate-800 text-sm leading-tight">{driver.name}</div>
                          <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-tight italic">
                            <EnvironmentOutlined /> {driver.location}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black shadow-sm ring-1 ring-emerald-100 whitespace-nowrap">
                            ETA: {driver.etaMinutes} MINS
                          </div>
                          <div className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black shadow-sm ring-1 ring-indigo-100 text-transform uppercase whitespace-nowrap">
                            {driver.distanceKm} KM AWAY
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500
                              ${selectedDriver?.id === driver.id ? 'border-indigo-600 bg-indigo-600 text-white rotate-[360deg]' : 'border-slate-100'}`}>
                          {selectedDriver?.id === driver.id && <CheckOutlined className="text-xs" />}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <UserDeleteOutlined className="text-2xl text-slate-200" />
                </div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">No partners discovered in vicinity</p>
                <Button
                  type="primary"
                  size="large"
                  icon={<VerticalAlignTopOutlined className="rotate-180" />}
                  className="!bg-indigo-500 hover:!bg-indigo-600 bg-slate-800 h-12 font-black px-10 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                  onClick={(e) => {
                    e.preventDefault();
                    const nextRadii = [500, 1000, 2000, 5000, 10000, 20000, 50000];
                    const next = nextRadii[nextRadii.indexOf(searchRadius) + 1] || 50000;
                    setSearchRadius(next);
                  }}
                >
                  Expand Scan Zone
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================
  // TRIGGER BROADCAST CONTENT
  // ============================================

  const TriggerBroadcastContent = (
    <div className="text-center py-2 animate-in fade-in zoom-in-95 duration-500">
      {/* 📍 Detailed Route Card */}
      <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm mb-8 text-left relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full translate-x-16 -translate-y-16 opacity-50 group-hover:scale-110 transition-transform duration-700" />

        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <EnvironmentOutlined className="text-indigo-500" /> Route Logistics
          </p>

          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-slate-100 before:to-rose-500">
            <div className="relative">
              <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50 shadow-sm" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-0.5">Pick up</p>
              <p className="text-xs text-slate-700 font-extrabold leading-relaxed">{trip?.pickup_address}</p>
            </div>

            <div className="relative">
              <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-rose-50 shadow-sm" />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-0.5">Drop off</p>
              <p className="text-xs text-slate-700 font-extrabold leading-relaxed">{trip?.drop_address}</p>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-dashed border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Gross Revenue</p>
              <p className="text-xl font-black text-indigo-600 tabular-nums italic">₹{trip?.total_fare}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Trip Code</p>
              <p className="text-xs font-black text-slate-800 italic">{trip?.trip_code}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Bar */}
      <div className="flex gap-5 mb-8 text-left">
        <div className="flex-[1.5] bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm group hover:border-indigo-200 transition-colors">
          <div className="flex justify-between items-start mb-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <RadarChartOutlined className="text-amber-500 text-xs" /> Radius scan
            </p>
            {driverLoading ? (
              <Spin size="small" />
            ) : (
              null
            )}
          </div>
          <Select
            className="w-full text-xs font-black custom-minimal-select"
            value={searchRadius}
            onChange={setSearchRadius}
            bordered={false}
            dropdownClassName="rounded-2xl border-none shadow-2xl"
          >
            {[500, 1000, 2000, 5000, 10000, 20000, 50000].map(r => (
              <Select.Option key={r} value={r}>
                <span className="font-black italic pr-1">{r >= 1000 ? `${r / 1000}KM` : `${r}M`}</span> range
              </Select.Option>
            ))}
          </Select>
        </div>
        <div className="flex-1 bg-indigo-50/50 border border-indigo-100 p-5 rounded-[2rem] flex flex-col items-center justify-center text-center">
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <CloudSyncOutlined className="text-indigo-500 text-xs" /> Active Protocol
          </p>
          <p className="text-[12px] font-black text-indigo-900 italic font-mono tracking-tight">NEW_TRIP_BROADCAST</p>
        </div>
      </div>

      <div className="bg-indigo-600/5 p-5 rounded-[2.5rem] border border-indigo-100/50 flex items-start gap-5 text-left group hover:bg-white transition-all duration-300">
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100">
          <EyeOutlined className="text-lg" />
        </div>
        <div>
          <p className="text-xs font-black text-indigo-900 italic tracking-tight mb-1.5 uppercase">Network Procedure</p>
          <p className="text-[10px] text-indigo-500/80 leading-relaxed font-bold italic">
            Initiating this protocol will emit real-time ride alerts to discovered partners. Partners have a <span className="text-indigo-600 underline underline-offset-4">15-second response window</span> to secure the trip.
          </p>
        </div>
      </div>
    </div>
  );

  // ============================================
  // CONFIRM ASSIGN DRIVER
  // ============================================

  const confirmAssignDriver = async (trip: TripDetailsType | null) => {
    logger.info(`[AssignAction] Confirming assignment for trip ${trip?.trip_code} to driver ${selectedDriver?.name}`);
    if (!trip || !selectedDriver) return;

    const key = `assign-driver-${trip.trip_id}`;

    notification.open({
      key,
      message: "Assigning Driver",
      description: "Please wait while we send the assignment request...",
      placement: "topRight",
      duration: 0,
    });

    setDriverLoading(true);

    try {
      // 🚀 REAL API CALL
      await axiosIns.post(`/api/trips/${trip.trip_id}/assign`, {
        driver_id: selectedDriver.id,
      });

      dispatch(
        assignDriverUI({
          trip_id: trip.trip_id,
          driver_id: selectedDriver.id,
          driver_name: selectedDriver.name,
          driver_phone: selectedDriver.phonenumber,
        }),
      );

      notification.success({
        key,
        message: "Assignment Request Sent",
        description: `Notification sent to ${selectedDriver.name}. Waiting for driver acceptance.`,
        placement: "topRight",
        duration: 4,
      });
    } catch (error: any) {
      logger.error("[AssignAction] Failed:", error);
      notification.error({
        key,
        message: "Assignment Failed",
        description: error.response?.data?.message || "Could not assign driver. Please try again.",
        placement: "topRight",
      });
    } finally {
      setDriverLoading(false);
      setSelectedDriver(null);
      setActiveAction(null);
    }
  };

  // ============================================
  // ADJUST FARE CONTENT & HANDLER
  // ============================================

  const AdjustFareContent = (
    <div className="animate-in fade-in zoom-in-95 duration-500 px-2 pb-2">
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6 flex justify-between items-center shadow-inner">
        <div>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Current Fare</p>
          <p className="text-lg font-black text-slate-700 tabular-nums">₹{trip?.total_fare ?? 0}</p>
        </div>
        <div className="h-8 w-px bg-slate-200" />
        <div className="text-right">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Currency</p>
          <p className="text-lg font-black text-slate-700">INR</p>
        </div>
      </div>

      <div className="mb-8">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3 ml-1">Proposed adjustment</p>
        <Input
          type="number"
          size="large"
          prefix={<span className="text-indigo-600 font-black italic mr-2 text-xl">₹</span>}
          placeholder="0.00"
          value={adjustedFare}
          onChange={(e) => setAdjustedFare(e.target.value)}
          className="rounded-[1.25rem] h-14 text-xl font-black italic border-2 border-slate-100 focus:border-indigo-600 focus:ring-indigo-100 transition-all shadow-sm"
        />
      </div>

      {adjustedFare && (
        <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 flex items-center gap-4 animate-in slide-in-from-top-2">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-100/50">
            <DollarOutlined className="text-lg" />
          </div>
          <div>
            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-0.5">Finalized Total</p>
            <p className="text-xl font-black text-indigo-600 tabular-nums italic">₹{adjustedFareNumber}</p>
          </div>
        </div>
      )}
    </div>
  );

  const confirmAdjustFare = (trip: TripDetailsType | null) => {
    logger.info(`[AdjustFare] Confirming fare adjustment for trip ${trip?.trip_code}`);
    if (!trip || !adjustedFare) return;

    dispatch(
      adjustFareUI({
        trip_id: trip.trip_id,
        total_fare: Number(adjustedFare),
      }),
    );

    notification.success({
      message: "Fare Updated",
      description: `New fare: ₹${adjustedFare}`,
      placement: "topRight",
      duration: 2,
    });

    setAdjustedFare("");
    setActiveAction(null); // ✅ Only close after confirmation
  };

  // ============================================
  // CANCEL TRIP CONTENT & HANDLER
  // ============================================

  const CancelTripContent = (
    <div className="text-sm">
      {actionTrip?.trip_status === 'LIVE' && (
        <div className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 animate-pulse">
          <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
            <StopOutlined className="text-xs" />
          </div>
          <p className="text-[10px] text-red-700 font-bold leading-tight">
            CRITICAL: This trip is currently LIVE (In Progress). Terminating it will interrupt the active journey.
          </p>
        </div>
      )}
      {cancelStep === 0 ? (
        <div className="py-2 text-center">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <StopOutlined style={{ fontSize: 24 }} />
          </div>
          <p className="font-bold text-gray-900 text-sm">
            Terminate Trip Session
          </p>
          <p className="text-gray-500 mt-1.5 leading-relaxed">
            Are you sure you want to cancel trip <span className="font-mono text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{actionTrip?.trip_code}</span>? This action is irreversible.
          </p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-3 font-bold flex items-center gap-1.5">
            <EyeOutlined className="text-xs" /> Select Cancellation Reason
          </p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {ADMIN_CANCEL_REASONS.map((r) => (
              <Tag.CheckableTag
                key={r.value}
                checked={cancelReason === r.value}
                onChange={() => setCancelReason(r.value)}
                className={`text-[10px] m-0 px-3 py-2 border rounded-xl transition-all text-center flex items-center justify-center h-10 font-medium
                  ${cancelReason === r.value
                    ? 'bg-red-600 text-white border-red-600 shadow-md transform scale-[1.02]'
                    : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-red-200 hover:bg-red-50/30'}`}
              >
                {r.label}
              </Tag.CheckableTag>
            ))}
          </div>

          {cancelReason === "OTHER" && (
            <div className="animate-in zoom-in-95 duration-200">
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2 font-bold">Specify Reason</p>
              <Input.TextArea
                rows={3}
                placeholder="Internal notes for tracking this cancellation..."
                value={cancelNotes}
                onChange={(e) => setCancelNotes(e.target.value)}
                className="text-xs rounded-2xl border-gray-100 focus:border-red-300 focus:ring-red-200"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );

  const confirmCancelTrip = async (trip: TripDetailsType | null) => {
    console.log(`[CancelTrip] Confirming termination for ${trip?.trip_code}. Reason: ${cancelReason}`);
    if (!trip || !cancelReason) return;

    const key = `cancel-trip-${trip.trip_id}`;
    notification.open({
      key,
      message: "Terminating Trip",
      description: "Processing cancellation request...",
      placement: "topRight",
      duration: 0,
    });

    try {
      // 🚀 REAL API CALL
      await axiosIns.post(`/api/trips/cancel/${trip.trip_id}`, {
        cancel_reason: cancelReason,
        cancel_by: 'ADMIN',
        notes: cancelReason === 'OTHER' ? cancelNotes : `Cancelled by admin: ${cancelReason}`,
      });

      notification.success({
        key,
        message: "Trip Cancelled",
        description: `Trip ${trip.trip_code} has been successfully terminated by Admin.`,
        placement: "topRight",
        duration: 4,
      });

      setActiveAction(null);
      setCancelStep(0);
      setCancelReason(null);
      setCancelNotes("");
    } catch (error: any) {
      console.error("[CancelTrip] Failed:", error);
      notification.error({
        key,
        message: "Cancellation Failed",
        description: error.response?.data?.message || "Could not cancel trip. Please try again.",
        placement: "topRight",
      });
    }
  };

  const confirmTriggerBroadcast = async (trip: TripDetailsType | null) => {
    console.log(`[TriggerAction] Confirming broadcast for trip ${trip?.trip_code} with radius ${searchRadius}m`);
    if (!trip) return;

    const key = `trigger-broadcast-${trip.trip_id}`;

    notification.open({
      key,
      message: "Broadcasting Trip",
      description: `Notifying partners within ${searchRadius >= 1000 ? `${searchRadius / 1000}km` : `${searchRadius}m`}...`,
      placement: "topRight",
      duration: 0,
    });

    setDriverLoading(true);

    try {
      // 🚀 REAL API CALL
      const response = await axiosIns.post(`/api/trips/${trip.trip_id}/trigger`, {
        radius: searchRadius,
      });

      const notifiedCount = response.data?.data?.notifiedCount || 0;

      notification.success({
        key,
        message: "Broadcast Successful",
        description: `Successfully notified ${notifiedCount} partners near the pickup location.`,
        placement: "topRight",
        duration: 4,
      });
    } catch (error: any) {
      console.error("[TriggerAction] Failed:", error);
      notification.error({
        key,
        message: "Broadcast Failed",
        description: error.response?.data?.message || "Could not trigger broadcast. Please try again.",
        placement: "topRight",
      });
    } finally {
      setDriverLoading(false);
      setActiveAction(null);
    }
  };

  // ============================================
  // MODAL OK HANDLER
  // ============================================

  const handleModalOk = () => {
    console.log(`[ModalOk] Handling action: ${activeAction}`);
    if (!actionTrip) return;

    switch (activeAction) {
      case "ASSIGN_DRIVER":
        confirmAssignDriver(actionTrip);
        break;
      case "ADJUST_FARE":
        confirmAdjustFare(actionTrip);
        break;
      case "CANCEL_TRIP":
        if (cancelStep === 0) {
          setCancelStep(1);
        } else {
          confirmCancelTrip(actionTrip);
        }
        break;
      case "TRIGGER_DRIVER":
        confirmTriggerBroadcast(actionTrip);
        break;
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="flex-grow overflow-hidden h-full">
      <Table
        columns={columns}
        dataSource={data}
        rowKey="trip_id"
        pagination={{
          pageSize: 6,
          className: "!mb-0 !mt-4",
          size: "small"
        }}
        scroll={{ x: 'max-content', y: 'calc(100vh - 425px)' }}
        sticky
        className="premium-table-container"
      />

      {/* Drawer */}
      <TripDetailsDrawer
        open={drawerOpen}
        trip={trip}
        onClose={() => {
          setDrawerOpen(false);
          setActionTrip(null);
          // ✅ Removed: setActiveAction(null) - Don't close modal when drawer closes
        }}
        activeAction={activeAction}
        onAssignDriverClick={() => {
          console.log("[DrawerCallback] Setting activeAction to ASSIGN_DRIVER");
          setActiveAction("ASSIGN_DRIVER");
        }}
        onAdjustFareClick={() => {
          console.log("[DrawerCallback] Setting activeAction to ADJUST_FARE");
          setActiveAction("ADJUST_FARE");
        }}
        onCancelTripClick={() => {
          console.log("[DrawerCallback] Setting activeAction to CANCEL_TRIP");
          setActiveAction("CANCEL_TRIP");
        }}
        onTriggerDriversClick={() => {
          console.log("[DrawerCallback] Setting activeAction to TRIGGER_DRIVER");
          setActiveAction("TRIGGER_DRIVER");
        }}
        isTripCompleted={isActionRestricted}
        isDriverAssigned={isDriverAssigned}
      />

      {/* Modal Overhaul */}
      <Modal
        open={activeAction !== null}
        width={
          activeAction === "ASSIGN_DRIVER" ? 1100 :
            activeAction === "TRIGGER_DRIVER" ? 850 :
              activeAction === "ADJUST_FARE" ? 480 :
                500
        }
        centered
        onCancel={() => {
          console.log(`[Modal] Cancelled action: ${activeAction}`);
          setActiveAction(null);
          setSelectedDriver(null);
          setAdjustedFare("");
          setSearchRadius(500);
          setCancelStep(0);
          setCancelReason(null);
          setCancelNotes("");
        }}
        onOk={handleModalOk}
        styles={{
          mask: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' },
          header: { marginBottom: '24px', borderBottom: 'none' },
          body: { padding: '12px 0' }
        }}
        style={{ borderRadius: '2.5rem', overflow: 'hidden' }}
        title={
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg
               ${activeAction === "ASSIGN_DRIVER" ? 'bg-indigo-600' : activeAction === "TRIGGER_DRIVER" ? 'bg-amber-500' : 'bg-slate-800'}`}>
              {activeAction === "ASSIGN_DRIVER" ? <UserAddOutlined /> : activeAction === "TRIGGER_DRIVER" ? <BellOutlined /> : <DollarOutlined />}
            </div>
            <div>
              <p className="text-sm font-black text-slate-800 leading-none">
                {activeAction === "ASSIGN_DRIVER"
                  ? trip?.driver_name
                    ? "Reassign Partner"
                    : "Assign Partner"
                  : activeAction
                    ? titleMap[activeAction]
                    : ""}
              </p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Platform Operations Protocol</p>
            </div>
          </div>
        }
        okButtonProps={{
          disabled:
            (activeAction === "ASSIGN_DRIVER" && !selectedDriver) ||
            (activeAction === "ADJUST_FARE" && !adjustedFare) ||
            (activeAction === "CANCEL_TRIP" && cancelStep === 1 && !cancelReason) ||
            (activeAction === "CANCEL_TRIP" && cancelStep === 1 && cancelReason === "OTHER" && !cancelNotes.trim()),
          loading: driverLoading,
          className: `!h-11 !px-8 !rounded-2xl !font-black !italic !text-xs !tracking-tight !shadow-lg !transition-all !duration-300 !transform !hover:scale-[1.03] !active:scale-95 !border-none
            ${((activeAction === "ASSIGN_DRIVER" && !selectedDriver) ||
              (activeAction === "ADJUST_FARE" && !adjustedFare) ||
              (activeAction === "CANCEL_TRIP" && cancelStep === 1 && !cancelReason) ||
              (activeAction === "CANCEL_TRIP" && cancelStep === 1 && cancelReason === "OTHER" && !cancelNotes.trim()))
              ? '!bg-slate-100 !text-slate-400 !shadow-none !cursor-not-allowed hover:!scale-100'
              : activeAction === 'ASSIGN_DRIVER' ? '!bg-indigo-500 hover:!bg-indigo-600' :
                activeAction === 'TRIGGER_DRIVER' ? '!bg-amber-500 hover:!bg-amber-600' :
                  activeAction === 'CANCEL_TRIP' ? '!bg-rose-600 !text-white hover:!bg-rose-700' :
                    '!bg-slate-900 hover:!bg-slate-800'}`
        }}
        cancelButtonProps={{
          className: "!h-11 !px-6 !rounded-2xl !font-bold !text-xs !border-none !bg-slate-100 !text-slate-500 hover:!bg-slate-200 !hover:text-slate-600 !transition-all !duration-300"
        }}
        okText={
          activeAction === "CANCEL_TRIP"
            ? cancelStep === 0
              ? "Confirm Termination"
              : "End Trip Session"
            : activeAction
              ? okTextMap[activeAction]
              : "OK"
        }
      >
        {activeAction === "ASSIGN_DRIVER" && AssignDriverContent}
        {activeAction === "ADJUST_FARE" && AdjustFareContent}
        {activeAction === "CANCEL_TRIP" && CancelTripContent}
        {activeAction === "TRIGGER_DRIVER" && TriggerBroadcastContent}
      </Modal>
    </div>
  );
};

export default TripDetailsTable;