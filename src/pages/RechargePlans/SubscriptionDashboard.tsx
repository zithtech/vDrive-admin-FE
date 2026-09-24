import React from "react";
import StatsHeader from "../../components/SubscriptionDashboard/StatsHeader";
import OverviewLineChart from "../../components/SubscriptionDashboard/OverviewLineChart";
import StatusDonutChart from "../../components/SubscriptionDashboard/StatusDonutChart";
import UpcomingExpiriesList from "../../components/SubscriptionDashboard/UpcomingExpiriesList";
import SubscriptionPlansOverview from "../../components/SubscriptionDashboard/SubscriptionPlansOverview";
import RevenueBarChart from "../../components/SubscriptionDashboard/RevenueBarChart";
import PlanDistributionProgress from "../../components/SubscriptionDashboard/PlanDistributionProgress";
import RecentSubscriptionsTable from "../../components/SubscriptionDashboard/RecentSubscriptionsTable";

export const MOCK_SUBSCRIPTION_DATA = {
  stats: {
    totalActive: 1842,
    totalActiveTrend: 12.4,
    newSubscriptions: 236,
    newSubscriptionsTrend: 15.8,
    expiringIn7Days: 312,
    expiringIn7DaysTrend: -8.7,
    expiredSubscriptions: 128,
    expiredSubscriptionsTrend: -6.3,
    subscriptionRevenue: 158430,
    subscriptionRevenueTrend: 16.2,
  },
  overviewChart: [
    { date: "07 May", active: 500 },
    { date: "08 May", active: 1000 },
    { date: "09 May", active: 800 },
    { date: "10 May", active: 1630 },
    { date: "11 May", active: 2000 },
    { date: "12 May", active: 1800 },
    { date: "13 May", active: 2200 },
  ],
  statusDistribution: {
    total: 1842,
    active: { count: 1842, percentage: 62.1 },
    expiringSoon: { count: 312, percentage: 17.5 },
    expired: { count: 128, percentage: 8.6 },
    cancelled: { count: 688, percentage: 11.8 },
  },
  upcomingExpiries: [
    { id: "1", name: "Arun Kumar", vehicle: "TN 09 AB 1234", plan: "Premium Plan", daysLeft: 2 },
    { id: "2", name: "Priya Sharma", vehicle: "TN 11 CD 5678", plan: "Elite Plan", daysLeft: 3 },
    { id: "3", name: "Vijay Prakash", vehicle: "TN 22 EF 9012", plan: "Basic Plan", daysLeft: 4 },
    { id: "4", name: "Manikandan M", vehicle: "TN 07 GH 3456", plan: "Elite Plan", daysLeft: 5 },
    { id: "5", name: "Suresh Kumar", vehicle: "TN 18 IJ 7890", plan: "Premium Plan", daysLeft: 6 },
  ],
  plans: [
    {
      id: "basic",
      name: "Basic Plan",
      price: 399,
      duration: "Week",
      features: [
        "Local One-way Trips",
        "Up to 25 KM per trip",
        "Standard Support",
      ],
      activeSubscriptions: 198,
      tag: "Popular",
      tagColor: "green",
    },
    {
      id: "elite",
      name: "Elite Plan",
      price: 899,
      duration: "Month",
      features: [
        "Local One-way Trips",
        "Long Distance Trips",
        "Priority Support",
        "Scheduled Rides (Limited)",
      ],
      activeSubscriptions: 782,
      tag: "",
    },
    {
      id: "premium",
      name: "Premium Plan",
      price: 1499,
      duration: "Month",
      features: [
        "All Trip Types (Local + Outstation)",
        "Scheduled Rides (Unlimited)",
        "Priority Support",
        "No Distance Limit",
        "Advance Booking",
      ],
      activeSubscriptions: 862,
      tag: "Best Value",
      tagColor: "purple",
    },
    {
      id: "daily",
      name: "Daily Plan",
      price: 99,
      duration: "Day",
      features: [
        "Local One-way Trips",
        "Up to 20 KM per trip",
        "No Auto-Renewal",
      ],
      activeSubscriptions: 26,
      tag: "",
    },
  ],
  revenueChart: [
    { date: "1 May", amount: 20000 },
    { date: "6 May", amount: 40000 },
    { date: "11 May", amount: 60000 },
    { date: "16 May", amount: 80000 },
    { date: "21 May", amount: 50000 },
    { date: "26 May", amount: 70000 },
    { date: "31 May", amount: 90000 },
  ],
  revenueByPlan: [
    { name: "Premium Plan", amount: 1245600, percentage: 50.3, color: "#8b5cf6" },
    { name: "Elite Plan", amount: 875200, percentage: 35.4, color: "#3b82f6" },
    { name: "Basic Plan", amount: 315480, percentage: 12.7, color: "#10b981" },
    { name: "Daily Plan", amount: 39400, percentage: 1.6, color: "#64748b" },
  ],
  recentSubscriptions: [
    {
      id: "SUB12541",
      driver: { name: "Arun Kumar", vehicle: "TN 09 AB 1234" },
      plan: "Premium Plan",
      amount: 1499,
      startDate: "13 May 2025",
      nextRenewal: "13 Jun 2025",
      status: "Active",
      autoRenew: true,
    },
    {
      id: "SUB12540",
      driver: { name: "Priya Sharma", vehicle: "TN 11 CD 5678" },
      plan: "Elite Plan",
      amount: 899,
      startDate: "13 May 2025",
      nextRenewal: "13 Jun 2025",
      status: "Active",
      autoRenew: true,
    },
    {
      id: "SUB12539",
      driver: { name: "Vijay Prakash", vehicle: "TN 22 EF 9012" },
      plan: "Basic Plan",
      amount: 399,
      startDate: "12 May 2025",
      nextRenewal: "19 May 2025",
      status: "Expiring Soon",
      autoRenew: true,
    },
    {
      id: "SUB12538",
      driver: { name: "Manikandan M", vehicle: "TN 07 GH 3456" },
      plan: "Elite Plan",
      amount: 899,
      startDate: "05 May 2025",
      nextRenewal: "05 Jun 2025",
      status: "Active",
      autoRenew: true,
    },
    {
      id: "SUB12537",
      driver: { name: "Suresh Kumar", vehicle: "TN 18 IJ 7890" },
      plan: "Premium Plan",
      amount: 1499,
      startDate: "02 May 2025",
      nextRenewal: "02 Jun 2025",
      status: "Expired",
      autoRenew: false,
    },
  ],
};

const SubscriptionDashboard: React.FC = () => {
  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Subscriptions</h1>
      
      {/* Top Row: Stats */}
      <div className="mb-6">
        <StatsHeader data={MOCK_SUBSCRIPTION_DATA.stats} />
      </div>

      {/* Second Row: Overview Line Chart, Donut Chart, Upcoming Expiries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-6 bg-white rounded-xl shadow-sm border border-slate-100">
          <OverviewLineChart data={MOCK_SUBSCRIPTION_DATA.overviewChart} />
        </div>
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-100">
          <StatusDonutChart data={MOCK_SUBSCRIPTION_DATA.statusDistribution} />
        </div>
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <UpcomingExpiriesList data={MOCK_SUBSCRIPTION_DATA.upcomingExpiries} />
        </div>
      </div>

      {/* Third Row: Subscription Plans */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-6 p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-800">Subscription Plans</h2>
          <button className="text-sm border border-slate-200 rounded-md px-4 py-1.5 hover:bg-slate-50 transition-colors font-medium">Manage Plans</button>
        </div>
        <SubscriptionPlansOverview plans={MOCK_SUBSCRIPTION_DATA.plans} />
      </div>

      {/* Fourth Row: Revenue Bar Chart, Plan Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-slate-100">
          <RevenueBarChart data={MOCK_SUBSCRIPTION_DATA.revenueChart} />
        </div>
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-100">
          <PlanDistributionProgress data={MOCK_SUBSCRIPTION_DATA.revenueByPlan} />
        </div>
      </div>

      {/* Fifth Row: Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 mb-6 p-5">
        <RecentSubscriptionsTable data={MOCK_SUBSCRIPTION_DATA.recentSubscriptions} />
      </div>
    </div>
  );
};

export default SubscriptionDashboard;
