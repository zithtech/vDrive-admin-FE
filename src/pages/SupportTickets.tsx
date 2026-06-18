import React, { useState, useEffect, useRef } from 'react';
import {
  Layout,
  List,
  Tag,
  Button,
  Typography,
  Input,
  Space,
  Avatar,
  Spin,
  Tooltip,
  Segmented,
  Badge,

} from 'antd';
import { useSearchParams } from 'react-router-dom';
import {
  MessageOutlined,
  SendOutlined,
  SearchOutlined,
  UserOutlined,
  CustomerServiceOutlined,
  ClockCircleOutlined,

  HistoryOutlined,
} from '@ant-design/icons';
import axiosIns from '../api/axios';
import { useSocket } from '../hooks/useSocket';
import { useAppSelector } from '../store/hooks';
import dayjs from 'dayjs';

const { Content, Sider } = Layout;
const { Title, Text } = Typography;

const DRIVER_QUICK_REPLIES = [
  { label: 'Greeting', text: 'Hello! I am Karthikeyan from Support. How can I help you today?' },
  { label: 'Subscription', text: 'For subscription details, you can view your current plan and renewal options in the "Subscription" section of your Driver App.' },
  { label: 'Documents', text: 'Your documents are currently under review. Verification typically takes 24-48 hours. We will notify you once it is complete.' },
  { label: 'Payment Issue', text: 'If you are facing wallet issues, please ensure your payment method is active. If the amount was deducted, it will be credited within 24 hours.' },
  { label: 'Technical Issue', text: 'Please try logging out and logging back in, or restarting your application. If the issue persists, let me know.' },
  { label: 'Closing', text: 'Is there anything else I can assist you with today?' },
  { label: 'Farewell', text: 'Thank you for reaching out to Support. Have a great and safe drive!' },
];

const CUSTOMER_QUICK_REPLIES = [
  { label: 'Greeting', text: 'Hello! I am Karthikeyan from Support. How can I help you today?' },
  { label: 'Ride Issue', text: 'We apologize for the inconvenience during your ride. We are looking into this issue and will get back to you.' },
  { label: 'Payment Issue', text: 'If you were overcharged, we will verify the trip details and initiate a refund if applicable within 24-48 hours.' },
  { label: 'Lost Item', text: 'Please provide the details of the lost item. We will contact the driver and update you shortly.' },
  { label: 'Technical Issue', text: 'Please try restarting your app. If the issue persists, ensure you have the latest version installed.' },
  { label: 'Closing', text: 'Is there anything else I can assist you with today?' },
  { label: 'Farewell', text: 'Thank you for reaching out to Support. Have a great day!' },
];

interface SupportTicket {
  id: string;
  driver_id?: string;
  driver_name?: string;
  user_id?: string;
  user_name?: string;
  subject: string;
  category?: string;
  status: 'open' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  payment: 'gold',
  documents: 'cyan',
  app_crash: 'red',
  account: 'purple',
  subscription: 'geekblue',
  rides: 'green',
  general: 'default',
};

interface ChatMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: 'driver' | 'admin' | 'bot' | 'system';
  message: string;
  created_at: string;
}

const SupportTickets: React.FC = () => {
  const [driverTickets, setDriverTickets] = useState<SupportTicket[]>([]);
  const [customerTickets, setCustomerTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'resolved'>('active');
  const [userTypeFilter, setUserTypeFilter] = useState<'drivers' | 'customers'>('drivers');
  const [searchParams] = useSearchParams();
  const [viewedTickets, setViewedTickets] = useState<Set<string>>(new Set());

  const { socket } = useSocket();
  const { currentUser } = useAppSelector((state) => state.auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllTickets().then((loadedData) => {
      if (!loadedData) return;
      const { drivers, customers } = loadedData;
      const ticketId = searchParams.get('ticketId');
      if (ticketId) {
        const ticket = [...drivers, ...customers].find((t: SupportTicket) => t.id === ticketId);
        if (ticket) {
          setSelectedTicket(ticket);
          setViewedTickets((prev) => new Set(prev).add(ticket.id));
          setUserTypeFilter(ticket.user_id ? 'customers' : 'drivers');
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
          socket.emit('joinSupportTicket', {
            ticketId: selectedTicket.id,
          });
        };

        if (socket.connected) {
          joinRoom();
        }

        socket.on('connect', joinRoom);

        const handleNewMessage = (msg: any) => {
          if (msg.ticket_id === selectedTicket.id) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.find(m => m.id === msg.id)) return prev;
              return [...prev, {
                id: msg.id,
                ticket_id: msg.ticket_id,
                sender_id: msg.sender_id,
                sender_type: msg.sender_type,
                message: msg.message,
                created_at: msg.created_at
              }];
            });
          }
        };

        const handleTicketStatusUpdate = (data: any) => {
          if (data.ticketId === selectedTicket.id) {
            setSelectedTicket((prev) => prev ? { ...prev, status: data.status } : null);
          }
        };

        socket.on('receiveSupportMessage', handleNewMessage);
        socket.on('TICKET_STATUS_UPDATE', handleTicketStatusUpdate);

        return () => {
          socket.off('connect', joinRoom);
          socket.off('receiveSupportMessage', handleNewMessage);
          socket.off('TICKET_STATUS_UPDATE', handleTicketStatusUpdate);
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
            if (prev.find(t => t.id === newTicket.id)) return prev;
            return [newTicket, ...prev];
          });
        } else {
          setDriverTickets((prev) => {
            if (prev.find(t => t.id === newTicket.id)) return prev;
            return [newTicket, ...prev];
          });
        }
      };

      const handleTicketClosed = (data: any) => {
        setDriverTickets((prev) => prev.map(t => t.id === data.ticketId ? { ...t, status: 'closed' } : t));
        setCustomerTickets((prev) => prev.map(t => t.id === data.ticketId ? { ...t, status: 'closed' } : t));
      };

      if (userTypeFilter === 'drivers') {
        socket.on('ADMIN_SUPPORT_TICKET_ALERT', handleNewTicket);
        socket.on('ADMIN_SUPPORT_TICKET_CLOSED', handleTicketClosed);
      } else {
        console.log("inside user ticket")
        socket.on('ADMIN_SUPPORT_USER_TICKET_ALERT', handleNewTicket);
        socket.on('ADMIN_SUPPORT_USER_TICKET_CLOSED', handleTicketClosed);
      }

      return () => {
        if (userTypeFilter === 'drivers') {
          socket.off('ADMIN_SUPPORT_TICKET_ALERT', handleNewTicket);
          socket.off('ADMIN_SUPPORT_TICKET_CLOSED', handleTicketClosed);
        } else {
          socket.off('ADMIN_SUPPORT_USER_TICKET_ALERT', handleNewTicket);
          socket.off('ADMIN_SUPPORT_USER_TICKET_CLOSED', handleTicketClosed);
        }
      };
    }
  }, [socket, userTypeFilter]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchAllTickets = async () => {
    setLoading(true);
    try {
      const [driversRes, customersRes] = await Promise.all([
        axiosIns.get('/api/support-management/tickets'),
        axiosIns.get('/api/support-management/tickets/user/all')
      ]);
      const drivers = driversRes.data.data.tickets || [];
      const customers = customersRes.data.data || [];
      setDriverTickets(drivers);
      setCustomerTickets(customers);
      return { drivers, customers };
    } catch (error) {
      console.error('Failed to fetch tickets', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    setMessagesLoading(true);
    try {
      const endpoint = userTypeFilter === 'drivers'
        ? `/api/support-management/tickets/${ticketId}/messages`
        : `/api/support-management/tickets/user/${ticketId}/messages`;
      const { data } = await axiosIns.get(endpoint);
      setMessages(data.data);

      // Auto-greeting logic
      const hasAdminMessage = data.data.some((m: any) => m.sender_type === 'admin');
      if (!hasAdminMessage && socket && currentUser) {
        const greetingMsg = `Hello! I am ${currentUser.name} from Support. How can I help you today?`;
        const messageData = {
          ticketId,
          senderId: currentUser.id,
          senderType: 'admin',
          message: greetingMsg,
        };
        socket.emit('sendSupportMessage', messageData);
        // We do not manually push to setMessages here because the socket will broadcast it back to us via 'receiveSupportMessage' shortly after.
      }

    } catch (error) {
      console.error('Failed to fetch messages', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    console.log('replyText', replyText);
    console.log('selectedTicket', selectedTicket);
    if (!replyText.trim() || !selectedTicket) return;

    if (socket) {
      const messageData = {
        ticketId: selectedTicket.id,
        senderId: currentUser?.id,
        senderType: 'admin',
        message: replyText.trim(),
      };
      console.log('messageData', messageData);


      socket.emit('sendSupportMessage', messageData);

      // Optimistic UI update
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        ticket_id: selectedTicket.id,
        sender_id: currentUser?.id || '',
        sender_type: 'admin',
        message: replyText.trim(),
        created_at: new Date().toISOString()
      }]);

      setReplyText('');
    } else {
      console.error('Socket not connected');
    }
  };

  const updateTicketStatus = async (id: string, status: string) => {
    try {
      if (userTypeFilter === 'drivers') {
        await axiosIns.put(`/api/support-management/tickets/${id}/status`, { status });
      } else {
        await axiosIns.patch(`/api/support-management/tickets/user/${id}/status`, { status });
      }

      setDriverTickets((prev) => prev.map(t => t.id === id ? { ...t, status: status as any } : t));
      setCustomerTickets((prev) => prev.map(t => t.id === id ? { ...t, status: status as any } : t));

      if (selectedTicket?.id === id) {
        setSelectedTicket((prev) => prev ? { ...prev, status: status as any } : null);
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const currentTickets = userTypeFilter === 'drivers' ? driverTickets : customerTickets;
  const filteredTickets = currentTickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchText.toLowerCase()) ||
      t.id.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'active' ? t.status === 'open' : (t.status === 'resolved' || t.status === 'closed');
    return matchesSearch && matchesStatus;
  });

  const driverActiveCount = driverTickets.filter(t => t.status === 'open').length;
  const customerActiveCount = customerTickets.filter(t => t.status === 'open').length;
  const currentActiveCount = currentTickets.filter(t => t.status === 'open').length;
  const currentHistoryCount = currentTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;

  return (
    <Layout className="h-full bg-slate-50">
      <Sider width={380} theme="light" className="border-r border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex flex-col h-full bg-white">
          <div className="p-4 border-b border-slate-100 bg-white shrink-0">
          <Title level={4} className="!mb-4 flex items-center gap-2">
            <CustomerServiceOutlined className="text-indigo-600" />
            Support Center
          </Title>
          <Space direction="vertical" className="w-full" size="middle">
            <Segmented
              block
              value={userTypeFilter}
              onChange={(v) => {
                setUserTypeFilter(v as any);
                setSelectedTicket(null);
                setSearchText('');
              }}
              options={[
                {
                  label: (
                    <div className="flex items-center justify-center gap-2 py-1 px-2">
                      <UserOutlined className={userTypeFilter === 'drivers' ? 'text-indigo-600' : 'text-slate-500'} />
                      <span className={`font-semibold tracking-wide ${userTypeFilter === 'drivers' ? 'text-indigo-700' : 'text-slate-600'}`}>Drivers</span>
                      {driverActiveCount > 0 && (
                        <span className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm ${userTypeFilter === 'drivers' ? 'bg-indigo-500 text-white shadow-indigo-200' : 'bg-slate-200 text-slate-500'}`}>
                          {driverActiveCount}
                        </span>
                      )}
                    </div>
                  ),
                  value: 'drivers'
                },
                {
                  label: (
                    <div className="flex items-center justify-center gap-2 py-1 px-2">
                      <UserOutlined className={userTypeFilter === 'customers' ? 'text-indigo-600' : 'text-slate-500'} />
                      <span className={`font-semibold tracking-wide ${userTypeFilter === 'customers' ? 'text-indigo-700' : 'text-slate-600'}`}>Customers</span>
                      {customerActiveCount > 0 && (
                        <span className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm ${userTypeFilter === 'customers' ? 'bg-indigo-500 text-white shadow-indigo-200' : 'bg-slate-200 text-slate-500'}`}>
                          {customerActiveCount}
                        </span>
                      )}
                    </div>
                  ),
                  value: 'customers'
                },
              ]}
              className="bg-slate-100 p-1 rounded-lg"
            />
            <Segmented
              block
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as any)}
              options={[
                {
                  label: (
                    <div className="flex items-center justify-center gap-2 py-0.5 px-1">
                      <ClockCircleOutlined className={statusFilter === 'active' ? 'text-indigo-600' : 'text-slate-500'} />
                      <span className={`font-medium ${statusFilter === 'active' ? 'text-indigo-700' : 'text-slate-600'}`}>Active</span>
                      <span className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm transition-colors ${statusFilter === 'active' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                        {currentActiveCount}
                      </span>
                    </div>
                  ),
                  value: 'active'
                },
                {
                  label: (
                    <div className="flex items-center justify-center gap-2 py-0.5 px-1">
                      <HistoryOutlined className={statusFilter === 'resolved' ? 'text-indigo-600' : 'text-slate-500'} />
                      <span className={`font-medium ${statusFilter === 'resolved' ? 'text-indigo-700' : 'text-slate-600'}`}>History</span>
                      <span className={`text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm transition-colors ${statusFilter === 'resolved' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                        {currentHistoryCount}
                      </span>
                    </div>
                  ),
                  value: 'resolved'
                },
              ]}
              className="bg-slate-100 p-1 rounded-lg"
            />
            <Input
              placeholder="Search by ID or subject..."
              prefix={<SearchOutlined className="text-slate-400" />}
              className="rounded-lg bg-slate-50 border-none"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Space>
        </div>

          <div className="flex-1 overflow-y-auto bg-white min-h-0">
          <List
            loading={loading}
            dataSource={filteredTickets}
            renderItem={(item) => {
              const isUnread = item.status === 'open' && !viewedTickets.has(item.id);
              return (
              <List.Item
                onClick={() => {
                  setSelectedTicket(item);
                  setViewedTickets((prev) => new Set(prev).add(item.id));
                }}
                className={`!p-0 cursor-pointer transition-all duration-300 ease-in-out border-b border-slate-100/60 group overflow-hidden relative ${
                  selectedTicket?.id === item.id
                    ? 'bg-gradient-to-r from-indigo-50/80 to-white shadow-[inset_4px_0_0_0_#4f46e5]'
                    : isUnread
                      ? 'bg-gradient-to-r from-blue-50/60 to-white hover:from-blue-100/50 hover:to-slate-50 shadow-[inset_4px_0_0_0_#60a5fa]'
                      : 'hover:bg-slate-50/80 shadow-[inset_4px_0_0_0_transparent] hover:shadow-[inset_4px_0_0_0_#cbd5e1]'
                }`}
              >
                <div className="w-full p-4 pl-5">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      <Avatar
                        size={24}
                        className={`flex-shrink-0 ${selectedTicket?.id === item.id ? 'bg-indigo-600 text-white' : isUnread ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'}`}
                        icon={<UserOutlined />}
                      />
                      <Text strong className={`truncate block ${isUnread ? 'text-slate-900 font-bold' : 'text-slate-700'}`} title={item.subject}>
                        {item.subject}
                      </Text>
                    </div>
                    <Text className="text-[10px] text-slate-400 whitespace-nowrap mt-0.5">
                      {dayjs(item.created_at).format('MMM DD')}
                    </Text>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2 pl-8">
                    <Text className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                      #{item.id.split('-')[0].toUpperCase()}
                    </Text>
                    <Tag color={item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'orange' : 'blue'} className="text-[9px] border-none rounded-full px-2 m-0 leading-tight">
                      {item.priority.toUpperCase()}
                    </Tag>
                    {item.category && item.category !== 'general' && (
                      <Tag color={CATEGORY_COLORS[item.category] || 'default'} className="text-[9px] border-none rounded-full px-2 m-0 leading-tight">
                        {item.category.replace('_', ' ').toUpperCase()}
                      </Tag>
                    )}
                    {item.status === 'resolved' && <Tag color="success" className="text-[9px] border-none rounded-full px-2 m-0 leading-tight">RESOLVED</Tag>}
                  </div>
                  <div className="flex items-center justify-between pl-8">
                    <Text type="secondary" className={`text-xs truncate block max-w-[200px] ${isUnread ? 'font-medium text-slate-600' : ''}`}>
                      {userTypeFilter === 'customers' ? (item.user_name || 'Anonymous Customer') : (item.driver_name || 'Anonymous Driver')}
                    </Text>
                    <div className="flex items-center gap-2">
                      {isUnread && (
                        <Tag color="blue" className="border-none rounded-full text-[9px] px-2 py-0.5 m-0 font-bold bg-blue-100 text-blue-600 animate-pulse shadow-sm">
                          NEW
                        </Tag>
                      )}
                      {item.status === 'open' && <Badge status="processing" />}
                    </div>
                  </div>
                </div>
              </List.Item>
              );
            }}
            locale={{ emptyText: <div className="p-8 text-center text-slate-400">No {statusFilter} tickets found</div> }}
          />
        </div>
      </Sider>

      <Content className="bg-white dark:bg-slate-900 flex flex-col">
        {selectedTicket ? (
          <>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shadow-sm z-10">
              <div className="flex items-center gap-4">
                <Avatar size="large" icon={<UserOutlined />} className="bg-indigo-100 text-indigo-600 shadow-sm" />
                <div>
                  <div className="flex items-center gap-2">
                    <Title level={5} className="!mb-0 text-slate-800">{selectedTicket.subject}</Title>
                    <Tag color={selectedTicket.status === 'open' ? 'processing' : selectedTicket.status === 'resolved' ? 'success' : 'default'} className="border-none rounded-full text-[10px] px-2 m-0">
                      {selectedTicket.status.toUpperCase()}
                    </Tag>
                  </div>
                  <Text type="secondary" className="text-xs flex items-center gap-1.5 mt-1">
                    <span className="font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">#{selectedTicket.id.split('-')[0].toUpperCase()}</span>
                    <span className="text-slate-300">•</span>
                    <span>{userTypeFilter === 'customers' ? 'Customer' : 'Driver'}: <strong className="text-slate-600">{userTypeFilter === 'customers' ? (selectedTicket.user_name || 'Anonymous Customer') : (selectedTicket.driver_name || 'Anonymous Driver')}</strong></span>
                  </Text>
                </div>
              </div>
              <Space>
                {selectedTicket.status === 'open' && (
                  <Button
                    type="primary"
                    className="bg-green-600 border-none rounded-lg font-semibold"
                    onClick={() => {
                      if (socket && currentUser) {
                        socket.emit('sendSupportMessage', {
                          ticketId: selectedTicket.id,
                          senderId: currentUser.id,
                          senderType: 'admin',
                          message: 'This support session has been closed by the agent. Thank you for contacting VDrive Support! Have a great day.',
                        });
                      }
                      updateTicketStatus(selectedTicket.id, 'resolved');
                    }}
                  >
                    Mark as Resolved
                  </Button>
                )}
                <Tooltip title="Refresh Messages">
                  <Button icon={<ClockCircleOutlined />} onClick={() => fetchMessages(selectedTicket.id)} />
                </Tooltip>
              </Space>
            </div>

            <div className="flex-grow overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-900/50">
              {messagesLoading ? (
                <div className="flex h-full items-center justify-center"><Spin /></div>
              ) : (
                <div className="flex flex-col gap-4">
                  {messages.map((msg) => {
                    const isMe = msg.sender_type === 'admin';
                    const isBot = msg.sender_type === 'bot';
                    const isSystem = msg.sender_type === 'system';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="text-center my-2">
                          <Tag className="rounded-full border-none bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                            {msg.message}
                          </Tag>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Text className="text-[10px] font-bold text-slate-400 uppercase">
                              {isBot ? 'AI BOT' : (isMe ? 'YOU' : (userTypeFilter === 'customers' ? 'CUSTOMER' : 'DRIVER'))}
                            </Text>
                          </div>
                          <div className={`
                            px-4 py-2 rounded-2xl shadow-sm text-sm
                            ${isMe ? 'bg-indigo-600 dark:bg-indigo-500 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'}
                            ${isBot ? 'border-dashed border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-500/10' : ''}
                          `}>
                            {msg.message}
                          </div>
                          <Text className="text-[9px] text-slate-400 mt-1">
                            {dayjs(msg.created_at).format('HH:mm')}
                          </Text>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 flex flex-col gap-3">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                {(userTypeFilter === 'drivers' ? DRIVER_QUICK_REPLIES : CUSTOMER_QUICK_REPLIES).map((reply, idx) => (
                  <Tag 
                    key={idx} 
                    className="cursor-pointer px-3 py-1.5 rounded-full border border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors whitespace-nowrap text-xs font-medium m-0"
                    onClick={() => setReplyText(reply.text)}
                  >
                    {reply.label}
                  </Tag>
                ))}
              </div>
              <Space.Compact className="w-full">
                <Input
                  placeholder={`Type your response to the ${userTypeFilter === 'customers' ? 'customer' : 'driver'}...`}
                  size="large"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onPressEnter={handleSendMessage}
                  className="rounded-l-xl dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700"
                  prefix={<MessageOutlined className="text-slate-300 dark:text-slate-500" />}
                />
                <Button
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  className="rounded-r-xl h-[40px] px-6"
                >
                  Reply
                </Button>
              </Space.Compact>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center flex-col gap-4 text-slate-400">
            <CustomerServiceOutlined style={{ fontSize: 64 }} />
            <div className="text-center">
              <Title level={4} className="!text-slate-400">Support Chat</Title>
              <Text type="secondary">Select a ticket from the list to start chatting with the {userTypeFilter === 'customers' ? 'customer' : 'driver'}.</Text>
            </div>
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default SupportTickets;
