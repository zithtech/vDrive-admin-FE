import React, { useEffect, useState } from 'react';
import { Drawer, Spin, message, Tooltip } from 'antd';
import { User, Wallet, BellRing, Phone, ShieldCheck, History, CheckCircle2, X, Star, Copy, ExternalLink, CreditCard } from 'lucide-react';
import axios from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { getMediaUrl } from '../DriverDetails/DriverDetails';

interface SubscriptionDrawerProps {
  visible: boolean;
  onClose: () => void;
  driver: any; 
}

const SubscriptionDrawer: React.FC<SubscriptionDrawerProps> = ({ visible, onClose, driver }) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [notifying, setNotifying] = useState(false);
  const navigate = useNavigate();

  const handleCopy = (text: string, type: string) => {
    if (!text || text === 'N/A') return;
    navigator.clipboard.writeText(text);
    message.success(`${type} copied to clipboard!`);
  };

  const handleInspect = () => {
    onClose();
    navigate('/drivers', { state: { openDriverDrawer: driver.driverId } });
  };

  useEffect(() => {
    if (visible && driver?.driverId) {
      fetchHistory();
    } else {
      setHistory([]);
      setSummary(null);
    }
  }, [visible, driver]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const [historyRes, paymentsRes] = await Promise.all([
        axios.get(`/api/recharge-plans/driver-history/${driver.driverId}`),
        axios.get(`/api/recharge-plans/payments/driver/${driver.driverId}`)
      ]);
      
      if (historyRes.data?.success) {
        setHistory(historyRes.data.data.history || []);
        setSummary(historyRes.data.data.summary || null);
      }
      
      if (paymentsRes.data?.success) {
        setPayments(paymentsRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch driver history", err);
      message.error("Failed to load subscription history");
    } finally {
      setLoading(false);
    }
  };

  const handleNotify = async () => {
    try {
      setNotifying(true);
      await axios.post('/api/recharge-plans/notify-individual', { driverId: driver.driverId });
      message.success('Status notification sent successfully!');
    } catch (err: any) {
      console.error("Failed to notify driver", err);
      message.error(err.response?.data?.message || "Failed to send notification");
    } finally {
      setNotifying(false);
    }
  };

  if (!driver) return null;

  return (
    <Drawer
      placement="right"
      closable={false}
      onClose={onClose}
      open={visible}
      width={450}
      styles={{ body: { padding: 0 } }}
      className="dark:bg-slate-900"
    >
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 font-outfit">
        {/* Header */}
        <div className="p-6 pb-8 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 relative overflow-hidden shrink-0 group/header">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <ShieldCheck size={120} />
          </div>
          
          <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
            <Tooltip title="Inspect in Driver Management">
              <button 
                onClick={handleInspect}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <ExternalLink size={16} />
              </button>
            </Tooltip>
            <button 
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex items-center gap-4 relative z-10 mt-2">
            <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-white/20 shadow-xl bg-indigo-200 shrink-0 flex items-center justify-center">
              {driver.profilePicUrl ? (
                <img src={getMediaUrl(driver.profilePicUrl)} alt={driver.driverName} className="h-full w-full object-cover" />
              ) : (
                <User size={32} className="text-indigo-400" />
              )}
            </div>
            <div className="text-white min-w-0">
              <h2 className="text-xl font-black tracking-tight mb-1.5 truncate">{driver.driverName}</h2>
              <div className="flex flex-col gap-1.5 text-indigo-100 text-[13px] font-medium">
                <div 
                  className="flex items-center gap-2 group/copy cursor-pointer w-fit hover:text-white transition-colors" 
                  onClick={() => handleCopy(driver.driverPhone, 'Phone number')}
                >
                  <Phone size={12} className="shrink-0" /> 
                  <span className="truncate">{driver.driverPhone}</span>
                  <Copy size={12} className="opacity-0 group-hover/copy:opacity-100 transition-opacity text-indigo-300" />
                </div>
                <div 
                  className="flex items-center gap-2 group/copy cursor-pointer w-fit hover:text-white transition-colors" 
                  onClick={() => handleCopy(driver.vdriveId, 'Driver ID')}
                >
                  <ShieldCheck size={12} className="shrink-0" /> 
                  <span className="truncate max-w-[150px]">ID: {driver.vdriveId || 'N/A'}</span>
                  <Copy size={12} className="opacity-0 group-hover/copy:opacity-100 transition-opacity text-indigo-300" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
          {/* Action Button */}
          <button 
            onClick={handleNotify}
            disabled={notifying}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/10 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 cursor-pointer"
          >
            {notifying ? <Spin size="small" /> : <BellRing size={16} />}
            <span>{notifying ? 'Sending Notification...' : 'Notify Current Status'}</span>
          </button>

          {loading ? (
            <div className="flex justify-center py-10"><Spin /></div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all">
                  <div className="absolute top-0 right-0 p-3 opacity-5 text-emerald-500 group-hover:scale-110 group-hover:opacity-10 transition-all"><Wallet size={40} /></div>
                  <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1 relative z-10">Lifetime Spent</span>
                  <span className="text-2xl font-black text-emerald-500 relative z-10">₹{summary?.total_spent || 0}</span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-blue-200 dark:hover:border-blue-500/30 transition-all">
                  <div className="absolute top-0 right-0 p-3 opacity-5 text-blue-500 group-hover:scale-110 group-hover:opacity-10 transition-all"><History size={40} /></div>
                  <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1 relative z-10">Total Subs</span>
                  <span className="text-2xl font-black text-blue-500 relative z-10">{summary?.total_subscriptions || 0}</span>
                </div>
              </div>

              {/* History Timeline */}
              {history.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm font-medium">No subscription history found.</div>
              ) : (
                <div className="space-y-8">
                  {/* Current Plan Card */}
                  <div>
                    <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Star size={14} className="text-amber-500" /> Current Subscription
                    </h3>
                    <div className="bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-800/80 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/30 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                      <div className="absolute -right-6 -top-6 opacity-5 text-indigo-500 group-hover:scale-110 transition-all duration-500">
                        <CheckCircle2 size={120} />
                      </div>
                      <div className="relative z-10 flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">{history[0].plan_name}</h4>
                            <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 rounded text-[10px] font-black tracking-widest uppercase mt-1.5 border border-indigo-200 dark:border-indigo-500/30">
                              {history[0].billing_cycle}
                            </span>
                          </div>
                          <span className="text-2xl font-black text-emerald-500 tracking-tighter">₹{history[0].amount}</span>
                        </div>
                        
                        <div className="flex flex-col gap-2 p-3.5 bg-white/80 dark:bg-slate-900/60 rounded-xl border border-indigo-50/50 dark:border-slate-700/50 backdrop-blur-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Start Date</span>
                            <span className="text-xs font-black text-slate-700 dark:text-slate-300">{new Date(history[0].start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Expiry Date</span>
                            <span className="text-xs font-black text-slate-700 dark:text-slate-300">{new Date(history[0].expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 mt-1 border-t border-indigo-50 dark:border-slate-700/50">
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</span>
                            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded border uppercase tracking-widest ${
                               history[0].status === 'active' && new Date(history[0].expiry_date) >= new Date() 
                                 ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400'
                                 : 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400'
                            }`}>
                              {history[0].status === 'active' && new Date(history[0].expiry_date) >= new Date() ? 'ACTIVE' : 'EXPIRED'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Past History Timeline */}
                  {history.length > 1 && (
                    <div>
                      <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <History size={14} /> Past History
                      </h3>
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 dark:before:from-slate-700 before:to-transparent">
                        {history.slice(1).map((item: any, index: number) => {
                          return (
                            <div key={item.id || index} className="relative flex items-start justify-between group">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-50 dark:border-slate-900 shrink-0 shadow-sm z-10 relative mt-1 transition-all bg-white dark:bg-slate-800 text-gray-400 border-gray-100 dark:border-slate-700 group-hover:border-indigo-100 group-hover:text-indigo-400">
                                <History size={16} />
                              </div>
                              
                              <div className="w-[calc(100%-3.5rem)] p-4 rounded-xl border bg-white dark:bg-slate-800 shadow-sm border-gray-100 dark:border-slate-700 transition-all hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-500/30">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-bold text-gray-900 dark:text-slate-100 text-[13px]">{item.plan_name}</span>
                                  <span className="font-black text-slate-600 dark:text-slate-300 text-[13px]">₹{item.amount}</span>
                                </div>
                                <div className="text-[11px] text-gray-500 dark:text-slate-400 font-medium tracking-wide">
                                  {new Date(item.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {new Date(item.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </div>
                                <div className="mt-2 inline-block px-2 py-0.5 bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-slate-300 rounded text-[10px] font-black tracking-widest uppercase border border-gray-100 dark:border-slate-700">
                                  {item.billing_cycle}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Payment History Timeline */}
                  {payments.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Wallet size={14} /> Payment Transactions
                      </h3>
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 dark:before:from-slate-700 before:to-transparent">
                        {payments.map((item: any, index: number) => {
                          return (
                            <div key={item.id || index} className="relative flex items-start justify-between group">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-50 dark:border-slate-900 shrink-0 shadow-sm z-10 relative mt-1 transition-all bg-white dark:bg-slate-800 text-gray-400 border-gray-100 dark:border-slate-700 group-hover:border-emerald-100 group-hover:text-emerald-500">
                                <CreditCard size={16} />
                              </div>
                              
                              <div className="w-[calc(100%-3.5rem)] p-4 rounded-xl border bg-white dark:bg-slate-800 shadow-sm border-gray-100 dark:border-slate-700 transition-all hover:shadow-md hover:border-emerald-100 dark:hover:border-emerald-500/30">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="font-bold text-gray-900 dark:text-slate-100 text-[13px]">{item.plan_name}</span>
                                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-[13px]">₹{item.amount}</span>
                                </div>
                                <div className="text-[11px] text-gray-500 dark:text-slate-400 font-medium tracking-wide">
                                  {new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at {new Date(item.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase ${
                                    item.payment_status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                                    item.payment_status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' : 
                                    'bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                                  }`}>
                                    {item.payment_status}
                                  </span>
                                  <span className="inline-block px-2 py-0.5 bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-slate-300 rounded text-[10px] font-black tracking-widest uppercase border border-gray-100 dark:border-slate-700">
                                    {item.payment_method}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
};

export default SubscriptionDrawer;
