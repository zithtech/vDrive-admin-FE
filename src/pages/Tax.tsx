import React, { useEffect, useState } from "react";
import {
  Button,
  notification,
  Descriptions,
  Tag,
  Badge,
  Drawer,
  Typography,
} from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import TaxFormDrawer from "../components/Tax/TaxFormDrawer";
import TitleBar from "../components/TitleBarCommon/TitleBar";
import TaxTable from "../components/TaxTable/TaxTable";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useHasPermission } from "../hooks/usePermission";
import {
  fetchTaxes,
  addTax,
  updateTax,
  updateTaxStatus,
  deleteTax,
} from "../store/slices/taxSlice";
import type { Tax, TaxPayload } from "../store/slices/taxSlice";

// const { TextArea } = Input;
const { Title, Text } = Typography;

// ── Constants ─────────────────────────────────────────────────────────────────

// const INDIAN_TAXES = [
//   { label: "Goods and Services Tax (GST)", value: "GST" },
//   { label: "Central GST (CGST)", value: "CGST" },
//   { label: "State GST (SGST)", value: "SGST" },
//   { label: "Integrated GST (IGST)", value: "IGST" },
//   { label: "Union Territory GST (UTGST)", value: "UTGST" },
//   { label: "Tax Deducted at Source (TDS)", value: "TDS" },
//   { label: "Tax Collected at Source (TCS)", value: "TCS" },
//   { label: "Value Added Tax (VAT)", value: "VAT" },
//   { label: "Professional Tax (PT)", value: "PT" },
//   { label: "Surcharge", value: "SURCHARGE" },
// ];

// const TAX_TYPE_MAP: Record<string, TaxType> = {
//   GST: "COMPOSITE",
//   CGST: "CENTRAL",
//   IGST: "CENTRAL",
//   TDS: "CENTRAL",
//   TCS: "CENTRAL",
//   SURCHARGE: "CENTRAL",
//   SGST: "STATE",
//   VAT: "STATE",
//   PT: "STATE",
//   UTGST: "UNION_TERRITORY",
// };

// const TAX_TYPE_OPTIONS: { label: string; value: TaxType }[] = [
//   { label: "Central", value: "CENTRAL" },
//   { label: "State", value: "STATE" },
//   { label: "Union Territory", value: "UNION_TERRITORY" },
//   { label: "Composite", value: "COMPOSITE" },
// ];

// const TAX_TYPE_COLORS: Record<string, string> = {
//   CENTRAL: "gold",
//   STATE: "green",
//   UNION_TERRITORY: "purple",
//   COMPOSITE: "blue",
// };

// ── Helpers ───────────────────────────────────────────────────────────────────

// function generateTaxCode(selectedTax: string, percentage: number | undefined): string {
//   if (!selectedTax || percentage == null || percentage <= 0) return "";
//   return `${selectedTax}_${String(percentage).replace(".", "_")}`;
// }

// function generateTaxName(selectedTax: string, percentage: number | undefined): string {
//   if (!selectedTax || percentage == null || percentage <= 0) return "";
//   return `${selectedTax} – ${percentage}%`;
// }

// type TaxFormValues = TaxPayload;

// // ── Component ─────────────────────────────────────────────────────────────────

// type Segment = "List" | "Add" | "Edit";

const TaxPage: React.FC = () => {
  const canCreateTax = useHasPermission("taxes", "create");
  const canUpdateTax = useHasPermission("taxes", "update");
  const canDeleteTax = useHasPermission("taxes", "delete");

  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const [viewingTax, setViewingTax] = useState<Tax | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const dispatch = useAppDispatch();
  const { taxes, isLoading, error } = useAppSelector((state) => state.tax);
  const { role } = useAppSelector((state) => state.auth);
  const isSuperAdmin = role === 'super_admin';

  const hasCreateAccess = isSuperAdmin || canCreateTax;
  const hasUpdateAccess = isSuperAdmin || canUpdateTax;
  const hasDeleteAccess = isSuperAdmin || canDeleteTax;

  useEffect(() => {
    dispatch(fetchTaxes());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      notification.error({ message: "Error", description: error });
    }
  }, [error]);

  const handleAddClick = () => {
    setEditingTax(null);
    setDrawerVisible(true);
  };

  const handleEdit = (tax: Tax) => {
    setEditingTax(tax);
    setDrawerVisible(true);
  };

  const handleView = (tax: Tax) => setViewingTax(tax);

  const handleDelete = (id: string) => {
    dispatch(deleteTax(id)).then((res: any) => {
      if (!res.hasOwnProperty("error")) {
        notification.success({ message: "Tax deleted successfully" });
      }
    });
  };

  const handleToggleStatus = (id: string, is_active: boolean) => {
    dispatch(updateTaxStatus({ id, is_active }));
  };

  const onFinish = (values: TaxPayload) => {
    if (editingTax) {
      dispatch(updateTax({ id: editingTax.id, taxData: values })).then((res: any) => {
        if (!res.hasOwnProperty("error")) {
          notification.success({ message: "Tax updated successfully" });
          setDrawerVisible(false);
        }
      });
    } else {
      dispatch(addTax(values)).then((res: any) => {
        if (!res.hasOwnProperty("error")) {
          notification.success({ message: "Tax added successfully" });
          setDrawerVisible(false);
        }
      });
    }
  };

  const renderViewDrawer = () => (
    <Drawer
      placement="right"
      width={600}
      onClose={() => setViewingTax(null)}
      open={!!viewingTax}
      closable={false}
      styles={{
        header: { display: 'none' },
        body: { padding: 0, background: "#f8fafc" },
        footer: { borderTop: "1px solid #f1f5f9", padding: "16px 24px", background: "#fff" },
      }}
      footer={
        <div className="flex justify-end gap-3 px-2">
          <Button
            key="close"
            className="rounded-full h-11 px-8 font-bold text-gray-400 hover:text-gray-600 border-gray-200 transition-all"
            onClick={() => setViewingTax(null)}
          >
            Close
          </Button>
          {hasUpdateAccess && (
            <Button
              key="edit"
              type="primary"
              className="rounded-full h-11 px-10 font-bold !bg-gradient-to-r !from-indigo-600 !to-violet-600 border-none flex items-center gap-2"
              onClick={() => {
                const current = viewingTax;
                setViewingTax(null);
                if (current) handleEdit(current);
              }}
            >
              Edit Rule
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
                <InfoCircleOutlined />
              </div>
            </div>
            <div>
              <Title level={3} className="!m-0 !mb-1 font-extrabold text-gray-800 tracking-tight">
                Tax Rule Intel
              </Title>
              <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                Comprehensive configuration overview
              </Text>
            </div>
          </div>
          <Button
            type="text"
            icon={<CloseOutlined className="text-gray-400" />}
            onClick={() => setViewingTax(null)}
            className="hover:bg-gray-100 rounded-full h-10 w-10 flex items-center justify-center"
          />
        </div>
      </div>

      {viewingTax && (
        <div className="p-8">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <Descriptions
              bordered
              column={1}
              size="small"
              labelStyle={{
                fontWeight: 800,
                width: 160,
                background: "#fcfdfe",
                color: "#64748b",
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '16px 20px'
              }}
              contentStyle={{
                background: "#ffffff",
                color: "#1e293b",
                fontWeight: 600,
                fontSize: '14px',
                padding: '16px 20px'
              }}
            >
              <Descriptions.Item label="Identity">
                <span className="font-black text-gray-900">{viewingTax.tax_name}</span>
              </Descriptions.Item>
              <Descriptions.Item label="System Code">
                <code className="bg-slate-50 text-indigo-500 px-2 py-1 rounded border border-slate-100 font-mono text-xs font-bold">{viewingTax.tax_code}</code>
              </Descriptions.Item>
              <Descriptions.Item label="Classification">
                <div className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white shadow-md bg-gradient-to-br from-indigo-500 to-violet-500`}>
                  {viewingTax.tax_type?.replace(/_/g, " ")}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Levy Weight">
                <Tag color="geekblue" className="font-black rounded-lg border-none bg-indigo-50 text-indigo-600 px-3 py-1 m-0">
                  {viewingTax.percentage}%
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Active Status">
                <Badge
                  status={viewingTax.is_active ? "processing" : "default"}
                  text={<span className={`font-black uppercase tracking-widest text-[10px] ${viewingTax.is_active ? 'text-emerald-500' : 'text-gray-400'}`}>{viewingTax.is_active ? "Operational" : "Deactivated"}</span>}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                {viewingTax.is_default ? (
                  <span className="text-amber-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    Primary Default Tax
                  </span>
                ) : <span className="text-gray-400 text-xs">Standard Supplementary</span>}
              </Descriptions.Item>
              <Descriptions.Item label="Legal Context">
                <p className="text-sm text-gray-600 leading-relaxed py-2 italic">
                  {viewingTax.description || "No additional context provided for this rule."}
                </p>
              </Descriptions.Item>
              <Descriptions.Item label="Timeline">
                <div className="flex flex-col gap-1 text-[11px] text-gray-400">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircleOutlined className="text-[10px]" /> Created: {new Date(viewingTax.created_at).toLocaleString("en-IN")}
                  </div>
                  <div className="flex items-center gap-2 font-medium">
                    <HistoryOutlined className="text-[10px]" /> Last Update: {new Date(viewingTax.updated_at).toLocaleString("en-IN")}
                  </div>
                </div>
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>
      )}
    </Drawer>
  );

  return (
    <TitleBar
      title="Tax Configuration"
      description="Define and orchestrate statutory tax obligations and service levies."
      icon={
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center">          <SafetyCertificateOutlined className="text-white text-2xl" />
        </div>
      }
      extraContent={
        hasCreateAccess && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={handleAddClick}
            className="rounded-full h-11 px-8 font-bold !bg-gradient-to-r !from-indigo-600 !to-blue-500 border-none"
          >
            Create Tax Rule
          </Button>
        )
      }
    >
      <div className="w-full flex flex-col gap-6">
        <div className="flex justify-between items-center mb-2 px-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <HistoryOutlined className="text-indigo-600 text-lg" />
            </div>
            <div className="mt-2">
              <h3 className="text-lg font-black text-gray-800 tracking-tight leading-none mb-1">Tax Ledger</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Historical & active taxes</p>
            </div>
          </div>
          <Button
            icon={<ReloadOutlined className={isLoading ? "animate-spin" : ""} />}
            onClick={() => dispatch(fetchTaxes())}
            className="rounded-full h-10 w-10 flex items-center justify-center border-gray-100 text-gray-400 hover:text-indigo-600 transition-all bg-white"
          />
        </div>

        <div className="flex-grow">
          <TaxTable
            data={taxes}
            loading={isLoading}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            canUpdate={hasUpdateAccess}
            canDelete={hasDeleteAccess}
          />
        </div>
      </div>

      <TaxFormDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onSubmit={onFinish}
        initialValues={editingTax}
        loading={isLoading}
      />

      {renderViewDrawer()}
    </TitleBar>
  );
};

export default TaxPage;