import React, { useState } from "react";
import { Typography, Select } from "antd";

interface PaymentMethod {
  name: string;
  amount: number;
  percentage: number;
  icon: React.ReactNode;
}

interface PaymentMethodsProps {
  methods: PaymentMethod[];
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({ methods }) => {
  const [period, setPeriod] = useState<string>("this_week");

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col flex-1 w-full">
      <div className="flex justify-between items-center mb-4">
        <Typography.Title level={5} className="!m-0 text-gray-800 dark:text-gray-200 font-bold text-sm">
          Payment Methods
        </Typography.Title>
        <Select
          value={period}
          onChange={(val) => setPeriod(val)}
          variant="borderless"
          className="bg-gray-50 dark:bg-slate-700 rounded-lg min-w-[100px]"
          options={[
            { value: "this_week", label: "This Week" },
            { value: "last_week", label: "Last Week" },
          ]}
          size="small"
        />
      </div>
      
      <div className="flex flex-col gap-4">
        {methods.map((method, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gray-50 dark:bg-slate-700 flex items-center justify-center shrink-0 text-blue-500">
              {method.icon}
            </div>
            <div className="flex flex-col flex-1 gap-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{method.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-800 dark:text-white">₹{method.amount.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 bg-gray-50 dark:bg-slate-700 px-1 rounded">{method.percentage}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full" 
                  style={{ width: `${method.percentage}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethods;
