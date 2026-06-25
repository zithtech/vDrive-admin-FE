import { useEffect } from "react";
import { Card, Select, Switch, InputNumber, Tag, Spin } from "antd";
import { ThunderboltOutlined, LoadingOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchHotspots } from "../../store/slices/hotspotSlice";

interface HotspotConfigurationProps {
  hotspotEnabled: boolean;
  setHotspotEnabled: (enabled: boolean) => void;
  hotspotId: string;
  setHotspotId: (id: string) => void;
  multiplier: number;
  setMultiplier: (multiplier: number) => void;
}

const HotspotConfiguration = ({
  hotspotEnabled,
  setHotspotEnabled,
  hotspotId,
  setHotspotId,
  multiplier,
  setMultiplier,
}: HotspotConfigurationProps) => {
  const dispatch = useAppDispatch();
  const { hotspots, isLoading } = useAppSelector((state) => state.hotspot);

  // Load hotspots on component mount
  useEffect(() => {
    dispatch(fetchHotspots({ limit: 100 })); // Fetch all hotspots
  }, [dispatch]);

  // Get selected hotspot details
  const selectedHotspot = hotspots.find((h) => h.id === hotspotId);

  if (isLoading && hotspots.length === 0) {
    return (
      <Card size="small">
        <div className="flex justify-center items-center h-32">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          <span className="ml-2">Loading hotspots...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card size="small" className="w-full bg-white dark:!bg-[#0f172a] border border-slate-200 dark:!border-slate-800">
      <div className="w-full flex flex-col gap-3">
        <div className="flex items-center justify-between w-full">
          <div className="w-full flex items-center gap-2">
            <ThunderboltOutlined className="text-[20px] text-blue-500 dark:text-blue-400" />
            <span className="text-[19px] font-semibold p-0 m-0 text-slate-800 dark:text-slate-100">Hotspot Configuration</span>
          </div>
        </div>

        <Card variant="borderless" size="small" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
          <div className="w-full flex items-center gap-2 justify-between">
            <div className="flex flex-col gap-2 ">
              <span className="text-[16px] font-semibold p-0 m-0 text-slate-800 dark:text-slate-100">Enable Hotspot Pricing</span>
              <span className="text-[10px]  p-0 m-0 text-slate-500 dark:text-slate-400">Apply dynamic pricing based on demand</span>
            </div>
            <div>
              <Switch checked={hotspotEnabled} onChange={setHotspotEnabled} />
            </div>
          </div>
        </Card>

        {hotspotEnabled && (
          <>
            <div className="w-full flex flex-col">
              <span className="text-sm font-medium mb-1">Hotspot</span>
              <Select
                value={hotspotId}
                onChange={setHotspotId}
                placeholder="Select a hotspot"
                loading={isLoading}
                showSearch
                allowClear
                filterOption={(input, option) =>
                  (option?.searchtext ?? "").toLowerCase().includes(input.toLowerCase())
                }
                options={hotspots.map((hotspot) => ({
                  value: hotspot.id,
                  searchtext: hotspot.hotspot_name,
                  label: (
                    <div className="flex items-center gap-2">
                      <ThunderboltOutlined />
                      <span>{hotspot.hotspot_name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        +₹{Number(hotspot.fare).toFixed(0)} -{" "}
                        {Number(hotspot.multiplier).toFixed(1)}x
                      </span>
                    </div>
                  ),
                }))}
              />
            </div>

            {selectedHotspot && (
              <div className="w-full flex flex-col sm:flex-row gap-4 sm:justify-between">
                <div className="flex flex-col">
                  <div>
                    <Tag color="blue" className="mb-2">
                      {selectedHotspot.hotspot_name}
                    </Tag>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    Flat fare: ₹{Number(selectedHotspot.fare).toFixed(2)} / ride
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    One-time surcharge added to the ride total
                  </span>
                </div>
                <div className="w-full sm:w-1/2 flex gap-6">
                  <span className="text-sm font-medium mb-1">Surge ×:</span>
                  <div className="flex items-center flex-col">
                    <div>
                      <InputNumber
                        min={0.1}
                        step={0.1}
                        value={multiplier}
                        onChange={(value) => setMultiplier(value || 1)}
                        addonAfter="x"
                        size="small"
                        className="w-full"
                        placeholder={Number(selectedHotspot.multiplier).toFixed(1)}
                      />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Default: {Number(selectedHotspot.multiplier).toFixed(1)}x
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

export default HotspotConfiguration;
