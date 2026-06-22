import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Users,
  Ticket,
  BarChart3,
  Percent,
  IndianRupee,
  Clock,
} from "lucide-react";
import axios from "../api/axios";
import { Drawer, Select, Button, Input, DatePicker, Switch, Form, InputNumber } from "antd";
import { messageApi, modalApi, notificationApi } from "../utilities/antdStaticHolder";
import dayjs from "dayjs";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { fetchDrivers } from "../store/slices/driverSlice";
import { useHasPermission } from "../hooks/usePermission";

/* ================= TYPES ================= */

interface Promo {
  id: number;
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  target_type: "global" | "specific_driver" | "ride_count_based";
  target_driver_id?: string;
  min_rides_required: number;
  max_uses?: number;
  max_uses_per_driver: number;
  start_date: string;
  expiry_date?: string;
  is_active: boolean;
  usage_count: number;
  total_discount: number;
  created_at: string;
}

/* ================= COMPONENT ================= */

const PromotionsPage: React.FC = () => {
  const canCreatePromo = useHasPermission("promos", "create");
  const canUpdatePromo = useHasPermission("promos", "update");

  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { drivers } = useAppSelector((state) => state.drivers);

  const isAllowed = editingId ? canUpdatePromo : canCreatePromo;

  useEffect(() => {
    fetchPromos();
    dispatch(fetchDrivers());
  }, []);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/promos");
      setPromos(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch promos:", err);
      messageApi.error("Failed to load promotions");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (promo?: Promo) => {
    if (promo) {
      setEditingId(promo.id);
      form.setFieldsValue({
        code: promo.code,
        description: promo.description,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        target_type: promo.target_type,
        target_driver_id: promo.target_driver_id,
        min_rides_required: promo.min_rides_required,
        max_uses: promo.max_uses,
        max_uses_per_driver: promo.max_uses_per_driver,
        dates: [dayjs(promo.start_date), promo.expiry_date ? dayjs(promo.expiry_date) : null],
        is_active: promo.is_active,
      });
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({
        discount_type: "percentage",
        target_type: "global",
        max_uses_per_driver: 1,
        is_active: true,
        dates: [dayjs(), null],
      });
    }
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      const [start, end] = values.dates || [];

      const payload = {
        ...values,
        start_date: start?.toISOString(),
        expiry_date: end?.toISOString(),
      };
      delete payload.dates;

      if (editingId) {
        await axios.put(`/api/promos/${editingId}`, payload);
        notificationApi.success({
          message: "Promo Updated",
          description: `Coupon "${values.code}" updated successfully.`,
        });
      } else {
        await axios.post("/api/promos", payload);
        notificationApi.success({
          message: "Promo Created",
          description: `New coupon "${values.code}" is now active.`,
        });
      }

      setIsDrawerOpen(false);
      fetchPromos();
    } catch (err: any) {
      messageApi.error(err?.response?.data?.message || "Failed to save promotion");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number, code: string) => {
    modalApi.confirm({
      title: "Delete Promotion",
      content: `Are you sure you want to delete "${code}"? This will remove all history and cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await axios.delete(`/api/promos/${id}`);
          messageApi.success("Promo deleted successfully");
          fetchPromos();
        } catch (err) {
          messageApi.error("Failed to delete");
        }
      },
    });
  };

  const filteredPromos = useMemo(() => {
    return promos.filter((p) => {
      const matchesSearch = p.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.is_active) ||
        (statusFilter === "inactive" && !p.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [promos, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalDiscount = promos.reduce((sum, p) => sum + Number(p.total_discount || 0), 0);
    const active = promos.filter((p) => p.is_active).length;
    return { totalDiscount, active };
  }, [promos]);

  return (
    <div className="flex flex-row h-full w-full bg-[#f8f9fa] dark:bg-[#0b0f19] overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-[260px] flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
        {/* Sidebar Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2 mb-1 text-slate-800 dark:text-slate-100">
            <Ticket size={20} className="text-indigo-600" />
            <h2 className="font-black text-sm uppercase tracking-wider">OFFERS</h2>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subscription Offers</p>
        </div>

        <div className="px-4 pb-6 border-b border-slate-100 dark:border-slate-700/50">
          <button
            onClick={() => handleOpenDrawer()}
            className="w-full py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white !text-white rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-colors shadow-md shadow-blue-500/20 border-none"
            style={{ color: "#ffffff" }}
          >
            <Plus size={18} /> Create Offer
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
          {/* Filters Section */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <span className="text-[11px] font-black tracking-widest uppercase text-slate-600 dark:text-slate-400">FILTERS</span>
            </div>
            
            <div className="space-y-4 px-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Status</label>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  className="w-full h-9 custom-select-compact"
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                />
              </div>

              {(statusFilter !== "all" || searchTerm) && (
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setSearchTerm("");
                  }}
                  className="w-full h-[36px] flex items-center justify-center rounded-lg text-[11px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-all mt-2"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-white dark:bg-[#0b0f19]">
        {/* Top Navbar */}
        <div className="bg-white dark:bg-slate-800 p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 shadow-sm z-0">
          <div className="relative flex-1 max-w-3xl flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
            <Search className="absolute left-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search offers by code..."
              className="w-full pl-10 pr-4 py-2 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[11px] font-black tracking-widest uppercase">
                {filteredPromos.length} RESULTS
              </span>
            </div>
            <span className="text-[11px] font-black tracking-widest uppercase text-indigo-600 dark:text-indigo-400 mr-2">OFFERS TRACKING</span>
          </div>
        </div>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {/* 1. Total Campaigns */}
            <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center text-base bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Ticket size={14} />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest">TOTAL PROMOS</p>
                </div>
              </div>
              <div className="flex items-end justify-between mt-2">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{promos.length}</h3>
                  </div>
                </div>
                <div className="w-24 h-10 mb-[-5px]">
                  <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,40 L10,30 L20,35 L40,10 L60,25 L80,5 L100,20" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
                    <path d="M0,40 L10,30 L20,35 L40,10 L60,25 L80,5 L100,20 L100,40 Z" fill="url(#gradient-indigo)" opacity="0.1" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 2. Active Campaigns */}
            <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center text-base bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <BarChart3 size={14} />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest">ACTIVE</p>
                </div>
              </div>
              <div className="flex items-end justify-between mt-2">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{stats.active}</h3>
                  </div>
                </div>
                <div className="w-24 h-10 mb-[-5px]">
                  <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,40 L10,35 L30,20 L50,25 L70,10 L90,15 L100,5" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                    <path d="M0,40 L10,35 L30,20 L50,25 L70,10 L90,15 L100,5 L100,40 Z" fill="url(#gradient-emerald)" opacity="0.1" />
                    <defs>
                      <linearGradient id="gradient-emerald" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            {/* 3. Total Uses */}
            <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center text-base bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Users size={14} />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest">TOTAL USES</p>
                </div>
              </div>
              <div className="flex items-end justify-between mt-2">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">
                      {promos.reduce((a, b) => a + Number(b.usage_count || 0), 0)}
                    </h3>
                  </div>
                </div>
                <div className="w-24 h-10 mb-[-5px]">
                  <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,40 L20,30 L40,35 L60,15 L80,20 L100,5" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                    <path d="M0,40 L20,30 L40,35 L60,15 L80,20 L100,5 L100,40 Z" fill="url(#gradient-amber)" opacity="0.1" />
                    <defs>
                      <linearGradient id="gradient-amber" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            {/* 4. Total Savings */}
            <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center text-base bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <IndianRupee size={14} />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest">SAVINGS</p>
                </div>
              </div>
              <div className="flex items-end justify-between mt-2">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">
                      ₹{stats.totalDiscount.toLocaleString()}
                    </h3>
                  </div>
                </div>
                <div className="w-24 h-10 mb-[-5px]">
                  <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,40 L15,25 L35,30 L55,10 L75,15 L100,0" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" />
                    <path d="M0,40 L15,25 L35,30 L55,10 L75,15 L100,0 L100,40 Z" fill="url(#gradient-purple)" opacity="0.1" />
                    <defs>
                      <linearGradient id="gradient-purple" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
            {loading ? (
              [1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-800 h-28 border border-slate-200 dark:border-slate-700 animate-pulse shadow-sm"
                />
              ))
            ) : filteredPromos.length > 0 ? (
              filteredPromos.map((promo) => {
                const isPercentage = promo.discount_type === "percentage";
                const themeBg = isPercentage ? "bg-indigo-600" : "bg-emerald-600";
                const textTheme = isPercentage ? "text-indigo-600" : "text-emerald-600";

                return (
                  <div
                    key={promo.id}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all hover:border-indigo-300 dark:hover:border-indigo-500/50 flex flex-col group/card shadow-sm"
                  >
                    <div className="p-4 flex items-start gap-4 border-b border-slate-100 dark:border-slate-700">
                      <div
                        className={`w-10 h-10 ${themeBg} flex items-center justify-center text-white shrink-0 shadow-sm`}
                      >
                        {isPercentage ? (
                          <Percent size={18} strokeWidth={3} />
                        ) : (
                          <IndianRupee size={18} strokeWidth={3} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight truncate">
                            {promo.code}
                          </h3>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {promo.is_active ? (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                            )}
                          </div>
                        </div>
                        <p
                          className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate mt-1"
                          title={promo.description}
                        >
                          {promo.description || "Campaign Offer"}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Type
                        </span>
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 capitalize truncate max-w-[90px]">
                          {promo.target_type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Uses
                        </span>
                        <span className={`text-xs font-extrabold ${textTheme}`}>
                          {promo.usage_count}{" "}
                          <span className="text-slate-400 font-medium">/ {promo.max_uses || "∞"}</span>
                        </span>
                      </div>
                      <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                          Expires
                        </span>
                        <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                          {promo.expiry_date ? dayjs(promo.expiry_date).format("DD MMM") : "Never"}
                        </span>
                      </div>
                    </div>

                    {/* Actions overlay on hover */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-2 py-1.5 border border-slate-200 dark:border-slate-700 shadow-sm z-10">
                      <button
                        onClick={() => handleOpenDrawer(promo)}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(promo.id, promo.code)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                  <Ticket size={32} />
                </div>
                <div className="text-center">
                  <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">
                    No campaigns found
                  </p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">
                    Try adjusting your filters or create a new offer.
                  </p>
                </div>
                <Button
                  type="primary"
                  onClick={() => handleOpenDrawer()}
                  className="bg-[#3b82f6] text-white font-bold mt-2 rounded-none border-none shadow-none"
                >
                  Create Offer
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor Drawer */}
      <Drawer
        rootClassName="dark-drawer"
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Ticket size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">
                {editingId ? "Edit Offer" : "Create New Offer"}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Define your discount logic
              </p>
            </div>
          </div>
        }
        width={520}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        className="custom-drawer"
        footer={
          <div className="flex gap-4 p-4">
            <Button
              variant="outlined"
              size="large"
              onClick={() => setIsDrawerOpen(false)}
              className="flex-1 rounded-xl h-12 font-bold"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              loading={isSubmitting}
              onClick={() => form.submit()}
              className="flex-1 rounded-xl h-12 font-bold bg-indigo-600 border-none shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
            >
              {editingId ? "Update Offer" : "Launch Offer"}
            </Button>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-6"
          disabled={!isAllowed}
        >
          <Form.Item
            name="code"
            label="Offer Code"
            rules={[{ required: true, message: "Code is required" }]}
          >
            <Input
              placeholder="E.g. DRIVE100"
              className="rounded-xl h-11 uppercase font-mono font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
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
                      className="w-full rounded-xl h-11 flex items-center bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
                      min={1}
                      placeholder="Enter value"
                      prefix={
                        type === "fixed" ? (
                          <span className="text-gray-400 dark:text-slate-500 dark:text-slate-400 font-medium mr-1 border-r pr-2 border-gray-200 dark:border-slate-600">
                            ₹
                          </span>
                        ) : undefined
                      }
                      suffix={
                        type === "percentage" ? (
                          <span className="text-gray-400 dark:text-slate-500 dark:text-slate-400 font-medium ml-1 border-l pl-2 border-gray-200 dark:border-slate-600">
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
                className="rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100"
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
                  className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-indigo-400 text-[10px] font-bold text-slate-500 dark:text-slate-400 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
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
                          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
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
                        className="w-full rounded-xl h-11 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600"
                        min={1}
                        placeholder="Keep 0 for no limit"
                      />
                    </Form.Item>
                  )}
                </>
              )}
            </Form.Item>
          </div>

          <div className="bg-indigo-50/30 dark:bg-indigo-500/5 p-6 rounded-2xl border border-indigo-100/30 dark:border-indigo-500/10 space-y-4">
            <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} /> Validity & Limits
            </h4>

            <Form.Item name="dates" label="Validity Period">
              <DatePicker.RangePicker className="w-full rounded-xl h-11 bg-white dark:bg-slate-800 border-indigo-100/50 dark:border-slate-600" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="max_uses" label="Total Usage Limit">
                <InputNumber
                  className="w-full rounded-xl h-11 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600"
                  placeholder="Infinite"
                  min={1}
                />
              </Form.Item>
              <Form.Item name="max_uses_per_driver" label="Limit Per Driver">
                <InputNumber
                  className="w-full rounded-xl h-11 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600"
                  min={1}
                  defaultValue={1}
                />
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
      </Drawer>

      <style>{`
        /* custom-select-compact has been moved to index.css for global dark mode support */
        .ant-form-item-label label {
          font-weight: 700 !important;
          color: #64748b !important;
          font-size: 13px !important;
        }
        .custom-switch-lg.ant-switch-checked {
          background-color: #4f46e5;
        }
      `}</style>
    </div>
  );
};

const Option = Select.Option;

export default PromotionsPage;
