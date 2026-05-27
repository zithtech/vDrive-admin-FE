import React, { useState, useEffect, lazy, Suspense } from 'react';
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
  ArrowUpRight,
  MoreVertical,
  Filter,
  Clock,
  BellRing
} from 'lucide-react';
import axios from '../api/axios';
import { messageApi, modalApi, notificationApi } from '../utilities/antdStaticHolder';
import { Checkbox, Select, Drawer, Button, Avatar, Tag, Dropdown, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';

const PromotionsTab = lazy(() => import('./Promotions'));

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



const CountdownTimer: React.FC<{ expiryDate: string }> = ({ expiryDate }) => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(expiryDate).getTime() - new Date().getTime();
      if (difference > 0 && difference < 86400000) { // < 24 hours
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [expiryDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-1.5 bg-white text-rose-600 px-2 py-1 rounded-md text-[10px] font-black font-mono shadow-sm border border-rose-200 whitespace-nowrap tracking-widest">
      <div className="flex flex-col items-center leading-none">
        <span>{String(timeLeft.hours).padStart(2, '0')}</span>
      </div>
      <span className="opacity-40 animate-pulse">:</span>
      <div className="flex flex-col items-center leading-none">
        <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
      </div>
      <span className="opacity-40 animate-pulse">:</span>
      <div className="flex flex-col items-center leading-none">
        <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
    </div>
  );
};

/* ================= COMPONENT ================= */

const RechargePlanPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"plans" | "subscriptions" | "promotions">("plans");
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([]);
  const [loadingActiveSubs, setLoadingActiveSubs] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form State
  const [formData, setFormData] = useState({
    planName: '',
    description: '',
    validityDays: '',
    dailyPrice: '',
    weeklyPrice: '',
    monthlyPrice: '',
    features: [] as string[],
    isActive: true,
    tag: '',
  });

  const [subSearchTerm, setSubSearchTerm] = useState("");
  const [subFilter, setSubFilter] = useState<string>("ALL");
  const [selectedPlanIds, setSelectedPlanIds] = useState<number[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyPlanName, setHistoryPlanName] = useState("");

  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [subStats, setSubStats] = useState<any>(null);
  const [isDriverHistoryOpen, setIsDriverHistoryOpen] = useState(false);
  const [driverHistoryLoading, setDriverHistoryLoading] = useState(false);
  const [driverHistoryData, setDriverHistoryData] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [notifyingSubscribers, setNotifyingSubscribers] = useState(false);

  /* ---- Fetch Plans ---- */
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/recharge-plans');

      // Dev Logging
      if (import.meta.env.DEV) {
        console.group('RECHARGE PLANS API RESPONSE');
        console.log('Full Response:', res.data);
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
        id: p.id || (idx + 1000), // Ensure unique ID even if DB ID is missing to prevent expansion bugs
        planName: p.plan_name || p.planName,
        description: p.description,
        validityDays: p.validity_days || p.validityDays,
        dailyPrice: Number(p.daily_price || p.dailyPrice || 0),
        weeklyPrice: Number(p.weekly_price || p.weeklyPrice || 0),
        monthlyPrice: Number(p.monthly_price || p.monthlyPrice || 0),
        features: (() => {
          const rawFeatures = p.features;
          if (Array.isArray(rawFeatures)) {
            return rawFeatures.filter((f: any) => typeof f === 'string' && f.trim().length > 0);
          }
          if (typeof rawFeatures === 'object' && rawFeatures !== null) {
            // Support legacy flag-based objects or entries where values are true
            return Object.entries(rawFeatures)
              .filter(([_, val]) => val === true || val === 'true')
              .map(([key]) => key);
          }
          return [];
        })(),
        tag: p.tag || '',
        isActive: p.is_active !== undefined ? p.is_active : p.isActive,
      }));
      setPlans(mappedPlans);
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    fetchActiveSubscriptions();
    fetchSubscriptionStats();
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
      const res = await axios.post('/api/recharge-plans/notify-expiring');
      
      if (res.data.data.sentCount > 0) {
        messageApi.success(`Successfully notified ${res.data.data.sentCount} expiring drivers!`);
      } else {
        messageApi.info('No expiring subscriptions found to notify.');
      }
    } catch (err) {
      console.error("Failed to send notifications:", err);
      messageApi.error('Failed to send expiry notifications');
    } finally {
      setNotifyingSubscribers(false);
    }
  };

  const handleNotifyIndividual = async (driverId: string) => {
    try {
      await axios.post('/api/recharge-plans/notify-individual', { driverId });
      messageApi.success('Status notification sent to driver!');
    } catch (err) {
      console.error("Failed to notify driver:", err);
      messageApi.error('Failed to send notification');
    }
  };

  const fetchDriverHistory = async (driver: any, mode: 'DRAWER' | 'INLINE' = 'DRAWER') => {
    try {
      setSelectedDriver(driver);
      if (mode === 'DRAWER') {
        setIsDriverHistoryOpen(true);
      } else {
        if (expandedRowId === driver.id) {
          setExpandedRowId(null);
          return;
        }
        setExpandedRowId(driver.id);
      }

      setDriverHistoryLoading(true);
      const res = await axios.get(`/api/recharge-plans/driver-history/${driver.driverId || driver.driver_id || driver.driver_id}`);
      setDriverHistoryData(res.data.data);
    } catch (err) {
      console.error("Failed to fetch driver history:", err);
      messageApi.error("Failed to fetch driver subscription history");
    } finally {
      setDriverHistoryLoading(false);
    }
  };

  const fetchActiveSubscriptions = async () => {
    try {
      setLoadingActiveSubs(true);
      const res = await axios.get("/api/recharge-plans/active-subscriptions");

      // Dev Logging
      if (import.meta.env.DEV) {
        console.group('ACTIVE SUBSCRIPTIONS API RESPONSE');
        console.log('Full Response:', res.data);
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
        driverName: s.driver_name || s.driverName || 'N/A',
        driverPhone: s.driver_phone || s.driverPhone || 'N/A',
        planName: s.plan_name || s.planName || 'N/A',
        billingCycle: s.billing_cycle || s.billingCycle || 'N/A',
        startDate: s.start_date || s.startDate,
        expiryDate: s.expiry_date || s.expiryDate,
        amountPaid: s.amount_paid || s.amountPaid,
        driverId: s.driver_id || s.driverId,
      }));

      setActiveSubscriptions(mappedSubs);
    } catch (err) {
      console.error("Failed to fetch active subscriptions:", err);
    } finally {
      setLoadingActiveSubs(false);
    }
  };

  const formatFeatureLabel = (key: string) => {
    // If it already looks like a sentence, leave it
    if (key.includes(' ')) return key;

    // Mapping for common technical keys
    const mapping: Record<string, string> = {
      zero_commission: "Zero Commission",
      oneway_enabled: "One-Way Trips",
      outstation_enabled: "Outstation Trips",
      priority_matching: "Priority Matching",
      instant_requests: "Instant Requests",
      no_surge_pricing: "No Surge Pricing",
      premium_driver_rank: "Premium Driver Rank",
      scheduled_rides: "Scheduled Rides"
    };

    if (mapping[key]) return mapping[key];

    // Fallback: replace underscores/hyphens and capitalize
    return key
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };



  /* ---- Handlers ---- */
  const handleOpenModal = (plan?: RechargePlan) => {
    if (plan) {
      setEditingId(plan.id);

      setFormData({
        planName: plan.planName,
        description: plan.description || '',
        validityDays: plan.validityDays?.toString() || '',
        dailyPrice: plan.dailyPrice.toString(),
        weeklyPrice: plan.weeklyPrice.toString(),
        monthlyPrice: plan.monthlyPrice.toString(),
        features: Array.isArray(plan.features) ? plan.features.map(f => formatFeatureLabel(f)) : [],
        isActive: plan.isActive,
        tag: plan.tag || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        planName: '',
        description: '',
        validityDays: '',
        dailyPrice: '',
        weeklyPrice: '',
        monthlyPrice: '',
        features: [],
        isActive: true,
        tag: '',
      });
    }
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.planName.trim()) newErrors.planName = "Plan name is required";
    if (!formData.validityDays || Number(formData.validityDays) <= 0) newErrors.validityDays = "Validity must be greater than 0";
    if (!formData.dailyPrice || Number(formData.dailyPrice) < 0) newErrors.dailyPrice = "Price cannot be negative";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      messageApi.error('Please correct the errors in the form.');
      return;
    }

    const action = editingId ? 'update' : 'create';

    modalApi.confirm({
      title: editingId ? 'Confirm Plan Update' : 'Confirm New Plan',
      content: `Are you sure you want to ${action} this plan configuration?`,
      okText: editingId ? 'Update Plan' : 'Create Plan',
      cancelText: 'Cancel',
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
            features: formData.features.filter(f => f.trim()),
            isActive: formData.isActive,
            tag: formData.tag,
          };

          if (editingId) {
            await axios.patch(`/api/recharge-plans/update/${editingId}`, payload);
            notificationApi.success({
              message: 'Plan Updated',
              description: `"${formData.planName}" has been successfully updated.`,
              placement: 'topRight',
            });
          } else {
            await axios.post('/api/recharge-plans/create', payload);
            notificationApi.success({
              message: 'Plan Created',
              description: `"${formData.planName}" has been successfully created.`,
              placement: 'topRight',
            });
          }
          setIsModalOpen(false);
          fetchPlans();
        } catch (err: any) {
          console.error('Failed to save plan:', err);
          messageApi.error(err?.response?.data?.message || 'Failed to save plan. Please check all fields.');
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };



  const handleBulkAction = async (action: 'deactivate' | 'increase_price') => {
    if (selectedPlanIds.length === 0) return;

    modalApi.confirm({
      title: 'Global Bulk Action',
      content: `Applying change to ${selectedPlanIds.length} plans. This sequence may take a moment.`,
      okText: 'Proceed',
      onOk: async () => {
        try {
          setIsSubmitting(true);
          for (const id of selectedPlanIds) {
            const plan = plans.find(p => p.id === id);
            if (!plan) continue;

            if (action === 'deactivate') {
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
            message: 'Updates Complete',
            description: `Modified ${selectedPlanIds.length} plans successfully.`,
          });
          setSelectedPlanIds([]);
          fetchPlans();
        } catch (err) {
          messageApi.error('Action partially failed. Please check logs.');
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  const toggleAllSelection = () => {
    if (selectedPlanIds.length === filteredPlans.length) {
      setSelectedPlanIds([]);
    } else {
      setSelectedPlanIds(filteredPlans.map(p => p.id));
    }
  };

  const handleDelete = async (id: number) => {
    const plan = plans.find(p => p.id === id);
    modalApi.confirm({
      title: 'Delete Plan?',
      content: `Are you sure you want to delete "${plan?.planName}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await axios.delete(`/api/recharge-plans/delete/${id}`);
          messageApi.success('Plan deleted successfully');
          fetchPlans();
        } catch (err) {
          console.error('Failed to delete plan:', err);
          messageApi.error('Failed to delete plan');
        }
      },
    });
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await axios.patch(`/api/recharge-plans/status/${id}`, { isActive: !currentStatus });
      messageApi.success(`Plan ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchPlans();
    } catch (err) {
      console.error('Failed to update status:', err);
      messageApi.error('Failed to update status');
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
      console.error('Failed to fetch history:', err);
      messageApi.error('Failed to fetch plan history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredPlans = plans.filter((p) => {
    const matchesSearch = p.planName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && p.isActive) ||
      (statusFilter === "inactive" && !p.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 gap-3 bg-white min-h-screen font-sans">
      {/* Header section */}
      <div className="flex items-center space-x-3 shrink-0">
        <div className="flex items-center justify-center w-10 h-10 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
          <Crown className="text-white text-xl" />
        </div>
        <div>
          <h1 className="!m-0 text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">Recharge Plans</h1>
          <p className="block text-[9px] text-gray-400 font-medium font-outfit uppercase tracking-widest">
            Configuration & Subscription Management
          </p>
        </div>
      </div>

      {/* Dashboard-Style Navigation Toolbelt */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-2 rounded-2xl border border-gray-100 shadow-sm shrink-0">
        <div className="flex gap-1 p-1 bg-white rounded-xl border border-gray-100">
          <button
            onClick={() => setActiveTab("plans")}
            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === "plans"
              ? "bg-white text-indigo-600 shadow-sm border border-gray-200"
              : "text-gray-500 hover:text-indigo-600"}`}
          >
            <Crown size={14} />
            Manage Plans
            <span className="ml-1 px-1.5 py-0.5 bg-white text-gray-500 text-[10px] rounded-md border border-gray-100">{plans.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === "subscriptions"
              ? "bg-white text-indigo-600 shadow-sm border border-gray-200"
              : "text-gray-500 hover:text-indigo-600"}`}
          >
            <Users size={14} />
            Subscriptions
            <span className="ml-1 px-1.5 py-0.5 bg-white text-gray-500 text-[10px] rounded-md border border-gray-100">{activeSubscriptions.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("promotions")}
            className={`px-4 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-2 ${activeTab === "promotions"
              ? "bg-white text-indigo-600 shadow-sm border border-gray-200"
              : "text-gray-500 hover:text-indigo-600"}`}
          >
            <Zap size={14} />
            Offers & Promos
          </button>
        </div>

        <div className="flex items-center gap-3 pr-2">
          {activeTab === "plans" && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 bg-white border border-gray-100 hover:border-indigo-100 px-4 py-1.5 rounded-lg transition-all active:scale-95 text-xs font-bold shadow-sm"
            >
              <Plus size={14} strokeWidth={3} />
              <span>Create New Plan</span>
            </button>
          )}
          {activeTab === "subscriptions" && (
            <button
              onClick={fetchActiveSubscriptions}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
            >
              <Zap size={14} className="text-amber-500" />
              Sync Data
            </button>
          )}
        </div>
      </div>

      {activeTab === "plans" ? (
        <>
          <div className="flex flex-col sm:flex-row gap-3 py-1 items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex items-center gap-3 px-3 py-1.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-indigo-100 transition-all group/selectall">
                <Checkbox
                  checked={selectedPlanIds.length === filteredPlans.length && filteredPlans.length > 0}
                  indeterminate={selectedPlanIds.length > 0 && selectedPlanIds.length < filteredPlans.length}
                  onChange={toggleAllSelection}
                  className="custom-card-checkbox"
                />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest group-hover/selectall:text-indigo-600 transition-colors cursor-default select-none">
                  {selectedPlanIds.length > 0 ? `${selectedPlanIds.length} Selected` : 'Bulk Selection'}
                </span>
              </div>

              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/search:text-indigo-500 transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Analyze plans by name..."
                  className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select
                defaultValue="all"
                style={{ width: 130, height: 32 }}
                onChange={setStatusFilter}
                className="custom-select-dashboard"
                suffixIcon={<ChevronDown size={14} className="text-gray-400" />}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {loading ? (
              [1, 2, 3].map((i: number) => (
                <div key={i} className="animate-pulse bg-white p-8 rounded-2xl h-80 shadow-sm border border-slate-100" />
              ))
            ) : filteredPlans.length > 0 ? (
              filteredPlans.map((plan, index) => {
                const isExpanded = expandedPlanId === plan.id;
                const activeSubCount = activeSubscriptions.filter(s => s.planName?.toLowerCase() === plan.planName?.toLowerCase()).length;

                const planNameLower = plan.planName?.toLowerCase() || '';
                let themeConfig = { color: '#0ea5e9', bg: 'bg-sky-500', shadow: 'shadow-sky-500/20', Icon: Zap };

                if (planNameLower.includes('basic')) {
                  themeConfig = { color: '#0ea5e9', bg: 'bg-sky-500', shadow: 'shadow-sky-500/20', Icon: Zap };
                } else if (planNameLower.includes('elite')) {
                  themeConfig = { color: '#a855f7', bg: 'bg-purple-500', shadow: 'shadow-purple-500/20', Icon: Sparkles };
                } else if (planNameLower.includes('premium')) {
                  themeConfig = { color: '#f59e0b', bg: 'bg-amber-500', shadow: 'shadow-amber-500/20', Icon: Crown };
                }

                return (
                  <div
                    key={plan.id}
                    className={`bg-white rounded-xl border transition-all duration-300 ease-out flex flex-col overflow-hidden relative group/card ${isExpanded
                      ? 'border-gray-200 ring-4 ring-gray-50'
                      : 'border-gray-100 hover:border-gray-200'
                      }`}
                  >
                    {/* Top colored border */}
                    <div
                      className="absolute top-0 left-0 right-0 h-[4px] z-20"
                      style={{ backgroundColor: themeConfig.color }}
                    />

                    {/* Card Body Area */}
                    <div className="p-4 pt-6 relative">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          {/* Selection Checkbox */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0"
                          >
                            <Checkbox
                              checked={selectedPlanIds.includes(plan.id)}
                              onChange={() => {
                                setSelectedPlanIds(prev =>
                                  prev.includes(plan.id) ? prev.filter(id => id !== plan.id) : [...prev, plan.id]
                                );
                              }}
                              className="custom-card-checkbox-circle"
                            />
                          </div>

                          {/* Plan Icon Box */}
                          <div className={`w-9 h-9 rounded-lg ${themeConfig.bg} flex items-center justify-center text-white shadow-lg ${themeConfig.shadow}`}>
                            <themeConfig.Icon size={18} fill="currentColor" />
                          </div>

                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl font-extrabold text-[#111827] tracking-tight">{plan.planName}</h3>
                              <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                <span className="text-[9px] font-black uppercase text-emerald-600 tracking-wider">Live</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <div className="flex items-center gap-1">
                                <Users size={12} className="text-gray-400" />
                                <span className="text-[10px] font-bold text-gray-500">{activeSubCount} Sub</span>
                              </div>
                              {index === 1 && (
                                <div className="flex items-center gap-1">
                                  <Flame size={12} className="text-orange-500" fill="currentColor" />
                                  <span className="text-[9px] font-black uppercase text-orange-500 tracking-widest">Hot</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Density Metric */}
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest font-outfit">Density</span>
                            <span className="text-[14px] font-extrabold text-indigo-500">{Math.round((activeSubCount / (activeSubscriptions.length || 1)) * 100)}%</span>
                          </div>
                          <div className="w-16 h-1 bg-white rounded-full overflow-hidden border border-gray-200">
                            <div
                              className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                              style={{ width: `${(activeSubCount / (activeSubscriptions.length || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Triple Pricing Grid - Exact replication */}
                      <div className="grid grid-cols-3 gap-2 mb-6 h-28">
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-1 group/price cursor-pointer transition-all hover:border-gray-200">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">Daily</span>
                          <span className="text-2xl font-black text-[#111827] tracking-tighter">₹{plan.dailyPrice}</span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-1 group/price cursor-pointer transition-all hover:border-gray-200">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">Weekly</span>
                          <span className="text-2xl font-black text-[#111827] tracking-tighter">₹{plan.weeklyPrice}</span>
                        </div>
                        <div className={`relative p-3 rounded-xl shadow-lg border-indigo-400/20 flex flex-col items-center justify-center gap-1 group/price cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${index === 0 ? 'bg-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                          <span className="text-[9px] font-bold text-white/70 uppercase tracking-widest text-center">Monthly</span>
                          <span className="text-2xl font-black text-white tracking-tighter">₹{plan.monthlyPrice}</span>
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                            <span className="text-[8px] font-black text-white uppercase tracking-tighter">Best Ops</span>
                          </div>
                        </div>
                      </div>

                      {/* Plan Configuration with separator */}
                      <div className="mt-4">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Plan Configuration</span>
                          <div className="h-px flex-1 bg-gray-100"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-1 h-32 overflow-hidden items-start">
                          {plan.features.slice(0, 6).map((feat: string, i: number) => {
                            const isNegative = feat.toLowerCase().startsWith('no ') || feat.toLowerCase().includes('not included') || feat.toLowerCase() === 'local bookings only';
                            return (
                              <div key={i} className="flex items-center gap-2.5">
                                {isNegative ? (
                                  <div className="shrink-0 w-5 h-5 rounded-full bg-white border border-rose-200 flex items-center justify-center text-rose-500 shadow-sm">
                                    <X size={11} strokeWidth={3} />
                                  </div>
                                ) : (
                                  <div className="shrink-0 w-5 h-5 rounded-full bg-white border border-emerald-200 flex items-center justify-center text-emerald-500 shadow-sm">
                                    <CheckCircle2 size={11} strokeWidth={3} />
                                  </div>
                                )}
                                <span className={`text-[12px] font-semibold truncate ${isNegative ? 'text-gray-400 line-through' : 'text-gray-600'}`}>{feat}</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Card Footer Metric & Action */}
                      <div className="mt-8 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-500">
                          <ArrowUpRight size={14} strokeWidth={3} />
                          <span className="text-[11px] font-bold tracking-tight">Conversion 40%</span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedPlanId(isExpanded ? null : plan.id); }}
                          className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                        >
                          Manage
                        </button>
                      </div>

                      {/* Original Expanded Actions area moved inside for consistency */}
                      {isExpanded && (
                        <div className="mt-6 flex gap-4 animate-in slide-in-from-top-2 duration-300">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenModal(plan); }}
                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 py-2 rounded-lg text-xs font-semibold hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleStatus(plan.id, plan.isActive); }}
                            className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 py-2 rounded-lg text-xs font-semibold hover:border-slate-300 hover:bg-white transition-all shadow-sm"
                          >
                            <Power size={14} className={plan.isActive ? 'text-rose-500' : 'text-emerald-500'} />
                            {plan.isActive ? 'Off' : 'On'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }}
                            className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-400 transition-all shadow-sm"
                            title="Delete Plan"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); fetchPlanHistory(plan.id, plan.planName); }}
                            className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-white rounded-lg transition-all shadow-sm"
                            title="View History"
                          >
                            <History size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-20 bg-white rounded-2xl text-center border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm">No plans found. Create your first one!</p>
              </div>
            )}
          </div>
        </>
      ) : activeTab === "subscriptions" ? (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-2 duration-500">
          {/* High-Density Stats Strip */}
          <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center overflow-x-auto custom-scrollbar gap-10">
            {/* Today Segment */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-10 h-10 bg-white text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs shadow-sm border border-indigo-200">T</div>
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Today</span>
                 <div className="flex items-center gap-3">
                   <div className="flex items-baseline gap-1">
                     <span className="text-[15px] font-black text-slate-900 tracking-tight">{subStats?.today_count || 0}</span>
                     <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Subs</span>
                   </div>
                   <div className="w-px h-3 bg-slate-200"></div>
                   <span className="text-[15px] font-black text-indigo-600 tracking-tight">₹{Number(subStats?.today_amount || 0).toLocaleString()}</span>
                 </div>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-100"></div>

            {/* Week Segment */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-10 h-10 bg-white text-emerald-600 rounded-xl flex items-center justify-center font-black text-xs shadow-sm border border-emerald-200">W</div>
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">This Week</span>
                 <div className="flex items-center gap-3">
                   <div className="flex items-baseline gap-1">
                     <span className="text-[15px] font-black text-slate-900 tracking-tight">{subStats?.week_count || 0}</span>
                     <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Subs</span>
                   </div>
                   <div className="w-px h-3 bg-slate-200"></div>
                   <span className="text-[15px] font-black text-emerald-600 tracking-tight">₹{Number(subStats?.week_amount || 0).toLocaleString()}</span>
                 </div>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-100"></div>

            {/* Month Segment */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-10 h-10 bg-white text-purple-600 rounded-xl flex items-center justify-center font-black text-xs shadow-sm border border-purple-200">M</div>
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">This Month</span>
                 <div className="flex items-center gap-3">
                   <div className="flex items-baseline gap-1">
                     <span className="text-[15px] font-black text-slate-900 tracking-tight">{subStats?.month_count || 0}</span>
                     <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Subs</span>
                   </div>
                   <div className="w-px h-3 bg-slate-200"></div>
                   <span className="text-[15px] font-black text-purple-600 tracking-tight">₹{Number(subStats?.month_amount || 0).toLocaleString()}</span>
                 </div>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-100"></div>

            {/* Lifetime Segment */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="w-10 h-10 bg-white text-amber-600 rounded-xl flex items-center justify-center font-black text-xs shadow-sm border border-amber-200">L</div>
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Overall Lifetime</span>
                 <div className="flex items-center gap-3">
                   <div className="flex items-baseline gap-1">
                     <span className="text-[15px] font-black text-slate-900 tracking-tight">{subStats?.lifetime_count || 0}</span>
                     <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Subs</span>
                   </div>
                   <div className="w-px h-3 bg-slate-200"></div>
                   <span className="text-[15px] font-black text-amber-600 tracking-tight">₹{Number(subStats?.lifetime_amount || 0).toLocaleString()}</span>
                 </div>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 shrink-0">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Stats</span>
            </div>
          </div>
          {/* Dashboard-Style Controls for Subscriptions */}
          <div className="flex flex-col sm:flex-row gap-3 py-1 items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md group/search">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/search:text-indigo-500 transition-colors" size={16} />
                <input
                  type="text"
                  placeholder="Analyze subscriptions by driver name or phone..."
                  className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all shadow-sm"
                  value={subSearchTerm}
                  onChange={(e) => setSubSearchTerm(e.target.value)}
                />
              </div>
              
              <button
                onClick={handleNotifyExpiring}
                disabled={notifyingSubscribers}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95 shadow-sm border ${notifyingSubscribers ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-white text-rose-600 border-rose-100 hover:border-rose-400 hover:shadow-rose-100'}`}
              >
                {notifyingSubscribers ? (
                  <Spin size="small" />
                ) : (
                  <BellRing size={14} className="animate-bounce" />
                )}
                <span>{notifyingSubscribers ? 'Notifying...' : 'Notify All Active'}</span>
              </button>

              <div className="flex items-center gap-1.5 border border-gray-100 rounded-xl p-1 bg-white shadow-sm">
                <div className="pl-2 pr-1">
                  <Filter size={14} className="text-gray-400" />
                </div>
                {['ALL', 'BASIC', 'ELITE', 'PREMIUM'].map(f => (
                  <button
                    key={f}
                    onClick={() => setSubFilter(f)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition-all uppercase tracking-widest ${subFilter === f ? 'bg-white text-indigo-600 shadow-md border border-indigo-400' : 'text-gray-400 hover:text-gray-600 hover:bg-white'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="p-1 px-2.5 bg-indigo-50 text-indigo-500 rounded-lg font-outfit text-xs font-extrabold tracking-tighter">LIVE FEED</div>
                <div className="h-4 w-px bg-gray-100"></div>
                <h2 className="text-sm font-extrabold text-gray-900 tracking-tight uppercase">Active Subscriptions</h2>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-white">Driver Identity</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-white">Plan Config</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-white text-center">Plan Amount</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-white">Billing Cycle</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-white">Timeline Progress</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-white">Ops Delta</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 bg-white w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingActiveSubs ? (
                    [1, 2, 3].map((i: number) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-6 py-6">
                          <div className="h-8 bg-white rounded-lg w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : activeSubscriptions.filter(s => {
                    const matchesSearch = s.driverName?.toLowerCase().includes(subSearchTerm.toLowerCase()) || s.driverPhone?.toLowerCase().includes(subSearchTerm.toLowerCase());
                    const matchesFilter = subFilter === 'ALL' || (s.planName && s.planName.toUpperCase().includes(subFilter));
                    return matchesSearch && matchesFilter;
                  }).length > 0 ? (
                    activeSubscriptions
                      .filter(s => {
                        const matchesSearch = s.driverName?.toLowerCase().includes(subSearchTerm.toLowerCase()) || s.driverPhone?.toLowerCase().includes(subSearchTerm.toLowerCase());
                        const matchesFilter = subFilter === 'ALL' || (s.planName && s.planName.toUpperCase().includes(subFilter));
                        return matchesSearch && matchesFilter;
                      })
                      .map((sub: any) => {
                        const daysLeft = Math.ceil((new Date(sub.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        const isExpiring = daysLeft < 3;
                        const totalDays = Math.ceil((new Date(sub.expiryDate).getTime() - new Date(sub.startDate).getTime()) / (1000 * 60 * 60 * 24));
                        const daysElapsed = totalDays - daysLeft;
                        const progress = Math.min(100, Math.max(0, (daysElapsed / (totalDays || 1)) * 100));

                        const planNameLower = sub.planName?.toLowerCase() || '';
                        let badgeClass = 'bg-white text-indigo-600 border-indigo-200 shadow-sm';
                        if (planNameLower.includes('basic')) badgeClass = 'bg-white text-sky-600 border-sky-200 shadow-sm';
                        else if (planNameLower.includes('elite')) badgeClass = 'bg-white text-purple-600 border-purple-200 shadow-sm';
                        else if (planNameLower.includes('premium')) badgeClass = 'bg-white text-amber-600 border-amber-200 shadow-sm';

                         const isExpanded = expandedRowId === sub.id;

                         return (
                           <React.Fragment key={sub.id}>
                             <tr 
                               className={`group transition-all duration-200 cursor-pointer border-b-2 border-slate-50 ${isExpanded ? 'bg-white' : 'hover:bg-white'}`} 
                               onClick={() => fetchDriverHistory(sub, 'INLINE')}
                             >
                               <td className="px-6 py-5">
                                 <div className="flex items-center gap-3">
                                   <Avatar
                                     size={40}
                                     className="bg-indigo-50 text-indigo-500 font-extrabold border-2 border-white shadow-sm uppercase text-[12px]"
                                     style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: 'white' }}
                                   >
                                     {sub.driverName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                   </Avatar>
                                   <div className="flex flex-col">
                                     <div className="font-black text-slate-800 text-[13px] tracking-tight leading-none mb-1">{sub.driverName}</div>
                                     <div className="text-[10px] font-black text-slate-400 tracking-wider uppercase font-mono">{sub.driverPhone}</div>
                                   </div>
                                 </div>
                               </td>
                               <td className="px-6 py-4">
                                 <span className={`text-[11px] font-black px-3 py-1 rounded-full border shadow-sm uppercase tracking-widest ${badgeClass}`}>
                                   {sub.planName}
                                 </span>
                               </td>
                               <td className="px-6 py-4 text-center">
                                 <div className="flex flex-col items-center">
                                   <span className="text-[14px] font-black text-slate-800 tracking-tighter">₹{Number(sub.amountPaid || sub.price || 0).toLocaleString()}</span>
                                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Paid Amount</span>
                                 </div>
                               </td>
                               <td className="px-6 py-4">
                                 <div className="flex flex-col items-start">
                                   <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-white px-2 py-0.5 rounded-md border border-indigo-200 shadow-sm">
                                     {sub.billingCycle}
                                   </span>
                                 </div>
                               </td>
                               <td className="px-6 py-4 w-48">
                                 <div className="flex flex-col gap-1.5 w-full">
                                   <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                     <span className="flex items-center gap-1"><Clock size={10} /> {sub.startDate ? new Date(sub.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '---'}</span>
                                     <span className="flex items-center gap-1">{sub.expiryDate ? new Date(sub.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '---'} <Zap size={10} /></span>
                                   </div>
                                   <div className="w-full h-2 bg-white rounded-full overflow-hidden shadow-inner border border-slate-100">
                                     <div
                                       className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${isExpiring ? 'bg-gradient-to-r from-rose-500 to-pink-500' : 'bg-gradient-to-r from-emerald-400 to-teal-500'}`}
                                       style={{ width: `${progress}%` }}
                                     />
                                   </div>
                                 </div>
                               </td>
                               <td className="px-6 py-4">
                                 <div className="flex flex-col gap-1 items-start">
                                   <div className={`flex items-center gap-1.5 text-[12px] font-black tracking-tight ${isExpiring ? 'text-rose-500' : 'text-emerald-600'}`}>
                                     {isNaN(daysLeft) ? 'N/A' : `${daysLeft}D REMAINING`}
                                     {isExpiring && !isNaN(daysLeft) && daysLeft >= 1 && (
                                       <span className="relative flex h-2 w-2">
                                         <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                         <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                       </span>
                                     )}
                                   </div>
                                   <div className="mt-1">
                                     <CountdownTimer expiryDate={sub.expiryDate} />
                                   </div>
                                 </div>
                               </td>
                               <td className="px-6 py-4 text-right">
                                 <Dropdown
                                   trigger={['click']}
                                   menu={{
                                     items: [
                                       {
                                         key: '1',
                                         label: <span className="text-xs font-semibold text-gray-700">View Driver Profile</span>,
                                         onClick: (e: any) => {
                                           e.domEvent.stopPropagation();
                                           navigate(`/drivers?search=${sub.driverPhone}`);
                                         }
                                       },
                                       {
                                         key: '2',
                                         label: <span className="text-xs font-semibold text-indigo-600">View Subscription History (Drawer)</span>,
                                         onClick: (e: any) => {
                                           e.domEvent.stopPropagation();
                                           fetchDriverHistory(sub, 'DRAWER');
                                         }
                                       },
                                       {
                                         key: '3',
                                         label: (
                                           <div className="flex items-center gap-2 text-rose-600">
                                             <BellRing size={12} />
                                             <span className="text-xs font-black uppercase tracking-widest">Notify Current Status</span>
                                           </div>
                                         ),
                                         onClick: (e: any) => {
                                           e.domEvent.stopPropagation();
                                           handleNotifyIndividual(sub.driverId);
                                         }
                                       }
                                     ]
                                   }}
                                   placement="bottomRight"
                                 >
                                   <button 
                                     className="p-1.5 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                                     onClick={(e) => e.stopPropagation()}
                                   >
                                     <MoreVertical size={16} />
                                   </button>
                                 </Dropdown>
                               </td>
                             </tr>
                             {isExpanded && (
                               <tr className="bg-white animate-in fade-in slide-in-from-top-1 duration-200 border-b-2 border-slate-100/50">
                                 <td colSpan={7} className="px-6 py-4">
                                   <div className="flex items-center gap-12 justify-center py-2">
                                     <div className="flex flex-col items-center">
                                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Lifetime Subscription Amount</span>
                                       <span className="text-[15px] font-black text-indigo-600 tracking-tight">₹{Number(driverHistoryData?.summary?.total_spent || 0).toLocaleString()}</span>
                                     </div>
                                     <div className="w-px h-8 bg-slate-200"></div>
                                     <div className="flex flex-col items-center">
                                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Times Subscribed</span>
                                       <span className="text-[15px] font-black text-slate-800 tracking-tight">{driverHistoryData?.summary?.total_subscriptions || 0} Times</span>
                                     </div>
                                     {driverHistoryLoading && (
                                       <div className="ml-4">
                                         <Spin size="small" />
                                       </div>
                                     )}
                                   </div>
                                 </td>
                               </tr>
                             )}
                           </React.Fragment>
                         );
                       })
                   ) : (
                     <tr>
                      <td colSpan={7} className="px-6 py-20 text-center bg-white">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-3 bg-white rounded-full text-slate-200 border border-slate-100">
                            <Zap size={32} />
                          </div>
                          <p className="text-slate-400 text-xs font-medium">No active subscriptions found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap size={16} className="text-indigo-500" />
              <span className="text-xs font-extrabold text-gray-900 tracking-tight uppercase">Promotion Systems</span>
            </div>
          </div>
          <div className="flex-1 bg-gray-50/30">
            <Suspense fallback={<div className="flex items-center justify-center p-20 animate-pulse text-indigo-500 font-extrabold text-xs">INITIALIZING OPS ENGINE...</div>}>
              <PromotionsTab />
            </Suspense>
          </div>
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedPlanIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-[#1a1a1a] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-6 border border-white/5 backdrop-blur-xl">
            <div className="flex items-center gap-3 pr-6 border-r border-white/10 select-none">
              <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center font-black text-xs shadow-lg shadow-indigo-500/40 ring-4 ring-indigo-500/10">
                {selectedPlanIds.length}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-black tracking-tight uppercase">Operational Units</span>
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-0.5">Selected focus</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('deactivate')}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-400 text-[10px] font-bold transition-all disabled:opacity-50 border border-white/5"
              >
                <Power size={12} />
                STOP OPS
              </button>
              <button
                onClick={() => handleBulkAction('increase_price')}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-extrabold transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
              >
                <TrendingUp size={12} />
                INCREASE PRICE (+10%)
              </button>
              <button
                onClick={() => setSelectedPlanIds([])}
                className="px-3 py-1.5 rounded-lg hover:bg-white/5 text-[10px] font-bold text-gray-400 transition-all uppercase"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      <Drawer
        title={
          <div className="flex flex-col">
            <div className="flex justify-between items-center mr-8">
              <span className="text-xl font-bold text-slate-900">{editingId ? 'Edit Plan' : 'Create Plan'}</span>
              {!editingId && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setFormData({
                        ...formData,
                        planName: 'Basic Plan',
                        description: 'Entry-level plan for local operation.',
                        features: ["Zero commission on local rides", "Instant requests", "Basic support"]
                      });
                    }}
                    className="text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                  >
                    Basic
                  </button>
                  <button
                    onClick={() => {
                      setFormData({
                        ...formData,
                        planName: 'Elite Plan',
                        description: 'Advanced plan for higher earnings.',
                        features: ["Zero commission on all rides", "Outstation trips", "Priority matching"]
                      });
                    }}
                    className="text-[10px] font-bold px-2 py-1 bg-indigo-50 hover:bg-indigo-100 rounded text-indigo-600 transition-colors"
                  >
                    Elite
                  </button>
                </div>
              )}
            </div>
            <span className="text-xs text-slate-500 font-normal mt-0.5">Configure pricing, validity, and features</span>
          </div>
        }
        placement="right"
        width={520}
        onClose={() => setIsModalOpen(false)}
        open={isModalOpen}
        closeIcon={<X size={20} className="text-slate-400" />}
        styles={{
          header: { borderBottom: '1px solid #f1f5f9', padding: '24px' },
          body: { padding: '24px' },
          footer: { borderTop: '1px solid #f1f5f9', padding: '24px' }
        }}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              disabled={isSubmitting}
              onClick={() => setIsModalOpen(false)}
              className="px-6 h-10 rounded-lg border-slate-200 text-slate-600 font-semibold"
            >
              Cancel
            </Button>
            <Button
              loading={isSubmitting}
              type="primary"
              onClick={() => handleSubmit()}
              className="px-8 h-10 rounded-lg font-semibold"
            >
              {editingId ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Plan Name, Status & Tag */}
          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-3 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Name</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-900 shadow-sm"
                placeholder="e.g. Starter"
                value={formData.planName}
                onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Badge Tag</label>
              <Select
                className="w-full h-[42px]"
                value={formData.tag || ''}
                onChange={(val) => setFormData({ ...formData, tag: val })}
                options={[
                  { value: '', label: 'No Badge' },
                  { value: 'MOST POPULAR', label: 'Most Popular' },
                  { value: 'BEST VALUE', label: 'Best Value' },
                  { value: 'RECOMMENDED', label: 'Recommended' },
                  { value: 'LIMITED OFFER', label: 'Limited Offer' },
                  { value: 'PREMIUM CHOICE', label: 'Premium Choice' },
                  { value: 'ESSENTIAL', label: 'Essential' },
                  { value: 'PRO', label: 'Pro' }
                ]}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</label>
              <Select
                className="w-full h-[42px]"
                value={formData.isActive ? 'active' : 'inactive'}
                onChange={(val) => setFormData({ ...formData, isActive: val === 'active' })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
            <textarea
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-600 shadow-sm min-h-[80px]"
              placeholder="Briefly describe the plan benefits..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Validity */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Validity (Days)</label>
            <input
              type="number"
              className={`w-full px-4 py-2.5 bg-white border ${errors.validityDays ? 'border-rose-400 focus:ring-rose-500/10' : 'border-slate-200 focus:ring-indigo-500/10'} rounded-lg focus:outline-none focus:ring-2 focus:border-indigo-500 transition-all font-bold text-slate-900 shadow-sm`}
              value={formData.validityDays}
              onChange={(e) => {
                setFormData({ ...formData, validityDays: e.target.value });
                if (errors.validityDays) setErrors({ ...errors, validityDays: '' });
              }}
            />
            {errors.validityDays && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.validityDays}</p>}
          </div>

          {/* Pricing Row */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pricing (₹)</label>
            <div className="grid grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 block ml-1 uppercase">Daily</span>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                  value={formData.dailyPrice}
                  onChange={(e) => setFormData({ ...formData, dailyPrice: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 block ml-1 uppercase">Weekly</span>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                  value={formData.weeklyPrice}
                  onChange={(e) => setFormData({ ...formData, weeklyPrice: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 block ml-1 uppercase">Monthly</span>
                <input
                  type="number"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                  value={formData.monthlyPrice}
                  onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan Features</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, features: [...formData.features, ''] })}
                  className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200 flex items-center gap-1"
                >
                  <Plus size={10} /> Add Feature
                </button>
              </div>
            </div>

            <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Quick Suggestions</span>
              <div className="flex flex-wrap gap-2">
                {[
                  "Unlimited Ride Requests", "Keep 100% of Earnings", "Local Rides Enabled",
                  "Scheduled Rides Enabled", "One-Way Trips", "Round Trips Enabled",
                  "Outstation Booking Access", "Premium Rider Match", "Airport Pickups Enabled",
                  "Zero Hidden Fees", "Zero Cancellation Penalty", "Direct Customer Payments",
                  "Priority 24/7 Helpline", "Advanced Area Heatmap", "Top Rated Driver Badge",
                  "Auto-Accept Next Ride", "Instant Withdrawal", "Flexible Working Hours"
                ].map(sug => {
                  const isAdded = formData.features.includes(sug);
                  return (
                    <Tag.CheckableTag
                      key={sug}
                      checked={isAdded}
                      onChange={(checked) => {
                        if (checked) {
                          setFormData({ ...formData, features: [...formData.features, sug] });
                        } else {
                          setFormData({ ...formData, features: formData.features.filter(f => f !== sug) });
                        }
                      }}
                      className={`px-3 py-1 rounded-full border transition-all ${isAdded ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'}`}
                    >
                      {sug}
                    </Tag.CheckableTag>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {formData.features.map((feature: string, idx: number) => (
                <div key={idx} className="flex gap-2 group animate-in slide-in-from-right-2 duration-200">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-sm"
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
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {formData.features.length === 0 && (
                <p className="text-[11px] text-slate-400 italic text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">No features added yet.</p>
              )}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Version History Drawer */}
      <Drawer
        title={
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <History size={18} className="text-indigo-600 drop-shadow-sm" />
              <span className="text-lg font-bold text-slate-900 tracking-tight">Plan History</span>
            </div>
            <span className="text-xs text-slate-500 font-normal mt-0.5">{historyPlanName}</span>
          </div>
        }
        placement="right"
        width={480}
        onClose={() => setIsHistoryOpen(false)}
        open={isHistoryOpen}
        closeIcon={<X size={20} className="text-slate-400 hover:text-rose-500 transition-colors" />}
        styles={{
          header: { borderBottom: '1px solid #f1f5f9', padding: '24px', backgroundColor: '#ffffff' },
          body: { padding: '24px', backgroundColor: '#ffffff' }
        }}
        className="history-drawer"
      >
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px before:h-full before:w-[2px] before:bg-slate-100">
          {historyLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white p-4 h-24 ml-8" />
            ))
          ) : historyData.length > 0 ? (
            historyData.map((item, idx) => (
              <div
                key={item.id}
                className="relative pl-8 group animate-in slide-in-from-right-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                {/* Connector Dot */}
                <div className="absolute left-[7px] top-1.5 h-2.5 w-2.5 rounded-full border-[2px] border-indigo-500 bg-white z-10" />

                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                        <Avatar size={20} className="bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {(item.admin_name || 'A')[0].toUpperCase()}
                        </Avatar>
                        {item.admin_name || "Admin"}
                      </span>
                      <span className="text-slate-300">•</span>
                      <Tag color={
                        item.action === 'CREATE' ? 'blue' :
                          item.action === 'UPDATE' ? 'orange' : 'purple'
                      } className="m-0 text-[10px] uppercase font-bold border-0 px-2 py-0.5 rounded-md">
                        {item.action === 'TOGGLE_STATUS' ? 'STATUS CHANGE' : item.action}
                      </Tag>
                    </div>
                    <span className="text-[11px] font-medium text-slate-400/80 tabular-nums">
                      {new Date(item.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                    </span>
                  </div>

                  {item.action === 'UPDATE' && item.previous_data && item.new_data && (
                    <div className="flex flex-col gap-2 mt-1">
                      {Object.keys(item.new_data || {}).map(field => {
                        if (['updated_at', 'created_at', 'id'].includes(field)) return null;

                        const oldVal = item.previous_data ? item.previous_data[field] : undefined;
                        const newVal = item.new_data[field];

                        if (oldVal !== undefined && JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                          const formatValue = (val: any) => {
                            if (val === null || val === undefined) return 'None';
                            if (typeof val === 'boolean') return val ? 'Active' : 'Inactive';
                            if (Array.isArray(val)) return val.join(', ');
                            if (typeof val === 'object') return JSON.stringify(val);
                            return String(val);
                          };

                          return (
                            <div key={field} className="flex items-start gap-3 w-full">
                              <span className="text-[10px] font-bold text-slate-400 w-28 shrink-0 uppercase tracking-wider pt-0.5">{field.replace(/_/g, ' ')}:</span>
                              <div className="flex items-start gap-2 text-[11px] font-medium text-slate-700 flex-1">
                                <span className="line-through text-slate-400 break-words max-w-[120px]">
                                  {formatValue(oldVal)}
                                </span>
                                <span className="text-slate-300 mt-0.5">→</span>
                                <span className={typeof newVal === 'boolean' ? (newVal ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold') : 'text-indigo-600 font-bold break-words max-w-[120px]'}>
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

                  {item.action === 'CREATE' && (
                    <div className="mt-1">
                      <p className="text-xs text-slate-500">Plan initialized with base configuration and live status.</p>
                    </div>
                  )}

                  {item.action === 'TOGGLE_STATUS' && (
                    <div className="flex items-center gap-3 mt-1 text-xs">
                      <span className="text-slate-500 font-medium w-28 shrink-0">Status change:</span>
                      <span className={item.new_data.is_active ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                        {item.new_data.is_active ? 'Activated' : 'Deactivated'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200 ml-10 shadow-inner">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <History size={32} className="text-slate-200" />
              </div>
              <p className="text-slate-400 text-sm font-bold tracking-tight">No history records found</p>
              <p className="text-slate-300 text-[11px] mt-1">Audit logs will appear as soon as changes are made.</p>
            </div>
          )}
        </div>
      </Drawer>

      {/* Driver Subscription History Drawer */}
      <Drawer
        title={
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <Avatar
                size={40}
                className="bg-indigo-50 text-indigo-500 font-extrabold border border-indigo-100 uppercase text-sm"
              >
                {selectedDriver?.driverName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </Avatar>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-slate-900 tracking-tight">{selectedDriver?.driverName}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{selectedDriver?.driverPhone}</span>
              </div>
            </div>
          </div>
        }
        placement="right"
        width={600}
        onClose={() => setIsDriverHistoryOpen(false)}
        open={isDriverHistoryOpen}
        closeIcon={<X size={20} className="text-slate-400 hover:text-rose-500 transition-colors" />}
        styles={{
          header: { borderBottom: '1px solid #f1f5f9', padding: '24px', backgroundColor: '#ffffff' },
          body: { padding: '0', backgroundColor: '#fcfcfd' },
          footer: { borderTop: '1px solid #f1f5f9', padding: '16px' }
        }}
      >
        <div className="flex flex-col h-full">
          {/* Driver Summary Stats */}
          <div className="grid grid-cols-2 gap-4 p-6 bg-white border-b border-gray-100">
            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50 flex flex-col gap-1">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Total Spent</span>
              <span className="text-2xl font-black text-indigo-600">₹{Number(driverHistoryData?.summary?.total_spent || 0).toLocaleString()}</span>
            </div>
            <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 flex flex-col gap-1">
              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Total Subscriptions</span>
              <span className="text-2xl font-black text-amber-600">{driverHistoryData?.summary?.total_subscriptions || 0}</span>
            </div>
          </div>

          {/* AI Suggestions / Insights */}
          {driverHistoryData?.summary?.total_subscriptions > 0 && (
            <div className="p-6">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-amber-300" />
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Operational Insight</span>
                  </div>
                  <p className="text-sm font-bold leading-relaxed">
                    {(() => {
                      const spent = Number(driverHistoryData?.summary?.total_spent || 0);
                      const history = driverHistoryData?.history || [];
                      const weeklyCount = history.filter((h: any) => h.billing_cycle === 'WEEKLY').length;
                      const dailyCount = history.filter((h: any) => h.billing_cycle === 'DAILY').length;
                      
                      if (weeklyCount >= 3) return "This driver is a frequent weekly subscriber. Suggesting a Monthly Plan could increase retention by 40% and save them ₹500/month.";
                      if (dailyCount >= 10) return "High-frequency daily user detected. Transitioning to Weekly or Monthly billing would reduce transaction friction.";
                      if (spent > 5000) return "V.I.P Driver identified based on lifetime value. Consider offering a loyalty discount on their next Elite plan.";
                      return "Driver shows stable subscription patterns. Keep them engaged with upcoming promotional offers.";
                    })()}
                  </p>
                </div>
                <div className="absolute right-[-20px] top-[-20px] opacity-10">
                  <Zap size={100} fill="white" />
                </div>
              </div>
            </div>
          )}

          {/* History Table */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-6 py-3 border-b border-gray-100 bg-white flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subscription History</span>
              <History size={14} className="text-gray-300" />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-gray-50/80 backdrop-blur-md z-10">
                  <tr>
                    <th className="px-6 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Plan</th>
                    <th className="px-6 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">Amount</th>
                    <th className="px-6 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">Date Range</th>
                    <th className="px-6 py-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {driverHistoryLoading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={4} className="px-6 py-4"><div className="h-4 bg-gray-50 rounded w-full"></div></td>
                      </tr>
                    ))
                  ) : driverHistoryData?.history?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-800">{item.plan_name}</span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{item.billing_cycle}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs font-black text-indigo-600">₹{Number(item.amount || 0).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-500">
                            {new Date(item.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-[9px] text-gray-300 font-medium">
                            to {new Date(item.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Tag color={item.status === 'active' ? 'green' : 'default'} className="m-0 text-[9px] font-black uppercase border-0 px-2 py-0.5 rounded-md">
                          {item.status}
                        </Tag>
                      </td>
                    </tr>
                  ))}
                  {!driverHistoryLoading && (!driverHistoryData?.history || driverHistoryData.history.length === 0) && (
                    <tr>
                      <td colSpan={4} className="px-6 py-20 text-center text-gray-400 text-xs italic">
                        No subscription history found for this driver.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
