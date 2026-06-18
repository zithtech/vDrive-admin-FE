// admin-ui/src/hooks/useAdminTripAlert.ts
import { useEffect } from "react";
import { useSocket } from "./useSocket"; // Assuming you exported your first block as useSocket

export const useAdminTripAlert = (onNewTrip: (trip: any) => void) => {
  const { socket, isConnected } = useSocket();
  console.log(socket, isConnected, "socket");

  useEffect(() => {
    if (!socket || !isConnected) return;
    socket.emit("JOIN_ADMIN_ROOM", () => {
      console.log("JOIN_ADMIN_ROOM");
    }); // Register listener
    socket.on("ADMIN_NEW_TRIP_ALERT", onNewTrip);

    // Clean‑up
    return () => {
      socket.off("ADMIN_NEW_TRIP_ALERT", onNewTrip);
    };
    // Inclusion of socket/isConnected ensures we re-bind if the connection resets
  }, [socket, isConnected, onNewTrip]);

  return socket;
};
