import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  addSosAlert,
  updateSosLocation,
  resolveSosAlert,
  setSosAlerts,
} from "../../store/slices/sosSlice";
import { useSocket } from "../../hooks/useSocket";
import { Card, Button, Modal, List, Badge, Typography } from "antd";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import {
  WarningOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import * as sosApi from "../../api/sosApi";
import { message } from "antd";

const { Text } = Typography;

const mapContainerStyle = {
  width: "100%",
  height: "500px",
};

const center = { lat: 13.0827, lng: 80.2707 }; // Default Chennai

const SosMonitor: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeAlerts } = useAppSelector((state) => state.sos);
  const { socket } = useSocket();
  const [selectedSosId, setSelectedSosId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAP_API || "",
  });

  useEffect(() => {
    const fetchActiveSos = async () => {
      try {
        const response = await sosApi.getActiveSos();
        if (response.success && Array.isArray(response.data)) {
          // Format data to match SosAlert interface if needed
          const alerts = response.data.map((item: any) => ({
            sos_id: item.id || item.sos_id,
            driver_id: item.user_id || item.driver_id,
            trip_id: item.trip_id,
            status: "ACTIVE",
            created_at: item.created_at,
            latitude: item.latitude,
            longitude: item.longitude,
            driver_name: item.user?.full_name || item.driver?.full_name,
            pickup_address: item.trip?.pickup_address,
            trip_status: item.trip?.status,
          }));
          dispatch(setSosAlerts(alerts));
        }
      } catch (error) {
        console.error("Failed to fetch active SOS alerts:", error);
      }
    };

    fetchActiveSos();
  }, [dispatch]);

  useEffect(() => {
    if (!socket) return;

    const handleDriverEvent = (data: any) => {
      console.log("SOS TRIGGERED", data);
      if (data.eventType === "SOS_TRIGGERED") {
        console.log("SOS TRIGGERED", data.data);
        dispatch(
          addSosAlert({
            sos_id: data.data.id || data.data.sos_id,
            user_id: data.data.user_id,
            user_type: data.data.user_type,
            trip_id: data.data.trip_id,
            status: "ACTIVE",
            created_at: data.data.created_at,
            latitude: data.data.latitude || 0,
            longitude: data.data.longitude || 0,
            // Enriched data
            name: data.data.user?.full_name || data.data.user?.full_name,
            pickup_address: data.data.trip?.pickup_address,
            trip_status: data.data.trip?.status,
          }),
        );
      } else if (data.eventType === "SOS_RESOLVED") {
        dispatch(resolveSosAlert(data.data.sos_id));
        if (selectedSosId === data.data.sos_id) {
          setIsModalOpen(false);
          setSelectedSosId(null);
        }
      } else if (data.eventType === "SOS_LOCATION_UPDATE") {
        dispatch(
          updateSosLocation({
            sos_id: data.data.sos_id,
            latitude: data.data.latitude,
            longitude: data.data.longitude,
          }),
        );
      }
    };

    const handleSosLocationUpdate = (data: any) => {
      dispatch(updateSosLocation(data));
    };

    socket.on("driver_event", handleDriverEvent);
    socket.on("sos_location_update", handleSosLocationUpdate);

    return () => {
      socket.off("driver_event", handleDriverEvent);
      socket.off("sos_location_update", handleSosLocationUpdate);
    };
  }, [socket, dispatch, selectedSosId]);

  const activeAlert = activeAlerts.find((a) => a.sos_id === selectedSosId);
  console.log("activeAlerts", activeAlerts);

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000, width: 350 }}>
      {activeAlerts.length > 0 && (
        <Card
          title={
            <span style={{ color: "#ff4d4f" }}>
              <WarningOutlined /> Active SOS Alerts
            </span>
          }
          size="small"
          extra={<Badge count={activeAlerts.length} style={{ backgroundColor: "#ff4d4f" }} />}
          style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.15)", border: "1px solid #ffa39e" }}
        >
          <List
            dataSource={activeAlerts}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setSelectedSosId(item.sos_id);
                      setIsModalOpen(true);
                      // Join SOS tracking room
                      socket?.emit("join", `sos_${item.sos_id}`);
                    }}
                  >
                    Track
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Text strong>
                      {item.user_type === "driver" ? "Driver" : "User"} ID:{" "}
                      {item.user_id?.substring(0, 8)}...
                    </Text>
                  }
                  description={
                    <Text type="secondary">{new Date(item.created_at).toLocaleTimeString()}</Text>
                  }
                />
              </List.Item>
            )}
          />
        </Card>
      )}

      <Modal
        title={
          <span style={{ color: "#ff4d4f" }}>
            <WarningOutlined /> Real-time SOS Tracking
          </span>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalOpen(false)}>
            Close Monitor
          </Button>,
          <Button
            key="resolve"
            type="primary"
            danger
            icon={isResolving ? <LoadingOutlined /> : <CheckCircleOutlined />}
            loading={isResolving}
            onClick={async () => {
              if (!selectedSosId) return;
              setIsResolving(true);
              try {
                await sosApi.resolveSos(selectedSosId);
                message.success("SOS Alert marked as RESOLVED");
                setIsModalOpen(false);
                setSelectedSosId(null);
              } catch (error) {
                console.error("Failed to resolve SOS:", error);
                message.error("Failed to resolve SOS alert. Please try again.");
              } finally {
                setIsResolving(false);
              }
            }}
          >
            Mark as Resolved
          </Button>,
        ]}
        width={800}
      >
        {activeAlert && isLoaded ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong>{activeAlert.user_type}:</Text> {activeAlert.name || activeAlert.user_id}{" "}
              <br />
              <Text strong>Trip ID:</Text> {activeAlert.trip_id || "N/A"} <br />
              <Text strong>Pickup:</Text> {activeAlert.pickup_address || "Fetching..."} <br />
              <Text strong>Trip Status:</Text> {activeAlert.trip_status || "Active"} <br />
              <Text strong>Status:</Text>{" "}
              <Badge status="processing" text="LIVE Tracking Active" color="red" />
            </div>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={15}
              center={{
                lat: activeAlert.latitude || center.lat,
                lng: activeAlert.longitude || center.lng,
              }}
            >
              <Marker
                position={{
                  lat: activeAlert.latitude || center.lat,
                  lng: activeAlert.longitude || center.lng,
                }}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                }}
              />
            </GoogleMap>
          </div>
        ) : (
          <div style={{ padding: 50, textAlign: "center" }}>Loading Live Tracking Map...</div>
        )}
      </Modal>
    </div>
  );
};

export default SosMonitor;
