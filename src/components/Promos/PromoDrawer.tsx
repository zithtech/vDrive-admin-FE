import React, { useEffect, useState } from "react";
import {
  Drawer,
  Select,
  Button,
  Input,
  DatePicker,
  Switch,
  Form,
  InputNumber,
  message,
} from "antd";
import {
  Ticket,
  Users,
  Clock,
  // Percent,
  // IndianRupee
} from "lucide-react";
import dayjs from "dayjs";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { fetchDrivers } from "../../store/slices/driverSlice";
import { useHasPermission } from "../../hooks/usePermission";
import axios from "../../api/axios";

const { Option } = Select;

interface PromoDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  promo?: any; // The promo object if editing
}

const PromoDrawer: React.FC<PromoDrawerProps> = ({ visible, onClose, onSuccess, promo }) => {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const { drivers } = useAppSelector((state) => state.drivers);

  const hasDriversRead = useHasPermission("drivers", "read");
  const { role } = useAppSelector((state) => state.auth);
  const isSuperAdmin = role === "super_admin";

  useEffect(() => {
    if (visible) {
      if (isSuperAdmin || hasDriversRead) {
        dispatch(fetchDrivers());
      }
      if (promo) {
        form.setFieldsValue({
          ...promo,
          dates:
            promo.start_date && promo.expiry_date
              ? [dayjs(promo.start_date), dayjs(promo.expiry_date)]
              : [],
          discount_type: promo.discount_type || "percentage",
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          discount_type: "percentage",
          target_type: "global",
          is_active: true,
          max_uses_per_driver: 1,
        });
      }
    }
  }, [visible, promo, form, dispatch, isSuperAdmin, hasDriversRead]);

  const handleSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      const [start, end] = values.dates || [];
      const payload = {
        ...values,
        start_date: start?.toISOString(),
        expiry_date: end?.toISOString(),
      };
      delete payload.dates;

      if (promo?.id) {
        await axios.put(`/api/promos/${promo.id}`, payload);
        message.success("Promotion updated successfully");
      } else {
        await axios.post("/api/promos", payload);
        message.success("Promotion launched successfully");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Failed to save promotion");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
            <Ticket size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800">
              {promo ? "Edit Driver Offer" : "Create Driver Offer"}
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Define your discount logic
            </p>
          </div>
        </div>
      }
      width={520}
      onClose={onClose}
      open={visible}
      className="custom-drawer"
      footer={
        <div className="flex gap-4 p-4">
          <Button onClick={onClose} className="flex-1 rounded-xl h-12 font-bold">
            Cancel
          </Button>
          <Button
            type="primary"
            loading={isSubmitting}
            onClick={() => form.submit()}
            className="flex-1 rounded-xl h-12 font-bold bg-indigo-600 border-none shadow-lg shadow-indigo-100"
          >
            {promo ? "Update Offer" : "Launch Offer"}
          </Button>
        </div>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="space-y-6">
        <Form.Item
          name="code"
          label="Offer Code"
          rules={[{ required: true, message: "Code is required" }]}
        >
          <Input
            placeholder="E.g. DRIVE100"
            className="rounded-xl h-11 uppercase font-mono font-bold border-slate-200"
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="discount_type" label="Offer Type" rules={[{ required: true }]}>
            <Select className="h-11 custom-select-main">
              <Option value="percentage">Percentage (%)</Option>
              <Option value="fixed">Fixed Amount (₹)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prev, curr) => prev.discount_type !== curr.discount_type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue("discount_type");
              return (
                <Form.Item
                  name="discount_value"
                  label="Discount Value"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    className="w-full rounded-xl h-11 flex items-center border-slate-200"
                    min={1}
                    placeholder="Enter value"
                    prefix={
                      type === "fixed" ? (
                        <span className="text-gray-400 font-medium mr-1 border-r pr-2 border-gray-200">
                          ₹
                        </span>
                      ) : undefined
                    }
                    suffix={
                      type === "percentage" ? (
                        <span className="text-gray-400 font-medium ml-1 border-l pl-2 border-gray-200">
                          %
                        </span>
                      ) : undefined
                    }
                  />
                </Form.Item>
              );
            }}
          </Form.Item>
        </div>

        <div className="space-y-3">
          <Form.Item name="description" label="Internal Description" className="mb-0">
            <Input.TextArea
              placeholder="Describe this offer for admin records..."
              rows={3}
              className="rounded-xl border-slate-200"
            />
          </Form.Item>

          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mr-1">
              Quick Picks:
            </span>
            {[
              "Weekend Special Drive",
              "New Driver Welcome Bonus",
              "High Demand Area Multiplier",
              "Festival Season Offer",
              "VIP Driver Loyalty Reward",
            ].map((sug) => (
              <button
                type="button"
                key={sug}
                onClick={() => {
                  const currentDesc = form.getFieldValue("description") || "";
                  form.setFieldsValue({
                    description: currentDesc ? `${currentDesc}. ${sug}` : sug,
                  });
                }}
                className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-[10px] font-bold text-slate-500 transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Users size={14} /> Audience Targeting
          </h4>

          <Form.Item name="target_type" label="Target Audience" rules={[{ required: true }]}>
            <Select
              className="h-11 custom-select-main"
              onChange={() =>
                form.setFieldsValue({ target_driver_id: undefined, min_rides_required: 0 })
              }
            >
              <Option value="global">Global (All Drivers)</Option>
              <Option value="specific_driver">Specific Driver Offer</Option>
              <Option value="ride_count_based">Performance Based (Rides)</Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.target_type !== curr.target_type}>
            {({ getFieldValue }) => (
              <>
                {getFieldValue("target_type") === "specific_driver" && (
                  <Form.Item
                    name="target_driver_id"
                    label="Search Driver"
                    rules={[{ required: true }]}
                  >
                    <Select
                      showSearch
                      placeholder="Search by name or phone"
                      className="h-11 custom-select-main"
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        (String(option?.label) ?? "").toLowerCase().includes(input.toLowerCase())
                      }
                      options={drivers.map((d) => ({
                        value: d.id,
                        label: `${d.full_name} (${d.phone_number})`,
                      }))}
                    />
                  </Form.Item>
                )}
                {getFieldValue("target_type") === "ride_count_based" && (
                  <Form.Item
                    name="min_rides_required"
                    label="Min. Rides Required"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      className="w-full rounded-xl h-11 flex items-center"
                      min={1}
                      placeholder="Keep 0 for no limit"
                    />
                  </Form.Item>
                )}
              </>
            )}
          </Form.Item>
        </div>

        <div className="bg-indigo-50/30 p-6 rounded-2xl border border-indigo-100/30 space-y-4">
          <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
            <Clock size={14} /> Validity & Limits
          </h4>

          <Form.Item name="dates" label="Validity Period">
            <DatePicker.RangePicker className="w-full rounded-xl h-11 border-indigo-100/50" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="max_uses" label="Total Usage Limit">
              <InputNumber
                className="w-full rounded-xl h-11 flex items-center"
                placeholder="Infinite"
                min={1}
              />
            </Form.Item>
            <Form.Item name="max_uses_per_driver" label="Limit Per Driver">
              <InputNumber className="w-full rounded-xl h-11 flex items-center" min={1} />
            </Form.Item>
          </div>
        </div>

        <Form.Item name="is_active" label="Status" valuePropName="checked">
          <Switch
            checkedChildren="Active"
            unCheckedChildren="Inactive"
            className="custom-switch-lg"
          />
        </Form.Item>
      </Form>
      <style>{`
        .custom-select-main .ant-select-selector {
          border-radius: 12px !important;
          border-color: #e2e8f0 !important;
        }
        .ant-form-item-label label {
          font-weight: 700 !important;
          color: #64748b !important;
          font-size: 13px !important;
        }
        .custom-switch-lg.ant-switch-checked {
          background-color: #4f46e5;
        }
      `}</style>
    </Drawer>
  );
};

export default PromoDrawer;
