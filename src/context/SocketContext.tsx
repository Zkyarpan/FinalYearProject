'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUserStore } from '@/store/userStore';

// Define context types
type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: any[];
};

// Create context with default values
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: [],
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const { user } = useUserStore();

  useEffect(() => {
    // Only initialize socket if we have a user
    if (!user?._id) return;

    // Create socket connection
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    const socketInstance = io(socketUrl);
    setSocket(socketInstance);

    // Handle connection established
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);

      // Emit user data when connected
      socketInstance.emit('user_login', user);
    });

    // Handle disconnection
    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    // Handle connection error
    socketInstance.on('connect_error', err => {
      console.error('Socket connection error:', err);
      setIsConnected(false);
    });

    // Handle users update
    socketInstance.on('users_update', users => {
      setOnlineUsers(users);
    });

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user?._id]); // Only re-run when user ID changes

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket context
export const useSocket = () => useContext(SocketContext);
