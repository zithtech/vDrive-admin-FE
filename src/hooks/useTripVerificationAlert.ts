import { useEffect } from "react";
import { useSocket } from "./useSocket";

export const useTripVerificationAlert = (onNewVerification: (data: any) => void) => {
    const { socket, isConnected } = useSocket();

    useEffect(() => {
        if (!socket || !isConnected) return;
        
        socket.emit("JOIN_ADMIN_ROOM", () => {});
        
        socket.on("ADMIN_TRIP_VERIFICATION_REQUESTED", onNewVerification);

        return () => {
            socket.off("ADMIN_TRIP_VERIFICATION_REQUESTED", onNewVerification);
        };
    }, [socket, isConnected, onNewVerification]);

    return socket;
};
