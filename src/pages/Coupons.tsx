import React, { useEffect, useState } from "react";
import { Button, Modal, notification, Tabs, Segmented } from "antd";
import { PlusOutlined, ExclamationCircleOutlined, TagOutlined, GiftOutlined, HistoryOutlined } from "@ant-design/icons";
import TitleBar from "../components/TitleBarCommon/TitleBar";
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

const { confirm } = Modal;

const CouponsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { coupons, isLoading: couponsLoading } = useAppSelector((state) => state.coupon);
  const { promos } = useAppSelector((state) => state.promo);
  const { configs, logs, isLoading: referralsLoading } = useAppSelector((state) => state.referral);
  const { role } = useAppSelector((state) => state.auth);
  const isSuperAdmin = role === 'super_admin';

  const [mainTab, setMainTab] = useState<"CUSTOMER" | "DRIVER">("CUSTOMER");
  const [subTab, setSubTab] = useState<"COUPONS" | "REFERRALS" | "LOGS">("COUPONS");

  const [couponDrawerVisible, setCouponDrawerVisible] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [promoDrawerVisible, setPromoDrawerVisible] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);

  const [referralDrawerVisible, setReferralDrawerVisible] = useState(false);
  const [editingReferral, setEditingReferral] = useState<ReferralConfig | null>(null);

  useEffect(() => {
    dispatch(fetchCoupons());
    dispatch(fetchPromos());
    dispatch(fetchReferralConfigs());
  }, [dispatch]);

  useEffect(() => {
    if (subTab === "LOGS") {
      dispatch(fetchReferralLogs(mainTab));
    }
  }, [dispatch, subTab, mainTab]);

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
      content: mainTab === "CUSTOMER"
        ? "This action cannot be undone."
        : `Are you sure you want to delete this promotion? This will remove all history and cannot be undone.`,
      okText: mainTab === "CUSTOMER" ? "Yes, Delete" : "Delete",
      okType: "danger",
      onOk: async () => {
        if (mainTab === "CUSTOMER") {
          dispatch(deleteCoupon(id)).then((res: any) => {
            if (!res.hasOwnProperty("error")) {
              notification.success({ message: "Coupon deleted" });
            }
          });
        } else {
          try {
            await axios.delete(`/api/promos/${id}`);
            notification.success({ message: "Promo deleted successfully" });
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
        if (!res.hasOwnProperty("error")) {
          notification.success({ message: `Coupon ${is_active ? "activated" : "disabled"}` });
        }
      });
    } else {
      dispatch(updatePromoStatus({ id: Number(id), is_active })).then((res: any) => {
        if (!res.hasOwnProperty("error")) {
          notification.success({ message: `Promo ${is_active ? "activated" : "disabled"}` });
        }
      });
    }
  };

  const handleCouponSubmit = (values: any) => {
    if (mainTab === "CUSTOMER") {
      if (editingCoupon) {
        dispatch(updateCoupon({ id: editingCoupon.id, couponData: values })).then((res: any) => {
          if (!res.hasOwnProperty("error")) {
            notification.success({ message: "Updated" });
            setCouponDrawerVisible(false);
          }
        });
      } else {
        dispatch(addCoupon(values)).then((res: any) => {
          if (!res.hasOwnProperty("error")) {
            notification.success({ message: "Created" });
            setCouponDrawerVisible(false);
          }
        });
      }
    } else {
      if (editingCoupon) {
        dispatch(updatePromo({ id: Number(editingCoupon.id), promoData: values })).then((res: any) => {
          if (!res.hasOwnProperty("error")) {
            notification.success({ message: "Promo Updated" });
            setCouponDrawerVisible(false);
          }
        });
      } else {
        dispatch(addPromo(values)).then((res: any) => {
          if (!res.hasOwnProperty("error")) {
            notification.success({ message: "Promo Created" });
            setCouponDrawerVisible(false);
          }
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
          if (!res.hasOwnProperty("error")) {
            notification.success({ message: "Deleted" });
          }
        });
      },
    });
  };

  const handleReferralToggle = (id: string, is_active: boolean) => {
    dispatch(updateReferralConfig({ id, data: { is_active } })).then((res: any) => {
      if (!res.hasOwnProperty("error")) {
        notification.success({ message: `Rule ${is_active ? "activated" : "disabled"}` });
      }
    });
  };

  const handleReferralSubmit = (values: ReferralConfigPayload) => {
    if (editingReferral) {
      dispatch(updateReferralConfig({ id: editingReferral.id, data: values })).then((res: any) => {
        if (!res.hasOwnProperty("error")) {
          notification.success({ message: "Updated" });
          setReferralDrawerVisible(false);
        }
      });
    } else {
      dispatch(addReferralConfig(values)).then((res: any) => {
        if (!res.hasOwnProperty("error")) {
          notification.success({ message: "Created" });
          setReferralDrawerVisible(false);
        }
      });
    }
  };

  const filteredCoupons = mainTab === "CUSTOMER" ? coupons : (promos as any);
  const filteredReferrals = configs.filter(r => r.user_type === mainTab);

  return (
    <TitleBar
      title="Coupons & Referrals"
      icon={
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center">
          <GiftOutlined className="text-white" />
        </div>
      }
      iconBgColor="bg-indigo-600"
      description="Manage promotions and referral rewards for both customers and drivers"
      extraContent={
        isSuperAdmin && subTab !== "LOGS" && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={handleCreateNew}
            className="rounded-xl h-12 px-6 font-bold border-none !bg-gradient-to-r !from-indigo-600 !to-blue-500 hover:scale-[1.02] transition-transform flex items-center"
          >
            {subTab === "COUPONS"
              ? (mainTab === "CUSTOMER" ? "Create Coupon" : "Create New Offer")
              : "Create Referral Rule"}
          </Button>
        )
      }
    >
      <div className="w-full h-full flex flex-col p-6 bg-white overflow-y-auto custom-scrollbar gap-6">
        {/* ─── Control Header ─────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
          <div className="flex items-center gap-6">
            <Tabs
              activeKey={mainTab}
              onChange={(key) => setMainTab(key as any)}
              className="premium-tabs border-none"
              items={[
                { key: "CUSTOMER", label: <span className="px-4 font-black uppercase tracking-widest text-[11px]">Customers Only</span> },
                { key: "DRIVER", label: <span className="px-4 font-black uppercase tracking-widest text-[11px]">Drivers Only</span> },
              ]}
            />

            <div className="h-8 w-[1px] bg-gray-200 hidden md:block" />

            <div className="p-1 bg-gray-100 rounded-xl w-fit">
              <Segmented
                value={subTab}
                onChange={(value) => setSubTab(value as any)}
                className="premium-segmented-alt"
                options={[
                  {
                    label: (
                      <div className={`px-5 py-0.5 flex items-center gap-2 font-black text-[10px] uppercase tracking-wider ${subTab === "COUPONS" ? "text-blue-600" : "text-black"}`}>
                        <TagOutlined /> Coupons
                      </div>
                    ),
                    value: "COUPONS",
                  },
                  {
                    label: (
                      <div className={`px-5 py-0.5 flex items-center gap-2 font-black text-[10px] uppercase tracking-wider ${subTab === "REFERRALS" ? "text-amber-600" : "text-black"}`}>
                        <GiftOutlined /> Referrals
                      </div>
                    ),
                    value: "REFERRALS",
                  },
                  {
                    label: (
                      <div className={`px-5 py-0.5 flex items-center gap-2 font-black text-[10px] uppercase tracking-wider ${subTab === "LOGS" ? "text-indigo-600" : "text-black"}`}>
                        <HistoryOutlined /> Logs
                      </div>
                    ),
                    value: "LOGS",
                  },
                ]}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black leading-none mb-1">Active Ledger</p>
            <p className="text-[11px] text-gray-500 font-bold">
              {subTab === 'COUPONS' ? 'Historical Promo Records' : subTab === 'REFERRALS' ? 'Loyalty Incentive Rules' : 'Real-time referral activity'}
            </p>
            </div>
          </div>
        </div>

        <div className="flex-grow min-h-0 px-2 transition-all duration-300">
          {subTab === "COUPONS" ? (
            <CouponTable
              data={filteredCoupons}
              loading={couponsLoading}
              onEdit={handleCouponEdit}
              onDelete={handleCouponDelete}
              onToggleStatus={handleCouponToggle}
              onRefresh={() => {
                if (mainTab === "CUSTOMER") dispatch(fetchCoupons());
                else dispatch(fetchPromos());
              }}
              isSuperAdmin={isSuperAdmin}
            />
          ) : subTab === "REFERRALS" ? (
            <ReferralTable
              data={filteredReferrals}
              loading={referralsLoading}
              onEdit={handleReferralEdit}
              onDelete={handleReferralDelete}
              onToggleStatus={handleReferralToggle}
              isSuperAdmin={isSuperAdmin}
            />
          ) : (
            <ReferralLogsTable
              data={logs}
              loading={referralsLoading}
              type={mainTab}
            />
          )}
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
    </TitleBar>
  );
};

export default CouponsPage;
