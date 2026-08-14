import { useState, useEffect } from "react";
import { Button, Pagination } from "antd";
import { Download, Search, FileText, CheckCircle2, Clock, XCircle, IndianRupee, CreditCard, User, Phone } from "lucide-react";
import axios from "../api/axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import dayjs from "dayjs";

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [totalRecords, setTotalRecords] = useState(0);
  const [stats, setStats] = useState({ totalAmount: 0, successCount: 0, pendingCount: 0, failedCount: 0 });

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      if (currentPage !== 1) setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, currentPage]);

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, debouncedSearch, statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/recharge-plans/payments", {
        params: {
          page: currentPage,
          limit: pageSize,
          search: debouncedSearch,
          status: statusFilter === "ALL" ? "" : statusFilter
        }
      });
      setPayments(res.data?.data?.data || []);
      setTotalRecords(res.data?.data?.total || 0);
      if (res.data?.data?.stats) {
        setStats(res.data.data.stats);
      }
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

  const handleExportAll = async () => {
    try {
      setLoading(true);
      // Fetch a large limit to export the current filtered dataset
      const res = await axios.get("/api/recharge-plans/payments", {
        params: {
          page: 1,
          limit: 100000,
          search: debouncedSearch,
          status: statusFilter === "ALL" ? "" : statusFilter
        }
      });
      
      const exportData = res.data?.data?.data || [];
      const doc = new jsPDF();
      doc.text("Payment History Report", 14, 20);

      const tableData = exportData.map((p: any) => [
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
    } catch (err) {
      console.error("Failed to export payments", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <span className="text-[10px] font-black px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">SUCCESS</span>;
      case "PENDING":
        return <span className="text-[10px] font-black px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase tracking-widest">PENDING</span>;
      case "FAILED":
      default:
        return <span className="text-[10px] font-black px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 uppercase tracking-widest">{status}</span>;
    }
  };

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
            {totalRecords} results
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
                onClick={() => { setStatusFilter("ALL"); setCurrentPage(1); }}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${statusFilter === "ALL"
                  ? "bg-blue-50/80 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <FileText size={14} />
                  <span>All Payments</span>
                </div>
              </div>

              <div
                onClick={() => { setStatusFilter("SUCCESS"); setCurrentPage(1); }}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${statusFilter === "SUCCESS"
                  ? "bg-emerald-50/80 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <span>Success</span>
                </div>
              </div>

              <div
                onClick={() => { setStatusFilter("PENDING"); setCurrentPage(1); }}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${statusFilter === "PENDING"
                  ? "bg-amber-50/80 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <Clock size={14} className="text-amber-500" />
                  <span>Pending</span>
                </div>
              </div>

              <div
                onClick={() => { setStatusFilter("FAILED"); setCurrentPage(1); }}
                className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-all ${statusFilter === "FAILED"
                  ? "bg-rose-50/80 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 font-medium"
                  }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <XCircle size={14} className="text-rose-500" />
                  <span>Failed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right Content Area ─────────────────────────────────────── */}
        <div className="flex-grow flex flex-col min-w-0 relative h-full">
          <div className="flex-grow flex flex-col p-3 overflow-y-auto custom-scrollbar gap-2 pb-20">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-1">
              {/* 1. Total Amount */}
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

              {/* 2. Successful */}
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

              {/* 3. Pending */}
              <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center text-base bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 z-10">
                      <Clock size={14} />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest z-10">PENDING</p>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2 z-10">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{stats.pendingCount}</h3>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 text-[100px] opacity-[0.04] pointer-events-none text-amber-600 dark:text-amber-400">
                    <Clock size={100} />
                  </div>
                </div>
              </div>

              {/* 4. Failed */}
              <div className="bg-white dark:bg-slate-900 px-5 py-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between h-[110px] shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 flex items-center justify-center text-base bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 z-10">
                      <XCircle size={14} />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 text-[13px] font-bold m-0 uppercase tracking-widest z-10">FAILED</p>
                  </div>
                </div>
                <div className="flex items-end justify-between mt-2 z-10">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-1.5">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white m-0 leading-none">{stats.failedCount}</h3>
                    </div>
                  </div>
                  <div className="absolute -bottom-4 -right-4 text-[100px] opacity-[0.04] pointer-events-none text-rose-600 dark:text-rose-400">
                    <XCircle size={100} />
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Table */}
            <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0 relative">
              {loading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-20 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="border-b border-gray-100 dark:border-slate-700/60 sticky top-0 bg-white dark:bg-[#0f172a] z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-4 py-3 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        Driver Info
                      </th>
                      <th className="px-4 py-3 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-4 py-3 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        Method/Txn ID
                      </th>
                      <th className="px-4 py-3 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider border-l border-gray-100 dark:border-slate-700/60 text-center w-20">
                        Invoice
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
                    {payments.length > 0 ? (
                      payments.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="px-4 py-2.5 w-32">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                {dayjs(p.created_at).format("DD MMM YYYY")}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                {dayjs(p.created_at).format("hh:mm A")}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                                <User size={12} className="shrink-0 text-slate-400" />
                                <span className="text-xs font-black truncate max-w-[150px]">
                                  {p.driver_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                <Phone size={12} className="shrink-0" />
                                <span className="text-[10px] font-medium leading-none">
                                  {p.driver_phone}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 uppercase tracking-widest">
                              {p.plan_name}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1">
                              <IndianRupee size={12} className="text-emerald-600 dark:text-emerald-400" />
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-tighter leading-none">
                                {Number(p.amount).toLocaleString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            {getStatusBadge(p.payment_status)}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="flex items-center gap-1 text-[9px] font-black text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 uppercase tracking-widest">
                                <CreditCard size={10} />
                                {p.payment_method || "N/A"}
                              </span>
                              {p.transaction_id && (
                                <span className="text-[9px] font-mono text-slate-400 bg-transparent px-1 border-b border-dashed border-slate-300 dark:border-slate-600">
                                  Tx: {p.transaction_id}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-center border-l border-gray-100 dark:border-slate-700/60 w-20">
                            <button
                              className="p-1.5 text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-colors cursor-pointer opacity-80 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownloadInvoice(p);
                              }}
                              title="Download Invoice"
                            >
                              <FileText size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-16 text-center bg-white dark:bg-[#0f172a]">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-full text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-slate-700">
                              <Search size={24} />
                            </div>
                            <p className="text-slate-400 text-xs font-medium">
                              No payments found matching your criteria.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Sticky Pagination Footer */}
            <div className="absolute bottom-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 flex items-center justify-between z-10 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                Showing {totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
                {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} payments
              </span>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalRecords}
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
    </div>
  );
};

export default PaymentHistory;
