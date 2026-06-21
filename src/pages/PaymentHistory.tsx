import { useState, useEffect } from "react";
import { Table, Button, Input, Tag } from "antd";
import { Download, Search, FileText } from "lucide-react";
import axios from "../api/axios";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import dayjs from "dayjs";

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
    (p: any) =>
      p.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.driver_phone?.includes(searchTerm) ||
      p.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
    <div className="flex flex-col h-full w-full bg-[#f8f9fa] dark:bg-[#0b0f19] overflow-hidden">
      {/* Top Navbar */}
      <div className="bg-white dark:bg-slate-800 p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4 shadow-sm z-0">
        <div className="flex items-center gap-3 w-48 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider leading-none">
              Payments
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 leading-none">
              History
            </p>
          </div>
        </div>

        <div className="relative flex-1 max-w-3xl flex items-center bg-gray-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
          <Search className="absolute left-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search payments by name, phone or ID..."
            className="w-full pl-10 pr-4 py-2 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4 shrink-0">
          <Button
            type="primary"
            icon={<Download size={16} />}
            onClick={handleExportAll}
            className="bg-emerald-600 hover:bg-emerald-700 border-none rounded-lg font-bold h-10 px-4"
          >
            Export Report
          </Button>
          <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-500/20">
            <span className="text-[11px] font-black tracking-widest uppercase">
              {filteredPayments.length} TRANSACTIONS
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none shadow-sm h-full overflow-hidden flex flex-col">
          <Table
            columns={columns}
            dataSource={filteredPayments}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 15 }}
            className="custom-table flex-1 overflow-y-auto"
            scroll={{ y: 'max-content' }}
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
