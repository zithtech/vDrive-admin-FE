import React, { useEffect, useState, useRef } from "react";
import { Avatar, Badge, Typography, Tag, Tooltip, Empty } from "antd";
import {
  BellOutlined,
  UserAddOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { useSocket } from "../../hooks/useSocket";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface FeedEvent {
  id: string;
  eventType: string;
  message: string;
  timestamp: string;
  data?: any;
}

const eventConfigs: Record<string, { icon: React.ReactNode, color: string, label: string }> = {
  NEW_DRIVER: {
    icon: <UserAddOutlined />,
    color: "blue",
    label: "Onboarding"
  },
  DRIVER_PROFILE_COMPLETED: {
    icon: <ThunderboltOutlined />,
    color: "cyan",
    label: "Profile"
  },
  SOS_TRIGGERED: {
    icon: <WarningOutlined />,
    color: "red",
    label: "SOS ALERT"
  },
  SOS_ALERT: {
    icon: <WarningOutlined />,
    color: "red",
    label: "SOS ALERT"
  },
  SOS_LOCATION_UPDATE: {
    icon: <EnvironmentOutlined />,
    color: "orange",
    label: "SOS Location"
  },
  SOS_RESOLVED: {
    icon: <CheckOutlined />,
    color: "green",
    label: "SOS Resolved"
  },
  TRIP_COMPLETED: {
    icon: <CheckCircleOutlined />,
    color: "green",
    label: "Trip Finished"
  },
  HIGH_DEMAND: {
    icon: <ThunderboltOutlined />,
    color: "gold",
    label: "Market"
  },
  SUBSCRIPTION_ACTIVATED: {
    icon: <DollarOutlined />,
    color: "purple",
    label: "New Sub"
  },
  SUBSCRIPTION_RENEWED: {
    icon: <ReloadOutlined />,
    color: "magenta",
    label: "Renewal"
  },
  TRIP_VERIFICATION_REQUIRED: {
    icon: <WarningOutlined />,
    color: "volcano",
    label: "Verification"
  },
  TRIP_VERIFICATION_APPROVED: {
    icon: <CheckCircleOutlined />,
    color: "green",
    label: "Verification"
  },
  TRIP_VERIFICATION_REJECTED: {
    icon: <WarningOutlined />,
    color: "red",
    label: "Verification"
  },
  DEFAULT: {
    icon: <BellOutlined />,
    color: "gray",
    label: "System"
  }
};

const ActivityFeed: React.FC = () => {
  const { socket } = useSocket();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const handleEvent = (data: any) => {
      const newEvent: FeedEvent = {
        id: Math.random().toString(36).substr(2, 9),
        eventType: data.eventType || "DEFAULT",
        message: data.message || "New activity detected",
        timestamp: data.timestamp || new Date().toISOString(),
        data: data.data,
      };

      setEvents((prev) => [newEvent, ...prev].slice(0, 30));
    };

    socket.on("driver_event", handleEvent);
    return () => {
      socket.off("driver_event", handleEvent);
    };
  }, [socket]);

  const navigate = useNavigate();
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Badge dot status="processing">
            <ThunderboltOutlined className="text-blue-500 text-lg" />
          </Badge>
          <span className="font-bold text-gray-800 text-base">Live Operational Feed</span>
        </div>
        <div className="flex items-center gap-2">
          <Tag color="blue" className="text-[10px] m-0 rounded-full border-0 font-bold bg-blue-50 text-blue-500">
            {events.length} ACTIVE
          </Tag>
        </div>
      </div>

      {/* Table Header Style */}
      <div className="grid grid-cols-12 px-5 py-2 bg-gray-50/30 border-b border-gray-100 uppercase tracking-tighter text-[9px] font-bold text-gray-400">
        <div className="col-span-3">Entity Type</div>
        <div className="col-span-6">Activity Details</div>
        <div className="col-span-3 text-right">Time</div>
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-white"
      >
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-40">
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={
              <Typography.Text className="text-gray-400 text-xs">
                Waiting for live events...
              </Typography.Text>
            } />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {events.map((item) => {
              const config = eventConfigs[item.eventType] || eventConfigs.DEFAULT;
              const isUrgent = item.eventType === "SOS_ALERT" || item.eventType === "SOS_TRIGGERED";

              const handleRowClick = () => {
                if (item.eventType === "TRIP_VERIFICATION_REQUIRED") {
                  navigate("/trip-verifications");
                } else if (item.eventType === "NEW_DRIVER") {
                  navigate("/drivers");
                } else if (item.eventType === "DRIVER_PROFILE_COMPLETED") {
                  navigate("/drivers");
                } else if (item.eventType === "TRIP_COMPLETED") {
                  navigate("/TripDetails");
                }
              };

              return (
                <div
                  key={item.id}
                  onClick={handleRowClick}
                  className={`grid grid-cols-12 px-4 py-3 hover:bg-gray-50/80 transition-all cursor-pointer group ${isUrgent ? 'bg-red-50/40' : ''}`}
                >
                  {/* Column 1: Type */}
                  <div className="col-span-3 flex items-center gap-2">
                    <Avatar
                      size="small"
                      className={`shadow-sm flex-shrink-0 ${isUrgent ? 'animate-pulse' : ''}`}
                      style={{
                        backgroundColor: isUrgent ? '#ff4d4f' : '#f5f5f5',
                        color: isUrgent ? '#fff' : config.color,
                        fontSize: '12px'
                      }}
                      icon={config.icon}
                    />
                    <Tag
                      color={config.color}
                      className="text-[9px] font-extrabold m-0 border-0 rounded-full px-1.5 leading-tight uppercase"
                    >
                      {config.label}
                    </Tag>
                  </div>

                  {/* Column 2: Message */}
                  <div className="col-span-6 flex flex-col justify-center">
                    <Typography.Text
                      className={`text-[11px] font-medium block leading-snug truncate ${isUrgent ? 'text-red-700 font-bold' : 'text-gray-700'}`}
                    >
                      {item.message}
                    </Typography.Text>
                    {item.data?.location && (
                      <div className="flex items-center gap-1 mt-0.5 text-[9px] text-blue-500 opacity-80 overflow-hidden">
                        <EnvironmentOutlined className="text-[8px]" />
                        <span className="truncate">{item.data.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Column 3: Time */}
                  <div className="col-span-3 flex flex-col items-end justify-center">
                    <Tooltip title={dayjs(item.timestamp).format('YYYY-MM-DD HH:mm:ss')}>
                      <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">
                        {dayjs(item.timestamp).format('HH:mm:ss')}
                      </span>
                    </Tooltip>
                    <span className="text-[8px] text-gray-400 font-medium">
                      {dayjs(item.timestamp).fromNow()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-2 border-t border-gray-100 bg-gray-50/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] text-gray-400 font-medium italic uppercase tracking-tighter">Live vDrive Stream</span>
          </div>
          <Typography.Text className="text-[9px] text-gray-300 font-medium">
            AUTO-RELOAD ACTIVE
          </Typography.Text>
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

export default ActivityFeed;
