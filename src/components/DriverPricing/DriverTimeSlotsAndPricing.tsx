import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Badge, Button, Card, Input, Segmented, Select, Tag, TimePicker, Tooltip } from "antd";
import { useState, useEffect } from "react";
import { BsClock } from "react-icons/bs";
import { FaRegStar } from "react-icons/fa";
import { FiUsers } from "react-icons/fi";
import dayjs, { type Dayjs } from "dayjs";
import { LuZap } from "react-icons/lu";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchHotspots } from "../../store/slices/hotspotSlice";
import { useTaxBreakdown } from "../../hooks/useTaxedPricing";

export type Day =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface TimeSlot {
  id: number;
  day: Day;
  timeRange: [Dayjs, Dayjs] | null;
  perKmRate: number;
  perHourRate: number;
}

export type UserType = "normal-driver" | "premium-driver" | "elite-driver";

export interface UserTimeSlots {
  "normal-driver": TimeSlot[];
  "premium-driver": TimeSlot[];
  "elite-driver": TimeSlot[];
}

const dayOptions = [
  { label: "Monday", value: "monday" },
  { label: "Tuesday", value: "tuesday" },
  { label: "Wednesday", value: "wednesday" },
  { label: "Thursday", value: "thursday" },
  { label: "Friday", value: "friday" },
  { label: "Saturday", value: "saturday" },
  { label: "Sunday", value: "sunday" },
];

const TimeSlotItem = ({
  slot,
  index,
  updateTimeSlot,
  removeTimeSlot,
  perKmPrice,
  hasCollision,
  hotspotEnabled,
  hotspotFare,
  multiplier,
}: {
  slot: TimeSlot;
  index: number;
  updateTimeSlot: (index: number, updatedSlot: Partial<TimeSlot>) => void;
  removeTimeSlot: (id: number) => void;
  perKmPrice: number;
  hasCollision: boolean;
  hotspotEnabled: boolean;
  hotspotFare: number;
  multiplier: number;
}) => {
  // Per-km rate after surge multiplier (the flat hotspot fare is a separate per-ride charge)
  const rateAfterSurge = hotspotEnabled ? slot.perKmRate * multiplier : slot.perKmRate;

  // Indicative tax computed on the ₹/km rate (a rate is not a ride total)
  const breakdown = useTaxBreakdown(rateAfterSurge);
  const { hasTax, totalTaxAmount, totalPrice, appliedTaxes } = breakdown;

  return (
    <div
      className={`w-full p-3 sm:p-4 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 items-start sm:items-center justify-start sm:justify-center rounded-md ${
        hasCollision
          ? "bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-500/50"
          : "bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent dark:border-slate-700/50"
      }`}
    >
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <span className="font-medium text-slate-800 dark:text-slate-200">Slot {index + 1}</span>
        {hasCollision && (
          <Tag color="error" className="text-xs">
            Time Collision!
          </Tag>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:flex-1 flex-wrap">
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <span className="text-sm font-medium min-w-fit text-slate-700 dark:text-slate-300">Day:</span>
          <Select
            value={slot.day}
            options={dayOptions}
            className="w-full sm:w-32"
            onChange={(day) => updateTimeSlot(index, { day })}
            status={hasCollision ? "error" : undefined}
          />
        </div>

        <div className="flex gap-2 items-center w-full sm:w-auto">
          <span className="text-sm font-medium min-w-fit text-slate-700 dark:text-slate-300">Time:</span>
          <TimePicker.RangePicker
            value={slot.timeRange}
            format="h:mm A"
            onChange={(timeRange) =>
              updateTimeSlot(index, {
                timeRange: timeRange as [Dayjs, Dayjs] | null,
              })
            }
            className="w-full sm:w-48"
            use12Hours
            status={hasCollision ? "error" : undefined}
          />
        </div>

        <div className="flex gap-2 items-center w-full sm:w-auto">
          <span className="text-sm font-medium min-w-fit text-slate-700 dark:text-slate-300">₹/km:</span>
          <Input
            style={{ width: 100 }}
            value={slot.perKmRate}
            onChange={(e) => updateTimeSlot(index, { perKmRate: Number(e.target.value) })}
            type="number"
            prefix="₹"
            suffix="/km"
          />
        </div>

        <div className="flex gap-2 items-center w-full sm:w-auto">
          <span className="text-sm font-medium min-w-fit text-slate-700 dark:text-slate-300">₹/hr:</span>
          <Input
            style={{ width: 100 }}
            value={slot.perHourRate}
            onChange={(e) => updateTimeSlot(index, { perHourRate: Number(e.target.value) })}
            type="number"
            prefix="₹"
            suffix="/hr"
          />
        </div>
      </div>

      <div className="flex items-baseline justify-between w-full sm:w-auto gap-2">
        <div className="flex flex-col gap-1">
          {/* Rate vs zone ₹/km */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">
              ₹{slot.perKmRate || "0"}/km
            </span>
            <Badge
              status="success"
              count={`${
                perKmPrice > 0
                  ? Math.round(((slot.perKmRate - perKmPrice) / perKmPrice) * 100)
                  : 0
              }%`}
              overflowCount={1000}
              style={{ backgroundColor: "#52c41a" }}
            />
          </div>

          {/* Hotspot effect */}
          {hotspotEnabled && (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              After surge ×{multiplier}: ₹{rateAfterSurge.toFixed(2)}/km
              {hotspotFare > 0 && <> &middot; +₹{hotspotFare.toFixed(2)} flat/ride</>}
            </span>
          )}

          {/* Indicative tax breakdown on the rate */}
          {hasTax && (
            <Tooltip
              title={
                <div style={{ fontSize: 12 }}>
                  {appliedTaxes.map((t) => (
                    <div key={t.taxCode}>
                      {t.taxCode} ({t.taxPercentage}%): +₹{t.taxAmount.toFixed(2)}
                    </div>
                  ))}
                  <div
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.3)",
                      marginTop: 4,
                      paddingTop: 4,
                    }}
                  >
                    Total tax: +₹{totalTaxAmount.toFixed(2)} / km
                  </div>
                </div>
              }
            >
              <div className="flex items-center gap-1 cursor-help flex-wrap">
                {appliedTaxes.map((t) => (
                  <Tag
                    key={t.taxCode}
                    color="orange"
                    style={{ fontSize: 11, margin: 0, fontFamily: "monospace" }}
                  >
                    {t.taxCode}
                  </Tag>
                ))}
                <span className="text-orange-500 font-semibold text-sm">
                  +₹{totalTaxAmount.toFixed(2)}/km
                </span>
              </div>
            </Tooltip>
          )}

          {/* Indicative per-km incl. tax */}
          <span className="text-emerald-700 dark:text-emerald-500 font-bold text-sm">
            ≈ ₹{totalPrice.toFixed(2)}/km incl. tax
          </span>
        </div>

        <Button
          icon={<DeleteOutlined />}
          onClick={() => removeTimeSlot(slot.id)}
          danger
          size="small"
        />
      </div>
    </div>
  );
};

interface DriverTimeSlotsAndPricingProps {
  timeSlots: UserTimeSlots;
  setTimeSlots: (timeSlots: UserTimeSlots) => void;
  hotspotEnabled: boolean;
  hotspotId: string;
  multiplier: number;
  perKmPrice: number;
}

const DriverTimeSlotsAndPricing = ({
  timeSlots,
  setTimeSlots,
  hotspotEnabled,
  hotspotId,
  multiplier,
  perKmPrice,
}: DriverTimeSlotsAndPricingProps) => {
  const [userType, setUserType] = useState<UserType>("normal-driver");

  const dispatch = useAppDispatch();
  const { hotspots } = useAppSelector((state) => state.hotspot);
  const activeTaxes = useAppSelector((state) => state.tax.taxes).filter((t) => t.is_active);
  const hasTax = activeTaxes.length > 0;

  useEffect(() => {
    dispatch(fetchHotspots({ limit: 100 }));
  }, [dispatch]);

  const selectedHotspot = hotspots.find((h) => h.id === hotspotId);
  const hotspotFare = selectedHotspot ? Number(selectedHotspot.fare) : 0;

  const hasTimeCollision = (
    day: Day,
    timeRange: [Dayjs, Dayjs] | null,
    excludeIndex?: number,
  ): boolean => {
    if (!timeRange) return false;
    const [startTime, endTime] = timeRange;
    const currentSlots = timeSlots[userType];
    return currentSlots.some((slot, index) => {
      if (index === excludeIndex) return false;
      if (slot.day !== day) return false;
      if (!slot.timeRange) return false;
      const [slotStart, slotEnd] = slot.timeRange;
      return (
        ((startTime.isAfter(slotStart) || startTime.isSame(slotStart)) &&
          startTime.isBefore(slotEnd)) ||
        (endTime.isAfter(slotStart) && (endTime.isBefore(slotEnd) || endTime.isSame(slotEnd))) ||
        ((startTime.isBefore(slotStart) || startTime.isSame(slotStart)) &&
          (endTime.isAfter(slotEnd) || endTime.isSame(slotEnd)))
      );
    });
  };

  const userTypeDetails = {
    "normal-driver": {
      tag: "Normal Driver",
      description: "Standard ride pricing",
      icon: <FiUsers />,
      color: "#5599FF",
      badge: "+5%",
    },
    "premium-driver": {
      tag: "Premium Driver",
      description: "Enhanced service features",
      icon: <FaRegStar className="text-yellow-400" />,
      color: "gold",
      badge: "+10%",
    },
    "elite-driver": {
      tag: "Elite Driver",
      description: "Luxury ride experience",
      icon: <FaRegStar className="text-blue-400" />,
      color: "#5599FF",
      badge: "+8%",
    },
  };

  const addTimeSlot = () => {
    const currentUserTimeSlots = timeSlots[userType];
    const newTimeSlot: TimeSlot = {
      id:
        currentUserTimeSlots.length > 0
          ? Math.max(...currentUserTimeSlots.map((t) => t.id)) + 1
          : 1,
      day: "monday" as Day,
      timeRange: [dayjs("7:00 AM", "h:mm A"), dayjs("9:00 AM", "h:mm A")] as [Dayjs, Dayjs],
      perKmRate: perKmPrice || 12,
      perHourRate: 150,
    };
    setTimeSlots({
      ...timeSlots,
      [userType]: [...currentUserTimeSlots, newTimeSlot],
    });
  };

  const updateTimeSlot = (index: number, updatedSlot: Partial<TimeSlot>) => {
    const newTimeSlots = { ...timeSlots };
    newTimeSlots[userType][index] = {
      ...newTimeSlots[userType][index],
      ...updatedSlot,
    };
    setTimeSlots(newTimeSlots);
  };

  const removeTimeSlot = (id: number) => {
    setTimeSlots({
      ...timeSlots,
      [userType]: timeSlots[userType].filter((slot) => slot.id !== id),
    });
  };

  return (
    <Card size="small" className="w-full bg-white dark:!bg-[#0f172a] border border-slate-200 dark:!border-slate-800">
      <div className="w-full flex flex-col gap-3">
        <div className="flex items-center justify-between w-full">
          <div className="w-full flex items-center gap-1">
            <BsClock className="text-[20px] text-blue-500 dark:text-blue-400" />
            <span className="text-[19px] font-semibold p-0 m-0 text-slate-800 dark:text-slate-100">
              Driver Time Slots &amp; Pricing (₹/km &amp; ₹/hr)
            </span>
          </div>
        </div>

        {/* Active taxes banner */}
        {hasTax && (
          <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-md flex-wrap">
            {activeTaxes.map((t) => (
              <Tag
                key={t.tax_code}
                color="orange"
                style={{ fontFamily: "monospace", fontWeight: 700, margin: 0 }}
              >
                {t.tax_code} {t.percentage}%
              </Tag>
            ))}
            <span className="text-sm text-orange-700">
              applicable taxes will be added to the final fare
            </span>
          </div>
        )}

        <div className="w-full px-4">
          <Segmented<string>
            options={[
              {
                className: "w-full",
                label: (
                  <div className="flex gap-1 items-center justify-center flex-wrap py-1 sm:py-0">
                    <FiUsers />
                    <span>Normal Driver</span>
                  </div>
                ),
                value: "normal-driver",
              },
              {
                className: "w-full",
                label: (
                  <div className="flex gap-1 items-center justify-center flex-wrap py-1 sm:py-0">
                    <FaRegStar className="text-yellow-400" />
                    <span>Premium Driver</span>
                  </div>
                ),
                value: "premium-driver",
              },
              {
                className: "w-full",
                label: (
                  <div className="flex gap-1 items-center justify-center flex-wrap py-1 sm:py-0">
                    <FaRegStar className="text-yellow-400" />
                    <span>Elite Driver</span>
                  </div>
                ),
                value: "elite-driver",
              },
            ]}
            size="large"
            value={userType}
            className="w-full"
            onChange={(value) => setUserType(value as UserType)}
          />
        </div>

        <div className="flex gap-1 justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            <Tag color={userTypeDetails[userType].color}>
              <div className="flex gap-1 items-center">
                {userTypeDetails[userType].icon}
                <span>{userTypeDetails[userType].tag}</span>
              </div>
            </Tag>
            <span className="text-slate-600 dark:text-slate-400">{userTypeDetails[userType].description}</span>
          </div>
          <Button icon={<PlusOutlined />} onClick={addTimeSlot}>
            Add Time Slot
          </Button>
        </div>

        <div className="max-h-[37vh] overflow-y-auto pr-1">
          <div className="flex flex-col gap-2">
            {timeSlots[userType].map((item, index) => {
              const hasCollision = hasTimeCollision(item.day, item.timeRange, index);
              return (
                <div key={index} className="py-0">
                  <TimeSlotItem
                    slot={item}
                    index={index}
                    updateTimeSlot={updateTimeSlot}
                    removeTimeSlot={removeTimeSlot}
                    perKmPrice={perKmPrice}
                    hasCollision={hasCollision}
                    hotspotEnabled={hotspotEnabled}
                    hotspotFare={hotspotFare}
                    multiplier={multiplier}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {hotspotEnabled && selectedHotspot && (
          <div className="w-full p-4 flex flex-col gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-md">
            <div className="flex gap-2 items-center">
              <Tag color="processing">
                <div className="flex gap-1 items-center">
                  <LuZap />
                  <span>{selectedHotspot.hotspot_name}</span>
                </div>
              </Tag>
              <span className="text-sm">Active Hotspot Configuration</span>
            </div>
            <span className="text-sm">
              Surge: ×{multiplier} on fare &middot; Flat fare: +₹
              {Number(selectedHotspot.fare).toFixed(2)} per ride
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DriverTimeSlotsAndPricing;
