import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Trash2,
  X,
  Zap,
  Users,
  Edit3,
  Power,
  TrendingUp,
  History,
  CheckCircle2,
  Crown,
  Sparkles,
  CalendarDays,
} from "lucide-react";

import axios from "../../api/axios";
import { messageApi, modalApi, notificationApi } from "../../utilities/antdStaticHolder";
import { Select, Drawer, Button, Avatar, Tag, Pagination, Dropdown } from "antd";
import type { MenuProps } from 'antd';

/* ================= TYPES ================= */

interface RechargePlan {
  id: number;
  planName: string;
  description: string;
  validityDays: any;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  features: any;
  isActive: boolean;
  tag?: string; // New field for badges
}

/* ================= UTILS ================= */

/* ================= COMPONENT ================= */

const ManagePlans: React.FC = () => {
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([]);
  const [, setLoadingActiveSubs] = useState(false);
  const [, setExpiredSubscriptions] = useState<any[]>([]);
  const [, setLoadingExpiredSubs] = useState(false);

  const [managingPlanId, setManagingPlanId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form State
  const [formData, setFormData] = useState({
    planName: "",
    description: "",
    validityDays: "",
    dailyPrice: "",
    weeklyPrice: "",
    monthlyPrice: "",
    features: [] as string[],
    isActive: true,
    tag: "",
  });


  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyPlanName, setHistoryPlanName] = useState("");





  /* ---- Fetch Plans ---- */
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/recharge-plans");

      // Dev Logging
      if (import.meta.env.DEV) {
        console.group("RECHARGE PLANS API RESPONSE");
        console.log("Full Response:", res.data);
        console.groupEnd();
      }

      // Robust extraction: Handle various nested structures
      const respData = res.data;
      let rawData = [];

      if (Array.isArray(respData)) {
        rawData = respData;
      } else if (respData.data && Array.isArray(respData.data)) {
        rawData = respData.data;
      } else if (respData.data?.data && Array.isArray(respData.data.data)) {
        rawData = respData.data.data;
      } else if (respData.plans && Array.isArray(respData.plans)) {
        rawData = respData.plans;
      } else if (respData.data?.plans && Array.isArray(respData.data.plans)) {
        rawData = respData.data.plans;
      }

      // Map database snake_case to frontend CamelCase
      const mappedPlans = rawData.map((p: any, idx: number) => ({
        id: p.id || idx + 1000, // Ensure unique ID even if DB ID is missing to prevent expansion bugs
        planName: p.plan_name || p.planName,
        description: p.description,
        validityDays: p.validity_days || p.validityDays,
        dailyPrice: Number(p.daily_price || p.dailyPrice || 0),
        weeklyPrice: Number(p.weekly_price || p.weeklyPrice || 0),
        monthlyPrice: Number(p.monthly_price || p.monthlyPrice || 0),
        features: (() => {
          const rawFeatures = p.features;
          if (Array.isArray(rawFeatures)) {
            return rawFeatures.filter((f: any) => typeof f === "string" && f.trim().length > 0);
          }
          if (typeof rawFeatures === "object" && rawFeatures !== null) {
            // Support legacy flag-based objects or entries where values are true
            return Object.entries(rawFeatures)
              .filter(([_, val]) => val === true || val === "true")
              .map(([key]) => key);
          }
          return [];
        })(),
        tag: p.tag || "",
        isActive: p.is_active !== undefined ? p.is_active : p.isActive,
      }));
      setPlans(mappedPlans);
    } catch (err) {
      console.error("Failed to fetch plans:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();

    fetchActiveSubscriptions();
    fetchExpiredSubscriptions();
  }, []);





  const fetchActiveSubscriptions = async () => {
    try {
      setLoadingActiveSubs(true);
      const res = await axios.get("/api/recharge-plans/active-subscriptions");

      // Dev Logging
      if (import.meta.env.DEV) {
        console.group("ACTIVE SUBSCRIPTIONS API RESPONSE");
        console.log("Full Response:", res.data);
        console.groupEnd();
      }

      const respData = res.data;
      let rawSubs = [];

      if (Array.isArray(respData)) {
        rawSubs = respData;
      } else if (Array.isArray(respData.data)) {
        rawSubs = respData.data;
      } else if (respData.data?.data && Array.isArray(respData.data.data)) {
        rawSubs = respData.data.data;
      } else if (respData.subscriptions && Array.isArray(respData.subscriptions)) {
        rawSubs = respData.subscriptions;
      }

      const mappedSubs = rawSubs.map((s: any) => ({
        id: s.id,
        driverName: s.driver_name || s.driverName || "N/A",
        driverPhone: s.driver_phone || s.driverPhone || "N/A",
        driverEmail: s.driver_email || s.driverEmail || "N/A",
        planName: s.plan_name || s.planName || "N/A",
        billingCycle: s.billing_cycle || s.billingCycle || "N/A",
        startDate: s.start_date || s.startDate,
        expiryDate: s.expiry_date || s.expiryDate,
        amountPaid: s.amount_paid || s.amountPaid,
        driverId: s.driver_id || s.driverId,
        vdriveId: s.vdrive_id || s.vdriveId,
        profilePicUrl: s.profile_pic_url || s.profilePicUrl || s.driverProfilePic || null,
      }));

      setActiveSubscriptions(mappedSubs);
    } catch (err) {
      console.error("Failed to fetch active subscriptions:", err);
    } finally {
      setLoadingActiveSubs(false);
    }
  };

  const fetchExpiredSubscriptions = async () => {
    try {
      setLoadingExpiredSubs(true);
      const res = await axios.get("/api/recharge-plans/expired-subscriptions");

      const respData = res.data;
      let rawSubs = [];

      if (Array.isArray(respData)) {
        rawSubs = respData;
      } else if (Array.isArray(respData.data)) {
        rawSubs = respData.data;
      } else if (respData.data?.data && Array.isArray(respData.data.data)) {
        rawSubs = respData.data.data;
      } else if (respData.subscriptions && Array.isArray(respData.subscriptions)) {
        rawSubs = respData.subscriptions;
      }

      const mappedSubs = rawSubs.map((s: any) => ({
        id: s.id,
        driverName: s.driver_name || s.driverName || "N/A",
        driverPhone: s.driver_phone || s.driverPhone || "N/A",
        driverEmail: s.driver_email || s.driverEmail || "N/A",
        planName: s.plan_name || s.planName || "N/A",
        billingCycle: s.billing_cycle || s.billingCycle || "N/A",
        startDate: s.start_date || s.startDate,
        expiryDate: s.expiry_date || s.expiryDate,
        amountPaid: s.amount_paid || s.amountPaid,
        driverId: s.driver_id || s.driverId,
        vdriveId: s.vdrive_id || s.vdriveId,
        profilePicUrl: s.profile_pic_url || s.profilePicUrl || s.driverProfilePic || null,
        status: s.status || "expired", // default to expired for UI handling
      }));

      setExpiredSubscriptions(mappedSubs);
    } catch (err) {
      console.error("Failed to fetch expired subscriptions:", err);
    } finally {
      setLoadingExpiredSubs(false);
    }
  };

  const formatFeatureLabel = (key: string) => {
    // If it already looks like a sentence, leave it
    if (key.includes(" ")) return key;

    // Mapping for common technical keys
    const mapping: Record<string, string> = {
      zero_commission: "Zero Commission",
      oneway_enabled: "One-Way Trips",
      outstation_enabled: "Outstation Trips",
      priority_matching: "Priority Matching",
      instant_requests: "Instant Requests",
      no_surge_pricing: "No Surge Pricing",
      premium_driver_rank: "Premium Driver Rank",
      scheduled_rides: "Scheduled Rides",
    };

    if (mapping[key]) return mapping[key];

    // Fallback: replace underscores/hyphens and capitalize
    return key.replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  /* ---- Handlers ---- */
  const handleOpenModal = (plan?: RechargePlan) => {
    if (plan) {
      setEditingId(plan.id);

      setFormData({
        planName: plan.planName,
        description: plan.description || "",
        validityDays: plan.validityDays?.toString() || "",
        dailyPrice: plan.dailyPrice.toString(),
        weeklyPrice: plan.weeklyPrice.toString(),
        monthlyPrice: plan.monthlyPrice.toString(),
        features: Array.isArray(plan.features)
          ? plan.features.map((f) => formatFeatureLabel(f))
          : [],
        isActive: plan.isActive,
        tag: plan.tag || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        planName: "",
        description: "",
        validityDays: "",
        dailyPrice: "",
        weeklyPrice: "",
        monthlyPrice: "",
        features: [],
        isActive: true,
        tag: "",
      });
    }
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.planName.trim()) newErrors.planName = "Plan name is required";
    if (!formData.validityDays || Number(formData.validityDays) <= 0)
      newErrors.validityDays = "Validity must be greater than 0";
    if (!formData.dailyPrice || Number(formData.dailyPrice) < 0)
      newErrors.dailyPrice = "Price cannot be negative";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      messageApi.error("Please correct the errors in the form.");
      return;
    }

    const action = editingId ? "update" : "create";

    modalApi.confirm({
      title: editingId ? "Confirm Plan Update" : "Confirm New Plan",
      content: `Are you sure you want to ${action} this plan configuration?`,
      okText: editingId ? "Update Plan" : "Create Plan",
      cancelText: "Cancel",
      centered: true,
      onOk: async () => {
        try {
          setIsSubmitting(true);
          const payload = {
            planName: formData.planName,
            description: formData.description,
            validityDays: Number(formData.validityDays),
            dailyPrice: Number(formData.dailyPrice),
            weeklyPrice: Number(formData.weeklyPrice),
            monthlyPrice: Number(formData.monthlyPrice),
            features: formData.features.filter((f) => f.trim()),
            isActive: formData.isActive,
            tag: formData.tag,
          };

          if (editingId) {
            await axios.patch(`/api/recharge-plans/update/${editingId}`, payload);
            notificationApi.success({
              message: "Plan Updated",
              description: `"${formData.planName}" has been successfully updated.`,
              placement: "topRight",
            });
          } else {
            await axios.post("/api/recharge-plans/create", payload);
            notificationApi.success({
              message: "Plan Created",
              description: `"${formData.planName}" has been successfully created.`,
              placement: "topRight",
            });
          }
          setIsModalOpen(false);
          fetchPlans();
        } catch (err: any) {
          console.error("Failed to save plan:", err);
          messageApi.error(
            err?.response?.data?.message || "Failed to save plan. Please check all fields.",
          );
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };


  const handleDelete = async (id: number) => {
    const plan = plans.find((p) => p.id === id);
    modalApi.confirm({
      title: "Delete Plan?",
      content: `Are you sure you want to delete "${plan?.planName}"? This action cannot be undone.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          await axios.delete(`/api/recharge-plans/delete/${id}`);
          messageApi.success("Plan deleted successfully");
          fetchPlans();
        } catch (err) {
          console.error("Failed to delete plan:", err);
          messageApi.error("Failed to delete plan");
        }
      },
    });
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await axios.patch(`/api/recharge-plans/status/${id}`, { isActive: !currentStatus });
      messageApi.success(`Plan ${!currentStatus ? "activated" : "deactivated"} successfully`);
      fetchPlans();
    } catch (err) {
      console.error("Failed to update status:", err);
      messageApi.error("Failed to update status");
    }
  };

  const fetchPlanHistory = async (id: number, name: string) => {
    try {
      setHistoryLoading(true);
      setHistoryPlanName(name);
      setIsHistoryOpen(true);
      const res = await axios.get(`/api/recharge-plans/history/${id}`);
      setHistoryData(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      messageApi.error("Failed to fetch plan history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredPlans = plans.filter((p) => {
    const matchesSearch = p.planName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.isActive) ||
      (statusFilter === "inactive" && !p.isActive);
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const displayedPlans = filteredPlans.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#f8f9fa] dark:bg-[#0b0f19] overflow-hidden">
      {/* Top Navbar */}
      <div className="bg-white dark:bg-slate-800 h-12 px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 z-0 flex-shrink-0">
        {/* Title & Description */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Zap size={16} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 !m-0 !mb-1 leading-none">Recharge Plans</h1>
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0">Manage Plans</p>
        </div>

        <div className="relative flex-1 max-w-xl mx-auto flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all h-9">
          <Search className="absolute left-3 text-slate-400 text-[16px]" />
          <input
            type="text"
            placeholder="Search plans..."
            className="w-full pl-10 pr-4 py-1.5 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400 border-none shadow-none focus:ring-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {filteredPlans.length} results
          </span>

          <Button
            type="primary"
            icon={<Plus className="text-lg" />}
            onClick={() => handleOpenModal()}
            className="px-4 h-10 rounded-lg font-bold text-xs uppercase tracking-wider border-none !bg-blue-600 hover:!bg-blue-700 text-white shadow-sm flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-all"
          >
            Create Plan
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-[220px] flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
            {/* Sidenav views section */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase px-2 mb-0.5">
                Views
              </span>

              <div
                onClick={() => setStatusFilter("all")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${statusFilter === "all"
                  ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <Zap size={14} />
                  <span>All</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusFilter === "all"
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {plans.length}
                </span>
              </div>

              <div
                onClick={() => setStatusFilter("active")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${statusFilter === "active"
                  ? "bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Active</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusFilter === "active"
                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {plans.filter(p => p.isActive).length}
                </span>
              </div>

              <div
                onClick={() => setStatusFilter("inactive")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${statusFilter === "inactive"
                  ? "bg-amber-50/80 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <Power size={14} className="text-rose-500" />
                  <span>Inactive</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusFilter === "inactive"
                  ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {plans.filter(p => !p.isActive).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right Content Area ─────────────────────────────────────── */}
        <div className="flex-grow flex flex-col min-w-0 relative h-full">
          <div className="flex-grow flex flex-col p-3 overflow-y-auto custom-scrollbar gap-2 pb-20">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-0">
              {/* 1. Total Plans */}
              <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 flex items-center justify-center text-base bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 z-10 rounded-lg`}>
                      <Zap size={14} />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest z-10">
                      TOTAL PLANS
                    </p>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2 z-10">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">
                        {plans.length}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider uppercase">
                        PLANS
                      </span>
                    </div>
                  </div>
                  {/* Background Icon */}
                  <div className={`absolute -bottom-4 -right-4 text-[100px] opacity-[0.04] pointer-events-none text-indigo-600 dark:text-indigo-400`}>
                    <Zap size={100} />
                  </div>
                </div>
              </div>

              {/* 2. Active Plans */}
              <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 flex items-center justify-center text-base bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 z-10 rounded-lg`}>
                      <CheckCircle2 size={14} />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest z-10">
                      ACTIVE PLANS
                    </p>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2 z-10">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">
                        {plans.filter(p => p.isActive).length}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider uppercase">
                        LIVE
                      </span>
                    </div>
                  </div>
                  {/* Background Icon */}
                  <div className={`absolute -bottom-4 -right-4 text-[100px] opacity-[0.04] pointer-events-none text-amber-600 dark:text-amber-400`}>
                    <CheckCircle2 size={100} />
                  </div>
                </div>
              </div>

              {/* 3. Inactive Plans */}
              <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 flex items-center justify-center text-base bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 z-10 rounded-lg`}>
                      <Power size={14} />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest z-10">
                      INACTIVE PLANS
                    </p>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2 z-10">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">
                        {plans.filter(p => !p.isActive).length}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider uppercase">
                        DISABLED
                      </span>
                    </div>
                  </div>
                  {/* Background Icon */}
                  <div className={`absolute -bottom-4 -right-4 text-[100px] opacity-[0.04] pointer-events-none text-amber-500 dark:text-amber-400`}>
                    <Power size={100} />
                  </div>
                </div>
              </div>

              {/* 4. Total Subs */}
              <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 flex items-center justify-center text-base bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 z-10 rounded-lg`}>
                      <Users size={14} />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest z-10">
                      TOTAL SUBS
                    </p>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2 z-10">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">
                        {activeSubscriptions.length}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider uppercase">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                  {/* Background Icon */}
                  <div className={`absolute -bottom-4 -right-4 text-[100px] opacity-[0.04] pointer-events-none text-rose-600 dark:text-rose-400`}>
                    <Users size={100} />
                  </div>
                </div>
              </div>
            </div>

            {/* FILTERS TOOLBAR */}
            <div className="bg-white dark:bg-slate-800 py-1 px-3 rounded-sm border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4 shadow-sm flex-shrink-0 mb-1">
              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">
                  Created Date:
                </span>
                <div className="flex items-center bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 h-8 flex-1">
                  <input type="text" placeholder="Start" className="w-20 bg-transparent text-xs outline-none text-slate-600 dark:text-slate-300" disabled />
                  <span className="text-slate-400 mx-2">→</span>
                  <input type="text" placeholder="End" className="w-20 bg-transparent text-xs outline-none text-slate-600 dark:text-slate-300" disabled />
                  <CalendarDays size={14} className="text-slate-400 ml-auto" />
                </div>
              </div>
            </div>

            {/* List View Container */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden rounded-none">
              {/* List Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-700/50">
                <div className="col-span-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">PLAN NAME</div>
                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">VALIDITY</div>
                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">PRICING</div>
                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">STATUS</div>
                <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">SUBSCRIBERS</div>
                <div className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">ACTIONS</div>
              </div>

              {/* List Body */}
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {loading ? (
                  <div className="p-8 text-center text-slate-400">Loading templates...</div>
                ) : displayedPlans.length > 0 ? (
                  displayedPlans.map((plan) => {
                    return (
                      <div key={plan.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                        {/* Name & Desc */}
                        <div className="col-span-3 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0 mt-0.5">
                            <Zap size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{plan.planName}</h4>
                              {plan.tag && <span className="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 text-[10px] font-bold px-1.5 py-0.5 rounded">{plan.tag}</span>}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5" title={plan.description}>{plan.description}</p>
                          </div>
                        </div>

                        {/* Validity */}
                        <div className="col-span-2 flex items-center">
                          <div className="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                            {plan.validityDays} DAYS
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="col-span-2 flex flex-col gap-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">₹{plan.monthlyPrice} <span className="text-[10px] text-slate-400 font-normal">/ mo</span></span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">₹{plan.dailyPrice}/d • ₹{plan.weeklyPrice}/w</span>
                        </div>

                        {/* Status */}
                        <div className="col-span-2 flex flex-col justify-center">
                          {plan.isActive ? (
                            <div className="flex items-center gap-1.5 text-amber-500">
                              <CheckCircle2 size={12} />
                              <span className="text-[10px] font-black uppercase tracking-wider">ACTIVE</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-rose-500">
                              <Power size={12} />
                              <span className="text-[10px] font-black uppercase tracking-wider">INACTIVE</span>
                            </div>
                          )}
                        </div>

                        {/* Subscribers */}
                        <div className="col-span-1 flex justify-center">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded">
                            {activeSubscriptions.filter(s => s.planName?.toLowerCase() === plan.planName?.toLowerCase()).length}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 flex items-center justify-end gap-3">
                          <Dropdown
                            menu={{
                              items: [
                                {
                                  key: 'edit',
                                  label: (
                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                      <Edit3 size={14} /> Edit
                                    </div>
                                  ),
                                  onClick: () => handleOpenModal(plan),
                                },
                                {
                                  key: 'status',
                                  label: (
                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                      <Power size={14} /> {plan.isActive ? "Deactivate" : "Activate"}
                                    </div>
                                  ),
                                  onClick: () => toggleStatus(plan.id, plan.isActive),
                                },
                                {
                                  key: 'delete',
                                  label: (
                                    <div className="flex items-center gap-2 text-xs font-semibold text-rose-600">
                                      <Trash2 size={14} /> Delete
                                    </div>
                                  ),
                                  onClick: () => handleDelete(plan.id),
                                },
                              ]
                            }}
                            trigger={['click']}
                            placement="bottomRight"
                          >
                            <button className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>
                            </button>
                          </Dropdown>
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search size={24} className="text-slate-300" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">No plans found</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Try adjusting your filters or search term.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Pagination Footer */}
            <div className="absolute bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-805 px-6 flex items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                Showing {filteredPlans.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
                {Math.min(currentPage * pageSize, filteredPlans.length)} of {filteredPlans.length} plans
              </span>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredPlans.length}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                showSizeChanger
                pageSizeOptions={[10, 15, 20, 50, 100]}
                size="small"
              />
            </div>

          </div>
        </div>
      </div>



      <Drawer
        rootClassName="dark-drawer"
        title={
          <div className="flex flex-col">
            <div className="flex justify-between items-center mr-8">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {editingId ? "Edit Plan" : "Create Plan"}
              </span>
              {!editingId && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFormData({
                        ...formData,
                        planName: "Basic Plan",
                        description: "Entry-level plan for local operation.",
                        features: [
                          "Zero commission on local rides",
                          "Instant requests",
                          "Basic support",
                        ],
                      });
                    }}
                    className="text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    Basic
                  </button>
                  <button
                    onClick={() => {
                      setFormData({
                        ...formData,
                        planName: "Elite Plan",
                        description: "Advanced plan for higher earnings.",
                        features: [
                          "Zero commission on all rides",
                          "Outstation trips",
                          "Priority matching",
                        ],
                      });
                    }}
                    className="text-[10px] font-bold px-2 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 rounded text-indigo-600 dark:text-indigo-400 transition-colors"
                  >
                    Elite
                  </button>
                </div>
              )}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
              Configure pricing, validity, and features
            </span>
          </div>
        }
        placement="right"
        width={520}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
        closeIcon={<X size={20} className="text-slate-400" />}
        styles={{
          header: { borderBottom: "1px solid #f1f5f9", padding: "24px" },
          body: { padding: "24px" },
          footer: { borderTop: "1px solid #f1f5f9", padding: "24px" },
        }}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              disabled={isSubmitting}
              onClick={() => setIsModalOpen(false)}
              className="px-6 h-10 rounded-lg border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold"
            >
              Cancel
            </Button>
            <Button
              loading={isSubmitting}
              type="primary"
              onClick={() => handleSubmit()}
              className="px-8 h-10 rounded-lg font-semibold"
            >
              {editingId ? "Save Changes" : "Create Plan"}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Plan Name, Status & Tag */}
          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-3 space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Plan Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-900 dark:text-slate-100 shadow-sm"
                placeholder="e.g. Starter"
                value={formData.planName}
                onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Badge Tag
              </label>
              <Select
                className="w-full h-[42px]"
                value={formData.tag || ""}
                onChange={(val) => setFormData({ ...formData, tag: val })}
                options={[
                  { value: "", label: "No Badge" },
                  { value: "MOST POPULAR", label: "Most Popular" },
                  { value: "BEST VALUE", label: "Best Value" },
                  { value: "RECOMMENDED", label: "Recommended" },
                  { value: "LIMITED OFFER", label: "Limited Offer" },
                  { value: "PREMIUM CHOICE", label: "Premium Choice" },
                  { value: "ESSENTIAL", label: "Essential" },
                  { value: "PRO", label: "Pro" },
                ]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Status
              </label>
              <Select
                className="w-full h-[42px]"
                value={formData.isActive ? "active" : "inactive"}
                onChange={(val) => setFormData({ ...formData, isActive: val === "active" })}
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Description
            </label>
            <textarea
              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-600 dark:text-slate-300 shadow-sm min-h-[80px]"
              placeholder="Briefly describe the plan benefits..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Validity */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Validity (Days)
            </label>
            <input
              type="number"
              className={`w-full px-4 py-2.5 bg-white dark:bg-slate-800 border ${errors.validityDays ? "border-rose-400 focus:ring-rose-500/10" : "border-slate-200 dark:border-slate-600 focus:ring-indigo-500/10"} rounded-lg focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all font-bold text-slate-900 dark:text-slate-100 shadow-sm`}
              value={formData.validityDays}
              onChange={(e) => {
                setFormData({ ...formData, validityDays: e.target.value });
                if (errors.validityDays) setErrors({ ...errors, validityDays: "" });
              }}
            />
            {errors.validityDays && (
              <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.validityDays}</p>
            )}
          </div>

          {/* Pricing Row */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pricing (₹)
            </label>
            <div className="grid grid-cols-3 gap-2 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 block ml-1 uppercase">
                  Daily
                </span>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                  value={formData.dailyPrice}
                  onChange={(e) => setFormData({ ...formData, dailyPrice: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 block ml-1 uppercase">
                  Weekly
                </span>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                  value={formData.weeklyPrice}
                  onChange={(e) => setFormData({ ...formData, weeklyPrice: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 block ml-1 uppercase">
                  Monthly
                </span>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                  value={formData.monthlyPrice}
                  onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Plan Features
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, features: [...formData.features, ""] })}
                  className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1"
                >
                  <Plus size={10} /> Add Feature
                </button>
              </div>
            </div>

            <div className="bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                Quick Suggestions
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  "Unlimited Ride Requests",
                  "Keep 100% of Earnings",
                  "Local Rides Enabled",
                  "Scheduled Rides Enabled",
                  "One-Way Trips",
                  "Round Trips Enabled",
                  "Outstation Booking Access",
                  "Premium Rider Match",
                  "Airport Pickups Enabled",
                  "Zero Hidden Fees",
                  "Zero Cancellation Penalty",
                  "Direct Customer Payments",
                  "Priority 24/7 Helpline",
                  "Advanced Area Heatmap",
                  "Top Rated Driver Badge",
                  "Auto-Accept Next Ride",
                  "Instant Withdrawal",
                  "Flexible Working Hours",
                ].map((sug) => {
                  const isAdded = formData.features.includes(sug);
                  return (
                    <Tag.CheckableTag
                      key={sug}
                      checked={isAdded}
                      onChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, features: [...formData.features, sug] });
                        } else {
                          setFormData({
                            ...formData,
                            features: formData.features.filter((f) => f !== sug),
                          });
                        }
                      }}
                      className={`px-3 py-1 rounded-full border transition-all ${isAdded ? "bg-indigo-600 border-indigo-600" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600"}`}
                    >
                      {sug}
                    </Tag.CheckableTag>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {formData.features.map((feature: string, idx: number) => (
                <div
                  key={idx}
                  className="flex gap-2 group animate-in slide-in-from-right-2 duration-200"
                >
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
                    placeholder="e.g. Priority Support"
                    value={feature}
                    onChange={(e) => {
                      const newFeatures = [...formData.features];
                      newFeatures[idx] = e.target.value;
                      setFormData({ ...formData, features: newFeatures });
                    }}
                  />
                  <button
                    onClick={() => {
                      const newFeatures = formData.features.filter((_, i) => i !== idx);
                      setFormData({ ...formData, features: newFeatures });
                    }}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {formData.features.length === 0 && (
                <p className="text-[11px] text-slate-400 italic text-center py-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-600">
                  No features added yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Version History Drawer */}
      <Drawer
        rootClassName="dark-drawer"
        title={
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <History size={18} className="text-indigo-600 drop-shadow-sm" />
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Plan History
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">
              {historyPlanName}
            </span>
          </div>
        }
        placement="right"
        width={480}
        onClose={() => setIsHistoryOpen(false)}
        open={isHistoryOpen}
        closeIcon={<X size={20} className="text-slate-400 hover:text-rose-500 transition-colors" />}
        styles={{
          header: {
            borderBottom: "1px solid #f1f5f9",
            padding: "24px" /* backgroundColor: '#ffffff' removed for dark mode compat */,
          },
          body: { padding: "24px" /* backgroundColor: '#ffffff' removed for dark mode compat */ },
        }}
        className="history-drawer"
      >
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-[2px] before:bg-slate-100">
          {historyLoading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-slate-50 dark:bg-slate-800/50 p-4 h-24 ml-8 border border-slate-100 dark:border-slate-700 rounded-xl"
              />
            ))
          ) : historyData.length > 0 ? (
            historyData.map((item, idx) => (
              <div
                key={item.id}
                className="relative pl-8 group animate-in slide-in-from-right-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                {/* Connector Dot */}
                <div className="absolute left-[7px] top-1.5 h-2.5 w-2.5 rounded-full border-[2px] border-indigo-500 bg-white dark:bg-slate-800 z-10 shadow-sm" />

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-1.5">
                        <Avatar
                          size={20}
                          className="bg-slate-100 text-slate-600 dark:text-slate-300 text-[10px] font-bold"
                        >
                          {(item.admin_name || "A")[0].toUpperCase()}
                        </Avatar>
                        {item.admin_name || "Admin"}
                      </span>
                      <span className="text-slate-300">•</span>
                      <Tag
                        color={
                          item.action === "CREATE"
                            ? "blue"
                            : item.action === "UPDATE"
                              ? "orange"
                              : "purple"
                        }
                        className="m-0 text-[10px] uppercase font-bold border-0 px-2 py-0.5 rounded-md"
                      >
                        {item.action === "TOGGLE_STATUS" ? "STATUS CHANGE" : item.action}
                      </Tag>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400/80 tabular-nums">
                      {new Date(item.created_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>

                  {item.action === "UPDATE" && item.previous_data && item.new_data && (
                    <div className="flex flex-col gap-2 mt-1">
                      {Object.keys(item.new_data || {}).map((field) => {
                        if (["updated_at", "created_at", "id"].includes(field)) return null;

                        const oldVal = item.previous_data ? item.previous_data[field] : undefined;
                        const newVal = item.new_data[field];

                        if (
                          oldVal !== undefined &&
                          JSON.stringify(oldVal) !== JSON.stringify(newVal)
                        ) {
                          const formatValue = (val: any) => {
                            if (val === null || val === undefined) return "None";
                            if (typeof val === "boolean") return val ? "Active" : "Inactive";
                            if (Array.isArray(val)) return val.join(", ");
                            if (typeof val === "object") return JSON.stringify(val);
                            return String(val);
                          };

                          return (
                            <div key={field} className="flex items-start gap-2 w-full">
                              <span className="text-[10px] font-bold text-slate-400 w-28 shrink-0 uppercase tracking-wider pt-0.5">
                                {field.replace(/_/g, " ")}:
                              </span>
                              <div className="flex items-start gap-2 text-[11px] font-medium text-slate-700 dark:text-slate-300 flex-1">
                                <span className="line-through text-slate-400 break-words max-w-[120px]">
                                  {formatValue(oldVal)}
                                </span>
                                <span className="text-slate-300 mt-0.5">→</span>
                                <span
                                  className={
                                    typeof newVal === "boolean"
                                      ? newVal
                                        ? "text-emerald-600 font-semibold"
                                        : "text-rose-600 font-semibold"
                                      : "text-indigo-600 font-bold break-words max-w-[120px]"
                                  }
                                >
                                  {formatValue(newVal)}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  )}

                  {item.action === "CREATE" && (
                    <div className="mt-1">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Plan initialized with base configuration and live status.
                      </p>
                    </div>
                  )}

                  {item.action === "TOGGLE_STATUS" && (
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium w-28 shrink-0">
                        Status change:
                      </span>
                      <span
                        className={
                          item.new_data.is_active
                            ? "text-emerald-600 font-semibold"
                            : "text-rose-600 font-semibold"
                        }
                      >
                        {item.new_data.is_active ? "Activated" : "Deactivated"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-24 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-600 ml-10 shadow-inner">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <History size={32} className="text-slate-200" />
              </div>
              <p className="text-slate-400 text-sm font-bold tracking-tight">
                No history records found
              </p>
              <p className="text-slate-300 text-[11px] mt-1">
                Audit logs will appear as soon as changes are made.
              </p>
            </div>
          )}
        </div>
      </Drawer>



      {/* Plan Management Detail Drawer */}
      <Drawer
        rootClassName="dark-drawer plan-management-drawer"
        placement="right"
        width={480}
        onClose={() => setManagingPlanId(null)}
        open={managingPlanId !== null}
        closable={false}
        title={null}
        styles={{ body: { padding: 0 } }}
      >
        {managingPlanId &&
          plans.find((p) => p.id === managingPlanId) &&
          (() => {
            const plan = plans.find((p) => p.id === managingPlanId)!;
            const activeSubCount = activeSubscriptions.filter(
              (s) => s.planName?.toLowerCase() === plan.planName?.toLowerCase(),
            ).length;

            let themeConfig = {
              color: "#0ea5e9",
              bg: "bg-sky-500",
              shadow: "shadow-sky-500/20",
              from: "from-sky-500",
              to: "to-blue-600",
              Icon: Zap,
            };
            const planNameLower = plan.planName?.toLowerCase() || "";
            if (planNameLower.includes("elite")) {
              themeConfig = {
                color: "#a855f7",
                bg: "bg-purple-500",
                shadow: "shadow-purple-500/20",
                from: "from-purple-500",
                to: "to-indigo-600",
                Icon: Sparkles,
              };
            } else if (planNameLower.includes("premium")) {
              themeConfig = {
                color: "#f59e0b",
                bg: "bg-amber-500",
                shadow: "shadow-amber-500/20",
                from: "from-amber-500",
                to: "to-orange-600",
                Icon: Crown,
              };
            }

            return (
              <div className="flex flex-col h-full bg-white dark:bg-[#0b0f19]">
                {/* Header section with gradient */}
                <div
                  className={`relative p-8 pb-12 bg-gradient-to-br ${themeConfig.from} ${themeConfig.to} text-white overflow-hidden shrink-0`}
                >
                  {/* Custom Close Button */}
                  <button
                    onClick={() => setManagingPlanId(null)}
                    className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/10 hover:bg-black/20 text-white backdrop-blur-sm transition-all"
                  >
                    <X size={20} />
                  </button>
                  <div className="absolute -top-10 -right-10 p-4 opacity-10">
                    <themeConfig.Icon size={200} />
                  </div>
                  <div className="relative z-10 flex items-start justify-between mb-6 pt-4">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl`}
                    >
                      <themeConfig.Icon size={28} className="text-white drop-shadow-md" />
                    </div>
                    <div className="flex flex-col items-end gap-2 pr-8">
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black tracking-widest uppercase border border-white/20 shadow-sm">
                        {plan.isActive ? "Active Plan" : "Inactive Plan"}
                      </span>
                      {plan.tag && (
                        <span className="px-3 py-1 bg-black/30 backdrop-blur-md text-amber-300 rounded-full text-[10px] font-black tracking-widest uppercase border border-amber-300/30 shadow-sm">
                          {plan.tag}
                        </span>
                      )}
                    </div>
                  </div>
                  <h2 className="relative z-10 text-3xl font-black tracking-tight mb-2 drop-shadow-md">
                    {plan.planName}
                  </h2>
                  <p className="relative z-10 text-white/90 text-sm font-medium leading-relaxed max-w-[85%]">
                    {plan.description ||
                      "Comprehensive subscription plan for drivers to access premium features and earn more."}
                  </p>
                </div>

                {/* Statistics Strip */}
                <div className="relative z-20 px-6 -mt-8 shrink-0">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-xl flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Active Subs
                      </span>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">
                          {activeSubCount}
                        </span>
                        <span className="text-[10px] text-emerald-500 font-bold mb-1 flex items-center gap-0.5">
                          <TrendingUp size={10} /> +12%
                        </span>
                      </div>
                    </div>
                    <div className="w-px h-10 bg-slate-100 dark:bg-slate-700"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Est. Revenue
                      </span>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-slate-100 leading-none">
                          ₹{(activeSubCount * plan.monthlyPrice).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold mb-1">/mo</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-10">
                  {/* Pricing Grid */}
                  <div>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Zap size={14} /> Pricing Tiers
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                          Daily
                        </span>
                        <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                          ₹{plan.dailyPrice}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                          Weekly
                        </span>
                        <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                          ₹{plan.weeklyPrice}
                        </span>
                      </div>
                      <div
                        className={`p-4 rounded-xl border flex flex-col items-center bg-gradient-to-br ${themeConfig.from} ${themeConfig.to} text-white shadow-lg`}
                      >
                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-2">
                          Monthly
                        </span>
                        <span className="text-xl font-black text-white drop-shadow-md">
                          ₹{plan.monthlyPrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Zap size={14} /> Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setManagingPlanId(null);
                          handleOpenModal(plan);
                        }}
                        className="flex items-center justify-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl font-bold text-xs transition-colors"
                      >
                        <Edit3 size={16} /> Edit Plan Details
                      </button>
                      <button
                        onClick={() => {
                          toggleStatus(plan.id, plan.isActive);
                        }}
                        className={`flex items-center justify-center gap-2 p-3 ${plan.isActive ? "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20"} rounded-xl font-bold text-xs transition-colors`}
                      >
                        <Power size={16} /> {plan.isActive ? "Deactivate Plan" : "Activate Plan"}
                      </button>
                      <button
                        onClick={() => {
                          setManagingPlanId(null);
                          fetchPlanHistory(plan.id, plan.planName);
                        }}
                        className="flex items-center justify-center gap-2 p-3 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl font-bold text-xs transition-colors"
                      >
                        <History size={16} /> View History
                      </button>
                      <button
                        onClick={() => {
                          setManagingPlanId(null);
                          handleDelete(plan.id);
                        }}
                        className="flex items-center justify-center gap-2 p-3 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20 rounded-xl font-bold text-xs transition-colors"
                      >
                        <Trash2 size={16} /> Delete Plan
                      </button>
                    </div>
                  </div>

                  {/* Features List */}
                  <div>
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Zap size={14} /> Included Features
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-100 dark:border-slate-700 space-y-4">
                      {plan.features.map((feat: string, i: number) => {
                        const isNegative =
                          feat.toLowerCase().startsWith("no ") ||
                          feat.toLowerCase().includes("not included") ||
                          feat.toLowerCase() === "local bookings only";
                        return (
                          <div key={i} className="flex items-center gap-3">
                            {isNegative ? (
                              <div className="shrink-0 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-rose-200 flex items-center justify-center text-rose-500 shadow-sm">
                                <X size={12} strokeWidth={3} />
                              </div>
                            ) : (
                              <div className="shrink-0 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-emerald-200 flex items-center justify-center text-emerald-500 shadow-sm">
                                <CheckCircle2 size={12} strokeWidth={3} />
                              </div>
                            )}
                            <span
                              className={`text-[13px] font-bold ${isNegative ? "text-slate-400 line-through" : "text-slate-700 dark:text-slate-300"}`}
                            >
                              {feat}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
      </Drawer>

      <style>{`
        .history-drawer .ant-drawer-content-wrapper {
          border-radius: 32px 0 0 32px !important;
          overflow: hidden !important;
        }
        .custom-card-checkbox .ant-checkbox-inner {
          border-radius: 6px !important;
          border-color: #e2e8f0 !important;
        }
        .custom-card-checkbox .ant-checkbox-checked .ant-checkbox-inner {
          background-color: #4f46e5 !important;
          border-color: #4f46e5 !important;
        }
        .custom-card-checkbox-circle .ant-checkbox-inner {
          border-radius: 50% !important;
          border-color: #d1d5db !important;
          width: 18px !important;
          height: 18px !important;
        }
        .custom-card-checkbox-circle .ant-checkbox-checked .ant-checkbox-inner {
          background-color: transparent !important;
          border-color: #4f46e5 !important;
        }
        .custom-card-checkbox-circle .ant-checkbox-checked .ant-checkbox-inner::after {
          border-color: #4f46e5 !important;
          width: 5px !important;
          height: 9px !important;
        }
      `}</style>
    </div>
  );
};

export default ManagePlans;