import React, { useEffect } from "react";
import {
  Drawer,
  Form,
  InputNumber,
  Select,
  Switch,
  Button,
  Typography,
} from "antd";
import {
  GiftOutlined,
  CloseOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { type ReferralConfig, type ReferralConfigPayload } from "../../store/slices/referralSlice";
import { useHasPermission } from "../../hooks/usePermission";
import { useAppSelector } from "../../store/hooks";

const { Title, Text } = Typography;

interface ReferralFormDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: ReferralConfigPayload) => void;
  initialValues?: ReferralConfig | null;
  defaultTarget?: "CUSTOMER" | "DRIVER";
  loading?: boolean;
}

const ReferralFormDrawer: React.FC<ReferralFormDrawerProps> = ({
  visible,
  onClose,
  onSubmit,
  initialValues,
  defaultTarget = "CUSTOMER",
  loading,
}) => {
  const [form] = Form.useForm();
  const moduleName = defaultTarget === "CUSTOMER" ? "user_referrals" : "driver_referrals";
  const canCreate = useHasPermission(moduleName, "create");
  const canUpdate = useHasPermission(moduleName, "update");
  const { role } = useAppSelector((state) => state.auth);
  const isSuperAdmin = role === 'super_admin';
  const isAllowed = isSuperAdmin || (initialValues ? canUpdate : canCreate);

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
        form.setFieldsValue({
          is_active: true,
          referrer_reward_type: "FIXED",
          referee_reward_type: "FIXED",
          user_type: defaultTarget,
        });
      }
    }
  }, [visible, initialValues, form, defaultTarget]);

  const handleFinish = (values: ReferralConfigPayload) => {
    onSubmit(values);
  };

  return (
    <Drawer
      placement="right"
      width={720}
      onClose={onClose}
      open={visible}
      closable={false}
      rootClassName="dark-drawer"
      styles={{
        header: { display: 'none' },
        body: { padding: 0 },
        footer: { padding: "16px 24px" },
      }}
      footer={
        <div className="flex justify-end gap-3 px-2">
          <Button
            onClick={onClose}
            className="rounded-full h-11 px-8 font-bold text-gray-400 hover:text-gray-600 border-gray-200 transition-all"
          >
            {isAllowed ? "Cancel" : "Close"}
          </Button>
          {isAllowed && (
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={loading}
              className="rounded-full h-11 px-10 font-bold !bg-gradient-to-r !from-amber-500 !to-orange-500 border-none flex items-center gap-2"
            >
              {initialValues ? "Update Rule" : "Create Rule"}
            </Button>
          )}
        </div>
      }
    >
      {/* ─── Immersive Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden pt-12 pb-8 px-8 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full -translate-y-16 translate-x-16" />

        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="relative w-16 h-16 bg-amber-50 dark:bg-amber-500/10 border-2 border-white dark:border-slate-800 flex items-center justify-center rounded-3xl text-amber-500 dark:text-amber-400 text-2xl">
                <GiftOutlined />
              </div>
            </div>
            <div>
              <Title level={3} className="!m-0 !mb-1 font-extrabold text-gray-800 dark:text-slate-100 tracking-tight">
                {initialValues ? (isAllowed ? "Edit Referral Rule" : "View Referral Rule") : "Create Referral Rule"}
              </Title>
              <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                Network Growth & Referral Rewards
              </Text>
            </div>
          </div>
          <Button
            type="text"
            icon={<CloseOutlined className="text-gray-400" />}
            onClick={onClose}
            className="hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full h-10 w-10 flex items-center justify-center"
          />
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="pt-6 pb-12 space-y-4"
        requiredMark={false}
        disabled={!isAllowed}
      >
        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm space-y-4 mx-4 mt-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 dark:text-orange-400">
              <UserOutlined className="text-sm" />
            </div>
            <span className="text-xs font-extrabold text-gray-800 dark:text-slate-200 uppercase tracking-tight">Configuration</span>
          </div>

          <Form.Item
            name="user_type"
            label={<span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Target Audience</span>}
            rules={[{ required: true, message: "Required" }]}
          >
            <Select size="large" className="rounded-2xl w-full">
              <Select.Option value="CUSTOMER">Customers Only</Select.Option>
              <Select.Option value="DRIVER">Drivers Only</Select.Option>
            </Select>
          </Form.Item>
        </div>

        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm space-y-4 mx-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <GiftOutlined className="text-sm" />
            </div>
            <span className="text-xs font-extrabold text-gray-800 dark:text-slate-200 uppercase tracking-tight">Referrer Incentives</span>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-[1.5rem] border border-gray-100 dark:border-slate-700">
            <Form.Item
              name="referrer_reward_type"
              label={<span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Type</span>}
              rules={[{ required: true }]}
              className="m-0"
            >
              <Select size="large" className="rounded-xl w-full">
                <Select.Option value="FIXED">Flat (₹)</Select.Option>
                <Select.Option value="PERCENTAGE">Share (%)</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="referrer_reward"
              label={<span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Amount/Value</span>}
              rules={[{ required: true, message: "Required" }]}
              className="m-0"
            >
              <InputNumber size="large" min={0} className="!w-full rounded-xl  border-gray-200 flex items-center px-4" placeholder="e.g. 100" />
            </Form.Item>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm space-y-4 mx-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400">
              <GiftOutlined className="text-sm" />
            </div>
            <span className="text-xs font-extrabold text-gray-800 dark:text-slate-200 uppercase tracking-tight">Referee Benefits</span>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-[1.5rem] border border-gray-100 dark:border-slate-700">
            <Form.Item
              name="referee_reward_type"
              label={<span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Type</span>}
              rules={[{ required: true }]}
              className="m-0"
            >
              <Select size="large" className="rounded-xl w-full">
                <Select.Option value="FIXED">Flat (₹)</Select.Option>
                <Select.Option value="PERCENTAGE">Share (%)</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="referee_reward"
              label={<span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Amount/Value</span>}
              rules={[{ required: true, message: "Required" }]}
              className="m-0"
            >
              <InputNumber size="large" min={0} className="!w-full rounded-xl  border-gray-200 flex items-center px-4" placeholder="e.g. 50" />
            </Form.Item>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/50 p-4 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm mx-4 mb-8">
          <div className="flex items-center justify-between p-1 px-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-700 dark:text-slate-200">Status</span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">Enable or disable this rule</span>
            </div>
            <Form.Item name="is_active" valuePropName="checked" className="m-0">
              <Switch
                className="premium-switch-amber"
                checkedChildren={<span className="text-[9px] font-bold uppercase tracking-tight">Active</span>}
                unCheckedChildren={<span className="text-[9px] font-bold uppercase tracking-tight">Off</span>}
              />
            </Form.Item>
          </div>
        </div>
      </Form>
    </Drawer>
  );
};

export default ReferralFormDrawer;
