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
  //  ClockCircleOutlined,
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
          <div className="flex w-full gap-3">
            {canUpdate && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                className="flex-1 !h-10 !rounded-xl !font-black !uppercase !tracking-wider !bg-emerald-600 hover:!bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95 border-none"
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
                className="flex-1 !h-10 !rounded-xl !font-bold hover:!bg-rose-50"
              >
                Delete Data
              </Button>
            )}
          </div>
        );

      case "inactive":
      case "suspended":
        return (
          <div className="flex w-full gap-3">
            {canUpdate && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                className="flex-1 !h-10 !rounded-xl !font-black !uppercase !tracking-wider !bg-emerald-600 hover:!bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95 border-none"
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
                className="flex-1 !h-10 !rounded-xl !font-bold border-rose-200 text-rose-600 hover:!bg-rose-50"
              >
                Block ID
              </Button>
            )}
          </div>
        );

      default: // active
        return (
          <div className="flex w-full gap-3">
            {canUpdate && (
              <Button
                danger
                type="primary"
                icon={<StopOutlined />}
                loading={actionLoading}
                onClick={handleBlock}
                className="flex-1 !h-10 !rounded-xl !font-black !uppercase !tracking-wider !bg-rose-600 hover:!bg-black shadow-lg shadow-rose-100 transition-all active:scale-95 border-none"
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
                className="flex-1 !h-10 !rounded-xl !font-black !uppercase !tracking-wider border-amber-200 text-amber-600 hover:!bg-amber-50 shadow-sm"
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
    <div className="grid grid-cols-2 gap-4 pt-2">
      {/* ROW 1: Personal Profile & Emergency Contacts */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-lg flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
            <UserOutlined className="text-blue-500 dark:text-blue-400 text-sm" />
          </div>
          <Title
            level={5}
            className="!m-0 text-gray-900 dark:text-slate-100 font-black tracking-tight uppercase text-[10px]"
          >
            Personal Profile
          </Title>
        </div>

        <div className="space-y-4 flex-grow">
          <div>
            <span className="text-[8px] uppercase font-black tracking-[0.1em] text-gray-400 dark:text-slate-500 block mb-1 px-1">
              Full Name
            </span>
            <div className="bg-slate-50/50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-50 dark:border-slate-700 flex items-center gap-3 group hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all">
              <div className="w-7 h-7 bg-white dark:bg-slate-600 rounded-lg flex items-center justify-center shadow-sm text-slate-400 dark:text-slate-300 uppercase font-black text-[9px]">
                {customer.full_name?.charAt(0) || "U"}
              </div>
              <div className="text-[13px] font-bold text-slate-700 dark:text-slate-200 tracking-tight">
                {customer.full_name}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <span className="text-[8px] uppercase font-black tracking-[0.1em] text-gray-400 dark:text-slate-500 block mb-1 px-1">
                Email Address
              </span>
              <div className="bg-slate-50/50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-50 dark:border-slate-700 flex items-center gap-3 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all group">
                <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-600 flex items-center justify-center text-slate-300 dark:text-slate-400 shadow-sm group-hover:text-blue-500 transition-colors">
                  <MailOutlined className="text-xs" />
                </div>
                <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200 truncate">
                  {customer.email}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[8px] uppercase font-black tracking-[0.1em] text-gray-400 dark:text-slate-500 block mb-1 px-1">
                  Contact Number
                </span>
                <div className="bg-slate-50/50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-50 dark:border-slate-700 flex items-center gap-3 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all group">
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-600 flex items-center justify-center text-slate-300 dark:text-slate-400 shadow-sm group-hover:text-emerald-500 transition-colors">
                    <PhoneOutlined className="rotate-90 text-xs" />
                  </div>
                  <span className="text-[12px] font-black text-slate-700 dark:text-slate-200 font-mono tracking-tight line-clamp-1">
                    {customer.phone_number}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[8px] uppercase font-black tracking-[0.1em] text-gray-400 dark:text-slate-500 block mb-1 px-1">
                  Gender
                </span>
                <div className="bg-slate-50/50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-50 dark:border-slate-700 flex items-center gap-2 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm transition-all group h-[42px]">
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-600 flex items-center justify-center text-slate-300 dark:text-slate-400 shadow-sm group-hover:text-indigo-500 transition-colors">
                    <GlobalOutlined className="text-xs" />
                  </div>
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    {customer.gender || "Other"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-lg flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-rose-50 dark:bg-rose-900/20 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400">
            <ExclamationCircleOutlined className="text-sm" />
          </div>
          <Title
            level={5}
            className="!m-0 text-gray-900 dark:text-slate-100 font-black tracking-tight uppercase text-[10px]"
          >
            Emergency Contacts
          </Title>
        </div>

        <div className="space-y-2 flex-grow">
          {customer.emergency_contacts && customer.emergency_contacts.length > 0 ? (
            customer.emergency_contacts.map((contact, index) => (
              <div
                key={index}
                className="bg-rose-50/30 dark:bg-rose-900/10 p-3 rounded-2xl border border-rose-100/40 dark:border-rose-800/30 flex items-center justify-between group hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-rose-300 dark:text-rose-500 shadow-sm border border-rose-50 dark:border-rose-800/50 font-black text-[9px]">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-black text-slate-800 dark:text-slate-200 text-[13px] leading-none mb-0.5">
                      {contact.name}
                    </div>
                    <div className="text-[8px] text-rose-400 dark:text-rose-500 font-black tracking-wider uppercase">
                      {contact.relationship || "Guardian"} • {contact.phone}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-4 text-center opacity-40">
              <Text className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                No Contacts Found
              </Text>
            </div>
          )}
        </div>
      </div>

      {/* ROW 2: Account & Total Rides */}

      <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-lg flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-500 dark:text-purple-400">
            <CalendarOutlined className="text-sm" />
          </div>
          <Title
            level={5}
            className="!m-0 text-gray-900 dark:text-slate-100 font-black tracking-tight uppercase text-[10px]"
          >
            Account Status
          </Title>
        </div>

        <div className="grid grid-cols-2 gap-3 relative">
          <div className="group h-full">
            <span className="text-[8px] uppercase font-black tracking-[0.1em] text-gray-400 dark:text-slate-500 block mb-1 px-1">
              Joined VDrive
            </span>
            <div className="bg-indigo-50/30 dark:bg-indigo-900/10 px-4 py-3 rounded-2xl border border-indigo-100/30 dark:border-indigo-800/30 h-full flex flex-col justify-center transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:shadow-sm">
              <div className="font-black text-slate-800 dark:text-slate-200 text-sm leading-tight mb-0.5">
                {dayjs(customer.created_at).format("MMM DD, YYYY")}
              </div>
              <div className="text-[8px] text-indigo-400 font-black uppercase tracking-[0.15em]">
                {dayjs(customer.created_at).format("hh:mm A")}
              </div>
            </div>
          </div>

          <div className="group h-full">
            <span className="text-[8px] uppercase font-black tracking-[0.1em] text-gray-400 dark:text-slate-500 block mb-1 px-1">
              Last System Update
            </span>
            <div className="bg-slate-50/50 dark:bg-slate-800/50 px-4 py-3 rounded-2xl border border-slate-100/50 dark:border-slate-700 h-full flex flex-col justify-center transition-all hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm">
              <div className="font-black text-slate-800 dark:text-slate-200 text-sm leading-tight mb-0.5">
                {dayjs(customer.updated_at).format("MMM DD, YYYY")}
              </div>
              <div className="text-[8px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.15em]">
                {dayjs(customer.updated_at).format("hh:mm A")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-lg flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-500 dark:text-emerald-400">
            <LineChartOutlined className="text-sm" />
          </div>
          <Title
            level={5}
            className="!m-0 text-gray-900 dark:text-slate-100 font-black tracking-tight uppercase text-[10px]"
          >
            Trip Analytics
          </Title>
        </div>

        <div className="flex flex-col items-center justify-center flex-grow py-3 border-2 border-dashed border-slate-50 dark:border-slate-700 rounded-3xl">
          <div className="text-[9px] uppercase font-black tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-1">
            Total Rides
          </div>
          <div className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter leading-none mb-1.5">
            {customer.total_trips || 0}
          </div>
        </div>
      </div>
    </div>
  );

  // const activity = (
  //   <div className="pt-2">
  //     <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-center">
  //       <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
  //         <ClockCircleOutlined style={{ fontSize: 24, color: "#cbd5e1" }} />
  //       </div>
  //       <Title level={5} className="!m-0 !mb-1 text-gray-800">Activity History</Title>
  //       <Text className="text-gray-400 text-sm">No recent activity logs found for this customer.</Text>
  //     </div>
  //   </div>
  // );

  const segments = [
    {
      label: (
        <Tooltip title="Basic Information">
          <div className="flex items-center justify-center gap-2 px-2 text-[11px] font-bold text-slate-600 dark:text-slate-300">
            <UserOutlined /> Info
          </div>
        </Tooltip>
      ),
      key: "1",
      content: basicInfo,
    },
    // {
    //   label: <Tooltip title="Activity Log"><div className="flex items-center justify-center gap-2 px-2 text-[11px] font-bold"><LineChartOutlined /> Activity</div></Tooltip>,
    //   key: "2",
    //   content: activity,
    // },
  ];

  return (
    <Drawer
      placement="right"
      width={900}
      onClose={onClose}
      open={open}
      closable={false}
      rootClassName="customer-details-drawer"
      styles={{
        header: { display: "none" },
      }}
    >
      {/* ─── Custom Premium Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden pt-8 pb-6 px-8 bg-white dark:bg-[#0f172a] border-b border-gray-100 dark:border-slate-800">
        {/* Decorative Status Orb */}
        <div
          className={`absolute -top-12 -right-12 w-48 h-48 bg-${statusColor === "emerald" ? "indigo" : statusColor}-500/5 blur-3xl rounded-full transition-colors duration-700`}
        />

        <div className="flex justify-between items-start relative z-10 mb-6">
          <div className="flex items-center gap-5">
            {/* ... avatar and titles ... */}
            <div className="relative group">
              {/* Dynamic Glow Layers */}
              <div
                className={`absolute -inset-2 bg-gradient-to-tr from-${statusColor === "emerald" ? "indigo" : statusColor}-600 to-${statusColor === "emerald" ? "blue" : "rose"}-400 rounded-[2rem] blur opacity-15 group-hover:opacity-25 transition-opacity duration-500`}
              />
              <div className={`absolute -inset-1 bg-white rounded-[1.8rem] z-0 shadow-sm`} />

              <Avatar
                size={72}
                icon={
                  <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full flex items-center justify-center">
                    <UserOutlined />
                  </div>
                }
                className={`relative z-10 bg-white border-4 border-white shadow-xl !text-slate-300 text-3xl flex items-center justify-center rounded-[1.5rem] transition-transform duration-500 group-hover:scale-105`}
              />

              <div
                className={`absolute -bottom-1 -right-1 z-20 w-7 h-7 bg-${statusColor === "emerald" ? "indigo" : statusColor}-600 border-4 border-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-12 transition-transform group-hover:rotate-0`}
              >
                <CheckCircleOutlined className="text-white text-[9px]" />
              </div>
            </div>

            <div>
              <Title
                level={3}
                className="!m-0 !mb-1 font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none group"
              >
                {customer.full_name}
                <div className="h-0.5 w-10 bg-indigo-500 rounded-full mt-2 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Title>
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                    customer.status === "active"
                      ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/30 text-indigo-600 dark:text-indigo-400"
                      : customer.status === "suspended"
                        ? "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30 text-amber-600 dark:text-amber-400"
                        : "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/30 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {customer.status}
                </div>
                {customer.role && (
                  <div className="px-2.5 py-0.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                    {customer.role}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-2">{renderStatusActions()}</div>
            <Button
              type="text"
              icon={<CloseOutlined className="text-slate-300 dark:text-slate-500 text-xs" />}
              onClick={onClose}
              className="hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl h-9 w-9 flex items-center justify-center transition-all active:scale-90"
            />
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          <div className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 rounded-[1.5rem] border border-slate-100/50 dark:border-slate-700 flex items-center justify-between shadow-inner">
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] text-slate-400 font-orange uppercase tracking-[0.2em] font-black">
                Customer ID
              </span>
              <span className="text-[13px] text-slate-900 dark:text-slate-100 font-black font-mono tracking-tighter">
                {customer.user_code || "VDU-NEW"}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200/60 dark:bg-slate-700/60" />
            <div className="flex flex-col gap-0.5 text-right flex-grow px-4">
              <span className="text-[8px] text-slate-400 font-orange uppercase tracking-[0.2em] font-black">
                Platform Authority
              </span>
              <span className="text-[11px] text-slate-900 dark:text-slate-100 font-black tracking-tight flex items-center justify-end gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                VDrive Admin
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200/60 dark:bg-slate-700/60" />
            <Tooltip title="View Intel History">
              <Button
                icon={<LineChartOutlined className="text-sm" />}
                className="!h-9 !w-9 !rounded-xl border-none shadow-none text-slate-300 dark:text-slate-500 hover:!text-indigo-600 hover:!bg-indigo-50/50 dark:hover:!bg-slate-700 transition-all ml-2"
              />
            </Tooltip>
          </div>
        </div>
      </div>

      {/* ─── Drawer Body Content ─────────────────────────────────────────── */}
      <div className="p-6 bg-slate-50 dark:bg-[#0f172a] min-h-full">
        <Segmented
          block
          options={segments.map(({ label, key }) => ({ label, value: key }))}
          value={activeKey}
          onChange={(value) => setActiveKey(value as string)}
          className="w-full premium-segmented !bg-slate-100 dark:!bg-slate-800 !p-1 rounded-2xl"
        />

        <div className="mt-4">{segments.find((tab) => tab.key === activeKey)?.content}</div>
      </div>
    </Drawer>
  );
};

export default CustomerDetails;
