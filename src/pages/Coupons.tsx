import React, { useEffect, useState } from "react";
import { Button, Modal, notification, Pagination } from "antd";
import {
  PlusOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  TagOutlined,
  GiftOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CarOutlined,
} from "@ant-design/icons";
import { IoMdRefresh } from "react-icons/io";
import { Gift } from "lucide-react";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchCoupons,
  addCoupon,
  updateCoupon,
  updateCouponStatus,
  deleteCoupon,
  type Coupon,
} from "../store/slices/couponSlice";
import {
  fetchReferralConfigs,
  addReferralConfig,
  updateReferralConfig,
  deleteReferralConfig,
  fetchReferralLogs,
  type ReferralConfig,
  type ReferralConfigPayload,
} from "../store/slices/referralSlice";
import CouponTable from "../components/Coupons/CouponTable";
import CouponFormDrawer from "../components/Coupons/CouponFormDrawer";
import ReferralTable from "../components/Referrals/ReferralTable";
import ReferralFormDrawer from "../components/Referrals/ReferralFormDrawer";
import ReferralLogsTable from "../components/Referrals/ReferralLogsTable";
import PromoDrawer from "../components/Promos/PromoDrawer";
import axios from "../api/axios";
import { fetchPromos, updatePromoStatus, addPromo, updatePromo } from "../store/slices/promoSlice";
import { useHasPermission } from "../hooks/usePermission";

const { confirm } = Modal;


const CouponsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { coupons, isLoading: couponsLoading } = useAppSelector((state) => state.coupon);
  const { promos } = useAppSelector((state) => state.promo);
  const { configs, logs, isLoading: referralsLoading } = useAppSelector((state) => state.referral);
  const { role } = useAppSelector((state) => state.auth);
  const isSuperAdmin = role === "super_admin";

  const hasCouponsRead = useHasPermission("coupons", "read");
  const hasPromosRead = useHasPermission("promos", "read");
  const hasUserReferralsRead = useHasPermission("user_referrals", "read");
  const hasDriverReferralsRead = useHasPermission("driver_referrals", "read");

  const [mainTab, setMainTab] = useState<"CUSTOMER" | "DRIVER">("CUSTOMER");
  const [subTab, setSubTab] = useState<"COUPONS" | "REFERRALS" | "LOGS">("COUPONS");

  const [couponDrawerVisible, setCouponDrawerVisible] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [promoDrawerVisible, setPromoDrawerVisible] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);

  const [referralDrawerVisible, setReferralDrawerVisible] = useState(false);
  const [editingReferral, setEditingReferral] = useState<ReferralConfig | null>(null);

  const [globalSearch, setGlobalSearch] = useState("");
  const [codeFilter, setCodeFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  useEffect(() => {
    setCurrentPage(1);
  }, [subTab, mainTab]);

  // Dynamically switch active subtab if permissions are missing
  useEffect(() => {
    const canReadCoupons = isSuperAdmin || hasCouponsRead;
    const canReadPromos = isSuperAdmin || hasPromosRead;
    const canReadUserReferrals = isSuperAdmin || hasUserReferralsRead;
    const canReadDriverReferrals = isSuperAdmin || hasDriverReferralsRead;

    if (!canReadCoupons && !canReadPromos && (canReadUserReferrals || canReadDriverReferrals)) {
      setSubTab("REFERRALS");
    } else if (canReadCoupons || canReadPromos) {
      setSubTab("COUPONS");
    }
  }, [isSuperAdmin, hasCouponsRead, hasPromosRead, hasUserReferralsRead, hasDriverReferralsRead]);

  // Dynamically switch active main tab if permissions are missing
  useEffect(() => {
    const canReadCoupons = isSuperAdmin || hasCouponsRead;
    const canReadPromos = isSuperAdmin || hasPromosRead;
    const canReadUserReferrals = isSuperAdmin || hasUserReferralsRead;
    const canReadDriverReferrals = isSuperAdmin || hasDriverReferralsRead;

    if (subTab === "COUPONS") {
      if (!canReadCoupons && canReadPromos) {
        setMainTab("DRIVER");
      } else if (canReadCoupons) {
        setMainTab("CUSTOMER");
      }
    } else {
      if (!canReadUserReferrals && canReadDriverReferrals) {
        setMainTab("DRIVER");
      } else if (canReadUserReferrals) {
        setMainTab("CUSTOMER");
      }
    }
  }, [
    subTab,
    isSuperAdmin,
    hasCouponsRead,
    hasPromosRead,
    hasUserReferralsRead,
    hasDriverReferralsRead,
  ]);

  // Conditional data fetching
  useEffect(() => {
    if (isSuperAdmin || hasCouponsRead) dispatch(fetchCoupons());
    if (isSuperAdmin || hasPromosRead) dispatch(fetchPromos());
    if (isSuperAdmin || hasUserReferralsRead || hasDriverReferralsRead) dispatch(fetchReferralConfigs());
  }, [dispatch, isSuperAdmin, hasCouponsRead, hasPromosRead, hasUserReferralsRead, hasDriverReferralsRead]);

  useEffect(() => {
    if (subTab === "LOGS") dispatch(fetchReferralLogs(mainTab));
  }, [dispatch, subTab, mainTab]);

  const currentModule =
    subTab === "COUPONS"
      ? mainTab === "CUSTOMER" ? "coupons" : "promos"
      : // Referral management (both customer & driver) hits one BE endpoint gated by
        // `user_referrals`, so gate the buttons on it too to match enforcement.
        "user_referrals";

  const canCreate = useHasPermission(currentModule, "create");
  const canUpdate = useHasPermission(currentModule, "update");
  const canDelete = useHasPermission(currentModule, "delete");

  const hasCreateAccess = isSuperAdmin || canCreate;
  const hasUpdateAccess = isSuperAdmin || canUpdate;
  const hasDeleteAccess = isSuperAdmin || canDelete;

  const handleCreateNew = () => {
    if (subTab === "COUPONS") {
      if (mainTab === "CUSTOMER") {
        setEditingCoupon(null);
        setCouponDrawerVisible(true);
      } else {
        setEditingPromo(null);
        setPromoDrawerVisible(true);
      }
    } else {
      setEditingReferral(null);
      setReferralDrawerVisible(true);
    }
  };

  const handleRefresh = () => {
    if (subTab === "COUPONS") {
      if (mainTab === "CUSTOMER") dispatch(fetchCoupons());
      else dispatch(fetchPromos());
    } else if (subTab === "REFERRALS") {
      dispatch(fetchReferralConfigs());
    } else {
      dispatch(fetchReferralLogs(mainTab));
    }
  };

  // Coupon Handlers
  const handleCouponEdit = (record: any) => {
    if (mainTab === "CUSTOMER") {
      setEditingCoupon(record);
      setCouponDrawerVisible(true);
    } else {
      setEditingPromo(record);
      setPromoDrawerVisible(true);
    }
  };

  const handleCouponDelete = (id: string) => {
    confirm({
      title: mainTab === "CUSTOMER" ? "Delete Coupon?" : "Delete Promotion?",
      icon: <ExclamationCircleOutlined />,
      content: "This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        if (mainTab === "CUSTOMER") {
          dispatch(deleteCoupon(id)).then((res: any) => {
            if (!res.hasOwnProperty("error")) notification.success({ message: "Coupon deleted" });
          });
        } else {
          try {
            await axios.delete(`/api/promos/${id}`);
            notification.success({ message: "Promo deleted" });
            dispatch(fetchPromos());
          } catch (err) {
            notification.error({ message: "Failed to delete" });
          }
        }
      },
    });
  };

  const handleCouponToggle = (id: string, is_active: boolean) => {
    if (mainTab === "CUSTOMER") {
      dispatch(updateCouponStatus({ id, is_active })).then((res: any) => {
        if (!res.hasOwnProperty("error")) notification.success({ message: `Coupon ${is_active ? "activated" : "disabled"}` });
      });
    } else {
      dispatch(updatePromoStatus({ id: Number(id), is_active })).then((res: any) => {
        if (!res.hasOwnProperty("error")) notification.success({ message: `Promo ${is_active ? "activated" : "disabled"}` });
      });
    }
  };

  const handleCouponSubmit = (values: any) => {
    if (mainTab === "CUSTOMER") {
      if (editingCoupon) {
        dispatch(updateCoupon({ id: editingCoupon.id, couponData: values })).then((res: any) => {
          if (!res.hasOwnProperty("error")) { notification.success({ message: "Updated" }); setCouponDrawerVisible(false); }
        });
      } else {
        dispatch(addCoupon(values)).then((res: any) => {
          if (!res.hasOwnProperty("error")) { notification.success({ message: "Created" }); setCouponDrawerVisible(false); }
        });
      }
    } else {
      if (editingCoupon) {
        dispatch(updatePromo({ id: Number(editingCoupon.id), promoData: values })).then((res: any) => {
          if (!res.hasOwnProperty("error")) { notification.success({ message: "Promo Updated" }); setCouponDrawerVisible(false); }
        });
      } else {
        dispatch(addPromo(values)).then((res: any) => {
          if (!res.hasOwnProperty("error")) { notification.success({ message: "Promo Created" }); setCouponDrawerVisible(false); }
        });
      }
    }
  };

  // Referral Handlers
  const handleReferralEdit = (record: ReferralConfig) => {
    setEditingReferral(record);
    setReferralDrawerVisible(true);
  };

  const handleReferralDelete = (id: string) => {
    confirm({
      title: "Delete Referral Rule?",
      onOk() {
        dispatch(deleteReferralConfig(id)).then((res: any) => {
          if (!res.hasOwnProperty("error")) notification.success({ message: "Deleted" });
        });
      },
    });
  };

  const handleReferralToggle = (id: string, is_active: boolean) => {
    dispatch(updateReferralConfig({ id, data: { is_active } })).then((res: any) => {
      if (!res.hasOwnProperty("error")) notification.success({ message: `Rule ${is_active ? "activated" : "disabled"}` });
    });
  };

  const handleReferralSubmit = (values: ReferralConfigPayload) => {
    if (editingReferral) {
      dispatch(updateReferralConfig({ id: editingReferral.id, data: values })).then((res: any) => {
        if (!res.hasOwnProperty("error")) { notification.success({ message: "Updated" }); setReferralDrawerVisible(false); }
      });
    } else {
      dispatch(addReferralConfig(values)).then((res: any) => {
        if (!res.hasOwnProperty("error")) { notification.success({ message: "Created" }); setReferralDrawerVisible(false); }
      });
    }
  };

  const filteredCoupons = mainTab === "CUSTOMER" ? coupons : (promos as any);
  const filteredReferrals = configs.filter((r) => r.user_type === mainTab);

  const applyGlobalSearch = (data: any[], keyField: string) => {
    if (!globalSearch) return data;
    const lowerSearch = globalSearch.toLowerCase();
    return data.filter((item) => {
      if (item[keyField] && item[keyField].toLowerCase().includes(lowerSearch)) return true;
      if (item.code && item.code.toLowerCase().includes(lowerSearch)) return true;
      return false;
    });
  };

  const applyCodeFilter = (data: any[]) => {
    if (!codeFilter) return data;
    const lowerSearch = codeFilter.toLowerCase();
    return data.filter((item) => {
      if (item.code && item.code.toLowerCase().includes(lowerSearch)) return true;
      return false;
    });
  };

  const currentDataCoupons = Array.isArray(filteredCoupons) ? applyCodeFilter(applyGlobalSearch(filteredCoupons, "code")) : [];
  const currentDataReferrals = Array.isArray(filteredReferrals) ? applyGlobalSearch(filteredReferrals, "rule_name") : [];
  const currentDataLogs = Array.isArray(logs) ? applyGlobalSearch(logs, "referrer_name") : [];

  const currentCount = subTab === "COUPONS" ? currentDataCoupons.length : subTab === "REFERRALS" ? currentDataReferrals.length : currentDataLogs.length;
  const isLoading = couponsLoading || referralsLoading;

  // Stats Logic mapping 4 cards like Notifications
  const stats = React.useMemo(() => {
    let list: any[] = [];
    if (subTab === "COUPONS") list = currentDataCoupons;
    else if (subTab === "REFERRALS") list = currentDataReferrals;
    else list = currentDataLogs;

    if (subTab === "COUPONS") {
      return [
        {
          title: mainTab === "CUSTOMER" ? "Total Coupons" : "Total Promos",
          value: list.length,
          label: "records",
          icon: <GiftOutlined />,
          iconColor: "text-blue-500 dark:text-blue-400",
          iconBg: "bg-blue-50 dark:bg-blue-500/10",
          sparklineColor: "blue",
        },
        {
          title: "Active",
          value: list.filter((n: any) => n.is_active && !dayjs().isAfter(dayjs(n.valid_until || n.expiry_date))).length,
          label: "available",
          icon: <CheckCircleOutlined />,
          iconColor: "text-emerald-500 dark:text-emerald-400",
          iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
          sparklineColor: "green",
        },
        {
          title: "Disabled",
          value: list.filter((n: any) => !n.is_active).length,
          label: "inactive",
          icon: <ExclamationCircleOutlined />,
          iconColor: "text-amber-500 dark:text-blue-400",
          iconBg: "bg-amber-50 dark:bg-blue-500/10",
          sparklineColor: "orange",
        },
        {
          title: "Expired",
          value: list.filter((n: any) => dayjs().isAfter(dayjs(n.valid_until || n.expiry_date))).length,
          label: "outdated",
          icon: <ClockCircleOutlined />,
          iconColor: "text-rose-500 dark:text-rose-400",
          iconBg: "bg-rose-50 dark:bg-rose-500/10",
          sparklineColor: "red",
        },
      ];
    } else if (subTab === "REFERRALS") {
      return [
        {
          title: "Total Rules",
          value: list.length,
          label: "records",
          icon: <GiftOutlined />,
          iconColor: "text-blue-500 dark:text-blue-400",
          iconBg: "bg-blue-50 dark:bg-blue-500/10",
          sparklineColor: "blue",
        },
        {
          title: "Active Rules",
          value: list.filter((n: any) => n.is_active).length,
          label: "running",
          icon: <CheckCircleOutlined />,
          iconColor: "text-emerald-500 dark:text-emerald-400",
          iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
          sparklineColor: "green",
        },
        {
          title: "Disabled Rules",
          value: list.filter((n: any) => !n.is_active).length,
          label: "inactive",
          icon: <ExclamationCircleOutlined />,
          iconColor: "text-amber-500 dark:text-blue-400",
          iconBg: "bg-amber-50 dark:bg-blue-500/10",
          sparklineColor: "orange",
        },
      ];
    } else {
      return [
        {
          title: "Total Logs",
          value: list.length,
          label: "records",
          icon: <FileTextOutlined />,
          iconColor: "text-blue-500 dark:text-blue-400",
          iconBg: "bg-blue-50 dark:bg-blue-500/10",
          sparklineColor: "blue",
        }
      ];
    }
  }, [subTab, mainTab, currentDataCoupons, currentDataReferrals, currentDataLogs]);

  return (
    <>
      <div className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-slate-900">
        {/* Top Navbar */}
        <div className="bg-white dark:bg-slate-800 h-12 px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 z-0 flex-shrink-0 w-full">
          {/* Title & Description */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Gift size={16} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 !m-0 !mb-1 leading-none">Rewards</h1>
            <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0">Coupons & Promos</p>
          </div>

          <div className="relative flex-1 max-w-xl mx-auto flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all h-9">
            <SearchOutlined className="absolute left-3 text-slate-400 text-[16px]" />
            <input
              type="text"
              placeholder="Search promos or rules..."
              className="w-full pl-10 pr-4 py-1.5 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
            <div className="absolute right-3">
              <span className="text-[11px] font-bold text-slate-400 border border-slate-200 dark:border-slate-600 rounded-[4px] px-1.5 py-[1px] bg-slate-50/50 dark:bg-slate-800 tracking-wide">
                ⌘K
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[11px] font-black tracking-widest uppercase">
                {currentCount} RESULTS
              </span>
            </div>

            <button
              onClick={handleRefresh}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all shrink-0"
            >
              <IoMdRefresh className={`text-lg ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {hasCreateAccess && subTab !== "LOGS" && (
              <Button
                type="primary"
                icon={<PlusOutlined className="text-lg" />}
                onClick={handleCreateNew}
                className="px-4 h-10 rounded-lg font-bold text-xs uppercase tracking-wider border-none !bg-blue-600 hover:!bg-blue-700 text-white shadow-sm flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-all"
              >
                {subTab === "COUPONS"
                  ? mainTab === "CUSTOMER"
                    ? "Create Coupon"
                    : "Create Offer"
                  : "Create Rule"}
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Content Area */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* ─── Left Sidebar Panel ─────────────────────────────────────── */}
          <div className="w-[220px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 overflow-y-auto custom-scrollbar">
            {/* Sidenav views section */}
            <div className="flex flex-col gap-2 px-4 pt-6 pb-6">
              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase px-2 mb-0.5">
                Views
              </span>

              {(isSuperAdmin || hasCouponsRead || hasPromosRead) && (
                <div className="flex flex-col gap-1">
                  <div
                    onClick={() => setSubTab("COUPONS")}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${subTab === "COUPONS"
                      ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                      }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <TagOutlined className="text-xs" />
                      <span>Coupons</span>
                    </div>
                    {subTab === "COUPONS" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                        {currentDataCoupons.length}
                      </span>
                    )}
                  </div>

                  {subTab === "COUPONS" && (
                    <div className="flex flex-col gap-1 pl-4 mt-0.5">
                      <div
                        onClick={() => setMainTab("CUSTOMER")}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "CUSTOMER"
                          ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                          }`}
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <UserOutlined className="text-xs" />
                          <span>Customers Only</span>
                        </div>
                      </div>
                      <div
                        onClick={() => setMainTab("DRIVER")}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "DRIVER"
                          ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                          }`}
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <CarOutlined className="text-xs" />
                          <span>Drivers Only</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(isSuperAdmin || hasUserReferralsRead || hasDriverReferralsRead) && (
                <div className="flex flex-col gap-1">
                  <div
                    onClick={() => setSubTab("REFERRALS")}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${subTab === "REFERRALS"
                      ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                      }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <GiftOutlined className="text-xs" />
                      <span>Referral Rules</span>
                    </div>
                    {subTab === "REFERRALS" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                        {currentDataReferrals.length}
                      </span>
                    )}
                  </div>

                  {subTab === "REFERRALS" && (
                    <div className="flex flex-col gap-1 pl-4 mt-0.5">
                      <div
                        onClick={() => setMainTab("CUSTOMER")}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "CUSTOMER"
                          ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                          }`}
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <UserOutlined className="text-xs" />
                          <span>Customers Only</span>
                        </div>
                      </div>
                      <div
                        onClick={() => setMainTab("DRIVER")}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "DRIVER"
                          ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                          }`}
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <CarOutlined className="text-xs" />
                          <span>Drivers Only</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(isSuperAdmin || hasUserReferralsRead || hasDriverReferralsRead) && (
                <div className="flex flex-col gap-1">
                  <div
                    onClick={() => setSubTab("LOGS")}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${subTab === "LOGS"
                      ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                      }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <FileTextOutlined className="text-xs" />
                      <span>Referral Logs</span>
                    </div>
                    {subTab === "LOGS" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
                        {currentDataLogs.length}
                      </span>
                    )}
                  </div>

                  {subTab === "LOGS" && (
                    <div className="flex flex-col gap-1 pl-4 mt-0.5">
                      <div
                        onClick={() => setMainTab("CUSTOMER")}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "CUSTOMER"
                          ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                          }`}
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <UserOutlined className="text-xs" />
                          <span>Customers Only</span>
                        </div>
                      </div>
                      <div
                        onClick={() => setMainTab("DRIVER")}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${mainTab === "DRIVER"
                          ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                          }`}
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <CarOutlined className="text-xs" />
                          <span>Drivers Only</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ─── Right Content Area ─────────────────────────────────────── */}
          <div className="flex-grow flex flex-col min-w-0 relative h-full">
            <div className="flex-grow flex flex-col p-3 overflow-hidden gap-2 pb-20">


              {/* Status Cards Grid Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-0">
                {stats.map((card: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 flex items-center justify-center text-base ${card.iconBg} ${card.iconColor} z-10 rounded-lg`}>
                          {card.icon}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest z-10">
                          {card.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-end justify-between mt-2 z-10">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1.5">
                          <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">
                            {card.value}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-semibold mb-0.5 tracking-wider uppercase">
                            {card.label}
                          </span>
                        </div>
                      </div>
                      {/* Background Icon */}
                      <div className={`absolute -bottom-4 -right-4 text-[100px] opacity-[0.04] pointer-events-none ${card.iconColor}`}>
                        {card.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Horizontal Filters Toolbar */}
              {subTab === "COUPONS" && (
                <div className="flex items-center gap-4 py-1 border-y border-slate-100 dark:border-slate-800/80 mb-2 mt-2 bg-slate-50/50 dark:bg-[#0f172a] px-4 rounded-none">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Code:
                    </span>
                    <input
                      type="text"
                      placeholder="Filter by Promo Code"
                      value={codeFilter}
                      onChange={(e) => setCodeFilter(e.target.value)}
                      className="w-48 text-xs px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200 shadow-sm"
                    />
                  </div>
                </div>
              )}

              {/* Table Container */}
              <div className="flex-grow min-h-0 bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="h-full overflow-hidden flex flex-col">
                  {subTab === "COUPONS" ? (
                    <CouponTable
                      data={currentDataCoupons}
                      loading={couponsLoading}
                      onEdit={handleCouponEdit}
                      onDelete={handleCouponDelete}
                      onToggleStatus={handleCouponToggle}
                      onRefresh={handleRefresh}
                      canUpdate={hasUpdateAccess}
                      canDelete={hasDeleteAccess}
                      currentPage={currentPage}
                      pageSize={pageSize}
                      onPageChange={(page, size) => { setCurrentPage(page); setPageSize(size); }}
                    />
                  ) : subTab === "REFERRALS" ? (
                    <ReferralTable
                      data={currentDataReferrals}
                      loading={referralsLoading}
                      onEdit={handleReferralEdit}
                      onDelete={handleReferralDelete}
                      onToggleStatus={handleReferralToggle}
                      canUpdate={hasUpdateAccess}
                      canDelete={hasDeleteAccess}
                      currentPage={currentPage}
                      pageSize={pageSize}
                      onPageChange={(page, size) => { setCurrentPage(page); setPageSize(size); }}
                    />
                  ) : (
                    <ReferralLogsTable
                      data={currentDataLogs}
                      loading={referralsLoading}
                      type={mainTab}
                      currentPage={currentPage}
                      pageSize={pageSize}
                      onPageChange={(page, size) => { setCurrentPage(page); setPageSize(size); }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Bottom Pagination Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 px-6 flex items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                Showing {currentCount > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
                {Math.min(currentPage * pageSize, currentCount)} of {currentCount} records
              </span>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={currentCount}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                showSizeChanger
                pageSizeOptions={["5", "10", "15", "20", "50"]}
                size="small"
              />
            </div>
          </div>
        </div>

        <CouponFormDrawer
          visible={couponDrawerVisible}
          onClose={() => setCouponDrawerVisible(false)}
          onSubmit={handleCouponSubmit}
          initialValues={editingCoupon}
          defaultTarget={mainTab}
          loading={couponsLoading}
        />

        <ReferralFormDrawer
          visible={referralDrawerVisible}
          onClose={() => setReferralDrawerVisible(false)}
          onSubmit={handleReferralSubmit}
          initialValues={editingReferral}
          defaultTarget={mainTab}
          loading={referralsLoading}
        />

        <PromoDrawer
          visible={promoDrawerVisible}
          onClose={() => setPromoDrawerVisible(false)}
          promo={editingPromo}
          onSuccess={() => dispatch(fetchPromos())}
        />

        <style>{`
          .dark .ant-segmented {
            background-color: transparent !important;
          }
          .dark .ant-segmented-item-selected {
            background-color: #1e293b !important;
          }
          .dark .ant-segmented-item {
            color: #94a3b8;
          }

          /* Sidebar input styling overrides */
          .premium-select-sidebar.ant-select .ant-select-selector {
            border-radius: 8px !important;
            border-color: #cbd5e1 !important;
            height: 34px !important;
          }
          .dark .premium-select-sidebar.ant-select .ant-select-selector {
            border-color: #334155 !important;
            background-color: #0f172a !important;
            color: #f1f5f9 !important;
          }

          /* Pagination sharp border-radius and style overrides */
          .ant-pagination .ant-pagination-item,
          .ant-pagination .ant-pagination-prev,
          .ant-pagination .ant-pagination-next,
          .ant-pagination .ant-pagination-options-size-changer .ant-select-selector {
            border-radius: 0px !important;
          }
          .dark .ant-pagination-item a {
            color: #cbd5e1 !important;
          }
          .dark .ant-pagination-item-active a {
            color: #ffffff !important;
          }
          .dark .ant-pagination-prev .ant-pagination-item-link,
          .dark .ant-pagination-next .ant-pagination-item-link {
            color: #cbd5e1 !important;
            background-color: #0f172a !important;
            border-color: #334155 !important;
          }
          .dark .ant-pagination-item {
            background-color: #0f172a !important;
            border-color: #334155 !important;
          }
          .dark .ant-pagination-item-active {
            background-color: #2563eb !important;
            border-color: #2563eb !important;
          }
        `}</style>
      </div>
    </>
  );
};

export default CouponsPage;
