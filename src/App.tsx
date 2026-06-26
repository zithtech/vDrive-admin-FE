import React, { useState, useEffect, lazy, Suspense, useCallback, useMemo } from "react";
import { logger } from "./utils/logger";
import axiosIns from "./api/axios";
import { Moon, UserPlus, ShieldCheck, Headphones } from "lucide-react";

import {
  // TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
  EnvironmentOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  // CustomerServiceOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Layout, Menu, Avatar, ConfigProvider, Button, Drawer, App as AntdApp, theme, Dropdown } from "antd";
import logo from "/90.png";
import {
  createBrowserRouter,
  RouterProvider,
  useLocation,
  useNavigate,
  Outlet,
} from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import { logoutAsync, fetchCurrentUser } from "./store/slices/authSlice";
import FullScreenLoader from "./components/FullScreenLoader";
import ErrorBoundary from "./components/ErrorBoundary";
import { AntdStaticHolder, notificationApi } from "./utilities/antdStaticHolder";
import { useSocket } from "./hooks/useSocket";
import { notification } from "antd";
import { useAdminTripAlert } from "./hooks/useAdminTripAlert";
import { useUserAlert } from "./hooks/useUserAlert";
import { useTripVerificationAlert } from "./hooks/useTripVerificationAlert";
import SosMonitor from "./components/SosMonitor/SosMonitor";
import { useTheme } from "./contexts/ThemeContext";
import { hasModuleAccess } from "./hooks/usePermission";
import { MODULE_REGISTRY, buildModuleRoutes } from "./config/moduleRegistry";
import RouteLoadingFallback from "./components/RouteLoadingFallback";


const SignUp = lazy(
  () => import("./signup/Signup") as Promise<{ default: React.ComponentType<any> }>,
);
const Login = lazy(() => import("./login/Login") as Promise<{ default: React.ComponentType<any> }>);
const ResetPassword = lazy(
  () => import("./login/ResetPassword") as Promise<{ default: React.ComponentType<any> }>,
);

const { Content, Sider, Header } = Layout;

const Logo: React.FC<{ collapsed: boolean; onToggle: () => void }> = ({ collapsed, onToggle }) => (
  <div className="flex flex-col w-full">
    <div
      className={`flex items-center h-[64px] border-b border-gray-200 dark:border-slate-800 transition-all duration-300 ${
        collapsed ? "justify-center" : "justify-center px-4"
      }`}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <img
          src={logo}
          alt=""
          className="w-8 h-8 object-contain dark:invert dark:brightness-200"
        />
        {!collapsed && (
          <span className="font-bold text-lg text-slate-900 dark:text-white whitespace-nowrap truncate">
            VDrive Admin
          </span>
        )}
      </div>
    </div>
    <div
      className={`flex items-center h-[48px] border-b border-gray-200 dark:border-slate-800 transition-all duration-300 ${
        collapsed ? "justify-center" : "justify-end px-4"
      }`}
    >
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={onToggle}
        className="flex-shrink-0 !flex !items-center !justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white"
        style={{ fontSize: "16px", width: 32, height: 32 }}
      />
    </div>
  </div>
);

const siderStyle: React.CSSProperties = {
  height: "100vh",
  position: "fixed",
  left: 0,
  top: 0,
  bottom: 0,
  zIndex: 100,
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
};
const RootLayout: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, currentUser, role } = useAppSelector((state) => state.auth);
  const { drivers } = useAppSelector((state: any) => state.drivers);
  const location = useLocation();
  const { isDarkMode, toggleTheme } = useTheme();

  const awaitingCount = useMemo(() => {
    if (!drivers || !Array.isArray(drivers)) return 0;
    return drivers.filter(
      (d: any) =>
        d.status === "pending" ||
        d.status === "pending_verification" ||
        d.onboarding_status === "DOCS_SUBMITTED" ||
        d.onboarding_status === "DOCS_REJECTED"
    ).length;
  }, [drivers]);

  const [openTicketsCount, setOpenTicketsCount] = useState(0);
  const [pendingVerificationsCount, setPendingVerificationsCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [{ data: tickets }, { data: verifications }] = await Promise.all([
          axiosIns.get("/api/support-management/tickets"),
          axiosIns.get("/api/trip-verification/pending")
        ]);
        if (tickets?.data?.tickets) {
          setOpenTicketsCount(tickets.data.tickets.filter((t: any) => t.status === "open").length);
        }
        if (verifications?.success) {
          setPendingVerificationsCount(verifications.data.length || 0);
        }
      } catch (e) {
        console.error("Failed to fetch topnav counts", e);
      }
    };
    if (isAuthenticated) fetchCounts();
  }, [isAuthenticated]);


  useEffect(() => {
    if (isAuthenticated && !currentUser) {
      dispatch(fetchCurrentUser());
    }
  }, [isAuthenticated, currentUser, dispatch]);
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleDriverEvent = (data: any) => {
      if (
        data.eventType === "TRIP_VERIFICATION_APPROVED" ||
        data.eventType === "TRIP_VERIFICATION_REJECTED"
      ) {
        setPendingVerificationsCount((prev) => Math.max(0, prev - 1));
      }
      let title = "Driver Notification";
      if (data.eventType === "NEW_DRIVER") title = "New Driver Registered";
      else if (data.eventType === "DRIVER_PROFILE_COMPLETED") title = "Profile Completed";
      else if (data.eventType === "SUBSCRIPTION_ACTIVATED") title = "New Subscription";
      else if (data.eventType === "SUBSCRIPTION_RENEWED") title = "Subscription Renewed";

      notificationApi?.info({
        message: title,
        description: data.message,
        placement: "topRight",
        duration: 5,
      });
    };

    socket.on("driver_event", handleDriverEvent);

    socket.on("newSupportMessageNotification", (data: any) => {
      notificationApi?.info({
        message: "New Support Message",
        description: data.message,
        placement: "bottomRight",
        duration: 4,
        onClick: () => navigate(`/support-tickets?ticketId=${data.ticketId}`),
      });
    });

    socket.on("ADMIN_TRIP_VERIFICATION_REQUESTED", () => {
      setPendingVerificationsCount((prev) => prev + 1);
    });

    socket.on("ADMIN_SUPPORT_TICKET_CLOSED", () => {
      setOpenTicketsCount((prev) => Math.max(0, prev - 1));
    });

    socket.on("ADMIN_SUPPORT_TICKET_ALERT", (newTicket: any) => {
      setOpenTicketsCount((prev) => prev + 1);
      notificationApi?.info({
        message: "New Driver Support Ticket",
        description: newTicket.subject || "A driver has created a new support ticket.",
        placement: "topRight",
        duration: 5,
        onClick: () => navigate(`/support-tickets?ticketId=${newTicket.id}`),
      });
    });

    socket.on("ADMIN_SUPPORT_USER_TICKET_ALERT", (newTicket: any) => {
      setOpenTicketsCount((prev) => prev + 1);
      notificationApi?.info({
        message: "New Customer Support Ticket",
        description: newTicket.subject || "A customer has created a new support ticket.",
        placement: "topRight",
        duration: 5,
        onClick: () => navigate(`/support-tickets?ticketId=${newTicket.id}`),
      });
    });

    return () => {
      socket.off("driver_event", handleDriverEvent);
      socket.off("newSupportMessageNotification");
      socket.off("ADMIN_TRIP_VERIFICATION_REQUESTED");
      socket.off("ADMIN_SUPPORT_TICKET_CLOSED");
      socket.off("ADMIN_SUPPORT_TICKET_ALERT");
      socket.off("ADMIN_SUPPORT_USER_TICKET_ALERT");
    };
  }, [socket]);

  const handleNewTrip = useCallback(
    (newTrip: any) => {
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {/* Pickup */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <EnvironmentOutlined style={{ color: "#22c55e", marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>PICKUP</div>
                <div style={{ fontSize: 13, color: "#000" }}>
                  {newTrip.pickupLocation?.address || newTrip.pickupLocation || "N/A"}
                </div>
              </div>
            </div>

            {/* Dropoff */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <EnvironmentOutlined style={{ color: "#ef4444", marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, color: "#888", fontWeight: 500 }}>DROP-OFF</div>
                <div style={{ fontSize: 13, color: "#000" }}>
                  {newTrip.dropoffLocation?.address || newTrip.dropoffLocation || "N/A"}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div
              onClick={() => {
                notification.destroy(key); // close this notification
                navigate(`/TripDetails?selected=${newTrip.id}`); // ✅ redirect with trip selected
              }}
              style={{
                marginTop: 6,
                cursor: "pointer",
                color: "#3b82f6",
                fontWeight: 600,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              View Trip Details <ArrowRightOutlined />
            </div>
          </div>
        ),
        placement: "topRight",
        duration: 8, // stays longer so admin can read it
        style: {
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: 10,
        },
      });
    },
    [navigate],
  );

  useAdminTripAlert(handleNewTrip);

  const handleNewUser = useCallback(
    (newUser: any) => {
      logger.info("New user registered", newUser);

      const key = `user-${newUser.id || Date.now()}`;

      notification.success({
        key,
        message: <span style={{ fontWeight: 600, fontSize: 14 }}>👤 New User Registered!</span>,
        description: (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {/* User Detail */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <UserOutlined style={{ color: "#3b82f6", marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, color: "#000", fontWeight: 500 }}>
                  {newUser.full_name || newUser.fullName || "Unknown User"}
                </div>
                <div style={{ fontSize: 11, color: "#888" }}>
                  {newUser.phone_number || newUser.phoneNumber || "N/A"}
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
                cursor: "pointer",
                color: "#3b82f6",
                fontWeight: 600,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Manage Users <ArrowRightOutlined />
            </div>
          </div>
        ),
        placement: "topRight",
        duration: 8,
        style: {
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: 10,
        },
      });
    },
    [navigate],
  );

  useUserAlert(handleNewUser);

  const handleNewVerification = useCallback(
    (data: any) => {
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <CheckCircleOutlined style={{ color: "#fa8c16", marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, color: "#000", fontWeight: 500 }}>
                  Trip #{data.tripId || "Unknown"} requires photo verification.
                </div>
                <div style={{ fontSize: 11, color: "#888" }}>
                  Driver #{data.driverId || "N/A"} is waiting to start.
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
                cursor: "pointer",
                color: "#3b82f6",
                fontWeight: 600,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Review Photos <ArrowRightOutlined />
            </div>
          </div>
        ),
        placement: "topRight",
        duration: 0, // Keep open until action taken
        style: {
          background: "#fff",
          border: "1px solid #fa8c16",
          borderRadius: 10,
        },
      });
    },
    [navigate],
  );

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

  // Sidebar items are derived from the module registry — one place to add a page.
  const menuItems = React.useMemo<MenuProps["items"]>(
    () =>
      MODULE_REGISTRY.filter(
        (entry) => entry.menu && hasModuleAccess(currentUser, entry.rbacModule),
      ).map((entry) => entry.menu!),
    [currentUser],
  );
  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#1d2a5c",
          colorPrimaryBg: "#ffffff",
          fontFamily:
            "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        components: {
          Layout: {
            siderBg: "transparent",
            bodyBg: isDarkMode ? "#0f172a" : "#F8FAFC",
            headerBg: isDarkMode ? "#0f172a" : "#ffffff",
          },
          Menu: {
            itemBg: "transparent",
            itemSelectedBg: "transparent",
            itemSelectedColor: isDarkMode ? "#4096ff" : "#3b82f6",
            itemColor: isDarkMode ? "#94a3b8" : "#475569",
            itemHoverColor: isDarkMode ? "#ffffff" : "#3b82f6",
            itemHoverBg: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
            itemBorderRadius: 8,
            itemMarginInline: 8,
            iconSize: 16,
            itemHeight: 36,
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
        <Layout hasSider={!isMobile && isAuthenticated && location.pathname !== "/login"}>
          {!isMobile && isAuthenticated && location.pathname !== "/login" && (
            <Sider
              style={siderStyle}
              className="bg-white dark:bg-slate-900"
              collapsed={collapsed}
              width={250}
            >
              <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800">
                <div className="flex-shrink-0 group">
                  <Logo collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
                </div>

                <div className="flex-grow overflow-y-auto pt-2 pb-6 custom-scrollbar">
                  <Menu
                    mode="inline"
                    style={{ borderRight: 0 }}
                    selectedKeys={
                      location.pathname.startsWith("/PricingAndFareRules")
                        ? ["/PricingAndFareRules"]
                        : [location.pathname]
                    }
                    items={menuItems}
                    className="font-medium text-[13px]"
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
            }}
            className="bg-[#F8FAFC] dark:bg-[#0f172a]"
          >
            {isAuthenticated && location.pathname !== "/login" && (
              <Header
                style={{
                  padding: "0 24px",
                  display: "flex",
                  justifyContent: isMobile ? "space-between" : "flex-end",
                  alignItems: "center",
                  position: isMobile ? "fixed" : "static",
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  height: 64,
                }}
                className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800"
              >
                {isMobile && (
                  <div className="flex items-center gap-3">
                    <Button
                      type="text"
                      icon={<MenuOutlined />}
                      onClick={showDrawer}
                      style={{ fontSize: "16px" }}
                    />
                    <img
                      src={logo}
                      alt="Logo"
                      className={`w-8 h-8 object-contain transition-all duration-300 ${isDarkMode ? "invert brightness-200" : ""}`}
                    />
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {!isMobile && (
                    <div className="flex items-center gap-1 pr-2">
                      <div 
                        onClick={toggleTheme}
                        className="relative flex items-center justify-center w-[32px] h-[32px] rounded-[10px] cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        <Moon size={18} strokeWidth={2} />
                      </div>
                      <div 
                        onClick={() => navigate("/driver-applications")}
                        className="relative flex items-center justify-center w-[32px] h-[32px] rounded-[10px] cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {awaitingCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-[#2563eb] text-white text-[9px] font-bold w-[16px] h-[16px] flex items-center justify-center rounded-full leading-none shadow-sm">
                            {awaitingCount > 99 ? '99+' : awaitingCount}
                          </div>
                        )}
                        <UserPlus size={18} strokeWidth={2} />
                      </div>
                      <div 
                        onClick={() => navigate("/trip-verifications")}
                        className="relative flex items-center justify-center w-[32px] h-[32px] rounded-[10px] cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {pendingVerificationsCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] font-bold w-[16px] h-[16px] flex items-center justify-center rounded-full leading-none shadow-sm">
                            {pendingVerificationsCount > 99 ? '99+' : pendingVerificationsCount}
                          </div>
                        )}
                        <ShieldCheck size={18} strokeWidth={2} />
                      </div>
                      <div 
                        onClick={() => navigate("/support-tickets")}
                        className="relative flex items-center justify-center w-[32px] h-[32px] rounded-[10px] cursor-pointer transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        {openTicketsCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-[16px] h-[16px] flex items-center justify-center rounded-full leading-none shadow-sm">
                            {openTicketsCount > 99 ? '99+' : openTicketsCount}
                          </div>
                        )}
                        <Headphones size={18} strokeWidth={2} />
                      </div>
                    </div>
                  )}

                  {!isMobile && (
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: "profile",
                            label: <span className="text-[14px]">Profile</span>,
                            icon: <UserOutlined className="text-[16px]" />,
                          },
                          {
                            type: "divider",
                          },
                          {
                            key: "logout",
                            label: <span className="text-[14px]">Logout</span>,
                            icon: <LogoutOutlined className="text-[16px]" />,
                            danger: true,
                            onClick: async () => {
                              await dispatch(logoutAsync());
                              navigate("/login");
                            },
                          },
                        ],
                      }}
                      trigger={["click"]}
                      placement="bottomRight"
                    >
                      <div className="flex items-center gap-2.5 cursor-pointer border-l border-gray-200 dark:border-slate-700 pl-4 ml-2">
                        <Avatar
                          size={32}
                          icon={<UserOutlined />}
                          className="border border-gray-200 dark:border-slate-700 shadow-sm"
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-[13px] text-slate-800 dark:text-white leading-tight">
                            {currentUser?.name || "Member User"}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight mt-[1px]">
                            {role === "super_admin" ? "SUPER ADMIN" : "ADMIN"}
                          </span>
                        </div>
                      </div>
                    </Dropdown>
                  )}

                  {isMobile && (
                    <Button
                      type="text"
                      icon={<LogoutOutlined />}
                      danger
                      onClick={async () => {
                        await dispatch(logoutAsync());
                        navigate("/login");
                      }}
                    />
                  )}
                </div>
              </Header>
            )}
            <Content>
              <div
                className={`w-full bg-[#F7F8FB] dark:bg-[#0b1121] overflow-y-auto ${
                  isAuthenticated && location.pathname !== "/login"
                    ? isMobile
                      ? "pt-16 h-[100dvh]"
                      : "h-[calc(100dvh-64px)]"
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
                  <img
                    src={logo}
                    alt=""
                    className={`w-8 h-8 object-contain transition-all duration-300 ${isDarkMode ? "invert brightness-200" : ""}`}
                  />
                  <span>VDrive Admin</span>
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
                      <div className="text-xs text-gray-500">{currentUser?.email || "—"}</div>
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
    children: buildModuleRoutes(),
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
