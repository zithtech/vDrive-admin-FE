import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Card, Divider, Input, InputNumber, Segmented, Select, Tag, TimePicker } from "antd";
import { useState, useEffect } from "react";
import { BsClock } from "react-icons/bs";
import { FaRegStar } from "react-icons/fa";
import { FiUsers } from "react-icons/fi";
import dayjs, { type Dayjs } from "dayjs";
import { LuZap } from "react-icons/lu";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchHotspots } from "../../store/slices/hotspotSlice";

export type Day =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type UserType = "normal-driver" | "premium-driver" | "elite-driver";

// Day/time-of-day slot (overrides the rate card for a window)
export interface TimeSlot {
  id: number;
  day: Day;
  timeRange: [Dayjs, Dayjs] | null;
  perKmRate: number;
  perHourRate: number;
}
export type UserTimeSlots = Record<UserType, TimeSlot[]>;

// Per-type default rate card
export interface UiRateCard {
  perHourRate: number;
  perKmRate: number;
  freeKm: number;
  minimumFare: number;
}
export type RateCards = Record<UserType, UiRateCard>;

// Per-type duration slab ("from X hrs → ₹/hr")
export interface UiSlab {
  uid: number;
  fromHours: number;
  perHourRate: number;
}
export type TimeSlabs = Record<UserType, UiSlab[]>;

const dayOptions = [
  { label: "Monday", value: "monday" },
  { label: "Tuesday", value: "tuesday" },
  { label: "Wednesday", value: "wednesday" },
  { label: "Thursday", value: "thursday" },
  { label: "Friday", value: "friday" },
  { label: "Saturday", value: "saturday" },
  { label: "Sunday", value: "sunday" },
];

const userTypeDetails: Record<UserType, { tag: string; description: string; color: string }> = {
  "normal-driver": { tag: "Normal Driver", description: "Standard tier", color: "#5599FF" },
  "premium-driver": { tag: "Premium Driver", description: "Enhanced tier", color: "gold" },
  "elite-driver": { tag: "Elite Driver", description: "Luxury tier", color: "#5599FF" },
};

interface Props {
  rateCards: RateCards;
  setRateCards: (v: RateCards) => void;
  timeSlabs: TimeSlabs;
  setTimeSlabs: (v: TimeSlabs) => void;
  timeSlots: UserTimeSlots;
  setTimeSlots: (v: UserTimeSlots) => void;
  hotspotEnabled: boolean;
  hotspotId: string;
  multiplier: number;
}

const DriverTimeSlotsAndPricing = ({
  rateCards,
  setRateCards,
  timeSlabs,
  setTimeSlabs,
  timeSlots,
  setTimeSlots,
  hotspotEnabled,
  hotspotId,
  multiplier,
}: Props) => {
  const [userType, setUserType] = useState<UserType>("normal-driver");
  const dispatch = useAppDispatch();
  const { hotspots } = useAppSelector((s) => s.hotspot);

  useEffect(() => {
    dispatch(fetchHotspots({ limit: 100 }));
  }, [dispatch]);

  const selectedHotspot = hotspots.find((h) => h.id === hotspotId);
  const card = rateCards[userType];
  const slabs = timeSlabs[userType];
  const slots = timeSlots[userType];

  // ── Rate card ──────────────────────────────────────────────────────────
  const updateCard = (patch: Partial<UiRateCard>) =>
    setRateCards({ ...rateCards, [userType]: { ...card, ...patch } });

  // ── Duration slabs ─────────────────────────────────────────────────────
  const nextFromHours = () => {
    const max = slabs.reduce((m, s) => Math.max(m, s.fromHours), 0);
    return max > 0 ? max + 2 : 2;
  };
  const addSlab = () =>
    setTimeSlabs({
      ...timeSlabs,
      [userType]: [...slabs, { uid: Date.now(), fromHours: nextFromHours(), perHourRate: card.perHourRate }],
    });
  const updateSlab = (uid: number, patch: Partial<UiSlab>) =>
    setTimeSlabs({
      ...timeSlabs,
      [userType]: slabs.map((s) => (s.uid === uid ? { ...s, ...patch } : s)),
    });
  const removeSlab = (uid: number) =>
    setTimeSlabs({ ...timeSlabs, [userType]: slabs.filter((s) => s.uid !== uid) });

  const sortedSlabs = [...slabs].sort((a, b) => a.fromHours - b.fromHours);

  // ── Day/time slots ─────────────────────────────────────────────────────
  const addSlot = () => {
    const newId = slots.length > 0 ? Math.max(...slots.map((s) => s.id)) + 1 : 1;
    setTimeSlots({
      ...timeSlots,
      [userType]: [
        ...slots,
        {
          id: newId,
          day: "monday" as Day,
          timeRange: [dayjs("7:00 AM", "h:mm A"), dayjs("9:00 AM", "h:mm A")] as [Dayjs, Dayjs],
          perKmRate: card.perKmRate,
          perHourRate: card.perHourRate,
        },
      ],
    });
  };
  const updateSlot = (index: number, patch: Partial<TimeSlot>) => {
    const next = { ...timeSlots };
    next[userType][index] = { ...next[userType][index], ...patch };
    setTimeSlots(next);
  };
  const removeSlot = (id: number) =>
    setTimeSlots({ ...timeSlots, [userType]: slots.filter((s) => s.id !== id) });

  return (
    <Card size="small">
      <div className="w-full max-w-3xl flex flex-col gap-4">
        <div className="flex items-center gap-1">
          <BsClock className="text-[20px] text-[#0080FF]" />
          <span className="text-[19px] font-semibold">Driver Rates (time-first)</span>
        </div>

        {/* Driver type selector */}
        <Segmented<UserType>
          block
          size="large"
          value={userType}
          onChange={(v) => setUserType(v as UserType)}
          options={[
            {
              value: "normal-driver",
              label: (
                <span className="flex items-center justify-center gap-1">
                  <FiUsers /> Normal
                </span>
              ),
            },
            {
              value: "premium-driver",
              label: (
                <span className="flex items-center justify-center gap-1">
                  <FaRegStar className="text-yellow-400" /> Premium
                </span>
              ),
            },
            {
              value: "elite-driver",
              label: (
                <span className="flex items-center justify-center gap-1">
                  <FaRegStar className="text-blue-400" /> Elite
                </span>
              ),
            },
          ]}
        />

        <Tag color={userTypeDetails[userType].color} className="w-fit">
          {userTypeDetails[userType].tag} — {userTypeDetails[userType].description}
        </Tag>

        {/* Rate card — default when no day/time slot matches */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Default Rate Card</span>
          <span className="text-xs text-gray-500">
            Used when no day/time slot matches. ₹/hr is the primary rate; leave ₹/km = 0 for pure
            time-based pricing.
          </span>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col gap-1 w-44">
              <span className="text-xs font-medium">Price / Hour</span>
              <InputNumber
                min={0}
                precision={2}
                value={card.perHourRate}
                onChange={(v) => updateCard({ perHourRate: v || 0 })}
                prefix="₹"
                addonAfter="/hr"
                className="w-full"
                rootClassName="w-full"
              />
            </div>
            <div className="flex flex-col gap-1 w-44">
              <span className="text-xs font-medium">Price / KM (optional)</span>
              <InputNumber
                min={0}
                precision={2}
                value={card.perKmRate}
                onChange={(v) => updateCard({ perKmRate: v || 0 })}
                prefix="₹"
                addonAfter="/km"
                className="w-full"
                rootClassName="w-full"
              />
            </div>
            <div className="flex flex-col gap-1 w-44">
              <span className="text-xs font-medium">Free Distance</span>
              <InputNumber
                min={0}
                precision={2}
                value={card.freeKm}
                onChange={(v) => updateCard({ freeKm: v || 0 })}
                addonAfter="km"
                className="w-full"
                rootClassName="w-full"
              />
            </div>
            <div className="flex flex-col gap-1 w-44">
              <span className="text-xs font-medium">Minimum Fare</span>
              <InputNumber
                min={0}
                precision={2}
                value={card.minimumFare}
                onChange={(v) => updateCard({ minimumFare: v || 0 })}
                prefix="₹"
                className="w-full"
              />
            </div>
          </div>
        </div>

        <Divider className="my-1" />

        {/* Duration slabs */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Duration Slabs (₹/hr by trip length)</span>
            <Button size="small" icon={<PlusOutlined />} onClick={addSlab}>
              Add Slab
            </Button>
          </div>
          <div className="flex items-center gap-2 p-2 bg-[#EEF5FF] rounded-md">
            <span className="text-xs text-gray-600 min-w-[120px]">From 0 hrs (base)</span>
            <InputNumber value={card.perHourRate} disabled prefix="₹" addonAfter="/hr" size="small" className="w-full" />
          </div>
          {sortedSlabs.map((s) => (
            <div key={s.uid} className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 p-2 bg-[#F8F9FA] rounded-md">
                <span className="text-xs text-gray-500">From</span>
                <InputNumber
                  min={0.5}
                  step={0.5}
                  precision={2}
                  value={s.fromHours}
                  onChange={(v) => updateSlab(s.uid, { fromHours: v || 0 })}
                  addonAfter="hrs"
                  size="small"
                  className="w-full"
                />
                <span className="text-xs text-gray-500">→</span>
                <InputNumber
                  min={0}
                  precision={2}
                  value={s.perHourRate}
                  onChange={(v) => updateSlab(s.uid, { perHourRate: v ?? 0 })}
                  prefix="₹"
                  addonAfter="/hr"
                  size="small"
                  className="w-full"
                />
              </div>
              <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => removeSlab(s.uid)} />
            </div>
          ))}
        </div>

        <Divider className="my-1" />

        {/* Day/time slots */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Day / Time Slots (override)</span>
            <Button size="small" icon={<PlusOutlined />} onClick={addSlot}>
              Add Slot
            </Button>
          </div>
          <span className="text-xs text-gray-500">
            Flat ₹/hr + ₹/km for a specific day &amp; time window (overrides the rate card &amp; slabs).
          </span>
          <div className="max-h-[26vh] overflow-y-auto flex flex-col gap-2 pr-1">
            {slots.map((slot, index) => (
              <div key={slot.id} className="p-2 bg-[#F8F9FA] rounded-md flex flex-wrap items-center gap-2">
                <span className="font-medium text-xs">#{index + 1}</span>
                <Select
                  value={slot.day}
                  options={dayOptions}
                  size="small"
                  className="w-28"
                  onChange={(day) => updateSlot(index, { day })}
                />
                <TimePicker.RangePicker
                  value={slot.timeRange}
                  format="h:mm A"
                  use12Hours
                  size="small"
                  className="w-44"
                  onChange={(r) => updateSlot(index, { timeRange: r as [Dayjs, Dayjs] | null })}
                />
                <Input
                  style={{ width: 90 }}
                  size="small"
                  type="number"
                  prefix="₹"
                  suffix="/hr"
                  value={slot.perHourRate}
                  onChange={(e) => updateSlot(index, { perHourRate: Number(e.target.value) })}
                />
                <Input
                  style={{ width: 90 }}
                  size="small"
                  type="number"
                  prefix="₹"
                  suffix="/km"
                  value={slot.perKmRate}
                  onChange={(e) => updateSlot(index, { perKmRate: Number(e.target.value) })}
                />
                <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => removeSlot(slot.id)} />
              </div>
            ))}
          </div>
        </div>

        {hotspotEnabled && selectedHotspot && (
          <div className="w-full p-3 flex flex-col gap-1 bg-[#F8F9FA] rounded-md">
            <div className="flex gap-2 items-center">
              <Tag color="processing">
                <span className="flex gap-1 items-center">
                  <LuZap />
                  {selectedHotspot.hotspot_name}
                </span>
              </Tag>
              <span className="text-sm">Active hotspot</span>
            </div>
            <span className="text-sm">
              Surge ×{multiplier} on fare · +₹{Number(selectedHotspot.fare).toFixed(2)} flat / ride
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DriverTimeSlotsAndPricing;
