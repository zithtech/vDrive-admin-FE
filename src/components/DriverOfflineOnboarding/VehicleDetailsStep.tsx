import React from "react";
import { Input, Select, DatePicker } from "antd";
import { CarOutlined, CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

export interface VehicleDetails {
  vehicle_number: string;
  vehicle_type: string;
  vehicle_model: string;
  fuel_type: string;
  registration_date: string;
  insurance_expiry: string;
}

interface Props {
  data: VehicleDetails;
  onChange: (data: Partial<VehicleDetails>) => void;
  errors: Record<string, string>;
}

const VEHICLE_TYPE_OPTIONS = [
  { value: "auto", label: "Auto Rickshaw" },
  { value: "mini", label: "Mini (Hatchback)" },
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "luxury", label: "Luxury" },
  { value: "bike", label: "Bike" },
];

const FUEL_TYPE_OPTIONS = [
  { value: "petrol", label: "Petrol" },
  { value: "diesel", label: "Diesel" },
  { value: "cng", label: "CNG" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
];

const Field = ({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && (
      <span className="text-[11px] text-rose-500 font-medium">{error}</span>
    )}
  </div>
);

const VehicleDetailsStep: React.FC<Props> = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25">
          <CarOutlined className="text-lg" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white m-0">
            Vehicle Details
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Enter the driver's vehicle information
          </p>
        </div>
      </div>

      {/* Vehicle Number & Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Vehicle Number" required error={errors.vehicle_number}>
          <Input
            size="large"
            prefix={<CarOutlined className="text-slate-400" />}
            placeholder="e.g. TN 01 AB 1234"
            value={data.vehicle_number}
            onChange={(e) =>
              onChange({ vehicle_number: e.target.value.toUpperCase() })
            }
            className="rounded-lg"
            status={errors.vehicle_number ? "error" : undefined}
          />
        </Field>
        <Field label="Vehicle Type" required error={errors.vehicle_type}>
          <Select
            size="large"
            placeholder="Select vehicle type"
            options={VEHICLE_TYPE_OPTIONS}
            value={data.vehicle_type || undefined}
            onChange={(val) => onChange({ vehicle_type: val })}
            className="w-full rounded-lg"
            status={errors.vehicle_type ? "error" : undefined}
          />
        </Field>
      </div>

      {/* Model & Fuel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Vehicle Model" required error={errors.vehicle_model}>
          <Input
            size="large"
            placeholder="e.g. Maruti Swift Dzire"
            value={data.vehicle_model}
            onChange={(e) => onChange({ vehicle_model: e.target.value })}
            className="rounded-lg"
            status={errors.vehicle_model ? "error" : undefined}
          />
        </Field>
        <Field label="Fuel Type" required error={errors.fuel_type}>
          <Select
            size="large"
            placeholder="Select fuel type"
            options={FUEL_TYPE_OPTIONS}
            value={data.fuel_type || undefined}
            onChange={(val) => onChange({ fuel_type: val })}
            className="w-full rounded-lg"
            status={errors.fuel_type ? "error" : undefined}
          />
        </Field>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field
          label="Registration Date"
          required
          error={errors.registration_date}
        >
          <DatePicker
            size="large"
            placeholder="Select date"
            className="w-full rounded-lg"
            suffixIcon={<CalendarOutlined className="text-slate-400" />}
            value={
              data.registration_date ? dayjs(data.registration_date) : null
            }
            onChange={(date) =>
              onChange({
                registration_date: date ? date.format("YYYY-MM-DD") : "",
              })
            }
            status={errors.registration_date ? "error" : undefined}
            format="DD/MM/YYYY"
          />
        </Field>
        <Field
          label="Insurance Expiry"
          required
          error={errors.insurance_expiry}
        >
          <DatePicker
            size="large"
            placeholder="Select expiry date"
            className="w-full rounded-lg"
            suffixIcon={<CalendarOutlined className="text-slate-400" />}
            value={
              data.insurance_expiry ? dayjs(data.insurance_expiry) : null
            }
            onChange={(date) =>
              onChange({
                insurance_expiry: date ? date.format("YYYY-MM-DD") : "",
              })
            }
            disabledDate={(current) =>
              current && current < dayjs().startOf("day")
            }
            status={errors.insurance_expiry ? "error" : undefined}
            format="DD/MM/YYYY"
          />
        </Field>
      </div>
    </div>
  );
};

export default VehicleDetailsStep;
