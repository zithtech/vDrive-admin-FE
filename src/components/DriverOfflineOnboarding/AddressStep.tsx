import React from "react";
import { Input, Select } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";

export interface AddressDetails {
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

interface Props {
  data: AddressDetails;
  onChange: (data: Partial<AddressDetails>) => void;
  errors: Record<string, string>;
}

const STATE_OPTIONS = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry", "Chandigarh",
  "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep",
].map((s) => ({ value: s, label: s }));

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

const AddressStep: React.FC<Props> = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
          <EnvironmentOutlined className="text-lg" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white m-0">
            Address Details
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Enter the driver's residential address
          </p>
        </div>
      </div>

      {/* Street Address */}
      <Field label="Street Address" required error={errors.street}>
        <Input.TextArea
          placeholder="Enter full street address (house no, street, landmark)"
          value={data.street}
          onChange={(e) => onChange({ street: e.target.value })}
          className="rounded-lg"
          rows={2}
          status={errors.street ? "error" : undefined}
        />
      </Field>

      {/* City & State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="City" required error={errors.city}>
          <Input
            size="large"
            placeholder="Enter city"
            value={data.city}
            onChange={(e) => onChange({ city: e.target.value })}
            className="rounded-lg"
            status={errors.city ? "error" : undefined}
          />
        </Field>
        <Field label="State" required error={errors.state}>
          <Select
            size="large"
            placeholder="Select state"
            options={STATE_OPTIONS}
            value={data.state || undefined}
            onChange={(val) => onChange({ state: val })}
            className="w-full rounded-lg"
            showSearch
            optionFilterProp="label"
            status={errors.state ? "error" : undefined}
          />
        </Field>
      </div>

      {/* Country & Pincode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Country" required error={errors.country}>
          <Input
            size="large"
            placeholder="Enter country"
            value={data.country}
            onChange={(e) => onChange({ country: e.target.value })}
            className="rounded-lg"
            status={errors.country ? "error" : undefined}
          />
        </Field>
        <Field label="Pincode" required error={errors.pincode}>
          <Input
            size="large"
            placeholder="e.g. 600001"
            value={data.pincode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 6);
              onChange({ pincode: val });
            }}
            className="rounded-lg"
            status={errors.pincode ? "error" : undefined}
            maxLength={6}
          />
        </Field>
      </div>
    </div>
  );
};

export default AddressStep;
