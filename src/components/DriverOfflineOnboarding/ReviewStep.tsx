import React from "react";
import {
  UserOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  CheckCircleFilled,
  EditOutlined,
  CloseCircleFilled,
} from "@ant-design/icons";
import type { PersonalDetails } from "./PersonalDetailsStep";
import type { AddressDetails } from "./AddressStep";
import type { DocumentItem } from "./DocumentUploadStep";
import { DOCUMENT_CONFIGS } from "./DocumentUploadStep";

interface Props {
  personalDetails: PersonalDetails;
  address: AddressDetails;
  documents: DocumentItem[];
  onEditStep: (step: number) => void;
}

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  stepIndex: number;
  gradientClass: string;
  shadowClass: string;
  onEdit: () => void;
  children: React.ReactNode;
}> = ({ icon, title, gradientClass, shadowClass, onEdit, children }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3 bg-slate-50/50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white shadow-md ${shadowClass}`}
        >
          {icon}
        </div>
        <h4 className="text-sm font-bold text-slate-800 dark:text-white m-0">
          {title}
        </h4>
      </div>
      <button
        onClick={onEdit}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all"
      >
        <EditOutlined className="text-[10px]" />
        Edit
      </button>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
      {label}
    </span>
    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
      {value || "—"}
    </span>
  </div>
);

const ReviewStep: React.FC<Props> = ({
  personalDetails,
  address,
  documents,
  onEditStep,
}) => {
  const hasAllRequiredDocs = () => {
    const requiredTypes = ["aadhaar_card", "pan_card", "driving_license", "profile_selfie"];
    return requiredTypes.every((type) => {
      const doc = documents.find((d) => d.document_type === type);
      if (!doc) return false;
      if (doc.hasFrontBack) {
        return doc.frontUrl && doc.backUrl;
      }
      return doc.frontUrl || doc.document_url;
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
          <CheckCircleFilled className="text-lg" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white m-0">
            Review & Submit
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Verify all details before creating the driver account
          </p>
        </div>
      </div>

      {/* Status Banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800">
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white flex-shrink-0">
          <CheckCircleFilled className="text-sm" />
        </div>
        <div>
          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 m-0">
            Auto-Approved Onboarding
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 m-0">
            Driver will be set as <strong>Active</strong> with KYC{" "}
            <strong>Verified</strong>. They can log in immediately after
            installation.
          </p>
        </div>
      </div>

      {/* Personal Details */}
      <SectionCard
        icon={<UserOutlined className="text-xs" />}
        title="Personal Details"
        stepIndex={0}
        gradientClass="from-blue-500 to-indigo-600"
        shadowClass="shadow-blue-500/25"
        onEdit={() => onEditStep(0)}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoRow
            label="Full Name"
            value={`${personalDetails.first_name} ${personalDetails.last_name}`}
          />
          <InfoRow label="Phone" value={personalDetails.phone_number} />
          <InfoRow label="Email" value={personalDetails.email} />
          <InfoRow label="Date of Birth" value={personalDetails.date_of_birth} />
          <InfoRow
            label="Gender"
            value={personalDetails.gender?.charAt(0).toUpperCase() + personalDetails.gender?.slice(1)}
          />
          <InfoRow
            label="Language"
            value={personalDetails.language?.toUpperCase() || "EN"}
          />
          {personalDetails.alternate_contact && (
            <InfoRow
              label="Alternate Contact"
              value={personalDetails.alternate_contact}
            />
          )}
        </div>
      </SectionCard>

      {/* Address */}
      <SectionCard
        icon={<EnvironmentOutlined className="text-xs" />}
        title="Address"
        stepIndex={1}
        gradientClass="from-emerald-500 to-teal-600"
        shadowClass="shadow-emerald-500/25"
        onEdit={() => onEditStep(1)}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoRow label="Street" value={address.street} />
          <InfoRow label="City" value={address.city} />
          <InfoRow label="State" value={address.state} />
          <InfoRow label="Country" value={address.country} />
          <InfoRow label="Pincode" value={address.pincode} />
        </div>
      </SectionCard>

      {/* Documents */}
      <SectionCard
        icon={<FileTextOutlined className="text-xs" />}
        title="Documents"
        stepIndex={2}
        gradientClass="from-amber-500 to-orange-600"
        shadowClass="shadow-amber-500/25"
        onEdit={() => onEditStep(2)}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {DOCUMENT_CONFIGS.map((config) => {
            const doc = documents.find(
              (d) => d.document_type === config.type,
            );
            const isUploaded = doc?.hasFrontBack
              ? doc.frontUrl && doc.backUrl
              : doc?.frontUrl || doc?.document_url;

            return (
              <div
                key={config.type}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  isUploaded
                    ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20"
                    : config.optional
                      ? "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30"
                      : "border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/20"
                }`}
              >
                <span className="text-lg">{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-white m-0 truncate">
                    {config.label}
                  </p>
                  {doc?.document_number && (
                    <p className="text-[10px] text-slate-400 m-0 truncate">
                      {doc.document_number}
                    </p>
                  )}
                </div>
                {isUploaded ? (
                  <CheckCircleFilled className="text-emerald-500 text-base flex-shrink-0" />
                ) : config.optional ? (
                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                    Skip
                  </span>
                ) : (
                  <CloseCircleFilled className="text-rose-400 text-base flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
        {!hasAllRequiredDocs() && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold m-0">
              ⚠ Some required documents are missing. Please go back and upload
              them.
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default ReviewStep;
