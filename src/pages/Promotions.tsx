import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Users,
  Trophy,
  Filter,
  Ticket,
  BarChart3,
  Percent,
  IndianRupee,
  Clock,
  ArrowRight
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
  InputNumber,
  Empty
} from 'antd';
import { messageApi, modalApi, notificationApi } from '../utilities/antdStaticHolder';
import dayjs from 'dayjs';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { fetchDrivers } from '../store/slices/driverSlice';
import { useHasPermission } from '../hooks/usePermission';

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
  const canCreatePromo = useHasPermission("promos", "create");
  const canUpdatePromo = useHasPermission("promos", "update");
  const canDeletePromo = useHasPermission("promos", "delete");

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

  const isAllowed = editingId ? canUpdatePromo : canCreatePromo;

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
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Ticket className="text-indigo-600" size={20} />
            Promotions & Offers
          </h2>
          <p className="text-slate-500 mt-0.5 text-xs font-medium">Create targeted discounts for your high-performing drivers</p>
        </div>
        {canCreatePromo && (
          <button 
            onClick={() => handleOpenDrawer()} 
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 bg-white border border-gray-100 hover:border-indigo-100 px-4 py-1.5 rounded-lg transition-all active:scale-95 text-xs font-bold shadow-sm"
          > 
            <Plus size={14} /> 
            Create New Offer 
          </button> 
        )} 
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-100 transition-all cursor-default group relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-indigo-50/50 p-3 rounded-xl text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
              <BarChart3 size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Active Offers</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{stats.active}</h3>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-indigo-50 opacity-10 rounded-full group-hover:scale-150 transition-transform duration-700" />
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-100 transition-all cursor-default group relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-emerald-50/50 p-3 rounded-xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
              <IndianRupee size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Impact Delivered</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">₹{stats.totalDiscount.toLocaleString()}</h3>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-50 opacity-10 rounded-full group-hover:scale-150 transition-transform duration-700" />
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-orange-100 transition-all cursor-default group relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="bg-orange-50/50 p-3 rounded-xl text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
              <Users size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Driver Outreach</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{promos.reduce((a, b) => a + Number(b.usage_count || 0), 0)}</h3>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-orange-50 opacity-10 rounded-full group-hover:scale-150 transition-transform duration-700" />
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 overflow-hidden">
        <div className="flex items-center gap-4 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md group/search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within/search:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Analyze offers by promo code..." 
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-100 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select 
            defaultValue="all" 
            style={{ width: 130, height: 32 }}
            onChange={setStatusFilter}
            className="custom-select-dashboard"
            suffixIcon={<Filter size={14} className="text-gray-400" />}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
        </div>
        <div className="hidden md:flex items-center gap-4 px-3 py-1 bg-gray-50/50 rounded-xl border border-gray-100">
           <div className="flex items-center gap-1.5">
             <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{filteredPromos.length} Offers Tracking</span>
           </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="bg-white h-48 rounded-2xl animate-pulse" />)
        ) : filteredPromos.length > 0 ? (
          filteredPromos.map(promo => {
            const usageRate = Math.round((promo.usage_count / (promo.max_uses || 100)) * 100);
            const isPercentage = promo.discount_type === 'percentage';
            const themeColor = isPercentage ? '#4f46e5' : '#10b981';
            const themeBg = isPercentage ? 'bg-indigo-600' : 'bg-emerald-600';
            const shadowColor = isPercentage ? 'shadow-indigo-500/20' : 'shadow-emerald-500/20';

            return (
              <div 
                key={promo.id} 
                className="bg-white rounded-xl border border-gray-100 transition-all duration-300 hover:border-gray-200 flex flex-col overflow-hidden relative group/card"
              >
                {/* Top colored border */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[4px] z-20"
                  style={{ backgroundColor: themeColor }}
                />

                <div className="p-4 pt-6 relative flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                       {/* Icon Box */}
                       <div className={`w-9 h-9 rounded-lg ${themeBg} flex items-center justify-center text-white shadow-lg ${shadowColor}`}>
                         {isPercentage ? <Percent size={18} strokeWidth={3} /> : <IndianRupee size={18} strokeWidth={3} />}
                       </div>
                       
                       <div className="flex flex-col">
                         <div className="flex items-center gap-2">
                           <h3 className="text-lg font-black text-slate-900 tracking-tight font-mono leading-none">{promo.code}</h3>
                           <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${promo.is_active ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                              <div className={`w-1 h-1 rounded-full ${promo.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
                              {promo.is_active ? 'Active' : 'Hidden'}
                           </div>
                         </div>
                         <p className="text-[10px] font-bold text-gray-400 mt-1 line-clamp-1">{promo.description || 'Global Campaign Offer'}</p>
                       </div>
                    </div>

                    <div className="flex flex-col items-end">
                       <div className="flex items-center gap-1.5 mb-1">
                         <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Usage Density</span>
                         <span className="text-[11px] font-black text-indigo-500">{usageRate}%</span>
                       </div>
                       <div className="w-16 h-1 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                         <div 
                           className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                           style={{ width: `${usageRate}%` }}
                         />
                       </div>
                    </div>
                  </div>

                  {/* Operational Details Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-6">
                     <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100/50 flex flex-col items-center justify-center gap-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Targeting</span>
                        <div className="flex items-center gap-1 text-[11px] font-black text-slate-700">
                          {promo.target_type === 'specific_driver' ? <Users size={12} className="text-indigo-400" /> : <Trophy size={12} className="text-amber-400" />}
                          <span className="truncate">
                            {promo.target_type === 'ride_count_based' ? `${promo.min_rides_required} Rides` : 
                             promo.target_type === 'specific_driver' ? '1 Driver' : 'Global'}
                          </span>
                        </div>
                     </div>
                     <div className="bg-gray-50/50 p-3 rounded-xl border border-gray-100/50 flex flex-col items-center justify-center gap-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Discounts</span>
                        <div className="flex items-center gap-1 text-[11px] font-black text-emerald-600">
                           <Ticket size={12} />
                           <span>₹{promo.total_discount?.toLocaleString()} Total</span>
                        </div>
                     </div>
                  </div>

                  {/* Validity Info */}
                  <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Clock size={12} className="text-gray-300" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                          {promo.expiry_date ? `Expires ${dayjs(promo.expiry_date).format('DD MMM')}` : 'Operational Forever'}
                        </span>
                     </div>
                     <div className="flex items-center gap-1">
                        {canUpdatePromo && (
                          <button 
                            onClick={() => handleOpenDrawer(promo)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {canDeletePromo && (
                          <button 
                            onClick={() => handleDelete(promo.id, promo.code)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                     </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-20 bg-white rounded-3xl text-center border-2 border-dashed border-slate-100 flex flex-col items-center">
            <Empty description={<span className="text-slate-400 font-medium">No active promotions found</span>} />
            {canCreatePromo && (
              <Button type="link" onClick={() => handleOpenDrawer()} className="font-bold text-indigo-600 flex items-center gap-2 mt-4">
                Click here to create one <ArrowRight size={14} />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Editor Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Ticket size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">{editingId ? (isAllowed ? 'Edit Offer' : 'View Offer') : 'Create New Offer'}</h3>
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
             <Button variant="outlined" size="large" onClick={() => setIsDrawerOpen(false)} className="flex-1 rounded-xl h-12 font-bold">
               {isAllowed ? 'Cancel' : 'Close'}
             </Button>
             {isAllowed && (
               <Button 
                 type="primary" 
                 size="large" 
                 loading={isSubmitting}
                 onClick={() => form.submit()}
                 className="flex-1 rounded-xl h-12 font-bold bg-indigo-600 border-none shadow-lg shadow-indigo-100"
               >
                 {editingId ? 'Update Offer' : 'Launch Offer'}
               </Button>
             )}
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-6"
          disabled={!isAllowed}
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
