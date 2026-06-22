import React, { useState } from "react";
import {
  Drawer,
  Typography,
  Button,
  Tooltip,
  Segmented,
  Avatar,
  Modal,
  Input,
  message,
} from "antd";
import dayjs from "dayjs";
import type { Customer } from "../../pages/Customers";
import {
  UserOutlined,
  CloseOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  StopOutlined,
  LineChartOutlined,
  ExclamationCircleOutlined,
  GlobalOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../store";
import { useHasPermission } from "../../hooks/usePermission";
import {
  blockCustomer,
  unblockCustomer,
  disableCustomer,
  enableCustomer,
  deleteCustomer,
} from "../../store/slices/customerSlice";

const { Text, Title } = Typography;

interface CustomerDetailsProps {
  customer: Customer | null;
  onClose: () => void;
  open: boolean;
  isSuperAdmin?: boolean;
}

// ─── Confirmation modal helper ────────────────────────────────────────────────
const showConfirm = ({
  title,
  description,
  confirmLabel,
  danger = false,
  requireReason = false,
  reasonPlaceholder,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  requireReason?: boolean;
  reasonPlaceholder?: string;
  onConfirm: (reason?: string) => void;
}) => {
  let reason = "";

  Modal.confirm({
    title,
    icon: <ExclamationCircleOutlined className={danger ? "text-red-500" : "text-green-500"} />,
    content: (
      <div className="mt-2">
        <p className="text-gray-500 text-sm mb-3">{description}</p>
        {requireReason && (
          <Input.TextArea
            rows={3}
            placeholder={reasonPlaceholder ?? "Enter reason..."}
            onChange={(e) => {
              reason = e.target.value;
            }}
          />
        )}
      </div>
    ),
    okText: confirmLabel,
    okType: danger ? "danger" : "primary",
    cancelText: "Cancel",
    onOk() {
      if (requireReason && !reason.trim()) {
        message.error("Reason is required.");
        return Promise.reject(); // keep modal open
      }
      onConfirm(reason.trim() || undefined);
    },
  });
};

// ─── Component ────────────────────────────────────────────────────────────────
const CustomerDetails: React.FC<CustomerDetailsProps> = ({
  customer,
  onClose,
  open,
  isSuperAdmin = false,
}) => {
  if (!customer) return null;

  const dispatch = useDispatch<AppDispatch>();
  const { actionLoading } = useSelector((state: RootState) => state.customers);
  const [activeKey, setActiveKey] = useState("1");
  const canUpdateCustomer = useHasPermission("customers", "update");
  const canDeleteCustomer = useHasPermission("customers", "delete");

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleBlock = () => {
    showConfirm({
      title: "Block this customer?",
      description:
        "The customer will be permanently prevented from using the app until manually unblocked.",
      confirmLabel: "Block",
      danger: true,
      requireReason: true,
      reasonPlaceholder: "e.g. Fraud, repeated policy violations...",
      onConfirm: async (reason) => {
        try {
          await dispatch(blockCustomer({ id: customer.id, reason: reason! })).unwrap();
          message.success("Customer has been blocked.");
          onClose();
        } catch (error: any) {
          console.log("block error:", error);
          message.error("Failed to block customer.");
          onClose();
        }
      },
    });
  };

  const handleUnblock = () => {
    showConfirm({
      title: "Unblock this customer?",
      description: "This will restore the customer's access to the app.",
      confirmLabel: "Unblock",
      danger: false,
      onConfirm: async () => {
        try {
          await dispatch(unblockCustomer(customer.id)).unwrap();
          message.success("Customer has been unblocked.");
          onClose();
        } catch (error: any) {
          console.log("unblock error:", error);
          message.error("Failed to unblock customer.");
          onClose();
        }
      },
    });
  };

  const handleDisable = () => {
    showConfirm({
      title: "Suspend this customer?",
      description: "The customer will be temporarily restricted from using the app.",
      confirmLabel: "Suspend",
      danger: true,
      requireReason: true,
      reasonPlaceholder: "e.g. Suspicious activity, complaint under review...",
      onConfirm: async (reason) => {
        try {
          await dispatch(disableCustomer({ id: customer.id, reason: reason! })).unwrap();
          message.success("Customer has been suspended.");
          onClose();
        } catch (error: any) {
          console.log("disable error:", error);
          message.error("Failed to suspend customer.");
          onClose();
        }
      },
    });
  };

  const handleEnable = () => {
    showConfirm({
      title: "Activate this customer?",
      description: "This will restore full access to the customer's account.",
      confirmLabel: "Activate",
      danger: false,
      onConfirm: async () => {
        try {
          await dispatch(enableCustomer(customer.id)).unwrap();
          message.success("Customer has been activated.");
          onClose();
        } catch (error: any) {
          console.log("enable error:", error);
          message.error("Failed to activate customer.");
          onClose();
        }
      },
    });
  };

  const handleDelete = () => {
    showConfirm({
      title: "Delete this customer?",
      description: "This action cannot be undone. The customer's data will be permanently removed.",
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        try {
          await dispatch(deleteCustomer(customer.id)).unwrap();
          message.success("Customer has been deleted.");
          onClose();
        } catch (error: any) {
          console.log("delete error:", error);
          message.error("Failed to delete customer.");
        }
      },
    });
  };

  // ─── Status-aware action buttons ───────────────────────────────────────────
  const renderStatusActions = () => {
    const canUpdate = isSuperAdmin || canUpdateCustomer;
    const canDelete = isSuperAdmin || canDeleteCustomer;

    if (!canUpdate && !canDelete) return null;
    switch (customer.status) {
      case "blocked":
        return (
          <div className="cd-actions-wrapper">
            {canUpdate && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                className="cd-btn-action cd-btn-primary emerald"
                loading={actionLoading}
                onClick={handleUnblock}
              >
                Recover Account
              </Button>
            )}
            {canDelete && (
              <Button
                danger
                type="text"
                icon={<CloseCircleOutlined />}
                loading={actionLoading}
                onClick={handleDelete}
                className="cd-btn-action cd-btn-danger-text"
              >
                Delete Data
              </Button>
            )}
          </div>
        );

      case "inactive":
      case "suspended":
        return (
          <div className="cd-actions-wrapper">
            {canUpdate && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                className="cd-btn-action cd-btn-primary emerald"
                loading={actionLoading}
                onClick={handleEnable}
              >
                Enable Customer
              </Button>
            )}
            {canUpdate && (
              <Button
                danger
                type="dashed"
                icon={<StopOutlined />}
                loading={actionLoading}
                onClick={handleBlock}
                className="cd-btn-action cd-btn-danger-dashed"
              >
                Block ID
              </Button>
            )}
          </div>
        );

      default: // active
        return (
          <div className="cd-actions-wrapper">
            {canUpdate && (
              <Button
                danger
                type="primary"
                icon={<StopOutlined />}
                loading={actionLoading}
                onClick={handleBlock}
                className="cd-btn-action cd-btn-primary rose"
              >
                Block Account
              </Button>
            )}
            {canUpdate && (
              <Button
                type="default"
                icon={<CloseCircleOutlined />}
                loading={actionLoading}
                onClick={handleDisable}
                className="cd-btn-action cd-btn-warning"
              >
                Suspend
              </Button>
            )}
          </div>
        );
    }
  };

  // ─── Status Tag Helper ────────────────────────────────────────────────────
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "emerald";
      case "suspended":
        return "orange";
      case "blocked":
        return "red";
      default:
        return "blue";
    }
  };

  const statusColor = getStatusColor(customer.status);

  // ─── Tab content ────────────────────────────────────────────────────────────
  const basicInfo = (
    <div className="cd-grid">
      {/* ROW 1: Personal Profile & Emergency Contacts */}
      <div className="cd-card">
        <div className="cd-card-header">
          <div className="cd-card-icon blue">
            <UserOutlined />
          </div>
          <Title level={5} className="cd-card-title">
            Personal Profile
          </Title>
        </div>

        <div className="cd-card-body">
          <div className="cd-info-group">
            <span className="cd-label">Full Name</span>
            <div className="cd-info-box group">
              <div className="cd-info-icon-wrapper blue cd-info-text upper">
                {customer.full_name?.charAt(0) || "U"}
              </div>
              <div className="cd-info-text">
                {customer.full_name}
              </div>
            </div>
          </div>

          <div className="cd-info-group">
            <span className="cd-label">Email Address</span>
            <div className="cd-info-box group">
              <div className="cd-info-icon-wrapper blue">
                <MailOutlined />
              </div>
              <span className="cd-info-text">
                {customer.email}
              </span>
            </div>
          </div>

          <div className="cd-grid" style={{ paddingTop: 0, gap: '0.5rem' }}>
            <div className="cd-info-group">
              <span className="cd-label">Contact Number</span>
              <div className="cd-info-box group">
                <div className="cd-info-icon-wrapper emerald" style={{ transform: 'rotate(90deg)' }}>
                  <PhoneOutlined />
                </div>
                <span className="cd-info-text mono">
                  {customer.phone_number}
                </span>
              </div>
            </div>

            <div className="cd-info-group">
              <span className="cd-label">Gender</span>
              <div className="cd-info-box group" style={{ height: '34px' }}>
                <div className="cd-info-icon-wrapper indigo">
                  <GlobalOutlined />
                </div>
                <span className="cd-info-text upper">
                  {customer.gender || "Other"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cd-card">
        <div className="cd-card-header">
          <div className="cd-card-icon rose">
            <ExclamationCircleOutlined />
          </div>
          <Title level={5} className="cd-card-title">
            Emergency Contacts
          </Title>
        </div>

        <div className="cd-card-body">
          {customer.emergency_contacts && customer.emergency_contacts.length > 0 ? (
            customer.emergency_contacts.map((contact, index) => (
              <div key={index} className="cd-emergency-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="cd-emergency-index">
                    {index + 1}
                  </div>
                  <div>
                    <div className="cd-emergency-name">
                      {contact.name}
                    </div>
                    <div className="cd-emergency-rel">
                      {contact.relationship || "Guardian"} • {contact.phone}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="cd-empty-state">
              <Text className="cd-empty-text">
                No Contacts Found
              </Text>
            </div>
          )}
        </div>
      </div>

      {/* ROW 2: Account & Total Rides */}

      <div className="cd-card">
        <div className="cd-card-header">
          <div className="cd-card-icon purple">
            <CalendarOutlined />
          </div>
          <Title level={5} className="cd-card-title">
            Account Status
          </Title>
        </div>

        <div className="cd-stats-grid">
          <div style={{ height: '100%' }}>
            <span className="cd-label">Joined VDrive</span>
            <div className="cd-stats-box indigo">
              <div className="cd-stats-value">
                {dayjs(customer.created_at).format("MMM DD, YYYY")}
              </div>
              <div className="cd-stats-sub indigo">
                {dayjs(customer.created_at).format("hh:mm A")}
              </div>
            </div>
          </div>

          <div style={{ height: '100%' }}>
            <span className="cd-label">Last System Update</span>
            <div className="cd-stats-box slate">
              <div className="cd-stats-value">
                {dayjs(customer.updated_at).format("MMM DD, YYYY")}
              </div>
              <div className="cd-stats-sub slate">
                {dayjs(customer.updated_at).format("hh:mm A")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cd-card">
        <div className="cd-card-header">
          <div className="cd-card-icon emerald">
            <LineChartOutlined />
          </div>
          <Title level={5} className="cd-card-title">
            Trip Analytics
          </Title>
        </div>

        <div className="cd-trip-box">
          <div className="cd-trip-label">
            Total Rides
          </div>
          <div className="cd-trip-value">
            {customer.total_trips || 0}
          </div>
        </div>
      </div>
    </div>
  );

  const segments = [
    {
      label: (
        <Tooltip title="Basic Information">
          <div className="dark:text-slate-200" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0 0.5rem', fontSize: '11px', fontWeight: 'bold' }}>
            <UserOutlined /> Info
          </div>
        </Tooltip>
      ),
      key: "1",
      content: basicInfo,
    },
  ];

  return (
    <>
      <style>{`
        .cd-header-container { position: relative; overflow: hidden; padding: 1.5rem 1.5rem 1rem 1.5rem; background-color: white; border-bottom: 1px solid #f3f4f6; }
        .dark .cd-header-container { background-color: #0f172a; border-color: #1e293b; }

        .cd-status-orb { position: absolute; top: -3rem; right: -3rem; width: 10rem; height: 10rem; filter: blur(24px); border-radius: 9999px; transition: background-color 0.7s; opacity: 0.05; }
        .cd-status-orb.emerald { background-color: #6366f1; } 
        .cd-status-orb.orange { background-color: #f97316; }
        .cd-status-orb.red { background-color: #ef4444; }

        .cd-header-content { display: flex; justify-content: space-between; align-items: flex-start; position: relative; z-index: 10; margin-bottom: 1rem; }
        .cd-header-left { display: flex; align-items: center; gap: 1rem; }

        .cd-avatar-group { position: relative; }
        .cd-avatar-glow { position: absolute; top: -0.5rem; right: -0.5rem; bottom: -0.5rem; left: -0.5rem; border-radius: 1rem; filter: blur(8px); opacity: 0.15; transition: opacity 0.5s; }
        .cd-avatar-group:hover .cd-avatar-glow { opacity: 0.25; }
        .cd-avatar-glow.emerald { background: linear-gradient(to top right, #4f46e5, #60a5fa); }
        .cd-avatar-glow.orange { background: linear-gradient(to top right, #f97316, #fbbf24); }
        .cd-avatar-glow.red { background: linear-gradient(to top right, #e11d48, #fb7185); }

        .cd-avatar-bg { position: absolute; top: -0.25rem; right: -0.25rem; bottom: -0.25rem; left: -0.25rem; background-color: white; border-radius: 0.75rem; z-index: 0; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); }

        .cd-avatar { position: relative; z-index: 10; background-color: white; border: 4px solid white; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #cbd5e1 !important; transition: transform 0.5s; }
        .cd-avatar-group:hover .cd-avatar { transform: scale(1.05); }

        .cd-avatar-icon-bg { width: 100%; height: 100%; background: linear-gradient(to bottom right, #eef2ff, #eff6ff); border-radius: 9999px; display: flex; align-items: center; justify-content: center; }

        .cd-status-badge { position: absolute; bottom: -0.25rem; right: -0.25rem; z-index: 20; width: 1.5rem; height: 1.5rem; border: 4px solid white; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); transform: rotate(12deg); transition: transform 0.3s; }
        .cd-avatar-group:hover .cd-status-badge { transform: rotate(0deg); }
        .cd-status-badge.emerald { background-color: #4f46e5; }
        .cd-status-badge.orange { background-color: #f97316; }
        .cd-status-badge.red { background-color: #e11d48; }
        .cd-status-badge-icon { color: white; font-size: 8px; }

        .cd-name-title { margin: 0 !important; margin-bottom: 0.125rem !important; font-weight: 900; color: #0f172a; letter-spacing: -0.025em; line-height: 1; font-size: 14px !important}
        .dark .cd-name-title { color: #f1f5f9; }

        .cd-name-underline { height: 0.125rem; width: 2.5rem; background-color: #6366f1; border-radius: 9999px; margin-top: 0.375rem; transform: scaleX(0); transition: transform 0.3s; transform-origin: left; }
        .cd-name-title:hover .cd-name-underline { transform: scaleX(1); }

        .cd-tags-wrapper { display: flex; align-items: center; gap: 0.5rem; }

        .cd-status-tag { display: flex; align-items: center; gap: 0.25rem; padding: 0.125rem 0.5rem; border-radius: 0.5rem; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid transparent; transition: all 0.3s; }
        .cd-status-tag.emerald { background-color: #eef2ff; border-color: #e0e7ff; color: #4f46e5; }
        .dark .cd-status-tag.emerald { background-color: rgba(49, 46, 129, 0.2); border-color: rgba(55, 48, 163, 0.3); color: #818cf8; }
        .cd-status-tag.orange { background-color: #fffbeb; border-color: #fef3c7; color: #d97706; }
        .dark .cd-status-tag.orange { background-color: rgba(120, 53, 15, 0.2); border-color: rgba(146, 64, 14, 0.3); color: #fbbf24; }
        .cd-status-tag.red { background-color: #fff1f2; border-color: #ffe4e6; color: #e11d48; }
        .dark .cd-status-tag.red { background-color: rgba(136, 19, 55, 0.2); border-color: rgba(159, 18, 57, 0.3); color: #fb7185; }

        .cd-status-dot { width: 0.375rem; height: 0.375rem; border-radius: 9999px; background-color: currentColor; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

        .cd-role-tag { padding: 0.125rem 0.5rem; border-radius: 0.5rem; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; background-color: #f1f5f9; border: 1px solid rgba(226, 232, 240, 0.5); color: #64748b; }
        .dark .cd-role-tag { background-color: #1e293b; border-color: #334155; color: #94a3b8; }

        .cd-header-right { display: flex; align-items: center; gap: 0.5rem; }
        .cd-actions-wrapper { display: flex; align-items: center; gap: 0.5rem; margin-right: 0.5rem; width: 100%; }

        .cd-close-btn { border-radius: 0.5rem; height: 2rem; width: 2rem; display: flex; align-items: center; justify-content: center; transition: all 0.2s; border: none; background: transparent; cursor: pointer; }
        .cd-close-btn:hover { background-color: #f8fafc; }
        .dark .cd-close-btn:hover { background-color: #1e293b; }
        .cd-close-btn:active { transform: scale(0.9); }
        .cd-close-icon { color: #cbd5e1; font-size: 0.75rem; }
        .dark .cd-close-icon { color: #64748b; }

        .cd-id-box { background-color: rgba(248, 250, 252, 0.8); backdrop-filter: blur(4px); padding: 0.75rem; border-radius: 0.75rem; border: 1px solid rgba(241, 245, 249, 0.5); display: flex; align-items: center; justify-content: space-between; box-shadow: inset 0 2px 4px 0 rgba(0,0,0,0.02); position: relative; z-index: 10; }
        .dark .cd-id-box { background-color: rgba(30, 41, 59, 0.8); border-color: #334155; }

        .cd-id-col { display: flex; flex-direction: column; gap: 0.125rem; }
        .cd-id-label { font-size: 7px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 900; }
        .cd-id-value { font-size: 10px; color: #0f172a; font-weight: 900; font-family: monospace; letter-spacing: -0.05em; }
        .dark .cd-id-value { color: #f1f5f9; }

        .cd-id-divider { height: 1.25rem; width: 1px; background-color: rgba(226, 232, 240, 0.6); }
        .dark .cd-id-divider { background-color: rgba(51, 65, 85, 0.6); }

        .cd-auth-col { display: flex; flex-direction: column; gap: 0.125rem; text-align: right; flex-grow: 1; padding: 0 0.75rem; }
        .cd-auth-value { font-size: 8px; color: #0f172a; font-weight: 900; letter-spacing: -0.025em; display: flex; align-items: center; justify-content: flex-end; gap: 0.25rem; }
        .dark .cd-auth-value { color: #f1f5f9; }
        .cd-auth-dot { width: 0.375rem; height: 0.375rem; border-radius: 9999px; background-color: #10b981; }

        .cd-history-btn { height: 1.75rem !important; width: 1.75rem !important; border-radius: 0.5rem !important; border: none !important; box-shadow: none !important; color: #cbd5e1 !important; transition: all 0.3s !important; margin-left: 0.5rem !important; }
        .dark .cd-history-btn { color: #64748b !important; background: transparent !important; }
        .cd-history-btn:hover { color: #4f46e5 !important; background-color: rgba(238, 242, 255, 0.5) !important; }
        .dark .cd-history-btn:hover { background-color: #334155 !important; }

        /* Grid and Cards */
        .cd-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; padding-top: 0.5rem; }

        .cd-card { background-color: white; padding: 1rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; transition: all 0.3s; display: flex; flex-direction: column; height: 100%; }
        .dark .cd-card { background-color: #1e293b; border-color: #334155; }
        .cd-card:hover { border-color: #cbd5e1; }

        .cd-card-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }

        .cd-card-icon { width: 1.5rem; height: 1.5rem; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; }
        .cd-card-icon.blue { background-color: #eff6ff; color: #3b82f6; }
        .dark .cd-card-icon.blue { background-color: rgba(30, 58, 138, 0.2); color: #60a5fa; }
        .cd-card-icon.rose { background-color: #fff1f2; color: #f43f5e; }
        .dark .cd-card-icon.rose { background-color: rgba(136, 19, 55, 0.2); color: #fb7185; }
        .cd-card-icon.purple { background-color: #faf5ff; color: #a855f7; }
        .dark .cd-card-icon.purple { background-color: rgba(88, 28, 135, 0.2); color: #c084fc; }
        .cd-card-icon.emerald { background-color: #ecfdf5; color: #10b981; }
        .dark .cd-card-icon.emerald { background-color: rgba(6, 78, 59, 0.2); color: #34d399; }

        .cd-card-title { margin: 0 !important; color: #0f172a; font-weight: 900; letter-spacing: -0.025em; text-transform: Capitalize; font-size: 8px; }
        .dark .cd-card-title { color: #f1f5f9; }

        .cd-card-body { display: flex; flex-direction: column; gap: 0.75rem; flex-grow: 1; }
        .cd-info-group { display: flex; flex-direction: column; gap: 0.5rem; }

        .cd-label { font-size: 7px; text-transform: uppercase; font-weight: 900; letter-spacing: 0.1em; color: #94a3b8; display: block; margin-bottom: 0.25rem; padding: 0 0.25rem; }
        .dark .cd-label { color: #94a3b8; }

        .cd-info-box { background-color: rgba(248, 250, 252, 0.5); padding: 0.5rem; border-radius: 0.5rem; border: 1px solid #f8fafc; display: flex; align-items: center; gap: 0.5rem; transition: all 0.3s; }
        .dark .cd-info-box { background-color: rgba(30, 41, 59, 0.5); border-color: #334155; }
        .cd-info-box:hover { background-color: white; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); }
        .dark .cd-info-box:hover { background-color: #334155; }

        .cd-info-icon-wrapper { width: 1.5rem; height: 1.5rem; border-radius: 0.375rem; background-color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); color: #94a3b8; transition: color 0.3s; font-size: 10px; }
        .dark .cd-info-icon-wrapper { background-color: #475569; color: #f1f5f9; }
        .cd-info-box:hover .cd-info-icon-wrapper.blue { color: #3b82f6; }
        .cd-info-box:hover .cd-info-icon-wrapper.emerald { color: #10b981; }
        .cd-info-box:hover .cd-info-icon-wrapper.indigo { color: #6366f1; }

        .cd-info-text { font-size: 11px !important; font-weight: 700; color: #334155; letter-spacing: -0.025em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dark .cd-info-text { color: #f1f5f9; }

        .cd-info-text.mono { font-family: monospace; font-size: 11px !important; font-weight: 900; }
        .cd-info-text.upper { text-transform: uppercase; font-size: 11px !important; letter-spacing: 0.05em; }

        .cd-emergency-item { background-color: rgba(255, 241, 242, 0.3); padding: 0.5rem; border-radius: 0.5rem; border: 1px solid rgba(255, 228, 230, 0.4); display: flex; align-items: center; justify-content: space-between; transition: background-color 0.3s; }
        .dark .cd-emergency-item { background-color: rgba(136, 19, 55, 0.1); border-color: rgba(159, 18, 57, 0.3); }
        .cd-emergency-item:hover { background-color: #fff1f2; }
        .dark .cd-emergency-item:hover { background-color: rgba(136, 19, 55, 0.2); }

        .cd-emergency-index { width: 1.5rem; height: 1.5rem; border-radius: 0.375rem; background-color: white; display: flex; align-items: center; justify-content: center; color: #fda4af; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); border: 1px solid #fff1f2; font-weight: 900; font-size: 8px; }
        .dark .cd-emergency-index { background-color: #334155; color: #f43f5e; border-color: rgba(159, 18, 57, 0.5); }

        .cd-emergency-name { font-weight: 900; color: #1e293b; font-size: 9px; line-height: 1; margin-bottom: 0.125rem; }
        .dark .cd-emergency-name { color: #e2e8f0; }

        .cd-emergency-rel { font-size: 7px; color: #fb7185; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; }

        .cd-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 1rem 0; text-align: center; opacity: 0.4; }
        .cd-empty-text { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #94a3b8; }
        .dark .cd-empty-text { color: #64748b; }

        .cd-stats-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem; height: 100%; }

        .cd-stats-box { padding: 0.5rem 0.75rem; border-radius: 0.5rem; display: flex; flex-direction: column; justify-content: center; transition: all 0.3s; height: 100%; }
        .cd-stats-box.indigo { background-color: rgba(238, 242, 255, 0.3); border: 1px solid rgba(224, 231, 255, 0.3); }
        .dark .cd-stats-box.indigo { background-color: rgba(49, 46, 129, 0.1); border-color: rgba(55, 48, 163, 0.3); }
        .cd-stats-box.indigo:hover { background-color: #eef2ff; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); }
        .dark .cd-stats-box.indigo:hover { background-color: rgba(49, 46, 129, 0.2); }

        .cd-stats-box.slate { background-color: rgba(248, 250, 252, 0.5); border: 1px solid rgba(241, 245, 249, 0.5); }
        .dark .cd-stats-box.slate { background-color: rgba(30, 41, 59, 0.5); border-color: #334155; }
        .cd-stats-box.slate:hover { background-color: white; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); }
        .dark .cd-stats-box.slate:hover { background-color: #334155; }

        .cd-stats-value { font-weight: 900; color: #1e293b; font-size: 9px; line-height: 1.25; margin-bottom: 0.125rem; }
        .dark .cd-stats-value { color: #e2e8f0; }

        .cd-stats-sub { font-size: 7px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; }
        .cd-stats-sub.indigo { color: #818cf8; }
        .cd-stats-sub.slate { color: #94a3b8; }
        .dark .cd-stats-sub.slate { color: #64748b; }

        .cd-trip-box { display: flex; flex-direction: column; align-items: center; justify-content: center; flex-grow: 1; padding: 0.5rem 0; border: 2px dashed #f8fafc; border-radius: 0.75rem; }
        .dark .cd-trip-box { border-color: #334155; }
        .cd-trip-label { font-size: 8px; text-transform: uppercase; font-weight: 900; letter-spacing: 0.2em; color: #94a3b8; margin-bottom: 0.25rem; }
        .dark .cd-trip-label { color: #64748b; }
        .cd-trip-value { font-size: 1.25rem; font-weight: 900; color: #0f172a; letter-spacing: -0.05em; line-height: 1; margin-bottom: 0.25rem; }
        .dark .cd-trip-value { color: #f1f5f9; }

        .cd-body-container { padding: 1rem; background-color: #f8fafc; min-height: 100%; }
        .dark .cd-body-container { background-color: #0f172a; }

        .cd-tabs-wrapper { margin-top: 1rem; }

        /* Action Buttons */
        .cd-btn-action { flex: 1 !important; height: 2rem !important; border-radius: 6px !important;font-size:9px !important; font-weight: 900 !important; text-transform: uppercase !important; letter-spacing: 0.025em !important; display: flex !important; align-items: center !important; justify-content: center !important; border: none !important; }
        .cd-btn-primary.emerald { background-color: #059669 !important; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.2) !important; color: white !important; }
        .cd-btn-primary.emerald:hover { background-color: #047857 !important; }

        .cd-btn-primary.rose {  background-color: white !important; border: 1px solid red !important; color: red !important; }
        .dark .cd-btn-primary.rose { background-color: transparent !important; }
        .cd-btn-primary.rose:hover { background-color: red !important; color: white !important; }

        .cd-btn-danger-text { color: red !important; background: transparent !important; }
        .cd-btn-danger-text:hover { background-color: red !important; color: white !important; }

        .cd-btn-danger-dashed { border: 1px dashed #fecdd3 !important; color: red !important; background: transparent !important; }
        .cd-btn-danger-dashed:hover { background-color: red !important; color: white !important; }

        .cd-btn-warning { border: 1px solid #f97316 !important; color: #ea580c !important; background-color: white !important; }
        .dark .cd-btn-warning { background-color: transparent !important; color: #fb923c !important; border-color: #fb923c !important; }
        .cd-btn-warning:hover { background-color: #f97316 !important; color: white !important; }
      `}</style>

      <Drawer
        placement="right"
        width={750}
        onClose={onClose}
        open={open}
        closable={false}
        rootClassName="customer-details-drawer"
        styles={{
          header: { display: "none" },
        }}
      >
        <div className="cd-header-container">
          <div className={`cd-status-orb ${statusColor}`} />

          <div className="cd-header-content">
            <div className="cd-header-left">
              <div className="cd-avatar-group">
                <div className={`cd-avatar-glow ${statusColor}`} />
                <div className="cd-avatar-bg" />

                <Avatar
                  size={56}
                  icon={
                    <div className="cd-avatar-icon-bg">
                      <UserOutlined />
                    </div>
                  }
                  className="cd-avatar"
                />

                <div className={`cd-status-badge ${statusColor}`}>
                  <CheckCircleOutlined className="cd-status-badge-icon" />
                </div>
              </div>

              <div>
                <Title level={4} className="cd-name-title">
                  {customer.full_name}
                  <div className="cd-name-underline" />
                </Title>
                <div className="cd-tags-wrapper">
                  <div className={`cd-status-tag ${statusColor}`}>
                    <span className="cd-status-dot" />
                    {customer.status}
                  </div>
                  {customer.role && (
                    <div className="cd-role-tag">
                      {customer.role}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="cd-header-right">
              {renderStatusActions()}
              <button className="cd-close-btn" onClick={onClose}>
                <CloseOutlined className="cd-close-icon" />
              </button>
            </div>
          </div>

          <div className="cd-id-box">
            <div className="cd-id-col">
              <span className="cd-id-label">
                Customer ID
              </span>
              <span className="cd-id-value">
                {customer.user_code || "VDU-NEW"}
              </span>
            </div>
            <div className="cd-id-divider" />
            <div className="cd-auth-col">
              <span className="cd-id-label">
                Platform Authority
              </span>
              <span className="cd-auth-value">
                <span className="cd-auth-dot" />
                VDrive Admin
              </span>
            </div>
            <div className="cd-id-divider" />
            <Tooltip title="View Intel History">
              <Button
                icon={<LineChartOutlined />}
                className="cd-history-btn"
              />
            </Tooltip>
          </div>
        </div>

        <div className="cd-body-container">
          <Segmented
            block
            options={segments.map(({ label, key }) => ({ label, value: key }))}
            value={activeKey}
            onChange={(value) => setActiveKey(value as string)}
            className="w-full premium-segmented !bg-slate-100 dark:!bg-slate-800 !p-1 rounded-xl"
          />

          <div className="cd-tabs-wrapper">{segments.find((tab) => tab.key === activeKey)?.content}</div>
        </div>
      </Drawer>
    </>
  );
};

export default CustomerDetails;
