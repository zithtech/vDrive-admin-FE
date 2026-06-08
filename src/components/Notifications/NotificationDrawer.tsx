import React, { useEffect } from "react";
import dayjs from "dayjs";
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Typography,
} from "antd";
import {
  BellOutlined,
  UserOutlined,
  TagOutlined,
  CloseOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useAppSelector } from "../../store/hooks";

const { Title, Text } = Typography;

interface NotificationDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  initialValues?: any | null;
  defaultTarget?: "CUSTOMER" | "DRIVER";
  loading?: boolean;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  visible,
  onClose,
  onSubmit,
  initialValues,
  defaultTarget = "CUSTOMER",
  loading,
}) => {
  const [form] = Form.useForm();
  const { coupons } = useAppSelector((state) => state.coupon);
  const { promos } = useAppSelector((state) => state.promo);
  const { customers } = useAppSelector((state) => state.customers);
  const { drivers } = useAppSelector((state) => state.drivers);

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        // Find ID if only code is present
        let attachedOfferId = initialValues.attached_offer || initialValues.coupon_id || initialValues.promo_id;

        if (!attachedOfferId) {
          if (initialValues.coupon_code) {
            attachedOfferId = coupons.find((c: any) => c.code === initialValues.coupon_code)?.id;
          } else if (initialValues.promo_code) {
            attachedOfferId = promos.find((p: any) => p.code === initialValues.promo_code)?.id;
          }
        }

        form.setFieldsValue({
          ...initialValues,
          attached_offer: attachedOfferId,
          specific_user_id: initialValues.specific_user_id || null
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          target_audience: "ALL",
        });
      }
    }
  }, [visible, initialValues, form, coupons, promos]);

  const handleFinish = (values: any) => {
    onSubmit(values);
  };

  const handleOfferChange = (id: string | null) => {
    if (!id) {
      form.setFieldsValue({ coupon_code: null, promo_code: null });
      return;
    }
    form.setFieldsValue({ attached_offer: id });

    if (defaultTarget === "CUSTOMER") {
      const selected = coupons.find((c: any) => c.id === id);
      form.setFieldsValue({ coupon_code: selected?.code || null, promo_code: null });
    } else {
      const selected = promos.find((p: any) => p.id === id);
      form.setFieldsValue({ promo_code: selected?.code || null, coupon_code: null });
    }
  };

  const usersList = defaultTarget === "CUSTOMER" ? customers : drivers;

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
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={loading}
            icon={<CheckCircleOutlined />}
            className="rounded-full h-11 px-10 font-bold !bg-gradient-to-r !from-indigo-600 !to-blue-600 border-none flex items-center gap-2"
          >
            {initialValues ? "Update Notification" : "Create Notification"}
          </Button>
        </div>
      }
    >
      {/* ─── Immersive Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden pt-7 pb-4 px-8 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/5 rounded-full -translate-y-16 translate-x-16" />

        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="relative w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 border-2 border-white dark:border-slate-800 flex items-center justify-center rounded-3xl text-indigo-600 dark:text-indigo-400 text-2xl shadow-sm">
                <BellOutlined />
              </div>
            </div>
            <div>
              <Title level={3} className="!m-0 !mb-1 font-extrabold text-gray-800 dark:text-slate-100 tracking-tight">
                {initialValues ? "Edit Notification" : "Compose Notification"}
              </Title>
              <Text className="text-gray-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                Push Campaigns & Outreach
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
        className="pt-4 pb-12 space-y-4"
        requiredMark={false}
      >
        {/* Hidden Fields for codes */}
        <Form.Item name="coupon_code" noStyle><input type="hidden" /></Form.Item>
        <Form.Item name="promo_code" noStyle><input type="hidden" /></Form.Item>

        {/* Content Section */}
        <div className="bg-white dark:bg-slate-800/50 p-5 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm space-y-2 mx-4 mt-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
              <BellOutlined className="text-sm" />
            </div>
            <span className="text-xs font-extrabold text-gray-800 dark:text-slate-200 uppercase tracking-tight">Message Content</span>
          </div>

          <Form.Item
            name="title"
            label={<span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Notification Title</span>}
            rules={[{ required: true, message: "Title is required" }]}
            className="!mb-3"
          >
            <Input
              size="large"
              placeholder="e.g. Special Weekend Offer!"
              className="rounded-2xl font-bold border-gray-200 focus:border-indigo-500 transition-all"
            />
          </Form.Item>

          <Form.Item
            name="body"
            label={<span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Message Body</span>}
            rules={[{ required: true, message: "Message body is required" }]}
            className="!mb-3"
          >
            <Input.TextArea
              rows={4}
              placeholder="Type your message here..."
              className="rounded-2xl border-gray-200 focus:border-indigo-500 transition-all font-medium"
            />
          </Form.Item>
        </div>

        {/* Audience Section */}
        <div className="bg-white dark:bg-slate-800/50 p-5 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm space-y-2 mx-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <UserOutlined className="text-sm" />
            </div>
            <span className="text-xs font-extrabold text-gray-800 dark:text-slate-200 uppercase tracking-tight">Target Audience</span>
          </div>

          <Form.Item
            name="target_audience"
            label={<span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Who should receive this?</span>}
            rules={[{ required: true }]}
            className="!mb-3"
          >
            <Select size="large" className="premium-select rounded-2xl w-full">
              <Select.Option value="ALL">For All {defaultTarget === 'CUSTOMER' ? 'Customers' : 'Drivers'}</Select.Option>
              <Select.Option value="TOP_RIDE">For Top {defaultTarget === 'CUSTOMER' ? 'Riders' : 'Drivers'}</Select.Option>
              <Select.Option value="LOW_RIDE">For Low {defaultTarget === 'CUSTOMER' ? 'Riders' : 'Drivers'}</Select.Option>
              <Select.Option value="SPECIFIC">For Specific Users</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.target_audience !== currentValues.target_audience}
          >
            {({ getFieldValue }) =>
              getFieldValue("target_audience") === "SPECIFIC" && (
                <Form.Item
                  name="specific_user_id"
                  label={<span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Select Users</span>}
                  rules={[{ required: true, message: "Please select at least one user" }]}
                  className="!mb-3"
                >
                  <Select
                    mode="multiple"
                    size="large"
                    placeholder="Search and select users"
                    className="premium-select rounded-2xl w-full"
                    optionFilterProp="children"
                  >
                    {usersList.map((user: any) => (
                      <Select.Option key={user.id} value={user.id}>
                        {user.full_name || user.name} ({user.phone_number})
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              )
            }
          </Form.Item>
        </div>

        {/* Optional Attachments */}
        <div className="bg-white dark:bg-slate-800/50 p-5 rounded-[2rem] border border-gray-100 dark:border-slate-700 shadow-sm space-y-2 mx-4 mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-500 dark:text-green-400">
              <TagOutlined className="text-sm" />
            </div>
            <span className="text-xs font-extrabold text-gray-800 dark:text-slate-200 uppercase tracking-tight">Optional Attachments</span>
          </div>

          <Form.Item
            name="attached_offer"
            label={<span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Attach {defaultTarget === 'CUSTOMER' ? 'Coupon' : 'Promo'}</span>}
            className="!mb-3"
          >
            <Select
              size="large"
              className="premium-select rounded-2xl w-full"
              placeholder={`Select a ${defaultTarget === 'CUSTOMER' ? 'Coupon' : 'Promo'} to attach`}
              allowClear
              onChange={handleOfferChange}
              showSearch
              optionFilterProp="children"
            >
              {defaultTarget === "CUSTOMER"
                ? coupons.map((c: any) => {
                  const isExpired = !c.is_active || (c.valid_until && dayjs(c.valid_until).isBefore(dayjs()));
                  const statusText = !c.is_active ? "Disabled" : "Expired";
                  return (
                    <Select.Option key={c.id} value={c.id} disabled={isExpired}>
                      <div className="flex justify-between items-center">
                        <span>{c.code}</span>
                        {isExpired && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 font-bold uppercase">
                            {statusText}
                          </span>
                        )}
                      </div>
                    </Select.Option>
                  );
                })
                : promos.map((p: any) => {
                  const isExpired = !p.is_active || (p.expiry_date && dayjs(p.expiry_date).isBefore(dayjs()));
                  const statusText = !p.is_active ? "Disabled" : "Expired";
                  return (
                    <Select.Option key={p.id} value={p.id} disabled={isExpired}>
                      <div className="flex justify-between items-center">
                        <span>{p.code}</span>
                        {isExpired && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 font-bold uppercase">
                            {statusText}
                          </span>
                        )}
                      </div>
                    </Select.Option>
                  );
                })
              }
            </Select>
          </Form.Item>
          <Text className="text-[10px] text-gray-400 dark:text-slate-500 italic">
            * Users will be redirected to this offer when they click the notification.
          </Text>
        </div>
      </Form>
    </Drawer>
  );
};

export default NotificationDrawer;
