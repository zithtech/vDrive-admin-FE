import React, { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { logger } from "./utils/logger";

import {
  // TeamOutlined,
  UserOutlined,
  HomeOutlined,
  LogoutOutlined,
  DollarOutlined,
  MenuOutlined,
  EnvironmentOutlined,
  ArrowRightOutlined,
  TableOutlined,
  CheckCircleOutlined,
  BellOutlined,
  // CustomerServiceOutlined,
  // PieChartOutlined,
  // SafetyCertificateOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import {
  Layout,
  Menu,
  Avatar,
  ConfigProvider,
  Button,
  Drawer,
  App as AntdApp,
} from "antd";
import logo from "/logo1.png";
import {
  createBrowserRouter,
  RouterProvider,
  Link,
  useLocation,
  useNavigate,
  Outlet,
} from "react-router-dom";
import { PiSteeringWheel } from "react-icons/pi";
import { RiAdminLine } from "react-icons/ri";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { logoutAsync, fetchCurrentUser } from "./store/slices/authSlice";
import FullScreenLoader from "./components/FullScreenLoader";
import ErrorBoundary from "./components/ErrorBoundary";
import DashBoard from "./pages/DashBoard";
import { MdOutlineMoneyOff } from "react-icons/md";
import { AntdStaticHolder, notificationApi } from "./utilities/antdStaticHolder";
import { useSocket } from "./hooks/useSocket";
import { notification } from "antd";
import { useAdminTripAlert } from "./hooks/useAdminTripAlert";
import { useUserAlert } from "./hooks/useUserAlert";
import { useTripVerificationAlert } from "./hooks/useTripVerificationAlert";
import {
  // IoReceiptOutline,
  IoCarOutline
} from "react-icons/io5";
import { MdOutlineAccountBalanceWallet } from "react-icons/md";
import SosMonitor from "./components/SosMonitor/SosMonitor";
import { useModuleAccess } from "./hooks/usePermission";
import { ModuleProtectedRoute } from "./components/ModuleProtectedRoute";
// import { Ticket } from "lucide-react";

// Loading component for route suspense
const RouteLoadingFallback = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "400px",
      padding: "20px",
    }}
  >
    <div
      className="loader"
      style={{
        border: "6px solid #f3f3f3",
        borderTop: "6px solid #1677ff",
        borderRadius: "50%",
        width: 40,
        height: 40,
        animation: "spin 1s linear infinite",
      }}
    />
    <p style={{ marginTop: 16, color: "#666" }}>Loading...</p>
    <style>
      {`
@keyframes spin {
0% { transform: rotate(0deg); }
100% { transform: rotate(360deg); }
}
`}
    </style>
  </div>
);

// Lazy load heavy components for better bundle splitting
const Users = lazy(() => import("./pages/Users"));
const Customers = lazy(() => import("./pages/Customers") as Promise<{ default: React.ComponentType<any> }>);
const Admins = lazy(() => import("./pages/Admins") as Promise<{ default: React.ComponentType<any> }>);
const InvoiceTemplates = lazy(() => import("./pages/InvoiceTemplates") as Promise<{ default: React.ComponentType<any> }>);
const TripDetails = lazy(() => import("./pages/TripDetails") as Promise<{ default: React.ComponentType<any> }>);
const Drivers = lazy(() => import("./pages/Drivers") as Promise<{ default: React.ComponentType<any> }>);
const DriverApplications = lazy(() => import("./pages/DriverApplications") as Promise<{ default: React.ComponentType<any> }>);
const DriverPricing = lazy(() => import("./pages/DriverPricing") as Promise<{ default: React.ComponentType<any> }>);
const PricingAndFareRules = lazy(() => import("./pages/Pricing&FareRules") as Promise<{ default: React.ComponentType<any> }>);
const Deductions = lazy(() => import("./pages/Deductions") as Promise<{ default: React.ComponentType<any> }>);
const RechargePlan = lazy(() => import("./pages/RechargePlan") as Promise<{ default: React.ComponentType<any> }>);
const TripTransactions = lazy(() => import("./pages/TripTransactions") as Promise<{ default: React.ComponentType<any> }>);
const Tax = lazy(() => import("./pages/Tax") as Promise<{ default: React.ComponentType<any> }>);
const SignUp = lazy(() => import("./signup/Signup") as Promise<{ default: React.ComponentType<any> }>);
const Login = lazy(() => import("./login/Login") as Promise<{ default: React.ComponentType<any> }>);
const ResetPassword = lazy(() => import("./login/ResetPassword") as Promise<{ default: React.ComponentType<any> }>);
const PricingCombinations = lazy(() => import("./pages/PricingCombinations") as Promise<{ default: React.ComponentType<any> }>);
const Coupons = lazy(() => import("./pages/Coupons") as Promise<{ default: React.ComponentType<any> }>);
const DriverReconciliation = lazy(() => import("./pages/DriverReconciliation") as Promise<{ default: React.ComponentType<any> }>);
const TripVerifications = lazy(() => import("./pages/TripVerifications") as Promise<{ default: React.ComponentType<any> }>);
const Notifications = lazy(() => import("./pages/Notifications"));
const SupportTickets = lazy(() => import("./pages/SupportTickets"));
const SupportAnalytics = lazy(() => import("./pages/SupportAnalytics"));





const { Content, Sider, Header } = Layout;

const Logo: React.FC<{ collapsed: boolean }> = ({ collapsed }) => (
  <div className={`flex items-center justify-center gap-3 px-6 h-[80px] border-b border-gray-200 transition-all duration-300 ${collapsed ? "px-0" : ""}`}>
    <div className="relative">
      <div className="absolute -inset-2 bg-indigo-500/10 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      <img height={38} width={38} src={logo} alt="" className="relative drop-shadow-sm" />
    </div>

    {!collapsed && (
      <span className="font-black text-xl text-slate-900 whitespace-nowrap tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-indigo-600">
        vDrive Admin
      </span>
    )}
  </div>
);

const siderStyle: React.CSSProperties = {
  height: "100vh",
  position: "fixed",
  left: 0,
  top: 0,
  bottom: 0,
  zIndex: 100,
  borderRight: "1px solid rgba(226, 232, 240, 0.8)",
  background: "#FFFFFF",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
};
const RootLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, currentUser, role } = useAppSelector((state) => state.auth);
  const location = useLocation();

  const dashboardAccess = useModuleAccess("dashboard");
  const customersAccess = useModuleAccess("customers");
  const pricingAccess = useModuleAccess("pricing");
  const driversAccess = useModuleAccess("drivers");
  const driverOutreachAccess = useModuleAccess("drivers_outreach");
  const adminsAccess = useModuleAccess("admins");
  const deductionsAccess = useModuleAccess("deductions");
  const rechargePlanAccess = useModuleAccess("recharge");
  const taxesAccess = useModuleAccess("taxes");
  const couponsAccess = useModuleAccess(["coupons", "promos", "user_referrals", "driver_referrals"]);
  // const promotionsAccess = useModuleAccess("promos");
  const notificationsAccess = useModuleAccess("notifications");
  const tripsAccess = useModuleAccess("trips");
  const tripTransactionAccess = useModuleAccess("trip_transaction");


  useEffect(() => {
    if (isAuthenticated && !currentUser) {
      dispatch(fetchCurrentUser());
    }
  }, [isAuthenticated, currentUser, dispatch]);
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleDriverEvent = (data: any) => {
      let title = 'Driver Notification';
      if (data.eventType === 'NEW_DRIVER') title = 'New Driver Registered';
      else if (data.eventType === 'DRIVER_PROFILE_COMPLETED') title = 'Profile Completed';
      else if (data.eventType === 'SUBSCRIPTION_ACTIVATED') title = 'New Subscription';
      else if (data.eventType === 'SUBSCRIPTION_RENEWED') title = 'Subscription Renewed';

      notificationApi?.info({
        message: title,
        description: data.message,
        placement: 'topRight',
        duration: 5,
      });
    };

    socket.on("driver_event", handleDriverEvent);

    socket.on("newSupportMessageNotification", (data: any) => {
      notificationApi?.info({
        message: 'New Support Message',
        description: data.message,
        placement: 'bottomRight',
        duration: 4,
        onClick: () => navigate(`/support-tickets?ticketId=${data.ticketId}`)
      });
    });

    return () => {
      socket.off("driver_event", handleDriverEvent);
      socket.off("newSupportMessageNotification");
    };
  }, [socket]);



  const handleNewTrip = useCallback((newTrip: any) => {
    logger.info("New trip received", newTrip);

    const key = `trip-${newTrip.id}`; // unique key per notification

    notification.info({
      key,
      message: (
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          🚗 New Trip Requested — #{newTrip.id}
        </span>
      ),
      description: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          {/* Pickup */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <EnvironmentOutlined style={{ color: '#22c55e', marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>PICKUP</div>
              <div style={{ fontSize: 13, color: '#000' }}>
                {newTrip.pickupLocation?.address || newTrip.pickupLocation || 'N/A'}
              </div>
            </div>
          </div>

          {/* Dropoff */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <EnvironmentOutlined style={{ color: '#ef4444', marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>DROP-OFF</div>
              <div style={{ fontSize: 13, color: '#000' }}>
                {newTrip.dropoffLocation?.address || newTrip.dropoffLocation || 'N/A'}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div
            onClick={() => {
              notification.destroy(key);                          // close this notification
              navigate(`/TripDetails?selected=${newTrip.id}`);         // ✅ redirect with trip selected
            }}
            style={{
              marginTop: 6,
              cursor: 'pointer',
              color: '#3b82f6',
              fontWeight: 600,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            View Trip Details <ArrowRightOutlined />
          </div>
        </div>
      ),
      placement: 'topRight',
      duration: 8,       // stays longer so admin can read it
      style: {
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: 10,
      },
    });
  }, [navigate]);

  useAdminTripAlert(handleNewTrip);

  const handleNewUser = useCallback((newUser: any) => {
    logger.info("New user registered", newUser);

    const key = `user-${newUser.id || Date.now()}`;

    notification.success({
      key,
      message: (
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          👤 New User Registered!
        </span>
      ),
      description: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          {/* User Detail */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <UserOutlined style={{ color: '#3b82f6', marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, color: '#000', fontWeight: 500 }}>
                {newUser.full_name || newUser.fullName || 'Unknown User'}
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>
                {newUser.phone_number || newUser.phoneNumber || 'N/A'}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div
            onClick={() => {
              notification.destroy(key);
              navigate(`/customers`);
            }}
            style={{
              marginTop: 6,
              cursor: 'pointer',
              color: '#3b82f6',
              fontWeight: 600,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Manage Users <ArrowRightOutlined />
          </div>
        </div>
      ),
      placement: 'topRight',
      duration: 8,
      style: {
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: 10,
      },
    });
  }, [navigate]);

  useUserAlert(handleNewUser);

  const handleNewVerification = useCallback((data: any) => {
    logger.info("New trip verification requested", data);

    const key = `verify-${data.tripId || Date.now()}`;

    notification.warning({
      key,
      message: (
        <span style={{ fontWeight: 600, fontSize: 14 }}>
          📸 Action Required: Trip Verification
        </span>
      ),
      description: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <CheckCircleOutlined style={{ color: '#fa8c16', marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, color: '#000', fontWeight: 500 }}>
                Trip #{data.tripId || 'Unknown'} requires photo verification.
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>
                Driver #{data.driverId || 'N/A'} is waiting to start.
              </div>
            </div>
          </div>

          {/* CTA */}
          <div
            onClick={() => {
              notification.destroy(key);
              navigate(`/trip-verifications`);
            }}
            style={{
              marginTop: 6,
              cursor: 'pointer',
              color: '#3b82f6',
              fontWeight: 600,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            Review Photos <ArrowRightOutlined />
          </div>
        </div>
      ),
      placement: 'topRight',
      duration: 0, // Keep open until action taken
      style: {
        background: '#fff',
        border: '1px solid #fa8c16',
        borderRadius: 10,
      },
    });
  }, [navigate]);

  useTripVerificationAlert(handleNewVerification);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  useEffect(() => {
    if (!loading && !isAuthenticated && location.pathname !== "/login") {
      navigate("/login");
    }

  }, [isAuthenticated, loading, location, navigate]);


  const onCloseDrawer = () => {
    setDrawerVisible(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    if (isLeftSwipe) {
      onCloseDrawer();
    }
  };

  const menuItems = React.useMemo(() => {
    const items: MenuProps["items"] = [];

    if (dashboardAccess) {
      items.push({ label: <Link to="/">Dashboard</Link>, key: "/", icon: <HomeOutlined /> });
    }
    if (customersAccess) {
      items.push({ label: <Link to="/customers">Customers</Link>, key: "/customers", icon: <UserOutlined /> });
    }
    if (pricingAccess) {
      items.push({ label: <Link to="/PricingAndFareRules">Pricing And Fare Rules</Link>, key: "/PricingAndFareRules", icon: <DollarOutlined /> });
    }
    if (driversAccess) {
      items.push({ label: <Link to="/drivers">Drivers</Link>, key: "/drivers", icon: <PiSteeringWheel /> });
    }
    if (driverOutreachAccess) {
      items.push({ label: <Link to="/driver-reconciliation">Driver Outreach</Link>, key: "/driver-reconciliation", icon: <TableOutlined /> });
    }
    if (adminsAccess) {
      items.push({ label: <Link to="/admins">Admins</Link>, key: "/admins", icon: <RiAdminLine /> });
    }

    // Core functional tools available to authorized members
    if (tripsAccess) {
      items.push({ label: <Link to="/TripDetails">Trip Details</Link>, key: "/TripDetails", icon: <IoCarOutline /> });
    }
    if (tripTransactionAccess) {
      items.push({ label: <Link to="/trip-transactions">Trip Transactions</Link>, key: "/trip-transactions", icon: <EnvironmentOutlined /> });
    }

    if (deductionsAccess) {
      items.push({ label: <Link to="/Deductions">Deduction Management</Link>, key: "/Deductions", icon: <MdOutlineMoneyOff /> });
    }
    if (rechargePlanAccess) {
      items.push({ label: <Link to="/RechargePlan">Recharge Plan</Link>, key: "/RechargePlan", icon: <MdOutlineAccountBalanceWallet /> });
    }
    if (taxesAccess) {
      items.push({ label: <Link to="/taxes">Tax Management</Link>, key: "/taxes", icon: <DollarOutlined /> });
    }
    if (couponsAccess) {
      items.push({ label: <Link to="/coupons">Coupons</Link>, key: "/coupons", icon: <DollarOutlined /> });
    }
    // if (promotionsAccess) {
    //   items.push({ label: <Link to="/promotions">Promotions</Link>, key: "/promotions", icon: <Ticket /> });
    // }
    if (notificationsAccess) {
      items.push({ label: <Link to="/notifications">Notifications</Link>, key: "/notifications", icon: <BellOutlined /> });
    }

    return items;
  }, [
    dashboardAccess,
    customersAccess,
    pricingAccess,
    driversAccess,
    driverOutreachAccess,
    adminsAccess,
    deductionsAccess,
    rechargePlanAccess,
    taxesAccess,
    couponsAccess,
    // promotionsAccess,
    notificationsAccess,
    tripsAccess,
    tripTransactionAccess
  ]);
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1d2a5c",
          colorPrimaryBg: "#ffffff",
          // fontFamily: "'Plus Jakarta Sans', sans-serif",
        },
        components: {
          Layout: {
            siderBg: "transparent",
            bodyBg: "#F8FAFC",
          },
          Menu: {
            itemBg: "transparent",
            itemSelectedBg: "transparent", // Keep transparent
            itemSelectedColor: "#FFFFFF",
            itemColor: "#64748B",
            itemHoverColor: "#1D2A5C",
            itemHoverBg: "rgba(29, 42, 92, 0.04)",
            itemActiveBg: "rgba(29, 42, 92, 0.08)",
            itemBorderRadius: 16,
            itemMarginInline: 12,
            iconSize: 20,
          },
          Typography: {
            titleMarginBottom: 0,
            titleMarginTop: 0,
          },
          Segmented: {
            trackBg: "rgb(241,245,249)",
            itemColor: "#000000",
            itemSelectedColor: "#1d2a5c",
          },
        },
      }}
    >
      <AntdApp>
        <AntdStaticHolder />
        <SosMonitor />
        {loading && <FullScreenLoader />}
        <Layout
          hasSider={
            !isMobile && isAuthenticated && location.pathname !== "/login"
          }
        >
          {!isMobile && isAuthenticated && location.pathname !== "/login" && (
            <Sider
              style={siderStyle}
              collapsed={collapsed}
              width={250}
              onMouseEnter={() => setCollapsed(false)}
              onMouseLeave={() => setCollapsed(true)}
            >
              <div className="flex flex-col h-full bg-white">
                <div className="flex-shrink-0 group">
                  <Logo collapsed={collapsed} />
                </div>

                <div className="flex-grow overflow-y-auto py-6 custom-scrollbar">
                  <Menu
                    mode="inline"
                    selectedKeys={
                      location.pathname.startsWith("/PricingAndFareRules")
                        ? ["/PricingAndFareRules"]
                        : [location.pathname]
                    }
                    items={menuItems}
                    className="font-medium"
                  />
                </div>

                <div
                  className={`flex-shrink-0 border-t border-gray-50 mt-auto transition-all duration-300 ${collapsed ? "p-2" : "p-6"}`}
                >
                  <div
                    className={`flex items-center w-full p-3 rounded-2xl bg-slate-50 border border-gray-100/50 shadow-sm transition-all duration-300 group cursor-pointer ${collapsed ? "justify-center p-2" : "gap-3 mb-4"
                      }`}
                  >
                    <Avatar
                      size={collapsed ? "small" : "large"}
                      icon={<UserOutlined />}
                      className="!bg-gradient-to-br !from-indigo-600 !to-blue-600 border-2 border-white shadow-md flex-shrink-0"
                    />

                    {!collapsed && (
                      <div className="flex flex-col overflow-hidden transition-all duration-300">
                        <span className="font-black text-[13px] text-slate-800 whitespace-nowrap leading-none mb-1">
                          {currentUser?.name || "Member User"}
                        </span>
                        <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider whitespace-nowrap">
                          {role === 'super_admin' ? 'Super Administrator' : 'Access Administrator'}
                        </span>
                      </div>
                    )}
                  </div>

                  <Menu
                    mode="inline"
                    selectable={false}
                    items={[
                      {
                        key: "logout",
                        label: <span className="font-bold text-[11px] uppercase tracking-widest">Logout</span>,
                        icon: <LogoutOutlined className="!text-lg" />,
                        danger: true,
                        onClick: async () => {
                          await dispatch(logoutAsync());
                          navigate("/login");
                        },
                      },
                    ]}
                    className="bg-transparent border-0 mt-2"
                  />
                </div>
              </div>
            </Sider>
          )}

          <Layout
            style={{
              marginLeft:
                isMobile || !isAuthenticated || location.pathname === "/login"
                  ? 0
                  : collapsed
                    ? 80
                    : 250,
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              backgroundColor: "#F8FAFC",
            }}
          >
            {isMobile && isAuthenticated && location.pathname !== "/login" && (
              <Header
                style={{
                  padding: "0 16px",
                  background: "#fff",
                  borderBottom: "1px solid #d9d9d9",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                }}
              >
                <img height={32} width={32} src={logo} alt="Logo" />
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Button
                    type="text"
                    icon={<MenuOutlined />}
                    onClick={showDrawer}
                    style={{ fontSize: "16px" }}
                  />
                  <Button
                    type="text"
                    icon={<LogoutOutlined />}
                    danger
                    style={{ fontSize: "16px" }}
                    onClick={async () => {
                      await dispatch(logoutAsync());
                      navigate("/login");
                    }}
                  />
                </div>
              </Header>
            )}
            <Content>
              <div
                className={`w-full bg-[#F7F8FB] ${isMobile && isAuthenticated && location.pathname !== "/login"
                  ? "pt-16 h-[100dvh]"
                  : "h-[100dvh]"
                  }`}
              >
                <Outlet />
              </div>
            </Content>
          </Layout>

          {isAuthenticated && (
            <Drawer
              title={
                <div className="flex items-center gap-2">
                  <img height={32} width={32} src={logo} alt="" />
                  <span>vDrive Admin</span>
                </div>
              }
              placement="left"
              closable={false}
              onClose={onCloseDrawer}
              open={drawerVisible}
              width={250}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div style={{ flex: 1 }}>
                  <Menu
                    theme="dark"
                    mode="vertical"
                    selectedKeys={
                      location.pathname.startsWith("/PricingAndFareRules")
                        ? ["/PricingAndFareRules"]
                        : [location.pathname]
                    }
                    items={menuItems}
                  />
                </div>
                <div className="p-4 border-t">
                  <div className="flex items-center gap-3">
                    <Avatar size="large" icon={<UserOutlined />} />
                    <div>
                      <div className="font-medium">{currentUser?.name || "—"}</div>
                      <div className="text-xs text-gray-500">
                        {currentUser?.email || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Drawer>
          )}

          {/* SOS Monitor - Always active for authenticated admins */}
          {isAuthenticated && <SosMonitor />}
        </Layout>
      </AntdApp>
    </ConfigProvider>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <ModuleProtectedRoute module="dashboard"><DashBoard /></ModuleProtectedRoute> },
      {
        path: "users",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ModuleProtectedRoute module="customers">
              <Users />
            </ModuleProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "customers",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ModuleProtectedRoute module="customers">
              <Customers />
            </ModuleProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "admins",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ModuleProtectedRoute module="admins">
              <Admins />
            </ModuleProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "InvoiceTemplates",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ModuleProtectedRoute module="dashboard">
              <InvoiceTemplates />
            </ModuleProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "TripDetails",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ModuleProtectedRoute module="trips">
              <TripDetails />
            </ModuleProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "trip-verifications",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <TripVerifications />
          </Suspense>
        ),
      },
      {
        path: "trip-transactions",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ModuleProtectedRoute module="trip_transaction">
              <TripTransactions />
            </ModuleProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "drivers",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ModuleProtectedRoute module="drivers">
              <Drivers />
            </ModuleProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "driver-applications",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <DriverApplications />
          </Suspense>
        ),
      },
      {
        path: "Deductions",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ModuleProtectedRoute module="deductions">
              <Deductions />
            </ModuleProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "support-tickets",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <SupportTickets />
          </Suspense>
        ),
      },
      {
        path: "support-analytics",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <SupportAnalytics />
          </Suspense>
        ),
      },
      {
        path: "RechargePlan",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ModuleProtectedRoute module="recharge">
              <RechargePlan />
            </ModuleProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "taxes",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ModuleProtectedRoute module="taxes">
              <Tax />
            </ModuleProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "pricing-combinations",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ModuleProtectedRoute module="pricing">
              <PricingCombinations />
            </ModuleProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "coupons",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ModuleProtectedRoute module={["coupons", "promos", "user_referrals", "driver_referrals"]}>
              <Coupons />
            </ModuleProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "driver-reconciliation",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ModuleProtectedRoute module="drivers_outreach">
              <DriverReconciliation />
            </ModuleProtectedRoute>
          </Suspense>
        ),
      },
      {
        path: "notifications",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ModuleProtectedRoute module="notifications">
              <Notifications />
            </ModuleProtectedRoute>
          </Suspense>
        ),
      },

      {
        path: "PricingAndFareRules",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ModuleProtectedRoute module="pricing">
              <PricingAndFareRules />
            </ModuleProtectedRoute>
          </Suspense>
        ),
        children: [
          {
            path: "pricing/:id?",
            element: (
              <Suspense fallback={<RouteLoadingFallback />}>
                <ModuleProtectedRoute module="pricing">
                  <DriverPricing />
                </ModuleProtectedRoute>
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    path: "/login",
    element: (
      <Suspense fallback={<RouteLoadingFallback />}>
        <Login />
      </Suspense>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <Suspense fallback={<RouteLoadingFallback />}>
        <ResetPassword />
      </Suspense>
    ),
  },
  {
    path: "/signup",
    element: (
      <Suspense fallback={<RouteLoadingFallback />}>
        <SignUp />
      </Suspense>
    ),
  },
]);

const App = () => (
  <ErrorBoundary>
    <RouterProvider router={router} />
  </ErrorBoundary>
);
//comment added
export default App;
