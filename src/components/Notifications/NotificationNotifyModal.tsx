import React, { useState, useEffect } from "react";
import { Modal, Select, Button, Space, Typography, notification, Divider } from "antd";
import { SendOutlined, UserOutlined, TeamOutlined, RiseOutlined, FallOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useHasPermission } from "../../hooks/usePermission";
import { fetchCustomers } from "../../store/slices/customerSlice";
import { fetchDrivers } from "../../store/slices/driverSlice";
import { updateNotification } from "../../store/slices/notificationSlice";
import axios from "../../api/axios";

const { Text, Title } = Typography;
const { Option } = Select;

interface NotificationNotifyModalProps {
  visible: boolean;
  onCancel: () => void;
  notificationData: any;
  targetType: "CUSTOMER" | "DRIVER";
}

const NotificationNotifyModal: React.FC<NotificationNotifyModalProps> = ({
  visible,
  onCancel,
  notificationData,
  targetType
}) => {
  const dispatch = useAppDispatch();
  const { customers, loading: customersLoading } = useAppSelector((state) => state.customers);
  const { drivers, loading: driversLoading } = useAppSelector((state) => state.drivers);

  const [target, setTarget] = useState<string>(notificationData?.target_audience || "ALL");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(notificationData?.specific_user_id || []);
  const [loading, setLoading] = useState(false);

  const currentAudience = targetType === 'CUSTOMER' ? customers : drivers;
  const currentLoading = targetType === 'CUSTOMER' ? customersLoading : driversLoading;

  const canUpdate = useHasPermission("notifications", "update");
  const hasDriversRead = useHasPermission("drivers", "read");
  const hasCustomersRead = useHasPermission("customers", "read");
  const { role } = useAppSelector((state) => state.auth);
  const isSuperAdmin = role === 'super_admin';
  const isAllowed = isSuperAdmin || canUpdate;

  useEffect(() => {
    if (visible && notificationData) {
      setTarget(notificationData.target_audience || "ALL");
      setSelectedUserIds(notificationData.specific_user_id || []);
    }
  }, [visible, notificationData]);

  useEffect(() => {
    if (visible && target === "SPECIFIC") {
      if (targetType === 'DRIVER' && drivers.length === 0 && (isSuperAdmin || hasDriversRead)) {
        dispatch(fetchDrivers());
      } else if (targetType === 'CUSTOMER' && customers.length === 0 && (isSuperAdmin || hasCustomersRead)) {
        dispatch(fetchCustomers());
      }
    }
  }, [visible, target, targetType, dispatch, drivers.length, customers.length, isSuperAdmin, hasDriversRead, hasCustomersRead]);

  const handleSend = async () => {
    if (target === "SPECIFIC" && selectedUserIds.length === 0) {
      notification.warning({ message: "Please select at least one user" });
      return;
    }

    setLoading(true);
    try {
      // Logic for achievement:
      // The backend will receive this request and queue it for a cron job.
      // Payload includes targeting rules and the notification content.

      // Update the notification template target audience and users
      await dispatch(updateNotification({
        id: notificationData.id,
        notificationData: {
          target_audience: target as any,
          specific_user_id: selectedUserIds,
          target_type: targetType
        }
      })).unwrap();

      await axios.post("/api/notification-management/dispatch", {
        notificationId: notificationData.id,
        target_audience: target,
        specific_user_id: selectedUserIds,
        target_type: targetType
      });

      notification.success({
        message: "Notification Campaign Queued",
        description: `The broadcast for "${notificationData.title}" is being processed and will be sent via cron job.`
      });
      onCancel();
    } catch (error: any) {
      notification.error({ message: "Failed to dispatch notification" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SendOutlined className="text-indigo-600" />
          <span>Dispatch Notification Campaign {isAllowed ? "" : "(View Only)"}</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      wrapClassName="dark-modal"
      footer={[
        <Button key="cancel" onClick={onCancel} className="rounded-xl border-none text-slate-400 font-bold hover:text-slate-600 dark:hover:text-slate-200 h-12 px-6">
          {isAllowed ? "Cancel" : "Close"}
        </Button>,
        isAllowed && (
          <Button
            key="send"
            type="primary"
            icon={<SendOutlined />}
            loading={loading}
            onClick={handleSend}
            className="!bg-gradient-to-r !from-indigo-600 !to-blue-500 border-none rounded-xl font-bold h-12 px-10 shadow-lg shadow-indigo-100 hover:scale-[1.02] transition-transform"
          >
            Dispatch Now
          </Button>
        ),
      ].filter(Boolean)}
      width={600}
      className="premium-modal"
    >
      <div className="py-2">
        {!isAllowed && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-[1.5rem] text-xs flex items-start gap-3 shadow-sm">
            <InfoCircleOutlined className="text-amber-500 text-base mt-0.5 shrink-0" />
            <div>
              <span className="font-bold block mb-0.5">View-Only Access</span>
              <span>You do not have permission to dispatch notification campaigns. Selection options have been locked.</span>
            </div>
          </div>
        )}
        <div className="bg-indigo-50 dark:bg-indigo-500/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/30 mb-6 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/20 rounded-full translate-x-10 -translate-y-10" />

          <Text className="text-indigo-400 dark:text-indigo-300 text-[10px] uppercase tracking-tight font-black mb-2 block">
            Notification Preview
          </Text>
          <Title level={4} className="!m-0 !text-indigo-900 dark:!text-indigo-100 font-bold">
            {notificationData?.title}
          </Title>
          <Text className="text-[12px] text-indigo-500/70 dark:text-indigo-300/70 line-clamp-1 mt-1 block">
            {notificationData?.body}
          </Text>
        </div>

        <div className="mb-6">
          <Text className="text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest mb-3 block px-1">Target Audience</Text>
          <Select
            className="w-full premium-select-large h-14"
            value={target}
            onChange={(val) => setTarget(val)}
            disabled={!isAllowed}
            dropdownClassName="rounded-2xl overflow-hidden shadow-2xl border-slate-100"
          >
            <Option value="ALL">
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400">
                  <TeamOutlined />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">All {targetType === 'CUSTOMER' ? 'Customers' : 'Drivers'}</div>
                  <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-tight">Broadcast to entire user base</div>
                </div>
              </div>
            </Option>
            <Option value="TOP_RIDE">
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                  <RiseOutlined />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Top Performers</div>
                  <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-tight">Users with highest ride counts</div>
                </div>
              </div>
            </Option>
            <Option value="LOW_RIDE">
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400">
                  <FallOutlined />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Low Activity Users</div>
                  <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-tight">Users with minimal rides</div>
                </div>
              </div>
            </Option>
            <Option value="SPECIFIC">
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                  <UserOutlined />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">Specific {targetType === 'CUSTOMER' ? 'Customer' : 'Driver'}</div>
                  <div className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-tight">Direct individual targeting</div>
                </div>
              </div>
            </Option>
          </Select>
        </div>

        {target === "SPECIFIC" && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
            <Text className="text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-widest mb-3 block px-1">Select Identity</Text>
            <Select
              mode="multiple"
              showSearch
              placeholder={`Search ${targetType === 'CUSTOMER' ? 'Customer' : 'Driver'} name or phone...`}
              className="w-full premium-select-large h-auto min-h-[56px]"
              disabled={!isAllowed}
              loading={currentLoading}
              value={selectedUserIds}
              onChange={(val) => setSelectedUserIds(val)}
              filterOption={(input, option) => {
                const user = (currentAudience as any[]).find(u => u.id === option?.key);
                if (!user) return false;
                const userName = user.full_name || user.name || "";
                const userPhone = user.phone_number || "";
                return (
                  userName.toLowerCase().includes(input.toLowerCase()) ||
                  userPhone.includes(input)
                );
              }}
            >
              {currentAudience.map((user: any) => (
                <Option key={user.id} value={user.id}>
                  <div className="flex items-center gap-3 py-1">
                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700">
                      <UserOutlined />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{user.full_name || user.name}</div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">{user.phone_number}</div>
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </div>
        )}

        <Divider className="my-6" />

        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
          <Text className="text-[11px] text-slate-500 dark:text-slate-400 italic block">
            <span className="font-bold text-slate-700 dark:text-slate-300">Pro-tip for achieving this:</span> The backend utilizes a scheduled cron job (running every 5 minutes) to process these requests. It queries the database based on your selected segments (e.g., <Text code className="dark:bg-slate-800 dark:text-slate-300">total_rides &gt; 50</Text> for Top Riders) and dispatches notifications in batches to ensure maximum deliverability without overloading the system.
          </Text>
        </div>
      </div>
    </Modal>
  );
};

export default NotificationNotifyModal;
