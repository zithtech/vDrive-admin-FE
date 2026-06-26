import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Zap,
  ChevronDown,
  Users,
  Power,
  CheckCircle2,
  Activity,
  Eye,
  Mail,
  Phone,
  BellRing,
} from "lucide-react";
import SubscriptionDrawer from "../../components/RechargePlan/SubscriptionDrawer";
import axios from "../../api/axios";
import { messageApi } from "../../utilities/antdStaticHolder";
import { Select, Spin, Pagination } from "antd";
import { getMediaUrl } from "../../components/DriverDetails/DriverDetails";


/* ================= TYPES ================= */



/* ================= UTILS ================= */

/* ================= COMPONENT ================= */

const Subscriptions: React.FC = () => {
  const [activeSubscriptions, setActiveSubscriptions] = useState<any[]>([]);
  const [loadingActiveSubs, setLoadingActiveSubs] = useState(false);
  const [expiredSubscriptions, setExpiredSubscriptions] = useState<any[]>([]);
  const [loadingExpiredSubs, setLoadingExpiredSubs] = useState(false);
  const [subscriptionTab, setSubscriptionTab] = useState<"ACTIVE" | "EXPIRED">("ACTIVE");

  const [subSearchTerm, setSubSearchTerm] = useState<string>("");
  const [subFilter, setSubFilter] = useState<string>("ALL");
  const [billingCycleFilter, setBillingCycleFilter] = useState<string>("ALL");
  const [remainingDaysFilter, setRemainingDaysFilter] = useState<string>("");

  const [subStats, setSubStats] = useState<any>(null);
  const [isDriverHistoryOpen, setIsDriverHistoryOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [notifyingSubscribers, setNotifyingSubscribers] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [subscriptionTab, subSearchTerm, subFilter, billingCycleFilter, remainingDaysFilter]);

  const filteredSubscriptions = useMemo(() => {
    const list = subscriptionTab === "ACTIVE" ? activeSubscriptions : expiredSubscriptions;
    return list.filter((s) => {
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
    });
  }, [subscriptionTab, activeSubscriptions, expiredSubscriptions, subSearchTerm, subFilter, billingCycleFilter, remainingDaysFilter]);

  useEffect(() => {
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


  /* ---- Handlers ---- */

  return (
    <div className="flex flex-row h-full w-full bg-[#f8f9fa] dark:bg-[#0b0f19] overflow-hidden">
      {/* SIDEBAR */}
      <div className="w-[260px] flex-shrink-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-18 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-lg text-slate-1000 dark:text-slate-200  tracking-wider">
                <b>Subscription</b>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-1 leading-snug">
                Monitor active subscriptions and manage plan renewals
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
                className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md transition-colors"
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
                <div className="text-[12px] font-black text-emerald-600 dark:text-emerald-500 mt-0.5">₹{Number(subStats?.today_amount || 0).toLocaleString()}</div>
              </div>

              {/* Week Segment */}
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">This Week</span>
                <div className="text-sm font-black text-slate-900 dark:text-slate-100">{subStats?.week_count || 0}</div>
                <div className="text-[12px] font-black text-emerald-600 dark:text-emerald-500 mt-0.5">₹{Number(subStats?.week_amount || 0).toLocaleString()}</div>
              </div>

              {/* Month Segment */}
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">This Month</span>
                <div className="text-sm font-black text-slate-900 dark:text-slate-100">{subStats?.month_count || 0}</div>
                <div className="text-[12px] font-black text-emerald-600 dark:text-emerald-500 mt-0.5">₹{Number(subStats?.month_amount || 0).toLocaleString()}</div>
              </div>

              {/* Lifetime Segment */}
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Lifetime</span>
                <div className="text-sm font-black text-slate-900 dark:text-slate-100">{subStats?.lifetime_count || 0}</div>
                <div className="text-[12px] font-black text-emerald-600 dark:text-emerald-500 mt-0.5">₹{Number(subStats?.lifetime_amount || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-white dark:bg-[#0b0f19]">
        {/* Top Header Strip */}
        <div className="bg-white dark:bg-slate-800 px-6 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 shadow-sm z-0 flex-shrink-0">
          <div className="relative flex-1 max-w-3xl flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
            <Search className="absolute left-3 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search drivers..."
              className="w-full pl-9 pr-4 py-1 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400"
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
            <span className="text-[11px] font-black tracking-widest uppercase text-blue-600 dark:text-blue-400 mr-2">SUBSCRIPTION TRACKING</span>
          </div>
        </div>

        {/* Outer wrapper for scrollable content and sticky footer */}
        <div className="flex-grow flex flex-col min-w-0 relative h-full">
          {/* Content Scrollable Area */}
          <div className="flex-grow overflow-y-auto px-6 py-4 bg-white dark:bg-slate-900 flex flex-col gap-4 pb-20 custom-scrollbar">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-2">
            {/* 1. Total Subs */}
            <div className="bg-white dark:bg-slate-900 px-5 pt-2 pb-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[90px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center text-base bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
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
                <div className="w-20 h-8 mb-[-2px]">
                  <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,40 L10,30 L20,35 L40,10 L60,25 L80,5 L100,20" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                    <path d="M0,40 L10,30 L20,35 L40,10 L60,25 L80,5 L100,20 L100,40 Z" fill="url(#gradient-blue)" opacity="0.1" />
                    <defs>
                      <linearGradient id="gradient-blue" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* 2. Active Subs */}
            <div className="bg-white dark:bg-slate-900 px-5 pt-2 pb-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[90px]">
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
                <div className="w-20 h-8 mb-[-2px]">
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
            <div className="bg-white dark:bg-slate-900 px-5 pt-2 pb-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[90px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center text-base bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400">
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
                <div className="w-20 h-8 mb-[-2px]">
                  <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,40 L10,25 L30,30 L50,15 L70,20 L90,5 L100,10" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                    <path d="M0,40 L10,25 L30,30 L50,15 L70,20 L90,5 L100,10 L100,40 Z" fill="url(#gradient-red)" opacity="0.1" />
                    <defs>
                      <linearGradient id="gradient-red" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>

            {/* 4. Today Subs */}
            <div className="bg-white dark:bg-slate-900 px-5 pt-2 pb-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[90px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center text-base bg-slate-100 dark:bg-slate-500/20 text-slate-500 dark:text-slate-400">
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
                <div className="w-20 h-8 mb-[-2px]">
                  <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
                    <path d="M0,40 L20,38 L40,35 L60,32 L80,30 L100,28" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
                    <path d="M0,40 L20,38 L40,35 L60,32 L80,30 L100,28 L100,40 Z" fill="url(#gradient-slate)" opacity="0.1" />
                    <defs>
                      <linearGradient id="gradient-slate" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#64748b" />
                        <stop offset="100%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 overflow-hidden rounded-none">
            <div className="px-5 py-2.5 border-b border-gray-50 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <div className="py-0.5 px-2 bg-blue-50 text-blue-500 rounded-md font-outfit text-[10px] font-extrabold tracking-tighter">
                  LIVE FEED
                </div>
                <div className="h-4 w-px bg-gray-100 dark:bg-slate-600"></div>
                <div className="flex items-center bg-slate-50 dark:bg-slate-900/50 p-0.5 rounded-md border border-slate-100 dark:border-slate-700/50">
                  <button
                    onClick={() => setSubscriptionTab("ACTIVE")}
                    className={`px-3 py-1.5 rounded text-sm font-bold transition-all ${
                      subscriptionTab === "ACTIVE"
                        ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700"
                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border border-transparent"
                    }`}
                  >
                    Active Subs
                  </button>
                  <button
                    onClick={() => setSubscriptionTab("EXPIRED")}
                    className={`px-3 py-1.5 rounded text-sm font-bold transition-all ${
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
                className="flex items-center gap-1.5 px-3 h-[28px] rounded-md text-[11px] font-bold bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-50"
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
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-transparent whitespace-nowrap">
                      Driver Identity
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-transparent whitespace-nowrap">
                      Communication
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-transparent whitespace-nowrap">
                      Driver ID
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-transparent whitespace-nowrap">
                      Plan Config
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-transparent whitespace-nowrap">
                      Plan Amount
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-transparent whitespace-nowrap">
                      Billing Cycle
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-transparent whitespace-nowrap">
                      Timeline Progress
                    </th>
                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider bg-transparent border-l border-gray-100 dark:border-slate-700/60 text-center w-24 whitespace-nowrap">
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
                  ) : filteredSubscriptions.length > 0 ? (
                    filteredSubscriptions
                      .slice((currentPage - 1) * pageSize, currentPage * pageSize)
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

                        let badgeClass =
                          "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20";

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
                              <td className="px-6 py-2 whitespace-nowrap">
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
                              <td className="px-6 py-2">
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
                              <td className="px-6 py-2">
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
                              <td className="px-6 py-2">
                                <span
                                  className={`text-[11px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${badgeClass}`}
                                >
                                  {sub.planName}
                                </span>
                              </td>
                              <td className="px-6 py-2">
                                <span className="text-[14px] font-black text-slate-800 dark:text-slate-200 tracking-tighter">
                                  ₹{Number(sub.amountPaid || sub.price || 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="px-6 py-2">
                                <div className="flex flex-col items-start">
                                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-500/20">
                                    {sub.billingCycle}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-2 w-96 whitespace-nowrap">
                                <div className="flex items-center gap-4 w-full pr-4">
                                  <div className="flex items-center gap-3 w-48">
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

                                  <div className="flex items-center gap-3 shrink-0">
                                    <div
                                      className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest ${tagClasses}`}
                                    >
                                      {tagText}
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                      {cycleStr}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-2 text-center border-l border-gray-100 dark:border-slate-700/60 w-24">
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
          
        {/* Sticky Bottom Pagination Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 px-6 flex items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] overflow-x-auto gap-4 custom-scrollbar">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap flex-shrink-0">
              Showing {filteredSubscriptions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, filteredSubscriptions.length)} of {filteredSubscriptions.length} subscriptions
            </span>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredSubscriptions.length}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              showSizeChanger
              pageSizeOptions={["10", "20", "50", "100"]}
              size="small"
              className="premium-pagination"
            />
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