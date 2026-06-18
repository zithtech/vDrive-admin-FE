import React, { useEffect, useRef, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { SocketContext } from "./SocketContext";
import { useAppSelector } from "../store/hooks";
import { logger } from "../utils/logger";

interface SocketProviderProps {
  children: ReactNode;
}

import axiosIns from "../api/axios";

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Only connect if authenticated and token exists
    if (!isAuthenticated || !accessToken) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setSocketId(null);
        delete axiosIns.defaults.headers.common["x-socket-id"];
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

    if (!socketRef.current) {
      socketRef.current = io(socketUrl, {
        transports: ["websocket"],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        auth: {
          token: accessToken,
        },
      });

      socketRef.current.on("connect", () => {
        const id = socketRef.current?.id || null;
        setIsConnected(true);
        if (id) {
          setSocketId(id);
          axiosIns.defaults.headers.common["x-socket-id"] = id;
          // Join the admin room for global notifications
          socketRef.current?.emit("joinAdminRoom");
        }
      });

      socketRef.current.onAny((eventName, ...args) => {
        logger.debug(`Incoming Event: ${eventName}`, args);
      });

      socketRef.current.on("disconnect", () => {
        setIsConnected(false);
        setSocketId(null);
        delete axiosIns.defaults.headers.common["x-socket-id"];
      });

      socketRef.current.on("connect_error", (err) => {
        logger.error("Socket connection error:", err);
        setIsConnected(false);
        setSocketId(null);
        delete axiosIns.defaults.headers.common["x-socket-id"];
      });
    }

    return () => {
      // Cleanup on component unmount or if auth state changes
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setSocketId(null);
        delete axiosIns.defaults.headers.common["x-socket-id"];
      }
    };
  }, [isAuthenticated, accessToken]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, socketId }}>
      {children}
    </SocketContext.Provider>
  );
};
