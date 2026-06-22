import { useEffect } from "react";
import { Card, Typography, Tag, Divider, Table } from "antd";
import { MdOutlineLocationOn } from "react-icons/md";
import { BsClock } from "react-icons/bs";
import { ThunderboltOutlined, NodeIndexOutlined } from "@ant-design/icons";
import type { UserTimeSlots, UserType, TimeSlot } from "./DriverTimeSlotsAndPricing";
import type { UiCheckpoint } from "./ExtraKmConfiguration";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchHotspots } from "../../store/slices/hotspotSlice";
import { computeTaxBreakdown } from "../../hooks/useTaxedPricing";
import TaxBreakdownDisplay from "./TaxbreakdownDisplay";

interface PricingPreviewProps {
  country: string;
  state: string;
  district: string;
  area: string;
  pincode: string;
  timeSlots: UserTimeSlots;
  hotspotEnabled: boolean;
  hotspotId: string;
  multiplier: number;
  perKmPrice: number;
  perHourPrice: number;
  minimumFare: number;
  oneWayReturnPct: number;
  extraKmCheckpoints: UiCheckpoint[];
}

const PricingPreview = ({
  country,
  state,
  district,
  area,
  pincode,
  timeSlots,
  hotspotEnabled,
  hotspotId,
  multiplier,
  perKmPrice,
  perHourPrice,
  minimumFare,
  oneWayReturnPct,
  extraKmCheckpoints,
}: PricingPreviewProps) => {
  const dispatch = useAppDispatch();
  const { hotspots } = useAppSelector((s) => s.hotspot);
  const { countries, states } = useAppSelector((s) => s.location);

  // We need the full taxes array for the pure computeTaxBreakdown function
  const taxes = useAppSelector((s) => s.tax.taxes);

  useEffect(() => {
    dispatch(fetchHotspots({ limit: 100 }));
  }, [dispatch]);

  const selectedHotspot = hotspots.find((h) => h.id === hotspotId);
  const hotspotFare = selectedHotspot ? Number(selectedHotspot.fare) : 0;

  const countryLabel = countries.find((c) => c.id === country)?.name || country;
  const stateLabel = states.find((s) => s.id === state)?.name || state;

  const userTypeTags = {
    "normal-driver": <Tag color="default">Normal Driver</Tag>,
    "premium-driver": <Tag color="gold">Premium Driver</Tag>,
    "elite-driver": <Tag color="blue">Elite Driver</Tag>,
  };

  // Indicative tax on a slot's per-km rate (after surge)
  const getRateBreakdown = (slot: TimeSlot) => {
    const rateAfterSurge = hotspotEnabled ? slot.perKmRate * multiplier : slot.perKmRate;
    return computeTaxBreakdown(rateAfterSurge, taxes);
  };

  // Extra-KM distance bands: 0-km row = zone Price per KM, then each breakpoint
  const sortedCheckpoints = [...extraKmCheckpoints].sort((a, b) => a.from_km - b.from_km);
  const firstBreak = sortedCheckpoints.length > 0 ? sortedCheckpoints[0].from_km : null;
  const bandRows = [
    {
      key: "base",
      kmRange: firstBreak !== null ? `0–${firstBreak} km` : `0 km and beyond`,
      rate: `₹${Number(perKmPrice).toFixed(2)} / km`,
    },
    ...sortedCheckpoints.map((c, i) => {
      const next = sortedCheckpoints[i + 1];
      return {
        key: c.uid,
        kmRange: next ? `${c.from_km}–${next.from_km} km` : `${c.from_km} km and beyond`,
        rate: `₹${Number(c.price).toFixed(2)} / km`,
      };
    }),
  ];

  return (
    <Card size="small" className="w-full">
      <div className="w-full flex flex-col gap-4">
        <Typography.Title level={5} className="text-lg sm:text-xl">
          Pricing Preview
        </Typography.Title>

        {/* Location row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-2 sm:flex-1">
            <div className="flex items-center gap-2">
              <MdOutlineLocationOn className="text-[20px] text-[#0080FF]" />
              <span className="font-semibold">Location</span>
            </div>
            <div className="p-2 bg-[#F8F9FA] rounded-md">
              <span className="text-sm break-all">
                {[countryLabel, stateLabel, district, area, pincode]
                  .filter((x) => x && x.trim() !== "" && x.trim() !== "N/A")
                  .join(" - ")}
              </span>
            </div>
          </div>
        </div>

        {/* Zone rate summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2 bg-[#F8F9FA] rounded-md flex flex-col">
            <span className="text-[11px] text-gray-500 uppercase">Price / KM</span>
            <span className="font-semibold text-green-700">₹{Number(perKmPrice).toFixed(2)}</span>
          </div>
          <div className="p-2 bg-[#F8F9FA] rounded-md flex flex-col">
            <span className="text-[11px] text-gray-500 uppercase">Price / Hour</span>
            <span className="font-semibold text-green-700">₹{Number(perHourPrice).toFixed(2)}</span>
          </div>
          <div className="p-2 bg-[#F8F9FA] rounded-md flex flex-col">
            <span className="text-[11px] text-gray-500 uppercase">Minimum Fare</span>
            <span className="font-semibold text-green-700">₹{Number(minimumFare).toFixed(2)}</span>
          </div>
          <div className="p-2 bg-[#F8F9FA] rounded-md flex flex-col">
            <span className="text-[11px] text-gray-500 uppercase">One-way Return</span>
            <span className="font-semibold text-green-700">
              {Number(oneWayReturnPct).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Formula reminder */}
        <div className="p-2 bg-[#EEF5FF] rounded-md text-xs text-gray-600">
          fare = (distance × ₹/km) + (hours × ₹/hr) + one-way return → × surge + flat hotspot fare,
          floored at minimum fare, then taxes.
        </div>

        {/* Slots grid */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <BsClock className="text-[18px] text-[#0080FF]" />
            <span className="font-semibold">Time Slot Rates</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(timeSlots).map(([userType, slots]) => (
              <div key={userType} className="flex flex-col gap-2">
                <div className="font-semibold text-center">
                  {userTypeTags[userType as UserType]}
                </div>
                {slots.map((slot: TimeSlot) => {
                  const rateAfterSurge = hotspotEnabled
                    ? slot.perKmRate * multiplier
                    : slot.perKmRate;
                  const breakdown = getRateBreakdown(slot);

                  return (
                    <div key={slot.id} className="p-2 bg-[#F8F9FA] rounded-md flex flex-col gap-1">
                      <span className="capitalize font-medium">{slot.day}</span>
                      <span className="text-[12px] text-gray-600">
                        {slot.timeRange
                          ? `${slot.timeRange[0].format("h:mm A")} - ${slot.timeRange[1].format("h:mm A")}`
                          : "No time set"}
                      </span>
                      <span className="text-[12px] text-gray-600">
                        Rate: ₹{slot.perKmRate}/km &middot; ₹{slot.perHourRate}/hr
                      </span>
                      {hotspotEnabled && selectedHotspot && (
                        <span className="text-[12px] text-blue-600">
                          After surge ×{multiplier}: ₹{rateAfterSurge.toFixed(2)}/km
                        </span>
                      )}
                      {/* Indicative per-km tax breakdown */}
                      <Divider style={{ margin: "4px 0" }} />
                      <span className="text-[11px] text-gray-400">indicative tax / km</span>
                      <TaxBreakdownDisplay breakdown={breakdown} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Hotspot section */}
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

        {/* Extra KM section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <NodeIndexOutlined className="text-[18px] text-[#0080FF]" />
            <span className="font-semibold">Distance Rate Bands</span>
          </div>
          <div className="p-2 bg-[#F8F9FA] rounded-md flex flex-col gap-2">
            <Table
              size="small"
              pagination={false}
              rowKey="key"
              dataSource={bandRows}
              columns={[
                { title: "KM Range", dataIndex: "kmRange", key: "kmRange" },
                {
                  title: "Rate",
                  dataIndex: "rate",
                  key: "rate",
                  render: (v: string) => <span className="text-green-600 font-semibold">{v}</span>,
                },
              ]}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PricingPreview;
