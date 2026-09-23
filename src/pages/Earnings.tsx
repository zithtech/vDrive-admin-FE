import React, { useEffect, useState } from "react";
import { PiCurrencyInr } from "react-icons/pi";
import { CrownOutlined, WalletOutlined, FileTextOutlined } from "@ant-design/icons";

import EarningsStatCard from "../components/Earnings/EarningsStatCard";
import EarningsOverviewChart from "../components/Earnings/EarningsOverviewChart";
import EarningsBySourceChart from "../components/Earnings/EarningsBySourceChart";
import EarningsSummaryCard from "../components/Earnings/EarningsSummaryCard";
import EarningsTransactionsTable from "../components/Earnings/EarningsTransactionsTable";
import TopSubscriptionPlans from "../components/Earnings/TopSubscriptionPlans";
import TopUpDistribution from "../components/Earnings/TopUpDistribution";

// import axiosIns from "../api/axios";

const MOCK_DATA = {
  stats: {
    totalEarnings: 245680,
    totalEarningsTrend: 15.7,
    subscriptionEarnings: 158430,
    subscriptionEarningsTrend: 16.2,
    walletTopUpEarnings: 87250,
    walletTopUpEarningsTrend: 14.3,
    totalTransactions: 3842,
    totalTransactionsTrend: 13.8,
  },
  earningsOverview: [
    { date: "07 May", total: 60000, subscription: 40000, topups: 20000 },
    { date: "08 May", total: 110000, subscription: 70000, topups: 40000 },
    { date: "09 May", total: 95000, subscription: 60000, topups: 35000 },
    { date: "10 May", total: 182450, subscription: 115230, topups: 67220 },
    { date: "11 May", total: 140000, subscription: 90000, topups: 50000 },
    { date: "12 May", total: 160000, subscription: 100000, topups: 60000 },
    { date: "13 May", total: 200000, subscription: 120000, topups: 80000 },
  ],
  earningsBySource: {
    total: 245680,
    subscriptions: { amount: 158430, percentage: 64.5 },
    walletTopUps: { amount: 87250, percentage: 35.5 },
  },
  earningsSummary: {
    today: 28430,
    yesterday: 31750,
    thisWeek: 182450,
    thisMonth: 745680,
    lastMonth: 632410,
  },
  transactions: [
    { id: "TXN12541", type: "Subscription", user: { name: "Arun Kumar", phone: "+91 98765 43210" }, planOrAmount: { title: "Premium Plan", subtitle: "Monthly" }, paymentMethod: "UPI", date: "13 May 2025, 10:24 AM", amount: 1499, status: "Success" },
    { id: "TXN12540", type: "Top-up", user: { name: "Priya Sharma", phone: "+91 91234 56789" }, planOrAmount: { title: "Wallet Top-up", subtitle: "₹500" }, paymentMethod: "UPI", date: "13 May 2025, 09:58 AM", amount: 500, status: "Success" },
    { id: "TXN12539", type: "Subscription", user: { name: "Vijay Prakash", phone: "+91 99887 66554" }, planOrAmount: { title: "Elite Plan", subtitle: "Monthly" }, paymentMethod: "Card", date: "13 May 2025, 09:35 AM", amount: 999, status: "Success" },
    { id: "TXN12538", type: "Top-up", user: { name: "Manikandan M", phone: "+91 97889 11223" }, planOrAmount: { title: "Wallet Top-up", subtitle: "₹1,000" }, paymentMethod: "Razorpay", date: "13 May 2025, 09:12 AM", amount: 1000, status: "Success" },
    { id: "TXN12537", type: "Subscription", user: { name: "Suresh Kumar", phone: "+91 90123 44556" }, planOrAmount: { title: "Basic Plan", subtitle: "Weekly" }, paymentMethod: "UPI", date: "13 May 2025, 08:45 AM", amount: 249, status: "Success" },
  ] as any,
  topSubscriptionPlans: [
    { rank: 1, name: "Premium Plan", revenue: 7497000, count: 425 },
    { rank: 2, name: "Elite Plan", revenue: 4845000, count: 312 },
    { rank: 3, name: "Basic Plan", revenue: 2031000, count: 198 },
    { rank: 4, name: "Daily Plan", revenue: 812000, count: 112 },
  ],
  topUpDistribution: [
    { range: "₹0 - ₹500", percentage: 62.5, count: 1562 },
    { range: "₹501 - ₹1,000", percentage: 24.3, count: 607 },
    { range: "₹1,001 - ₹2,000", percentage: 9.8, count: 245 },
    { range: "₹2,001+", percentage: 3.4, count: 85 },
  ],
};

const Earnings: React.FC = () => {
  const [data, setData] = useState<any>(MOCK_DATA);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // In the future, this will be replaced with an actual API call
    // const fetchEarningsData = async () => {
    //   try {
    //     const response = await axiosIns.get("/api/earnings/dashboard");
    //     if (response.data.success) {
    //       setData(response.data.data);
    //     }
    //   } catch (error) {
    //     console.error("Failed to fetch earnings data:", error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchEarningsData();

    // Simulating API call for now
    const timer = setTimeout(() => {
      setData(MOCK_DATA);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <div className="p-4 flex items-center justify-center h-full text-slate-500">Loading Earnings Data...</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-2 md:p-3 gap-3 bg-[#F8FAFC] dark:bg-slate-900 transition-colors duration-300">
      
      {/* Row 1: Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <EarningsStatCard
          title="Total Earnings"
          value={`₹${data.stats.totalEarnings.toLocaleString()}`}
          trend={data.stats.totalEarningsTrend}
          trendText="vs previous period"
          icon={<PiCurrencyInr />}
          iconBgColor="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
          iconColor="#ffffff"
        />
        <EarningsStatCard
          title="Subscription Earnings"
          value={`₹${data.stats.subscriptionEarnings.toLocaleString()}`}
          trend={data.stats.subscriptionEarningsTrend}
          trendText="vs previous period"
          icon={<CrownOutlined />}
          iconBgColor="linear-gradient(135deg, #10b981 0%, #059669 100%)"
          iconColor="#ffffff"
        />
        <EarningsStatCard
          title="Wallet Top-up Earnings"
          value={`₹${data.stats.walletTopUpEarnings.toLocaleString()}`}
          trend={data.stats.walletTopUpEarningsTrend}
          trendText="vs previous period"
          icon={<WalletOutlined />}
          iconBgColor="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
          iconColor="#ffffff"
        />
        <EarningsStatCard
          title="Total Transactions"
          value={data.stats.totalTransactions.toLocaleString()}
          trend={data.stats.totalTransactionsTrend}
          trendText="vs previous period"
          icon={<FileTextOutlined />}
          iconBgColor="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
          iconColor="#ffffff"
        />
      </div>

      {/* Row 2: Charts and Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 shrink-0">
        <div className="lg:col-span-5 h-full">
          <EarningsOverviewChart data={data.earningsOverview} />
        </div>
        <div className="lg:col-span-4 h-full">
          <EarningsBySourceChart 
            total={data.earningsBySource.total}
            subscriptions={data.earningsBySource.subscriptions}
            walletTopUps={data.earningsBySource.walletTopUps}
          />
        </div>
        <div className="lg:col-span-3 h-full">
          <EarningsSummaryCard data={data.earningsSummary} />
        </div>
      </div>

      {/* Row 3: Transactions and Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 shrink-0 min-h-[300px]">
        <div className="lg:col-span-8 h-full">
          <EarningsTransactionsTable 
            transactions={data.transactions}
            total={data.transactions.length}
          />
        </div>
        <div className="lg:col-span-4 h-full flex flex-col gap-3">
          <div className="flex-1">
            <TopSubscriptionPlans plans={data.topSubscriptionPlans} />
          </div>
          <div className="flex-1">
            <TopUpDistribution data={data.topUpDistribution} />
          </div>
        </div>
      </div>

    </div>
  );
};

export default Earnings;
