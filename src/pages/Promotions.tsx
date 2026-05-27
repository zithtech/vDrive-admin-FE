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
    <div className="flex flex-col h-full overflow-hidden p-3 gap-3 bg-gray-50/50 min-h-screen font-sans">
      {/* Header section */}
      <div className="flex items-center space-x-3 shrink-0">
        <div className="flex items-center justify-center w-10 h-10 bg-indigo-500 rounded-xl shadow-lg shadow-indigo-500/20">
          <Ticket className="text-white text-xl" />
        </div>
        <div>
          <h1 className="!m-0 text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">Campaign Management</h1>
          <p className="block text-[9px] text-gray-400 font-medium font-outfit uppercase tracking-widest">
            Promotions, Offers & Loyalty Rewards
          </p>
        </div>
        <div className="flex-1" />
        <button 
          onClick={() => handleOpenDrawer()} 
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 bg-white border border-gray-100 hover:border-indigo-100 px-4 py-1.5 rounded-lg transition-all active:scale-95 text-xs font-bold shadow-sm"
        > 
          <Plus size={14} /> 
          Create New Offer 
        </button>
      </div>

      {/* Premium Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 group relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-indigo-50 p-3 rounded-xl text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
              <BarChart3 size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Active Offers</p>
              <h3 className="text-xl font-black text-gray-900">{stats.active}</h3>
            </div>
          </div>
          <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-indigo-50/50 rounded-full group-hover:scale-150 transition-transform duration-700" />
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 group relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
              <IndianRupee size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Savings</p>
              <h3 className="text-xl font-black text-gray-900">₹{stats.totalDiscount.toLocaleString()}</h3>
            </div>
          </div>
          <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-emerald-50/50 rounded-full group-hover:scale-150 transition-transform duration-700" />
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 group relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-orange-50 p-3 rounded-xl text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
              <Users size={20} />
            </div>
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Usage</p>
              <h3 className="text-xl font-black text-gray-900">{promos.reduce((a, b) => a + Number(b.usage_count || 0), 0)}</h3>
            </div>
          </div>
          <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-orange-50/50 rounded-full group-hover:scale-150 transition-transform duration-700" />
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 flex-1 w-full">
          <div className="relative flex-1 max-w-md group/search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/search:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search by code or description..." 
              className="w-full pl-9 pr-4 py-1.5 bg-gray-50/50 border border-transparent focus:bg-white focus:border-indigo-400 rounded-xl text-xs focus:outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select 
            defaultValue="all" 
            style={{ width: 130, height: 32 }}
            onChange={setStatusFilter}
            className="custom-select-dashboard"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>
        <div className="hidden md:flex items-center gap-3 px-3 py-1 bg-gray-50/50 rounded-xl border border-gray-100">
           <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
             <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{filteredPromos.length} Campaigns</span>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
          {loading ? (
            [1, 2, 3, 4].map(i => <div key={i} className="bg-white h-40 rounded-2xl animate-pulse border border-gray-100" />)
          ) : filteredPromos.length > 0 ? (
            filteredPromos.map(promo => {
              const usageRate = Math.round((promo.usage_count / (promo.max_uses || 100)) * 100);
              const isPercentage = promo.discount_type === 'percentage';
              const themeBg = isPercentage ? 'bg-indigo-600' : 'bg-emerald-600';
              const shadowColor = isPercentage ? 'shadow-indigo-500/20' : 'shadow-emerald-500/20';

              return (
                <div 
                  key={promo.id} 
                  className="bg-white rounded-2xl border border-gray-100 transition-all duration-300 hover:shadow-md flex overflow-hidden group/card relative"
                >
                  {/* Left Accent Bar */}
                  <div className={`w-1.5 ${themeBg}`} />

                  <div className="p-4 flex-1 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-xl ${themeBg} flex items-center justify-center text-white shadow-lg ${shadowColor}`}>
                          {isPercentage ? <Percent size={20} strokeWidth={3} /> : <IndianRupee size={20} strokeWidth={3} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black text-gray-900 font-mono tracking-tight">{promo.code}</h3>
                            {promo.is_active ? (
                              <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-100">Live</span>
                            ) : (
                              <span className="bg-gray-100 text-gray-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-gray-200">Paused</span>
                            )}
                          </div>
                          <p className="text-[11px] font-medium text-gray-500 line-clamp-1 mt-0.5">{promo.description || 'Campaign Offer'}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Usage</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-indigo-600">{usageRate}%</span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${usageRate}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-50/50 p-2 rounded-xl border border-gray-100 flex flex-col items-center">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Type</span>
                        <span className="text-[10px] font-extrabold text-gray-700 capitalize">{promo.target_type.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="bg-gray-50/50 p-2 rounded-xl border border-gray-100 flex flex-col items-center">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Total Used</span>
                        <span className="text-[10px] font-extrabold text-gray-700">{promo.usage_count}</span>
                      </div>
                      <div className="bg-gray-50/50 p-2 rounded-xl border border-gray-100 flex flex-col items-center">
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Saved Drivers</span>
                        <span className="text-[10px] font-extrabold text-emerald-600">₹{promo.total_discount?.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-gray-300" />
                        <span className="text-[10px] font-bold text-gray-400">
                          {promo.expiry_date ? `Expires ${dayjs(promo.expiry_date).format('DD MMM')}` : 'No Expiry'}
                        </span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenDrawer(promo)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(promo.id, promo.code)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 bg-white rounded-3xl text-center border border-dashed border-gray-200 flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                <Ticket size={32} />
              </div>
              <div>
                <p className="text-gray-500 font-bold">No campaigns found</p>
                <p className="text-gray-400 text-xs mt-1">Refine your search or create a new offer</p>
              </div>
              <Button type="primary" onClick={() => handleOpenDrawer()} className="bg-indigo-600 border-none rounded-xl font-bold h-10 px-6">
                Create New Offer
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Editor Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Ticket size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">{editingId ? 'Edit Offer' : 'Create New Offer'}</h3>
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
               className="flex-1 rounded-xl h-12 font-bold bg-indigo-600 border-none shadow-lg shadow-indigo-100"
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
            <Input placeholder="E.g. DRIVE100" className="rounded-xl h-11 uppercase font-mono font-bold border-slate-200" />
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
                      className="w-full rounded-xl h-11 flex items-center border-slate-200" 
                      min={1} 
                      placeholder="Enter value"
                      prefix={type === 'fixed' ? <span className="text-gray-400 font-medium mr-1 border-r pr-2 border-gray-200">₹</span> : undefined}
                      suffix={type === 'percentage' ? <span className="text-gray-400 font-medium ml-1 border-l pl-2 border-gray-200">%</span> : undefined}
                    />
                  </Form.Item>
                );
              }}
            </Form.Item>
          </div>

          <div className="space-y-3">
            <Form.Item name="description" label="Internal Description" className="mb-0">
              <Input.TextArea placeholder="Describe this offer for admin records..." rows={3} className="rounded-xl border-slate-200" />
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
                  className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-[10px] font-bold text-slate-500 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
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
                      <InputNumber className="w-full rounded-xl h-11 flex items-center" min={1} placeholder="Keep 0 for no limit" />
                    </Form.Item>
                  )}
                </>
              )}
            </Form.Item>
          </div>

          <div className="bg-indigo-50/30 p-6 rounded-2xl border border-indigo-100/30 space-y-4">
             <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
              <Clock size={14} /> Validity & Limits
            </h4>

            <Form.Item name="dates" label="Validity Period">
              <DatePicker.RangePicker className="w-full rounded-xl h-11 border-indigo-100/50" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
               <Form.Item name="max_uses" label="Total Usage Limit">
                  <InputNumber className="w-full rounded-xl h-11 flex items-center" placeholder="Infinite" min={1} />
               </Form.Item>
               <Form.Item name="max_uses_per_driver" label="Limit Per Driver">
                  <InputNumber className="w-full rounded-xl h-11 flex items-center" min={1} defaultValue={1} />
               </Form.Item>
            </div>
          </div>

          <Form.Item name="is_active" label="Status" valuePropName="checked">
             <Switch checkedChildren="Active" unCheckedChildren="Inactive" className="custom-switch-lg" />
          </Form.Item>
        </Form>
      </Drawer>

      <style>{`
        .custom-select-main .ant-select-selector {
          border-radius: 12px !important;
          border-color: #e2e8f0 !important;
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
