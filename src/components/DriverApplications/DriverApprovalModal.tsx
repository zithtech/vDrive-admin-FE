import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Tag,
  Divider,
  message,
  Space,
  Select,
  Input,
  Alert,
  Spin,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  RotateRightOutlined,
  FileTextOutlined,
  CarOutlined,
  CopyOutlined,
  ReloadOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Loader2, Sparkles } from "lucide-react";
import { useAppDispatch } from "../../store/hooks";
import {
  updateDriverStatus,
  updateDocumentStatus,
  verifyDriverAccount,
  fetchDrivers,
  runDocumentOCR,
  fetchDocumentHistory,
} from "../../store/slices/driverSlice";
import type { Driver } from "../../store/slices/driverSlice";
import { getMediaUrl } from "../DriverDetails/DriverDetails";

interface DriverApprovalModalProps {
  driver: Driver | null;
  open: boolean;
  onClose: () => void;
}

const DriverApprovalModal: React.FC<DriverApprovalModalProps> = ({ driver, open, onClose }) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  // Image controls
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Rejection state
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [isRejectingDoc, setIsRejectingDoc] = useState(false);
  const [docRejectReason, setDocRejectReason] = useState<string>("");
  const [isOCRRunning, setIsOCRRunning] = useState(false);

  const [historyModalDoc, setHistoryModalDoc] = useState<{ id: string; type: string } | null>(null);
  const [documentHistory, setDocumentHistory] = useState<any[]>([]);

  useEffect(() => {
    if (open && driver) {
      setScale(1);
      setRotation(0);
      setIsRejecting(false);
      setRejectReason("");

      const allDocs = getCombinedDocuments(driver);
      if (allDocs.length > 0) {
        setSelectedDoc(allDocs[0]);
      } else {
        setSelectedDoc(null);
      }
    }
  }, [open, driver]);

  useEffect(() => {
    if (
      selectedDoc &&
      selectedDoc.status === "pending" &&
      !selectedDoc.extracted_data &&
      !isOCRRunning &&
      !selectedDoc.isVehicle
    ) {
      setIsOCRRunning(true);
      let imageUrl = selectedDoc.url;
      if (typeof imageUrl === "object" && imageUrl !== null) {
        imageUrl = imageUrl.front || imageUrl.url || imageUrl.back;
      }

      if (imageUrl && typeof imageUrl === "string") {
        dispatch(
          runDocumentOCR({
            document_id: selectedDoc.id,
            image_url: imageUrl,
            document_type: selectedDoc.type,
          }),
        ).finally(() => setIsOCRRunning(false));
      } else {
        setIsOCRRunning(false);
      }
    }
  }, [selectedDoc?.id]);

  if (!driver) return null;

  const getCombinedDocuments = (d: Driver) => {
    const docs: any[] = [];
    if (d.documents && Array.isArray(d.documents)) {
      docs.push(
        ...d.documents.map((doc) => ({
          ...doc,
          id: doc.document_id,
          type: doc.document_type || "Document",
          url: doc.document_url,
          number: doc.document_number,
          status: doc.license_status || (doc as any).status || "pending",
          rejection_reason: doc.rejection_reason,
          isVehicle: false,
        })),
      );
    }
    if (d.vehicle?.rc_document_url) {
      docs.push({
        id: "rc_" + d.vehicle.vehicle_id,
        type: "Vehicle RC",
        url: d.vehicle.rc_document_url,
        number: d.vehicle.vehicle_number,
        status: d.vehicle.status ? "verified" : "pending",
        isVehicle: true,
      });
    }
    return docs;
  };

  const combinedDocs = getCombinedDocuments(driver);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleRetryOCR = () => {
    if (!selectedDoc) return;
    setIsOCRRunning(true);
    let imageUrl = selectedDoc.url;
    if (typeof imageUrl === "object" && imageUrl !== null) {
      imageUrl = imageUrl.front || imageUrl.url || imageUrl.back;
    }

    if (imageUrl && typeof imageUrl === "string") {
      dispatch(
        runDocumentOCR({
          document_id: selectedDoc.id,
          image_url: imageUrl,
          document_type: selectedDoc.type,
        }),
      ).finally(() => setIsOCRRunning(false));
    } else {
      setIsOCRRunning(false);
    }
  };

  const handleShowHistory = async (docId: string, type: string) => {
    setHistoryModalDoc({ id: docId, type });
    setLoading(true);
    try {
      const result = await dispatch(fetchDocumentHistory(docId)).unwrap();
      setDocumentHistory(result);
    } catch (err: any) {
      message.error(err || "Failed to fetch history");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDriver = async () => {
    try {
      setLoading(true);
      const driverId = driver.driver_id || driver.id || "";
      await dispatch(
        updateDriverStatus({
          driver_id: driverId,
          status: "active",
        }),
      ).unwrap();
      try {
        await dispatch(verifyDriverAccount(driverId)).unwrap();
      } catch (e) {
        console.log("Verify endpoint might not be needed or failed:", e);
      }

      message.success(`Driver ${driver.full_name} approved successfully!`);
      dispatch(fetchDrivers());
      onClose();
    } catch (error: any) {
      message.error(error || "Failed to approve driver");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectDriver = async () => {
    if (!rejectReason) {
      message.error("Please provide a rejection reason.");
      return;
    }
    try {
      setLoading(true);
      const driverId = driver.driver_id || driver.id || "";
      await dispatch(
        updateDriverStatus({
          driver_id: driverId,
          status: "rejected",
          status_reason: rejectReason,
        }),
      ).unwrap();
      message.success(`Driver ${driver.full_name} application rejected.`);
      dispatch(fetchDrivers());
      onClose();
    } catch (error: any) {
      message.error(error || "Failed to reject driver");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySingleDoc = async (status: string) => {
    if (!selectedDoc || selectedDoc.isVehicle) {
      message.info("Vehicle RC verification should be handled separately or visually.");
      return;
    }
    if (status === "rejected" && !docRejectReason) {
      message.error("Please provide a rejection reason.");
      return;
    }
    try {
      setLoading(true);
      const driverId = driver.driver_id || driver.id || "";
      await dispatch(
        updateDocumentStatus({
          driver_id: driverId,
          document_id: selectedDoc.id,
          status: status,
          reason: status === "rejected" ? docRejectReason : undefined,
        }),
      ).unwrap();

      message.success(`Document marked as ${status}`);
      setSelectedDoc({ ...selectedDoc, status });
      setIsRejectingDoc(false);
      setDocRejectReason("");
    } catch (error: any) {
      message.error(error || "Failed to verify document");
    } finally {
      setLoading(false);
    }
  };

  const REJECTION_REASONS = [
    "Blurry/Unreadable Document",
    "Expired Document",
    "Name Mismatch",
    "Invalid Vehicle Information",
    "Background Check Failed",
  ];

  return (
    <Modal
      closable={true}
      open={open}
      onCancel={onClose}
      width={1300}
      centered
      footer={null}
      destroyOnClose
      className="premium-approval-modal"
      styles={{ body: { paddingBottom: 0, padding: 0 } }}
    >
      <div className="p-6 pb-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <CheckCircleOutlined className="text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-black m-0 text-slate-800 dark:text-slate-100">
              Review Application
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium m-0">
              Awaiting Admin Approval
            </p>
          </div>
        </div>
      </div>

      <div className="flex h-[65vh] min-h-[500px] border-t border-slate-100 dark:border-slate-800 mt-4 mx-6">
        <div className="w-1/3 border-r border-slate-100 dark:border-slate-800 pr-6 pt-4 flex flex-col h-full overflow-y-auto pb-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center gap-4 border border-slate-200 dark:border-slate-700">
            <img
              src={
                getMediaUrl(driver.profile_pic_url) ||
                "https://ui-avatars.com/api/?name=" + driver.full_name
              }
              alt={driver.full_name}
              className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-700 shadow-sm"
            />
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 m-0 leading-tight">
                {driver.full_name}
              </h3>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 m-0 mt-0.5 flex items-center gap-1 group">
                {driver.phone_number}
                <CopyOutlined
                  className="cursor-pointer text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    navigator.clipboard.writeText(driver.phone_number);
                    message.success("Phone number copied!");
                  }}
                />
              </p>
              <div className="flex gap-2 mt-1.5">
                <Tag color="blue" className="m-0 text-[10px] uppercase font-bold border-0">
                  New Driver
                </Tag>
              </div>
            </div>
          </div>

          {/* Full Driver Details */}
          <div className="mt-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">
                Driver ID
              </span>
              <span className="text-slate-800 dark:text-slate-100 font-mono font-bold flex items-center gap-1 group">
                {(driver as any).vdrive_id || driver.id?.substring(0, 8)}
                <CopyOutlined
                  className="cursor-pointer text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    navigator.clipboard.writeText((driver as any).vdrive_id || driver.id || "");
                    message.success("Driver ID copied!");
                  }}
                />
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">
                Alt Phone
              </span>
              <span className="text-slate-800 dark:text-slate-100 font-bold">
                {driver.alternate_contact || "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">
                Email
              </span>
              <span
                className="text-slate-800 dark:text-slate-100 font-bold truncate max-w-[140px]"
                title={driver.email}
              >
                {driver.email || "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">
                DOB
              </span>
              <span className="text-slate-800 dark:text-slate-100 font-bold">
                {driver.dob || (driver as any).date_of_birth || "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">
                Gender
              </span>
              <span className="text-slate-800 dark:text-slate-100 font-bold capitalize">
                {driver.gender || "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-50 dark:border-slate-700/50">
              <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">
                Role
              </span>
              <span className="text-slate-800 dark:text-slate-100 font-bold capitalize">
                {driver.role || "Normal"}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">
                Status
              </span>
              <Tag
                className="m-0 border-0 font-bold text-[10px] uppercase"
                color={driver.status === "active" ? "green" : "orange"}
              >
                {driver.status}
              </Tag>
            </div>
            <div className="flex flex-col gap-1 text-[11px] pt-1.5 border-t border-slate-50 dark:border-slate-700/50">
              <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">
                Full Address
              </span>
              <span className="text-slate-800 dark:text-slate-100 font-medium leading-tight">
                {driver.address
                  ? `${driver.address.street || ""}, ${driver.address.city || ""}, ${driver.address.state || ""} - ${driver.address.pincode || ""}`
                  : "N/A"}
              </span>
            </div>
            <div className="flex flex-col gap-1 text-[11px] pt-1.5 border-t border-slate-50 dark:border-slate-700/50">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">
                  Joined
                </span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">
                  {driver.created_at
                    ? dayjs(driver.created_at).format("DD MMM YYYY, hh:mm A")
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">
                  Last Update
                </span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">
                  {driver.updated_at
                    ? dayjs(driver.updated_at).format("DD MMM YYYY, hh:mm A")
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Vehicle Basic Details (if any) */}
          {driver.vehicle && (
            <div className="mt-3 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                <CarOutlined className="text-orange-500" />
                <span className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest">
                  Vehicle Details
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">
                  Number
                </span>
                <span className="text-slate-800 dark:text-slate-100 font-mono font-bold uppercase">
                  {driver.vehicle.vehicle_number || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">
                  Model
                </span>
                <span className="text-slate-800 dark:text-slate-100 font-bold">
                  {driver.vehicle.vehicle_model || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest">
                  Type / Fuel
                </span>
                <span className="text-slate-800 dark:text-slate-100 font-bold capitalize">
                  {driver.vehicle.vehicle_type || "N/A"} / {driver.vehicle.fuel_type || "N/A"}
                </span>
              </div>
            </div>
          )}

          <Divider className="my-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            Documents ({combinedDocs.length})
          </Divider>

          <div className="flex flex-col gap-2 flex-grow">
            {combinedDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  setSelectedDoc(doc);
                  setScale(1);
                  setRotation(0);
                  setIsRejectingDoc(false);
                  setDocRejectReason("");
                }}
                className={`p-3 rounded-xl cursor-pointer border transition-all duration-200 flex items-center justify-between ${
                  selectedDoc?.id === doc.id
                    ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800 shadow-sm"
                    : "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${doc.isVehicle ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"}`}
                  >
                    {doc.isVehicle ? <CarOutlined /> : <FileTextOutlined />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 m-0 leading-none capitalize">
                      {doc.type.replace(/_/g, " ")}
                    </h4>
                    {!doc.type.toLowerCase().includes("selfie") &&
                      !doc.type.toLowerCase().includes("police") && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono m-0 mt-1 truncate w-32">
                          {doc.extracted_data?.extracted_number || doc.number || "No Number"}
                        </p>
                      )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {doc.status === "verified" && (
                    <CheckCircleOutlined className="text-emerald-500 text-lg" />
                  )}
                  {doc.status === "rejected" && (
                    <CloseCircleOutlined className="text-rose-500 text-lg" />
                  )}
                  {(doc.status === "pending" || !doc.status) && (
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                  <Button
                    type="link"
                    size="small"
                    icon={<HistoryOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowHistory(doc.id, doc.type);
                    }}
                    className="text-[10px] h-auto p-0 flex items-center gap-1 opacity-70 hover:opacity-100"
                  >
                    History
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 pl-6 pt-4 flex flex-col h-full overflow-hidden">
          {selectedDoc ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 m-0 capitalize">
                    {selectedDoc.type.replace(/_/g, " ")}
                  </h3>
                  {isOCRRunning && (
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Loader2 className="animate-spin" size={10} />
                      AI Scanning
                    </span>
                  )}
                </div>
                {!selectedDoc.isVehicle &&
                  (isRejectingDoc ? (
                    <Space>
                      <Select
                        size="small"
                        style={{ width: 140 }}
                        placeholder="Select Reason"
                        options={REJECTION_REASONS.map((r) => ({ label: r, value: r }))}
                        onChange={(v) => setDocRejectReason(v)}
                      />
                      <Input
                        size="small"
                        style={{ width: 140 }}
                        placeholder="Or type custom..."
                        value={docRejectReason}
                        onChange={(e) => setDocRejectReason(e.target.value)}
                      />
                      <Button
                        size="small"
                        onClick={() => {
                          setIsRejectingDoc(false);
                          setDocRejectReason("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="small"
                        danger
                        type="primary"
                        onClick={() => handleVerifySingleDoc("rejected")}
                        loading={loading}
                      >
                        Confirm Reject
                      </Button>
                    </Space>
                  ) : (
                    <Space>
                      <Button
                        size="small"
                        danger
                        onClick={() => setIsRejectingDoc(true)}
                        loading={loading}
                      >
                        Reject
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        className="bg-emerald-500"
                        onClick={() => handleVerifySingleDoc("verified")}
                        loading={loading}
                      >
                        Verify
                      </Button>
                    </Space>
                  ))}
              </div>

              {selectedDoc.status === "rejected" && selectedDoc.rejection_reason && (
                <Alert
                  message={`You rejected this document for: ${selectedDoc.rejection_reason}. Waiting for reupload.`}
                  type="error"
                  showIcon
                  className="mb-4 rounded-xl border-rose-200 bg-rose-50 text-rose-700 "
                />
              )}

              <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 relative overflow-hidden flex items-center justify-center">
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mt">
                  <Button type="text" icon={<ZoomInOutlined />} onClick={handleZoomIn} />
                  <Button type="text" icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
                  <Button type="text" icon={<RotateRightOutlined />} onClick={handleRotate} />
                </div>

                {selectedDoc.url ? (
                  <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
                    <img
                      src={getMediaUrl(selectedDoc.url)}
                      alt={selectedDoc.type}
                      style={{
                        transform: `scale(${scale}) rotate(${rotation}deg)`,
                        transition: "transform 0.2s ease-in-out",
                        transformOrigin: "center center",
                        maxHeight: "100%",
                        maxWidth: "100%",
                        objectFit: "contain",
                      }}
                      className="rounded-lg shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="text-slate-400 dark:text-slate-500 font-medium">
                    No Image Available
                  </div>
                )}
              </div>

              {selectedDoc.extracted_data && (
                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-xl">
                  <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2 mb-3 w-full">
                    <Sparkles className="text-purple-600 dark:text-purple-400" size={16} />
                    AI Document Analysis
                    <Button
                      type="text"
                      size="small"
                      icon={<ReloadOutlined spin={isOCRRunning} />}
                      onClick={handleRetryOCR}
                      className="ml-auto text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                      title="Retry OCR"
                    />
                  </h4>
                  <div
                    className={
                      selectedDoc.type.toLowerCase().includes("license") ||
                      selectedDoc.type.toLowerCase().includes("dl")
                        ? "grid grid-cols-2 gap-4"
                        : "grid grid-cols-1 gap-4"
                    }
                  >
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-purple-100/50 dark:border-purple-800/50">
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">
                        Detected Number
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100">
                        {selectedDoc.extracted_data.extracted_number || "N/A"}
                      </span>
                    </div>
                    {(selectedDoc.type.toLowerCase().includes("license") ||
                      selectedDoc.type.toLowerCase().includes("dl")) && (
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-purple-100/50 dark:border-purple-800/50">
                        <span className="text-xs text-slate-500 dark:text-slate-400 block">
                          Detected Expiry
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {selectedDoc.extracted_data.extracted_expiry || "N/A"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-4">
              <FileTextOutlined className="text-5xl opacity-20" />
              <p>Select a document to review</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 px-6 rounded-b-lg">
        {isRejecting ? (
          <div className="flex-1 flex items-center gap-3 w-full">
            <Select
              className="w-1/3"
              placeholder="Select Reason"
              options={REJECTION_REASONS.map((r) => ({ label: r, value: r }))}
              onChange={(v) => setRejectReason(v)}
            />
            <Input
              className="flex-1"
              placeholder="Or type custom reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <Button onClick={() => setIsRejecting(false)}>Cancel</Button>
            <Button danger type="primary" onClick={handleRejectDriver} loading={loading}>
              Confirm Reject
            </Button>
          </div>
        ) : (
          <>
            <Button
              danger
              type="text"
              className="font-bold hover:bg-rose-50"
              onClick={() => setIsRejecting(true)}
            >
              Reject Application
            </Button>
            <Button
              type="primary"
              size="large"
              className="bg-emerald-500 hover:bg-emerald-600 border-none font-bold px-8 shadow-lg shadow-emerald-500/30"
              icon={<CheckCircleOutlined />}
              onClick={handleApproveDriver}
              loading={loading}
            >
              Approve Driver
            </Button>
          </>
        )}
      </div>

      <Modal
        title={
          <div className="flex items-center gap-2 text-gray-800 dark:text-slate-100">
            <HistoryOutlined className="text-blue-500" />
            <span className="capitalize">
              Document History: {historyModalDoc?.type?.replace(/_/g, " ")}
            </span>
          </div>
        }
        open={!!historyModalDoc}
        onCancel={() => {
          setHistoryModalDoc(null);
          setDocumentHistory([]);
        }}
        footer={null}
        width={500}
        className="premium-modal"
        zIndex={2000}
      >
        <div className="py-4">
          {loading && documentHistory.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-4">
              <Spin size="large" />
              <Typography.Text type="secondary">Fetching audit trail...</Typography.Text>
            </div>
          ) : documentHistory.length > 0 ? (
            <div className="space-y-4">
              {documentHistory.map((item, index) => (
                <div
                  key={item.id || index}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        item.status === "verified"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      }`}
                    >
                      {item.status === "verified" ? (
                        <CheckCircleOutlined />
                      ) : (
                        <CloseCircleOutlined />
                      )}
                    </div>
                    {index !== documentHistory.length - 1 && (
                      <div className="w-[1px] h-full bg-gray-200 dark:bg-slate-700 my-1" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-center mb-1">
                      <Tag
                        color={item.status === "verified" ? "success" : "error"}
                        className="text-[10px] m-0 border-none px-2 rounded-lg uppercase font-bold"
                      >
                        {item.status}
                      </Tag>
                      <Typography.Text type="secondary" className="text-[10px] dark:text-slate-400">
                        {dayjs(item.created_at).format("MMM D, YYYY • hh:mm A")}
                      </Typography.Text>
                    </div>
                    {item.reason && (
                      <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-100 dark:border-slate-700 mt-2">
                        <Typography.Text className="text-xs text-gray-600 dark:text-slate-300 italic">
                          "{item.reason}"
                        </Typography.Text>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 opacity-50 flex flex-col items-center gap-2">
              <HistoryOutlined style={{ fontSize: 32 }} />
              <Typography.Text>No prior history found for this document.</Typography.Text>
            </div>
          )}
        </div>
      </Modal>
    </Modal>
  );
};

export default DriverApprovalModal;
