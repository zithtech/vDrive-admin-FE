import { Badge, Button, Input, Select, Tag, TimePicker } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { type Dayjs } from "dayjs";
import { useTaxBreakdown } from "../../hooks/useTaxedPricing";
import type { TimeSlot } from "./DriverTimeSlotsAndPricing";
import TaxBreakdownDisplay from "./TaxbreakdownDisplay";

const dayOptions = [
  { label: "Monday", value: "monday" },
  { label: "Tuesday", value: "tuesday" },
  { label: "Wednesday", value: "wednesday" },
  { label: "Thursday", value: "thursday" },
  { label: "Friday", value: "friday" },
  { label: "Saturday", value: "saturday" },
  { label: "Sunday", value: "sunday" },
];

interface TimeSlotItemProps {
  slot: TimeSlot;
  index: number;
  updateTimeSlot: (index: number, updatedSlot: Partial<TimeSlot>) => void;
  removeTimeSlot: (id: number) => void;
  perKmPrice: number;
  hasCollision: boolean;
  hotspotEnabled: boolean;
  hotspotFare: number;
  multiplier: number;
}

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
}: TimeSlotItemProps) => {
  // Per-km rate after surge (flat hotspot fare is a separate per-ride charge)
  const rateAfterSurge = hotspotEnabled ? slot.perKmRate * multiplier : slot.perKmRate;

  // Indicative tax computed on the ₹/km rate
  const breakdown = useTaxBreakdown(rateAfterSurge);

  return (
    <div
      className={`w-full p-3 sm:p-4 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4
        items-start sm:items-center rounded-md
        ${
          hasCollision
            ? "bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-500/50"
            : "bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent dark:border-slate-700/50"
        }`}
    >
      {/* Slot label */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <span className="font-medium text-slate-800 dark:text-slate-200">Slot {index + 1}</span>
        {hasCollision && (
          <Tag color="error" className="text-xs">
            Time Collision!
          </Tag>
        )}
      </div>

      {/* Controls row */}
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:flex-1 flex-wrap">
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium min-w-fit text-slate-700 dark:text-slate-300">Day:</span>
          <Select
            value={slot.day}
            options={dayOptions}
            className="w-full sm:w-32"
            onChange={(day) => updateTimeSlot(index, { day })}
            status={hasCollision ? "error" : undefined}
          />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium min-w-fit text-slate-700 dark:text-slate-300">Time:</span>
          <TimePicker.RangePicker
            value={slot.timeRange}
            format="h:mm A"
            onChange={(timeRange) =>
              updateTimeSlot(index, { timeRange: timeRange as [Dayjs, Dayjs] | null })
            }
            className="w-full sm:w-48"
            use12Hours
            status={hasCollision ? "error" : undefined}
          />
        </div>
        <div className="flex gap-2 items-center">
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
        <div className="flex gap-2 items-center">
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

      {/* Rate summary */}
      <div className="flex items-start justify-between w-full sm:w-auto gap-2">
        <div className="flex flex-col gap-1">
          {/* Rate vs zone ₹/km */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">₹{slot.perKmRate || "0"}/km</span>
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

          {/* Hotspot line */}
          {hotspotEnabled && (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              After surge ×{multiplier}: ₹{rateAfterSurge.toFixed(2)}/km
              {hotspotFare > 0 && <> &middot; +₹{hotspotFare.toFixed(2)} flat/ride</>}
            </span>
          )}

          {/* Tax breakdown — compact tooltip version */}
          <TaxBreakdownDisplay breakdown={breakdown} compact />
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

export default TimeSlotItem;
