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
  globalPrice: number;
  extraKmStep: number;
  extraKmPrice: number;
  extraKmStartMultiplier: number;
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
  extraKmStep,
  extraKmPrice,
  extraKmStartMultiplier,
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

  // For each slot: base → hotspot → taxes
  const getBreakdown = (slot: TimeSlot) => {
    const priceAfterHotspot = hotspotEnabled ? slot.price * multiplier + hotspotFare : slot.price;
    return computeTaxBreakdown(priceAfterHotspot, taxes);
  };

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
          <div className="flex flex-col gap-1 sm:items-end">
            <span className="text-sm font-medium text-gray-700">Total configuration</span>
            <div className="flex gap-2 flex-wrap justify-end text-xs">
              {Object.entries(timeSlots).map(([userType, slots]) => (
                <span
                  key={userType}
                  className="px-2 py-[2px] rounded-sm border border-violet-300 bg-violet-50 text-violet-700"
                >
                  <span className="capitalize">{userType.replace("-", " ")}</span>
                  <span className="mx-1">:</span>
                  <span className="font-medium">{slots.length}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Slots grid */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <BsClock className="text-[18px] text-[#0080FF]" />
            <span className="font-semibold">Time Slots Summary</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(timeSlots).map(([userType, slots]) => (
              <div key={userType} className="flex flex-col gap-2">
                <div className="font-semibold text-center">
                  {userTypeTags[userType as UserType]}
                </div>
                {slots.map((slot: TimeSlot) => {
                  const priceAfterHotspot = hotspotEnabled
                    ? slot.price * multiplier + hotspotFare
                    : slot.price;
                  const breakdown = getBreakdown(slot);

                  return (
                    <div key={slot.id} className="p-2 bg-[#F8F9FA] rounded-md flex flex-col gap-1">
                      <span className="capitalize font-medium">{slot.day}</span>
                      <span className="text-[12px] text-gray-600">
                        {slot.timeRange
                          ? `${slot.timeRange[0].format("h:mm A")} - ${slot.timeRange[1].format("h:mm A")}`
                          : "No time set"}
                      </span>
                      <span className="text-[12px] text-gray-600">Base: ₹{slot.price}</span>
                      {hotspotEnabled && selectedHotspot && (
                        <span className="text-[12px] text-blue-600">
                          After hotspot: ₹{priceAfterHotspot.toFixed(2)}
                        </span>
                      )}
                      {/* Full multi-tax breakdown */}
                      <Divider style={{ margin: "4px 0" }} />
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
              <div className="text-sm">Fare: +₹{hotspotFare.toFixed(2)}</div>
              <div className="text-sm">Multiplier: {multiplier}x</div>
            </div>
          </div>
        )}

        {/* Extra KM section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <NodeIndexOutlined className="text-[18px] text-[#0080FF]" />
            <span className="font-semibold">Extra KM Configuration</span>
          </div>
          <div className="p-2 bg-[#F8F9FA] rounded-md flex flex-col gap-2">
            <div className="flex gap-4 text-sm">
              <span>
                Step: <strong>{extraKmStep} km</strong>
              </span>
              <span>
                Base price: <strong>₹{Number(extraKmPrice).toFixed(2)}</strong>
              </span>
              <span>
                Start multiplier: <strong>×{Number(extraKmStartMultiplier).toFixed(2)}</strong>
              </span>
            </div>
            <Table
              size="small"
              pagination={false}
              dataSource={[
                {
                  key: 0,
                  kmRange: `0–${extraKmStep} km`,
                  multiplier: `×${Number(extraKmStartMultiplier).toFixed(2)}`,
                  price: `₹${(extraKmPrice * extraKmStartMultiplier).toFixed(2)}`,
                },
                ...extraKmCheckpoints.map((c, i) => ({
                  key: c.uid,
                  kmRange: `${extraKmStep * (i + 1)}–${extraKmStep * (i + 2)} km`,
                  multiplier: `×${Number(c.multiplier).toFixed(2)}`,
                  price: `₹${(extraKmPrice * c.multiplier).toFixed(2)}`,
                })),
              ]}
              columns={[
                { title: "KM Range", dataIndex: "kmRange", key: "kmRange" },
                {
                  title: "Multiplier",
                  dataIndex: "multiplier",
                  key: "multiplier",
                  render: (v: string) => <span className="text-[#0080FF] font-semibold">{v}</span>,
                },
                {
                  title: "₹ / Step",
                  dataIndex: "price",
                  key: "price",
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
