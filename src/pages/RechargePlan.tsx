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
import SubscriptionDrawer from "../components/RechargePlan/SubscriptionDrawer";
import axios from "../api/axios";
import { messageApi, modalApi, notificationApi } from "../utilities/antdStaticHolder";
import { Checkbox, Select, Drawer, Button, Avatar, Tag, Spin } from "antd";
import { getMediaUrl } from "../components/DriverDetails/DriverDetails";
import PaymentHistory from "./PaymentHistory";

const PromotionsTab = lazy(() => import("./Promotions"));

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

const RechargePlanPage: React.FC = () => {
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
    <div className="flex flex-col h-full overflow-hidden p-3 gap-3 bg-white dark:bg-[#0b0f19] min-h-screen font-sans">
      {/* Header section with Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-gray-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-indigo-500 rounded-xl">
            <Crown className="text-white text-xl" />
          </div>
          <div>
            <h1 className="!m-0 text-lg sm:text-xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
              Recharge Plans
            </h1>
            <p className="block text-[9px] text-gray-400 dark:text-slate-500 font-medium font-outfit uppercase tracking-widest">
              Configuration & Subscription Management
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("plans")}
            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "plans"
                ? "bg-white dark:bg-slate-800 text-indigo-600 border border-gray-200 dark:border-slate-600"
                : "text-gray-500 dark:text-slate-400 hover:text-indigo-600"
            }`}
          >
            <Crown size={14} />
            Manage Plans
            <span className="ml-1 px-1.5 py-0.5 bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 text-[10px] rounded-md border border-gray-200 dark:border-slate-700">
              {plans.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "subscriptions"
                ? "bg-white dark:bg-slate-800 text-indigo-600 border border-gray-200 dark:border-slate-600"
                : "text-gray-500 dark:text-slate-400 hover:text-indigo-600"
            }`}
          >
            <Users size={14} />
            Subscriptions
            <span className="ml-1 px-1.5 py-0.5 bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 text-[10px] rounded-md border border-gray-200 dark:border-slate-700">
              {activeSubscriptions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("promotions")}
            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "promotions"
                ? "bg-white dark:bg-slate-800 text-indigo-600 border border-gray-200 dark:border-slate-600"
                : "text-gray-500 dark:text-slate-400 hover:text-indigo-600"
            }`}
          >
            <Zap size={14} />
            Subscription Offers
          </button>
          <button
            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "payments"
                ? "bg-white dark:bg-slate-800 text-indigo-600 border border-gray-200 dark:border-slate-600"
                : "text-gray-500 dark:text-slate-400 hover:text-indigo-600"
            }`}
            onClick={() => setActiveTab("payments")}
          >
            <CreditCard size={14} />
            Payment History
          </button>
        </div>
      </div>

      {activeTab === "plans" ? (
        <>
          <div className="flex flex-col sm:flex-row gap-3 py-1 items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-3 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl hover:border-indigo-100 transition-all group/selectall">
                <Checkbox
                  checked={
                    selectedPlanIds.length === filteredPlans.length && filteredPlans.length > 0
                  }
                  indeterminate={
                    selectedPlanIds.length > 0 && selectedPlanIds.length < filteredPlans.length
                  }
                  onChange={toggleAllSelection}
                  className="custom-card-checkbox"
                />
                <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest group-hover/selectall:text-indigo-600 transition-colors cursor-default select-none">
                  {selectedPlanIds.length > 0
                    ? `${selectedPlanIds.length} Selected`
                    : "Bulk Selection"}
                </span>
              </div>

              <div className="relative flex-1 max-w-sm">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-slate-500 focus-within:text-indigo-500 transition-colors"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Analyze plans by name..."
                  className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select
                defaultValue="all"
                style={{ width: 130, height: 32 }}
                onChange={setStatusFilter}
                className="custom-select-dashboard"
                suffixIcon={<ChevronDown size={14} className="text-gray-400 dark:text-slate-500" />}
                options={[
                  { value: "all", label: "All Status" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleOpenModal()}
                className="group relative flex items-center gap-2 text-white px-6 py-2.5 rounded-full transition-all duration-300 active:scale-95 text-xs font-extrabold overflow-hidden shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
              >
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] group-hover:bg-right transition-all duration-500"></div>

                {/* Content */}
                <div className="relative z-10 flex items-center gap-2 drop-shadow-md text-white">
                  <Plus
                    size={15}
                    strokeWidth={3}
                    className="transition-transform duration-300 group-hover:rotate-90 text-white"
                  />
                  <span className="tracking-wide uppercase text-[11px] text-white">
                    Create New Plan
                  </span>
                </div>

                {/* Inner Ring */}
                <div className="absolute inset-0 rounded-full ring-1 ring-white/20 ring-inset z-10 pointer-events-none"></div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {loading ? (
              [1, 2, 3].map((i: number) => (
                <div
                  key={i}
                  className="animate-pulse bg-white dark:bg-slate-800 p-8 rounded-2xl h-80 border border-slate-100 dark:border-slate-700"
                />
              ))
            ) : filteredPlans.length > 0 ? (
              filteredPlans.map((plan, index) => {
                const activeSubCount = activeSubscriptions.filter(
                  (s) => s.planName?.toLowerCase() === plan.planName?.toLowerCase(),
                ).length;

                const planNameLower = plan.planName?.toLowerCase() || "";
                let themeConfig = {
                  color: "#0ea5e9",
                  bg: "bg-sky-500",
                  shadow: "shadow-sky-500/20",
                  Icon: Zap,
                };

                if (planNameLower.includes("basic")) {
                  themeConfig = {
                    color: "#0ea5e9",
                    bg: "bg-sky-500",
                    shadow: "shadow-sky-500/20",
                    Icon: Zap,
                  };
                } else if (planNameLower.includes("elite")) {
                  themeConfig = {
                    color: "#a855f7",
                    bg: "bg-purple-500",
                    shadow: "shadow-purple-500/20",
                    Icon: Sparkles,
                  };
                } else if (planNameLower.includes("premium")) {
                  themeConfig = {
                    color: "#f59e0b",
                    bg: "bg-amber-500",
                    shadow: "shadow-amber-500/20",
                    Icon: Crown,
                  };
                }

                return (
                  <div
                    key={plan.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-indigo-200 hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col overflow-hidden relative group/card cursor-pointer"
                    onClick={() => setManagingPlanId(plan.id)}
                  >
                    {/* Top colored border */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[4px] z-20"
                      style={{ backgroundColor: themeConfig.color }}
                    />

                    {/* Card Body Area */}
                    <div className="p-4 pt-5 relative">
                      <div className="flex justify-between items-center mb-6">
                        {/* Left Side: Checkbox, Icon, Name */}
                        <div className="flex items-center gap-3">
                          {/* Selection Checkbox */}
                          <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                            <Checkbox
                              checked={selectedPlanIds.includes(plan.id)}
                              onChange={() => {
                                setSelectedPlanIds((prev) =>
                                  prev.includes(plan.id)
                                    ? prev.filter((id) => id !== plan.id)
                                    : [...prev, plan.id],
                                );
                              }}
                              className="custom-card-checkbox-circle"
                            />
                          </div>

                          {/* Plan Icon Box */}
                          <div
                            className={`w-8 h-8 rounded-lg ${themeConfig.bg} flex items-center justify-center text-white shadow-lg ${themeConfig.shadow}`}
                          >
                            <themeConfig.Icon size={16} fill="currentColor" />
                          </div>

                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-extrabold text-[#111827] dark:text-white tracking-tight leading-none">
                              {plan.planName}
                            </h3>
                            {index === 1 && (
                              <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-500/10 px-1.5 py-0.5 rounded-full border border-orange-100 dark:border-orange-500/20">
                                <Flame size={10} className="text-orange-500" fill="currentColor" />
                                <span className="text-[9px] font-black uppercase text-orange-500 tracking-widest leading-none">
                                  Hot
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Side: Status Badges */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-700/50 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-600 shadow-sm">
                            <Users size={10} className="text-gray-400 dark:text-slate-400" />
                            <span className="text-[9px] font-black uppercase text-gray-500 dark:text-slate-400 tracking-wider">
                              {activeSubCount} Subs
                            </span>
                          </div>
                          <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">
                              Live
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Simplified Pricing Row */}
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700/50 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                            Daily
                          </span>
                          <span className="text-sm font-black text-[#111827] dark:text-white">
                            ₹{plan.dailyPrice}
                          </span>
                        </div>
                        <div className="w-px h-6 bg-gray-100 dark:bg-slate-700"></div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                            Weekly
                          </span>
                          <span className="text-sm font-black text-[#111827] dark:text-white">
                            ₹{plan.weeklyPrice}
                          </span>
                        </div>
                        <div className="w-px h-6 bg-gray-100 dark:bg-slate-700"></div>
                        <div className="flex flex-col text-right">
                          <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                            Monthly
                          </span>
                          <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none">
                            ₹{plan.monthlyPrice}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-20 bg-white dark:bg-slate-800 rounded-2xl text-center border border-dashed border-slate-200 dark:border-slate-600">
                <p className="text-slate-400 text-sm">No plans found. Create your first one!</p>
              </div>
            )}
          </div>
        </>
      ) : activeTab === "subscriptions" ? (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-2 duration-500">
          {/* High-Density Stats Strip (Real-time Stats) */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-200 dark:border-slate-700 flex flex-col xl:flex-row xl:items-center justify-between gap-6 overflow-x-auto custom-scrollbar">
            {/* Real-time Header */}
            <div className="flex items-center gap-4 shrink-0 pr-4 xl:border-r border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <h3 className="text-[11px] font-black text-gray-900 dark:text-slate-100 uppercase tracking-widest">
                  Real-time Stats
                </h3>
              </div>
            </div>

            {/* Stats Metrics */}
            <div className="flex items-center gap-6 shrink-0 flex-1">
              {/* Today Segment */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
                  <Calendar size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    Today
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {subStats?.today_count || 0}
                      </span>
                    </div>
                    <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                    <span className="text-sm font-black text-indigo-600 tracking-tight">
                      ₹{Number(subStats?.today_amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-px h-6 bg-slate-100 dark:bg-slate-700 hidden md:block"></div>

              {/* Week Segment */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                  <CalendarDays size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    This Week
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {subStats?.week_count || 0}
                      </span>
                    </div>
                    <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                    <span className="text-sm font-black text-emerald-600 tracking-tight">
                      ₹{Number(subStats?.week_amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-px h-6 bg-slate-100 dark:bg-slate-700 hidden md:block"></div>

              {/* Month Segment */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 bg-purple-50/50 dark:bg-purple-500/10 text-purple-600 rounded-lg flex items-center justify-center border border-purple-100 dark:border-purple-500/20">
                  <CalendarRange size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    This Month
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {subStats?.month_count || 0}
                      </span>
                    </div>
                    <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                    <span className="text-sm font-black text-purple-600 tracking-tight">
                      ₹{Number(subStats?.month_amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-px h-6 bg-slate-100 dark:bg-slate-700 hidden lg:block"></div>

              {/* Lifetime Segment */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 bg-amber-50/50 dark:bg-amber-500/10 text-amber-600 rounded-lg flex items-center justify-center border border-amber-100 dark:border-amber-500/20">
                  <Activity size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    Lifetime
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {subStats?.lifetime_count || 0}
                      </span>
                    </div>
                    <div className="w-px h-3 bg-slate-200 dark:bg-slate-700"></div>
                    <span className="text-sm font-black text-amber-600 tracking-tight">
                      ₹{Number(subStats?.lifetime_amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync Action */}
            <div className="shrink-0 flex items-center xl:border-l border-gray-100 dark:border-slate-700 xl:pl-4">
              <button
                onClick={fetchActiveSubscriptions}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-gray-50 dark:hover:bg-slate-700 transition-all active:scale-95"
              >
                <Zap size={12} className="text-amber-500" />
                Sync Data
              </button>
            </div>
          </div>
          {/* Dashboard-Style Controls for Subscriptions */}
          <div className="flex flex-col sm:flex-row gap-3 py-1 items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md group/search">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-slate-500 dark:text-slate-400 group-focus-within/search:text-indigo-500 transition-colors"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Analyze subscriptions by driver name or phone..."
                  className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all shadow-sm"
                  value={subSearchTerm}
                  onChange={(e) => setSubSearchTerm(e.target.value)}
                />
              </div>

              <Select
                value={subFilter}
                style={{ width: 140, height: 32 }}
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

              <Select
                value={billingCycleFilter}
                style={{ width: 150, height: 32 }}
                onChange={setBillingCycleFilter}
                className="custom-select-dashboard hidden md:flex"
                suffixIcon={<ChevronDown size={14} className="text-gray-400 dark:text-slate-500" />}
                options={[
                  { value: "ALL", label: "All Billing Cycles" },
                  { value: "DAILY", label: "Daily" },
                  { value: "WEEKLY", label: "Weekly" },
                  { value: "MONTHLY", label: "Monthly" },
                ]}
              />

              <div className="relative">
                <input
                  type="number"
                  placeholder="Days Left (e.g. 1)"
                  value={remainingDaysFilter}
                  onChange={(e) => setRemainingDaysFilter(e.target.value)}
                  className="w-36 h-[32px] pl-3 pr-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[13px] text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  min="0"
                />
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
                  className="h-[32px] px-3 flex items-center justify-center rounded-lg text-[11px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 border border-transparent transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
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
      ) : activeTab === "promotions" ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden min-h-[600px] flex flex-col">
          <div className="p-4 border-b border-gray-50 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap size={16} className="text-indigo-500" />
              <span className="text-xs font-extrabold text-gray-900 dark:text-slate-100 tracking-tight uppercase">
                Promotion Systems
              </span>
            </div>
          </div>
          <div className="flex-1 bg-gray-50 dark:bg-slate-700/30">
            <Suspense
              fallback={
                <div className="flex items-center justify-center p-20 animate-pulse text-indigo-500 font-extrabold text-xs">
                  INITIALIZING OPS ENGINE...
                </div>
              }
            >
              <PromotionsTab />
            </Suspense>
          </div>
        </div>
      ) : activeTab === "payments" ? (
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-20 animate-pulse text-indigo-500 font-extrabold text-xs">
              LOADING PAYMENTS...
            </div>
          }
        >
          <PaymentHistory />
        </Suspense>
      ) : null}

      {/* Floating Bulk Action Bar */}
      {selectedPlanIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-[#1a1a1a] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-6 border border-white/5 backdrop-blur-xl">
            <div className="flex items-center gap-3 pr-6 border-r border-white/10 select-none">
              <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center font-black text-xs shadow-lg shadow-indigo-500/40 ring-4 ring-indigo-500/10">
                {selectedPlanIds.length}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black tracking-tight uppercase">
                  Operational Units
                </span>
                <span className="text-[9px] text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">
                  Selected focus
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction("deactivate")}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800/5 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold transition-all disabled:opacity-50 border border-white/5"
              >
                <Power size={12} />
                STOP OPS
              </button>
              <button
                onClick={() => handleBulkAction("increase_price")}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-extrabold transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
              >
                <TrendingUp size={12} />
                INCREASE PRICE (+10%)
              </button>
              <button
                onClick={() => setSelectedPlanIds([])}
                className="px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 text-[10px] font-bold text-gray-400 dark:text-slate-400 transition-all uppercase"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
            <div className="grid grid-cols-3 gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
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
                            <div key={field} className="flex items-start gap-3 w-full">
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
                    <div className="flex items-center gap-3 mt-1 text-xs">
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

      <SubscriptionDrawer
        visible={isDriverHistoryOpen}
        onClose={() => setIsDriverHistoryOpen(false)}
        driver={selectedDriver}
      />

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

export default RechargePlanPage;
