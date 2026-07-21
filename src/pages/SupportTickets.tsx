import React, { useState, useEffect, useRef } from "react";
import {
  Layout,
  Tag,
  Button,
  Typography,
  Input,
  Space,
  Spin,
  Tooltip,
} from "antd";
import { useSearchParams } from "react-router-dom";
import {
  MessageOutlined,
  SendOutlined,
  SearchOutlined,
  UserOutlined,
  CustomerServiceOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Headset } from "lucide-react";
import axiosIns from "../api/axios";
import { useSocket } from "../hooks/useSocket";
import { useAppSelector } from "../store/hooks";
import dayjs from "dayjs";

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

const DRIVER_QUICK_REPLIES = [
  { label: "Greeting", text: "Hello! I am Karthikeyan from Support. How can I help you today?" },
  {
    label: "Subscription",
    text: 'For subscription details, you can view your current plan and renewal options in the "Subscription" section of your Driver App.',
  },
  {
    label: "Documents",
    text: "Your documents are currently under review. Verification typically takes 24-48 hours. We will notify you once it is complete.",
  },
  {
    label: "Payment Issue",
    text: "If you are facing wallet issues, please ensure your payment method is active. If the amount was deducted, it will be credited within 24 hours.",
  },
  {
    label: "Technical Issue",
    text: "Please try logging out and logging back in, or restarting your application. If the issue persists, let me know.",
  },
  { label: "Closing", text: "Is there anything else I can assist you with today?" },
  {
    label: "Farewell",
    text: "Thank you for reaching out to Support. Have a great and safe drive!",
  },
];

const CUSTOMER_QUICK_REPLIES = [
  { label: "Greeting", text: "Hello! I am Karthikeyan from Support. How can I help you today?" },
  {
    label: "Ride Issue",
    text: "We apologize for the inconvenience during your ride. We are looking into this issue and will get back to you.",
  },
  {
    label: "Payment Issue",
    text: "If you were overcharged, we will verify the trip details and initiate a refund if applicable within 24-48 hours.",
  },
  {
    label: "Lost Item",
    text: "Please provide the details of the lost item. We will contact the driver and update you shortly.",
  },
  {
    label: "Technical Issue",
    text: "Please try restarting your app. If the issue persists, ensure you have the latest version installed.",
  },
  { label: "Closing", text: "Is there anything else I can assist you with today?" },
  { label: "Farewell", text: "Thank you for reaching out to Support. Have a great day!" },
];

interface SupportTicket {
  id: string;
  driver_id?: string;
  driver_name?: string;
  user_id?: string;
  user_name?: string;
  subject: string;
  category?: string;
  status: "open" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  created_at: string;
  updated_at: string;
}

const CATEGORY_META: Record<string, { label: string; color: string; icon: string; bg: string }> = {
  payment: { label: "Payment", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10", icon: "💰" },
  documents: { label: "Documents", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-500/10", icon: "📄" },
  app_crash: { label: "App Issue", color: "text-rose-600 dark:text-rose-450", bg: "bg-rose-50 dark:bg-rose-500/10", icon: "🐛" },
  account: { label: "Account", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10", icon: "👤" },
  subscription: { label: "Subscription", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", icon: "📦" },
  rides: { label: "Rides", color: "text-emerald-600 dark:text-emerald-450", bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: "🚗" },
  general: { label: "General", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-500/10", icon: "❓" },
};

const PRIORITY_META: Record<string, { label: string; color: string; bg: string }> = {
  high: { label: "High", color: "text-rose-700 dark:text-rose-450", bg: "bg-rose-50 dark:bg-rose-500/10" },
  medium: { label: "Medium", color: "text-amber-700 dark:text-amber-450", bg: "bg-amber-50 dark:bg-amber-500/10" },
  low: { label: "Low", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
};

interface ChatMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: "driver" | "admin" | "bot" | "system";
  message: string;
  created_at: string;
}

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const getAvatarBg = (name?: string) => {
  if (!name) return "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700";
  const colors = [
    "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50",
    "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50",
    "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50",
    "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-900/50",
    "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50",
    "bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 border-cyan-100 dark:border-cyan-900/50"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const SupportTickets: React.FC = () => {
  const [driverTickets, setDriverTickets] = useState<SupportTicket[]>([]);
  const [customerTickets, setCustomerTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "resolved">("active");
  const [userTypeFilter, setUserTypeFilter] = useState<"drivers" | "customers">("drivers");
  const [searchParams] = useSearchParams();
  const [viewedTickets, setViewedTickets] = useState<Set<string>>(new Set());

  const { socket } = useSocket();
  const { currentUser } = useAppSelector((state) => state.auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllTickets().then((loadedData) => {
      if (!loadedData) return;
      const { drivers, customers } = loadedData;
      const ticketId = searchParams.get("ticketId");
      if (ticketId) {
        const ticket = [...drivers, ...customers].find((t: SupportTicket) => t.id === ticketId);
        if (ticket) {
          setSelectedTicket(ticket);
          setViewedTickets((prev) => new Set(prev).add(ticket.id));
          setUserTypeFilter(ticket.user_id ? "customers" : "drivers");
        }
      }
    });
  }, [searchParams]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);

      // Join socket room
      if (socket) {
        const joinRoom = () => {
          socket.emit("joinSupportTicket", {
            ticketId: selectedTicket.id,
          });
        };

        if (socket.connected) {
          joinRoom();
        }

        socket.on("connect", joinRoom);

        const handleNewMessage = (msg: any) => {
          if (msg.ticket_id === selectedTicket.id) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.find((m) => m.id === msg.id)) return prev;
              return [
                ...prev,
                {
                  id: msg.id,
                  ticket_id: msg.ticket_id,
                  sender_id: msg.sender_id,
                  sender_type: msg.sender_type,
                  message: msg.message,
                  created_at: msg.created_at,
                },
              ];
            });
          }
        };

        const handleTicketStatusUpdate = (data: any) => {
          if (data.ticketId === selectedTicket.id) {
            setSelectedTicket((prev) => (prev ? { ...prev, status: data.status } : null));
          }
        };

        socket.on("receiveSupportMessage", handleNewMessage);
        socket.on("TICKET_STATUS_UPDATE", handleTicketStatusUpdate);

        return () => {
          socket.off("connect", joinRoom);
          socket.off("receiveSupportMessage", handleNewMessage);
          socket.off("TICKET_STATUS_UPDATE", handleTicketStatusUpdate);
        };
      }
    }
  }, [selectedTicket, socket]);

  useEffect(() => {
    if (socket) {
      const handleNewTicket = (newTicket: any) => {
        const isUserTicket = !!newTicket.user_id;
        // Check if ticket belongs to the current tab before adding
        if (isUserTicket) {
          setCustomerTickets((prev) => {
            if (prev.find((t) => t.id === newTicket.id)) return prev;
            return [newTicket, ...prev];
          });
        } else {
          setDriverTickets((prev) => {
            if (prev.find((t) => t.id === newTicket.id)) return prev;
            return [newTicket, ...prev];
          });
        }
      };

      const handleTicketClosed = (data: any) => {
        setDriverTickets((prev) =>
          prev.map((t) => (t.id === data.ticketId ? { ...t, status: "closed" } : t)),
        );
        setCustomerTickets((prev) =>
          prev.map((t) => (t.id === data.ticketId ? { ...t, status: "closed" } : t)),
        );
      };

      if (userTypeFilter === "drivers") {
        socket.on("ADMIN_SUPPORT_TICKET_ALERT", handleNewTicket);
        socket.on("ADMIN_SUPPORT_TICKET_CLOSED", handleTicketClosed);
      } else {
        console.log("inside user ticket");
        socket.on("ADMIN_SUPPORT_USER_TICKET_ALERT", handleNewTicket);
        socket.on("ADMIN_SUPPORT_USER_TICKET_CLOSED", handleTicketClosed);
      }

      return () => {
        if (userTypeFilter === "drivers") {
          socket.off("ADMIN_SUPPORT_TICKET_ALERT", handleNewTicket);
          socket.off("ADMIN_SUPPORT_TICKET_CLOSED", handleTicketClosed);
        } else {
          socket.off("ADMIN_SUPPORT_USER_TICKET_ALERT", handleNewTicket);
          socket.off("ADMIN_SUPPORT_USER_TICKET_CLOSED", handleTicketClosed);
        }
      };
    }
  }, [socket, userTypeFilter]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchAllTickets = async () => {
    setLoading(true);
    try {
      const [driversRes, customersRes] = await Promise.all([
        axiosIns.get("/api/support-management/tickets"),
        axiosIns.get("/api/support-management/tickets/user/all"),
      ]);
      const drivers = driversRes.data.data.tickets || [];
      const customers = customersRes.data.data || [];
      setDriverTickets(drivers);
      setCustomerTickets(customers);
      return { drivers, customers };
    } catch (error) {
      console.error("Failed to fetch tickets", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    setMessagesLoading(true);
    try {
      const endpoint =
        userTypeFilter === "drivers"
          ? `/api/support-management/tickets/${ticketId}/messages`
          : `/api/support-management/tickets/user/${ticketId}/messages`;
      const { data } = await axiosIns.get(endpoint);
      setMessages(data.data);

      // Auto-greeting logic
      const hasAdminMessage = data.data.some((m: any) => m.sender_type === "admin");
      if (!hasAdminMessage && socket && currentUser) {
        const greetingMsg = `Hello! I am ${currentUser.name} from Support. How can I help you today?`;
        const messageData = {
          ticketId,
          senderId: currentUser.id,
          senderType: "admin",
          message: greetingMsg,
        };
        socket.emit("sendSupportMessage", messageData);
      }
    } catch (error) {
      console.error("Failed to fetch messages", error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!replyText.trim() || !selectedTicket) return;

    if (socket) {
      const messageData = {
        ticketId: selectedTicket.id,
        senderId: currentUser?.id,
        senderType: "admin",
        message: replyText.trim(),
      };

      socket.emit("sendSupportMessage", messageData);

      // Optimistic UI update
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          ticket_id: selectedTicket.id,
          sender_id: currentUser?.id || "",
          sender_type: "admin",
          message: replyText.trim(),
          created_at: new Date().toISOString(),
        },
      ]);

      setReplyText("");
    } else {
      console.error("Socket not connected");
    }
  };

  const updateTicketStatus = async (id: string, status: string) => {
    try {
      if (userTypeFilter === "drivers") {
        await axiosIns.put(`/api/support-management/tickets/${id}/status`, { status });
      } else {
        await axiosIns.patch(`/api/support-management/tickets/user/${id}/status`, { status });
      }

      setDriverTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: status as any } : t)),
      );
      setCustomerTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: status as any } : t)),
      );

      if (selectedTicket?.id === id) {
        setSelectedTicket((prev) => (prev ? { ...prev, status: status as any } : null));
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const currentTickets = userTypeFilter === "drivers" ? driverTickets : customerTickets;
  const filteredTickets = currentTickets.filter((t) => {
    const matchesSearch =
      t.subject.toLowerCase().includes(searchText.toLowerCase()) ||
      t.id.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus =
      statusFilter === "active"
        ? t.status === "open"
        : t.status === "resolved" || t.status === "closed";
    return matchesSearch && matchesStatus;
  });

  const driverActiveCount = driverTickets.filter((t) => t.status === "open").length;
  const customerActiveCount = customerTickets.filter((t) => t.status === "open").length;
  const currentActiveCount = currentTickets.filter((t) => t.status === "open").length;
  const currentHistoryCount = currentTickets.filter(
    (t) => t.status === "resolved" || t.status === "closed",
  ).length;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-slate-900">
      {/* Top Navbar */}
      <div className="bg-white dark:bg-slate-800 h-12 px-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 z-0 flex-shrink-0 w-full">
        {/* Title & Description */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Headset size={16} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 !m-0 !mb-1 leading-none">Support Center</h1>
          <div className="w-px h-5 bg-slate-300 dark:bg-slate-600"></div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0">Live Chat Queue</p>
        </div>

        <div className="relative flex-1 max-w-xl mx-auto flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all h-9">
          <SearchOutlined className="absolute left-3 text-slate-400 text-[16px]" />
          <input
            type="text"
            placeholder="Search by ID or subject..."
            className="w-full pl-10 pr-4 py-1.5 bg-transparent text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none placeholder-slate-400"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <div className="absolute right-3">
            <span className="text-[11px] font-bold text-slate-400 border border-slate-200 dark:border-slate-600 rounded-[4px] px-1.5 py-[1px] bg-slate-50/50 dark:bg-slate-800 tracking-wide">
              ⌘K
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[11px] font-black tracking-widest uppercase">
              {filteredTickets.length} TICKETS
            </span>
          </div>

          <button
            onClick={() => fetchAllTickets()}
            className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all shrink-0"
          >
            <ReloadOutlined className={`text-lg ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <Layout className="flex-1 bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* ─── Sidebar Panel ───────────────────────────────────────────── */}
        <Sider
          width={380}
          theme="light"
          className="border-r border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col bg-white dark:bg-slate-900 flex-shrink-0"
        >
          <div className="flex flex-col h-full bg-white dark:bg-slate-900">
            {/* Header Context and Controls */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col gap-4">
              {/* Custom styled switchers */}
              <div className="flex flex-col gap-2.5">
                {/* Sidenav switcher: Drivers / Customers */}
                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg w-full">
                  <button
                    onClick={() => {
                      setUserTypeFilter("drivers");
                      setSelectedTicket(null);
                      setSearchText("");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-extrabold transition-all duration-200 ${userTypeFilter === "drivers"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                  >
                    <UserOutlined />
                    <span>Drivers</span>
                    {driverActiveCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${userTypeFilter === "drivers"
                        ? "bg-blue-500 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}>
                        {driverActiveCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setUserTypeFilter("customers");
                      setSelectedTicket(null);
                      setSearchText("");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-extrabold transition-all duration-200 ${userTypeFilter === "customers"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                  >
                    <UserOutlined />
                    <span>Customers</span>
                    {customerActiveCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${userTypeFilter === "customers"
                        ? "bg-blue-500 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}>
                        {customerActiveCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Sidenav switcher: Active / History */}
                <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg w-full">
                  <button
                    onClick={() => setStatusFilter("active")}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-extrabold transition-all duration-200 ${statusFilter === "active"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                  >
                    <ClockCircleOutlined />
                    <span>Active</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${statusFilter === "active"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}>
                      {currentActiveCount}
                    </span>
                  </button>
                  <button
                    onClick={() => setStatusFilter("resolved")}
                    className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-extrabold transition-all duration-200 ${statusFilter === "resolved"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                  >
                    <HistoryOutlined />
                    <span>History</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${statusFilter === "resolved"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}>
                      {currentHistoryCount}
                    </span>
                  </button>
                </div>

              </div>
            </div>

            {/* Cards Queue List */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/10 p-3 min-h-0 custom-scrollbar flex flex-col gap-2.5">
              {loading ? (
                <div className="flex h-full items-center justify-center p-8">
                  <Spin size="large" />
                </div>
              ) : filteredTickets.length > 0 ? (
                filteredTickets.map((item) => {
                  const isUnread = item.status === "open" && !viewedTickets.has(item.id);
                  const isSelected = selectedTicket?.id === item.id;
                  const meta = CATEGORY_META[item.category || "general"] || CATEGORY_META.general;
                  const priorityMeta = PRIORITY_META[item.priority] || PRIORITY_META.low;
                  const name = userTypeFilter === "customers" ? item.user_name : item.driver_name;
                  const initials = getInitials(name || "Anonymous");
                  const avatarBg = getAvatarBg(name || "Anonymous");

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedTicket(item);
                        setViewedTickets((prev) => new Set(prev).add(item.id));
                      }}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 relative flex flex-col gap-2 ${isSelected
                        ? "bg-white dark:bg-slate-900 border-blue-500 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/10"
                        : isUnread
                          ? "bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/40 shadow-sm hover:border-blue-400"
                          : "bg-white/80 dark:bg-slate-900/80 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900 hover:shadow-sm"
                        }`}
                    >
                      {/* Unread indicator dot */}
                      {isUnread && (
                        <div className="absolute top-4.5 right-4 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                      )}

                      {/* Top row: Initials Avatar + Title + Date */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 flex-shrink-0 rounded-full border flex items-center justify-center font-extrabold text-[10px] uppercase shadow-sm ${avatarBg}`}>
                            {initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className={`text-xs truncate block leading-tight ${isUnread ? "text-slate-900 dark:text-white font-black" : "text-slate-700 dark:text-slate-300 font-bold"}`}>
                              {item.subject}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-1 font-semibold">
                              {name || "Anonymous"}
                            </span>
                          </div>
                        </div>
                        {!isUnread && (
                          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold whitespace-nowrap mt-1">
                            {dayjs(item.created_at).format("MMM DD")}
                          </span>
                        )}
                      </div>

                      {/* Bottom row: Meta Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pl-0.5">
                        <span className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-450 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 border border-slate-200/50 dark:border-slate-700/50 rounded uppercase">
                          #{item.id.split("-")[0].toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${priorityMeta.bg} ${priorityMeta.color} rounded`}>
                          <span className={`w-1 h-1 rounded-full ${item.priority === "high" ? "bg-rose-500" : item.priority === "medium" ? "bg-amber-500" : "bg-blue-500"}`} />
                          {priorityMeta.label}
                        </span>
                        {item.category && item.category !== "general" && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${meta.bg} ${meta.color} rounded`}>
                            <span>{meta.icon}</span>
                            <span>{meta.label}</span>
                          </span>
                        )}
                        {item.status === "resolved" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            RESOLVED
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 font-medium">
                  No {statusFilter} tickets found
                </div>
              )}
            </div>
          </div>
        </Sider>

        {/* ─── Chat Content Panel ──────────────────────────────────────── */}
        <Content className="bg-white dark:bg-slate-900 flex flex-col flex-grow min-w-0">
          {selectedTicket ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-extrabold text-xs uppercase shadow-sm ${getAvatarBg(userTypeFilter === "customers" ? selectedTicket.user_name : selectedTicket.driver_name)}`}>
                    {getInitials(userTypeFilter === "customers" ? selectedTicket.user_name : selectedTicket.driver_name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <Title level={5} className="!mb-0 text-slate-800 dark:text-slate-200 font-extrabold text-sm tracking-tight leading-none">
                        {selectedTicket.subject}
                      </Title>
                      <span className={`inline-flex px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${selectedTicket.status === "open"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        } rounded-none`}>
                        {selectedTicket.status.toUpperCase()}
                      </span>
                    </div>
                    <Text type="secondary" className="text-xs flex items-center gap-1.5 mt-1.5">
                      <span className="text-[9px] font-mono font-bold text-slate-500 dark:text-slate-450 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 border border-slate-200/50 dark:border-slate-700/50 rounded-none">
                        #{selectedTicket.id.toUpperCase()}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {userTypeFilter === "customers" ? "Customer" : "Driver partner"}:{" "}
                        <strong className="text-slate-700 dark:text-slate-300">
                          {userTypeFilter === "customers"
                            ? selectedTicket.user_name || "Anonymous Customer"
                            : selectedTicket.driver_name || "Anonymous Driver"}
                        </strong>
                      </span>
                    </Text>
                  </div>
                </div>
                <Space>
                  {selectedTicket.status === "open" && (
                    <Button
                      type="primary"
                      className="bg-emerald-600 hover:bg-emerald-700 border-none rounded-lg font-bold text-xs uppercase tracking-wider h-8 px-4 flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition-all"
                      onClick={() => {
                        if (socket && currentUser) {
                          socket.emit("sendSupportMessage", {
                            ticketId: selectedTicket.id,
                            senderId: currentUser.id,
                            senderType: "admin",
                            message:
                              "This support session has been closed by the agent. Thank you for contacting T2Drive Support! Have a great day.",
                          });
                        }
                        updateTicketStatus(selectedTicket.id, "resolved");
                      }}
                    >
                      Mark as Resolved
                    </Button>
                  )}
                  <Tooltip title="Refresh Messages">
                    <Button
                      icon={<ReloadOutlined className={messagesLoading ? "animate-spin" : ""} />}
                      onClick={() => fetchMessages(selectedTicket.id)}
                      className="rounded-lg h-8 w-8 flex items-center justify-center border-slate-200 dark:border-slate-700 text-slate-450 dark:text-slate-400 bg-white dark:bg-slate-800"
                    />
                  </Tooltip>
                </Space>
              </div>

              {/* Chat messages */}
              <div className="flex-grow overflow-y-auto p-6 bg-slate-50/70 dark:bg-slate-950/40 custom-scrollbar">
                {messagesLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Spin />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {messages.map((msg) => {
                      const isMe = msg.sender_type === "admin";
                      const isBot = msg.sender_type === "bot";
                      const isSystem = msg.sender_type === "system";

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex items-center justify-center my-3 relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                              <div className="w-full border-t border-slate-200 dark:border-slate-800/80" />
                            </div>
                            <div className="relative z-10">
                              <span className="px-3 py-0.5 text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50 rounded-none">
                                {msg.message}
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"}`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[9px] font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                                {isBot
                                  ? "🤖 AI Assistant"
                                  : isMe
                                    ? "You"
                                    : userTypeFilter === "customers"
                                      ? "Customer"
                                      : "Driver partner"}
                              </span>
                            </div>
                            <div
                              className={`
                            px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed
                            ${isMe
                                  ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-tr-none shadow-blue-500/5"
                                  : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/40 dark:border-slate-700/50 rounded-tl-none"
                                }
                            ${isBot
                                  ? "bg-gradient-to-br from-indigo-50/30 to-violet-50/30 dark:from-indigo-950/10 dark:to-violet-950/10 border border-dashed border-indigo-200 dark:border-indigo-850/60"
                                  : ""
                                }
                          `}
                            >
                              {msg.message}
                            </div>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1 pl-1 pr-1">
                              {dayjs(msg.created_at).format("HH:mm")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Chat footer quick replies & input */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col gap-3">
                <div
                  className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
                  style={{ scrollbarWidth: "none" }}
                >
                  {(userTypeFilter === "drivers" ? DRIVER_QUICK_REPLIES : CUSTOMER_QUICK_REPLIES).map(
                    (reply, idx) => (
                      <Tag
                        key={idx}
                        className="cursor-pointer px-3 py-1.5 rounded-full border border-blue-100 bg-blue-50/70 text-blue-600 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white dark:hover:text-white transition-all hover:scale-[1.03] active:scale-[0.98] whitespace-nowrap text-xs font-semibold m-0"
                        onClick={() => setReplyText(reply.text)}
                      >
                        {reply.label}
                      </Tag>
                    ),
                  )}
                </div>
                <Space.Compact className="w-full premium-chat-input-wrapper">
                  <Input
                    placeholder={`Type your response to the ${userTypeFilter === "customers" ? "customer" : "driver"}...`}
                    size="large"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onPressEnter={handleSendMessage}
                    className="premium-chat-input"
                    prefix={<MessageOutlined className="text-slate-400 dark:text-slate-500" />}
                  />
                  <Button
                    type="primary"
                    size="large"
                    icon={<SendOutlined />}
                    onClick={handleSendMessage}
                    className="premium-chat-send-btn"
                  >
                    Reply
                  </Button>
                </Space.Compact>
              </div>
            </>
          ) : (
            /* Empty Chat State */
            <div className="flex h-full items-center justify-center flex-col gap-6 text-slate-400 p-8 select-none bg-slate-50/20 dark:bg-slate-900/10">
              <div className="relative">
                {/* Inner ring */}
                <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100/50 dark:border-blue-900/30 flex items-center justify-center text-blue-500 animate-pulse">
                  <CustomerServiceOutlined style={{ fontSize: 44 }} />
                </div>
                {/* Pulsing glow dot */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
              </div>

              <div className="text-center max-w-sm">
                <Title level={4} className="!text-slate-700 dark:!text-slate-300 font-extrabold tracking-tight mb-2">
                  Support Chat Desk
                </Title>
                <Text type="secondary" className="text-xs text-slate-400 dark:text-slate-500 block mb-6">
                  Select a ticket from the live queue to begin assisting driver partners and customers.
                </Text>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-sm pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider block mb-1">
                      Active Drivers
                    </span>
                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-none">
                      {driverActiveCount}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                      Waiting in queue
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg">
                    <UserOutlined />
                  </div>
                </div>

                <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 p-4 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider block mb-1">
                      Active Customers
                    </span>
                    <span className="text-2xl font-black text-amber-500 dark:text-amber-400 leading-none">
                      {customerActiveCount}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                      Waiting in queue
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-500 dark:text-amber-400 flex items-center justify-center text-lg">
                    <UserOutlined />
                  </div>
                </div>
              </div>
            </div>
          )}
        </Content>

        <style>{`
        /* Premium custom segment switch button elements overrides */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Search input bar overrides */
        .premium-search-input.ant-input-affix-wrapper {
          border-radius: 6px !important;
          background-color: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          height: 36px !important;
        }
        .dark .premium-search-input.ant-input-affix-wrapper {
          background-color: #0f172a !important;
          border-color: #334155 !important;
        }
        .premium-search-input.ant-input-affix-wrapper-focused {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
        }

        /* Chat input compact overrides */
        .premium-chat-input-wrapper.ant-space-compact {
          border: 1px solid #e2e8f0 !important;
          background-color: #ffffff !important;
          border-radius: 8px !important;
          overflow: hidden;
        }
        .dark .premium-chat-input-wrapper.ant-space-compact {
          border-color: #334155 !important;
          background-color: #0f172a !important;
        }
        .premium-chat-input-wrapper.ant-space-compact:focus-within {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
        }
        .premium-chat-input.ant-input-affix-wrapper {
          border: none !important;
          background-color: transparent !important;
          box-shadow: none !important;
          height: 40px !important;
        }
        .dark .premium-chat-input.ant-input-affix-wrapper input {
          color: #f1f5f9 !important;
        }
        .premium-chat-send-btn.ant-btn {
          border: none !important;
          height: 40px !important;
          border-radius: 0px !important;
          background-color: #2563eb !important;
          font-weight: 700 !important;
        }
        .premium-chat-send-btn.ant-btn:hover {
          background-color: #1d4ed8 !important;
        }

        /* Custom scrollbar styling */
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      </Layout>
    </div>
  );
};

export default SupportTickets;
