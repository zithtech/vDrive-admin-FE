import React, { useEffect } from "react";
import { Drawer, Form, Input, InputNumber, Select, Switch, Button, Typography } from "antd";
import {
  // PlusOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  CloseOutlined,
  // InfoCircleOutlined,
} from "@ant-design/icons";
import type { Tax, TaxPayload, TaxType } from "../../store/slices/taxSlice";
import { useHasPermission } from "../../hooks/usePermission";
import { useAppSelector } from "../../store/hooks";

const { Title, Text } = Typography;
const { TextArea } = Input;

// ── Constants ─────────────────────────────────────────────────────────────────

const INDIAN_TAXES = [
  { label: "Goods and Services Tax (GST)", value: "GST" },
  { label: "Central GST (CGST)", value: "CGST" },
  { label: "State GST (SGST)", value: "SGST" },
  { label: "Integrated GST (IGST)", value: "IGST" },
  { label: "Union Territory GST (UTGST)", value: "UTGST" },
  { label: "Tax Deducted at Source (TDS)", value: "TDS" },
  { label: "Tax Collected at Source (TCS)", value: "TCS" },
  { label: "Value Added Tax (VAT)", value: "VAT" },
  { label: "Professional Tax (PT)", value: "PT" },
  { label: "Surcharge", value: "SURCHARGE" },
];

const TAX_TYPE_MAP: Record<string, TaxType> = {
  GST: "COMPOSITE",
  CGST: "CENTRAL",
  IGST: "CENTRAL",
  TDS: "CENTRAL",
  TCS: "CENTRAL",
  SURCHARGE: "CENTRAL",
  SGST: "STATE",
  VAT: "STATE",
  PT: "STATE",
  UTGST: "UNION_TERRITORY",
};

const TAX_TYPE_OPTIONS: { label: string; value: TaxType }[] = [
  { label: "Central", value: "CENTRAL" },
  { label: "State", value: "STATE" },
  { label: "Union Territory", value: "UNION_TERRITORY" },
  { label: "Composite", value: "COMPOSITE" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateTaxCode(selectedTax: string, percentage: number | undefined): string {
  if (!selectedTax || percentage == null || percentage <= 0) return "";
  return `${selectedTax}_${String(percentage).replace(".", "_")}`;
}

function generateTaxName(selectedTax: string, percentage: number | undefined): string {
  if (!selectedTax || percentage == null || percentage <= 0) return "";
  return `${selectedTax} – ${percentage}%`;
}

interface TaxFormDrawerProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: TaxPayload) => void;
  initialValues?: Tax | null;
  loading?: boolean;
}

const TaxFormDrawer: React.FC<TaxFormDrawerProps> = ({
  visible,
  onClose,
  onSubmit,
  initialValues,
  loading,
}) => {
  const canCreateTax = useHasPermission("taxes", "create");
  const canUpdateTax = useHasPermission("taxes", "update");
  const { role } = useAppSelector((state) => state.auth);
  const isSuperAdmin = role === "super_admin";
  const isAllowed = isSuperAdmin || (initialValues ? canUpdateTax : canCreateTax);

  const [form] = Form.useForm<TaxPayload>();

  const watchedIndianTax: string = Form.useWatch("indian_tax", form);
  const watchedPercentage: number = Form.useWatch("percentage", form);

  useEffect(() => {
    if (visible) {
      if (initialValues) {
        form.setFieldsValue({
          indian_tax: initialValues.indian_tax,
          tax_name: initialValues.tax_name,
          tax_code: initialValues.tax_code,
          tax_type: initialValues.tax_type,
          percentage: initialValues.percentage,
          description: initialValues.description,
          is_active: initialValues.is_active,
          is_default: initialValues.is_default,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ is_active: true, is_default: false });
      }
    }
  }, [visible, initialValues, form]);

  useEffect(() => {
    if (watchedIndianTax) {
      const autoType = TAX_TYPE_MAP[watchedIndianTax];
      if (autoType) form.setFieldValue("tax_type", autoType);
    }
    if (watchedIndianTax && watchedPercentage != null) {
      form.setFieldValue("tax_code", generateTaxCode(watchedIndianTax, watchedPercentage));
      form.setFieldValue("tax_name", generateTaxName(watchedIndianTax, watchedPercentage));
    }
  }, [watchedIndianTax, watchedPercentage, form]);

  const previewCode = generateTaxCode(watchedIndianTax, watchedPercentage);
  const previewName = generateTaxName(watchedIndianTax, watchedPercentage);
  const previewType = watchedIndianTax ? TAX_TYPE_MAP[watchedIndianTax] : null;
  const showPreview = !!previewCode;

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
              disabled={!showPreview}
              className="rounded-full h-11 px-10 font-bold !bg-gradient-to-r !from-indigo-600 !to-violet-600 border-none flex items-center gap-2"
            >
              {initialValues ? "Apply Revisions" : "Save Tax Rule"}
            </Button>
          )}
        </div>
      }
    >
      {/* ─── Immersive Header ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden pt-12 pb-8 px-8 bg-white border-b border-gray-100">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-600/5 rounded-full -translate-y-16 translate-x-16" />

        <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="relative w-16 h-16 bg-indigo-50 border-2 border-white flex items-center justify-center rounded-3xl text-indigo-600 text-2xl">
                <SafetyCertificateOutlined />
              </div>
            </div>
            <div>
              <Title level={3} className="!m-0 !mb-1 font-extrabold text-gray-800 tracking-tight">
                {initialValues
                  ? isAllowed
                    ? "Modify Tax Rule"
                    : "View Tax Rule"
                  : "Create Tax Rule"}
              </Title>
              <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                Statutory Configuration & Slab Management
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
        onFinish={onSubmit}
        className="pt-6 pb-12 space-y-4"
        requiredMark={false}
        disabled={!isAllowed}
      >
        <div className="bg-white p-4 pb-1 rounded-[2rem] border border-gray-100 shadow-sm space-y-3 mx-4 mt-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 font-black text-xs">
              01
            </div>
            <span className="text-xs font-extrabold text-gray-800 uppercase tracking-tight">
              Core Configuration
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="indian_tax"
              label={
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  Indian Tax Type
                </span>
              }
              rules={[{ required: true, message: "Required" }]}
              className="m-0"
            >
              <Select
                placeholder="Select tax..."
                options={INDIAN_TAXES}
                showSearch
                size="large"
                className="premium-select rounded-2xl"
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item
              name="percentage"
              label={
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  Tax Percentage
                </span>
              }
              rules={[
                { required: true, message: "Required" },
                { type: "number", min: 0.01, max: 100, message: "0.01 - 100" },
              ]}
              className="m-0"
            >
              <InputNumber
                min={0.01}
                max={100}
                step={0.5}
                precision={2}
                formatter={(value) => `${value}%`}
                parser={(value) => Number(value!.replace("%", "")) as any}
                className="!w-full rounded-2xl border-gray-200 flex items-center"
                size="large"
                placeholder="e.g. 18.00"
              />
            </Form.Item>
          </div>
        </div>

        {showPreview && (
          <div className="relative overflow-hidden rounded-[1rem] bg-gradient-to-r from-indigo-600 to-violet-600 p-4 mx-4">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <SafetyCertificateOutlined className="text-white text-5xl rotate-12" />
            </div>
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm shrink-0">
                  <ThunderboltOutlined className="text-white text-lg animate-pulse" />
                </div>
                <div>
                  <span className="text-[8px] font-black text-white/50 uppercase tracking-widest block mb-0.5">
                    Identity
                  </span>
                  <h4 className="text-white font-black text-sm tracking-tight leading-none">
                    {previewName}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">
                    System Code
                  </span>
                  <code className="bg-white/10 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold border border-white/10 backdrop-blur-sm">
                    {previewCode}
                  </code>
                </div>
                {previewType && (
                  <div className="flex flex-col items-end border-l border-white/10 pl-4">
                    <span className="text-[8px] font-black text-white/50 uppercase tracking-widest mb-1">
                      Class
                    </span>
                    <span className="text-white font-black text-[10px] uppercase tracking-widest">
                      {previewType.split("_")[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm space-y-2 mx-4 mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 font-black text-xs">
              02
            </div>
            <span className="text-xs font-extrabold text-gray-800 uppercase tracking-tight">
              Ledger Details
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-1">
            <Form.Item
              name="tax_name"
              label={
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  Formal Name
                </span>
              }
              rules={[{ required: true }]}
              className="m-0"
            >
              <Input
                readOnly
                size="large"
                className="!bg-gray-50 !border-gray-100 !text-gray-400 !font-bold !cursor-not-allowed rounded-2xl !h-12"
                prefix={<CheckCircleOutlined className="text-indigo-300" />}
              />
            </Form.Item>

            <Form.Item
              name="tax_code"
              label={
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  Unique Code
                </span>
              }
              rules={[{ required: true }]}
              className="m-0"
            >
              <Input
                readOnly
                size="large"
                className="!bg-gray-50 !border-gray-100 !text-gray-400 !font-mono !cursor-not-allowed rounded-2xl !h-12"
                prefix={<HistoryOutlined className="text-indigo-300" />}
              />
            </Form.Item>

            <Form.Item
              name="tax_type"
              label={
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  Tax Slab
                </span>
              }
              rules={[{ required: true }]}
              className="m-0"
            >
              <Select
                options={TAX_TYPE_OPTIONS}
                size="large"
                disabled
                className="!bg-gray-50 premium-select rounded-2xl"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label={
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                Context & Notes
              </span>
            }
          >
            <TextArea
              rows={3}
              placeholder="Detail the legal context..."
              className="rounded-2xl !h-25"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase">Active</span>
              <Form.Item name="is_active" valuePropName="checked" className="m-0">
                <Switch size="small" />
              </Form.Item>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase">Default</span>
              <Form.Item name="is_default" valuePropName="checked" className="m-0">
                <Switch size="small" />
              </Form.Item>
            </div>
          </div>
        </div>
      </Form>
    </Drawer>
  );
};

export default TaxFormDrawer;
