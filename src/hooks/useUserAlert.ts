import { useEffect } from "react";
import { useSocket } from "./useSocket";

export const useUserAlert = (onNewUser: (user: any) => void) => {
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("JOIN_ADMIN_ROOM", () => {
      console.log("JOIN_ADMIN_ROOM from useUserAlert");
    });

    // Register listener
    socket.on("ADMIN_NEW_USER_CREATED", onNewUser);

    // Clean‑up
    return () => {
      socket.off("ADMIN_NEW_USER_CREATED", onNewUser);
    };
  }, [socket, isConnected, onNewUser]);

  return socket;
};
