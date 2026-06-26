import { Card, InputNumber, Button, Table } from "antd";
import type { TableColumnsType } from "antd";
import { NodeIndexOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";

export interface UiCheckpoint {
  uid: number;
  from_km: number;
  price: number;
}

interface ExtraKmConfigurationProps {
  perKmPrice: number;
  extraKmCheckpoints: UiCheckpoint[];
  setExtraKmCheckpoints: (v: UiCheckpoint[]) => void;
}

interface PreviewRow {
  key: number | string;
  range: string;
  rate: string;
}

const ExtraKmConfiguration = ({
  perKmPrice,
  extraKmCheckpoints,
  setExtraKmCheckpoints,
}: ExtraKmConfigurationProps) => {
  // Suggest the next breakpoint a bit beyond the current furthest one
  const nextFromKm = () => {
    const maxFrom = extraKmCheckpoints.reduce((m, c) => Math.max(m, c.from_km), 0);
    return maxFrom > 0 ? maxFrom + 5 : 5;
  };

  const addCheckpoint = () => {
    setExtraKmCheckpoints([
      ...extraKmCheckpoints,
      { uid: Date.now(), from_km: nextFromKm(), price: perKmPrice },
    ]);
  };

  const removeCheckpoint = (uid: number) => {
    setExtraKmCheckpoints(extraKmCheckpoints.filter((c) => c.uid !== uid));
  };

  const updateCheckpoint = (uid: number, patch: Partial<UiCheckpoint>) => {
    setExtraKmCheckpoints(extraKmCheckpoints.map((c) => (c.uid === uid ? { ...c, ...patch } : c)));
  };

  // Tiers sorted by from_km drive the preview band ranges
  const sorted = [...extraKmCheckpoints].sort((a, b) => a.from_km - b.from_km);
  const firstBreak = sorted.length > 0 ? sorted[0].from_km : null;

  const previewRows: PreviewRow[] = [
    {
      key: "base",
      range: firstBreak !== null ? `0 – ${firstBreak} km` : `0 km and beyond`,
      rate: `₹${Number(perKmPrice).toFixed(2)} / km`,
    },
    ...sorted.map((c, i) => {
      const next = sorted[i + 1];
      return {
        key: c.uid,
        range: next ? `${c.from_km} – ${next.from_km} km` : `${c.from_km} km and beyond`,
        rate: `₹${Number(c.price).toFixed(2)} / km`,
      };
    }),
  ];

  const previewColumns: TableColumnsType<PreviewRow> = [
    { title: "KM Range", dataIndex: "range", key: "range" },
    {
      title: "Rate",
      dataIndex: "rate",
      key: "rate",
      render: (v: string) => <span className="text-green-600 font-semibold">{v}</span>,
    },
  ];

  return (
    <Card size="small">
      <div className="w-full flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <NodeIndexOutlined className="text-[20px] text-[#0080FF]" />
          <span className="text-[19px] font-semibold p-0 m-0">Extra KM Configuration</span>
        </div>

        <span className="text-xs text-gray-500">
          The base "Price per KM" applies from 0 km. Add breakpoints to charge a different ₹/km
          beyond a chosen distance.
        </span>

        {/* Read-only base (from 0 km) row */}
        <div className="flex items-center gap-2 p-2 bg-[#EEF5FF] rounded-md">
          <span className="text-xs text-gray-600 whitespace-nowrap min-w-[110px]">
            From 0 km (base)
          </span>
          <InputNumber
            value={perKmPrice}
            disabled
            prefix="₹"
            addonAfter="/km"
            className="w-full"
            size="small"
          />
        </div>

        {/* Breakpoints */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Distance breakpoints</span>

          {sorted.map((c) => (
            <div key={c.uid} className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 p-2 bg-[#F8F9FA] rounded-md">
                <span className="text-xs text-gray-500 whitespace-nowrap">From</span>
                <InputNumber
                  min={0.1}
                  step={1}
                  precision={2}
                  value={c.from_km}
                  onChange={(v) => updateCheckpoint(c.uid, { from_km: v || 0 })}
                  addonAfter="km"
                  className="w-full"
                  size="small"
                />
                <span className="text-xs text-gray-500 whitespace-nowrap">→</span>
                <InputNumber
                  min={0}
                  precision={2}
                  value={c.price}
                  onChange={(v) => updateCheckpoint(c.uid, { price: v ?? 0 })}
                  prefix="₹"
                  addonAfter="/km"
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

          <Button type="dashed" icon={<PlusOutlined />} className="w-full" onClick={addCheckpoint}>
            Add Breakpoint
          </Button>
        </div>

        {/* Preview table */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Preview</span>
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
