import React from "react";
import { Masonry, Divider, Typography, Button } from "antd";
import { GrPhone } from "react-icons/gr";
import { IoReceiptOutline, IoPeopleOutline, IoCalendarOutline } from "react-icons/io5";
import {
  UserOutlined,
  CarOutlined,
  MessageOutlined,
  FolderOutlined,
  MoneyCollectOutlined,
  HistoryOutlined,
  CalendarOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined,
  EnvironmentOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import {
  buildTripHistory,
  type TripTransaction,
  type TripDetailsType,
} from "../../store/slices/tripSlice";
import { useHasPermission } from "../../hooks/usePermission";

const { Text } = Typography;

interface Props {
  trip: TripDetailsType;
}

// ─── DetailCard wrapper ───────────────────────────────────────────────────────
const DetailCard = ({
  icon,
  title,
  children,
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-[1rem] border border-gray-100 shadow-sm overflow-hidden mb-2 ${className}`}
  >
    <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-3">
      <div className="w-8 h-8 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-indigo-600">
        {icon}
      </div>
      <span className="text-xs font-extrabold text-gray-800 uppercase tracking-widest">
        {title}
      </span>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// ─── Formatters ───────────────────────────────────────────────────────────────
const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  let hours = date.getHours();
  const mins = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day}-${month}-${year}, ${hours}:${mins} ${ampm}`;
};

// ─── Actor badge color ────────────────────────────────────────────────────────
const actorColor = (actor_type: string) => {
  switch (actor_type) {
    case "user":
      return "bg-blue-50 text-blue-600 border-blue-100";
    case "driver":
      return "bg-emerald-50 text-emerald-600 border-emerald-100";
    case "admin":
      return "bg-indigo-50 text-indigo-600 border-indigo-100";
    default:
      return "bg-gray-50 text-gray-500 border-gray-100";
  }
};

// ─── Render diff for a transaction ────────────────────────────────────────────
const renderTransactionDiff = (tx: TripTransaction) => {
  const oldVal = tx.old_value ?? {};
  const newVal = tx.new_value ?? {};

  switch (tx.event_type) {
    case "fare_updated":
      return (
        <>
          <span className="line-through text-gray-500 text-xs">
            ₹{String(oldVal.total_fare ?? "—")}
          </span>
          <ArrowRightOutlined />
          <span className="text-xs">₹{String(newVal.total_fare ?? "—")}</span>
        </>
      );

    case "driver_assigned":
    case "driver_reassigned":
      return (
        <>
          <span className="line-through text-gray-500 text-xs">
            {String(oldVal.driver_id ?? "None")}
          </span>
          <ArrowRightOutlined />
          <span className="text-xs">{String(newVal.driver_id ?? "—")}</span>
        </>
      );

    case "trip_rescheduled":
    case "scheduled_time_updated":
      return (
        <>
          <span className="line-through text-gray-500 text-xs">
            {formatDateTime(oldVal.scheduled_start_time as string)}
          </span>
          <ArrowRightOutlined />
          <span className="text-xs">{formatDateTime(newVal.scheduled_start_time as string)}</span>
        </>
      );

    case "trip_requested":
    case "trip_accepted":
    case "trip_started":
    case "trip_completed":
    case "trip_cancelled":
    case "status_changed":
      return (
        <>
          <span className="line-through text-gray-500 text-xs">
            {String(oldVal.trip_status ?? "—")}
          </span>
          <ArrowRightOutlined />
          <span className="text-xs">{String(newVal.trip_status ?? "—")}</span>
        </>
      );

    case "pickup_location_updated":
      return (
        <>
          <span className="line-through text-gray-500 text-xs">
            {String(oldVal.pickup_address ?? "—")}
          </span>
          <ArrowRightOutlined />
          <span className="text-xs">{String(newVal.pickup_address ?? "—")}</span>
        </>
      );

    case "dropoff_location_updated":
      return (
        <>
          <span className="line-through text-gray-500 text-xs">
            {String(oldVal.drop_address ?? "—")}
          </span>
          <ArrowRightOutlined />
          <span className="text-xs">{String(newVal.drop_address ?? "—")}</span>
        </>
      );

    case "payment_status_changed":
      return (
        <>
          <span className="line-through text-gray-500 text-xs">
            {String(oldVal.payment_status ?? "—")}
          </span>
          <ArrowRightOutlined />
          <span className="text-xs">{String(newVal.payment_status ?? "—")}</span>
        </>
      );

    case "rating_submitted":
      return (
        <>
          <span className="text-xs text-yellow-500">
            {"★".repeat(Number(newVal.rating ?? 0))}
            {"☆".repeat(5 - Number(newVal.rating ?? 0))}
          </span>
          <span className="text-xs text-gray-500 ml-1">{String(newVal.rating ?? "—")} / 5</span>
        </>
      );

    case "note_added":
      return (
        <span className="text-xs text-gray-600 italic">{String(newVal.notes ?? "Note added")}</span>
      );

    default:
      return (
        <span className="text-xs text-gray-500">
          {tx.changed_fields?.join(", ") ?? tx.event_type.replace(/_/g, " ")}
        </span>
      );
  }
};

// ─── Timeline items ───────────────────────────────────────────────────────────
const timelineItems = (trip: TripDetailsType | null) => [
  {
    label: "Scheduled Time",
    value: formatDateTime(trip?.scheduled_start_time),
    bg: "bg-yellow-100",
    iconColor: "text-yellow-600",
    icon: <CalendarOutlined />,
  },
  {
    label: "Start Time",
    value: formatDateTime(trip?.actual_pickup_time),
    bg: "bg-green-100",
    iconColor: "text-green-600",
    icon: <PlayCircleOutlined />,
  },
  {
    label: "End Time",
    value: trip?.actual_drop_time ? formatDateTime(trip.actual_drop_time) : "In Progress",
    bg: "bg-blue-100",
    iconColor: "text-blue-600",
    icon: <CheckCircleOutlined />,
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
const TripDetailsMasonry: React.FC<Props> = ({ trip }) => {
  const canUpdateTrips = useHasPermission("trips", "update");
  const items = timelineItems(trip);
  const tripHistory = trip ? buildTripHistory(trip) : [];
  const userTxs = trip.trip_transactions?.filter((tx) => tx.actor_type === "user") ?? [];

  const cards = [
    // ── 1. Basic Information ──────────────────────────────────────────────────
    {
      key: "basic-info",
      data: (
        <DetailCard icon={<IoReceiptOutline size={18} />} title="Trip Essence">
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-extrabold tracking-widest uppercase border border-indigo-100">
              {trip?.service_type}
            </span>
            <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-extrabold tracking-widest uppercase border border-slate-100">
              {trip?.ride_type}
            </span>
          </div>

          <div className="space-y-4">
            <div className="relative pl-6">
              <div className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
              <div className="absolute left-[4.5px] top-4 w-px h-8 bg-gray-100" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-1">
                Origin
              </span>
              <p className="text-xs font-bold text-gray-700 leading-relaxed">
                {trip?.pickup_address}
              </p>
            </div>
            <div className="relative pl-6">
              <div className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-50" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 block mb-1">
                Destination
              </span>
              <p className="text-xs font-bold text-gray-700 leading-relaxed">
                {trip?.drop_address}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              {
                label: "Est. Dist",
                value: `${trip?.Estimate_km} KM`,
                icon: <EnvironmentOutlined className="text-emerald-500" />,
              },
              {
                label: "Duration",
                value: `${trip?.trip_duration_minutes} MIN`,
                icon: <HistoryOutlined className="text-blue-500" />,
              },
              {
                label: "Actual Dist",
                value: `${trip?.distance_km} KM`,
                icon: <PlayCircleOutlined className="text-indigo-500" />,
              },
              {
                label: "Fare",
                value: `₹${trip?.total_fare}`,
                icon: <DollarOutlined className="text-amber-500" />,
              },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                className="bg-gray-50/50 border border-gray-100 rounded-2xl p-3 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                    {label}
                  </span>
                  <span className="text-[14px]">{icon}</span>
                </div>
                <span className="text-xs font-extrabold text-gray-800 tracking-tight">{value}</span>
              </div>
            ))}
          </div>
        </DetailCard>
      ),
    },

    // ── 2. Payment Details ────────────────────────────────────────────────────
    {
      key: "payment",
      data: (
        <DetailCard icon={<FolderOutlined />} title="Settlement Status">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Amount
              </span>
              <span className="text-sm font-extrabold text-gray-800 tracking-tight">
                ₹{trip?.total_fare}
              </span>
            </div>
            <div className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                Method
              </span>
              <span className="text-sm font-extrabold text-gray-800 tracking-tight uppercase">
                {trip?.payment_method}
              </span>
            </div>
          </div>
          <div className="mt-3 p-4 bg-white rounded-2xl border border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">Payment Health</span>
            <span
              className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold tracking-widest border
                ${
                  trip?.payment_status === "PAID"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                    : trip?.payment_status === "PENDING"
                      ? "bg-amber-50 text-amber-600 border-amber-100"
                      : "bg-rose-50 text-rose-600 border-rose-100"
                }`}
            >
              {trip?.payment_status}
            </span>
          </div>
        </DetailCard>
      ),
    },

    // ── 3. Fare Breakdown ─────────────────────────────────────────────────────
    {
      key: "farebreakdown",
      data: (
        <DetailCard
          icon={<MoneyCollectOutlined style={{ fontSize: 20, color: "#4f46e5" }} />}
          title="Fare Breakdown"
        >
          {[
            { label: "Base Fare", sub: "(Fixed Minimum)", value: trip?.base_fare },
            { label: "Distance Fare", sub: "(Per KM)", value: trip?.distance_fare },
            { label: "Time Fare", sub: "(Per minute)", value: trip?.time_fare },
          ].map(({ label, sub, value }) => (
            <div key={label} className="grid grid-cols-[1fr_auto] gap-2 items-center text-sm mt-1">
              <div className="text-gray-800">
                {label}
                <span className="text-gray-400 ml-1">{sub}</span>
              </div>
              <div className="font-medium text-right">₹{value ?? 0}</div>
            </div>
          ))}

          <Divider style={{ margin: "10px 2px" }} />

          {[
            {
              label: "Waiting Fare",
              sub: `(After ${trip?.waiting_time_minutes} min)`,
              value: trip?.waiting_charges,
            },
            { label: "Driver Allowance", sub: "", value: trip?.driver_allowance },
            {
              label: "Return Compensation",
              sub: `(${trip?.ride_type})`,
              value: trip?.return_compensation,
            },
            {
              label: "Surge Pricing",
              sub: `(${trip?.surge_multiplier}x)`,
              value: trip?.surge_pricing,
            },
          ].map(({ label, sub, value }) => (
            <div key={label} className="grid grid-cols-[1fr_auto] gap-2 items-center text-sm mt-1">
              <div className="text-gray-800">
                {label}
                <span className="text-gray-400 ml-1">{sub}</span>
              </div>
              <div className="font-medium text-right">₹{value ?? 0}</div>
            </div>
          ))}

          <Divider style={{ margin: "10px 2px" }} />

          {[
            { label: "Tip", value: trip?.tip },
            { label: "Toll Charges", value: trip?.toll_charges },
            { label: "Night Charges", value: trip?.night_charges },
          ].map(({ label, value }) => (
            <div key={label} className="grid grid-cols-[1fr_auto] gap-2 items-center text-sm mt-1">
              <div className="text-gray-800">{label}</div>
              <div className="font-medium text-right">₹{value ?? 0}</div>
            </div>
          ))}

          <Divider style={{ margin: "10px 2px" }} />

          <div className="grid grid-cols-[1fr_auto] items-center text-sm mt-1">
            <div className="text-gray-800">Discount / Promo</div>
            <div className="font-medium text-right">- ₹{trip?.discount ?? 0}</div>
          </div>

          <Divider style={{ margin: "10px 2px" }} />

          <div className="grid grid-cols-[1fr_auto] items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
            <div className="text-blue-800 font-medium">Subtotal</div>
            <div className="font-semibold text-blue-900 justify-self-end">
              ₹{trip?.subtotal ?? 0}
            </div>
          </div>

          <Divider style={{ margin: "10px 2px" }} />

          {[
            { label: `GST (${trip?.gst_percentage}%)`, value: trip?.gst_amount },
            { label: "Platform Fee", value: trip?.platform_fee },
          ].map(({ label, value }) => (
            <div key={label} className="grid grid-cols-[1fr_auto] gap-2 items-center text-sm mt-1">
              <div className="text-gray-800">{label}</div>
              <div className="font-medium text-right">₹{value ?? 0}</div>
            </div>
          ))}

          <Divider style={{ margin: "10px 2px" }} />

          <div className="grid grid-cols-[1fr_auto] items-center rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-sm">
            <div className="text-violet-800 font-semibold">Total Fare</div>
            <div className="font-semibold text-violet-900 justify-self-end">
              ₹{trip?.total_fare}
            </div>
          </div>
        </DetailCard>
      ),
    },

    // ── 4. Full Transaction History ───────────────────────────────────────────
    {
      key: "tripchangehistory",
      data: (
        <DetailCard icon={<HistoryOutlined />} title="Transaction Audit">
          <div className="h-[60vh] flex flex-col">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {tripHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3 grayscale opacity-30">
                  <HistoryOutlined className="text-4xl" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    No Records Found
                  </span>
                </div>
              ) : (
                tripHistory.map((tx, index) => (
                  <div
                    key={tx.id ?? index}
                    className="relative pl-4 border-l-2 border-gray-50 pb-4 last:pb-0"
                  >
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-200" />

                    <div className="flex justify-between items-center mb-2">
                      <span className="bg-white border border-gray-100 text-gray-400 px-2 py-0.5 rounded text-[8px] font-mono">
                        #{tx.sequence_no}
                      </span>
                      <span
                        className={`border px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-widest uppercase ${actorColor(tx.actor_type)}`}
                      >
                        {tx.actor_type}
                      </span>
                    </div>

                    <div className="bg-gray-50/80 rounded-2xl p-3 border border-gray-100">
                      <p className="text-[11px] font-extrabold text-gray-800 capitalize mb-1">
                        {tx.event_type.replace(/_/g, " ")}
                      </p>
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                        {renderTransactionDiff(tx)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 px-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                        {formatDateTime(tx.event_at as string)}
                      </span>
                      {tx.notes && (
                        <span className="text-[10px] font-bold text-indigo-500 truncate max-w-[50%] tracking-tight">
                          {tx.notes}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DetailCard>
      ),
    },

    // ── 5. Trip Timeline ──────────────────────────────────────────────────────
    {
      key: "triptime",
      data: (
        <DetailCard
          icon={<IoCalendarOutline size={18} className="text-indigo-600" />}
          title="Trip Timeline"
        >
          <div className="pl-3">
            {items.map((item, index) => (
              <div key={index} className="relative flex gap-3 pb-5">
                {index !== items.length - 1 && (
                  <span className="absolute left-3.5 top-7 h-full w-px bg-gray-200" />
                )}
                <div
                  className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full ${item.bg}`}
                >
                  <span className={`text-sm ${item.iconColor}`}>{item.icon}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-400 leading-tight">{item.label}</p>
                  <p className="text-sm text-gray-800 leading-tight">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </DetailCard>
      ),
    },

    // ── 6. User Trip Changes ──────────────────────────────────────────────────
    {
      key: "user-trip",
      data: (
        <DetailCard
          icon={<HistoryOutlined style={{ fontSize: 18, color: "#4f46e5" }} />}
          title="User Trip Changes"
        >
          {userTxs.length === 0 ? (
            <div className="py-4 text-center text-gray-400 text-xs">
              No changes made by user yet
            </div>
          ) : (
            <div className="space-y-3">
              {userTxs.map((tx, index) => (
                <div key={tx.id ?? index} className="border-b pb-2 last:border-b-0">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold capitalize">
                      {tx.event_type.replace(/_/g, " ")}
                    </span>
                    <span className="inline-block border border-yellow-400 text-yellow-600 px-1.5 py-0.5 rounded text-[10px]">
                      USER
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs">
                    {renderTransactionDiff(tx)}
                  </div>

                  <div className="flex justify-between text-[11px] text-gray-400 mt-2">
                    <p>{formatDateTime(tx.event_at as string)}</p>
                    <p className="text-violet-700">{tx.notes ?? "User requested change"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DetailCard>
      ),
    },

    // ── 7. User & Driver Details ──────────────────────────────────────────────
    {
      key: "userdriverdetails",
      data: (
        <DetailCard
          icon={<IoPeopleOutline size={20} className="text-indigo-600" />}
          title="User & Driver Details"
        >
          <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
            {/* Customer */}
            <div className="pr-2">
              <div className="text-xs font-semibold mb-2">
                <UserOutlined className="text-yellow-500 bg-yellow-200 rounded px-2 py-1 mr-1" />
                CUSTOMER
              </div>
              <Text strong>{trip.user_name}</Text>
              <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                <GrPhone /> {trip.user_phone}
              </div>
              <div className="flex gap-1 pt-2">
                <Button
                  size="small"
                  disabled={!canUpdateTrips}
                  className="h-6 px-1 text-[10px] flex items-center gap-1"
                >
                  <GrPhone className="text-[12px]" /> Call
                </Button>
                <Button
                  size="small"
                  disabled={!canUpdateTrips}
                  className="h-6 px-1 text-[10px] flex items-center gap-1"
                >
                  <MessageOutlined className="text-[12px]" /> Msg
                </Button>
              </div>
            </div>

            <div className="w-px bg-gray-300" />

            {/* Driver */}
            <div className="pl-2">
              <div className="text-xs font-semibold mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <CarOutlined className="text-green-500 bg-green-200 rounded px-2 py-1" />
                  <span>DRIVER</span>
                </div>
                {trip?.trip_status === "ASSIGNED" && (
                  <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-[9px] font-bold animate-pulse uppercase tracking-wider border border-amber-200">
                    Acceptance Pending
                  </span>
                )}
              </div>
              {trip?.driver_name ? (
                <>
                  <Text strong>{trip.driver_name}</Text>
                  <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                    <GrPhone /> {trip.driver_phone}
                  </div>
                  <div className="flex gap-1 pt-2">
                    <Button
                      size="small"
                      disabled={!canUpdateTrips}
                      className="h-6 px-1 text-[10px] flex items-center gap-1"
                    >
                      <GrPhone className="text-[12px]" /> Call
                    </Button>
                    <Button
                      size="small"
                      disabled={!canUpdateTrips}
                      className="h-6 px-1 text-[10px] flex items-center gap-1"
                    >
                      <MessageOutlined className="text-[12px]" /> Msg
                    </Button>
                  </div>
                </>
              ) : (
                <div className="inline-block border border-dashed border-gray-400 text-gray-500 px-3 py-1 rounded text-xs">
                  Not Assigned
                </div>
              )}
            </div>
          </div>
        </DetailCard>
      ),
    },
  ];

  return (
    <Masonry
      columns={{ xs: 1, sm: 2, md: 3, lg: 4 }}
      gutter={[10, 0]}
      items={cards}
      itemRender={(item) => item.data}
    />
  );
};

export default TripDetailsMasonry;
