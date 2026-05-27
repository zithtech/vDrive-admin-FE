import React from "react";
import { Typography, Tag } from "antd";
import { Car, CheckCircle, Clock, User, Navigation, MapPin } from "lucide-react";

const { Text } = Typography;

interface TripManagementProps {
  stats: {
    onTripDrivers: number;
    todayTrips: number;
    pendingVerifications: number;
    documentExpiryAlerts: number;
    loading: boolean;
  };
  trips: any[];
}

const TripManagement: React.FC<TripManagementProps> = ({ stats, trips }) => {
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "REQUESTED":
        return "warning";
      case "ACCEPTED":
        return "processing";
      case "ARRIVING":
      case "ARRIVED":
        return "magenta";
      case "LIVE":
        return "success";
      case "COMPLETED":
        return "cyan";
      case "CANCELLED":
      case "MID_CANCELLED":
        return "error";
      default:
        return "default";
    }
  };

  const getRelativeTime = (dateString: string) => {
    if (!dateString) return "Just now";
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    const diffInHours = Math.floor(diffInMins / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return past.toLocaleDateString();
  };

  const StatItem = ({
    title,
    value,
    icon: Icon,
    iconBgColor,
    iconColor,
  }: {
    title: string;
    value: number | string;
    icon: any;
    iconBgColor: string;
    iconColor: string;
  }) => (
    <div className="flex items-center p-3 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-all duration-300 group cursor-default h-[68px]">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 ${iconBgColor} shrink-0`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <Text className="text-[10px] text-gray-400 font-medium mb-0 tracking-tight">
          {title}
        </Text>
        <p className="m-0 text-gray-900 font-bold text-[17px] leading-tight">
          {stats.loading ? "..." : value}
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col h-105 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Car size={16} className="text-gray-500" />
          <span className="font-bold text-gray-900 text-[14px] tracking-tight">Trip Management</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-emerald-500 font-medium text-[12px]">Live</span>
        </div>
      </div>

      {/* Stats Section */}
      <div className="p-3.5 border-b border-gray-50 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <StatItem
            title="Active Trips"
            value={stats.onTripDrivers}
            icon={Navigation}
            iconBgColor="bg-emerald-50"
            iconColor="text-emerald-500"
          />
          <StatItem
            title="Completed"
            value={stats.todayTrips}
            icon={CheckCircle}
            iconBgColor="bg-blue-50"
            iconColor="text-blue-500"
          />
        </div>
      </div>

      {/* Live Trips List */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/10 flex items-center justify-between sticky top-0 z-10">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Live Trip Feed</span>
          <span className="text-[10px] text-blue-500 font-bold cursor-pointer hover:underline uppercase tracking-tighter">View all</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
          {trips.length > 0 ? (
            trips.map((trip) => (
              <div
                key={trip.trip_id}
                className="p-3 rounded-xl hover:bg-gray-50 transition-all group flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <User size={14} className="text-gray-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-gray-900">Trip #{trip.trip_id?.slice(0, 8)}</span>
                      <span className="text-[10px] text-gray-400 font-medium font-outfit uppercase tracking-wider">
                        {trip.driver_name || "Unassigned"} • {trip.user_name || "Passenger"}
                      </span>
                    </div>
                  </div>
                  <Tag color={getStatusColor(trip.trip_status)} className="text-[9px] font-extrabold m-0 border-0 rounded-full px-2 leading-tight uppercase">
                    {trip.trip_status?.replace("_", " ")}
                  </Tag>
                </div>

                <div className="flex items-center justify-between pl-10.5">
                  <div className="flex items-center gap-1.5 text-gray-400 overflow-hidden">
                    <MapPin size={10} className="shrink-0" />
                    <span className="text-[10px] font-medium truncate">
                      {trip.pickup_address?.split(",")[0]} → {trip.drop_address?.split(",")[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock size={10} />
                    <span className="text-[9px] font-bold uppercase tracking-tighter">
                      {getRelativeTime(trip.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-10 opacity-40">
              <Car size={32} className="mb-2 text-gray-300" />
              <span className="text-xs font-medium uppercase tracking-widest">No active trips found</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
};

export default TripManagement;
