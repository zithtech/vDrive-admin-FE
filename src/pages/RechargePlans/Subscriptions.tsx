import React, { useState, useEffect, lazy, Suspense } from "react";
import {
  Plus,
  Search,
  Trash2,
  X,
  Zap,
  ChevronDown,
  Users,
  Edit3,
  Power,
  Flame,
  TrendingUp,
  History,
  CheckCircle2,
  Crown,
  Sparkles,
  BellRing,
  Calendar,
  CalendarDays,
  CalendarRange,
  Activity,
  Eye,
  Mail,
  Phone,
  CreditCard,
} from "lucide-react";
import SubscriptionDrawer from "../../components/RechargePlan/SubscriptionDrawer";
import axios from "../../api/axios";
import { messageApi, modalApi, notificationApi } from "../../utilities/antdStaticHolder";
import { Checkbox, Select, Drawer, Button, Avatar, Tag, Spin } from "antd";
import { getMediaUrl } from "../../components/DriverDetails/DriverDetails";
import PaymentHistory from "../PaymentHistory";

const PromotionsTab = lazy(() => import("../Promotions"));

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

const Subscriptions: React.FC = () => {
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"plans" | "subscriptions" | "promotions" | "payments">(
    "plans",
  );
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([]);
  const [loadingActiveSubs, setLoadingActiveSubs] = useState(false);
  const [expiredSubscriptions, setExpiredSubscriptions] = useState<any[]>([]);
  const [loadingExpiredSubs, setLoadingExpiredSubs] = useState(false);
  const [subscriptionTab, setSubscriptionTab] = useState<"ACTIVE" | "EXPIRED">("ACTIVE");
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

  const [subSearchTerm, setSubSearchTerm] = useState<string>("");
  const [subFilter, setSubFilter] = useState<string>("ALL");
  const [billingCycleFilter, setBillingCycleFilter] = useState<string>("ALL");
  const [remainingDaysFilter, setRemainingDaysFilter] = useState<string>("");
  const [selectedPlanIds, setSelectedPlanIds] = useState<number[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyPlanName, setHistoryPlanName] = useState("");

  const [subStats, setSubStats] = useState<any>(null);
  const [isDriverHistoryOpen, setIsDriverHistoryOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [notifyingSubscribers, setNotifyingSubscribers] = useState(false);

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
    fetchSubscriptionStats();
    fetchActiveSubscriptions();
    fetchExpiredSubscriptions();
  }, []);

  const fetchSubscriptionStats = async () => {
    try {
      const res = await axios.get("/api/recharge-plans/stats");
      setSubStats(res.data.data);
    } catch (err) {
      console.error("Failed to fetch subscription stats:", err);
    }
  };

  const handleNotifyExpiring = async () => {
    try {
      setNotifyingSubscribers(true);
      const url =
        subscriptionTab === "ACTIVE"
          ? "/api/recharge-plans/notify-expiring"
          : "/api/recharge-plans/notify-all-expired";

      const res = await axios.post(url);

      const data = res.data.data;
      if (data.sentCount > 0) {
        const total = subscriptionTab === "ACTIVE" ? data.totalActive : data.totalExpired;
        if (data.sentCount < total) {
          messageApi.warning(
            `Partially successful: Notified ${data.sentCount} out of ${total} ${subscriptionTab === "ACTIVE" ? "active" : "expired"} drivers. Some failed.`,
          );
        } else {
          messageApi.success(
            `Successfully notified all ${data.sentCount} ${subscriptionTab === "ACTIVE" ? "active" : "expired"} drivers!`,
          );
        }
      } else if (
        (subscriptionTab === "ACTIVE" && data.totalActive > 0) ||
        (subscriptionTab === "EXPIRED" && data.totalExpired > 0)
      ) {
        messageApi.error(
          `Found ${subscriptionTab === "ACTIVE" ? data.totalActive : data.totalExpired} drivers, but failed to send notifications. Notification service may be down.`,
        );
      } else {
        messageApi.info(
          `No ${subscriptionTab === "ACTIVE" ? "expiring" : "expired"} subscriptions found to notify.`,
        );
      }
    } catch (err) {
      console.error("Failed to send notifications:", err);
      messageApi.error(
        `Failed to send ${subscriptionTab === "ACTIVE" ? "expiry" : "expired"} notifications`,
      );
    } finally {
      setNotifyingSubscribers(false);
    }
  };

  const fetchDriverHistory = (driver: any) => {
    setSelectedDriver(driver);
    setIsDriverHistoryOpen(true);
  };

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

  const handleBulkAction = async (action: "deactivate" | "increase_price") => {
    if (selectedPlanIds.length === 0) return;

    modalApi.confirm({
      title: "Global Bulk Action",
      content: `Applying change to ${selectedPlanIds.length} plans. This sequence may take a moment.`,
      okText: "Proceed",
      onOk: async () => {
        try {
          setIsSubmitting(true);
          for (const id of selectedPlanIds) {
            const plan = plans.find((p) => p.id === id);
            if (!plan) continue;

            if (action === "deactivate") {
              await axios.patch(`/api/recharge-plans/status/${id}`, { isActive: false });
            } else {
              const payload = {
                dailyPrice: Math.round(plan.dailyPrice * 1.1),
                weeklyPrice: Math.round(plan.weeklyPrice * 1.1),
                monthlyPrice: Math.round(plan.monthlyPrice * 1.1),
              };
              await axios.patch(`/api/recharge-plans/update/${id}`, payload);
            }
          }
          notificationApi.success({
            message: "Updates Complete",
            description: `Modified ${selectedPlanIds.length} plans successfully.`,
          });
          setSelectedPlanIds([]);
          fetchPlans();
        } catch (err) {
          messageApi.error("Action partially failed. Please check logs.");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const toggleAllSelection = () => {
    if (selectedPlanIds.length === filteredPlans.length) {
      setSelectedPlanIds([]);
    } else {
      setSelectedPlanIds(filteredPlans.map((p) => p.id));
    }
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

  return (
    <div className="flex flex-row h-full w-full bg-[#f8f9fa] dark:bg-[#0b0f19] overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-[260px] flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Subscription
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                Management
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
          
          {/* Filters Section */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              <span className="text-[11px] font-black tracking-widest uppercase text-slate-600 dark:text-slate-400">FILTERS</span>
            </div>
            
            <div className="space-y-3 px-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Plan Type</label>
                <Select
                  value={subFilter}
                  style={{ width: "100%", height: 36 }}
                  onChange={setSubFilter}
                  className="custom-select-dashboard"
                  suffixIcon={<ChevronDown size={14} className="text-gray-400 dark:text-slate-500" />}
                  options={[
                    { value: "ALL", label: "All Plans" },
                    { value: "BASIC", label: "Basic" },
                    { value: "ELITE", label: "Elite" },
                    { value: "PREMIUM", label: "Premium" },
                  ]}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Billing Cycle</label>
                <Select
                  value={billingCycleFilter}
                  style={{ width: "100%", height: 36 }}
                  onChange={setBillingCycleFilter}
                  className="custom-select-dashboard"
                  suffixIcon={<ChevronDown size={14} className="text-gray-400 dark:text-slate-500" />}
                  options={[
                    { value: "ALL", label: "All Cycles" },
                    { value: "DAILY", label: "Daily" },
                    { value: "WEEKLY", label: "Weekly" },
                    { value: "MONTHLY", label: "Monthly" },
                  ]}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Days Left</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Days Left (e.g. 1)"
                    value={remainingDaysFilter}
                    onChange={(e) => setRemainingDaysFilter(e.target.value)}
                    className="w-full h-[36px] pl-3 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-[13px] text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    min="0"
                  />
                </div>
              </div>

              {(subSearchTerm ||
                subFilter !== "ALL" ||
                billingCycleFilter !== "ALL" ||
                remainingDaysFilter !== "") && (
                <button
                  onClick={() => {
                    setSubSearchTerm("");
                    setSubFilter("ALL");
                    setBillingCycleFilter("ALL");
                    setRemainingDaysFilter("");
                  }}
                  className="w-full h-[36px] flex items-center justify-center rounded-lg text-[11px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-all mt-2"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-700/50"></div>

          {/* Real-time Stats Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[11px] font-black tracking-widest uppercase text-slate-600 dark:text-slate-400">REAL-TIME</span>
              </div>
              <button
                onClick={fetchActiveSubscriptions}
                className="p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-colors"
                title="Sync Data"
              >
                <Zap size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Today Segment */}
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Today</span>
                <div className="text-sm font-black text-slate-900 dark:text-slate-100">{subStats?.today_count || 0}</div>
                <div className="text-[10px] font-bold text-indigo-600 mt-0.5">₹{Number(subStats?.today_amount || 0).toLocaleString()}</div>
              </div>

              {/* Week Segment */}
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">This Week</span>
                <div className="text-sm font-black text-slate-900 dark:text-slate-100">{subStats?.week_count || 0}</div>
                <div className="text-[10px] font-bold text-emerald-600 mt-0.5">₹{Number(subStats?.week_amount || 0).toLocaleString()}</div>
              </div>

              {/* Month Segment */}
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">This Month</span>
                <div className="text-sm font-black text-slate-900 dark:text-slate-100">{subStats?.month_count || 0}</div>
                <div className="text-[10px] font-bold text-purple-600 mt-0.5">₹{Number(subStats?.month_amount || 0).toLocaleString()}</div>
              </div>

              {/* Lifetime Segment */}
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Lifetime</span>
                <div className="text-sm font-black text-slate-900 dark:text-slate-100">{subStats?.lifetime_count || 0}</div>
                <div className="text-[10px] font-bold text-amber-600 mt-0.5">₹{Number(subStats?.lifetime_amount || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-white dark:bg-[#0b0f19]">
        {/* Top Header Strip */}
        <div className="bg-white dark:bg-slate-800 p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 shadow-sm z-0">
          <div className="relative flex-1 max-w-3xl flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
            <Search className="absolute left-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search drivers..."
              className="w-full pl-10 pr-4 py-2 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400"
              value={subSearchTerm}
              onChange={(e) => setSubSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[11px] font-black tracking-widest uppercase">
                {subscriptionTab === "ACTIVE" ? activeSubscriptions.length : expiredSubscriptions.length} RESULTS
              </span>
            </div>
            <span className="text-[11px] font-black tracking-widest uppercase text-indigo-600 dark:text-indigo-400 mr-2">SUBSCRIPTION TRACKING</span>
          </div>
        </div>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            {/* 1. Total Subs */}
            <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center text-base bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Users size={14} />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest">TOTAL SUBS</p>
                </div>
              </div>
              <div className="flex items-end justify-between mt-2">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{activeSubscriptions.length + expiredSubscriptions.length}</h3>
                    <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider">LIFETIME</span>
                  </div>
                </div>
                <div className="w-24 h-10 mb-[-5px]">
                  <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,40 L10,30 L20,35 L40,10 L60,25 L80,5 L100,20" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
                    <path d="M0,40 L10,30 L20,35 L40,10 L60,25 L80,5 L100,20 L100,40 Z" fill="url(#gradient-indigo)" opacity="0.1" />
                    <defs>
                      <linearGradient id="gradient-indigo" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* 2. Active Subs */}
            <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center text-base bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                    <CheckCircle2 size={14} />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest">ACTIVE SUBS</p>
                </div>
              </div>
              <div className="flex items-end justify-between mt-2">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{activeSubscriptions.length}</h3>
                    <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider">LIVE</span>
                  </div>
                </div>
                <div className="w-24 h-10 mb-[-5px]">
                  <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,40 L20,35 L40,20 L60,25 L80,10 L100,5" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                    <path d="M0,40 L20,35 L40,20 L60,25 L80,10 L100,5 L100,40 Z" fill="url(#gradient-emerald)" opacity="0.1" />
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

            {/* 3. Expired Subs */}
            <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center text-base bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400">
                    <Power size={14} />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest">EXPIRED</p>
                </div>
              </div>
              <div className="flex items-end justify-between mt-2">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{expiredSubscriptions.length}</h3>
                    <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider">ENDED</span>
                  </div>
                </div>
                <div className="w-24 h-10 mb-[-5px]">
                  <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,40 L10,25 L30,30 L50,15 L70,20 L90,5 L100,10" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                    <path d="M0,40 L10,25 L30,30 L50,15 L70,20 L90,5 L100,10 L100,40 Z" fill="url(#gradient-amber)" opacity="0.1" />
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

            {/* 4. Today Subs */}
            <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center text-base bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400">
                    <Activity size={14} />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest">TODAY</p>
                </div>
              </div>
              <div className="flex items-end justify-between mt-2">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{subStats?.today_count || 0}</h3>
                    <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider">NEW TODAY</span>
                  </div>
                </div>
                <div className="w-24 h-10 mb-[-5px]">
                  <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,40 L20,38 L40,35 L60,32 L80,30 L100,28" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
                    <path d="M0,40 L20,38 L40,35 L60,32 L80,30 L100,28 L100,40 Z" fill="url(#gradient-rose)" opacity="0.1" />
                    <defs>
                      <linearGradient id="gradient-rose" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 overflow-hidden rounded-none shadow-sm">
            <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-1 px-2.5 bg-indigo-50 text-indigo-500 rounded-lg font-outfit text-xs font-extrabold tracking-tighter">
                  LIVE FEED
                </div>
                <div className="h-4 w-px bg-gray-100 dark:bg-slate-600"></div>
                <div className="flex items-center bg-slate-50 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-100 dark:border-slate-700/50">
                  <button
                    onClick={() => setSubscriptionTab("ACTIVE")}
                    className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${
                      subscriptionTab === "ACTIVE"
                        ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-transparent"
                    }`}
                  >
                    Active Subs
                  </button>
                  <button
                    onClick={() => setSubscriptionTab("EXPIRED")}
                    className={`px-4 py-1.5 rounded-md text-[11px] font-black uppercase tracking-widest transition-all ${
                      subscriptionTab === "EXPIRED"
                        ? "bg-white dark:bg-slate-800 text-rose-500 shadow-sm border border-slate-200 dark:border-slate-700"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-transparent"
                    }`}
                  >
                    Expired Subs
                  </button>
                </div>
              </div>

              <button
                onClick={handleNotifyExpiring}
                disabled={notifyingSubscribers}
                className="flex items-center gap-2 px-4 h-[32px] rounded-lg text-[12px] font-bold bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {notifyingSubscribers ? (
                  <Spin size="small" />
                ) : (
                  <BellRing size={14} className="text-gray-500" />
                )}
                <span>
                  {notifyingSubscribers
                    ? "Notifying..."
                    : `Notify All ${subscriptionTab === "ACTIVE" ? "Active" : "Expired"}`}
                </span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="border-b border-gray-100 dark:border-slate-700/60">
                  <tr className="bg-transparent">
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-transparent">
                      Driver Identity
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-transparent">
                      Communication
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-transparent">
                      Driver ID
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-transparent">
                      Plan Config
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-transparent">
                      Plan Amount
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-transparent">
                      Billing Cycle
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-transparent">
                      Timeline Progress
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-transparent border-l border-gray-100 dark:border-slate-700/60 text-center w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                  {(subscriptionTab === "ACTIVE" ? loadingActiveSubs : loadingExpiredSubs) ? (
                    [1, 2, 3].map((i: number) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={8} className="px-6 py-6">
                          <div className="h-8 bg-white dark:bg-slate-800 rounded-lg w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : (subscriptionTab === "ACTIVE"
                      ? activeSubscriptions
                      : expiredSubscriptions
                    ).filter((s) => {
                      const matchesSearch =
                        s.driverName?.toLowerCase().includes(subSearchTerm.toLowerCase()) ||
                        s.driverPhone?.toLowerCase().includes(subSearchTerm.toLowerCase());
                      const matchesFilter =
                        subFilter === "ALL" ||
                        (s.planName && s.planName.toUpperCase().includes(subFilter));
                      const matchesBilling =
                        billingCycleFilter === "ALL" ||
                        (s.billingCycle && s.billingCycle.toUpperCase() === billingCycleFilter);
                      const daysLeft = Math.ceil(
                        (new Date(s.expiryDate).getTime() - new Date().getTime()) /
                          (1000 * 60 * 60 * 24),
                      );
                      const matchesDaysLeft =
                        remainingDaysFilter === "" ||
                        daysLeft === parseInt(remainingDaysFilter, 10);
                      return matchesSearch && matchesFilter && matchesBilling && matchesDaysLeft;
                    }).length > 0 ? (
                    (subscriptionTab === "ACTIVE" ? activeSubscriptions : expiredSubscriptions)
                      .filter((s) => {
                        const matchesSearch =
                          s.driverName?.toLowerCase().includes(subSearchTerm.toLowerCase()) ||
                          s.driverPhone?.toLowerCase().includes(subSearchTerm.toLowerCase());
                        const matchesFilter =
                          subFilter === "ALL" ||
                          (s.planName && s.planName.toUpperCase().includes(subFilter));
                        const matchesBilling =
                          billingCycleFilter === "ALL" ||
                          (s.billingCycle && s.billingCycle.toUpperCase() === billingCycleFilter);
                        const daysLeft = Math.ceil(
                          (new Date(s.expiryDate).getTime() - new Date().getTime()) /
                            (1000 * 60 * 60 * 24),
                        );
                        const matchesDaysLeft =
                          remainingDaysFilter === "" ||
                          daysLeft === parseInt(remainingDaysFilter, 10);
                        return matchesSearch && matchesFilter && matchesBilling && matchesDaysLeft;
                      })
                      .map((sub: any) => {
                        const daysLeft = Math.ceil(
                          (new Date(sub.expiryDate).getTime() - new Date().getTime()) /
                            (1000 * 60 * 60 * 24),
                        );

                        const totalDays = Math.ceil(
                          (new Date(sub.expiryDate).getTime() - new Date(sub.startDate).getTime()) /
                            (1000 * 60 * 60 * 24),
                        );
                        const daysElapsed = totalDays - daysLeft;
                        const progress = Math.min(
                          100,
                          Math.max(0, (daysElapsed / (totalDays || 1)) * 100),
                        );

                        const planNameLower = sub.planName?.toLowerCase() || "";
                        let badgeClass =
                          "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20";
                        if (planNameLower.includes("basic"))
                          badgeClass =
                            "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/20";
                        else if (planNameLower.includes("elite"))
                          badgeClass =
                            "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20";
                        else if (planNameLower.includes("premium"))
                          badgeClass =
                            "bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";

                        let tagText = "";
                        let tagClasses = "";
                        let lineColor = "";
                        const cycleStr = `${totalDays || 0}d cycle`;

                        if (sub.status === "closed" || sub.status === "inactive") {
                          tagText = "CLOSED";
                          tagClasses = "text-blue-500 border-blue-500/30 bg-blue-500/10";
                          lineColor = "bg-blue-500";
                        } else if (daysLeft < 0) {
                          tagText = `${Math.abs(daysLeft)}D OVERDUE`;
                          tagClasses = "text-rose-500 border-rose-500/30 bg-rose-500/10";
                          lineColor = "bg-rose-500";
                        } else if (daysLeft === 0) {
                          tagText = "ENDS TODAY";
                          tagClasses = "text-amber-500 border-amber-500/30 bg-amber-500/10";
                          lineColor = "bg-amber-500";
                        } else {
                          tagText = `${daysLeft}D LEFT`;
                          tagClasses = "text-emerald-500 border-emerald-500/30 bg-emerald-500/10";
                          lineColor = "bg-emerald-500";
                        }

                        return (
                          <React.Fragment key={sub.id}>
                            <tr
                              className={`group bg-white dark:bg-slate-800 hover:bg-indigo-50/30 dark:hover:bg-slate-700/50 transition-colors cursor-pointer border-b border-gray-50 dark:border-slate-700/50`}
                              onClick={() => fetchDriverHistory(sub)}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  {sub.profilePicUrl ? (
                                    <div className="relative w-9 h-9">
                                      <div className="absolute inset-0 rounded-lg bg-[#6366f1] text-white font-bold text-xs flex items-center justify-center z-0">
                                        {sub.driverName
                                          ?.split(" ")
                                          .map((n: string) => n[0])
                                          .join("")
                                          .slice(0, 2)
                                          .toUpperCase()}
                                      </div>
                                      <img
                                        src={getMediaUrl(sub.profilePicUrl)}
                                        alt={sub.driverName}
                                        className="absolute inset-0 w-9 h-9 rounded-lg object-cover border border-gray-200 dark:border-slate-700 z-10"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = "none";
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-9 h-9 rounded-lg bg-[#6366f1] text-white font-bold text-xs flex items-center justify-center">
                                      {sub.driverName
                                        ?.split(" ")
                                        .map((n: string) => n[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="text-[13px] font-bold text-gray-900 dark:text-slate-100">
                                      {sub.driverName}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    <Mail size={14} className="shrink-0" />
                                    <span className="text-[12px] font-medium">
                                      {sub.driverEmail === "N/A" ? "-" : sub.driverEmail}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                    <Phone size={14} className="shrink-0" />
                                    <span className="text-[12px] font-medium">
                                      {sub.driverPhone}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {sub.vdriveId ? (
                                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 uppercase tracking-widest font-black">
                                    {sub.vdriveId}
                                  </span>
                                ) : sub.driverId ? (
                                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 uppercase tracking-widest font-black">
                                    {sub.driverId.slice(0, 8)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 dark:text-slate-500">---</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`text-[11px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${badgeClass}`}
                                >
                                  {sub.planName}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-[14px] font-black text-slate-800 dark:text-slate-200 tracking-tighter">
                                    ₹{Number(sub.amountPaid || sub.price || 0).toLocaleString()}
                                  </span>
                                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                                    Paid Amount
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col items-start">
                                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-500/20">
                                    {sub.billingCycle}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 w-64">
                                <div className="flex flex-col gap-2.5 w-full pr-4">
                                  <div className="flex items-center gap-3 w-full">
                                    <span className="text-[12px] font-black text-slate-800 dark:text-white whitespace-nowrap">
                                      {sub.startDate
                                        ? new Date(sub.startDate).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                          })
                                        : "---"}
                                    </span>
                                    <div className="flex-1 h-0.5 rounded-full bg-slate-200 dark:bg-slate-700/50 flex items-center">
                                      <div
                                        className={`h-1 rounded-full ${lineColor}`}
                                        style={{ width: `${progress}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-[12px] font-black text-slate-800 dark:text-white whitespace-nowrap">
                                      {sub.expiryDate
                                        ? new Date(sub.expiryDate).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                          })
                                        : "---"}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest ${tagClasses}`}
                                    >
                                      {tagText}
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                                      {cycleStr}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center border-l border-gray-100 dark:border-slate-700/60 w-24">
                                <button
                                  className="p-1.5 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fetchDriverHistory(sub);
                                  }}
                                >
                                  <Eye size={18} />
                                </button>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center bg-white dark:bg-slate-800">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-3 bg-white dark:bg-slate-800 rounded-full text-slate-200 border border-slate-100 dark:border-slate-700">
                            <Zap size={32} />
                          </div>
                          <p className="text-slate-400 text-xs font-medium">
                            {subscriptionTab === "ACTIVE"
                              ? "No active subscriptions found."
                              : "No expired subscriptions found."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <SubscriptionDrawer
          visible={isDriverHistoryOpen}
          onClose={() => setIsDriverHistoryOpen(false)}
          driver={selectedDriver}
        />
      </div>
    </div>
  );
};

export default Subscriptions;