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
  type PricingRulePayload,
} from "../store/slices/pricingFareRulesSlice";
import dayjs, { type Dayjs } from "dayjs";
import LocationConfiguration from "../components/DriverPricing/LocationConfiguration";
import DriverTimeSlotsAndPricing, {
  type UserType,
  type UserTimeSlots,
  type RateCards,
  type TimeSlabs,
  type TimeSlot,
  type UiSlab,
} from "../components/DriverPricing/DriverTimeSlotsAndPricing";
import HotspotConfiguration from "../components/DriverPricing/HotspotConfiguration";
import PricingPreview from "../components/DriverPricing/PricingPreview";
import HotspotTypes from "../components/DriverPricing/HotspotTypes";
import TitleBar from "../components/TitleBarCommon/TitleBar";
import { EyeOutlined } from "@ant-design/icons";
import { useHasPermission } from "../hooks/usePermission";

const DRIVER_TYPES: UserType[] = ["normal-driver", "premium-driver", "elite-driver"];

const defaultRateCards = (): RateCards => ({
  "normal-driver": { perHourRate: 150, perKmRate: 0, freeKm: 0, minimumFare: 150 },
  "premium-driver": { perHourRate: 200, perKmRate: 0, freeKm: 0, minimumFare: 200 },
  "elite-driver": { perHourRate: 260, perKmRate: 0, freeKm: 0, minimumFare: 260 },
});
const emptyByType = <T,>(): Record<UserType, T[]> => ({
  "normal-driver": [],
  "premium-driver": [],
  "elite-driver": [],
});

const DriverPricing = () => {
  const [activeTab, setActiveTab] = useState("configuration");
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.pricingFareRules);

  // Location
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");

  // Zone-wide pricing
  const [oneWayReturnPct, setOneWayReturnPct] = useState(50);
  const [nightChargePct, setNightChargePct] = useState(0);
  const [nightStart, setNightStart] = useState<Dayjs>(dayjs("22:00:00", "HH:mm:ss"));
  const [nightEnd, setNightEnd] = useState<Dayjs>(dayjs("06:00:00", "HH:mm:ss"));
  const [outstationAllowancePerDay, setOutstationAllowancePerDay] = useState(0);

  // Hotspot
  const [hotspotEnabled, setHotspotEnabled] = useState(false);
  const [hotspotId, setHotspotId] = useState("");
  const [multiplier, setMultiplier] = useState(1);

  // Per-driver-type
  const [rateCards, setRateCards] = useState<RateCards>(defaultRateCards());
  const [timeSlabs, setTimeSlabs] = useState<TimeSlabs>(emptyByType<UiSlab>());
  const [timeSlots, setTimeSlots] = useState<UserTimeSlots>(emptyByType<TimeSlot>());

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [initialCountryName, setInitialCountryName] = useState<string>();
  const [initialStateName, setInitialStateName] = useState<string>();
  const [initialDistrictName, setInitialDistrictName] = useState<string>();
  const [initialAreaName, setInitialAreaName] = useState<string>();

  const canCreatePricing = useHasPermission("pricing", "create");
  const canUpdatePricing = useHasPermission("pricing", "update");
  const isAuthorized = id ? canUpdatePricing : canCreatePricing;

  useEffect(() => {
    if (!id) return;
    dispatch(fetchPricingFareRuleById(id))
      .unwrap()
      .then((data) => {
        setCountry(data.country_id || "");
        setState(data.state_id || "");
        setDistrict(data.district_id || "");
        setArea(data.area_id || "");
        setPincode(data.pincode || "");
        setOneWayReturnPct(Number(data.one_way_return_pct) || 0);
        setNightChargePct(Number(data.night_charge_pct) || 0);
        if (data.night_start) setNightStart(dayjs(data.night_start, "HH:mm:ss"));
        if (data.night_end) setNightEnd(dayjs(data.night_end, "HH:mm:ss"));
        setOutstationAllowancePerDay(Number(data.outstation_allowance_per_day) || 0);
        setHotspotEnabled(data.is_hotspot);
        setHotspotId(data.hotspot_id || "");
        setMultiplier(Number(data.multiplier) || 1);
        setInitialCountryName(data.country_name);
        setInitialStateName(data.state_name);
        setInitialDistrictName(data.district_name);
        setInitialAreaName(data.area_name);

        // Rate cards
        const cards = defaultRateCards();
        (data.rate_cards ?? []).forEach((c: any) => {
          const t = c.driver_types as UserType;
          if (cards[t])
            cards[t] = {
              perHourRate: Number(c.per_hour_rate),
              perKmRate: Number(c.per_km_rate),
              freeKm: Number(c.free_km),
              minimumFare: Number(c.minimum_fare),
            };
        });
        setRateCards(cards);

        // Time slabs
        const slabs = emptyByType<UiSlab>();
        (data.time_slabs ?? [])
          .slice()
          .sort((a: any, b: any) => a.from_hours - b.from_hours)
          .forEach((s: any, i: number) => {
            const t = s.driver_types as UserType;
            if (slabs[t])
              slabs[t].push({ uid: i + 1, fromHours: Number(s.from_hours), perHourRate: Number(s.per_hour_rate) });
          });
        setTimeSlabs(slabs);

        // Day/time slots
        const slots = emptyByType<TimeSlot>();
        (data.time_slots ?? []).forEach((s: any, i: number) => {
          const t = s.driver_types as UserType;
          if (slots[t])
            slots[t].push({
              id: i + 1,
              day: s.day,
              timeRange: [dayjs(s.from_time, "HH:mm:ss"), dayjs(s.to_time, "HH:mm:ss")],
              perKmRate: Number(s.per_km_rate),
              perHourRate: Number(s.per_hour_rate),
            });
        });
        setTimeSlots(slots);
      })
      .catch(() => {
        message.error("Failed to fetch pricing rule details");
        navigate("/PricingAndFareRules");
      });
  }, [id, dispatch, navigate]);

  const resetFormState = () => {
    setCountry("");
    setState("");
    setDistrict("");
    setArea("");
    setPincode("");
    setOneWayReturnPct(50);
    setNightChargePct(0);
    setNightStart(dayjs("22:00:00", "HH:mm:ss"));
    setNightEnd(dayjs("06:00:00", "HH:mm:ss"));
    setOutstationAllowancePerDay(0);
    setHotspotEnabled(false);
    setHotspotId("");
    setMultiplier(1);
    setRateCards(defaultRateCards());
    setTimeSlabs(emptyByType<UiSlab>());
    setTimeSlots(emptyByType<TimeSlot>());
  };

  const validate = () => {
    if (!district) {
      message.error("Please select a district");
      return false;
    }
    if (hotspotEnabled && !hotspotId) {
      message.error("Please select a hotspot when hotspot is enabled");
      return false;
    }
    return true;
  };

  const buildPayload = (): PricingRulePayload => {
    const rate_cards = DRIVER_TYPES.map((t) => ({
      driver_types: t,
      per_hour_rate: rateCards[t].perHourRate,
      per_km_rate: rateCards[t].perKmRate,
      free_km: rateCards[t].freeKm,
      minimum_fare: rateCards[t].minimumFare,
    }));

    const time_slabs = DRIVER_TYPES.flatMap((t) =>
      [...timeSlabs[t]]
        .sort((a, b) => a.fromHours - b.fromHours)
        .map((s, i) => ({
          driver_types: t,
          from_hours: s.fromHours,
          per_hour_rate: s.perHourRate,
          sort_order: i,
        })),
    );

    const time_slots = DRIVER_TYPES.flatMap((t) =>
      timeSlots[t].map((slot) => {
        if (!slot.timeRange) throw new Error("Time range is required for all slots");
        return {
          driver_types: t,
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
      one_way_return_pct: oneWayReturnPct,
      night_charge_pct: nightChargePct,
      night_start: nightStart.format("HH:mm:ss"),
      night_end: nightEnd.format("HH:mm:ss"),
      outstation_allowance_per_day: outstationAllowancePerDay,
      is_hotspot: hotspotEnabled,
      hotspot_id: hotspotEnabled ? hotspotId : null,
      multiplier: hotspotEnabled ? multiplier : null,
      rate_cards,
      time_slabs,
      time_slots,
    };
  };

  const save = async (addAnother: boolean) => {
    if (!validate()) return;
    try {
      const payload = buildPayload();
      if (id) {
        await dispatch(updatePricingRuleWithSlots({ id, data: payload })).unwrap();
        message.success("Pricing rule updated successfully!");
      } else {
        await dispatch(createPricingRuleWithSlots(payload)).unwrap();
        message.success("Pricing rule created successfully!");
      }
      dispatch(fetchPricingFareRules({ page: 1, limit: 10, include_time_slots: true }));
      if (addAnother) {
        if (id) navigate("/PricingAndFareRules/pricing");
        resetFormState();
      } else {
        navigate("/PricingAndFareRules");
      }
    } catch (error: any) {
      console.error("Save error:", error);
      message.error(error || "Failed to save pricing rule");
    }
  };

  return (
    <div className="h-full w-full">
      <div className="h-full w-full px-0">
        <div className="w-full flex flex-col h-screen overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <TitleBar
              className="w-full flex-1 min-h-0 flex flex-col gap-2"
              title={id ? "Edit Pricing" : "Add Pricing"}
              description="Time-first pricing — per-driver-type rate cards, duration slabs, day/time slots"
              extraContent={
                <Button icon={<EyeOutlined />} type="primary" onClick={() => setIsDrawerOpen(true)}>
                  Pricing Preview
                </Button>
              }
            >
              <div className="w-full shrink-0 max-w-[1200px] mx-auto">
                <Segmented<string>
                  options={[
                    { label: "Configuration", className: "w-full", value: "configuration" },
                    { label: "Hotspot Types", className: "w-full", value: "hotspot-types" },
                  ]}
                  size="large"
                  className="w-full"
                  value={activeTab}
                  onChange={setActiveTab}
                />
              </div>
              {activeTab === "configuration" ? (
                <div className="flex-1 min-h-0 overflow-hidden">
                  <div className="grid grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)] gap-4 lg:gap-6 mt-2 h-full overflow-hidden w-full max-w-[1200px] mx-auto">
                    <div className="flex flex-col gap-4 min-w-0 overflow-y-auto overflow-x-hidden pb-2 h-full">
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
                        oneWayReturnPct={oneWayReturnPct}
                        setOneWayReturnPct={setOneWayReturnPct}
                        nightChargePct={nightChargePct}
                        setNightChargePct={setNightChargePct}
                        nightStart={nightStart}
                        setNightStart={setNightStart}
                        nightEnd={nightEnd}
                        setNightEnd={setNightEnd}
                        outstationAllowancePerDay={outstationAllowancePerDay}
                        setOutstationAllowancePerDay={setOutstationAllowancePerDay}
                      />
                      <HotspotConfiguration
                        hotspotEnabled={hotspotEnabled}
                        setHotspotEnabled={setHotspotEnabled}
                        hotspotId={hotspotId}
                        setHotspotId={setHotspotId}
                        multiplier={multiplier}
                        setMultiplier={setMultiplier}
                      />
                    </div>
                    <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden min-w-0">
                      <DriverTimeSlotsAndPricing
                        rateCards={rateCards}
                        setRateCards={setRateCards}
                        timeSlabs={timeSlabs}
                        setTimeSlabs={setTimeSlabs}
                        timeSlots={timeSlots}
                        setTimeSlots={setTimeSlots}
                        hotspotEnabled={hotspotEnabled}
                        hotspotId={hotspotId}
                        multiplier={multiplier}
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
                  <Button className="w-full sm:w-auto" onClick={() => navigate("/PricingAndFareRules")}>
                    Cancel
                  </Button>
                  {isAuthorized && (
                    <>
                      <Button type="primary" className="w-full sm:w-auto" onClick={() => save(false)} loading={isLoading}>
                        Save Rule
                      </Button>
                      <Button
                        type="primary"
                        className="w-full sm:w-auto"
                        style={{ background: "#4CAF50" }}
                        onClick={() => save(true)}
                        loading={isLoading}
                      >
                        Save &amp; Add Another
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      <Drawer title="Pricing Preview" open={isDrawerOpen} width={"80%"} onClose={() => setIsDrawerOpen(false)}>
        <PricingPreview
          country={initialCountryName || ""}
          state={initialStateName || ""}
          district={initialDistrictName || ""}
          area={initialAreaName || ""}
          pincode={pincode}
          oneWayReturnPct={oneWayReturnPct}
          nightChargePct={nightChargePct}
          nightStart={nightStart}
          nightEnd={nightEnd}
          outstationAllowancePerDay={outstationAllowancePerDay}
          hotspotEnabled={hotspotEnabled}
          hotspotId={hotspotId}
          multiplier={multiplier}
          rateCards={rateCards}
          timeSlabs={timeSlabs}
          timeSlots={timeSlots}
        />
      </Drawer>
    </div>
  );
};

export default DriverPricing;
