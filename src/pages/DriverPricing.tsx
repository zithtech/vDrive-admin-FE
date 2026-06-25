import { useState, useEffect } from "react";
import { Segmented, Button, Card, Drawer } from "antd";
import { messageApi as message } from "../utilities/antdStaticHolder";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  createPricingRuleWithSlots,
  fetchPricingFareRuleById,
  updatePricingRuleWithSlots,
  fetchPricingFareRules,
} from "../store/slices/pricingFareRulesSlice";
import dayjs from "dayjs";
import LocationConfiguration from "../components/DriverPricing/LocationConfiguration";
import DriverTimeSlotsAndPricing, {
  type UserTimeSlots,
  type TimeSlot,
} from "../components/DriverPricing/DriverTimeSlotsAndPricing";
import HotspotConfiguration from "../components/DriverPricing/HotspotConfiguration";
import ExtraKmConfiguration, {
  type UiCheckpoint,
} from "../components/DriverPricing/ExtraKmConfiguration";
import PricingPreview from "../components/DriverPricing/PricingPreview";
import HotspotTypes from "../components/DriverPricing/HotspotTypes";
import TitleBar from "../components/TitleBarCommon/TitleBar";
import { EyeOutlined } from "@ant-design/icons";
import { useHasPermission } from "../hooks/usePermission";

// Default time slots for Add mode (rates are ₹/km and ₹/hour)
const defaultTimeSlots = (): UserTimeSlots => ({
  "normal-driver": [
    {
      id: 1,
      day: "monday",
      timeRange: [dayjs("9:00 AM", "h:mm A"), dayjs("11:00 AM", "h:mm A")],
      perKmRate: 12,
      perHourRate: 150,
    },
  ],
  "premium-driver": [
    {
      id: 1,
      day: "monday",
      timeRange: [dayjs("7:00 AM", "h:mm A"), dayjs("9:00 AM", "h:mm A")],
      perKmRate: 15,
      perHourRate: 180,
    },
  ],
  "elite-driver": [
    {
      id: 1,
      day: "monday",
      timeRange: [dayjs("7:00 AM", "h:mm A"), dayjs("9:00 AM", "h:mm A")],
      perKmRate: 18,
      perHourRate: 220,
    },
  ],
});

const DriverPricing = () => {
  const [activeTab, setActiveTab] = useState("configuration");
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.pricingFareRules);
  const [country, setCountry] = useState(""); // Default
  const [state, setState] = useState(""); // Default
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");
  const [perKmPrice, setPerKmPrice] = useState(12);
  const [perHourPrice, setPerHourPrice] = useState(150);
  const [minimumFare, setMinimumFare] = useState(150);
  const [oneWayReturnPct, setOneWayReturnPct] = useState(50);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const canCreatePricing = useHasPermission("pricing", "create");
  const canUpdatePricing = useHasPermission("pricing", "update");
  const isAuthorized = id ? canUpdatePricing : canCreatePricing;

  const [timeSlots, setTimeSlots] = useState<UserTimeSlots>({
    "normal-driver": [],
    "premium-driver": [],
    "elite-driver": [],
  });

  const [hotspotEnabled, setHotspotEnabled] = useState(false);
  const [hotspotId, setHotspotId] = useState("");
  const [multiplier, setMultiplier] = useState(1);

  // Extra-KM distance tiers: each is a "from X km → ₹/km rate" breakpoint
  const [extraKmCheckpoints, setExtraKmCheckpoints] = useState<UiCheckpoint[]>([]);

  // Store initial names from API response for edit mode
  const [initialCountryName, setInitialCountryName] = useState<string>();
  const [initialStateName, setInitialStateName] = useState<string>();
  const [initialDistrictName, setInitialDistrictName] = useState<string>();
  const [initialAreaName, setInitialAreaName] = useState<string>();

  // Fetch data if editing
  useEffect(() => {
    if (id) {
      dispatch(fetchPricingFareRuleById(id))
        .unwrap()
        .then((data) => {
          setCountry(data.country_id || "");
          setState(data.state_id || "");
          setDistrict(data.district_id || "");
          setArea(data.area_id || "");
          setPincode(data.pincode || "");
          setPerKmPrice(Number(data.per_km_price));
          setPerHourPrice(Number(data.per_hour_price) || 0);
          setMinimumFare(Number(data.minimum_fare) || 0);
          setOneWayReturnPct(Number(data.one_way_return_pct) || 0);
          setHotspotEnabled(data.is_hotspot);
          setHotspotId(data.hotspot_id || "");
          setMultiplier(Number(data.multiplier) || 1);
          setExtraKmCheckpoints(
            (data.extra_km_checkpoints ?? [])
              .slice()
              .sort((a: any, b: any) => a.from_km - b.from_km || a.sort_order - b.sort_order)
              .map((c: any, i: number) => ({
                uid: i,
                from_km: Number(c.from_km),
                price: Number(c.price),
              })),
          );

          // Store initial names for display (professional approach)
          setInitialCountryName(data.country_name);
          setInitialStateName(data.state_name);
          setInitialDistrictName(data.district_name);
          setInitialAreaName(data.area_name);

          // Transform time slots
          const newSlots: UserTimeSlots = {
            "normal-driver": [],
            "premium-driver": [],
            "elite-driver": [],
          };

          if (data.time_slots) {
            data.time_slots.forEach((slot: any, index: number) => {
              const driverType = slot.driver_types as keyof UserTimeSlots;
              if (newSlots[driverType]) {
                newSlots[driverType].push({
                  id: index + 1, // Simple ID generation
                  day: slot.day,
                  timeRange: [dayjs(slot.from_time, "HH:mm:ss"), dayjs(slot.to_time, "HH:mm:ss")],
                  perKmRate: Number(slot.per_km_rate),
                  perHourRate: Number(slot.per_hour_rate) || 0,
                });
              }
            });
          }
          setTimeSlots(newSlots);
        })
        .catch(() => {
          message.error("Failed to fetch pricing rule details");
          navigate("/PricingAndFareRules");
        });
    } else {
      // Default initialization for Add mode
      setTimeSlots(defaultTimeSlots());
    }
  }, [id, dispatch, navigate]);

  // Reset form to initial state
  const resetFormState = () => {
    setCountry("");
    setState("");
    setDistrict("");
    setArea("");
    setPincode("");
    setPerKmPrice(12);
    setPerHourPrice(150);
    setMinimumFare(150);
    setOneWayReturnPct(50);
    setHotspotEnabled(false);
    setHotspotId("");
    setMultiplier(1);
    setExtraKmCheckpoints([]);
    setTimeSlots(defaultTimeSlots());
  };

  // Build the request payload shared by Save and Save & Add Another
  const buildPayload = () => {
    // Transform time slots from object to array
    const timeSlotsArray = Object.entries(timeSlots).flatMap(([driverType, slots]) =>
      (slots as TimeSlot[]).map((slot) => {
        if (!slot.timeRange) {
          throw new Error(`Time range is required for all slots`);
        }
        return {
          driver_types: driverType,
          day: slot.day.toLowerCase(),
          from_time: slot.timeRange[0].format("HH:mm:ss"),
          to_time: slot.timeRange[1].format("HH:mm:ss"),
          per_km_rate: slot.perKmRate,
          per_hour_rate: slot.perHourRate,
        };
      }),
    );

    return {
      area_id: area || null,
      district_id: district,
      per_km_price: perKmPrice,
      per_hour_price: perHourPrice,
      minimum_fare: minimumFare,
      one_way_return_pct: oneWayReturnPct,
      is_hotspot: hotspotEnabled,
      hotspot_id: hotspotEnabled ? hotspotId : null,
      multiplier: hotspotEnabled ? multiplier : null,
      extra_km_checkpoints: extraKmCheckpoints.map((c, i) => ({
        from_km: c.from_km,
        price: c.price,
        sort_order: i,
      })),
      time_slots: timeSlotsArray,
    };
  };

  // Validate before saving; returns false if invalid
  const validate = () => {
    if (!district || district === "") {
      message.error("Please select a district");
      return false;
    }
    if (hotspotEnabled && !hotspotId) {
      message.error("Please select a hotspot when hotspot is enabled");
      return false;
    }
    const totalSlots = Object.values(timeSlots).reduce((sum, slots) => sum + slots.length, 0);
    if (totalSlots === 0) {
      message.error("Please add at least one time slot");
      return false;
    }
    return true;
  };

  // Transform and save pricing rule with time slots
  const handleSave = async () => {
    if (!validate()) return;

    try {
      const payload = buildPayload();

      if (id) {
        // Update existing rule
        await dispatch(updatePricingRuleWithSlots({ id, data: payload })).unwrap();
        message.success("Pricing rule updated successfully!");
      } else {
        // Create new rule
        await dispatch(createPricingRuleWithSlots(payload)).unwrap();
        message.success("Pricing rule created successfully!");
      }

      // Refresh the pricing fare rules list
      dispatch(
        fetchPricingFareRules({
          page: 1,
          limit: 10,
          include_time_slots: true,
        }),
      );

      navigate("/PricingAndFareRules");
    } catch (error: any) {
      console.error("Save error:", error);
      message.error(error || "Failed to save pricing rule");
    }
  };

  // Save and add another pricing rule
  const handleSaveAndAddAnother = async () => {
    if (!validate()) return;

    try {
      const payload = buildPayload();

      if (id) {
        // Update existing rule
        await dispatch(updatePricingRuleWithSlots({ id, data: payload })).unwrap();
        message.success("Pricing rule updated successfully!");

        // Navigate to add mode (remove the ID from URL)
        navigate("/PricingAndFareRules/pricing");
      } else {
        // Create new rule
        await dispatch(createPricingRuleWithSlots(payload)).unwrap();
        message.success("Pricing rule created successfully!");
      }

      // Refresh the pricing fare rules list
      dispatch(
        fetchPricingFareRules({
          page: 1,
          limit: 10,
          include_time_slots: true,
        }),
      );

      // Reset form to initial state
      resetFormState();
    } catch (error: any) {
      console.error("Save error:", error);
      message.error(error || "Failed to save pricing rule");
    }
  };
  return (
    <div className="h-full w-full bg-[#f8f9fa] dark:bg-[#0b0f19]">
      <div className="h-full flex justify-center px-0">
        <div className="w-full flex flex-col h-full overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <TitleBar
              className="w-full flex-1 min-h-0 flex flex-col gap-2"
              title={id ? "Edit Pricing" : "Add Pricing"}
              description="Configure per-km, per-hour, minimum and return pricing by zone and time slot"
              extraContent={
                <div>
                  <Button
                    icon={<EyeOutlined className="text-lg" />}
                    type="primary"
                    onClick={() => setIsDrawerOpen(true)}
                    className="px-4 h-10 rounded-lg font-bold text-xs uppercase tracking-wider border-none !bg-blue-600 hover:!bg-blue-700 text-white shadow-sm flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-all"
                  >
                    Pricing Preview
                  </Button>
                </div>
              }
            >
              <div className="w-full shrink-0">
                <Segmented<string>
                  options={[
                    {
                      label: "Configuration",
                      className: "w-full",
                      value: "configuration",
                    },
                    {
                      label: "Hotspot Types",
                      className: "w-full",
                      value: "hotspot-types",
                    },
                  ]}
                  size="large"
                  className="w-full"
                  value={activeTab}
                  onChange={setActiveTab}
                />
              </div>
              {activeTab === "configuration" ? (
                <div className="flex-1 min-h-0 overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-4 lg:gap-6 mt-2 h-full overflow-hidden">
                    <div className="flex flex-col gap-4 min-w-0 overflow-y-auto pb-2 h-full">
                      <LocationConfiguration
                        country={country}
                        setCountry={setCountry}
                        state={state}
                        setState={setState}
                        district={district}
                        setDistrict={setDistrict}
                        area={area}
                        setArea={setArea}
                        pincode={pincode}
                        setPincode={setPincode}
                        perKmPrice={perKmPrice}
                        setPerKmPrice={setPerKmPrice}
                        perHourPrice={perHourPrice}
                        setPerHourPrice={setPerHourPrice}
                        minimumFare={minimumFare}
                        setMinimumFare={setMinimumFare}
                        oneWayReturnPct={oneWayReturnPct}
                        setOneWayReturnPct={setOneWayReturnPct}
                      />
                      <HotspotConfiguration
                        hotspotEnabled={hotspotEnabled}
                        setHotspotEnabled={setHotspotEnabled}
                        hotspotId={hotspotId}
                        setHotspotId={setHotspotId}
                        multiplier={multiplier}
                        setMultiplier={setMultiplier}
                      />
                      <ExtraKmConfiguration
                        perKmPrice={perKmPrice}
                        extraKmCheckpoints={extraKmCheckpoints}
                        setExtraKmCheckpoints={setExtraKmCheckpoints}
                      />
                    </div>
                    <div className="flex flex-col h-full overflow-auto">
                      <DriverTimeSlotsAndPricing
                        timeSlots={timeSlots}
                        setTimeSlots={setTimeSlots}
                        hotspotEnabled={hotspotEnabled}
                        hotspotId={hotspotId}
                        multiplier={multiplier}
                        perKmPrice={perKmPrice}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <HotspotTypes />
              )}
            </TitleBar>
          </div>

          <div className="shrink-0">
            {activeTab === "configuration" ? (
              <Card className="w-full rounded-none border-t border-slate-200 dark:!border-slate-800 bg-white dark:!bg-[#0f172555] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => navigate("/PricingAndFareRules")}
                  >
                    Cancel
                  </Button>
                  {isAuthorized && (
                    <>
                      <Button
                        type="primary"
                        className="w-full sm:w-auto"
                        onClick={handleSave}
                        loading={isLoading}
                      >
                        Save Rule
                      </Button>
                      <Button
                        type="primary"
                        className="w-full sm:w-auto"
                        style={{ background: "#4CAF50" }}
                        onClick={handleSaveAndAddAnother}
                        loading={isLoading}
                      >
                        Save & Add Another
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      <Drawer
        title="Pricing Preview"
        open={isDrawerOpen}
        width={"80%"}
        onClose={() => setIsDrawerOpen(false)}
      >
        <div className="lg:col-span-1">
          <PricingPreview
            country={initialCountryName || ""}
            state={initialStateName || ""}
            district={initialDistrictName || ""}
            area={initialAreaName || ""}
            pincode={pincode}
            timeSlots={timeSlots}
            hotspotEnabled={hotspotEnabled}
            hotspotId={hotspotId}
            multiplier={multiplier}
            perKmPrice={perKmPrice}
            perHourPrice={perHourPrice}
            minimumFare={minimumFare}
            oneWayReturnPct={oneWayReturnPct}
            extraKmCheckpoints={extraKmCheckpoints}
          />
        </div>
      </Drawer>
    </div>
  );
};

export default DriverPricing;
