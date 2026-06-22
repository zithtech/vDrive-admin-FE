import React, { useEffect, useState } from "react";
import { Button, Modal, notification, Select, Spin, Pagination } from "antd";
import {
  PlusOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  TagOutlined,
  GiftOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { IoMdRefresh } from "react-icons/io";
import { Gift } from "lucide-react";
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
      : mainTab === "CUSTOMER" ? "user_referrals" : "driver_referrals";

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

  const currentDataCoupons = Array.isArray(filteredCoupons) ? applyGlobalSearch(filteredCoupons, "code") : [];
  const currentDataReferrals = Array.isArray(filteredReferrals) ? applyGlobalSearch(filteredReferrals, "rule_name") : [];
  const currentDataLogs = Array.isArray(logs) ? applyGlobalSearch(logs, "referrer_name") : [];

  const ViewItem = ({ icon, label, count, isActive, onClick, activeColorClass = "text-indigo-500", bgActiveColorClass = "bg-indigo-50/80 dark:bg-indigo-900/30", badgeColorClass = "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400" }: any) => (
    <div
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2 rounded-[10px] cursor-pointer transition-all ${isActive
        ? `${bgActiveColorClass} text-slate-800 dark:text-slate-100 font-bold`
        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-medium"
        }`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`text-[15px] ${isActive ? activeColorClass : "text-slate-400"}`}>{icon}</span>
        <span className="text-[13px] tracking-tight">{label}</span>
      </div>
      {isActive ? (
        <div className={`px-2 py-0.5 rounded-md text-[10px] font-black min-w-[20px] text-center ${badgeColorClass}`}>
          {count}
        </div>
      ) : (
        <div className="text-[11px] font-bold text-slate-400 mr-1">
          {count}
        </div>
      )}
    </div>
  );

  const TableSection = ({ children, flexClass = "flex-1", extraClasses = "" }: any) => (
    <div className={`${flexClass} flex flex-col min-h-[400px] bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700 overflow-hidden ${extraClasses}`}>
      <div className="flex-grow overflow-hidden">
        {children}
      </div>
    </div>
  );

  const currentCount = subTab === "COUPONS" ? currentDataCoupons.length : subTab === "REFERRALS" ? currentDataReferrals.length : currentDataLogs.length;
  const isLoading = couponsLoading || referralsLoading;

  return (
    <>
      <div className="flex h-full w-full overflow-hidden bg-white dark:bg-slate-900">
        {/* LEFT SIDEBAR */}
        <div className="w-[220px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0">
          {/* Sidebar Header */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3 text-slate-800 dark:text-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <Gift size={16} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col justify-center mt-0.5">
                <h2 className="font-black text-sm uppercase tracking-wider leading-none m-0">REWARDS</h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Coupons & Promos</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* VIEWS */}
            <div className="px-4 pt-6 pb-6 border-b border-slate-200 dark:border-slate-800/50">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2 mb-5">
                Record Type
              </p>
              <div className="flex flex-col gap-1">
                {(isSuperAdmin || hasCouponsRead || hasPromosRead) && (
                  <ViewItem
                    icon={<TagOutlined />}
                    label="Coupons"
                    count={currentDataCoupons.length}
                    isActive={subTab === "COUPONS"}
                    onClick={() => setSubTab("COUPONS")}
                    activeColorClass="text-indigo-500"
                    bgActiveColorClass="bg-indigo-50/80 dark:bg-indigo-900/30"
                    badgeColorClass="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                  />
                )}
                {(isSuperAdmin || hasUserReferralsRead || hasDriverReferralsRead) && (
                  <ViewItem
                    icon={<GiftOutlined />}
                    label="Referral Rules"
                    count={currentDataReferrals.length}
                    isActive={subTab === "REFERRALS"}
                    onClick={() => setSubTab("REFERRALS")}
                    activeColorClass="text-amber-500"
                    bgActiveColorClass="bg-amber-50/80 dark:bg-amber-900/30"
                    badgeColorClass="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400"
                  />
                )}
                {(isSuperAdmin || hasUserReferralsRead || hasDriverReferralsRead) && (
                  <ViewItem
                    icon={<FileTextOutlined />}
                    label="Referral Logs"
                    count={currentDataLogs.length}
                    isActive={subTab === "LOGS"}
                    onClick={() => setSubTab("LOGS")}
                    activeColorClass="text-blue-500"
                    bgActiveColorClass="bg-blue-50/80 dark:bg-blue-900/30"
                    badgeColorClass="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                  />
                )}
              </div>
            </div>

            {/* FILTERS */}
            <div className="px-4 py-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 px-2 mb-6">
                Filters
              </p>
              <div className="flex flex-col gap-3 px-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1 uppercase tracking-wide">
                    Target Audience
                  </span>
                  <Select
                    className="w-full premium-select-inline"
                    value={mainTab}
                    onChange={(val) => setMainTab(val as "CUSTOMER" | "DRIVER")}
                    options={[
                      { label: "Customers Only", value: "CUSTOMER" },
                      { label: "Drivers Only", value: "DRIVER" },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT MAIN CONTENT */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0b0f19]">
          {/* Top Navbar */}
          <div className="bg-white dark:bg-slate-800 p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 shadow-sm z-0 flex-shrink-0">
            <div className="relative flex-1 max-w-3xl flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
              <SearchOutlined className="absolute left-3 text-slate-400 text-[16px]" />
              <input
                type="text"
                placeholder="Search promos or rules..."
                className="w-full pl-10 pr-4 py-2 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
              <div className="absolute right-3">
                <span className="text-[11px] font-bold text-slate-400 border border-slate-200 dark:border-slate-600 rounded-[4px] px-1.5 py-[1px] bg-slate-50/50 dark:bg-slate-800 tracking-wide">
                  ⌘K
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-500/20">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <span className="text-[11px] font-black tracking-widest uppercase">
                  {currentCount} RESULTS
                </span>
              </div>

              {hasCreateAccess && subTab !== "LOGS" && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateNew}
                  className="rounded-lg h-10 px-4 font-bold border-none !bg-indigo-600 hover:!bg-indigo-700 flex items-center shadow-sm"
                >
                  {subTab === "COUPONS"
                    ? mainTab === "CUSTOMER"
                      ? "Create Coupon"
                      : "Create Offer"
                    : "Create Rule"}
                </Button>
              )}

              <button
                onClick={handleRefresh}
                className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all shrink-0"
              >
                <IoMdRefresh className={`text-lg ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Scrollable Main Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-[#0f172a] flex flex-col gap-6">
            {isLoading && currentCount === 0 ? (
              <div className="flex-1 flex items-center justify-center p-20 bg-white dark:bg-slate-800 rounded-sm border border-slate-200 dark:border-slate-700">
                <Spin size="large" />
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <TableSection flexClass="flex-1 h-full" extraClasses="border-none rounded-none !min-h-0">
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
                </TableSection>
              </div>
            )}
          </div>

          {/* Sticky Pagination Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 flex-shrink-0">
            <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              Showing <span className="font-bold text-slate-800 dark:text-slate-200">{currentCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, currentCount)}</span> of <span className="font-bold text-slate-800 dark:text-slate-200">{currentCount}</span> records
            </div>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={currentCount}
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
    </>
  );
};

export default CouponsPage;
