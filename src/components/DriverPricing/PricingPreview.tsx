import { useEffect } from "react";
import { Card, Typography, Tag, Divider } from "antd";
import { MdOutlineLocationOn } from "react-icons/md";
import { ThunderboltOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import type {
  UserType,
  RateCards,
  TimeSlabs,
  UserTimeSlots,
} from "./DriverTimeSlotsAndPricing";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchHotspots } from "../../store/slices/hotspotSlice";

interface PricingPreviewProps {
  country: string;
  state: string;
  district: string;
  area: string;
  pincode: string;
  oneWayReturnPct: number;
  nightChargePct: number;
  nightStart: Dayjs;
  nightEnd: Dayjs;
  outstationAllowancePerDay: number;
  hotspotEnabled: boolean;
  hotspotId: string;
  multiplier: number;
  rateCards: RateCards;
  timeSlabs: TimeSlabs;
  timeSlots: UserTimeSlots;
}

const TYPES: { key: UserType; label: string; color: string }[] = [
  { key: "normal-driver", label: "Normal", color: "default" },
  { key: "premium-driver", label: "Premium", color: "gold" },
  { key: "elite-driver", label: "Elite", color: "blue" },
];

const PricingPreview = ({
  country,
  state,
  district,
  area,
  pincode,
  oneWayReturnPct,
  nightChargePct,
  nightStart,
  nightEnd,
  outstationAllowancePerDay,
  hotspotEnabled,
  hotspotId,
  multiplier,
  rateCards,
  timeSlabs,
  timeSlots,
}: PricingPreviewProps) => {
  const dispatch = useAppDispatch();
  const { hotspots } = useAppSelector((s) => s.hotspot);
  const { countries, states } = useAppSelector((s) => s.location);

  useEffect(() => {
    dispatch(fetchHotspots({ limit: 100 }));
  }, [dispatch]);

  const selectedHotspot = hotspots.find((h) => h.id === hotspotId);
  const hotspotFare = selectedHotspot ? Number(selectedHotspot.fare) : 0;
  const countryLabel = countries.find((c) => c.id === country)?.name || country;
  const stateLabel = states.find((s) => s.id === state)?.name || state;

  return (
    <Card size="small" className="w-full">
      <div className="w-full flex flex-col gap-4">
        <Typography.Title level={5}>Pricing Preview</Typography.Title>

        {/* Location */}
        <div className="flex items-center gap-2">
          <MdOutlineLocationOn className="text-[20px] text-[#0080FF]" />
          <span className="font-semibold">Location</span>
        </div>
        <div className="p-2 bg-[#F8F9FA] rounded-md text-sm break-all">
          {[countryLabel, stateLabel, district, area, pincode]
            .filter((x) => x && x.trim() !== "" && x.trim() !== "N/A")
            .join(" - ") || "—"}
        </div>

        {/* Zone-wide */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2 bg-[#F8F9FA] rounded-md flex flex-col">
            <span className="text-[11px] text-gray-500 uppercase">One-way Return</span>
            <span className="font-semibold text-green-700">{Number(oneWayReturnPct).toFixed(0)}%</span>
          </div>
          <div className="p-2 bg-[#F8F9FA] rounded-md flex flex-col">
            <span className="text-[11px] text-gray-500 uppercase">Night Charge</span>
            <span className="font-semibold text-green-700">{Number(nightChargePct).toFixed(0)}%</span>
          </div>
          <div className="p-2 bg-[#F8F9FA] rounded-md flex flex-col">
            <span className="text-[11px] text-gray-500 uppercase">Night Window</span>
            <span className="font-semibold text-gray-700 text-xs">
              {nightStart.format("h:mm A")}–{nightEnd.format("h:mm A")}
            </span>
          </div>
          <div className="p-2 bg-[#F8F9FA] rounded-md flex flex-col">
            <span className="text-[11px] text-gray-500 uppercase">Outstation / day</span>
            <span className="font-semibold text-green-700">
              ₹{Number(outstationAllowancePerDay).toFixed(0)}
            </span>
          </div>
        </div>

        <div className="p-2 bg-[#EEF5FF] rounded-md text-xs text-gray-600">
          fare = hours×₹/hr (duration slabs) + max(0, km−free)×₹/km + one-way return → × surge + flat
          hotspot + night %, floored at minimum, then taxes.
        </div>

        {/* Per driver type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TYPES.map(({ key, label, color }) => {
            const card = rateCards[key];
            const slabs = [...timeSlabs[key]].sort((a, b) => a.fromHours - b.fromHours);
            const slots = timeSlots[key];
            return (
              <div key={key} className="flex flex-col gap-2 p-2 bg-[#F8F9FA] rounded-md">
                <Tag color={color} className="w-fit">
                  {label}
                </Tag>
                <div className="text-[13px] flex flex-col gap-0.5">
                  <span>
                    Base: <strong>₹{card.perHourRate}/hr</strong>
                  </span>
                  <span>
                    Distance: <strong>₹{card.perKmRate}/km</strong> (free {card.freeKm} km)
                  </span>
                  <span>
                    Minimum: <strong>₹{card.minimumFare}</strong>
                  </span>
                </div>

                <Divider className="my-1" />
                <span className="text-[11px] text-gray-500 uppercase">Duration slabs</span>
                <div className="text-[12px] flex flex-col gap-0.5">
                  <span>
                    0{slabs.length ? `–${slabs[0].fromHours}` : "+"} hr → ₹{card.perHourRate}/hr
                  </span>
                  {slabs.map((s, i) => {
                    const next = slabs[i + 1];
                    return (
                      <span key={s.uid}>
                        {s.fromHours}
                        {next ? `–${next.fromHours}` : "+"} hr → ₹{s.perHourRate}/hr
                      </span>
                    );
                  })}
                </div>

                <Divider className="my-1" />
                <span className="text-[11px] text-gray-500 uppercase">
                  Day/Time slots ({slots.length})
                </span>
                <div className="text-[12px] flex flex-col gap-0.5">
                  {slots.length === 0 && <span className="text-gray-400">none</span>}
                  {slots.map((s) => (
                    <span key={s.id}>
                      <span className="capitalize">{s.day}</span>{" "}
                      {s.timeRange
                        ? `${s.timeRange[0].format("h:mm A")}-${s.timeRange[1].format("h:mm A")}`
                        : ""}{" "}
                      → ₹{s.perHourRate}/hr, ₹{s.perKmRate}/km
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hotspot */}
        {hotspotEnabled && selectedHotspot && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <ThunderboltOutlined className="text-[18px] text-[#0080FF]" />
              <span className="font-semibold">Hotspot Effect</span>
            </div>
            <div className="p-2 bg-[#F8F9FA] rounded-md flex flex-col gap-1">
              <Tag color="blue">{selectedHotspot.hotspot_name}</Tag>
              <div className="text-sm">Surge: ×{multiplier} on fare</div>
              <div className="text-sm">Flat fare: +₹{hotspotFare.toFixed(2)} per ride</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PricingPreview;
