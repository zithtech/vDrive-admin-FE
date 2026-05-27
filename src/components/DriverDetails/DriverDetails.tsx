import React, { useState } from "react";
import {
  Drawer,
  Tag,
  Typography,
  Button,
  Space,
  Tooltip,
  Avatar,
  Divider,
  Rate,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Radio,
  message,
} from "antd";
import dayjs from "dayjs";
import type { Driver, DriverStatus } from "../../store/slices/driverSlice";
import { useAppDispatch } from "../../store/hooks";
import {
  updateDriverStatus,
  updateDriverProfile,
  updateDocumentStatus,
  resetDriverPassword,
} from "../../store/slices/driverSlice";
import { useHasPermission } from "../../hooks/usePermission";
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
  SendOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  GlobalOutlined,
  WalletOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { capitalize } from "../../utilities/capitalize";
import "./DriverDetails.css";
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
  const canUpdateDriver = useHasPermission("drivers", "update");
  const actionLabels: Record<string, string> = {
    trip_started: "Trip Started",
    trip_completed: "Trip Completed",
    trip_cancelled: "Trip Cancelled",
  };

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
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

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
    Modal.confirm({
      title: `${capitalize(status)} Driver`,
      content: `Are you sure you want to change this driver's status to ${status}?`,
      onOk: async () => {
        setLoadingAction(status);
        try {
          await dispatch(
            updateDriverStatus({ driver_id: driver.driverId || driver.driver_id || driver.id || "", status }),
          ).unwrap();

          message.success(`Driver ${status} successfully`);
        } catch (err: any) {
          message.error(err || `Failed to ${status} driver`);
        } finally {
          setLoadingAction(null);
        }
      },
    });
  };

  const handleResetPassword = () => {
    if (!driver) return;
    Modal.confirm({
      title: "Reset Password",
      content: "Are you sure you want to send a password reset link?",
      onOk: async () => {
        setLoadingAction("reset-password");
        try {
          await dispatch(resetDriverPassword(driver.driverId || driver.driver_id || driver.id || "")).unwrap();
          message.success("Password reset link sent");
        } catch (err: any) {
          message.error(err || "Failed to send reset link");
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
      await dispatch(
        updateDriverProfile({
          driver_id: driver.driverId || driver.driver_id || driver.id || "",
          data: {
            ...values,
            dob: values.dob ? values.dob.toISOString() : undefined,
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
          {canUpdateDriver && (
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
                  dob: (driver?.dob || driver?.date_of_birth) ? dayjs(driver.dob || driver.date_of_birth) : null,
                });
                setIsEditModalOpen(true);
              }}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-medium px-4 h-9"
            >
              Edit Profile
            </Button>
          )}
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
              <GlobalOutlined />
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




  const documents = (
    <div className="grid grid-cols-1 gap-6">
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
            <Tag color={getStatusColor(doc?.license_status)} className="status-badge">
              {capitalize(doc?.license_status)}
            </Tag>
          </div>

          <div className="flex items-center gap-8 mb-6">
            <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-center border border-dashed border-gray-200 w-48 h-32 overflow-hidden shadow-inner group relative">
              {doc?.document_url ? (
                <>
                  <img
                    src={doc?.document_url}
                    alt={doc?.document_type}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div 
                    className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      setPreviewDoc({
                        url: doc?.document_url || doc?.url,
                        type: doc?.document_type || doc?.type,
                      });
                      setIsPreviewModalOpen(true);
                    }}
                  >
                    <EyeOutlined className="text-white text-2xl" />
                  </div>
                </>
              ) : (
                <FileTextOutlined className="text-4xl text-gray-200" />
              )}
            </div>
            <div className="flex-grow space-y-4">
              <div className="flex items-center gap-2">
                <CalendarOutlined className="text-red-400" />
                <div>
                  <Text type="secondary" className="text-[10px] uppercase font-bold tracking-tighter block">Expiry Date</Text>
                  <Text strong className="text-lg">{dayjs(doc?.expiry_date).format("MMM D, YYYY")}</Text>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="default"
                  icon={<DownloadOutlined />}
                  onClick={() => window.open(doc?.document_url, "_blank")}
                  className="rounded-lg h-9"
                >
                  Download
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end items-center pt-4 border-t border-gray-100 gap-3">
            {doc?.license_status !== "verified" && canUpdateDriver && (
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
        <Title level={4} className="mb-6 flex items-center gap-2 text-gray-800">
           <BarChartOutlined className="text-orange-500" /> Performance Statistics
        </Title>
        
        <div className="stats-container mb-6">
           <div className="stat-box">
              <Text type="secondary" className="info-label text-[10px]">Average Rating</Text>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-3xl font-extrabold text-gray-800">{(driver?.performance?.average_rating || 0).toFixed(1)}</span>
                <Rate
                  disabled
                  allowHalf
                  defaultValue={driver?.performance?.average_rating || 0}
                  style={{ fontSize: 14 }}
                />
              </div>
           </div>
           
           <div className="stat-box">
              <Text type="secondary" className="info-label text-[10px]">Total Trips</Text>
              <div className="mt-1">
                <span className="text-3xl font-extrabold text-blue-600">{driver?.performance?.total_trips || 0}</span>
                <span className="text-[10px] text-gray-400 ml-2">Trips completed</span>
              </div>
           </div>
        </div>

        <div className="stat-box bg-red-50/50 border-red-100 flex items-center justify-between mb-6">
           <div>
              <Text type="secondary" className="info-label text-[10px] text-red-400">Cancellations</Text>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-red-600">{driver?.performance?.cancellations || 0}</span>
                <span className="text-xs text-red-400 font-medium">
                  ({(driver?.performance?.total_trips || 0) > 0
                    ? (
                        ((driver?.performance?.cancellations || 0) /
                          (driver?.performance?.total_trips || 1)) *
                        100
                      )?.toFixed(1)
                    : "0.0"}%)
                </span>
              </div>
           </div>
           <CloseCircleOutlined className="text-red-200 text-3xl" />
        </div>

        <div className="content-card p-4 bg-gray-50 flex items-center gap-3 shadow-none border-dashed">
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
        <Title level={4} className="mb-6 flex items-center gap-2 text-gray-800">
           <LineChartOutlined className="text-blue-500" /> Activity Log
        </Title>
        <div className="space-y-4">
          {(driver?.activity_logs || driver?.activityLogs)?.map((log: any, index: number) => (
            <div key={log?.log_id || index} className="relative pl-8 pb-6 last:pb-0">
              {index !== ((driver?.activity_logs || driver?.activityLogs)?.length ?? 0) - 1 && (
                <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-gray-100"></div>
              )}
              <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-blue-50 border-2 border-white shadow-sm flex items-center justify-center z-10">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <Text strong className="text-gray-800 block">{actionLabels[log?.action] || log?.action}</Text>
                  <Text type="secondary" className="text-sm block mt-1">
                    {log?.details}
                  </Text>
                </div>
                <div className="text-right">
                  <Text type="secondary" className="text-[10px] whitespace-nowrap bg-gray-50 px-2 py-1 rounded">
                    <ClockCircleOutlined className="mr-1" />
                    {dayjs(log?.created_at).format("MMM D, hh:mm A")}
                  </Text>
                </div>
              </div>
            </div>
          ))}
          {(!driver?.activity_logs && !driver?.activityLogs || ((driver?.activity_logs || driver?.activityLogs)?.length ?? 0) === 0) && (
            <div className="text-center py-8 text-gray-400">
               <span className="italic">No activity logs found for this driver.</span>
            </div>
          )}
        </div>
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
    if (!canUpdateDriver) return null;
    switch (driver?.status) {
      case "pending":
        return (
          <Space wrap size="middle">
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={loadingAction === "active"}
              onClick={() => handleStatusUpdate("active")}
              className="bg-green-600 hover:bg-green-700 border-none shadow-md h-10 px-6 rounded-xl"
            >
              Approve Driver
            </Button>
            <Button
              danger
              icon={<CloseCircleOutlined />}
              loading={loadingAction === "blocked"}
              onClick={() => handleStatusUpdate("blocked")}
              className="h-10 px-6 rounded-xl shadow-sm"
            >
              Reject Driver
            </Button>
            <Button icon={<SendOutlined />} onClick={handleResetPassword} className="h-10 px-6 rounded-xl">
              Reset Password
            </Button>
          </Space>
        );
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
            <Button icon={<SendOutlined />} onClick={handleResetPassword} className="h-10 px-6 rounded-xl">
              Reset Password
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
            <Button
              type="default"
              icon={<SendOutlined />}
              onClick={handleResetPassword}
              className="h-10 px-6 rounded-xl"
            >
              Reset Password
            </Button>
          </div>
        );
    }
  };
  return (
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
            <div className="driver-avatar-wrapper">
              <Avatar
                size={100}
                src={driver?.profilePicUrl || driver?.profile_pic_url}
                icon={<UserOutlined />}
                className="border-2 border-white/50"
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
                {key === "7" && "LOGS"}
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

      {/* Edit Profile Modal */}
      <Modal
        title="Edit Driver Profile"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={loadingAction === "update-profile"}
        width={720}
        className="premium-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateProfile}
          initialValues={driver || {}}
        >
          <div className="grid grid-cols-2 gap-x-6">
            <Form.Item
              name="first_name"
              label="First Name"
              rules={[{ required: true, message: "Please enter first name" }]}
            >
              <Input prefix={<UserOutlined className="text-gray-300" />} size="large" className="rounded-xl" placeholder="John" />
            </Form.Item>
            <Form.Item
              name="last_name"
              label="Last Name"
              rules={[{ required: true, message: "Please enter last name" }]}
            >
              <Input prefix={<UserOutlined className="text-gray-300" />} size="large" className="rounded-xl" placeholder="Doe" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Please enter email" },
                { type: "email", message: "Please enter a valid email" },
              ]}
            >
              <Input prefix={<MailOutlined className="text-gray-300" />} size="large" className="rounded-xl" placeholder="john.doe@example.com" />
            </Form.Item>
            <Form.Item
              name="phone_number"
              label="Phone Number"
              rules={[{ required: true, message: "Please enter phone number" }]}
            >
              <Input prefix={<PhoneOutlined className="text-gray-300" />} size="large" className="rounded-xl" placeholder="+1 234 567 890" />
            </Form.Item>
            <Form.Item name="dob" label="Date of Birth">
              <DatePicker prefix={<CalendarOutlined className="text-gray-300" />} className="w-full rounded-xl" size="large" />
            </Form.Item>
            <Form.Item name="role" label="Role">
              <Select prefix={<RocketOutlined className="text-gray-300" />} size="large" className="rounded-xl">
                <Select.Option value="normal">Normal</Select.Option>
                <Select.Option value="premium">Premium</Select.Option>
                <Select.Option value="elite">Elite</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="gender" label="Gender">
              <Radio.Group className="mt-2">
                <Radio value="male">Male</Radio>
                <Radio value="female">Female</Radio>
                <Radio value="other">Other</Radio>
              </Radio.Group>
            </Form.Item>
          </div>

          <Divider orientation={"left" as any} className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Address Information</Divider>
          <Form.Item name={["address", "street"]} label="Street">
            <Input prefix={<GlobalOutlined className="text-gray-300" />} size="large" className="rounded-xl" placeholder="123 Main St" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-6">
            <Form.Item name={["address", "city"]} label="City">
              <Input prefix={<GlobalOutlined className="text-gray-300" />} size="large" className="rounded-xl" placeholder="New York" />
            </Form.Item>
            <Form.Item name={["address", "state"]} label="State">
              <Input prefix={<GlobalOutlined className="text-gray-300" />} size="large" className="rounded-xl" placeholder="NY" />
            </Form.Item>
            <Form.Item name={["address", "pincode"]} label="Pincode">
              <Input prefix={<GlobalOutlined className="text-gray-300" />} size="large" className="rounded-xl" placeholder="10001" />
            </Form.Item>
            <Form.Item name={["address", "country"]} label="Country">
              <Input prefix={<GlobalOutlined className="text-gray-300" />} size="large" className="rounded-xl" placeholder="USA" />
            </Form.Item>
          </div>
        </Form>
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

      {/* Rejection Reason Modal */}
      <Modal
        title={`Reject ${capitalize(rejectModalDoc?.type || "")} Document`}
        open={!!rejectModalDoc}
        onCancel={() => {
          setRejectModalDoc(null);
          setRejectionReason("");
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
          <Form.Item label="Rejection Reason" required className="mb-0">
            <Select
              placeholder="Select a common reason"
              onChange={(value) => setRejectionReason(value)}
              className="mb-3 rounded-xl"
              size="large"
            >
              <Select.Option value="Blurry/Unreadable">Blurry/Unreadable</Select.Option>
              <Select.Option value="Incorrect Document Type">Incorrect Document Type</Select.Option>
              <Select.Option value="Expired Document">Expired Document</Select.Option>
              <Select.Option value="Information Mismatch">Information Mismatch</Select.Option>
              <Select.Option value="Other">Other</Select.Option>
            </Select>
            <Input.TextArea
              placeholder="Provide more specific details if needed..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              className="rounded-xl"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Drawer>
  );
};

export default DriverDetails;
