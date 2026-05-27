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

const QUICK_REPLIES = [
  { label: 'Greeting', text: 'Hello! I am Karthikeyan from Support. How can I help you today?' },
  { label: 'Subscription', text: 'For subscription details, you can view your current plan and renewal options in the "Subscription" section of your Driver App.' },
  { label: 'Documents', text: 'Your documents are currently under review. Verification typically takes 24-48 hours. We will notify you once it is complete.' },
  { label: 'Payment Issue', text: 'If you are facing wallet issues, please ensure your payment method is active. If the amount was deducted, it will be credited within 24 hours.' },
  { label: 'Technical Issue', text: 'Please try logging out and logging back in, or restarting your application. If the issue persists, let me know.' },
  { label: 'Closing', text: 'Is there anything else I can assist you with today?' },
  { label: 'Farewell', text: 'Thank you for reaching out to Support. Have a great and safe drive!' },
];

interface SupportTicket {
  id: string;
  driver_id: string;
  driver_name?: string;
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
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'resolved'>('active');
  const [searchParams] = useSearchParams();
  
  const { socket } = useSocket();
  const { currentUser } = useAppSelector((state) => state.auth);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTickets().then((loadedTickets) => {
      const ticketId = searchParams.get('ticketId');
      if (ticketId && loadedTickets) {
        const ticket = loadedTickets.find(t => t.id === ticketId);
        if (ticket) setSelectedTicket(ticket);
      }
    });
  }, [searchParams]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      
      // Join socket room
      if (socket) {
        socket.emit('joinSupportTicket', { 
          ticketId: selectedTicket.id, 
        });

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
          socket.off('receiveSupportMessage', handleNewMessage);
          socket.off('TICKET_STATUS_UPDATE', handleTicketStatusUpdate);
        };
      }
    }
  }, [selectedTicket, socket]);

  useEffect(() => {
    if (socket) {
      const handleNewTicket = (newTicket: any) => {
        setTickets((prev) => {
          // Avoid duplicates
          if (prev.find(t => t.id === newTicket.id)) return prev;
          return [newTicket, ...prev];
        });
      };

      const handleTicketClosed = (data: any) => {
        setTickets((prev) => prev.map(t => t.id === data.ticketId ? { ...t, status: 'closed' } : t));
      };

      socket.on('ADMIN_SUPPORT_TICKET_ALERT', handleNewTicket);
      socket.on('ADMIN_SUPPORT_TICKET_CLOSED', handleTicketClosed);

      return () => {
        socket.off('ADMIN_SUPPORT_TICKET_ALERT', handleNewTicket);
        socket.off('ADMIN_SUPPORT_TICKET_CLOSED', handleTicketClosed);
      };
    }
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await axiosIns.get('/api/support-management/tickets');
      setTickets(data.data.tickets);
      return data.data.tickets as SupportTicket[];
    } catch (error) {
      console.error('Failed to fetch tickets', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    setMessagesLoading(true);
    try {
      const { data } = await axiosIns.get(`/api/support-management/tickets/${ticketId}/messages`);
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
    if (!replyText.trim() || !selectedTicket) return;

    if (socket) {
      const messageData = {
        ticketId: selectedTicket.id,
        senderId: currentUser?.id,
        senderType: 'admin',
        message: replyText.trim(),
      };

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
      await axiosIns.put(`/api/support-management/tickets/${id}/status`, { status });
      fetchTickets();
      if (selectedTicket?.id === id) {
        setSelectedTicket((prev) => prev ? { ...prev, status: status as any } : null);
      }
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchText.toLowerCase()) || 
                         t.id.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'active' ? t.status === 'open' : (t.status === 'resolved' || t.status === 'closed');
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout className="h-full bg-slate-50">
      <Sider width={380} theme="light" className="border-r border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-white">
          <Title level={4} className="!mb-4 flex items-center gap-2">
            <CustomerServiceOutlined className="text-indigo-600" />
            Support Center
          </Title>
          <Space direction="vertical" className="w-full" size="middle">
            <Segmented
              block
              value={statusFilter}
              onChange={(v) => setStatusFilter(v as any)}
              options={[
                { label: 'Active', value: 'active', icon: <ClockCircleOutlined /> },
                { label: 'History', value: 'resolved', icon: <HistoryOutlined /> },
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

        <div className="flex-grow overflow-y-auto bg-white">
          <List
            loading={loading}
            dataSource={filteredTickets}
            renderItem={(item) => (
              <List.Item
                onClick={() => setSelectedTicket(item)}
                className={`px-4 py-4 cursor-pointer transition-all border-b border-slate-50 relative ${
                  selectedTicket?.id === item.id 
                    ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600' 
                    : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                }`}
              >
                <div className="w-full">
                  <div className="flex justify-between items-start mb-1">
                    <Text strong className="text-slate-700 truncate block max-w-[200px]">
                      {item.subject}
                    </Text>
                    <Text className="text-[10px] text-slate-400">
                      {dayjs(item.created_at).format('MMM DD')}
                    </Text>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Text className="text-[11px] text-slate-400 font-mono">
                      #{item.id.split('-')[0].toUpperCase()}
                    </Text>
                    <Tag color={item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'orange' : 'blue'} className="text-[9px] border-none rounded-full px-2 leading-tight">
                      {item.priority.toUpperCase()}
                    </Tag>
                    {item.category && item.category !== 'general' && (
                      <Tag color={CATEGORY_COLORS[item.category] || 'default'} className="text-[9px] border-none rounded-full px-2 leading-tight">
                        {item.category.replace('_', ' ').toUpperCase()}
                      </Tag>
                    )}
                    {item.status === 'resolved' && <Tag color="success" className="text-[9px] border-none rounded-full px-2 leading-tight">RESOLVED</Tag>}
                  </div>
                  <div className="flex items-center justify-between">
                    <Text type="secondary" className="text-xs truncate block max-w-[240px]">
                      {item.driver_name || 'Anonymous Driver'}
                    </Text>
                    {item.status === 'open' && <Badge status="processing" />}
                  </div>
                </div>
              </List.Item>
            )}
            locale={{ emptyText: <div className="p-8 text-center text-slate-400">No {statusFilter} tickets found</div> }}
          />
        </div>
      </Sider>

      <Content className="bg-white flex flex-col">
        {selectedTicket ? (
          <>
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shadow-sm z-10">
              <div className="flex items-center gap-3">
                <Avatar icon={<UserOutlined />} className="bg-indigo-100 text-indigo-600" />
                <div>
                  <Title level={5} className="!mb-0">{selectedTicket.subject}</Title>
                  <Text type="secondary" className="text-xs">
                    Ticket ID: {selectedTicket.id} • Driver ID: {selectedTicket.driver_id}
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

            <div className="flex-grow overflow-y-auto p-6 bg-slate-50/30">
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
                          <Tag className="rounded-full border-none bg-slate-100 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
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
                                {isBot ? 'AI BOT' : (isMe ? 'YOU' : 'DRIVER')}
                             </Text>
                          </div>
                          <div className={`
                            px-4 py-2 rounded-2xl shadow-sm text-sm
                            ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}
                            ${isBot ? 'border-dashed border-indigo-200 bg-indigo-50/30' : ''}
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

            <div className="p-4 border-t border-slate-100 bg-white flex flex-col gap-3">
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                {QUICK_REPLIES.map((reply, idx) => (
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
                  placeholder="Type your response to the driver..."
                  size="large"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onPressEnter={handleSendMessage}
                  className="rounded-l-xl"
                  prefix={<MessageOutlined className="text-slate-300" />}
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
              <Text type="secondary">Select a ticket from the list to start chatting with the driver.</Text>
            </div>
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default SupportTickets;
