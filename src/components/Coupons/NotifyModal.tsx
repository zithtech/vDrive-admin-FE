import React, { useState, useEffect } from "react";
import { Modal, Select, Button, Space, Typography, message, Divider } from "antd";
import { SendOutlined, UserOutlined, TeamOutlined, RiseOutlined, FallOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { useHasPermission } from "../../hooks/usePermission";
import { fetchCustomers } from "../../store/slices/customerSlice";
import { fetchDrivers } from "../../store/slices/driverSlice";
import type { RootState, AppDispatch } from "../../store";
import axiosIns from "../../api/axios";

const { Text, Title } = Typography;
const { Option } = Select;

interface NotifyModalProps {
  visible: boolean;
  onCancel: () => void;
  coupon: any;
  onSuccess: () => void;
}

const NotifyModal: React.FC<NotifyModalProps> = ({ visible, onCancel, coupon, onSuccess }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { customers, loading: customersLoading } = useSelector((state: RootState) => state.customers);
  const { drivers, loading: driversLoading } = useSelector((state: RootState) => state.drivers);
  const [target, setTarget] = useState<string>("ALL");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const isDriverPromotion = coupon.applicable_to === 'DRIVER' || typeof coupon.id === 'number';
  const currentAudience = isDriverPromotion ? drivers : customers;
  const currentLoading = isDriverPromotion ? driversLoading : customersLoading;

  const canUpdate = useHasPermission(isDriverPromotion ? "promos" : "coupons", "update");
  const hasDriversRead = useHasPermission("drivers", "read");
  const hasCustomersRead = useHasPermission("customers", "read");
  const { role } = useSelector((state: RootState) => state.auth);
  const isSuperAdmin = role === 'super_admin';
  const isAllowed = isSuperAdmin || canUpdate;

  useEffect(() => {
    if (visible && target === "SPECIFIC") {
      if (isDriverPromotion && drivers.length === 0 && (isSuperAdmin || hasDriversRead)) {
        dispatch(fetchDrivers());
      } else if (!isDriverPromotion && customers.length === 0 && (isSuperAdmin || hasCustomersRead)) {
        dispatch(fetchCustomers());
      }
    }
  }, [visible, target, customers.length, drivers.length, dispatch, isDriverPromotion, isSuperAdmin, hasDriversRead, hasCustomersRead]);

  const handleSend = async () => {
    if (target === "SPECIFIC" && selectedUserIds.length === 0) {
      message.warning("Please select at least one specific user");
      return;
    }

    setLoading(true);
    try {
      const endpoint = isDriverPromotion
        ? `/api/promos/notify/${coupon.id}`
        : `/api/coupons/notify/${coupon.id}`;

      await axiosIns.post(endpoint, {
        target,
        [isDriverPromotion ? 'driverIds' : 'userIds']: selectedUserIds,
      });
      message.success("Notification campaign queued successfully!");
      onSuccess();
      onCancel();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Failed to trigger notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SendOutlined className="text-blue-500" />
          <span>Email Notification Campaign {isAllowed ? "" : "(View Only)"}</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} className="rounded-xl border-none text-slate-400 font-bold hover:text-slate-600 h-12 px-6">
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
            Dispatch Notification
          </Button>
        ),
      ].filter(Boolean)}
      width={650}
      className="premium-modal"
    >
      <div className="py-4">
        {!isAllowed && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-[1.5rem] text-xs flex items-start gap-3 shadow-sm">
            <InfoCircleOutlined className="text-amber-500 text-base mt-0.5 shrink-0" />
            <div>
              <span className="font-bold block mb-0.5">View-Only Access</span>
              <span>You do not have permission to trigger notification campaigns for this asset. Selection options have been locked.</span>
            </div>
          </div>
        )}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-[2rem] border border-blue-100 mb-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full translate-x-10 -translate-y-10" />

          <Text className="text-indigo-400 text-[10px] uppercase tracking-tight font-black mb-3 block">
            Campaign Promotion
          </Text>
          <div className="flex justify-between items-end relative z-10">
            <div>
              <Title level={2} className="!m-0 !text-indigo-900 font-mono tracking-wider !leading-none">
                {coupon?.code}
              </Title>
              <Text className="text-[11px] text-indigo-400 font-bold uppercase tracking-tight mt-1 block">
                Active Ledger Asset
              </Text>
            </div>
            <div className={`px-4 py-2 rounded-2xl font-black text-xs shadow-lg shadow-indigo-100 ${coupon?.discount_type === "PERCENTAGE"
              ? "bg-indigo-600 text-white"
              : "bg-emerald-500 text-white"
              }`}>
              {coupon?.discount_type === "PERCENTAGE"
                ? `${coupon.discount_value}% OFF`
                : `₹${coupon.discount_value} OFF`}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-3 block px-1">Select Audience</Text>
          <Select
            className="w-full premium-select-large"
            value={target}
            onChange={(val) => setTarget(val)}
            disabled={!isAllowed}
            dropdownClassName="rounded-2xl overflow-hidden shadow-2xl border-slate-100"
          >
            <Option value="ALL">
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                  <TeamOutlined />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700">All Active Users</div>
                  <div className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">All Active Platform {isDriverPromotion ? 'Drivers' : 'Users'}</div>
                </div>
              </div>
            </Option>
            <Option value="TOP_RIDE">
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <RiseOutlined />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700">Top Ride Users (High Loyalty)</div>
                  <div className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">High volume performers</div>
                </div>
              </div>
            </Option>
            <Option value="LOW_RIDE">
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                  <FallOutlined />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700">Low Ride Users (Win-back)</div>
                  <div className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">Low activity segments</div>
                </div>
              </div>
            </Option>
            <Option value="SPECIFIC">
              <div className="flex items-center gap-3 py-1">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <UserOutlined />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-700">Specific User</div>
                  <div className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">Individual targeting</div>
                </div>
              </div>
            </Option>
          </Select>
        </div>

        {target === "SPECIFIC" && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
            <Text className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-3 block px-1">Identity Selection</Text>
            <Select
              mode="multiple"
              showSearch
              placeholder={`Search ${isDriverPromotion ? 'Driver' : 'User'} identity...`}
              className="w-full premium-select-large"
              disabled={!isAllowed}
              loading={currentLoading}
              onChange={(val) => setSelectedUserIds(val)}
              filterOption={(input, option) => {
                const user = (currentAudience as any[]).find(u => (u.id || u.driver_id) === option?.key);
                if (!user) return false;
                const userName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`;
                return (
                  userName.toLowerCase().includes(input.toLowerCase()) ||
                  user.email.toLowerCase().includes(input.toLowerCase())
                );
              }}
            >
              {currentAudience.map((user: any) => {
                const userId = user.id || user.driver_id;
                const userName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`;
                return (
                  <Option key={userId} value={userId}>
                    <div className="flex items-center gap-3 py-1">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <UserOutlined />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-700">{userName}</div>
                        <div className="text-[9px] text-slate-400 font-bold">{user.email}</div>
                      </div>
                    </div>
                  </Option>
                );
              })}
            </Select>
          </div>
        )}

        <Divider className="my-6" />

        <div className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
          <p className="m-0">
            Note: Emails will be processed in batches by the background cron job every 5 minutes to ensure delivery reliability.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default NotifyModal;
