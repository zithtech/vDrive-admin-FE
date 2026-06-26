import React, { useState, useEffect } from "react";
import {
  Search,
  Zap,
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
  const [pageSize, setPageSize] = useState<number>(15);


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

  useEffect(() => {
    setCurrentPage(1);
  }, [subSearchTerm, subFilter, billingCycleFilter, remainingDaysFilter, subscriptionTab]);

  const filteredSubscriptions = (subscriptionTab === "ACTIVE" ? activeSubscriptions : expiredSubscriptions).filter((s) => {
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

  const displayedSubscriptions = filteredSubscriptions.slice(
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
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 !m-0 !mb-1 leading-none">Subscriptions</h1>
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0">Management</p>
        </div>

        <div className="relative flex-1 max-w-xl mx-auto flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all h-9">
          <Search className="absolute left-3 text-slate-400 text-[16px]" />
          <input
            type="text"
            placeholder="Search drivers..."
            className="w-full pl-10 pr-4 py-1.5 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400 border-none shadow-none focus:ring-0"
            value={subSearchTerm}
            onChange={(e) => setSubSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {subscriptionTab === "ACTIVE" ? activeSubscriptions.length : expiredSubscriptions.length} results
          </span>
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
                onClick={() => setSubscriptionTab("ACTIVE")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${subscriptionTab === "ACTIVE"
                  ? "bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Active Subs</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${subscriptionTab === "ACTIVE"
                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {activeSubscriptions.length}
                </span>
              </div>

              <div
                onClick={() => setSubscriptionTab("EXPIRED")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${subscriptionTab === "EXPIRED"
                  ? "bg-rose-50/80 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <Power size={14} className="text-amber-500" />
                  <span>Expired Subs</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${subscriptionTab === "EXPIRED"
                  ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {expiredSubscriptions.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right Content Area ─────────────────────────────────────── */}
        <div className="flex-grow flex flex-col min-w-0 relative h-full">
          <div className="flex-grow flex flex-col p-3 overflow-y-auto custom-scrollbar gap-2 pb-20">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-1">
              {/* 1. Total Subs */}
              <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center text-base bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 z-10">
                      <Users size={14} />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest z-10">TOTAL SUBS</p>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2 z-10">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{activeSubscriptions.length + expiredSubscriptions.length}</h3>
                      <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider">LIFETIME</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 text-[100px] opacity-[0.04] pointer-events-none text-indigo-600 dark:text-indigo-400">
                    <Users size={100} />
                  </div>
                </div>
              </div>

              {/* 2. Active Subs */}
              <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center text-base bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 z-10">
                      <CheckCircle2 size={14} />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest z-10">ACTIVE SUBS</p>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2 z-10">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{activeSubscriptions.length}</h3>
                      <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider">LIVE</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 text-[100px] opacity-[0.04] pointer-events-none text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={100} />
                  </div>
                </div>
              </div>

              {/* 3. Expired Subs */}
              <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center text-base bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 z-10">
                      <Power size={14} />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest z-10">EXPIRED</p>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2 z-10">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{expiredSubscriptions.length}</h3>
                      <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider">ENDED</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 text-[100px] opacity-[0.04] pointer-events-none text-amber-500 dark:text-amber-400">
                    <Power size={100} />
                  </div>
                </div>
              </div>

              {/* 4. Today Subs */}
              <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center text-base bg-rose-50 dark:bg-rose-500/10 text-rose-500 dark:text-rose-400 z-10">
                      <Activity size={14} />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest z-10">TODAY</p>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2 z-10">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{subStats?.today_count || 0}</h3>
                      <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider">NEW TODAY</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 text-[100px] opacity-[0.04] pointer-events-none text-rose-600 dark:text-rose-400">
                    <Activity size={100} />
                  </div>
                </div>
              </div>
            </div>

            {/* REAL-TIME REVENUE */}
            <div className="bg-white dark:bg-slate-800 p-4 mb-1 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-6 rounded-none">
              <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-6 shrink-0">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">REAL-TIME REVENUE</span>
                <button
                  onClick={fetchActiveSubscriptions}
                  className="ml-2 p-1 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-colors"
                  title="Sync Data"
                >
                  <Zap size={14} />
                </button>
              </div>

              <div className="flex-1 grid grid-cols-4 gap-4">
                {/* Today Segment */}
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Today</span>
                  <div className="flex items-baseline gap-2">
                    <div className="text-sm font-black text-slate-900 dark:text-slate-100">{subStats?.today_count || 0}</div>
                    <div className="text-[10px] font-bold text-indigo-600">₹{Number(subStats?.today_amount || 0).toLocaleString()}</div>
                  </div>
                </div>
                {/* Week Segment */}
                <div className="flex flex-col border-l border-slate-200 dark:border-slate-700 pl-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">This Week</span>
                  <div className="flex items-baseline gap-2">
                    <div className="text-sm font-black text-slate-900 dark:text-slate-100">{subStats?.week_count || 0}</div>
                    <div className="text-[10px] font-bold text-emerald-600">₹{Number(subStats?.week_amount || 0).toLocaleString()}</div>
                  </div>
                </div>
                {/* Month Segment */}
                <div className="flex flex-col border-l border-slate-200 dark:border-slate-700 pl-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">This Month</span>
                  <div className="flex items-baseline gap-2">
                    <div className="text-sm font-black text-slate-900 dark:text-slate-100">{subStats?.month_count || 0}</div>
                    <div className="text-[10px] font-bold text-purple-600">₹{Number(subStats?.month_amount || 0).toLocaleString()}</div>
                  </div>
                </div>
                {/* Lifetime Segment */}
                <div className="flex flex-col border-l border-slate-200 dark:border-slate-700 pl-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Lifetime</span>
                  <div className="flex items-baseline gap-2">
                    <div className="text-sm font-black text-slate-900 dark:text-slate-100">{subStats?.lifetime_count || 0}</div>
                    <div className="text-[10px] font-bold text-amber-600">₹{Number(subStats?.lifetime_amount || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* HORIZONTAL FILTERS BAR */}
            <div className="bg-white dark:bg-[#0f172a] p-3 mb-1 border border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-sm rounded-none dark-theme-select-override">
              <div className="flex items-center gap-2 px-3 border-r border-slate-200 dark:border-slate-700 text-slate-400 shrink-0">
                <Zap size={16} className="text-indigo-500" />
                <span className="text-[11px] font-black uppercase tracking-widest">FILTERS</span>
              </div>

              <div className="flex-1 flex items-center gap-4 overflow-x-auto custom-scrollbar pb-1 -mb-1">
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plan Type:</span>
                  <Select
                    value={subFilter}
                    onChange={setSubFilter}
                    className="w-32 premium-select-sidebar custom-driver-select"
                    options={[
                      { value: "ALL", label: "All Plans" },
                      { value: "BASIC", label: "Basic" },
                      { value: "ELITE", label: "Elite" },
                      { value: "PREMIUM", label: "Premium" },
                    ]}
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0 border-l border-slate-200 dark:border-slate-700 pl-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cycle:</span>
                  <Select
                    value={billingCycleFilter}
                    onChange={setBillingCycleFilter}
                    className="w-32 premium-select-sidebar custom-driver-select"
                    options={[
                      { value: "ALL", label: "All Cycles" },
                      { value: "DAILY", label: "Daily" },
                      { value: "WEEKLY", label: "Weekly" },
                      { value: "MONTHLY", label: "Monthly" },
                    ]}
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0 border-l border-slate-200 dark:border-slate-700 pl-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Days Left:</span>
                  <input
                    type="number"
                    placeholder="e.g. 1"
                    value={remainingDaysFilter}
                    onChange={(e) => setRemainingDaysFilter(e.target.value)}
                    className="w-20 h-8 px-2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0f172a] text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    min="0"
                  />
                </div>

                {(subFilter !== "ALL" || billingCycleFilter !== "ALL" || remainingDaysFilter !== "") && (
                  <button
                    onClick={() => {
                      setSubFilter("ALL");
                      setBillingCycleFilter("ALL");
                      setRemainingDaysFilter("");
                    }}
                    className="ml-auto px-3 py-1.5 rounded text-[11px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-slate-700 overflow-hidden rounded-none shadow-sm">
              <div className="px-5 py-4 border-b border-gray-50 dark:border-slate-800 flex justify-end items-center bg-white dark:bg-[#0f172a]">
                <button
                  onClick={handleNotifyExpiring}
                  disabled={notifyingSubscribers}
                  className="flex items-center gap-2 px-4 h-[32px] rounded-lg text-[12px] font-bold bg-white dark:bg-[#0f172a] text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
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
                    ) : filteredSubscriptions.length > 0 ? (
                      displayedSubscriptions.map((sub: any) => {
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
                                className={`group bg-white dark:bg-transparent hover:bg-indigo-50/30 dark:hover:bg-slate-800 transition-colors cursor-pointer border-b border-gray-50 dark:border-slate-700/50`}
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
                                    <div className="flex items-center gap-2 w-full">
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
                        <td colSpan={8} className="px-6 py-20 text-center bg-white dark:bg-[#0f172a]">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-white dark:bg-[#0f172a] rounded-full text-slate-200 border border-slate-100 dark:border-slate-700">
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

            {/* Sticky Pagination Footer */}
            <div className="absolute bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-805 px-6 flex items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                Showing {filteredSubscriptions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
                {Math.min(currentPage * pageSize, filteredSubscriptions.length)} of {filteredSubscriptions.length} subscriptions
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
                pageSizeOptions={[10, 15, 20, 50, 100]}
                size="small"
              />
            </div>
          </div>
        </div>
      </div>
      <SubscriptionDrawer
        visible={isDriverHistoryOpen}
        onClose={() => setIsDriverHistoryOpen(false)}
        driver={selectedDriver}
      />
      <style>{`
        .custom-driver-select .ant-select-selector {
          border-radius: 8px !important;
          border-color: #cbd5e1 !important;
          height: 34px !important;
        }

        .dark .dark-theme-select-override .custom-driver-select {
          border-color: #334155 !important;
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
        }
        
        .dark .dark-theme-select-override .ant-select-selector,
        html.dark .dark-theme-select-override .ant-select-selector {
          border-color: #334155 !important;
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
        }
        
        .dark .dark-theme-select-override .ant-select-selection-item,
        html.dark .dark-theme-select-override .ant-select-selection-item {
          color: #f1f5f9 !important;
          background-color: #1e293b !important;
          border-color: #334155 !important;
        }
        
        .dark .dark-theme-select-override .ant-select-selection-placeholder,
        html.dark .dark-theme-select-override .ant-select-selection-placeholder {
          color: #64748b !important;
        }
        
        .dark .dark-theme-select-override .ant-select-arrow,
        html.dark .dark-theme-select-override .ant-select-arrow {
          color: #64748b !important;
        }
        
        .dark .dark-theme-select-override .ant-select-clear,
        html.dark .dark-theme-select-override .ant-select-clear {
          background-color: transparent !important;
          color: #64748b !important;
        }
      `}</style>
    </div>
  );
};

export default Subscriptions;