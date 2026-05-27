import React, { useState, useCallback, useEffect } from "react";
import {
  Drawer,
  Tag,
  Typography,
  Button,
  Space,
  Tooltip,
  Avatar,
  Rate,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Radio,
  message,
  Spin,
  Progress,
  Image,
} from "antd";
import dayjs from "dayjs";
import type { Driver, DriverStatus } from "../../store/slices/driverSlice";
import { useAppDispatch } from "../../store/hooks";
import {
  updateDriverStatus,
  updateDriverProfile,
  updateDocumentStatus,
  bulkVerifyDocuments,
  fetchDocumentHistory,
  verifyDriverAccount,
} from "../../store/slices/driverSlice";
import axiosIns from "../../api/axios";
import { calculatePerformanceMetrics, type PerformanceMetrics } from "../../utilities/performanceUtils";
const { Text, Title } = Typography;
import {
  UserOutlined,
  FileTextOutlined,
  BarChartOutlined,
  LineChartOutlined,
  EditOutlined,
  CloseOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  StopOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  WalletOutlined,
  RocketOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { capitalize } from "../../utilities/capitalize";
import "./DriverDetails.css";

export const getMediaUrl = (path: string | undefined | null) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) return path;
  const baseUrl = import.meta.env.VITE_MEDIA_URL || "http://localhost:1234";
  return `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
};

interface DriverDetailsProps {
  driver: Driver | null;
  onClose: () => void;
  open: boolean;
}

const DriverDetails: React.FC<DriverDetailsProps> = ({
  driver,
  onClose,
  open,
}) => {
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();
  const [activeKey, setActiveKey] = useState("1");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    type: string;
  } | null>(null);
  const [rejectModalDoc, setRejectModalDoc] = useState<{
    id: string;
    type: string;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [historyModalDoc, setHistoryModalDoc] = useState<{ id: string; type: string } | null>(null);
  const [documentHistory, setDocumentHistory] = useState<any[]>([]);

  // Dynamic Performance State
  type Period = 'Today' | 'Week' | 'Month';
  const [perfPeriod, setPerfPeriod] = useState<Period>('Week');
  const [dynamicMetrics, setDynamicMetrics] = useState<PerformanceMetrics | null>(null);
  const [isPerfLoading, setIsPerfLoading] = useState(false);
  
  // Activity History State
  const [rideHistory, setRideHistory] = useState<any[]>([]);
  const [historyPeriod, setHistoryPeriod] = useState<Period>('Week');
  const [historyStatus, setHistoryStatus] = useState<string>('all');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyMetrics, setHistoryMetrics] = useState<PerformanceMetrics | null>(null);

  // Status Action State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<DriverStatus | null>(null);
  const [statusReason, setStatusReason] = useState("");

  const BLOCK_REASONS = [
    "Serious safety violation or physical altercation.",
    "Fraudulent activity or trip manipulation detected.",
    "Sharing account with unauthorized persons.",
    "Repeat offenses after multiple suspensions."
  ];

  const SUSPEND_REASONS = [
    "Pending investigation of a recent customer complaint.",
    "Low completion rate consistently below threshold.",
    "Vehicle maintenance or document audit required.",
    "Inappropriate behavior reported by passenger."
  ];

  const getDatesForPeriod = useCallback((p: Period) => {
    const to = new Date();
    const from = new Date();
    if (p === 'Today') {
      from.setHours(0, 0, 0, 0);
    } else if (p === 'Week') {
      from.setDate(to.getDate() - 7);
    } else if (p === 'Month') {
      from.setDate(to.getDate() - 30);
    }
    return { 
      from: from.toISOString().split('T')[0], 
      to: to.toISOString().split('T')[0] 
    };
  }, []);

  useEffect(() => {
    if (!driver || activeKey !== "4") return; // Only fetch if on performance tab

    const fetchPerformance = async () => {
      setIsPerfLoading(true);
      try {
        const driverId = driver.driverId || driver.driver_id || driver.id || "";
        const dates = getDatesForPeriod(perfPeriod);
        
        // Fetch ride activity
        const activityRes = await axiosIns.get(`/api/drivers/activity/${driverId}`, {
          params: { from: dates.from, to: dates.to }
        });
        
        const rides = Array.isArray(activityRes.data?.data) ? activityRes.data.data : [];
        const metrics = calculatePerformanceMetrics(rides);
        
        // Fetch today overview for more accurate online time if period is 'Today'
        if (perfPeriod === 'Today') {
          try {
            const overviewRes = await axiosIns.get(`/api/drivers/today-overview/${driverId}`);
            if (overviewRes.data?.data?.onlineMinutes !== undefined) {
              metrics.onlineMinutes = overviewRes.data.data.onlineMinutes;
            }
          } catch (e) {
            console.error("Failed to fetch today overview", e);
          }
        }
        
        setDynamicMetrics(metrics);
      } catch (err) {
        console.error("Failed to fetch performance data", err);
      } finally {
        setIsPerfLoading(false);
      }
    };

    fetchPerformance();
  }, [driver, activeKey, perfPeriod, getDatesForPeriod]);

  // Fetch Ride History
  useEffect(() => {
    if (!driver || activeKey !== "7") return;

    const fetchHistory = async () => {
      setIsHistoryLoading(true);
      try {
        const driverId = driver.driverId || driver.driver_id || driver.id || "";
        const dates = getDatesForPeriod(historyPeriod);
        
        const params: any = { 
          from: dates.from, 
          to: dates.to 
        };
        if (historyStatus !== 'all') params.status = historyStatus;

        const res = await axiosIns.get(`/api/drivers/activity/${driverId}`, { params });
        const rides = Array.isArray(res.data?.data) ? res.data.data : [];
        setRideHistory(rides);
        
        // Calculate metrics for the selected period
        setHistoryMetrics(calculatePerformanceMetrics(rides));
      } catch (err) {
        console.error("Failed to fetch ride history", err);
      } finally {
        setIsHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [driver, activeKey, historyPeriod, historyStatus, getDatesForPeriod]);

  const REJECTION_TEMPLATES = [
    { label: "Image is blurry or unreadable", value: "The uploaded image is blurry, too dark, or unreadable. Please upload a clear, well-lit photo." },
    { label: "Expired Document", value: "The document provided has expired. Please upload a valid and current document." },
    { label: "Wrong Side Uploaded", value: "You have uploaded the wrong side of the document. Please ensure you upload the front/back as requested." },
    { label: "Name/Details Mismatch", value: "The name or details on the document do not match your profile information. Please verify your profile details." },
    { label: "Document Cut Off", value: "Part of the document is not visible in the photo. Please ensure all four corners are visible." },
    { label: "Invalid Document Type", value: "The document uploaded is not the correct type (e.g., uploaded Pan Card instead of License). Please upload the correct document." },
    { label: "Watermark/Overlays", value: "The document has watermarks or overlays that block critical information. Please upload a clean photo." },
    { label: "Other (Custom)", value: "" },
  ];

  if (!driver) {
    return (
      <Drawer
        title="Driver Details"
        placement="right"
        width={720}
        onClose={onClose}
        open={open}
        closable={true}
        destroyOnClose={true}
        className="driver-details-drawer"
      >
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50">
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100">
            <UserOutlined style={{ fontSize: 64, color: "#cbd5e1", marginBottom: 24 }} />
            <Title level={3} className="text-gray-400">Driver Not Found</Title>
            <Text type="secondary" className="text-lg">
              We couldn't find the details for this driver. <br/> Please try refreshing the list.
            </Text>
            <Button type="primary" size="large" onClick={onClose} className="mt-8 px-8 h-12 rounded-xl text-lg font-medium">
              Close
            </Button>
          </div>
        </div>
      </Drawer>
    );
  }
  const handleStatusUpdate = (status: DriverStatus) => {
    if (!driver) return;
    
    if (status === "blocked" || status === "suspended" || status === "rejected") {
      setStatusAction(status);
      setStatusReason("");
      setStatusModalOpen(true);
    } else {
      Modal.confirm({
        title: `${capitalize(status)} Driver`,
        content: `Are you sure you want to change this driver's status to ${status}?`,
        onOk: async () => {
          setLoadingAction(status);
          try {
            await dispatch(
              updateDriverStatus({ 
                driver_id: driver.driverId || driver.driver_id || driver.id || "", 
                status 
              }),
            ).unwrap();
            message.success(`Driver ${status} successfully`);
          } catch (err: any) {
            message.error(err || `Failed to ${status} driver`);
          } finally {
            setLoadingAction(null);
          }
        },
      });
    }
  };

  const handleStatusSubmit = async () => {
    if (!driver || !statusAction) return;
    
    if ((statusAction === "rejected" || statusAction === "blocked" || statusAction === "suspended") && !statusReason?.trim()) {
      message.error("Please provide a reason for this action");
      return;
    }

    setLoadingAction(statusAction);
    try {
      await dispatch(
        updateDriverStatus({ 
          driver_id: driver.driverId || driver.driver_id || driver.id || "", 
          status: statusAction,
          status_reason: statusReason 
        }),
      ).unwrap();

      message.success(`Driver ${statusAction} successfully`);
      setStatusModalOpen(false);
      setStatusReason("");
    } catch (err: any) {
      message.error(err || `Failed to ${statusAction} driver`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApproveAccount = () => {
    if (!driver) return;
    Modal.confirm({
      title: "Approve Driver Account",
      content: "This will verify all documents and activate the driver account. Continue?",
      onOk: async () => {
        setLoadingAction("approve-account");
        try {
          await dispatch(verifyDriverAccount(driver.driverId || driver.driver_id || driver.id || "")).unwrap();
          message.success("Driver account approved and activated");
        } catch (err: any) {
          message.error(err || "Failed to approve account");
        } finally {
          setLoadingAction(null);
        }
      },
    });
  };

  const handleUpdateProfile = async (values: any) => {
    if (!driver) return;
    setLoadingAction("update-profile");
    try {
      // Auto-compute full_name from first_name + last_name
      const fullName = `${values.first_name || ''} ${values.last_name || ''}`.trim();

      await dispatch(
        updateDriverProfile({
          driver_id: driver.driverId || driver.driver_id || driver.id || "",
          data: {
            ...values,
            full_name: fullName,
            date_of_birth: values.date_of_birth ? values.date_of_birth.toISOString() : undefined,
          },
        }),
      ).unwrap();

      message.success("Profile updated successfully");
      setIsEditModalOpen(false);
    } catch (err: any) {
      message.error(err || "Failed to update profile");
    } finally {
      setLoadingAction(null);
    }
  };






  const handleDocumentApprove = (documentId: string) => {
    if (!driver) return;
    Modal.confirm({
      title: "Approve Document",
      content: "Are you sure you want to approve this document?",
      onOk: async () => {
        setLoadingAction(`approve-${documentId}`);
        try {
          await dispatch(
            updateDocumentStatus({
              driver_id: driver.driverId || driver.driver_id || driver.id || "",
              document_id: documentId,
              status: "verified",
            }),
          ).unwrap();

          message.success("Document approved");
        } catch (err: any) {
          message.error(err || "Failed to approve document");
        } finally {
          setLoadingAction(null);
        }
      },
    });
  };


  const handleDocumentReject = async () => {
    if (!rejectModalDoc || !driver) return;
    setLoadingAction(`reject-${rejectModalDoc.id}`);
    try {
      await dispatch(
        updateDocumentStatus({
          driver_id: driver.driverId || driver.driver_id || driver.id || "",
          document_id: rejectModalDoc.id,
          status: "rejected",
          reason: rejectionReason,
        }),
      ).unwrap();

      message.success("Document rejected");
      setRejectModalDoc(null);
      setRejectionReason("");
    } catch (err: any) {
      message.error(err || "Failed to reject document");
    } finally {
      setLoadingAction(null);
    }
  };


  const getStatusColor = (status: any) => {
    if (typeof status !== "string") return "default";
    switch (status.toLowerCase()) {
      case "active":
      case "verified":
        return "success";
      case "pending":
      case "pending_verification":
        return "warning";
      case "blocked":
      case "rejected":
      case "suspended":
        return "error";
      default:
        return "default";
    }
  };

  const basicInfo = (
    <div className="space-y-6">
      <div className="content-card p-6">
        <div className="flex justify-between items-start mb-6">
          <Title level={4} className="m-0 flex items-center gap-2 text-gray-800">
             <UserOutlined className="text-blue-500" /> Driver Information
          </Title>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => {
              let firstName = driver?.first_name || '';
              let lastName = driver?.last_name || '';
              
              if (!firstName && !lastName && driver?.full_name) {
                const names = driver.full_name.split(' ');
                firstName = names[0];
                lastName = names.slice(1).join(' ');
              }

              form.setFieldsValue({
                ...driver,
                first_name: firstName,
                last_name: lastName,
                date_of_birth: (driver?.dob || driver?.date_of_birth) ? dayjs(driver.dob || driver.date_of_birth) : null,
              });
              setIsEditModalOpen(true);
            }}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-medium px-4 h-9"
          >
            Edit Profile
          </Button>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <div className="info-icon-wrapper">
              <UserOutlined />
            </div>
            <div className="info-content">
              <span className="info-label">Full Name</span>
              <span className="info-value font-bold text-lg">
                {driver?.first_name || driver?.last_name 
                  ? `${driver.first_name || ''} ${driver.last_name || ''}`.trim() 
                  : driver?.full_name || "N/A"}
              </span>
              {driver?.vdrive_id && (
                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded mt-1 inline-block w-fit">
                  ID: {driver.vdrive_id}
                </span>
              )}
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon-wrapper">
              <RocketOutlined />
            </div>
            <div className="info-content">
              <span className="info-label">Role & Status</span>
              <Space direction="vertical" size={4} className="mt-1">
                <Tag color="purple" className="premium-tag rounded-lg px-3 m-0">
                  {capitalize(driver?.role || "Normal")}
                </Tag>
                {driver?.onboarding_status && (
                  <Tag color="blue" className="rounded-lg text-[10px] m-0">
                    Onboarding: {capitalize(driver.onboarding_status)}
                  </Tag>
                )}
              </Space>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon-wrapper">
              <PhoneOutlined />
            </div>
            <div className="info-content">
              <span className="info-label">Phone Number</span>
              <span className="info-value">{driver?.phone_number || "N/A"}</span>
              <Text type="secondary" className="text-[10px]">Primary Contact</Text>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon-wrapper">
              <MailOutlined />
            </div>
            <div className="info-content">
              <span className="info-label">Email Address</span>
              <span className="info-value truncate max-w-[180px]">{driver?.email || "N/A"}</span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon-wrapper">
              <CalendarOutlined />
            </div>
            <div className="info-content">
              <span className="info-label">Date of Birth</span>
              <span className="info-value">
                {(driver?.dob || driver?.date_of_birth) ? dayjs(driver.dob || driver.date_of_birth).format("MMM D, YYYY") : "N/A"}
              </span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-icon-wrapper">
              <EnvironmentOutlined />
            </div>
            <div className="info-content">
              <span className="info-label">Address</span>
              <span className="info-value text-xs">
                {driver?.address?.street}, {driver?.address?.city},<br />
                {driver?.address?.state} - {driver?.address?.pincode}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="content-card p-4 bg-blue-50/30 border-blue-100/50">
          <span className="info-label text-blue-400">Account Created</span>
          <p className="m-0 text-sm font-bold text-blue-900 mt-1">
            {driver?.created_at ? dayjs(driver.created_at).format("MMMM D, YYYY") : "N/A"}
          </p>
        </div>
        <div className="content-card p-4 bg-indigo-50/30 border-indigo-100/50">
          <span className="info-label text-indigo-400">Last Updated</span>
          <p className="m-0 text-sm font-bold text-indigo-900 mt-1">
            {driver?.updated_at ? dayjs(driver.updated_at).format("MMMM D, YYYY") : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );




  const handleBulkVerify = () => {
    if (!driver) return;
    Modal.confirm({
      title: "Bulk Approve Documents",
      content: "Are you sure you want to approve all pending documents for this driver?",
      okText: "Approve All",
      okButtonProps: { className: "bg-green-600 hover:bg-green-700 border-none shadow-sm rounded-xl px-6" },
      onOk: async () => {
        setLoadingAction("bulk-verify");
        try {
          await dispatch(bulkVerifyDocuments(driver.driverId || driver.driver_id || driver.id || "")).unwrap();
          message.success("All documents verified successfully");
        } catch (err: any) {
          message.error(err || "Failed to bulk verify documents");
        } finally {
          setLoadingAction(null);
        }
      },
    });
  };

  const handleShowHistory = async (docId: string, type: string) => {
    setHistoryModalDoc({ id: docId, type });
    setLoadingAction(`history-${docId}`);
    try {
      const result = await dispatch(fetchDocumentHistory(docId)).unwrap();
      setDocumentHistory(result);
    } catch (err: any) {
      message.error(err || "Failed to fetch history");
    } finally {
      setLoadingAction(null);
    }
  };

  const documents = (
    <div className="grid grid-cols-1 gap-6">
      {driver?.documents && driver.documents.some((d: any) => d.license_status !== 'verified') && (
        <div className="flex justify-end mb-2">
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />} 
            onClick={handleBulkVerify}
            loading={loadingAction === 'bulk-verify'}
            className="bg-green-600 hover:bg-green-700 border-none shadow-md rounded-xl px-6 h-10 font-bold"
          >
            Verify All Documents
          </Button>
        </div>
      )}
      {(driver?.documents)?.map((doc: any) => (
        <div key={doc?.document_id} className="content-card p-6 document-preview-card">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <FileTextOutlined />
              </div>
              <div>
                <Title level={5} className="m-0 text-gray-800">
                  {capitalize(doc?.document_type)} Document
                </Title>
                <Text type="secondary" className="text-[10px] font-mono tracking-wider">
                  #{doc?.document_number}
                </Text>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Tag color={getStatusColor(doc?.license_status)} className="status-badge m-0">
                {capitalize(doc?.license_status)}
              </Tag>
              <Button 
                type="link" 
                size="small" 
                icon={<HistoryOutlined />} 
                onClick={() => handleShowHistory(doc.document_id || doc.id, doc.document_type)}
                className="text-[10px] h-auto p-0 flex items-center gap-1 opacity-70 hover:opacity-100"
              >
                View History
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-8 mb-6">
            <div className="flex gap-4">
              {doc?.document_url ? (
                <>
                  {(typeof doc.document_url === 'object' && doc.document_url !== null && (doc.document_url.front || doc.document_url.back)) ? (
                    <>
                      {doc.document_url.front && (
                        <div className="bg-gray-50 p-1.5 rounded-xl flex flex-col items-center justify-center border border-dashed border-gray-200 w-36 h-28 overflow-hidden shadow-inner group relative">
                          <img
                            src={getMediaUrl(doc.document_url.front)}
                            alt={`${doc?.document_type} Front`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 rounded-lg"
                          />
                          <div 
                            className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-xl"
                            onClick={() => {
                              setPreviewDoc({ url: getMediaUrl(doc.document_url.front), type: `${doc?.document_type} (Front)` });
                              setIsPreviewModalOpen(true);
                            }}
                          >
                            <EyeOutlined className="text-white text-xl" />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5 z-10">Front</div>
                        </div>
                      )}
                      {doc.document_url.back && (
                        <div className="bg-gray-50 p-1.5 rounded-xl flex flex-col items-center justify-center border border-dashed border-gray-200 w-36 h-28 overflow-hidden shadow-inner group relative">
                          <img
                            src={getMediaUrl(doc.document_url.back)}
                            alt={`${doc?.document_type} Back`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 rounded-lg"
                          />
                          <div 
                            className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-xl"
                            onClick={() => {
                              setPreviewDoc({ url: getMediaUrl(doc.document_url.back), type: `${doc?.document_type} (Back)` });
                              setIsPreviewModalOpen(true);
                            }}
                          >
                            <EyeOutlined className="text-white text-xl" />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5 z-10">Back</div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-center border border-dashed border-gray-200 w-48 h-32 overflow-hidden shadow-inner group relative">
                      <img
                        src={getMediaUrl(typeof doc.document_url === 'string' ? doc.document_url : doc.document_url?.url)}
                        alt={doc?.document_type}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 rounded-lg"
                      />
                      <div 
                        className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-2xl"
                        onClick={() => {
                          setPreviewDoc({
                            url: getMediaUrl(typeof doc.document_url === 'string' ? doc.document_url : doc.document_url?.url),
                            type: doc?.document_type,
                          });
                          setIsPreviewModalOpen(true);
                        }}
                      >
                        <EyeOutlined className="text-white text-2xl" />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-center border border-dashed border-gray-200 w-48 h-32 overflow-hidden shadow-inner">
                  <FileTextOutlined className="text-4xl text-gray-200" />
                </div>
              )}
            </div>
            <div className="flex-grow space-y-4">
              <div className="flex items-center gap-2">
                <CalendarOutlined className="text-red-400" />
                <div>
                  <Text type="secondary" className="text-[10px] uppercase font-bold tracking-tighter block">Expiry Date</Text>
                  <Text strong className="text-lg">{doc?.expiry_date ? dayjs(doc.expiry_date).format("MMM D, YYYY") : "N/A"}</Text>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="default"
                  icon={<DownloadOutlined />}
                  onClick={() => {
                    if (typeof doc?.document_url === 'object' && doc.document_url !== null) {
                       if (doc.document_url.front) window.open(getMediaUrl(doc.document_url.front), "_blank");
                       if (doc.document_url.back) window.open(getMediaUrl(doc.document_url.back), "_blank");
                    } else {
                       window.open(getMediaUrl(typeof doc?.document_url === 'string' ? doc.document_url : doc?.document_url?.url), "_blank");
                    }
                  }}
                  className="rounded-lg h-9"
                >
                  Download
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center pt-4 border-t border-gray-100 gap-3">
            {doc?.license_status !== "verified" && (
              <>
                <Button
                  danger
                  ghost
                  icon={<CloseCircleOutlined />}
                  loading={loadingAction === `reject-${doc.document_id || doc.id}`}
                  onClick={() =>
                    setRejectModalDoc({ id: doc.document_id || doc.id, type: doc.document_type || doc.type })
                  }
                  className="rounded-xl px-6"
                >
                  Reject
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  className="bg-green-600 hover:bg-green-700 border-none shadow-sm rounded-xl px-6"
                  loading={loadingAction === `approve-${doc.document_id || doc.id}`}
                  onClick={() => handleDocumentApprove(doc.document_id || doc.id)}
                >
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const performance = (
    <div className="space-y-6">
      <div className="content-card p-6">
        <div className="flex justify-between items-center mb-6">
          <Title level={4} className="m-0 flex items-center gap-2 text-gray-800">
             <BarChartOutlined className="text-blue-500" /> Performance Analytics
          </Title>
          <Radio.Group 
            value={perfPeriod} 
            onChange={(e) => setPerfPeriod(e.target.value)}
            buttonStyle="solid"
            size="small"
            className="period-toggle"
          >
            <Radio.Button value="Today">Today</Radio.Button>
            <Radio.Button value="Week">Week</Radio.Button>
            <Radio.Button value="Month">Month</Radio.Button>
          </Radio.Group>
        </div>
        
        {isPerfLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center justify-center mb-8">
               <div className="perf-score-container">
                 <Progress 
                   type="dashboard" 
                   percent={dynamicMetrics?.completionRate || 0} 
                   strokeColor={{ "0%": "#2563EB", "100%": "#3B82F6" }}
                   width={160}
                   strokeWidth={10}
                   gapDegree={60}
                   format={(percent) => (
                     <div className="flex flex-col items-center">
                       <span className="text-3xl font-extrabold text-gray-800">{percent}%</span>
                       <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Score</span>
                     </div>
                   )}
                 />
               </div>
               <Text type="secondary" className="mt-4 text-center text-sm px-8 max-w-xs mx-auto">
                 Overall performance based on accepted and completed trips for the selected period.
               </Text>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="stat-box perf-metric-card bg-emerald-50 border-emerald-100 flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <WalletOutlined className="text-emerald-600 text-lg" />
                  </div>
                  <div>
                    <Text type="secondary" className="info-label text-[10px] text-emerald-600">Earnings</Text>
                    <div className="text-xl font-bold text-emerald-800 mt-0.5 perf-stat-value">
                      ₹{(dynamicMetrics?.totalEarnings || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
               </div>

               <div className="stat-box perf-metric-card bg-blue-50 border-blue-100 flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <ClockCircleOutlined className="text-blue-600 text-lg" />
                  </div>
                  <div>
                    <Text type="secondary" className="info-label text-[10px] text-blue-600">Online Time</Text>
                    <div className="text-xl font-bold text-blue-800 mt-0.5 perf-stat-value">
                      {((dynamicMetrics?.onlineMinutes || 0) / 60).toFixed(1)}h
                    </div>
                  </div>
               </div>

               <div className="stat-box perf-metric-card bg-amber-50 border-amber-100 flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <UserOutlined className="text-amber-600 text-lg" />
                  </div>
                  <div>
                    <Text type="secondary" className="info-label text-[10px] text-amber-600">Rating</Text>
                    <div className="text-xl font-bold text-amber-800 mt-0.5 flex items-center gap-1 perf-stat-value">
                      {Number(dynamicMetrics?.rating || driver?.rating || 0).toFixed(1)}
                      <Rate disabled allowHalf value={Number(dynamicMetrics?.rating || driver?.rating || 0)} style={{ fontSize: 12, marginLeft: 4 }} />
                    </div>
                  </div>
               </div>

               <div className="stat-box perf-metric-card bg-purple-50 border-purple-100 flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <CheckCircleOutlined className="text-purple-600 text-lg" />
                  </div>
                  <div>
                    <Text type="secondary" className="info-label text-[10px] text-purple-600">Acceptance</Text>
                    <div className="text-xl font-bold text-purple-800 mt-0.5 perf-stat-value">
                      {dynamicMetrics?.acceptanceRate || 0}%
                    </div>
                  </div>
               </div>
            </div>

            <div className="perf-summary-bar mb-6">
              <div className="perf-summary-item">
                <Text type="secondary" className="text-[10px] uppercase font-bold block mb-1">Total</Text>
                <Text className="text-lg font-bold text-gray-700 perf-stat-value">{dynamicMetrics?.totalTrips || 0}</Text>
              </div>
              <div className="perf-summary-item">
                <Text type="secondary" className="text-[10px] uppercase font-bold text-green-600 block mb-1">Completed</Text>
                <Text className="text-lg font-bold text-green-600 perf-stat-value">{dynamicMetrics?.completedTrips || 0}</Text>
              </div>
              <div className="perf-summary-item">
                <Text type="secondary" className="text-[10px] uppercase font-bold text-red-500 block mb-1">Cancelled</Text>
                <Text className="text-lg font-bold text-red-500 perf-stat-value">{dynamicMetrics?.cancelledTrips || 0}</Text>
              </div>
            </div>

            <div className="content-card p-4 bg-gray-50 flex items-center gap-3 shadow-none border-dashed mt-auto">
               <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <ClockCircleOutlined className="text-gray-400" />
               </div>
               <div>
                  <Text type="secondary" className="text-[10px] font-bold block uppercase tracking-tight">Last Active</Text>
                  <Text className="text-sm font-medium text-gray-600">
                    {driver?.performance?.last_active
                      ? dayjs(driver?.performance?.last_active)?.format("MMM D, YYYY • hh:mm A")
                      : "N/A"}
                  </Text>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const payments = (
    <div className="space-y-6">
      <div className="content-card p-6">
        <Title level={4} className="mb-6 flex items-center gap-2 text-gray-800">
           <WalletOutlined className="text-emerald-500" /> Payment Summary
        </Title>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="stat-box bg-emerald-50/30 border-emerald-100">
            <Text type="secondary" className="info-label text-[10px] text-emerald-600">Total Earnings</Text>
            <div className="text-3xl font-extrabold text-emerald-700 mt-1">
              ₹{driver?.payments?.total_earnings?.toLocaleString() || 0}
            </div>
          </div>

          <div className="stat-box bg-blue-50/30 border-blue-100 flex justify-between items-center">
            <div>
              <Text type="secondary" className="info-label text-[10px] text-blue-600">Active Subscription</Text>
              <div className="text-xl font-bold text-blue-800 mt-1">
                {driver?.active_subscription?.plan_name || "No Active Plan"}
              </div>
            </div>
            < RocketOutlined className="text-blue-200 text-3xl" />
          </div>
        </div>
      </div>
    </div>
  );

  const rechargePlanInfo = (
    <div className="space-y-6">
      <div className="content-card p-6">
        <div className="flex justify-between items-center mb-6">
          <Title level={4} className="m-0 flex items-center gap-2 text-gray-800">
             <SyncOutlined className="text-indigo-500" /> Active Recharge Plan
          </Title>
          {driver?.active_subscription?.status === "active" ? (
            <Tag color="#4ade80" className="status-badge border-none text-green-900">Active</Tag>
          ) : (
            <Tag color="#f87171" className="status-badge border-none text-white">Inactive</Tag>
          )}
        </div>

        {driver?.active_subscription ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="stat-box">
                <Text type="secondary" className="info-label text-[10px]">Plan Name</Text>
                <div className="font-bold text-lg text-gray-800 mt-1">{driver.active_subscription.plan_name}</div>
              </div>
              <div className="stat-box text-right">
                <Text type="secondary" className="info-label text-[10px]">Billing Cycle</Text>
                <div className="font-bold capitalize text-lg text-indigo-600 mt-1">{driver.active_subscription.billing_cycle}</div>
              </div>
            </div>
            
            <div className="info-grid bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="info-item">
                <div className="info-icon-wrapper bg-white">
                  <CalendarOutlined className="text-blue-500" />
                </div>
                <div className="info-content">
                  <span className="info-label">Start Date</span>
                  <span className="info-value font-bold">{dayjs(driver.active_subscription.start_date).format("MMM D, YYYY")}</span>
                </div>
              </div>
              <div className="info-item">
                <div className="info-icon-wrapper bg-white">
                  <CalendarOutlined className="text-red-500" />
                </div>
                <div className="info-content">
                  <span className="info-label">Expiry Date</span>
                  <span className="info-value font-bold">{dayjs(driver.active_subscription.expiry_date).format("MMM D, YYYY")}</span>
                </div>
              </div>
            </div>

            <div className="stat-box bg-indigo-50 border-indigo-100 flex items-center gap-4">
               <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-xl font-black text-indigo-600 shadow-sm">
                  {dayjs(driver.active_subscription.expiry_date).diff(dayjs(), "day")}
               </div>
               <div>
                 <Text type="secondary" className="text-[10px] font-bold block">DAYS REMAINING</Text>
                 <Text className="text-sm font-medium text-indigo-900">
                   Plan expires on {dayjs(driver.active_subscription.expiry_date).format("MMMM D")}
                 </Text>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
             <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
               <StopOutlined style={{ fontSize: 32, color: "#cbd5e1" }} />
             </div>
             <p className="text-gray-400 font-medium">No active recharge plan found for this driver.</p>
          </div>
        )}
      </div>
    </div>
  );
  const activity = (
    <div className="space-y-6">
      <div className="content-card p-6">
        <div className="flex justify-between items-center mb-6">
          <Title level={4} className="m-0 flex items-center gap-2 text-gray-800">
             <LineChartOutlined className="text-blue-500" /> Ride Activity
          </Title>
          <div className="flex gap-2">
            <Select 
              size="small" 
              value={historyStatus} 
              onChange={setHistoryStatus}
              className="w-32"
              options={[
                { label: 'All Status', value: 'all' },
                { label: 'Completed', value: 'Completed' },
                { label: 'Cancelled', value: 'Cancelled' },
              ]}
            />
            <Radio.Group 
              value={historyPeriod} 
              onChange={(e) => setHistoryPeriod(e.target.value)}
              buttonStyle="solid"
              size="small"
              className="period-toggle"
            >
              <Radio.Button value="Today">Today</Radio.Button>
              <Radio.Button value="Week">Week</Radio.Button>
              <Radio.Button value="Month">Month</Radio.Button>
            </Radio.Group>
          </div>
        </div>

        {isHistoryLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Activity Summary Header */}
            <div className="grid grid-cols-3 gap-3 mb-2">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <Text type="secondary" className="text-[10px] uppercase font-bold block">Total Trips</Text>
                <Text className="text-lg font-bold text-gray-800">{historyMetrics?.totalTrips || 0}</Text>
              </div>
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                <Text type="secondary" className="text-[10px] uppercase font-bold block text-emerald-600">Earnings</Text>
                <Text className="text-lg font-bold text-emerald-700">₹{(historyMetrics?.totalEarnings || 0).toLocaleString()}</Text>
              </div>
              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                <Text type="secondary" className="text-[10px] uppercase font-bold block text-blue-600">Success Rate</Text>
                <Text className="text-lg font-bold text-blue-700">{historyMetrics?.completionRate || 0}%</Text>
              </div>
            </div>

            <div className="space-y-4">
              {rideHistory.length > 0 ? (
                rideHistory.map((trip: any) => (
                  <div key={trip.id} className="trip-card bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <Text type="secondary" className="text-[10px] font-mono block">
                          #{trip.trip_code || trip.id?.toString().slice(-6).toUpperCase()} • {trip.date}
                        </Text>
                        <Text strong className="text-gray-800">{trip.time}</Text>
                      </div>
                      <Tag color={trip.status === 'Completed' ? 'success' : 'error'} className="m-0 px-3 rounded-full font-bold text-[10px]">
                        {trip.status.toUpperCase()}
                      </Tag>
                    </div>

                    <div className="relative pl-6 py-1 space-y-3">
                      <div className="absolute left-1.5 top-2.5 bottom-2.5 w-[1.5px] bg-gray-100 dashed-line"></div>
                      
                      <div className="relative">
                        <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
                        <Text className="text-sm text-gray-700 line-clamp-1">{trip.pickup}</Text>
                      </div>
                      
                      <div className="relative">
                        <div className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
                        <Text className="text-sm text-gray-700 line-clamp-1">{trip.drop}</Text>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <RocketOutlined className="text-gray-400 text-xs" />
                          <Text type="secondary" className="text-xs">{trip.distance}</Text>
                        </div>
                        <div className="flex items-center gap-1">
                          <UserOutlined className="text-gray-400 text-xs" />
                          <Text type="secondary" className="text-xs">{trip.customer?.name}</Text>
                        </div>
                      </div>
                      <Text className={`text-lg font-black ${trip.status === 'Cancelled' ? 'text-gray-400 line-through' : 'text-emerald-600'}`}>
                        ₹{trip.amount?.toLocaleString()}
                      </Text>
                    </div>
                    
                    {trip.customer?.rating && (
                      <div className="mt-2 flex items-center gap-2">
                        <Rate disabled allowHalf value={trip.customer.rating} style={{ fontSize: 10 }} />
                        {trip.customer.feedback && (
                          <Text type="secondary" className="text-[10px] italic overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">
                            "{trip.customer.feedback}"
                          </Text>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <HistoryOutlined style={{ fontSize: 32, color: "#cbd5e1" }} />
                  </div>
                  <Text type="secondary" className="font-medium">No ride activity found for this period.</Text>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
  const segments = [
    {
      label: (
        <Tooltip title="Basic Information">
          <UserOutlined />
        </Tooltip>
      ),
      key: "1",
      content: basicInfo,
    },


    {
      label: (
        <Tooltip title="Documents">
          <FileTextOutlined />
        </Tooltip>
      ),
      key: "3",
      content: documents,
    },
    {
      label: (
        <Tooltip title="Performance">
          <BarChartOutlined />
        </Tooltip>
      ),
      key: "4",
      content: performance,
    },
    {
      label: (
        <Tooltip title="Payments">
          <WalletOutlined />
        </Tooltip>
      ),
      key: "5",
      content: payments,
    },
    {
      label: (
        <Tooltip title="Recharge Plan">
          <SyncOutlined />
        </Tooltip>
      ),
      key: "6",
      content: rechargePlanInfo,
    },
    {
      label: (
        <Tooltip title="Activity Log">
          <LineChartOutlined />
        </Tooltip>
      ),
      key: "7",
      content: activity,
    },
  ];

  const renderStatusActions = () => {
    const isAwaitingVerification = driver?.onboarding_status === 'DOCS_SUBMITTED' || driver?.onboarding_status === 'DOCS_REJECTED';
    
    if (driver?.status === "pending" || driver?.status === "pending_verification" || isAwaitingVerification) {
      return (
        <Space wrap size="middle">
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={loadingAction === "approve-account"}
            onClick={handleApproveAccount}
            className="bg-green-600 hover:bg-green-700 border-none shadow-md h-10 px-6 rounded-xl"
          >
            Approve Driver
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            loading={loadingAction === "rejected"}
            onClick={() => handleStatusUpdate('rejected')}
            className="h-10 px-6 rounded-xl shadow-sm"
          >
            Reject Profile
          </Button>
        </Space>
      );
    }

    switch (driver?.status) {
      case "blocked":
      case "suspended":
        return (
          <Space wrap size="middle">
            <Button
              icon={<CheckCircleOutlined />}
              style={{ borderColor: "green", color: "green" }}
              loading={loadingAction === "active"}
              onClick={() => handleStatusUpdate("active")}
              className="h-10 px-6 rounded-xl"
            >
              Activate Driver
            </Button>
          </Space>
        );
      default:
        return (
          <div className="flex items-center justify-between w-full">
            <Space wrap size="middle">
              <Button
                type="default"
                danger
                icon={<StopOutlined />}
                loading={loadingAction === "blocked"}
                onClick={() => handleStatusUpdate("blocked")}
                className="h-10 px-6 rounded-xl"
              >
                Block
              </Button>
              <Button
                type="dashed"
                danger
                icon={<SyncOutlined />}
                loading={loadingAction === "suspended"}
                onClick={() => handleStatusUpdate("suspended")}
                className="h-10 px-6 rounded-xl"
              >
                Suspend
              </Button>
            </Space>
          </div>
        );
    }
  };
  return (
    <>
      <Drawer
      title={null}
      placement="right"
      width={720}
      onClose={onClose}
      open={open}
      closable={false}
      destroyOnClose={true}
      className="driver-details-drawer"
    >
      <div className="driver-details-header">
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-6">
            <div className="driver-avatar-wrapper overflow-hidden rounded-full border-4 border-white/20 shadow-xl group cursor-pointer">
              <Image
                width={100}
                height={100}
                src={getMediaUrl(driver?.profilePicUrl || driver?.profile_pic_url)}
                className="object-cover"
                preview={{
                  mask: <div className="text-[10px] font-bold">PREVIEW</div>
                }}
                fallback="https://ui-avatars.com/api/?name=${encodeURIComponent(driver?.full_name || 'Driver')}&background=6366f1&color=fff"
              />
            </div>
            <div className="text-white">
              <div className="text-3xl font-extrabold tracking-tight">
                {driver?.first_name || driver?.last_name 
                  ? `${driver.first_name || ''} ${driver.last_name || ''}`.trim() 
                  : driver?.full_name || "N/A"}
              </div>
              <p className="m-0 text-blue-100/80 text-sm font-medium mt-1 flex items-center gap-2">
                <SafetyCertificateOutlined className="text-blue-300" />
                DRIVER ID: {driver?.driverId || driver?.driver_id || driver?.id || "N/A"}
              </p>
              <div className="mt-3 flex gap-2">
                {driver?.availability?.online ? (
                  <Tag color="#4ade80" className="m-0 border-none px-3 font-bold rounded-full text-green-900 shadow-sm">
                    <SyncOutlined spin className="mr-1" /> ONLINE
                  </Tag>
                ) : (
                  <Tag color="#94a3b8" className="m-0 border-none px-3 font-bold rounded-full text-white shadow-sm">
                    OFFLINE
                  </Tag>
                )}
                <Tag color="#6366f1" className="m-0 border-none px-3 font-bold rounded-full text-white shadow-sm uppercase">
                  {driver?.role || "Normal"}
                </Tag>
              </div>
            </div>
          </div>
          <Button 
            type="primary" 
            shape="circle" 
            icon={<CloseOutlined />} 
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md"
          />
        </div>
      </div>
      <div className="action-buttons-container">
        {renderStatusActions()}
      </div>

      <div className="py-6 h-full overflow-y-auto custom-scrollbar" style={{ background: "#f8fafc" }}>
        
        {(driver?.status === "blocked" || driver?.status === "suspended") && (
          <div className="mx-6 mb-6">
            <div className={`p-4 rounded-xl border flex items-start gap-4 ${driver.status === "blocked" ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"}`}>
              <div className={`text-2xl mt-1 ${driver.status === "blocked" ? "text-red-500" : "text-orange-500"}`}>
                {driver.status === "blocked" ? <StopOutlined /> : <ClockCircleOutlined />}
              </div>
              <div>
                <h3 className={`font-bold m-0 text-lg ${driver.status === "blocked" ? "text-red-700" : "text-orange-700"}`}>
                  Account {driver.status === "blocked" ? "Blocked" : "Suspended"}
                </h3>
                <p className={`mt-1 mb-0 text-sm ${driver.status === "blocked" ? "text-red-600" : "text-orange-600"}`}>
                  <strong>Reason: </strong> {(driver as any).status_reason || "No specific reason provided."}
                </p>
                {(driver as any).status_updated_at && (
                  <p className={`mt-1 mb-0 text-xs ${driver.status === "blocked" ? "text-red-400" : "text-orange-400"}`}>
                    Applied on: {dayjs((driver as any).status_updated_at).format("MMM D, YYYY • hh:mm A")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="custom-navigation mb-8">
          {segments.map(({ key }) => (
            <div
              key={key}
              className={`nav-item ${activeKey === key ? "active" : ""}`}
              onClick={() => setActiveKey(key)}
            >
              <div className="nav-icon">
                {key === "1" && <UserOutlined />}
                {key === "3" && <FileTextOutlined />}
                {key === "4" && <BarChartOutlined />}
                {key === "5" && <WalletOutlined />}
                {key === "6" && <SyncOutlined />}
                {key === "7" && <LineChartOutlined />}
              </div>
              <span className="nav-label">
                {key === "1" && "BASIC"}
                {key === "3" && "DOCS"}
                {key === "4" && "STATS"}
                {key === "5" && "WALLET"}
                {key === "6" && "PLAN"}
                {key === "7" && "ACTIVITY"}
              </span>
            </div>
          ))}
        </div>

        <div className="px-6 pb-24">
          <div key={activeKey} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {segments.find((tab) => tab.key === activeKey)?.content}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal - Redesigned to match screenshot */}
      <Modal
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        width={1200}
        centered
        closable={false}
        className="screenshot-style-modal"
        bodyStyle={{ padding: 0, overflow: 'hidden' }}
      >
        <div className="flex h-[560px]">
          {/* Left Sidebar - Purple */}
          <div className="w-[280px] bg-[#9c6cf2] px-8 py-8 flex flex-col justify-between text-white relative overflow-hidden flex-shrink-0">
            <div className="relative z-10">
              <span className="text-[9px] font-bold tracking-[0.2em] opacity-70 uppercase">Account</span>
              <h2 className="text-xl font-bold mt-1 mb-2 leading-tight">Edit your profile</h2>
              <p className="text-[11px] opacity-80 leading-relaxed font-medium">
                Keep your details fresh — it helps us deliver a more tailored experience.
              </p>

              <div className="flex flex-col items-center mt-10">
                <div className="relative">
                  <Avatar 
                    size={100} 
                    src={getMediaUrl(driver?.profilePicUrl || driver?.profile_pic_url)}
                    className="bg-[#b492f5] border-[3px] border-[#b492f5]/30 text-2xl font-bold shadow-2xl"
                  >
                    {driver?.first_name?.charAt(0)}{driver?.last_name?.charAt(0)}
                  </Avatar>
                  <div className="absolute bottom-1 right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition-transform">
                    <EditOutlined className="text-[#9c6cf2] text-sm" />
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <h3 className="text-base font-bold m-0">{driver?.first_name} {driver?.last_name}</h3>
                  <span className="text-[10px] opacity-70 font-medium capitalize">{driver?.role || 'Normal'} member</span>
                </div>
              </div>
            </div>

            {/* Background decorative circle */}
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex items-center gap-2 text-[9px] opacity-70 font-bold tracking-tight">
              <SafetyCertificateOutlined className="text-white" />
              Your information is encrypted & private.
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 bg-white flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-[#1e293b] m-0">Personal information</h2>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">Update your details below</p>
              </div>
              <Button 
                type="text" 
                icon={<CloseOutlined />} 
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdateProfile}
                initialValues={driver || {}}
                className="screenshot-form"
              >
                <div className="mb-5">
                  <span className="text-[9px] font-black text-slate-400 tracking-[0.12em] uppercase block mb-4">Basic Details</span>
                  <div className="grid grid-cols-4 gap-3">
                    <Form.Item name="first_name" label="First Name" className="col-span-2">
                      <Input prefix={<UserOutlined />} placeholder="First Name" />
                    </Form.Item>
                    <Form.Item name="last_name" label="Last Name" className="col-span-2">
                      <Input prefix={<UserOutlined />} placeholder="Last Name" />
                    </Form.Item>
                    <Form.Item name="email" label="Email Address" className="col-span-2">
                      <Input prefix={<MailOutlined />} placeholder="you@example.com" />
                    </Form.Item>
                    <Form.Item name="phone_number" label="Phone Number" className="col-span-1">
                      <Input prefix={<PhoneOutlined />} placeholder="+91 98765 43210" />
                    </Form.Item>
                    <Form.Item name="date_of_birth" label="Date of Birth" className="col-span-1">
                      <DatePicker className="w-full" placeholder="dd/mm/yyyy" />
                    </Form.Item>
                    <Form.Item name="gender" label="Gender" className="col-span-2">
                      <Select placeholder="Select gender">
                        <Select.Option value="male">Male</Select.Option>
                        <Select.Option value="female">Female</Select.Option>
                        <Select.Option value="other">Other</Select.Option>
                      </Select>
                    </Form.Item>
                    <Form.Item name="role" label="Membership" className="col-span-2">
                      <Select placeholder="Select role">
                        <Select.Option value="normal">Normal</Select.Option>
                        <Select.Option value="premium">Premium</Select.Option>
                        <Select.Option value="elite">Elite</Select.Option>
                      </Select>
                    </Form.Item>
                  </div>
                </div>

                <div className="mb-2">
                  <span className="text-[9px] font-black text-slate-400 tracking-[0.12em] uppercase block mb-4">Address</span>
                  <div className="grid grid-cols-4 gap-3">
                    <Form.Item name={["address", "street"]} label="Street" className="col-span-4">
                      <Input prefix={<EnvironmentOutlined />} placeholder="221B Baker Street" />
                    </Form.Item>
                    <Form.Item name={["address", "city"]} label="City" className="col-span-1">
                      <Input prefix={<EnvironmentOutlined />} placeholder="Mumbai" />
                    </Form.Item>
                    <Form.Item name={["address", "state"]} label="State" className="col-span-1">
                      <Input prefix={<EnvironmentOutlined />} placeholder="Maharashtra" />
                    </Form.Item>
                    <Form.Item name={["address", "pincode"]} label="PIN Code" className="col-span-1">
                      <Input prefix={<span className="text-slate-400 font-bold ml-1 mr-1">#</span>} placeholder="400001" />
                    </Form.Item>
                    <Form.Item name={["address", "country"]} label="Country" className="col-span-1">
                      <Input prefix={<EnvironmentOutlined />} placeholder="India" />
                    </Form.Item>
                  </div>
                </div>
              </Form>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50/30">
              <span className="text-[11px] text-slate-400 font-medium">Changes will be saved to your account.</span>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-lg h-9 px-6 font-semibold text-xs border-gray-200 text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  onClick={() => form.submit()}
                  loading={loadingAction === "update-profile"}
                  className="bg-[#9c6cf2] hover:bg-[#8a5bd9] border-none rounded-lg h-9 px-6 font-semibold text-xs flex items-center gap-1.5"
                >
                  <DownloadOutlined />
                  Save changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Document Preview Modal */}
      <Modal
        title={`${capitalize(previewDoc?.type || "")} Preview`}
        open={isPreviewModalOpen}
        footer={null}
        onCancel={() => setIsPreviewModalOpen(false)}
        width={800}
        centered
        className="premium-modal"
      >
        <div className="flex justify-center bg-gray-50 p-6 rounded-2xl overflow-hidden min-h-[400px]">
          {previewDoc?.url?.endsWith(".pdf") ? (
            <iframe
              src={previewDoc.url}
              className="w-full h-[600px] rounded-lg border-none"
              title="Document PDF"
            />
          ) : (
            <img
              src={previewDoc?.url}
              alt="Preview"
              className="max-w-full max-h-[70vh] object-contain shadow-2xl rounded-lg"
            />
          )}
        </div>
      </Modal>

      <Modal
        title={`Reject ${capitalize(rejectModalDoc?.type || "")} Document`}
        open={!!rejectModalDoc}
        onCancel={() => {
          setRejectModalDoc(null);
          setRejectionReason("");
          setSelectedTemplate(null);
        }}
        onOk={handleDocumentReject}
        confirmLoading={loadingAction === `reject-${rejectModalDoc?.id}`}
        okText="Confirm Reject"
        okButtonProps={{ danger: true, size: "large", className: "rounded-xl" }}
        cancelButtonProps={{ size: "large", className: "rounded-xl" }}
        className="premium-modal"
      >
        <div className="mb-6">
          <Text type="secondary" className="text-sm">
            Please provide a clear reason for rejecting the **{rejectModalDoc?.type}** document.
            This information will be sent directly to the driver to help them correct the issue.
          </Text>
        </div>
        <Form layout="vertical">
          <Form.Item label="Select Template" className="mb-4">
            <Select
              placeholder="Select a common reason to populate"
              onChange={(value) => {
                setSelectedTemplate(value);
                if (value) setRejectionReason(value);
              }}
              value={selectedTemplate}
              className="premium-select rounded-xl"
              size="large"
              allowClear
            >
              {REJECTION_TEMPLATES.map((tpl) => (
                <Select.Option key={tpl.label} value={tpl.value}>
                  {tpl.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item 
            label="Detailed Reason (Sent to Driver)" 
            required 
            help="You can edit the template text above to be more specific."
            className="mb-0"
          >
            <Input.TextArea
              placeholder="Provide more specific details or select a template above..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={5}
              className="rounded-xl premium-textarea"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Document History Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <HistoryOutlined className="text-indigo-600" />
            <span>Document History: {capitalize(historyModalDoc?.type || "")}</span>
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
      >
        <div className="py-4">
          {loadingAction?.startsWith('history-') ? (
            <div className="flex flex-col items-center py-10 gap-4">
               <Spin size="large" />
               <Text type="secondary">Fetching audit trail...</Text>
            </div>
          ) : documentHistory.length > 0 ? (
            <div className="space-y-4">
              {documentHistory.map((item, index) => (
                <div key={item.id || index} className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      item.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {item.status === 'verified' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    </div>
                    {index !== documentHistory.length - 1 && <div className="w-[1px] h-full bg-gray-200 my-1" />}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-center mb-1">
                      <Tag color={getStatusColor(item.status)} className="text-[10px] m-0 border-none px-2 rounded-lg uppercase font-bold">
                        {item.status}
                      </Tag>
                      <Text type="secondary" className="text-[10px]">
                        {dayjs(item.created_at).format("MMM D, YYYY • hh:mm A")}
                      </Text>
                    </div>
                    {item.reason && (
                      <div className="bg-white p-2 rounded-lg border border-gray-100 mt-2">
                        <Text className="text-xs text-gray-600 italic">"{item.reason}"</Text>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 opacity-50 flex flex-col items-center gap-2">
              <HistoryOutlined style={{ fontSize: 32 }} />
              <Text>No prior history found for this document.</Text>
            </div>
          )}
        </div>
      </Modal>
      </Drawer>

      <Modal
        title={
          <span className="flex items-center gap-2">
            {statusAction === "blocked" ? <StopOutlined className="text-red-500" /> : <SyncOutlined className="text-orange-500" />}
            {statusAction === "blocked" ? "Block Driver Account" : statusAction === "suspended" ? "Suspend Driver Account" : "Reject Driver Profile"}
          </span>
        }
        open={statusModalOpen}
        onOk={handleStatusSubmit}
        onCancel={() => setStatusModalOpen(false)}
        okText={statusAction === "blocked" ? "Block Driver" : statusAction === "suspended" ? "Suspend Driver" : "Reject Profile"}
        confirmLoading={loadingAction === statusAction}
        okButtonProps={{ 
          danger: statusAction === "blocked" || statusAction === "rejected", 
          className: statusAction === "suspended" ? "bg-orange-500 hover:bg-orange-600 border-none" : "rounded-xl",
          style: { borderRadius: '12px' }
        }}
        cancelButtonProps={{ className: "rounded-xl" }}
        className="premium-modal"
      >
        <div className="py-4">
          <p className="mb-4 text-slate-600 text-sm">
            You are about to {statusAction === "blocked" ? "permanently block" : statusAction === "suspended" ? "temporarily suspend" : "reject"}{" "}
            <span className="font-bold text-slate-800">{driver?.full_name}</span>. 
            The driver will be notified immediately.
          </p>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Reason <span className="text-red-500">*</span>
            </label>
            <Input.TextArea
              rows={3}
              placeholder={`Enter the reason for ${statusAction}...`}
              value={statusReason}
              onChange={(e) => setStatusReason(e.target.value)}
              className="rounded-xl border-gray-200"
            />
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(statusAction === "blocked" ? BLOCK_REASONS : SUSPEND_REASONS).map((reason, idx) => (
                <Tag 
                  key={idx}
                  className="cursor-pointer hover:border-blue-400 hover:text-blue-600 transition-all m-0 px-3 py-1 text-[10px] rounded-full bg-slate-50 border-slate-100 text-slate-500 font-bold uppercase tracking-tight"
                  onClick={() => setStatusReason(reason)}
                >
                  {reason}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DriverDetails;
