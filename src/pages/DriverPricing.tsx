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
  const [globalPrice, setGlobalPrice] = useState(1000);
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

  const [extraKmStep, setExtraKmStep] = useState(5);
  const [extraKmPrice, setExtraKmPrice] = useState(10);
  const [extraKmStartMultiplier, setExtraKmStartMultiplier] = useState(1);
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
          setGlobalPrice(Number(data.global_price));
          setHotspotEnabled(data.is_hotspot);
          setHotspotId(data.hotspot_id || "");
          setMultiplier(Number(data.multiplier) || 1);
          setExtraKmStep(Number(data.extra_km_step) || 5);
          setExtraKmPrice(Number(data.extra_km_price) || 10);
          setExtraKmStartMultiplier(Number(data.extra_km_start_multiplier) || 1);
          setExtraKmCheckpoints(
            (data.extra_km_checkpoints ?? [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((c: any, i: number) => ({ uid: i, multiplier: Number(c.multiplier) })),
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
                  price: slot.price,
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
      setTimeSlots({
        "normal-driver": [
          {
            id: 1,
            day: "monday",
            timeRange: [dayjs("9:00 AM", "h:mm A"), dayjs("11:00 AM", "h:mm A")],
            price: 300,
          },
        ],
        "premium-driver": [
          {
            id: 1,
            day: "monday",
            timeRange: [dayjs("7:00 AM", "h:mm A"), dayjs("9:00 AM", "h:mm A")],
            price: 400,
          },
        ],
        "elite-driver": [
          {
            id: 1,
            day: "monday",
            timeRange: [dayjs("7:00 AM", "h:mm A"), dayjs("9:00 AM", "h:mm A")],
            price: 500,
          },
        ],
      });
    }
  }, [id, dispatch, navigate]);

  // Reset form to initial state
  const resetFormState = () => {
    setCountry("");
    setState("");
    setDistrict("");
    setArea("");
    setPincode("");
    setGlobalPrice(1000);
    setHotspotEnabled(false);
    setHotspotId("");
    setMultiplier(1);
    setExtraKmStep(5);
    setExtraKmPrice(10);
    setExtraKmStartMultiplier(1);
    setExtraKmCheckpoints([]);
    setTimeSlots({
      "normal-driver": [
        {
          id: 1,
          day: "monday",
          timeRange: [dayjs("9:00 AM", "h:mm A"), dayjs("11:00 AM", "h:mm A")],
          price: 300,
        },
      ],
      "premium-driver": [
        {
          id: 1,
          day: "monday",
          timeRange: [dayjs("7:00 AM", "h:mm A"), dayjs("9:00 AM", "h:mm A")],
          price: 400,
        },
      ],
      "elite-driver": [
        {
          id: 1,
          day: "monday",
          timeRange: [dayjs("7:00 AM", "h:mm A"), dayjs("9:00 AM", "h:mm A")],
          price: 500,
        },
      ],
    });
  };

  // Transform and save pricing rule with time slots
  const handleSave = async () => {
    // Validation
    if (!district || district === "") {
      message.error("Please select a district");
      return;
    }

    // Area is now optional - no validation needed

    if (hotspotEnabled && !hotspotId) {
      message.error("Please select a hotspot when hotspot is enabled");
      return;
    }

    // Validate that we have at least one time slot
    const totalSlots = Object.values(timeSlots).reduce((sum, slots) => sum + slots.length, 0);
    if (totalSlots === 0) {
      message.error("Please add at least one time slot");
      return;
    }

    try {
      // Transform time slots from object to array
      const timeSlotsArray = Object.entries(timeSlots).flatMap(([driverType, slots]) =>
        slots.map((slot: any) => {
          if (!slot.timeRange) {
            throw new Error(`Time range is required for all slots`);
          }

          return {
            driver_types: driverType,
            day: slot.day.toLowerCase(),
            from_time: slot.timeRange[0].format("HH:mm:ss"),
            to_time: slot.timeRange[1].format("HH:mm:ss"),
            price: slot.price,
          };
        }),
      );

      const payload = {
        area_id: area || null,
        district_id: district,
        global_price: globalPrice,
        is_hotspot: hotspotEnabled,
        hotspot_id: hotspotEnabled ? hotspotId : null,
        multiplier: hotspotEnabled ? multiplier : null,
        extra_km_step: extraKmStep,
        extra_km_price: extraKmPrice,
        extra_km_start_multiplier: extraKmStartMultiplier,
        extra_km_checkpoints: extraKmCheckpoints.map((c, i) => ({
          multiplier: c.multiplier,
          sort_order: i,
        })),
        time_slots: timeSlotsArray,
      };

      console.log("Sending payload (corrected mapping):", payload);

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
    // Validation
    if (!district || district === "") {
      message.error("Please select a district");
      return;
    }

    // Area is now optional - no validation needed

    if (hotspotEnabled && !hotspotId) {
      message.error("Please select a hotspot when hotspot is enabled");
      return;
    }

    // Validate that we have at least one time slot
    const totalSlots = Object.values(timeSlots).reduce((sum, slots) => sum + slots.length, 0);
    if (totalSlots === 0) {
      message.error("Please add at least one time slot");
      return;
    }

    try {
      // Transform time slots from object to array
      const timeSlotsArray = Object.entries(timeSlots).flatMap(([driverType, slots]) =>
        slots.map((slot: any) => {
          if (!slot.timeRange) {
            throw new Error(`Time range is required for all slots`);
          }

          return {
            driver_types: driverType,
            day: slot.day.toLowerCase(),
            from_time: slot.timeRange[0].format("HH:mm:ss"),
            to_time: slot.timeRange[1].format("HH:mm:ss"),
            price: slot.price,
          };
        }),
      );

      // Build the payload
      const payload = {
        area_id: area || null, // Maps to 'areas' table - optional, empty string if not selected
        district_id: district, // Maps to 'districts' table - required
        global_price: globalPrice,
        is_hotspot: hotspotEnabled,
        hotspot_id: hotspotEnabled ? hotspotId : null,
        multiplier: hotspotEnabled ? multiplier : null,
        extra_km_step: extraKmStep,
        extra_km_price: extraKmPrice,
        extra_km_start_multiplier: extraKmStartMultiplier,
        extra_km_checkpoints: extraKmCheckpoints.map((c, i) => ({
          multiplier: c.multiplier,
          sort_order: i,
        })),
        time_slots: timeSlotsArray,
      };

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
    <div className="h-full w-full">
      <div className="h-full flex justify-center px-0">
        <div className="w-full flex flex-col h-screen overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <TitleBar
              className="w-full flex-1 min-h-0 flex flex-col gap-2"
              title={id ? "Edit Pricing" : "Add Pricing"}
              description="Configure pricing for different user types and time slots"
              extraContent={
                <div>
                  <Button
                    icon={<EyeOutlined />}
                    type="primary"
                    onClick={() => setIsDrawerOpen(true)}
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
                        globalPrice={globalPrice}
                        setGlobalPrice={setGlobalPrice}
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
                        extraKmStep={extraKmStep}
                        setExtraKmStep={setExtraKmStep}
                        extraKmPrice={extraKmPrice}
                        setExtraKmPrice={setExtraKmPrice}
                        extraKmStartMultiplier={extraKmStartMultiplier}
                        setExtraKmStartMultiplier={setExtraKmStartMultiplier}
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
                        globalPrice={globalPrice}
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
              <Card className="w-full rounded-none border-t">
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
            globalPrice={globalPrice}
            extraKmStep={extraKmStep}
            extraKmPrice={extraKmPrice}
            extraKmStartMultiplier={extraKmStartMultiplier}
            extraKmCheckpoints={extraKmCheckpoints}
          />
        </div>
      </Drawer>
    </div>
  );
};

export default DriverPricing;
