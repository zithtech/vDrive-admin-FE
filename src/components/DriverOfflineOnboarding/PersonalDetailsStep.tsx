import React from "react";
import { Input, Select, DatePicker } from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

export interface PersonalDetails {
  first_name: string;
  last_name: string;
  phone_number: string;
  alternate_contact: string;
  email: string;
  date_of_birth: string;
  gender: string;
  language: string;
}

interface Props {
  data: PersonalDetails;
  onChange: (data: Partial<PersonalDetails>) => void;
  errors: Record<string, string>;
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "kn", label: "Kannada" },
  { value: "ml", label: "Malayalam" },
  { value: "mr", label: "Marathi" },
  { value: "bn", label: "Bengali" },
  { value: "gu", label: "Gujarati" },
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

const PersonalDetailsStep: React.FC<Props> = ({ data, onChange, errors }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
          <UserOutlined className="text-lg" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white m-0">
            Personal Details
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Enter the driver's personal information
          </p>
        </div>
      </div>

      {/* Name Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="First Name" required error={errors.first_name}>
          <Input
            size="large"
            prefix={<UserOutlined className="text-slate-400" />}
            placeholder="Enter first name"
            value={data.first_name}
            onChange={(e) => onChange({ first_name: e.target.value })}
            className="rounded-lg"
            status={errors.first_name ? "error" : undefined}
          />
        </Field>
        <Field label="Last Name" required error={errors.last_name}>
          <Input
            size="large"
            prefix={<UserOutlined className="text-slate-400" />}
            placeholder="Enter last name"
            value={data.last_name}
            onChange={(e) => onChange({ last_name: e.target.value })}
            className="rounded-lg"
            status={errors.last_name ? "error" : undefined}
          />
        </Field>
      </div>

      {/* Contact Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Phone Number" required error={errors.phone_number}>
          <Input
            size="large"
            prefix={<PhoneOutlined className="text-slate-400" />}
            placeholder="e.g. 9876543210"
            value={data.phone_number}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
              onChange({ phone_number: val });
            }}
            className="rounded-lg"
            status={errors.phone_number ? "error" : undefined}
            maxLength={10}
          />
        </Field>
        <Field label="Alternate Contact">
          <Input
            size="large"
            prefix={<PhoneOutlined className="text-slate-400" />}
            placeholder="Optional alternate number"
            value={data.alternate_contact}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
              onChange({ alternate_contact: val });
            }}
            className="rounded-lg"
            maxLength={10}
          />
        </Field>
      </div>

      {/* Email */}
      <Field label="Email Address" required error={errors.email}>
        <Input
          size="large"
          prefix={<MailOutlined className="text-slate-400" />}
          placeholder="driver@example.com"
          value={data.email}
          onChange={(e) => onChange({ email: e.target.value })}
          className="rounded-lg"
          status={errors.email ? "error" : undefined}
          type="email"
        />
      </Field>

      {/* DOB, Gender, Language Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Field label="Date of Birth" required error={errors.date_of_birth}>
          <DatePicker
            size="large"
            placeholder="Select DOB"
            className="w-full rounded-lg"
            suffixIcon={<CalendarOutlined className="text-slate-400" />}
            value={data.date_of_birth ? dayjs(data.date_of_birth) : null}
            onChange={(date) =>
              onChange({
                date_of_birth: date ? date.format("YYYY-MM-DD") : "",
              })
            }
            disabledDate={(current) =>
              current && current > dayjs().subtract(18, "year")
            }
            status={errors.date_of_birth ? "error" : undefined}
            format="DD/MM/YYYY"
          />
        </Field>
        <Field label="Gender" required error={errors.gender}>
          <Select
            size="large"
            placeholder="Select gender"
            options={GENDER_OPTIONS}
            value={data.gender || undefined}
            onChange={(val) => onChange({ gender: val })}
            className="w-full rounded-lg"
            status={errors.gender ? "error" : undefined}
          />
        </Field>
        <Field label="Language">
          <Select
            size="large"
            placeholder="Select language"
            options={LANGUAGE_OPTIONS}
            value={data.language || undefined}
            onChange={(val) => onChange({ language: val })}
            className="w-full rounded-lg"
            showSearch
            optionFilterProp="label"
          />
        </Field>
      </div>
    </div>
  );
};

export default PersonalDetailsStep;
