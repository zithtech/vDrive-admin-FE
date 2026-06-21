import React, { useEffect } from "react";
import dayjs from "dayjs";
import { Drawer, Form, Input, Select, Button, Typography } from "antd";
import {
  BellOutlined,
  UserOutlined,
  TagOutlined,
  CloseOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useAppSelector } from "../../store/hooks";
import { useHasPermission } from "../../hooks/usePermission";

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

  const canCreate = useHasPermission("notifications", "create");
  const canUpdate = useHasPermission("notifications", "update");
  const { role } = useAppSelector((state) => state.auth);
  const isSuperAdmin = role === "super_admin";
  const isAllowed = isSuperAdmin || (initialValues ? canUpdate : canCreate);

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        // Find ID if only code is present
        let attachedOfferId =
          initialValues.attached_offer || initialValues.coupon_id || initialValues.promo_id;

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
          specific_user_id: initialValues.specific_user_id || null,
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
      width={500}
      onClose={onClose}
      open={visible}
      closable={false}
      rootClassName="dark-drawer compact-notification-drawer"
      styles={{
        header: { display: "none" },
        body: { padding: 0 },
        footer: { padding: "8px 16px" },
      }}
      footer={
        <div className="flex justify-end gap-2 px-1">
          <Button
            onClick={onClose}
            className="rounded-none h-8 px-4 font-bold text-gray-400 hover:text-gray-600 border-gray-200 transition-all text-xs"
          >
            {isAllowed ? "Cancel" : "Close"}
          </Button>
          {isAllowed && (
            <Button
              type="primary"
              onClick={() => form.submit()}
              loading={loading}
              icon={<CheckCircleOutlined />}
              className="rounded-none h-8 px-6 font-bold !bg-blue-600 hover:!bg-blue-700 border-none flex items-center gap-1.5 text-xs"
            >
              {initialValues ? "Update Notification" : "Create Notification"}
            </Button>
          )}
        </div>
      }
    >
      {/* ─── Immersive Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden pt-4 pb-2 px-4 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -translate-y-12 translate-x-12" />

        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="relative w-9 h-9 bg-blue-50 dark:bg-blue-500/10 border border-white dark:border-slate-800 flex items-center justify-center rounded-none text-blue-600 dark:text-blue-400 text-base shadow-sm">
                <BellOutlined />
              </div>
            </div>
            <div>
              <Title
                level={4}
                className="!m-0 !mb-0.5 font-extrabold text-gray-800 dark:text-slate-100 tracking-tight"
              >
                {initialValues
                  ? isAllowed
                    ? "Edit Notification"
                    : "View Notification"
                  : "Compose Notification"}
              </Title>
              <Text className="text-gray-450 dark:text-slate-500 font-bold text-[9px] uppercase tracking-widest">
                Push Campaigns & Outreach
              </Text>
            </div>
          </div>
          <Button
            type="text"
            icon={<CloseOutlined className="text-gray-400" />}
            onClick={onClose}
            className="hover:bg-gray-100 dark:hover:bg-slate-700 rounded-none h-7 w-7 flex items-center justify-center"
          />
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="pt-2 pb-4 space-y-2"
        requiredMark={false}
        disabled={!isAllowed}
      >
        {/* Hidden Fields for codes */}
        <Form.Item name="coupon_code" noStyle>
          <input type="hidden" />
        </Form.Item>
        <Form.Item name="promo_code" noStyle>
          <input type="hidden" />
        </Form.Item>

        {/* Content Section */}
        <div className="bg-white dark:bg-slate-800/50 p-3 border border-gray-100 dark:border-slate-700 shadow-sm space-y-1 mx-3.5 mt-2.5 rounded-none">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-none bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400">
              <BellOutlined className="text-[10px]" />
            </div>
            <span className="text-[10px] font-extrabold text-gray-800 dark:text-slate-200 uppercase tracking-tight">
              Message Content
            </span>
          </div>

          <Form.Item
            name="title"
            label={
              <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                Notification Title
              </span>
            }
            rules={[{ required: true, message: "Title is required" }]}
            className="!mb-1.5"
          >
            <Input
              placeholder="e.g. Special Weekend Offer!"
              className="rounded-none font-bold border-gray-200 focus:border-blue-500 transition-all text-xs h-8"
            />
          </Form.Item>

          <Form.Item
            name="body"
            label={
              <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                Message Body
              </span>
            }
            rules={[{ required: true, message: "Message body is required" }]}
            className="!mb-1.5"
          >
            <Input.TextArea
              rows={2}
              placeholder="Type your message here..."
              className="rounded-none border-gray-200 focus:border-blue-500 transition-all font-medium text-xs"
            />
          </Form.Item>
        </div>

        {/* Audience Section */}
        <div className="bg-white dark:bg-slate-800/50 p-3 border border-gray-100 dark:border-slate-700 shadow-sm space-y-1 mx-3.5 rounded-none">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-none bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <UserOutlined className="text-[10px]" />
            </div>
            <span className="text-[10px] font-extrabold text-gray-800 dark:text-slate-200 uppercase tracking-tight">
              Target Audience
            </span>
          </div>

          <Form.Item
            name="target_audience"
            label={
              <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                Who should receive this?
              </span>
            }
            rules={[{ required: true }]}
            className="!mb-1.5"
          >
            <Select className="premium-select rounded-none w-full text-xs h-8">
              <Select.Option value="ALL">
                For All {defaultTarget === "CUSTOMER" ? "Customers" : "Drivers"}
              </Select.Option>
              <Select.Option value="TOP_RIDE">
                For Top {defaultTarget === "CUSTOMER" ? "Riders" : "Drivers"}
              </Select.Option>
              <Select.Option value="LOW_RIDE">
                For Low {defaultTarget === "CUSTOMER" ? "Riders" : "Drivers"}
              </Select.Option>
              <Select.Option value="SPECIFIC">For Specific Users</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.target_audience !== currentValues.target_audience
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("target_audience") === "SPECIFIC" && (
                <Form.Item
                  name="specific_user_id"
                  label={
                    <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                      Select Users
                    </span>
                  }
                  rules={[{ required: true, message: "Please select at least one user" }]}
                  className="!mb-1.5"
                >
                  <Select
                    mode="multiple"
                    placeholder="Search and select users"
                    className="premium-select rounded-none w-full text-xs"
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
        <div className="bg-white dark:bg-slate-800/50 p-3 border border-gray-100 dark:border-slate-700 shadow-sm space-y-1 mx-3.5 mb-3 rounded-none">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-none bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <TagOutlined className="text-[10px]" />
            </div>
            <span className="text-[10px] font-extrabold text-gray-800 dark:text-slate-200 uppercase tracking-tight">
              Optional Attachments
            </span>
          </div>

          <Form.Item
            name="attached_offer"
            label={
              <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                Attach {defaultTarget === "CUSTOMER" ? "Coupon" : "Promo"}
              </span>
            }
            className="!mb-1.5"
          >
            <Select
              className="premium-select rounded-none w-full text-xs h-8"
              placeholder={`Select a ${defaultTarget === "CUSTOMER" ? "Coupon" : "Promo"} to attach`}
              allowClear
              onChange={handleOfferChange}
              showSearch
              optionFilterProp="children"
            >
              {defaultTarget === "CUSTOMER"
                ? coupons.map((c: any) => {
                    const isExpired =
                      !c.is_active || (c.valid_until && dayjs(c.valid_until).isBefore(dayjs()));
                    const statusText = !c.is_active ? "Disabled" : "Expired";
                    return (
                      <Select.Option key={c.id} value={c.id} disabled={isExpired}>
                        <div className="flex justify-between items-center text-xs">
                          <span>{c.code}</span>
                          {isExpired && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 font-bold uppercase">
                              {statusText}
                            </span>
                          )}
                        </div>
                      </Select.Option>
                    );
                  })
                : promos.map((p: any) => {
                    const isExpired =
                      !p.is_active || (p.expiry_date && dayjs(p.expiry_date).isBefore(dayjs()));
                    const statusText = !p.is_active ? "Disabled" : "Expired";
                    return (
                      <Select.Option key={p.id} value={p.id} disabled={isExpired}>
                        <div className="flex justify-between items-center text-xs">
                          <span>{p.code}</span>
                          {isExpired && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 font-bold uppercase">
                              {statusText}
                            </span>
                          )}
                        </div>
                      </Select.Option>
                    );
                  })}
            </Select>
          </Form.Item>
          <Text className="text-[9px] text-gray-400 dark:text-slate-500 italic block mt-0.5">
            * Users will be redirected to this offer when they click the notification.
          </Text>
        </div>
      </Form>

      <style>{`
        .compact-notification-drawer .ant-drawer-content-wrapper,
        .compact-notification-drawer .ant-drawer-content {
          border-radius: 0px !important;
        }
        .compact-notification-drawer .ant-input,
        .compact-notification-drawer .ant-input-affix-wrapper,
        .compact-notification-drawer .ant-select-selector,
        .compact-notification-drawer .ant-btn {
          border-radius: 0px !important;
        }
      `}</style>
    </Drawer>
  );
};

export default NotificationDrawer;
