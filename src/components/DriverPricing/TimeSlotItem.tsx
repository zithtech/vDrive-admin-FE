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
  globalPrice: number;
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
  globalPrice,
  hasCollision,
  hotspotEnabled,
  hotspotFare,
  multiplier,
}: TimeSlotItemProps) => {
  // Price after hotspot applied
  const priceAfterHotspot = hotspotEnabled ? slot.price * multiplier + hotspotFare : slot.price;

  // All applicable taxes computed from Redux store
  const breakdown = useTaxBreakdown(priceAfterHotspot);

  return (
    <div
      className={`w-full p-3 sm:p-4 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4
        items-start sm:items-center rounded-md
        ${
          hasCollision
            ? "bg-red-50 border-2 border-red-300"
            : "bg-[#F8F9FA] border-2 border-transparent"
        }`}
    >
      {/* Slot label */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <span className="font-medium">Slot {index + 1}</span>
        {hasCollision && (
          <Tag color="error" className="text-xs">
            Time Collision!
          </Tag>
        )}
      </div>

      {/* Controls row */}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:flex-1">
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium min-w-fit">Day:</span>
          <Select
            value={slot.day}
            options={dayOptions}
            className="w-full sm:w-32"
            onChange={(day) => updateTimeSlot(index, { day })}
            status={hasCollision ? "error" : undefined}
          />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-sm font-medium min-w-fit">Time:</span>
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
          <span className="text-sm font-medium min-w-fit">Price:</span>
          <Input
            style={{ width: 110 }}
            value={slot.price}
            onChange={(e) => updateTimeSlot(index, { price: Number(e.target.value) })}
            type="number"
            prefix="₹"
          />
        </div>
      </div>

      {/* Price summary */}
      <div className="flex items-start justify-between w-full sm:w-auto gap-2">
        <div className="flex flex-col gap-1">
          {/* Base vs global % diff */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-green-600 text-sm">₹{slot.price || "0"}</span>
            <Badge
              status="success"
              count={`${
                globalPrice > 0 ? Math.round(((slot.price - globalPrice) / globalPrice) * 100) : 0
              }%`}
              overflowCount={1000}
              style={{ backgroundColor: "#52c41a" }}
            />
          </div>

          {/* Hotspot line */}
          {hotspotEnabled && hotspotFare > 0 && (
            <span className="text-xs text-blue-600">
              After hotspot: ₹{priceAfterHotspot.toFixed(2)}
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
