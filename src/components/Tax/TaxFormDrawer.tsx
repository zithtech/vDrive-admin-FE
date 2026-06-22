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
      width={500}
      onClose={onClose}
      open={visible}
      closable={false}
      rootClassName="dark-drawer compact-tax-drawer"
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
              disabled={!showPreview}
              className="rounded-none h-8 px-6 font-bold !bg-blue-600 hover:!bg-blue-700 border-none flex items-center gap-1.5 text-xs text-white"
            >
              {initialValues ? "Apply Revisions" : "Save Tax Rule"}
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
                <SafetyCertificateOutlined />
              </div>
            </div>
            <div>
              <Title level={4} className="!m-0 !mb-0.5 font-extrabold text-gray-800 dark:text-slate-100 tracking-tight">
                {initialValues
                  ? isAllowed
                    ? "Modify Tax Rule"
                    : "View Tax Rule"
                  : "Create Tax Rule"}
              </Title>
              <Text className="text-gray-450 dark:text-slate-500 font-bold text-[9px] uppercase tracking-widest">
                Statutory Configuration & Slab Management
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
        onFinish={onSubmit}
        className="pt-2 pb-4 space-y-2"
        requiredMark={false}
        disabled={!isAllowed}
      >
        <div className="bg-white dark:bg-slate-800/50 p-3 border border-gray-100 dark:border-slate-700 shadow-sm space-y-1 mx-3.5 mt-2.5 rounded-none">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-none bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400 font-extrabold text-[10px]">
              01
            </div>
            <span className="text-[10px] font-extrabold text-gray-800 dark:text-slate-200 uppercase tracking-tight">
              Core Configuration
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="indian_tax"
              label={
                <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                  Indian Tax Type
                </span>
              }
              rules={[{ required: true, message: "Required" }]}
              className="!mb-1.5"
            >
              <Select
                placeholder="Select tax..."
                options={INDIAN_TAXES}
                showSearch
                className="premium-select rounded-none w-full text-xs"
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item
              name="percentage"
              label={
                <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                  Tax Percentage
                </span>
              }
              rules={[
                { required: true, message: "Required" },
                { type: "number", min: 0.01, max: 100, message: "0.01 - 100" },
              ]}
              className="!mb-1.5"
            >
              <InputNumber
                min={0.01}
                max={100}
                step={0.5}
                precision={2}
                formatter={(value) => `${value}%`}
                parser={(value) => Number(value!.replace("%", "")) as any}
                className="!w-full rounded-none border-gray-200 flex items-center text-xs h-8"
                placeholder="e.g. 18.00"
              />
            </Form.Item>
          </div>
        </div>

        {showPreview && (
          <div className="relative overflow-hidden rounded-none bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 p-3 mx-3.5">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <SafetyCertificateOutlined className="text-blue-600/5 dark:text-blue-400/5 text-5xl rotate-12" />
            </div>
            <div className="relative flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-none bg-blue-100/60 dark:bg-blue-950/80 border border-blue-200/50 dark:border-blue-900/50 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
                  <ThunderboltOutlined className="text-base animate-pulse" />
                </div>
                <div>
                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-0.5">
                    Identity
                  </span>
                  <h4 className="text-slate-800 dark:text-slate-100 font-black text-xs tracking-tight leading-none">
                    {previewName}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                    System Code
                  </span>
                  <code className="bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-none text-[9px] font-bold border border-slate-200 dark:border-slate-700">
                    {previewCode}
                  </code>
                </div>
                {previewType && (
                  <div className="flex flex-col items-end border-l border-slate-200 dark:border-slate-700 pl-3">
                    <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                      Class
                    </span>
                    <span className="text-slate-705 dark:text-slate-300 font-black text-[9px] uppercase tracking-widest">
                      {previewType.split("_")[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800/50 p-3 border border-gray-100 dark:border-slate-700 shadow-sm space-y-1 mx-3.5 mb-3 rounded-none">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-none bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400 font-extrabold text-[10px]">
              02
            </div>
            <span className="text-[10px] font-extrabold text-gray-800 dark:text-slate-200 uppercase tracking-tight">
              Ledger Details
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-1">
            <Form.Item
              name="tax_name"
              label={
                <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                  Formal Name
                </span>
              }
              rules={[{ required: true }]}
              className="!mb-1.5"
            >
              <Input
                readOnly
                className="!bg-gray-50 dark:!bg-slate-800 !border-gray-100 dark:!border-slate-700 !text-gray-400 !font-bold !cursor-not-allowed rounded-none h-8 text-xs"
                prefix={<CheckCircleOutlined className="text-blue-400" />}
              />
            </Form.Item>

            <Form.Item
              name="tax_code"
              label={
                <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                  Unique Code
                </span>
              }
              rules={[{ required: true }]}
              className="!mb-1.5"
            >
              <Input
                readOnly
                className="!bg-gray-50 dark:!bg-slate-800 !border-gray-100 dark:!border-slate-700 !text-gray-400 !font-mono !cursor-not-allowed rounded-none h-8 text-xs"
                prefix={<HistoryOutlined className="text-blue-400" />}
              />
            </Form.Item>

            <Form.Item
              name="tax_type"
              label={
                <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                  Tax Slab
                </span>
              }
              rules={[{ required: true }]}
              className="!mb-1.5"
            >
              <Select
                options={TAX_TYPE_OPTIONS}
                disabled
                className="!bg-gray-50 dark:!bg-slate-800 premium-select rounded-none w-full text-xs h-8"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label={
              <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400">
                Context & Notes
              </span>
            }
            className="!mb-1.5"
          >
            <TextArea
              rows={2}
              placeholder="Detail the legal context..."
              className="rounded-none text-xs"
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-none">
              <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Active</span>
              <Form.Item name="is_active" valuePropName="checked" className="m-0">
                <Switch size="small" />
              </Form.Item>
            </div>
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-none">
              <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Default</span>
              <Form.Item name="is_default" valuePropName="checked" className="m-0">
                <Switch size="small" />
              </Form.Item>
            </div>
          </div>
        </div>
      </Form>

      <style>{`
        .compact-tax-drawer .ant-drawer-content-wrapper,
        .compact-tax-drawer .ant-drawer-content {
          border-radius: 0px !important;
        }
        .compact-tax-drawer .ant-input,
        .compact-tax-drawer .ant-input-affix-wrapper,
        .compact-tax-drawer .ant-input-number,
        .compact-tax-drawer .ant-input-number-input-wrap,
        .compact-tax-drawer .ant-select-selector,
        .compact-tax-drawer .ant-btn {
          border-radius: 0px !important;
        }
      `}</style>
    </Drawer>
  );
};

export default TaxFormDrawer;
