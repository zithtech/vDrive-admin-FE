import React, { useState, useCallback } from "react";
import { Upload, Input, message, Spin } from "antd";
import {
  FileTextOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";
import axiosIns from "../../api/axios";

export interface DocumentItem {
  document_type: string;
  document_number: string;
  document_url: any;
  expiry_date?: string;
  label: string;
  hasFrontBack: boolean;
  frontUrl?: string;
  backUrl?: string;
  previewFrontUrl?: string;
  previewBackUrl?: string;
}

interface Props {
  documents: DocumentItem[];
  onChange: (documents: DocumentItem[]) => void;
  errors: Record<string, string>;
}

const DOCUMENT_CONFIGS = [
  {
    type: "aadhaar_card",
    label: "Aadhaar Card",
    hasFrontBack: true,
    icon: "🆔",
    color: "from-orange-500 to-amber-600",
    shadow: "shadow-orange-500/25",
  },
  {
    type: "pan_card",
    label: "PAN Card",
    hasFrontBack: false,
    icon: "💳",
    color: "from-blue-500 to-cyan-600",
    shadow: "shadow-blue-500/25",
  },
  {
    type: "driving_license",
    label: "Driving License",
    hasFrontBack: true,
    icon: "🪪",
    color: "from-emerald-500 to-green-600",
    shadow: "shadow-emerald-500/25",
  },
  {
    type: "profile_selfie",
    label: "Profile Selfie",
    hasFrontBack: false,
    icon: "📸",
    color: "from-pink-500 to-rose-600",
    shadow: "shadow-pink-500/25",
  },
  {
    type: "rc_document",
    label: "RC Document",
    hasFrontBack: false,
    icon: "🚗",
    color: "from-violet-500 to-purple-600",
    shadow: "shadow-violet-500/25",
    optional: true,
  },
];

const UploadCard: React.FC<{
  label: string;
  imageUrl?: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}> = ({ label, imageUrl, uploading, onUpload, onRemove }) => {
  const handleBeforeUpload = (file: any) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Only image files are allowed");
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Image must be smaller than 5MB");
      return false;
    }
    onUpload(file);
    return false; // prevent default upload
  };

  if (imageUrl) {
    return (
      <div className="relative group rounded-xl overflow-hidden border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/20">
        <img
          src={imageUrl}
          alt={label}
          className="w-full h-36 object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <button
            onClick={onRemove}
            className="w-9 h-9 rounded-full bg-white/90 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-lg"
          >
            <DeleteOutlined />
          </button>
        </div>
        <div className="absolute top-2 right-2">
          <CheckCircleFilled className="text-emerald-500 text-lg drop-shadow-md" />
        </div>
        <div className="px-3 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            {label} ✓
          </span>
        </div>
      </div>
    );
  }

  return (
    <Upload.Dragger
      beforeUpload={handleBeforeUpload}
      showUploadList={false}
      disabled={uploading}
      className="!rounded-xl !border-dashed !border-2 !border-slate-300 dark:!border-slate-600 hover:!border-blue-400 dark:hover:!border-blue-500 !bg-slate-50/50 dark:!bg-slate-800/30 !transition-all"
    >
      <div className="flex flex-col items-center gap-2 py-3">
        {uploading ? (
          <Spin />
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
              <CloudUploadOutlined className="text-xl" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {label}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Click or drag to upload
            </span>
          </>
        )}
      </div>
    </Upload.Dragger>
  );
};

const DocumentUploadStep: React.FC<Props> = ({
  documents,
  onChange,
  errors,
}) => {
  const [uploadingState, setUploadingState] = useState<Record<string, boolean>>(
    {},
  );

  const uploadToS3 = useCallback(
    async (file: File, docType: string, side?: string): Promise<string> => {
      const key = `drivers/documents/${docType}/${Date.now()}_${side || "file"}_${file.name}`;
      const contentType = file.type || "image/jpeg";

      // 1. Get presigned URL
      const presignRes = await axiosIns.post("/api/generate-presigned-url", {
        key,
        contentType,
      });

      const presignData = presignRes.data?.data || presignRes.data;
      const uploadUrl = presignData?.uploadUrl || presignData?.url;
      const fileUrl = presignData?.fileUrl || presignData?.key;

      if (!uploadUrl) {
        throw new Error("Failed to get upload URL");
      }

      // 2. Upload to S3
      try {
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed with status: ${uploadRes.status} ${uploadRes.statusText}`);
        }
      } catch (err: any) {
        console.error("Fetch failed, possibly due to CORS or network issue. URL:", uploadUrl, "Error:", err);
        throw new Error(err.message === "Failed to fetch" ? "Network error or CORS issue. Please check S3 bucket CORS configuration." : err.message);
      }

      return fileUrl || key;
    },
    [],
  );

  const handleUpload = useCallback(
    async (
      docType: string,
      file: File,
      side?: "front" | "back",
    ) => {
      const uploadKey = `${docType}_${side || "file"}`;
      setUploadingState((prev) => ({ ...prev, [uploadKey]: true }));

      try {
        const fileUrl = await uploadToS3(file, docType, side);

        const updatedDocs = documents.map((doc) => {
          if (doc.document_type !== docType) return doc;

          if (doc.hasFrontBack && side) {
            const newDoc = { ...doc };
            const previewUrl = URL.createObjectURL(file);
            if (side === "front") {
              newDoc.frontUrl = fileUrl;
              newDoc.previewFrontUrl = previewUrl;
            } else {
              newDoc.backUrl = fileUrl;
              newDoc.previewBackUrl = previewUrl;
            }
            // Combine into document_url object
            newDoc.document_url = {
              front: newDoc.frontUrl || "",
              back: newDoc.backUrl || "",
            };
            return newDoc;
          } else {
            return { 
                ...doc, 
                document_url: fileUrl, 
                frontUrl: fileUrl, 
                previewFrontUrl: URL.createObjectURL(file) 
            };
          }
        });

        onChange(updatedDocs);
        message.success(`${side || "File"} uploaded successfully`);
      } catch (err: any) {
        console.error("Upload error:", err);
        message.error(`Upload failed: ${err.message || "Unknown error"}`);
      } finally {
        setUploadingState((prev) => ({ ...prev, [uploadKey]: false }));
      }
    },
    [documents, onChange, uploadToS3],
  );

  const handleRemove = useCallback(
    (docType: string, side?: "front" | "back") => {
      const updatedDocs = documents.map((doc) => {
        if (doc.document_type !== docType) return doc;

        if (doc.hasFrontBack && side) {
          const newDoc = { ...doc };
            if (side === "front") {
              newDoc.frontUrl = undefined;
              newDoc.previewFrontUrl = undefined;
            } else {
              newDoc.backUrl = undefined;
              newDoc.previewBackUrl = undefined;
            }
            newDoc.document_url = {
              front: newDoc.frontUrl || "",
              back: newDoc.backUrl || "",
            };
            return newDoc;
          } else {
            return { ...doc, document_url: "", frontUrl: undefined, previewFrontUrl: undefined };
          }
      });
      onChange(updatedDocs);
    },
    [documents, onChange],
  );

  const handleNumberChange = useCallback(
    (docType: string, value: string) => {
      const updatedDocs = documents.map((doc) =>
        doc.document_type === docType
          ? { ...doc, document_number: value }
          : doc,
      );
      onChange(updatedDocs);
    },
    [documents, onChange],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
          <FileTextOutlined className="text-lg" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white m-0">
            Document Upload
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 m-0">
            Upload the driver's identity and vehicle documents
          </p>
        </div>
      </div>

      {/* Document Cards */}
      <div className="space-y-6">
        {DOCUMENT_CONFIGS.map((config) => {
          const doc = documents.find(
            (d) => d.document_type === config.type,
          );
          const docError = errors[config.type];

          return (
            <div
              key={config.type}
              className={`p-5 rounded-2xl border ${
                docError
                  ? "border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-900/10"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
              } transition-all`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center text-white text-sm shadow-md ${config.shadow}`}
                  >
                    {config.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white m-0">
                      {config.label}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {config.optional ? "Optional" : "Required"}
                    </span>
                  </div>
                </div>
                {docError && (
                  <span className="text-[10px] text-rose-500 font-semibold bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-full">
                    {docError}
                  </span>
                )}
              </div>

              {/* Document Number Input */}
              {config.type !== "profile_selfie" && (
                <div className="mb-4">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Document Number
                  </label>
                  <Input
                    size="middle"
                    placeholder={`Enter ${config.label} number`}
                    value={doc?.document_number || ""}
                    onChange={(e) =>
                      handleNumberChange(config.type, e.target.value)
                    }
                    className="rounded-lg"
                  />
                </div>
              )}

              {/* Upload Areas */}
              {config.hasFrontBack ? (
                <div className="grid grid-cols-2 gap-4">
                  <UploadCard
                    label="Front Side"
                    imageUrl={doc?.previewFrontUrl || doc?.frontUrl}
                    uploading={
                      uploadingState[`${config.type}_front`] || false
                    }
                    onUpload={(file) =>
                      handleUpload(config.type, file, "front")
                    }
                    onRemove={() => handleRemove(config.type, "front")}
                  />
                  <UploadCard
                    label="Back Side"
                    imageUrl={doc?.previewBackUrl || doc?.backUrl}
                    uploading={
                      uploadingState[`${config.type}_back`] || false
                    }
                    onUpload={(file) =>
                      handleUpload(config.type, file, "back")
                    }
                    onRemove={() => handleRemove(config.type, "back")}
                  />
                </div>
              ) : (
                <div className="max-w-xs">
                  <UploadCard
                    label={
                      config.type === "profile_selfie"
                        ? "Take / Upload Photo"
                        : "Upload Image"
                    }
                    imageUrl={doc?.previewFrontUrl || doc?.frontUrl}
                    uploading={
                      uploadingState[`${config.type}_file`] || false
                    }
                    onUpload={(file) => handleUpload(config.type, file)}
                    onRemove={() => handleRemove(config.type)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export { DOCUMENT_CONFIGS };
export default DocumentUploadStep;
