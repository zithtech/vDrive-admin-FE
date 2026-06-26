import React, { useEffect, useState } from "react";
import {
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  DatePicker,
  Typography,
} from "antd";
import {
  PercentageOutlined,
  DollarOutlined,
  GiftOutlined,
  TagOutlined,
  CalendarOutlined,
  CloseOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { CouponPayload } from "../../store/slices/couponSlice";
import type { PromoPayload } from "../../store/slices/promoSlice";
import dayjs from "dayjs";
import { useHasPermission } from "../../hooks/usePermission";

const { Title, Text } = Typography;

interface CouponFormDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  initialValues?: any | null;
  defaultTarget?: "CUSTOMER" | "DRIVER";
  loading?: boolean;
}

const CouponFormDrawer: React.FC<CouponFormDrawerProps> = ({
  visible,
  onClose,
  onSubmit,
  initialValues,
  defaultTarget = "CUSTOMER",
  loading,
}) => {
  const [form] = Form.useForm();
  const [discountType, setDiscountType] = useState<string>("PERCENTAGE");

  const module = defaultTarget === "DRIVER" ? "promos" : "coupons";
  const action = initialValues ? "update" : "create";
  const isAllowed = useHasPermission(module, action);

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        setDiscountType(initialValues.discount_type?.toUpperCase() || "PERCENTAGE");
        const fromDate = initialValues.valid_from || initialValues.start_date;
        const untilDate = initialValues.valid_until || initialValues.expiry_date;
        form.setFieldsValue({
          ...initialValues,
          discount_type: initialValues.discount_type?.toUpperCase() || "PERCENTAGE",
          dateRange: fromDate && untilDate ? [dayjs(fromDate), dayjs(untilDate)] : [],
          applicable_to:
            initialValues.applicable_to || (defaultTarget === "DRIVER" ? "DRIVER" : "CUSTOMER"),
        });
      } else {
        setDiscountType("PERCENTAGE");
        form.resetFields();
        form.setFieldsValue({
          is_active: true,
          user_eligibility: "ALL",
          discount_type: "PERCENTAGE",
          applicable_to: defaultTarget,
        });
      }
    }
  }, [visible, initialValues, form, defaultTarget]);

  const handleValuesChange = (changedValues: any) => {
    if (changedValues.discount_type) {
      setDiscountType(changedValues.discount_type);
    }
  };

  const handleFinish = (values: any) => {
    const { dateRange, ...rest } = values;
    if (defaultTarget === "CUSTOMER") {
      const payload: CouponPayload = {
        ...rest,
        valid_from: dateRange[0].toISOString(),
        valid_until: dateRange[1].toISOString(),
      };
      onSubmit(payload);
    } else {
      const payload: PromoPayload = {
        ...rest,
        discount_type: rest.discount_type.toLowerCase(),
        start_date: dateRange[0].toISOString(),
        expiry_date: dateRange[1].toISOString(),
        target_type: rest.user_eligibility === "ALL" ? "global" : "specific_driver",
      };
      onSubmit(payload);
    }
  };

  const getDiscountIcon = () => {
    switch (discountType) {
      case "PERCENTAGE":
        return <PercentageOutlined style={{ color: "#3b82f6" }} />;
      case "FIXED":
        return <DollarOutlined style={{ color: "#10b981" }} />;
      case "FREE_RIDE":
        return <GiftOutlined style={{ color: "#8b5cf6" }} />;
      default:
        return <TagOutlined />;
    }
  };

  return (
    <Drawer
      placement="right"
      width={720}
      onClose={onClose}
      open={visible}
      closable={false}
      styles={{
        header: { display: "none" },
        body: { padding: 0, background: "#f8fafc" },
        footer: { borderTop: "1px solid #f1f5f9", padding: "16px 24px", background: "#fff" },
      }}
      footer={
        <div className="flex justify-end gap-2 px-2">
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
              className="rounded-full h-11 px-10 font-bold !bg-gradient-to-r !from-blue-600 !to-indigo-600 border-none flex items-center gap-2"
            >
              {initialValues ? "Update Promotion" : "Publish Promotion"}
            </Button>
          )}
        </div>
      }
    >
      {/* ─── Immersive Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden pt-12 pb-8 px-8 bg-white border-b border-gray-100">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 rounded-full -translate-y-16 translate-x-16" />

        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="relative w-16 h-16 bg-blue-50 border-2 border-white flex items-center justify-center rounded-3xl text-blue-600 text-2xl">
                <TagOutlined />
              </div>
            </div>
            <div>
              <Title level={3} className="!m-0 !mb-1 font-extrabold text-gray-800 tracking-tight">
                {initialValues
                  ? isAllowed
                    ? "Edit Promotion"
                    : "View Promotion"
                  : "Create Promotion"}
              </Title>
              <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                Campaign Management & Rewards
              </Text>
            </div>
          </div>
          <Button
            type="text"
            icon={<CloseOutlined className="text-gray-400" />}
            onClick={onClose}
            className="hover:bg-gray-100 rounded-full h-10 w-10 flex items-center justify-center"
          />
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        onValuesChange={handleValuesChange}
        className="pt-6 pb-12 space-y-3"
        requiredMark={false}
        disabled={!isAllowed}
      >
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4 mx-4 mt-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
              <TagOutlined className="text-sm" />
            </div>
            <span className="text-xs font-extrabold text-gray-800 uppercase tracking-tight">
              Basic Configuration
            </span>
          </div>

          <Form.Item
            name="code"
            label={
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                Promo Code
              </span>
            }
            rules={[{ required: true, message: "Required" }]}
          >
            <Input
              size="large"
              placeholder="e.g. SUMMER2024"
              className="rounded-2xl font-extrabold uppercase tracking-tight text-blue-600 border-gray-200 focus:border-blue-500 transition-all font-mono"
              onChange={(e) => form.setFieldValue("code", e.target.value.toUpperCase())}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="discount_type"
              label={
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  Reward Type
                </span>
              }
              rules={[{ required: true }]}
            >
              <Select size="large" className="premium-select rounded-2xl w-full">
                <Select.Option value="PERCENTAGE">Percentage (%)</Select.Option>
                <Select.Option value="FIXED">Fixed Amount (₹)</Select.Option>
                <Select.Option value="FREE_RIDE">Free Ride</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="discount_value"
              label={
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  Value
                </span>
              }
              rules={[{ required: true, message: "Required" }]}
            >
              <InputNumber
                size="large"
                min={0}
                className="!w-full rounded-2xl border-gray-200 flex items-center px-4"
                prefix={getDiscountIcon()}
                placeholder={discountType === "PERCENTAGE" ? "20" : "100"}
                formatter={(value) => (discountType === "PERCENTAGE" ? `${value}%` : `₹ ${value}`)}
                parser={(value) => Number(value!.replace(/\D/g, "")) as any}
              />
            </Form.Item>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4 mx-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
              <CalendarOutlined className="text-sm" />
            </div>
            <span className="text-xs font-extrabold text-gray-800 uppercase tracking-tight">
              Limits & Validity
            </span>
          </div>

          <Form.Item
            name="dateRange"
            label={
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                Active Campaign Period
              </span>
            }
            rules={[{ required: true, message: "Required" }]}
          >
            <DatePicker.RangePicker
              size="large"
              showTime
              className="w-full rounded-2xl  border-gray-200"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="min_ride_amount"
              label={
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  Min. Fare (₹)
                </span>
              }
              className="!mb-0"
            >
              <InputNumber
                size="large"
                min={0}
                className="!w-full rounded-2xl  border-gray-200 flex items-center px-4"
                placeholder="None"
              />
            </Form.Item>

            {discountType !== "FIXED" && (
              <Form.Item
                name="max_discount_amount"
                label={
                  <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                    Max Cap (₹)
                  </span>
                }
                className="!mb-0"
              >
                <InputNumber
                  size="large"
                  min={0}
                  className="!w-full rounded-2xl  border-gray-200 flex items-center px-4"
                  placeholder="None"
                />
              </Form.Item>
            )}

            <Form.Item
              name="usage_limit"
              label={
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  Total Uses
                </span>
              }
            >
              <InputNumber
                size="large"
                min={1}
                className="!w-full rounded-2xl  border-gray-200 flex items-center px-4"
                placeholder="Infinity"
              />
            </Form.Item>

            <Form.Item
              name="per_user_limit"
              label={
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  Per User
                </span>
              }
              rules={[{ required: true }]}
            >
              <InputNumber
                size="large"
                min={1}
                className="!w-full rounded-2xl  border-gray-200 flex items-center px-4"
              />
            </Form.Item>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4 mx-4 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
              <UserOutlined className="text-sm" />
            </div>
            <span className="text-xs font-extrabold text-gray-800 uppercase tracking-tight">
              Targeting & State
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="applicable_to"
              label={
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  Audience
                </span>
              }
              rules={[{ required: true }]}
            >
              <Select size="large" className="rounded-2xl w-full">
                <Select.Option value="CUSTOMER">Customers Only</Select.Option>
                <Select.Option value="DRIVER">Drivers Only</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="user_eligibility"
              label={
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  Eligibility
                </span>
              }
            >
              <Select size="large" className="rounded-2xl w-full">
                <Select.Option value="ALL">All Registered</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <div className="flex items-center justify-between p-3 px-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-700">Campaign Status</span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">
                Toggle availability in the app
              </span>
            </div>
            <Form.Item name="is_active" valuePropName="checked" className="m-0">
              <Switch
                className="premium-switch"
                checkedChildren={
                  <span className="text-[9px] font-bold uppercase tracking-tight">Active</span>
                }
                unCheckedChildren={
                  <span className="text-[9px] font-bold uppercase tracking-tight">Off</span>
                }
              />
            </Form.Item>
          </div>
        </div>
      </Form>
    </Drawer>
  );
};

export default CouponFormDrawer;
