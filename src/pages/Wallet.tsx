import React, { useEffect, useState } from "react";
import { WalletOutlined, ArrowDownOutlined, ArrowUpOutlined, FileTextOutlined, AccountBookOutlined } from "@ant-design/icons";

import EarningsStatCard from "../components/Earnings/EarningsStatCard";
import WalletBalanceOverviewChart from "../components/Wallet/WalletBalanceOverviewChart";
import WalletDistributionChart from "../components/Wallet/WalletDistributionChart";
import LowBalanceDrivers from "../components/Wallet/LowBalanceDrivers";
import QuickWalletActions from "../components/Wallet/QuickWalletActions";
import WalletTransactionsTable from "../components/Wallet/WalletTransactionsTable";
import TopUpSummary from "../components/Wallet/TopUpSummary";
import PaymentMethods from "../components/Wallet/PaymentMethods";

const MOCK_DATA = {
  stats: {
    totalWalletBalance: 1875430,
    totalWalletBalanceTrend: 12.6,
    totalTopups: 432520,
    totalTopupsTrend: 15.3,
    totalWithdrawals: 128750,
    totalWithdrawalsTrend: -8.4,
    activeWallets: 6842,
    activeWalletsTrend: 10.2,
    pendingAdjustments: 28,
  },
  overview: [
    { date: "07 May", balance: 5000 },
    { date: "08 May", balance: 12000 },
    { date: "09 May", balance: 9500 },
    { date: "10 May", balance: 1642380 },
    { date: "11 May", balance: 14000 },
    { date: "12 May", balance: 18000 },
    { date: "13 May", balance: 1875430 },
  ],
  distribution: {
    total: 1875430,
    data: [
      { range: "0 - ₹500", percentage: 24.2, amount: 454120, color: "#10b981" },
      { range: "₹501 - ₹2,000", percentage: 34.6, amount: 649870, color: "#f59e0b" },
      { range: "₹2,001 - ₹5,000", percentage: 22.1, amount: 414850, color: "#3b82f6" },
      { range: "₹5,001+", percentage: 19.1, amount: 356590, color: "#eab308" },
    ]
  },
  lowBalanceDrivers: [
    { id: "1", name: "Ramesh Babu", vehicleNo: "TN 09 AB 1234", balance: 120 },
    { id: "2", name: "Karthik Raja", vehicleNo: "TN 11 CD 5678", balance: 210 },
    { id: "3", name: "Prakash N", vehicleNo: "TN 22 EF 9012", balance: 315 },
    { id: "4", name: "Manikandan M", vehicleNo: "TN 07 GH 3456", balance: 420 },
    { id: "5", name: "Suresh Kumar", vehicleNo: "TN 18 IJ 7890", balance: 480 },
  ],
  transactions: [
    { id: "WTXN12541", type: "Top-up", driver: { name: "Arun Kumar", phone: "+91 98765 43210" }, paymentMethod: "UPI", date: "13 May 2025, 10:24 AM", amount: 1000, walletBalance: 2450, status: "Success" },
    { id: "WTXN12540", type: "Adjustment", driver: { name: "Priya Sharma", phone: "+91 91234 56789" }, paymentMethod: "Manual", date: "13 May 2025, 09:58 AM", amount: -300, walletBalance: 1450, status: "Success" },
    { id: "WTXN12539", type: "Top-up", driver: { name: "Vijay Prakash", phone: "+91 99887 66554" }, paymentMethod: "Razorpay", date: "13 May 2025, 09:35 AM", amount: 500, walletBalance: 1750, status: "Success" },
    { id: "WTXN12538", type: "Withdrawal", driver: { name: "Manikandan M", phone: "+91 97889 11223" }, paymentMethod: "Bank Transfer", date: "13 May 2025, 09:12 AM", amount: -1000, walletBalance: 520, status: "Success" },
    { id: "WTXN12537", type: "Top-up", driver: { name: "Suresh Kumar", phone: "+91 90123 44556" }, paymentMethod: "UPI", date: "13 May 2025, 08:45 AM", amount: 249, walletBalance: 749, status: "Success" },
  ] as any,
  topUpSummary: {
    totalTopups: 432520,
    averageTopup: 240,
    transactionCount: 18,
  },
  paymentMethods: [
    { name: "UPI", amount: 245760, percentage: 56.2, icon: <WalletOutlined /> },
    { name: "Razorpay", amount: 132450, percentage: 30.3, icon: <WalletOutlined /> },
    { name: "Card", amount: 38210, percentage: 8.7, icon: <AccountBookOutlined /> },
    { name: "Net Banking", amount: 17890, percentage: 4.1, icon: <WalletOutlined /> },
    { name: "Other", amount: 6210, percentage: 0.7, icon: <WalletOutlined /> },
  ]
};

const Wallet: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Simulating API call
    const timer = setTimeout(() => {
      setData(MOCK_DATA);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !data) {
    return <div className="p-4 flex items-center justify-center h-full text-slate-500">Loading Wallet Data...</div>;
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-3 md:p-4 gap-4 bg-[#F8FAFC] dark:bg-slate-900 transition-colors duration-300">
      
      {/* Row 1: Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 shrink-0">
        <EarningsStatCard
          title="Total Wallet Balance"
          value={`₹${data.stats.totalWalletBalance.toLocaleString()}`}
          trend={data.stats.totalWalletBalanceTrend}
          trendText="vs previous period"
          icon={<WalletOutlined />}
          iconBgColor="#eff6ff"
          iconColor="#3b82f6"
        />
        <EarningsStatCard
          title="Total Top-ups (Today)"
          value={`₹${data.stats.totalTopups.toLocaleString()}`}
          trend={data.stats.totalTopupsTrend}
          trendText="vs yesterday"
          icon={<ArrowDownOutlined />}
          iconBgColor="#ecfdf5"
          iconColor="#10b981"
        />
        <EarningsStatCard
          title="Total Withdrawals (Today)"
          value={`₹${data.stats.totalWithdrawals.toLocaleString()}`}
          trend={data.stats.totalWithdrawalsTrend}
          trendText="vs yesterday"
          icon={<ArrowUpOutlined />}
          iconBgColor="#fffbeb"
          iconColor="#f59e0b"
        />
        <EarningsStatCard
          title="Active Wallets"
          value={data.stats.activeWallets.toLocaleString()}
          trend={data.stats.activeWalletsTrend}
          trendText="vs previous period"
          icon={<WalletOutlined />}
          iconBgColor="#eff6ff"
          iconColor="#3b82f6"
        />
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 sm:p-4 border border-gray-100 dark:border-slate-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex items-center gap-3">
          <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 shadow-sm bg-purple-50 dark:bg-purple-900/20 text-purple-600">
            <FileTextOutlined className="text-xl" />
          </div>
          <div className="flex flex-col flex-1 justify-center min-w-0">
            <span className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1 truncate w-full">
              Pending Adjustments
            </span>
            <div className="flex flex-col xl:flex-row xl:items-baseline gap-1 xl:gap-2">
              <span className="text-[20px] font-extrabold text-slate-800 dark:text-white leading-none tracking-tight truncate">
                {data.stats.pendingAdjustments}
              </span>
              <span className="text-blue-500 font-medium text-xs mt-1 xl:mt-0 cursor-pointer hover:underline">
                View items &rarr;
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 shrink-0">
        <div className="lg:col-span-5 h-full">
          <WalletBalanceOverviewChart data={data.overview} />
        </div>
        <div className="lg:col-span-4 h-full">
          <WalletDistributionChart 
            total={data.distribution.total}
            data={data.distribution.data}
          />
        </div>
        <div className="lg:col-span-3 h-full">
          <LowBalanceDrivers drivers={data.lowBalanceDrivers} />
        </div>
      </div>

      {/* Row 3: Actions */}
      <QuickWalletActions />

      {/* Row 4: Transactions & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 shrink-0 min-h-[300px]">
        <div className="lg:col-span-8 h-full">
          <WalletTransactionsTable transactions={data.transactions} />
        </div>
        <div className="lg:col-span-4 h-full flex flex-col gap-3">
          <TopUpSummary {...data.topUpSummary} />
          <PaymentMethods methods={data.paymentMethods} />
        </div>
      </div>

    </div>
  );
};

export default Wallet;
