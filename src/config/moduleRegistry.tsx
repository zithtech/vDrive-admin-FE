import React, { lazy, Suspense } from "react";
import { Link, Navigate, type RouteObject } from "react-router-dom";
import type { MenuProps } from "antd";
import {
  HomeOutlined,
  UserOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  TableOutlined,
  EnvironmentOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { PiSteeringWheel } from "react-icons/pi";
import { RiAdminLine, RiQuestionLine } from "react-icons/ri";
import { IoCarOutline } from "react-icons/io5";
import { MdOutlineMoneyOff, MdOutlineAccountBalanceWallet } from "react-icons/md";
import { AiOutlineMail } from "react-icons/ai";

import DashBoard from "../pages/DashBoard";
import { ModuleProtectedRoute } from "../components/ModuleProtectedRoute";
import RouteLoadingFallback from "../components/RouteLoadingFallback";

// ── Lazy-loaded pages (moved here from App.tsx) ──────────────────────────────
// const Earnings = lazy(() => import("../pages/Earnings"));
// const Wallet = lazy(() => import("../pages/Wallet"));
const Profile = lazy(() => import("../pages/Profile"));
const Settings = lazy(() => import("../pages/Settings"));
const Users = lazy(() => import("../pages/Users"));
const Customers = lazy(
  () => import("../pages/Customers") as Promise<{ default: React.ComponentType<any> }>,
);
const Admins = lazy(
  () => import("../pages/Admins") as Promise<{ default: React.ComponentType<any> }>,
);
const InvoiceTemplates = lazy(
  () => import("../pages/InvoiceTemplates") as Promise<{ default: React.ComponentType<any> }>,
);
const TripDetails = lazy(
  () => import("../pages/TripDetails") as Promise<{ default: React.ComponentType<any> }>,
);
const Drivers = lazy(
  () => import("../pages/Drivers") as Promise<{ default: React.ComponentType<any> }>,
);
const DriverApplications = lazy(
  () => import("../pages/DriverApplications") as Promise<{ default: React.ComponentType<any> }>,
);
const DriverOfflineOnboarding = lazy(
  () => import("../pages/DriverOfflineOnboarding") as Promise<{ default: React.ComponentType<any> }>,
);
const DriverPricing = lazy(
  () => import("../pages/DriverPricing") as Promise<{ default: React.ComponentType<any> }>,
);
const PricingAndFareRules = lazy(
  () => import("../pages/Pricing&FareRules") as Promise<{ default: React.ComponentType<any> }>,
);
const Deductions = lazy(
  () => import("../pages/Deductions") as Promise<{ default: React.ComponentType<any> }>,
);
const RechargeLayout = lazy(
  () =>
    import("../pages/RechargePlans/RechargeLayout") as Promise<{
      default: React.ComponentType<any>;
    }>,
);
const ManagePlans = lazy(
  () =>
    import("../pages/RechargePlans/ManagePlans") as Promise<{ default: React.ComponentType<any> }>,
);
const SubscriptionListdata = lazy(
  () =>
    import("../pages/RechargePlans/SubscriptionListdata") as Promise<{
      default: React.ComponentType<any>;
    }>,
);
// const SubscriptionDashboard = lazy(
//   () =>
//     import("../pages/RechargePlans/SubscriptionDashboard") as Promise<{
//       default: React.ComponentType<any>;
//     }>,
// );
const SubscriptionOffers = lazy(
  () => import("../pages/Promotions") as Promise<{ default: React.ComponentType<any> }>,
);
const PaymentHistory = lazy(
  () => import("../pages/PaymentHistory") as Promise<{ default: React.ComponentType<any> }>,
);
const TripTransactions = lazy(
  () => import("../pages/TripTransactions") as Promise<{ default: React.ComponentType<any> }>,
);
const Tax = lazy(() => import("../pages/Tax") as Promise<{ default: React.ComponentType<any> }>);
const PricingCombinations = lazy(
  () => import("../pages/PricingCombinations") as Promise<{ default: React.ComponentType<any> }>,
);
const Coupons = lazy(
  () => import("../pages/Coupons") as Promise<{ default: React.ComponentType<any> }>,
);
const DriverReconciliation = lazy(
  () => import("../pages/DriverReconciliation") as Promise<{ default: React.ComponentType<any> }>,
);
const TripVerifications = lazy(
  () => import("../pages/TripVerifications") as Promise<{ default: React.ComponentType<any> }>,
);
const Notifications = lazy(() => import("../pages/Notifications"));
const SupportTickets = lazy(() => import("../pages/SupportTickets"));
const SosHandle = lazy(() => import("../pages/SosHandle"));
const SupportAnalytics = lazy(() => import("../pages/SupportAnalytics"));
const CustomerEnquiries = lazy(() => import("../pages/CustomerEnquiries"));
const SosHistory = lazy(() => import("../pages/SosHistory"));

type MenuItem = NonNullable<MenuProps["items"]>[number];

export type TopLevelGroup = "dashboard" | "users_drivers" | "trips" | "plans" | "support";

export const TOP_LEVEL_GROUPS: { key: TopLevelGroup; label: string; defaultPath: string }[] = [
  { key: "dashboard", label: "Dashboard", defaultPath: "/" },
  { key: "users_drivers", label: "Users/Drivers", defaultPath: "/customers" },
  { key: "trips", label: "Trips", defaultPath: "/TripDetails" },
  { key: "plans", label: "Plans & Coupons", defaultPath: "/PricingAndFareRules" },
  { key: "support", label: "Support", defaultPath: "/support-tickets" },
];

export interface ModuleEntry {
  /** The top-level navigation group this module belongs to. */
  topGroup: TopLevelGroup;
  /** RBAC gate for both the route and the menu item (read access). */
  rbacModule: string | string[];
  /** The route this entry contributes to the layout's children. */
  route: RouteObject;
  /** Optional sidebar menu item; omit for routes with no nav entry. */
  menu?: MenuItem;
}

// Standard wrapper: Suspense + module guard around a lazy page.
const protect = (module: string | string[], node: React.ReactNode): React.ReactNode => (
  <Suspense fallback={<RouteLoadingFallback />}>
    <ModuleProtectedRoute module={module}>{node}</ModuleProtectedRoute>
  </Suspense>
);

/**
 * Single source of truth for protected pages: each entry contributes a route and
 * (optionally) a sidebar item. Order = sidebar order. Adding a page = add one entry
 * here — no edits to App.tsx's router or menu.
 */
export const MODULE_REGISTRY: ModuleEntry[] = [
  // Dashboard (DashBoard is eager-loaded, so no Suspense on the index route)
  {
    topGroup: "dashboard",
    rbacModule: "dashboard",
    route: {
      index: true,
      element: (
        <ModuleProtectedRoute module="dashboard">
          <DashBoard />
        </ModuleProtectedRoute>
      ),
    },
    menu: { label: <Link to="/">Dashboard</Link>, key: "/", icon: <HomeOutlined /> },
  },
  /*
  {
    topGroup: "dashboard",
    rbacModule: "dashboard",
    route: { path: "earnings", element: protect("dashboard", <Earnings />) },
    menu: { label: <Link to="/earnings">Earnings</Link>, key: "/earnings", icon: <DollarOutlined /> },
  },
  {
    topGroup: "dashboard",
    rbacModule: "dashboard",
    route: { path: "wallet", element: protect("dashboard", <Wallet />) },
    menu: { label: <Link to="/wallet">Wallet</Link>, key: "/wallet", icon: <MdOutlineAccountBalanceWallet /> },
  },
  {
    topGroup: "dashboard",
    rbacModule: "dashboard",
    route: { path: "subscription-dashboard", element: protect("dashboard", <SubscriptionDashboard />) },
    menu: { label: <Link to="/subscription-dashboard">Subscription Dashboard</Link>, key: "/subscription-dashboard", icon: <TableOutlined /> },
  },
  */
  {
    topGroup: "dashboard",
    rbacModule: "dashboard",
    route: { path: "InvoiceTemplates", element: protect("dashboard", <InvoiceTemplates />) },
  },
  {
    topGroup: "dashboard",
    rbacModule: "dashboard",
    route: { path: "profile", element: protect("dashboard", <Profile />) },
  },
  {
    topGroup: "dashboard",
    rbacModule: "dashboard",
    route: { path: "settings", element: protect("dashboard", <Settings />) },
  },

  // Customers
  {
    topGroup: "users_drivers",
    rbacModule: "customers",
    route: { path: "customers", element: protect("customers", <Customers />) },
    menu: { label: <Link to="/customers">Customers</Link>, key: "/customers", icon: <UserOutlined /> },
  },
  {
    topGroup: "users_drivers",
    rbacModule: "customers",
    route: { path: "users", element: protect("customers", <Users />) },
  },

  // Pricing & Fare Rules
  {
    topGroup: "plans",
    rbacModule: "pricing",
    route: {
      path: "PricingAndFareRules",
      element: protect("pricing", <PricingAndFareRules />),
      children: [{ path: "pricing/:id?", element: protect("pricing", <DriverPricing />) }],
    },
    menu: {
      label: <Link to="/PricingAndFareRules">Pricing And Fare Rules</Link>,
      key: "/PricingAndFareRules",
      icon: <DollarOutlined />,
    },
  },
  {
    topGroup: "plans",
    rbacModule: "pricing",
    route: { path: "pricing-combinations", element: protect("pricing", <PricingCombinations />) },
  },

  // Drivers (two menu items, both gated by `drivers`)
  {
    topGroup: "users_drivers",
    rbacModule: "drivers",
    route: { path: "drivers", element: protect("drivers", <Drivers />) },
    menu: { label: <Link to="/drivers">Drivers</Link>, key: "/drivers", icon: <PiSteeringWheel /> },
  },
  {
    topGroup: "users_drivers",
    rbacModule: "drivers",
    route: { path: "driver-applications", element: protect("drivers", <DriverApplications />) },
    menu: {
      label: <Link to="/driver-applications">Driver Applications</Link>,
      key: "/driver-applications",
      icon: <CheckCircleOutlined />,
    },
  },
  {
    topGroup: "users_drivers",
    rbacModule: "drivers",
    route: { path: "driver-offline-onboarding", element: protect("drivers", <DriverOfflineOnboarding />) },
    menu: {
      label: <Link to="/driver-offline-onboarding">Offline Onboarding</Link>,
      key: "/driver-offline-onboarding",
      icon: <UserOutlined />,
    },
  },

  // Driver Outreach
  {
    topGroup: "users_drivers",
    rbacModule: "drivers_outreach",
    route: {
      path: "driver-reconciliation",
      element: protect("drivers_outreach", <DriverReconciliation />),
    },
    menu: {
      label: <Link to="/driver-reconciliation">Driver Outreach</Link>,
      key: "/driver-reconciliation",
      icon: <TableOutlined />,
    },
  },

  // Admins
  {
    topGroup: "dashboard",
    rbacModule: "admins",
    route: { path: "admins", element: protect("admins", <Admins />) },
    menu: { label: <Link to="/admins">Admins</Link>, key: "/admins", icon: <RiAdminLine /> },
  },

  // Trip Details
  {
    topGroup: "trips",
    rbacModule: "trips",
    route: { path: "TripDetails", element: protect("trips", <TripDetails />) },
    menu: { label: <Link to="/TripDetails">Trip Details</Link>, key: "/TripDetails", icon: <IoCarOutline /> },
  },

  // Trip Transactions
  {
    topGroup: "trips",
    rbacModule: "trip_transaction",
    route: { path: "trip-transactions", element: protect("trip_transaction", <TripTransactions />) },
    menu: {
      label: <Link to="/trip-transactions">Trip Transactions</Link>,
      key: "/trip-transactions",
      icon: <EnvironmentOutlined />,
    },
  },

  // Trip Verifications (also gated by `trips`)
  {
    topGroup: "trips",
    rbacModule: "trips",
    route: { path: "trip-verifications", element: protect("trips", <TripVerifications />) },
    menu: {
      label: <Link to="/trip-verifications">Trip Verifications</Link>,
      key: "/trip-verifications",
      icon: <CheckCircleOutlined />,
    },
  },

  // Deductions
  {
    topGroup: "plans",
    rbacModule: "deductions",
    route: { path: "Deductions", element: protect("deductions", <Deductions />) },
    menu: {
      label: <Link to="/Deductions">Deduction Management</Link>,
      key: "/Deductions",
      icon: <MdOutlineMoneyOff />,
    },
  },

  // Recharge Plans (nested layout + submenu)
  {
    topGroup: "plans",
    rbacModule: "recharge",
    route: {
      path: "recharge-plans",
      element: protect("recharge", <RechargeLayout />),
      children: [
        { index: true, element: <Navigate to="manage" replace /> },
        {
          path: "manage",
          element: (
            <Suspense fallback={<RouteLoadingFallback />}>
              <ManagePlans />
            </Suspense>
          ),
        },
        {
          path: "subscriptions",
          element: (
            <Suspense fallback={<RouteLoadingFallback />}>
              <SubscriptionListdata />
            </Suspense>
          ),
        },
        {
          path: "offers",
          element: (
            <Suspense fallback={<RouteLoadingFallback />}>
              <SubscriptionOffers />
            </Suspense>
          ),
        },
        {
          path: "payments",
          element: (
            <Suspense fallback={<RouteLoadingFallback />}>
              <PaymentHistory />
            </Suspense>
          ),
        },
      ],
    },
    menu: {
      label: "Recharge Plans",
      key: "/recharge-plans",
      icon: <MdOutlineAccountBalanceWallet />,
      children: [
        { label: <Link to="/recharge-plans/manage">Manage Plans</Link>, key: "/recharge-plans/manage" },
        {
          label: <Link to="/recharge-plans/subscriptions">Subscription Listdata</Link>,
          key: "/recharge-plans/subscriptions",
        },
        { label: <Link to="/recharge-plans/offers">Offers</Link>, key: "/recharge-plans/offers" },
        {
          label: <Link to="/recharge-plans/payments">Payment History</Link>,
          key: "/recharge-plans/payments",
        },
      ],
    },
  },

  // Taxes
  {
    topGroup: "plans",
    rbacModule: "taxes",
    route: { path: "taxes", element: protect("taxes", <Tax />) },
    menu: { label: <Link to="/taxes">Tax Management</Link>, key: "/taxes", icon: <DollarOutlined /> },
  },

  // Coupons (read access on any of these modules)
  {
    topGroup: "plans",
    rbacModule: ["coupons", "promos", "user_referrals", "driver_referrals"],
    route: {
      path: "coupons",
      element: protect(["coupons", "promos", "user_referrals", "driver_referrals"], <Coupons />),
    },
    menu: { label: <Link to="/coupons">Coupons</Link>, key: "/coupons", icon: <DollarOutlined /> },
  },

  // Notifications
  {
    topGroup: "support",
    rbacModule: "notifications",
    route: { path: "notifications", element: protect("notifications", <Notifications />) },
    menu: {
      label: <Link to="/notifications">Notifications</Link>,
      key: "/notifications",
      icon: <BellOutlined />,
    },
  },

  // Support Tickets
  {
    topGroup: "support",
    rbacModule: "support_tickets",
    route: { path: "support-tickets", element: protect("support_tickets", <SupportTickets />) },
    menu: {
      label: <Link to="/support-tickets">Support Tickets</Link>,
      key: "/support-tickets",
      icon: <RiQuestionLine />,
    },
  },

  // SOS Handle
  {
    topGroup: "dashboard",
    rbacModule: "dashboard",
    route: { path: "sos-handle", element: protect("dashboard", <SosHandle />) },
    menu: {
      label: <Link to="/sos-handle">Active SOS Alerts</Link>,
      key: "/sos-handle",
      icon: <BellOutlined />,
    },
  },
  // SOS History
  {
    topGroup: "dashboard",
    rbacModule: "dashboard",
    route: { path: "sos-history", element: protect("dashboard", <SosHistory />) },
  },

  // Support Analytics (also gated by `support_tickets`)
  {
    topGroup: "support",
    rbacModule: "support_tickets",
    route: { path: "support-analytics", element: protect("support_tickets", <SupportAnalytics />) },
    menu: {
      label: <Link to="/support-analytics">Support Analytics</Link>,
      key: "/support-analytics",
      icon: <RiQuestionLine />,
    },
  },

  // Customer Enquiries
  {
    topGroup: "support",
    rbacModule: "enquiries",
    route: { path: "customer-enquiries", element: protect("enquiries", <CustomerEnquiries />) },
    menu: {
      label: <Link to="/customer-enquiries">Customer Enquiries</Link>,
      key: "/customer-enquiries",
      icon: <AiOutlineMail />,
    },
  },
];

/** 
 * Returns the topGroup for a given path.
 */
export const getTopGroupByPath = (pathname: string): TopLevelGroup => {
  // Find the module entry whose route path matches the current pathname
  const entry = MODULE_REGISTRY.find(e => {
    if (e.route.index && pathname === "/") return true;
    if (!e.route.path) return false;
    // Check if the pathname starts with the route path (e.g. /PricingAndFareRules)
    return pathname.startsWith(`/${e.route.path}`);
  });
  
  return entry ? entry.topGroup : "dashboard";
};

/** The layout route's `children` array, derived from the registry. */
export const buildModuleRoutes = (): RouteObject[] => MODULE_REGISTRY.map((e) => e.route);
