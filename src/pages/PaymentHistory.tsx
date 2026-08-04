import { useState, useEffect, useMemo } from "react";
import { Table, Button, Tag, Pagination } from "antd";
import { Download, Search, FileText, CheckCircle2, Clock, XCircle, IndianRupee } from "lucide-react";
import axios from "../api/axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import dayjs from "dayjs";

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/recharge-plans/payments");
      // res.data.data is { data: [...], total }
      setPayments(res.data?.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch payments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = (record: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Payment Invoice", 14, 22);

    doc.setFontSize(11);
    doc.text(`Driver Name: ${record.driver_name}`, 14, 35);
    doc.text(`Phone: ${record.driver_phone}`, 14, 42);
    doc.text(`Plan: ${record.plan_name}`, 14, 49);
    doc.text(`Amount Paid: Rs. ${record.amount}`, 14, 56);
    doc.text(`Payment Status: ${record.payment_status}`, 14, 63);
    doc.text(`Method: ${record.payment_method}`, 14, 70);
    doc.text(`Transaction ID: ${record.transaction_id || "N/A"}`, 14, 77);
    doc.text(`Date: ${dayjs(record.created_at).format("DD MMM YYYY, hh:mm A")}`, 14, 84);

    doc.save(`Invoice_${record.id}.pdf`);
  };

  const handleExportAll = () => {
    const doc = new jsPDF();
    doc.text("Global Payment History", 14, 20);

    const tableData = payments.map((p: any) => [
      p.driver_name,
      p.plan_name,
      `Rs. ${p.amount}`,
      p.payment_status,
      dayjs(p.created_at).format("DD/MM/YY HH:mm"),
    ]);

    (doc as any).autoTable({
      head: [["Driver Name", "Plan", "Amount", "Status", "Date"]],
      body: tableData,
      startY: 30,
    });

    doc.save("Payment_History_Report.pdf");
  };

  const filteredPayments = payments.filter(
    (p: any) => {
      const matchesSearch = p.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.driver_phone?.includes(searchTerm) ||
        p.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || p.payment_status === statusFilter;
      return matchesSearch && matchesStatus;
    }
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const displayedPayments = filteredPayments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const stats = useMemo(() => {
    const totalAmount = payments.reduce((sum, p: any) => sum + Number(p.amount || 0), 0);
    const successCount = payments.filter((p: any) => p.payment_status === "SUCCESS").length;
    const pendingCount = payments.filter((p: any) => p.payment_status === "PENDING").length;
    const failedCount = payments.filter((p: any) => p.payment_status === "FAILED").length;
    return { totalAmount, successCount, pendingCount, failedCount };
  }, [payments]);

  const columns = [
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => (
        <span className="text-xs text-slate-500 font-medium">
          {dayjs(date).format("DD MMM YYYY, HH:mm")}
        </span>
      ),
    },
    {
      title: "Driver",
      key: "driver",
      render: (_: any, record: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {record.driver_name}
          </span>
          <span className="text-xs text-slate-500">{record.driver_phone}</span>
        </div>
      ),
    },
    {
      title: "Plan",
      dataIndex: "plan_name",
      key: "plan_name",
      render: (plan: string) => (
        <span className="font-semibold text-slate-700 dark:text-slate-300">{plan}</span>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amt: string) => <span className="font-bold text-emerald-600">₹{amt}</span>,
    },
    {
      title: "Status",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (status: string) => (
        <Tag
          color={status === "SUCCESS" ? "success" : status === "PENDING" ? "warning" : "error"}
          className="font-bold"
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Method",
      dataIndex: "payment_method",
      key: "payment_method",
      render: (method: string) => (
        <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
          {method}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <button
          onClick={() => handleDownloadInvoice(record)}
          className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg flex items-center justify-center transition-colors"
          title="Download Invoice PDF"
        >
          <FileText size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#f8f9fa] dark:bg-[#0b0f19] overflow-hidden">
      {/* Top Navbar */}
      <div className="bg-white dark:bg-slate-800 h-12 px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 z-0 flex-shrink-0">
        {/* Title & Description */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <FileText size={16} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 !m-0 !mb-1 leading-none">Payments</h1>
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0">History</p>
        </div>

        <div className="relative flex-1 max-w-xl mx-auto flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all h-9">
          <Search className="absolute left-3 text-slate-400 text-[16px]" />
          <input
            type="text"
            placeholder="Search payments by name, phone or ID..."
            className="w-full pl-10 pr-4 py-1.5 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400 border-none shadow-none focus:ring-0"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {filteredPayments.length} results
          </span>

          <Button
            type="primary"
            icon={<Download className="text-lg" />}
            onClick={handleExportAll}
            className="px-4 h-10 rounded-lg font-bold text-xs uppercase tracking-wider border-none !bg-blue-600 hover:!bg-blue-700 text-white shadow-sm flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-all"
          >
            Export Report
          </Button>
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
                onClick={() => setStatusFilter("ALL")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${statusFilter === "ALL"
                  ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <FileText size={14} />
                  <span>All Payments</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusFilter === "ALL"
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {payments.length}
                </span>
              </div>

              <div
                onClick={() => setStatusFilter("SUCCESS")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${statusFilter === "SUCCESS"
                  ? "bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Success</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusFilter === "SUCCESS"
                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {stats.successCount}
                </span>
              </div>

              <div
                onClick={() => setStatusFilter("PENDING")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${statusFilter === "PENDING"
                  ? "bg-amber-50/80 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <Clock size={14} className="text-amber-500" />
                  <span>Pending</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusFilter === "PENDING"
                  ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {stats.pendingCount}
                </span>
              </div>

              <div
                onClick={() => setStatusFilter("FAILED")}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${statusFilter === "FAILED"
                  ? "bg-rose-50/80 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <XCircle size={14} className="text-rose-500" />
                  <span>Failed</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusFilter === "FAILED"
                  ? "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}>
                  {stats.failedCount}
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
              {/* 1. Total Payments */}
              <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center text-base bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 z-10">
                      <FileText size={14} />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest z-10">TOTAL PAYMENTS</p>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2 z-10">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{payments.length}</h3>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 text-[100px] opacity-[0.04] pointer-events-none text-indigo-600 dark:text-indigo-400">
                    <FileText size={100} />
                  </div>
                </div>
              </div>

              {/* 2. Total Amount */}
              <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center text-base bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 z-10">
                      <IndianRupee size={14} />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest z-10">TOTAL AMOUNT</p>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2 z-10">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">₹{stats.totalAmount.toLocaleString()}</h3>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 text-[100px] opacity-[0.04] pointer-events-none text-emerald-600 dark:text-emerald-400">
                    <IndianRupee size={100} />
                  </div>
                </div>
              </div>

              {/* 3. Successful */}
              <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center text-base bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 z-10">
                      <CheckCircle2 size={14} />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest z-10">SUCCESSFUL</p>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2 z-10">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{stats.successCount}</h3>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 text-[100px] opacity-[0.04] pointer-events-none text-indigo-600 dark:text-indigo-400">
                    <CheckCircle2 size={100} />
                  </div>
                </div>
              </div>

              {/* 4. Failed/Pending */}
              <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center text-base bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 z-10">
                      <XCircle size={14} />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest z-10">FAILED & PENDING</p>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2 z-10">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{stats.failedCount + stats.pendingCount}</h3>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 text-[100px] opacity-[0.04] pointer-events-none text-rose-600 dark:text-rose-400">
                    <XCircle size={100} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0 rounded-none dark-theme-table-override pb-1">
              <Table
                columns={columns}
                dataSource={displayedPayments}
                rowKey="id"
                loading={loading}
                pagination={false}
                className="custom-table flex-1 overflow-y-auto"
                scroll={{ y: 'max-content' }}
              />
            </div>
            
            {/* Sticky Pagination Footer */}
            <div className="absolute bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-805 px-6 flex items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                Showing {filteredPayments.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
                {Math.min(currentPage * pageSize, filteredPayments.length)} of {filteredPayments.length} payments
              </span>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredPayments.length}
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
      <style>{`
        /* Custom Header Styling to match coupons table */
        .dark-theme-table-override .ant-table-thead > tr > th {
          color: #64748b !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }

        /* Dark Mode overrides for Antd Table */
        .dark .dark-theme-table-override .ant-table {
          background-color: transparent !important;
        }
        .dark .dark-theme-table-override .ant-table-thead > tr > th {
          background-color: transparent !important;
          color: #94a3b8 !important;
          border-bottom: 1px solid #334155 !important;
        }
        .dark .dark-theme-table-override .ant-table-tbody > tr > td {
          border-bottom: 1px solid #334155 !important;
          background-color: transparent !important;
        }
        .dark .dark-theme-table-override .ant-table-tbody > tr.ant-table-row:hover > td {
          background-color: #1e293b !important;
        }
        .dark .dark-theme-table-override .ant-table-placeholder {
          background-color: transparent !important;
        }
        .dark .dark-theme-table-override .ant-table-placeholder:hover > td {
          background-color: transparent !important;
        }
        .dark .dark-theme-table-override .ant-table-placeholder > td.ant-table-cell {
          background-color: transparent !important;
          border-bottom: 1px solid #334155 !important;
        }
        .dark .dark-theme-table-override .ant-empty-description {
          color: #94a3b8 !important;
        }
        .dark .dark-theme-table-override .ant-pagination-item {
          background-color: transparent !important;
          border-color: #334155 !important;
        }
        .dark .dark-theme-table-override .ant-pagination-item a {
          color: #94a3b8 !important;
        }
        .dark .dark-theme-table-override .ant-pagination-item-active {
          background-color: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .dark .dark-theme-table-override .ant-pagination-item-active a {
          color: #ffffff !important;
        }
      `}</style>
    </div>
  );
};

export default PaymentHistory;
