import React from "react";
import { Select } from "antd";

interface PlanDistribution {
  name: string;
  amount: number;
  percentage: number;
  color: string;
}

interface PlanDistributionProgressProps {
  data: PlanDistribution[];
}

const PlanDistributionProgress: React.FC<PlanDistributionProgressProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-5 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-slate-800">Subscription by Plan</h2>
        <Select
          defaultValue="This Month"
          options={[{ value: "This Month", label: "This Month" }]}
          className="w-32"
        />
      </div>

      <div className="flex-grow space-y-6 flex flex-col justify-center">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-semibold text-slate-700">{item.name}</span>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-800 mr-2">{formatCurrency(item.amount)}</span>
                <span className="text-xs text-slate-500">({item.percentage}%)</span>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full" 
                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanDistributionProgress;
