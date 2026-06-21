import { Card, InputNumber, Button, Table } from "antd";
import type { TableColumnsType } from "antd";
import { NodeIndexOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";

export interface UiCheckpoint {
  uid: number;
  multiplier: number;
}

interface ExtraKmConfigurationProps {
  extraKmStep: number;
  setExtraKmStep: (v: number) => void;
  extraKmPrice: number;
  setExtraKmPrice: (v: number) => void;
  extraKmStartMultiplier: number;
  setExtraKmStartMultiplier: (v: number) => void;
  extraKmCheckpoints: UiCheckpoint[];
  setExtraKmCheckpoints: (v: UiCheckpoint[]) => void;
}

interface PreviewRow {
  key: number;
  range: string;
  multiplier: string;
  pricePerStep: string;
}

const ExtraKmConfiguration = ({
  extraKmStep,
  setExtraKmStep,
  extraKmPrice,
  setExtraKmPrice,
  extraKmStartMultiplier,
  setExtraKmStartMultiplier,
  extraKmCheckpoints,
  setExtraKmCheckpoints,
}: ExtraKmConfigurationProps) => {
  const addCheckpoint = () => {
    setExtraKmCheckpoints([...extraKmCheckpoints, { uid: Date.now(), multiplier: 1 }]);
  };

  const removeCheckpoint = (uid: number) => {
    setExtraKmCheckpoints(extraKmCheckpoints.filter((c) => c.uid !== uid));
  };

  const updateMultiplier = (uid: number, value: number) => {
    setExtraKmCheckpoints(
      extraKmCheckpoints.map((c) => (c.uid === uid ? { ...c, multiplier: value } : c)),
    );
  };

  // Build preview rows: tier 1 (start) + one row per checkpoint
  const previewRows: PreviewRow[] = [
    {
      key: 0,
      range: `0 – ${extraKmStep} km`,
      multiplier: `×${Number(extraKmStartMultiplier).toFixed(2)}`,
      pricePerStep: `₹${(extraKmPrice * extraKmStartMultiplier).toFixed(2)}`,
    },
    ...extraKmCheckpoints.map((c, i) => ({
      key: c.uid,
      range: `${extraKmStep * (i + 1)} – ${extraKmStep * (i + 2)} km`,
      multiplier: `×${Number(c.multiplier).toFixed(2)}`,
      pricePerStep: `₹${(extraKmPrice * c.multiplier).toFixed(2)}`,
    })),
  ];

  const previewColumns: TableColumnsType<PreviewRow> = [
    { title: "KM Range", dataIndex: "range", key: "range" },
    {
      title: "Multiplier",
      dataIndex: "multiplier",
      key: "multiplier",
      render: (v: string) => <span className="text-[#0080FF] font-semibold">{v}</span>,
    },
    {
      title: "₹ / Step",
      dataIndex: "pricePerStep",
      key: "pricePerStep",
      render: (v: string) => <span className="text-green-600 font-semibold">{v}</span>,
    },
  ];

  return (
    <Card size="small" className="!rounded-none" styles={{ body: { padding: '16px' } }}>
      <div className="w-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
            <NodeIndexOutlined className="text-base text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-tight leading-none">Extra KM Configuration</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Tiered per-km pricing after base distance</span>
          </div>
        </div>

        {/* Top 3 fields */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">KM Step</span>
            <InputNumber
              min={0.1}
              step={0.5}
              precision={2}
              value={extraKmStep}
              onChange={(v) => setExtraKmStep(v || 1)}
              addonAfter="km"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Base Price / Step</span>
            <InputNumber
              min={0}
              precision={2}
              value={extraKmPrice}
              onChange={(v) => setExtraKmPrice(v ?? 0)}
              prefix="₹"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Start Multiplier</span>
            <InputNumber
              min={0.01}
              step={0.1}
              precision={2}
              value={extraKmStartMultiplier}
              onChange={(v) => setExtraKmStartMultiplier(v || 1)}
              addonAfter="×"
              className="w-full"
            />
          </div>
        </div>

        {/* Checkpoints */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Checkpoints</span>

          {extraKmCheckpoints.map((c, i) => (
            <div key={c.uid} className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-100 dark:border-slate-700/50">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[110px] uppercase tracking-wider">
                  Tier {i + 2}&nbsp;({extraKmStep * (i + 1)}–{extraKmStep * (i + 2)} km)
                </span>
                <InputNumber
                  min={0.01}
                  step={0.1}
                  precision={2}
                  value={c.multiplier}
                  onChange={(v) => updateMultiplier(c.uid, v || 1)}
                  addonAfter="×"
                  className="w-full"
                  size="small"
                />
              </div>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => removeCheckpoint(c.uid)}
              />
            </div>
          ))}

          <Button type="dashed" icon={<PlusOutlined />} className="w-full !rounded-md" onClick={addCheckpoint}>
            Add Tier
          </Button>
        </div>

        {/* Preview table */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Preview</span>
          <Table<PreviewRow>
            dataSource={previewRows}
            columns={previewColumns}
            rowKey="key"
            size="small"
            pagination={false}
            className="w-full"
          />
        </div>
      </div>
    </Card>
  );
};

export default ExtraKmConfiguration;
