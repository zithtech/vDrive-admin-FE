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
      <Card size="small" className="!rounded-none">
        <div className="flex justify-center items-center h-24">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          <span className="ml-2 text-xs text-slate-500">Loading hotspots...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card size="small" className="!rounded-none" styles={{ body: { padding: '16px' } }}>
      <div className="w-full flex flex-col gap-4">
        {/* Section Header */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <ThunderboltOutlined className="text-base text-amber-500 dark:text-amber-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight leading-none">Hotspot Configuration</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Dynamic demand-based pricing zones</span>
          </div>
        </div>

        <Card variant="borderless" size="small" className="w-full !rounded-lg bg-slate-50 dark:bg-slate-800/50 !border !border-slate-100 dark:!border-slate-700/50">
          <div className="w-full flex items-center gap-2 justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Enable Hotspot Pricing</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Apply dynamic pricing based on demand</span>
            </div>
            <div>
              <Switch checked={hotspotEnabled} onChange={setHotspotEnabled} size="small" />
            </div>
          </div>
        </Card>

        {hotspotEnabled && (
          <>
            <div className="w-full flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hotspot Zone</span>
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
                      <span className="text-xs text-gray-500">
                        +₹{Number(hotspot.fare).toFixed(0)} -{" "}
                        {Number(hotspot.multiplier).toFixed(1)}x
                      </span>
                    </div>
                  ),
                }))}
              />
            </div>

            {selectedHotspot && (
              <div className="w-full flex flex-col sm:flex-row gap-3 sm:justify-between p-3 bg-blue-50/60 dark:bg-blue-500/5 rounded-lg border border-blue-100 dark:border-blue-900/30">
                <div className="flex flex-col gap-1">
                  <div>
                    <Tag color="blue" className="mb-1 !text-[10px] !font-bold">
                      {selectedHotspot.hotspot_name}
                    </Tag>
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Fare: ₹{Number(selectedHotspot.fare).toFixed(2)}
                  </span>
                </div>
                <div className="w-full sm:w-1/2 flex gap-3 items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Multiplier:</span>
                  <div className="flex items-center flex-col flex-1">
                    <div className="w-full">
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
                      <span className="text-[10px] text-slate-400 mt-0.5">
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
