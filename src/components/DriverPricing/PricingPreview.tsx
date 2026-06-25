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
    <Card size="small" className="w-full bg-white dark:bg-transparent border-none">
      <div className="w-full flex flex-col gap-4">
        <Typography.Title level={5} className="text-lg sm:text-xl !text-slate-800 dark:!text-slate-100 m-0">
          Pricing Preview
        </Typography.Title>

        {/* Location row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-2 sm:flex-1">
            <div className="flex items-center gap-2">
              <MdOutlineLocationOn className="text-[20px] text-blue-500 dark:text-blue-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Location</span>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-100 dark:border-slate-700/50">
              <span className="text-sm break-all text-slate-700 dark:text-slate-300">
                {[countryLabel, stateLabel, district, area, pincode]
                  .filter((x) => x && x.trim() !== "" && x.trim() !== "N/A")
                  .join(" - ")}
              </span>
            </div>
          </div>
        </div>

        {/* Zone rate summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md flex flex-col border border-slate-100 dark:border-slate-700/50">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Price / KM</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{Number(perKmPrice).toFixed(2)}</span>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md flex flex-col border border-slate-100 dark:border-slate-700/50">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Price / Hour</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{Number(perHourPrice).toFixed(2)}</span>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md flex flex-col border border-slate-100 dark:border-slate-700/50">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Minimum Fare</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{Number(minimumFare).toFixed(2)}</span>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md flex flex-col border border-slate-100 dark:border-slate-700/50">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">One-way Return</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {Number(oneWayReturnPct).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Formula reminder */}
        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-md text-xs text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20">
          fare = (distance × ₹/km) + (hours × ₹/hr) + one-way return → × surge + flat hotspot fare,
          floored at minimum fare, then taxes.
        </div>

        {/* Slots grid */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <BsClock className="text-[18px] text-blue-500 dark:text-blue-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">Time Slot Rates</span>
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
                    <div key={slot.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md flex flex-col gap-1 border border-slate-100 dark:border-slate-700/50">
                      <span className="capitalize font-bold text-slate-700 dark:text-slate-300">{slot.day}</span>
                      <span className="text-[12px] text-slate-600 dark:text-slate-400 font-medium">
                        {slot.timeRange
                          ? `${slot.timeRange[0].format("h:mm A")} - ${slot.timeRange[1].format("h:mm A")}`
                          : "No time set"}
                      </span>
                      <span className="text-[12px] text-slate-600 dark:text-slate-400 font-medium">
                        Rate: ₹{slot.perKmRate}/km &middot; ₹{slot.perHourRate}/hr
                      </span>
                      {hotspotEnabled && selectedHotspot && (
                        <span className="text-[12px] text-blue-600 dark:text-blue-400 font-medium">
                          After surge ×{multiplier}: ₹{rateAfterSurge.toFixed(2)}/km
                        </span>
                      )}
                      {/* Indicative per-km tax breakdown */}
                      <Divider className="my-1 border-slate-200 dark:border-slate-700" />
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium tracking-wide">indicative tax / km</span>
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
              <ThunderboltOutlined className="text-[18px] text-blue-500 dark:text-blue-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Hotspot Effect</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-md flex flex-col gap-1 border border-slate-100 dark:border-slate-700/50">
              <Tag color="blue" className="w-fit">{selectedHotspot.hotspot_name}</Tag>
              <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">Surge: ×{multiplier} on fare</div>
              <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">Flat fare: +₹{hotspotFare.toFixed(2)} per ride</div>
            </div>
          </div>
        )}

        {/* Extra KM section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <NodeIndexOutlined className="text-[18px] text-blue-500 dark:text-blue-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">Distance Rate Bands</span>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md flex flex-col gap-2 border border-slate-100 dark:border-slate-700/50">
            <Table
              size="small"
              pagination={false}
              rowKey="key"
              dataSource={bandRows}
              className="dark-theme-table-override"
              columns={[
                { title: "KM Range", dataIndex: "kmRange", key: "kmRange" },
                {
                  title: "Rate",
                  dataIndex: "rate",
                  key: "rate",
                  render: (v: string) => <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{v}</span>,
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
