import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Users,
  Ticket,
  BarChart3,
  Percent,
  IndianRupee,
  Clock
} from 'lucide-react';
import axios from '../api/axios';
import { 
  Drawer, 
  Select, 
  Button, 
  Input, 
  DatePicker, 
  Switch, 
  Form,
  InputNumber
} from 'antd';
import { messageApi, modalApi, notificationApi } from '../utilities/antdStaticHolder';
import dayjs from 'dayjs';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchDrivers } from '../store/slices/driverSlice';

/* ================= TYPES ================= */

interface Promo {
  id: number;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  target_type: 'global' | 'specific_driver' | 'ride_count_based';
  target_driver_id?: string;
  min_rides_required: number;
  max_uses?: number;
  max_uses_per_driver: number;
  start_date: string;
  expiry_date?: string;
  is_active: boolean;
  usage_count: number;
  total_discount: number;
  created_at: string;
}

/* ================= COMPONENT ================= */

const PromotionsPage: React.FC = () => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { drivers } = useAppSelector((state) => state.drivers);

  useEffect(() => {
    fetchPromos();
    dispatch(fetchDrivers());
  }, []);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/promos');
      setPromos(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch promos:', err);
      messageApi.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (promo?: Promo) => {
    if (promo) {
      setEditingId(promo.id);
      form.setFieldsValue({
        code: promo.code,
        description: promo.description,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        target_type: promo.target_type,
        target_driver_id: promo.target_driver_id,
        min_rides_required: promo.min_rides_required,
        max_uses: promo.max_uses,
        max_uses_per_driver: promo.max_uses_per_driver,
        dates: [dayjs(promo.start_date), promo.expiry_date ? dayjs(promo.expiry_date) : null],
        is_active: promo.is_active
      });
    } else {
      setEditingId(null);
      form.resetFields();
      form.setFieldsValue({
        discount_type: 'percentage',
        target_type: 'global',
        max_uses_per_driver: 1,
        is_active: true,
        dates: [dayjs(), null]
      });
    }
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      setIsSubmitting(true);
      const [start, end] = values.dates || [];
      
      const payload = {
        ...values,
        start_date: start?.toISOString(),
        expiry_date: end?.toISOString(),
      };
      delete payload.dates;

      if (editingId) {
        await axios.put(`/api/promos/${editingId}`, payload);
        notificationApi.success({ message: 'Promo Updated', description: `Coupon "${values.code}" updated successfully.` });
      } else {
        await axios.post('/api/promos', payload);
        notificationApi.success({ message: 'Promo Created', description: `New coupon "${values.code}" is now active.` });
      }
      
      setIsDrawerOpen(false);
      fetchPromos();
    } catch (err: any) {
      messageApi.error(err?.response?.data?.message || 'Failed to save promotion');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDelete = (id: number, code: string) => {
    modalApi.confirm({
      title: 'Delete Promotion',
      content: `Are you sure you want to delete "${code}"? This will remove all history and cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await axios.delete(`/api/promos/${id}`);
          messageApi.success('Promo deleted successfully');
          fetchPromos();
        } catch (err) {
          messageApi.error('Failed to delete');
        }
      }
    });
  };

  const filteredPromos = useMemo(() => {
    return promos.filter(p => {
      const matchesSearch = p.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && p.is_active) || 
                           (statusFilter === 'inactive' && !p.is_active);
      return matchesSearch && matchesStatus;
    });
  }, [promos, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalDiscount = promos.reduce((sum, p) => sum + Number(p.total_discount || 0), 0);
    const active = promos.filter(p => p.is_active).length;
    return { totalDiscount, active };
  }, [promos]);

  return (
    <div className="flex flex-col h-full overflow-hidden p-3 gap-3 bg-gray-50 dark:bg-slate-700/30 min-h-screen font-sans">
      {/* Header section & Stats (Compact Row) */}
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 shrink-0 bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-indigo-500 rounded-lg shadow-sm">
            <Ticket className="text-white" size={16} />
          </div>
          <div>
            <h1 className="!m-0 text-sm font-black text-gray-900 dark:text-slate-100 tracking-tight uppercase">Campaigns</h1>
            <p className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">Offers & Promos</p>
          </div>
        </div>

        {/* Compact Stats */}
        <div className="hidden lg:flex items-center gap-4 px-4 border-l border-r border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="text-indigo-500"><BarChart3 size={14} /></div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest leading-none">Active</span>
              <span className="text-xs font-black text-gray-900 dark:text-slate-100 leading-none mt-1">{stats.active}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-emerald-500"><IndianRupee size={14} /></div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest leading-none">Savings</span>
              <span className="text-xs font-black text-gray-900 dark:text-slate-100 leading-none mt-1">₹{stats.totalDiscount.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-orange-500"><Users size={14} /></div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest leading-none">Uses</span>
              <span className="text-xs font-black text-gray-900 dark:text-slate-100 leading-none mt-1">{promos.reduce((a, b) => a + Number(b.usage_count || 0), 0)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 md:flex-none justify-end">
          <div className="relative w-48 group/search">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 dark:text-slate-500 group-focus-within/search:text-indigo-500 transition-colors" size={12} />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-7 pr-3 py-1.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-400 rounded-lg text-[11px] font-medium focus:outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select 
            defaultValue="all" 
            style={{ width: 100, height: 28 }}
            onChange={setStatusFilter}
            className="custom-select-compact"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <button 
            onClick={() => handleOpenDrawer()} 
            className="flex items-center justify-center w-7 h-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all active:scale-95 shadow-sm ml-1"
            title="Create New Offer"
          > 
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-4">
          {loading ? (
            [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="bg-white dark:bg-slate-800 h-28 rounded-xl animate-pulse border border-gray-100 dark:border-slate-700" />)
          ) : filteredPromos.length > 0 ? (
            filteredPromos.map(promo => {
              const isPercentage = promo.discount_type === 'percentage';
              const themeBg = isPercentage ? 'bg-indigo-600' : 'bg-emerald-600';
              const textTheme = isPercentage ? 'text-indigo-600' : 'text-emerald-600';

              return (
                <div 
                  key={promo.id} 
                  className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 transition-all hover:border-gray-200 dark:hover:border-slate-600 flex flex-col group/card shadow-sm"
                >
                  <div className="p-3 flex items-start gap-3 border-b border-gray-50 dark:border-slate-700/50">
                    <div className={`w-8 h-8 rounded-lg ${themeBg} flex items-center justify-center text-white shrink-0`}>
                      {isPercentage ? <Percent size={14} strokeWidth={3} /> : <IndianRupee size={14} strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-xs font-black text-gray-900 dark:text-slate-100 font-mono tracking-tight truncate">{promo.code}</h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {promo.is_active ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-slate-600"></span>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] font-medium text-gray-500 dark:text-slate-400 truncate mt-0.5" title={promo.description}>{promo.description || 'Campaign Offer'}</p>
                    </div>
                  </div>

                  <div className="p-3 flex items-center justify-between gap-2 bg-gray-50/50 dark:bg-slate-800/30">
                     <div className="flex flex-col">
                        <span className="text-[8px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Type</span>
                        <span className="text-[10px] font-extrabold text-gray-700 dark:text-slate-300 capitalize truncate max-w-[80px]">{promo.target_type.replace(/_/g, ' ')}</span>
                     </div>
                     <div className="w-px h-6 bg-gray-200 dark:bg-slate-700"></div>
                     <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Uses</span>
                        <span className={`text-[10px] font-extrabold ${textTheme}`}>{promo.usage_count} <span className="text-gray-400 font-medium">/ {promo.max_uses || '∞'}</span></span>
                     </div>
                     <div className="w-px h-6 bg-gray-200 dark:bg-slate-700"></div>
                     <div className="flex flex-col items-end">
                        <span className="text-[8px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Expires</span>
                        <span className="text-[10px] font-extrabold text-gray-700 dark:text-slate-300">{promo.expiry_date ? dayjs(promo.expiry_date).format('DD MMM') : 'Never'}</span>
                     </div>
                  </div>
                  
                  {/* Actions overlay on hover */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-1.5 py-1 rounded-lg border border-gray-100 dark:border-slate-700 shadow-sm">
                    <button onClick={() => handleOpenDrawer(promo)} className="p-1 text-gray-400 hover:text-indigo-600 transition-all">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDelete(promo.id, promo.code)} className="p-1 text-gray-400 hover:text-rose-600 transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 bg-white dark:bg-slate-800 rounded-xl text-center border border-dashed border-gray-200 dark:border-slate-600 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-300 dark:text-slate-500">
                <Ticket size={24} />
              </div>
              <div>
                <p className="text-gray-500 dark:text-slate-400 font-bold text-xs">No campaigns found</p>
              </div>
              <Button type="primary" size="small" onClick={() => handleOpenDrawer()} className="bg-indigo-600 text-[10px] font-bold mt-1">
                Create Offer
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Editor Drawer */}
      <Drawer rootClassName="dark-drawer"         title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Ticket size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">{editingId ? 'Edit Offer' : 'Create New Offer'}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Define your discount logic</p>
            </div>
          </div>
        }
        width={520}
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        className="custom-drawer"
        footer={
          <div className="flex gap-4 p-4">
             <Button variant="outlined" size="large" onClick={() => setIsDrawerOpen(false)} className="flex-1 rounded-xl h-12 font-bold">Cancel</Button>
             <Button 
               type="primary" 
               size="large" 
               loading={isSubmitting}
               onClick={() => form.submit()}
               className="flex-1 rounded-xl h-12 font-bold bg-indigo-600 border-none shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20"
             >
               {editingId ? 'Update Offer' : 'Launch Offer'}
             </Button>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-6"
        >
          <Form.Item name="code" label="Offer Code" rules={[{ required: true, message: 'Code is required' }]}>
            <Input placeholder="E.g. DRIVE100" className="rounded-xl h-11 uppercase font-mono font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="discount_type" label="Offer Type" rules={[{ required: true }]}>
              <Select className="h-11 custom-select-main">
                <Option value="percentage">Percentage (%)</Option>
                <Option value="fixed">Fixed Amount (₹)</Option>
              </Select>
            </Form.Item>

            <Form.Item 
              noStyle
              shouldUpdate={(prev, curr) => prev.discount_type !== curr.discount_type}
            >
              {({ getFieldValue }) => {
                const type = getFieldValue('discount_type');
                return (
                  <Form.Item name="discount_value" label="Discount Value" rules={[{ required: true }]}>
                    <InputNumber 
                      className="w-full rounded-xl h-11 flex items-center bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100" 
                      min={1} 
                      placeholder="Enter value"
                      prefix={type === 'fixed' ? <span className="text-gray-400 dark:text-slate-500 dark:text-slate-400 font-medium mr-1 border-r pr-2 border-gray-200 dark:border-slate-600">₹</span> : undefined}
                      suffix={type === 'percentage' ? <span className="text-gray-400 dark:text-slate-500 dark:text-slate-400 font-medium ml-1 border-l pl-2 border-gray-200 dark:border-slate-600">%</span> : undefined}
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>
          </div>

          <div className="space-y-3">
            <Form.Item name="description" label="Internal Description" className="mb-0">
              <Input.TextArea placeholder="Describe this offer for admin records..." rows={3} className="rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100" />
            </Form.Item>
            
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mr-1">Quick Picks:</span>
              {[
                "Weekend Special Drive", 
                "New Driver Welcome Bonus", 
                "High Demand Area Multiplier", 
                "Festival Season Offer", 
                "VIP Driver Loyalty Reward"
              ].map(sug => (
                <button
                  type="button"
                  key={sug}
                  onClick={() => {
                    const currentDesc = form.getFieldValue('description') || '';
                    form.setFieldsValue({ 
                      description: currentDesc ? `${currentDesc}. ${sug}` : sug 
                    });
                  }}
                  className="px-3 py-1 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:text-indigo-600 dark:hover:text-indigo-400 text-[10px] font-bold text-slate-500 dark:text-slate-400 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Users size={14} /> Audience Targeting
            </h4>
            
            <Form.Item name="target_type" label="Target Audience" rules={[{ required: true }]}>
              <Select className="h-11 custom-select-main" onChange={() => form.setFieldsValue({ target_driver_id: undefined, min_rides_required: 0 })}>
                <Option value="global">Global (All Drivers)</Option>
                <Option value="specific_driver">Specific Driver Offer</Option>
                <Option value="ride_count_based">Performance Based (Rides)</Option>
              </Select>
            </Form.Item>

            <Form.Item 
              noStyle
              shouldUpdate={(prev, curr) => prev.target_type !== curr.target_type}
            >
              {({ getFieldValue }) => (
                <>
                  {getFieldValue('target_type') === 'specific_driver' && (
                    <Form.Item name="target_driver_id" label="Search Driver" rules={[{ required: true }]}>
                      <Select 
                        showSearch 
                        placeholder="Search by name or phone"
                        className="h-11 custom-select-main"
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                        options={drivers.map(d => ({ value: d.id, label: `${d.full_name} (${d.phone_number})` }))}
                      />
                    </Form.Item>
                  )}
                  {getFieldValue('target_type') === 'ride_count_based' && (
                    <Form.Item name="min_rides_required" label="Min. Rides Required" rules={[{ required: true }]}>
                      <InputNumber className="w-full rounded-xl h-11 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600" min={1} placeholder="Keep 0 for no limit" />
                    </Form.Item>
                  )}
                </>
              )}
            </Form.Item>
          </div>

          <div className="bg-indigo-50/30 dark:bg-indigo-500/5 p-6 rounded-2xl border border-indigo-100/30 dark:border-indigo-500/10 space-y-4">
             <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} /> Validity & Limits
            </h4>

            <Form.Item name="dates" label="Validity Period">
              <DatePicker.RangePicker className="w-full rounded-xl h-11 bg-white dark:bg-slate-800 border-indigo-100/50 dark:border-slate-600" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
               <Form.Item name="max_uses" label="Total Usage Limit">
                  <InputNumber className="w-full rounded-xl h-11 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600" placeholder="Infinite" min={1} />
               </Form.Item>
               <Form.Item name="max_uses_per_driver" label="Limit Per Driver">
                  <InputNumber className="w-full rounded-xl h-11 flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600" min={1} defaultValue={1} />
               </Form.Item>
            </div>
          </div>

          <Form.Item name="is_active" label="Status" valuePropName="checked">
             <Switch checkedChildren="Active" unCheckedChildren="Inactive" className="custom-switch-lg" />
          </Form.Item>
        </Form>
      </Drawer>

      <style>{`
        .custom-select-compact .ant-select-selector {
          border-radius: 8px !important;
          border-color: #e2e8f0 !important;
          font-size: 11px !important;
          font-weight: 600 !important;
        }
        .ant-form-item-label label {
          font-weight: 700 !important;
          color: #64748b !important;
          font-size: 13px !important;
        }
        .custom-switch-lg.ant-switch-checked {
          background-color: #4f46e5;
        }
      `}</style>
    </div>
  );
};

const Option = Select.Option;

export default PromotionsPage;
