import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import SosHeader from '../components/SosHandle/SosHeader';
import SosActionForm from '../components/SosHandle/SosActionForm';
import SosMap from '../components/SosHandle/SosMap';
import DetailsCard from '../components/SosHandle/DetailsCard';
import { PhoneOutlined, MailOutlined, CarOutlined, CalendarOutlined, EnvironmentOutlined, HistoryOutlined, UserOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';

const formatRideType = (type?: string) => {
  if (!type) return 'N/A';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const SosHandle: React.FC = () => {
  const { activeAlerts } = useAppSelector((state) => state.sos);
  const location = useLocation();
  const [selectedSosId, setSelectedSosId] = useState<string | null>(location.state?.selectedSosId || null);

  const { socket } = useSocket();

  // Auto-select first if none selected, or if current is resolved
  useEffect(() => {
    if (!selectedSosId && activeAlerts.length > 0) {
      setSelectedSosId(activeAlerts[0].sos_id);
    } else if (selectedSosId && !activeAlerts.find(a => a.sos_id === selectedSosId)) {
      setSelectedSosId(activeAlerts.length > 0 ? activeAlerts[0].sos_id : null);
    }
  }, [activeAlerts, selectedSosId]);

  // Join SOS tracking room for live location updates
  useEffect(() => {
    if (selectedSosId && socket) {
      socket.emit("join", `sos_${selectedSosId}`);
      return () => {
        socket.emit("leave", `sos_${selectedSosId}`);
      };
    }
  }, [selectedSosId, socket]);

  const activeAlert = activeAlerts.find(a => a.sos_id === selectedSosId);
  const isDriver = activeAlert?.user_type?.toLowerCase() === 'driver';

  const navigate = useNavigate();

  // Extract trip details from enriched data
  const trip = activeAlert?.trip_details;
  const userInfo = activeAlert?.user_info;
  const trustedContacts = activeAlert?.trusted_contacts || [];

  // Build driver/customer display data from the enriched payload
  const driverData = isDriver
    ? {
        name: activeAlert?.name || userInfo?.full_name || 'N/A',
        id: activeAlert?.user_id || 'N/A',
        phone: activeAlert?.phone || userInfo?.phone_number || 'N/A',
        alt_phone: activeAlert?.alt_phone || userInfo?.alternate_contact || 'N/A',
        email: userInfo?.email || 'N/A',
        address: userInfo?.address ? `${userInfo.address.street || ''}, ${userInfo.address.city || ''}` : 'N/A',
        created_at: userInfo?.created_at,
        profile_pic: activeAlert?.profile_pic || userInfo?.profile_pic_url,
        t2driver: userInfo?.t2driver,
      }
    : {
        // If customer triggered SOS, driver data comes from trip
        name: trip?.driver_details?.full_name || trip?.driver_details?.first_name ? `${trip?.driver_details?.first_name} ${trip?.driver_details?.last_name || ''}` : 'N/A',
        id: trip?.driver_details?.id || 'N/A',
        phone: trip?.driver_details?.phone_number || 'N/A',
        alt_phone: 'N/A',
        email: 'N/A',
        address: 'N/A',
        created_at: null,
        profile_pic: trip?.driver_details?.profile_pic_url,
        t2driver: null,
      };

  const customerData = !isDriver
    ? {
        name: activeAlert?.name || userInfo?.full_name || 'N/A',
        id: activeAlert?.user_id || 'N/A',
        phone: activeAlert?.phone || userInfo?.phone_number || 'N/A',
        alt_phone: activeAlert?.alt_phone || userInfo?.alternate_contact || 'N/A',
        email: userInfo?.email || 'N/A',
        profile_pic: activeAlert?.profile_pic || userInfo?.profile_url,
        t2driver: userInfo?.t2driver,
      }
    : {
        // If driver triggered SOS, customer data comes from trip
        name: trip?.user_details?.full_name || trip?.user_details?.first_name ? `${trip?.user_details?.first_name} ${trip?.user_details?.last_name || ''}` : 'N/A',
        id: trip?.user_details?.id || 'N/A',
        phone: trip?.user_details?.phone_number || 'N/A',
        alt_phone: 'N/A',
        email: trip?.user_details?.email || 'N/A',
        profile_pic: trip?.user_details?.profile_url,
        t2driver: null,
      };

  // Driver's trusted contacts from the driver model (driver.trusted_contact) if driver SOS
  // OR from trusted_contacts table
  const driverTrustedContacts = isDriver
    ? (() => {
        // Merge DB trusted_contacts + driver.trusted_contact
        const dbContacts = trustedContacts.map(c => ({ name: c.name, phone: c.phone, relationship: c.relationship }));
        const driverModelContacts = userInfo?.trusted_contact
          ? (Array.isArray(userInfo.trusted_contact) ? userInfo.trusted_contact : [userInfo.trusted_contact])
              .map((c: any) => ({ name: c.name, phone: c.number, relationship: c.relation_type }))
          : [];
        // De-duplicate by phone
        const all = [...dbContacts];
        driverModelContacts.forEach((mc: any) => {
          if (!all.find(c => c.phone === mc.phone)) all.push(mc);
        });
        return all;
      })()
    : [];

  const customerTrustedContacts = !isDriver
    ? (() => {
        const dbContacts = trustedContacts.map(c => ({ name: c.name, phone: c.phone, relationship: c.relationship }));
        const emergencyContacts = userInfo?.emergency_contacts
          ? userInfo.emergency_contacts.map((c: any) => ({ name: c.name, phone: c.phone, relationship: c.relationship }))
          : [];
        const all = [...dbContacts];
        emergencyContacts.forEach((ec: any) => {
          if (!all.find((c: any) => c.phone === ec.phone)) all.push(ec);
        });
        return all;
      })()
    : [];

  const activeTrustedContacts = isDriver ? driverTrustedContacts : customerTrustedContacts;

  return (
    <div className="p-4 md:p-6 bg-white dark:bg-slate-900 min-h-full">
      <div className="max-w-[1600px] mx-auto flex gap-6">

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          
          {/* Page Title & Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1 gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white m-0">SOS Details</h1>
              {activeAlerts.length > 0 && (
                <span className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-red-200 dark:border-red-800/50">
                  {activeAlerts.length} Active
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {activeAlerts.map(alert => (
                <Button 
                  key={alert.sos_id}
                  type={selectedSosId === alert.sos_id ? "primary" : "default"}
                  danger={selectedSosId === alert.sos_id}
                  className={selectedSosId !== alert.sos_id ? "border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40" : ""}
                  onClick={() => setSelectedSosId(alert.sos_id)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${selectedSosId === alert.sos_id ? 'bg-white' : 'bg-red-500 animate-pulse'}`}></div>
                    <span className="font-semibold text-xs">{alert.user_type?.toLowerCase() === 'driver' ? 'Driver' : 'Customer'}:</span> {alert.name || alert.driver_name || alert.user_id?.substring(0, 8)}
                  </div>
                </Button>
              ))}
              
              {activeAlerts.length > 0 && (
                <div className="h-6 w-px bg-gray-300 dark:bg-slate-700 mx-1 hidden sm:block"></div>
              )}
              
              <Button 
                type="default" 
                icon={<HistoryOutlined />} 
                className="dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:border-slate-600"
                onClick={() => navigate('/sos-history')}
              >
                SOS History
              </Button>
            </div>
          </div>

          <SosHeader activeAlert={activeAlert} />

          {activeAlert ? (
            <div className="flex flex-col gap-4">


          {/* Top Row: Map & Trip Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

            {/* Map */}
            <div className="lg:col-span-8 flex flex-col gap-4 h-full">
              <SosMap />
            </div>

            {/* Trip Details */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <DetailsCard title="Trip Details" badgeText={trip?.status || activeAlert.trip_status || "N/A"} badgeStatus={trip?.status === 'COMPLETED' ? 'success' : trip?.status === 'CANCELLED' ? 'error' : 'success'}>
                {trip ? (
                  <div className="flex flex-col gap-2 text-[13px]">
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400 font-medium">Trip ID</span><span className="font-semibold text-slate-800 dark:text-white">{trip.trip_code || trip.trip_id || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400 font-medium">Trip Type</span><span className="font-semibold text-slate-800 dark:text-white">{formatRideType(trip.ride_type)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400 font-medium">Service</span><span className="font-semibold text-slate-800 dark:text-white">{formatRideType(trip.service_type)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400 font-medium">From</span><span className="font-semibold text-slate-800 dark:text-white text-right max-w-[150px] truncate" title={trip.pickup_address || ''}>{trip.pickup_address || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400 font-medium">To</span><span className="font-semibold text-slate-800 dark:text-white text-right max-w-[150px] truncate" title={trip.drop_address || ''}>{trip.drop_address || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400 font-medium">Distance</span><span className="font-semibold text-slate-800 dark:text-white">{trip.distance_km ? `${trip.distance_km} km` : 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400 font-medium">Fare</span><span className="font-semibold text-slate-800 dark:text-white">{trip.total_fare ? `₹${Number(trip.total_fare).toFixed(2)}` : 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400 font-medium">Started At</span><span className="font-semibold text-slate-800 dark:text-white">{trip.scheduled_start_time ? new Date(trip.scheduled_start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500 dark:text-slate-400 font-medium">Vehicle</span><span className="font-semibold text-slate-800 dark:text-white">{trip.vehicle_model || trip.vehicle_type || 'N/A'}</span></div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-gray-400 dark:text-slate-500">
                    <CarOutlined style={{ fontSize: 28 }} />
                    <span className="text-sm mt-2">No trip associated</span>
                  </div>
                )}
                {trip && <Button type="default" className="w-full mt-3 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 dark:bg-slate-800 font-medium">View Trip</Button>}
              </DetailsCard>
            </div>
          </div>

          {/* Driver and Customer Details */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Driver Details */}
            <DetailsCard title="Driver Details">
              <div className={`grid grid-cols-1 ${isDriver ? 'md:grid-cols-2' : ''} gap-4 text-[13px]`}>
                {/* Basic Details */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    {driverData.profile_pic ? (
                      <img src={driverData.profile_pic} alt="Driver" className="w-10 h-10 rounded-full border border-gray-200 dark:border-slate-700 object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                        <UserOutlined className="text-gray-400 dark:text-slate-500" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 leading-tight">
                        {driverData.name}
                        {driverData.name !== 'N/A' && <span className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded text-[10px] border border-green-100 dark:border-green-800/50">Verified</span>}
                      </div>
                      <div className="text-gray-500 dark:text-slate-400 text-[11px] mt-0.5">Driver • {driverData.t2driver || driverData.id}</div>
                    </div>
                  </div>
                  <div className="h-px bg-gray-100 dark:bg-slate-800 my-0.5"></div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><PhoneOutlined className="text-gray-400 dark:text-slate-500" /> {driverData.phone}</div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><PhoneOutlined className="text-gray-400 dark:text-slate-500" /> <span className="text-gray-400 dark:text-slate-500 text-[11px]">Alt:</span> {driverData.alt_phone}</div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 col-span-2"><MailOutlined className="text-gray-400 dark:text-slate-500" /> {driverData.email}</div>
                    {driverData.address !== 'N/A' && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 col-span-2"><EnvironmentOutlined className="text-gray-400 dark:text-slate-500" /> {driverData.address}</div>
                    )}
                    {driverData.created_at && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 col-span-2"><CalendarOutlined className="text-gray-400 dark:text-slate-500" /> {new Date(driverData.created_at).toLocaleDateString([], { dateStyle: 'medium' })}</div>
                    )}
                  </div>
                  <div className="mt-auto pt-2">
                    <Button type="default" className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 dark:bg-slate-800 font-medium py-1 px-4 h-auto text-[12px]" onClick={() => navigate('/drivers', { state: { openDriverDrawer: driverData.t2driver || driverData.id } })}>View Driver</Button>
                  </div>
                </div>

                {/* Trusted Contacts - only shown when this is the SOS triggerer */}
                {isDriver && (
                  <div className="flex flex-col gap-2 md:border-l md:border-gray-200 dark:md:border-slate-800 md:pl-4">
                    <div className="font-semibold text-slate-700 dark:text-slate-300 text-[12px] mb-1">Trusted SOS Contacts</div>

                    {activeTrustedContacts.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {activeTrustedContacts.slice(0, 3).map((contact: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50/80 dark:bg-slate-800/80 p-2 rounded border border-gray-100 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                                {contact.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] leading-tight">{contact.name} {contact.relationship && <span className="text-gray-400 dark:text-slate-500 font-normal">({contact.relationship})</span>}</div>
                                <div className="text-gray-500 dark:text-slate-400 text-[10px] leading-tight mt-0.5">{contact.phone}</div>
                              </div>
                            </div>
                            <Button type="default" shape="circle" icon={<PhoneOutlined className="text-[10px]" />} size="small" className="h-6 w-6 min-w-[24px]" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 dark:text-slate-500 text-[11px] py-4 text-center">No trusted contacts found</div>
                    )}

                    {activeTrustedContacts.length > 3 && (
                      <div className="flex justify-between items-center mt-auto pt-2">
                        <a href="#" className="text-blue-600 text-[11px] font-medium hover:underline">View all ({activeTrustedContacts.length})</a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DetailsCard>

            {/* Customer Details */}
            <DetailsCard title="Customer Details">
              <div className={`grid grid-cols-1 ${!isDriver ? 'md:grid-cols-2' : ''} gap-4 text-[13px]`}>
                {/* Basic Details */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    {customerData.profile_pic ? (
                      <img src={customerData.profile_pic} alt="Customer" className="w-10 h-10 rounded-full border border-gray-200 dark:border-slate-700 object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                        <UserOutlined className="text-gray-400 dark:text-slate-500" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-white flex items-center gap-2 leading-tight">
                        {customerData.name}
                        {customerData.name !== 'N/A' && <span className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded text-[10px] border border-green-100 dark:border-green-800/50">Verified</span>}
                      </div>
                      <div className="text-gray-500 dark:text-slate-400 text-[11px] mt-0.5">Customer • {customerData.t2driver || customerData.id}</div>
                    </div>
                  </div>
                  <div className="h-px bg-gray-100 dark:bg-slate-800 my-0.5"></div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><PhoneOutlined className="text-gray-400 dark:text-slate-500" /> {customerData.phone}</div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><PhoneOutlined className="text-gray-400 dark:text-slate-500" /> <span className="text-gray-400 dark:text-slate-500 text-[11px]">Alt:</span> {customerData.alt_phone}</div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 col-span-2"><MailOutlined className="text-gray-400 dark:text-slate-500" /> {customerData.email}</div>
                  </div>
                  <div className="mt-auto pt-2">
                    <Button type="default" className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 dark:bg-slate-800 font-medium py-1 px-4 h-auto text-[12px]" onClick={() => navigate('/customers', { state: { openCustomerDrawer: customerData.t2driver || customerData.id } })}>View Customer</Button>
                  </div>
                </div>

                {/* Trusted Contacts - only shown when customer is the SOS triggerer */}
                {!isDriver && (
                  <div className="flex flex-col gap-2 md:border-l md:border-gray-200 dark:md:border-slate-800 md:pl-4">
                    <div className="font-semibold text-slate-700 dark:text-slate-300 text-[12px] mb-1">Trusted SOS Contacts</div>

                    {activeTrustedContacts.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {activeTrustedContacts.slice(0, 3).map((contact: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50/80 dark:bg-slate-800/80 p-2 rounded border border-gray-100 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                                {contact.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] leading-tight">{contact.name} {contact.relationship && <span className="text-gray-400 dark:text-slate-500 font-normal">({contact.relationship})</span>}</div>
                                <div className="text-gray-500 dark:text-slate-400 text-[10px] leading-tight mt-0.5">{contact.phone}</div>
                              </div>
                            </div>
                            <Button type="default" shape="circle" icon={<PhoneOutlined className="text-[10px]" />} size="small" className="h-6 w-6 min-w-[24px]" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 dark:text-slate-500 text-[11px] py-4 text-center">No trusted contacts found</div>
                    )}

                    {activeTrustedContacts.length > 3 && (
                      <div className="flex justify-between items-center mt-auto pt-2">
                        <a href="#" className="text-blue-600 text-[11px] font-medium hover:underline">View all ({activeTrustedContacts.length})</a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DetailsCard>
          </div>

          {/* SOS Action Form */}
          <div className="mt-2">
            <SosActionForm sosId={selectedSosId} />
          </div>

            </div>
          ) : (
            <div className="flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-10 h-[500px]">
              <div className="text-center">
                <div className="text-gray-300 dark:text-slate-600 mb-3"><EnvironmentOutlined style={{ fontSize: '48px' }} /></div>
                <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-1">No SOS Alert Selected</h3>
                <p className="text-gray-400 dark:text-slate-500 text-sm">Select an active alert from the sidebar to view details</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SosHandle;
