'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useUserStore } from '@/store/userStore';

// Define online user type
type OnlineUser = {
  userId: string;
  socketId: string;
  userRole?: string;
  firstName?: string;
  lastName?: string;
};

// Define context types
type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: OnlineUser[];
};

// Keep a reference to the socket instance outside of the component to prevent duplicates
let globalSocketInstance: Socket | null = null;

// Create context with default values
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: [],
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const { user } = useUserStore();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only initialize socket if we have a user and haven't initialized yet
    if (!user?._id || hasInitialized.current) {
      return;
    }

    console.log(
      'Initializing socket connection for user:',
      user._id,
      'role:',
      user.role
    );

    // Cleanup any existing socket connection
    if (globalSocketInstance) {
      console.log('Cleaning up existing global socket');
      if (globalSocketInstance.connected) {
        globalSocketInstance.emit('user_logout', user._id);
      }
      globalSocketInstance.disconnect();
      globalSocketInstance = null;
    }

    // Create socket connection
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;

    console.log('Creating new socket connection to:', socketUrl);

    // Configure socket with auth and reconnection options
    const socketInstance = io(socketUrl, {
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 20000,
      auth: {
        userId: user._id,
        userRole: user.role,
      },
      query: {
        userId: user._id,
        userRole: user.role,
      },
      // Add forceNew to create a new connection always
      forceNew: true,
      // Add transports to force websocket only (no polling)
      transports: ['websocket'],
    });

    // Set global instance
    globalSocketInstance = socketInstance;
    hasInitialized.current = true;
    setSocket(socketInstance);

    // Handle connection established
    socketInstance.on('connect', () => {
      console.log('Socket connected with ID:', socketInstance.id);
      setIsConnected(true);
      reconnectAttempts.current = 0;

      // Emit user data when connected
      socketInstance.emit('user_login', {
        _id: user._id,
        id: user._id, // Include both formats for compatibility
        userRole: user.role,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        profileImage: user.profileImage || '',
      });

      // Request current online users
      socketInstance.emit('get_online_users');
    });

    // Handle reconnection
    socketInstance.on('reconnect', attemptNumber => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);

      // Re-emit user data on reconnection
      socketInstance.emit('user_login', {
        _id: user._id,
        id: user._id,
        userRole: user.role,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        profileImage: user.profileImage || '',
      });

      // Re-request online users
      socketInstance.emit('get_online_users');
    });

    // Handle reconnect attempt
    socketInstance.on('reconnect_attempt', attemptNumber => {
      console.log(
        `Socket reconnection attempt ${attemptNumber}/${maxReconnectAttempts}`
      );
      reconnectAttempts.current = attemptNumber;
    });

    // Handle reconnect failure
    socketInstance.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after all attempts');

      // Force recreate socket after all reconnect attempts fail
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.log('Maximum reconnection attempts reached, recreating socket');
        socketInstance.close();
        globalSocketInstance = null;
        hasInitialized.current = false;
      }
    });

    // Handle disconnection
    socketInstance.on('disconnect', reason => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);

      // If the disconnection was initiated by the server, try to reconnect
      if (reason === 'io server disconnect') {
        console.log('Server initiated disconnect, attempting to reconnect');
        socketInstance.connect();
      }
    });

    // Handle connection error
    socketInstance.on('connect_error', err => {
      console.error('Socket connection error:', err.message);
      setIsConnected(false);
    });

    // Handle users update
    socketInstance.on('users_update', users => {
      console.log('Online users updated:', users.length, 'users');
      setOnlineUsers(users || []);
    });

    // Log events but don't process them here - that's handled in ChatContext
    socketInstance.on('new_message', message => {
      console.log('Socket: Debug - New message received:', message._id);
    });

    socketInstance.on('message_notification', data => {
      console.log('Socket: Debug - Message notification received');
    });

    // Handle errors
    socketInstance.on('error', error => {
      console.error('Socket error:', error);
    });

    socketInstance.on('message_error', error => {
      console.error('Message error:', error);
    });

    // Keep socket connection alive with ping
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    pingIntervalRef.current = setInterval(() => {
      if (socketInstance.connected) {
        console.log('Sending ping to keep socket alive');
        socketInstance.emit('ping', {
          userId: user._id,
          timestamp: Date.now(),
        });
      }
    }, 30000); // Every 30 seconds

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket provider');

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      // Don't disconnect the socket, but clean up listeners
      if (socketInstance) {
        socketInstance.off('new_message');
        socketInstance.off('message_notification');
        socketInstance.off('connect');
        socketInstance.off('disconnect');
        socketInstance.off('reconnect');
        socketInstance.off('reconnect_attempt');
        socketInstance.off('reconnect_failed');
        socketInstance.off('connect_error');
        socketInstance.off('error');
        socketInstance.off('message_error');
        socketInstance.off('users_update');
        socketInstance.off('pong');

        // We'll keep the socket connected for the app lifecycle
        // Don't disconnect here: socketInstance.disconnect();
      }
    };
  }, [user?._id, user?.role]); // Re-run when user ID or role changes

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket context
export const useSocket = () => useContext(SocketContext);
