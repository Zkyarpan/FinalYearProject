'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
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

// Enhanced context types with connection state
type ConnectionState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'failed';

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: OnlineUser[];
  connectionState: ConnectionState;
  connectionQuality: 'unknown' | 'good' | 'fair' | 'poor';
  forceReconnect: () => void;
  isUserOnline: (userId: string) => boolean;
};

// Keep a reference to the socket instance outside of the component to prevent duplicates
let globalSocketInstance: Socket | null = null;

// Create context with default values
const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: [],
  connectionState: 'disconnected',
  connectionQuality: 'unknown',
  forceReconnect: () => {},
  isUserOnline: () => false,
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');
  const [connectionQuality, setConnectionQuality] = useState<
    'unknown' | 'good' | 'fair' | 'poor'
  >('unknown');

  const { user } = useUserStore();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 12; // Increased for more resilience
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const qualityCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pingTimeouts = useRef(new Map<number, NodeJS.Timeout>());
  const hasInitialized = useRef(false);
  const previousJoinedRooms = useRef<string[]>([]);
  const connectionStartTime = useRef<number>(0);
  const lastPingTimes = useRef<number[]>([]);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const socketEventListeners = useRef<Set<string>>(new Set());

  // Enhanced stable session ID generation
  const generateStableSessionId = useCallback(() => {
    if (!user?._id) return null;

    const storageKey = `mentality_session_${user._id}`;
    let sessionId = sessionStorage.getItem(storageKey);

    if (!sessionId) {
      // Create a unique session ID with timestamp and random component
      const randomPart = Math.random().toString(36).substring(2, 10);
      sessionId = `${user._id}-${Date.now().toString(36)}-${randomPart}`;
      sessionStorage.setItem(storageKey, sessionId);
    }

    return sessionId;
  }, [user?._id]);

  // Function to register socket event listeners with tracking
  const registerSocketEvents = useCallback(
    (socketInstance: Socket) => {
      if (!socketInstance || !user?._id) return;

      const sessionId = generateStableSessionId();

      // Clear existing listeners to prevent duplicates
      socketEventListeners.current.forEach(event => {
        socketInstance.off(event);
      });
      socketEventListeners.current.clear();

      // Helper to register and track events
      const registerEvent = (
        event: string,
        handler: (...args: any[]) => void
      ) => {
        socketInstance.on(event, handler);
        socketEventListeners.current.add(event);
      };

      // Handle connection established
      registerEvent('connect', () => {
        console.log(
          'Socket connected with ID:',
          socketInstance.id,
          'at',
          new Date().toISOString()
        );
        setIsConnected(true);
        setConnectionState('connected');
        reconnectAttempts.current = 0;

        // Clear any pending reconnect timers
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }

        // Re-register for all previously joined conversations
        if (previousJoinedRooms.current.length > 0) {
          console.log(
            'Rejoining conversation rooms after reconnection:',
            previousJoinedRooms.current
          );
          previousJoinedRooms.current.forEach(room => {
            socketInstance.emit('join_conversation', room);
          });
        }

        // Emit user data when connected with more device info
        socketInstance.emit('user_login', {
          _id: user._id,
          id: user._id, // Include both formats for compatibility
          userRole: user.role,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          profileImage: user.profileImage || '',
          sessionId,
          deviceInfo: {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timestamp: Date.now(),
            connectionTime: connectionStartTime.current,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            devicePixelRatio: window.devicePixelRatio,
            isOnline: navigator.onLine,
          },
        });

        // Request current online users
        socketInstance.emit('get_online_users');

        // Explicitly check for active peers
        socketInstance.emit('get_active_peers');

        // Notify of reconnection if this wasn't the first connection
        if (
          connectionStartTime.current > 0 &&
          Date.now() - connectionStartTime.current > 10000
        ) {
          import('sonner').then(({ toast }) => {
            toast.success('Connection reestablished');
          });
        }
      });

      // Handle reconnection
      registerEvent('reconnect', attemptNumber => {
        console.log(
          `Socket reconnected after ${attemptNumber} attempts at ${new Date().toISOString()}`
        );
        setIsConnected(true);
        setConnectionState('connected');

        // Re-emit user data on reconnection with reconnect info
        socketInstance.emit('user_login', {
          _id: user._id,
          id: user._id,
          userRole: user.role,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          profileImage: user.profileImage || '',
          sessionId,
          reconnected: true,
          reconnectAttempt: attemptNumber,
          originalConnectionTime: connectionStartTime.current,
        });

        // Re-request online users
        socketInstance.emit('get_online_users');

        // Request active peers
        socketInstance.emit('get_active_peers');
      });

      // Handle reconnect attempt
      registerEvent('reconnect_attempt', attemptNumber => {
        console.log(
          `Socket reconnection attempt ${attemptNumber}/${maxReconnectAttempts} at ${new Date().toISOString()}`
        );
        reconnectAttempts.current = attemptNumber;
        setConnectionState('reconnecting');

        // Only show toast on the first few attempts to avoid spamming
        if (attemptNumber === 1) {
          import('sonner').then(({ toast }) => {
            toast.warning('Connection lost. Attempting to reconnect...', {
              id: 'reconnection-attempt',
              duration: 5000,
            });
          });
        }
      });

      // Handle reconnect error
      registerEvent('reconnect_error', error => {
        console.error(
          'Socket reconnection error:',
          error,
          'at',
          new Date().toISOString()
        );
        setConnectionState('reconnecting');
      });

      registerEvent('webrtc_signal', data => {
        // Ignore most signal events by default - these will be handled by the VideoCall context
        if (data.type === 'call-ended') {
          // Check if we're handling a stale event
          try {
            const endedCallsStr =
              localStorage.getItem('mentality_ended_calls') || '[]';
            const endedCalls = JSON.parse(endedCallsStr);

            // If this is a new ended call, add it to our ended calls registry
            if (data.callId && !endedCalls.includes(data.callId)) {
              endedCalls.push(data.callId);
              localStorage.setItem(
                'mentality_ended_calls',
                JSON.stringify(endedCalls)
              );

              // Note: We let the VideoCallContext handle showing the toast
              console.log(
                `Socket: registered ended call ${data.callId} in storage`
              );
            }
          } catch (err) {
            console.error(
              'Error handling call-ended signal in socket context:',
              err
            );
          }
        }
      });

      // Handle reconnect failed
      registerEvent('reconnect_failed', () => {
        console.error('Socket reconnection failed after all attempts');
        setConnectionState('failed');

        // Force recreate socket after all reconnect attempts fail
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log(
            'Maximum reconnection attempts reached, recreating socket'
          );

          // Show critical error message
          import('sonner').then(({ toast }) => {
            toast.error('Connection lost. Please refresh the page.', {
              duration: 10000,
              id: 'connection-failed',
            });
          });

          // Clean up the existing socket
          socketInstance.close();
          globalSocketInstance = null;
          hasInitialized.current = false;

          // Try to reconnect after a pause
          reconnectTimer.current = setTimeout(() => {
            window.location.reload(); // Force page reload as a last resort
          }, 10000);
        }
      });

      // Handle disconnection
      registerEvent('disconnect', reason => {
        console.log(
          'Socket disconnected:',
          reason,
          'at',
          new Date().toISOString()
        );
        setIsConnected(false);
        setConnectionState('disconnected');

        // If the disconnection was initiated by the server, try to reconnect
        if (reason === 'io server disconnect' || reason === 'transport close') {
          console.log(
            'Server initiated disconnect or transport closed, attempting to reconnect'
          );

          // A short delay before reconnecting can help in some cases
          setTimeout(() => {
            if (socketInstance) {
              socketInstance.connect();
            }
          }, 1000);
        }
      });

      // Handle connection error
      registerEvent('connect_error', err => {
        console.error(
          'Socket connection error:',
          err.message,
          'at',
          new Date().toISOString()
        );
        setIsConnected(false);
        setConnectionState('reconnecting');

        // If connection error occurs multiple times, suggest a page refresh
        if (reconnectAttempts.current >= maxReconnectAttempts / 2) {
          console.log('Multiple connection errors, may need page refresh');
          import('sonner').then(({ toast }) => {
            toast.error(
              'Connection issues detected. You may need to refresh the page.',
              {
                id: 'connection-issues',
                duration: 10000,
              }
            );
          });
        }
      });

      // Handle users update
      registerEvent('users_update', users => {
        console.log(
          'Online users updated:',
          users.length,
          'users at',
          new Date().toISOString()
        );
        setOnlineUsers(users || []);
      });

      // Log events but don't process them here - that's handled in ChatContext
      registerEvent('new_message', message => {
        console.log('Socket: Debug - New message received:', message._id);
      });

      registerEvent('message_notification', data => {
        console.log('Socket: Debug - Message notification received');
      });

      // Handle errors
      registerEvent('error', error => {
        console.error('Socket error:', error, 'at', new Date().toISOString());

        // Only show toast for critical errors, not every socket error
        if (typeof error === 'string' && error.includes('authentication')) {
          import('sonner').then(({ toast }) => {
            toast.error('Authentication error. Please refresh and try again.', {
              id: 'auth-error',
            });
          });
        }
      });

      registerEvent('message_error', error => {
        console.error('Message error:', error);
      });

      // Add pong handler to clear timeouts
      registerEvent('pong', data => {
        const pingId = data.pingId;
        const responseTime = Date.now() - data.timestamp;

        // Track ping time for connection quality
        lastPingTimes.current.push(responseTime);
        if (lastPingTimes.current.length > 5) {
          lastPingTimes.current.shift(); // Keep only last 5 pings
        }

        // Calculate average ping time
        const avgPing =
          lastPingTimes.current.reduce((sum, time) => sum + time, 0) /
          lastPingTimes.current.length;

        // Update connection quality based on ping times
        if (avgPing < 150) {
          setConnectionQuality('good');
        } else if (avgPing < 300) {
          setConnectionQuality('fair');
        } else {
          setConnectionQuality('poor');
        }

        // Clear ping timeout
        if (pingTimeouts.current.has(pingId)) {
          clearTimeout(pingTimeouts.current.get(pingId));
          pingTimeouts.current.delete(pingId);
          console.log(
            `Received pong for ping ${pingId}, latency: ${responseTime}ms, avg: ${avgPing.toFixed(
              0
            )}ms`
          );
        }
      });

      // Listen for server-side connection quality updates
      registerEvent('connection_quality', data => {
        if (data.quality) {
          console.log(`Server reported connection quality: ${data.quality}`);
          setConnectionQuality(data.quality);
        }
      });

      // Response handler for quality ping
      registerEvent('ping_quality_response', data => {
        if (data.timestamp) {
          const rtt = Date.now() - data.timestamp;
          console.log(`Socket connection RTT: ${rtt}ms`);

          // Update connection quality based on RTT
          if (rtt < 150) {
            setConnectionQuality('good');
          } else if (rtt < 300) {
            setConnectionQuality('fair');
          } else {
            setConnectionQuality('poor');

            // Notify user of poor connection only occasionally
            if (Math.random() < 0.2) {
              // 20% chance to show notification
              import('sonner').then(({ toast }) => {
                toast.warning(
                  'Poor connection detected. Some features may be affected.',
                  {
                    id: 'poor-connection',
                    duration: 5000,
                  }
                );
              });
            }
          }
        }
      });

      console.log(
        'Registered socket event listeners:',
        Array.from(socketEventListeners.current)
      );
    },
    [user, generateStableSessionId]
  );

  // Function to set up ping/pong for connection maintenance
  const setupPingPong = useCallback(
    (socketInstance: Socket) => {
      if (!socketInstance || !user?._id) return;

      // Clear any existing interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      // Clear any existing timeouts
      pingTimeouts.current.forEach(timeout => {
        clearTimeout(timeout);
      });
      pingTimeouts.current.clear();

      const sessionId = generateStableSessionId();

      // Set up new ping interval
      pingIntervalRef.current = setInterval(() => {
        if (socketInstance.connected) {
          const pingId = Date.now();
          console.log(`Sending ping ${pingId} to keep socket alive`);
          socketInstance.emit('ping', {
            userId: user._id,
            timestamp: Date.now(),
            pingId: pingId,
            sessionId: sessionId,
          });

          // Set a timeout to check if we got a pong back
          const pingTimeout = setTimeout(() => {
            console.warn(
              `Did not receive pong for ping ${pingId}, connection may be unstable`
            );
            // If we're using socket.io v4+, we can check socket health
            if (socketInstance.connected) {
              console.log(
                'Socket still reports as connected, but ping timed out'
              );

              // Update connection quality to reflect issues
              setConnectionQuality('poor');
            } else {
              console.warn(
                'Socket disconnected during ping timeout, attempting to reconnect'
              );
              // Force reconnection attempt if socket is disconnected
              socketInstance.connect();
            }
          }, 5000); // Wait 5s for pong

          // Store the timeout reference so we can clear it if we get a pong
          pingTimeouts.current.set(pingId, pingTimeout);
        } else {
          console.warn(
            'Socket disconnected during ping interval, attempting to reconnect'
          );
          socketInstance.connect();
        }
      }, 20000); // Every 20 seconds

      return () => {
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        pingTimeouts.current.forEach(timeout => {
          clearTimeout(timeout);
        });
        pingTimeouts.current.clear();
      };
    },
    [user, generateStableSessionId]
  );

  // Add connection quality monitoring
  const setupConnectionQualityCheck = useCallback(
    (socketInstance: Socket) => {
      if (!socketInstance || !user?._id) return;

      // Clear any existing interval
      if (qualityCheckIntervalRef.current) {
        clearInterval(qualityCheckIntervalRef.current);
        qualityCheckIntervalRef.current = null;
      }

      // Set up quality check interval
      qualityCheckIntervalRef.current = setInterval(() => {
        if (socketInstance.connected) {
          // Measure round-trip time with a timestamp
          const startTime = Date.now();

          // Emit ping_quality event and expect a response
          socketInstance.emit('ping_quality', {
            timestamp: startTime,
            userId: user._id,
            sessionId: generateStableSessionId(),
          });

          // Test network connection more generally
          const online = navigator.onLine;
          if (!online) {
            console.warn('Browser reports network is offline');
            setConnectionQuality('poor');
          }
        }
      }, 30000); // Every 30 seconds

      return () => {
        if (qualityCheckIntervalRef.current) {
          clearInterval(qualityCheckIntervalRef.current);
          qualityCheckIntervalRef.current = null;
        }
      };
    },
    [user, generateStableSessionId]
  );

  // Function to force socket reconnection
  const forceReconnect = useCallback(() => {
    console.log('Force reconnecting socket...');
    setConnectionState('reconnecting');

    // Notify user of reconnection attempt
    import('sonner').then(({ toast }) => {
      toast.info('Attempting to reestablish connection...', {
        id: 'force-reconnect',
      });
    });

    // Clean up existing socket if possible
    if (globalSocketInstance) {
      if (globalSocketInstance.connected) {
        try {
          globalSocketInstance.emit('user_logout', user?._id);
        } catch (e) {
          console.error('Error during logout:', e);
        }
      }

      try {
        globalSocketInstance.disconnect();
      } catch (e) {
        console.error('Error disconnecting socket:', e);
      }

      globalSocketInstance = null;
    }

    // Reset connection state
    hasInitialized.current = false;

    // Reinitialize after a short delay
    setTimeout(() => {
      if (user?._id) {
        if (user._id && user.role) {
          initializeSocket(user._id, user.role);
        }
      }
    }, 1000);
  }, [user]);

  // Main socket initialization function
  const initializeSocket = useCallback(
    (userId: string, userRole: string) => {
      if (!userId || hasInitialized.current) {
        return;
      }

      console.log(
        'Initializing socket connection for user:',
        userId,
        'role:',
        userRole
      );
      setConnectionState('connecting');

      // Cleanup any existing socket connection
      if (globalSocketInstance) {
        console.log('Cleaning up existing global socket');
        try {
          if (globalSocketInstance.connected) {
            globalSocketInstance.emit('user_logout', userId);
          }
          globalSocketInstance.disconnect();
        } catch (e) {
          console.error('Error during socket cleanup:', e);
        }
        globalSocketInstance = null;
      }

      // Create socket connection
      const socketUrl =
        process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;

      console.log('Creating new socket connection to:', socketUrl);
      connectionStartTime.current = Date.now();

      // Get a stable session ID
      const sessionId = generateStableSessionId();

      // Configure socket with auth and reconnection options
      const socketInstance = io(socketUrl, {
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 30000,
        auth: {
          userId: userId,
          userRole: userRole,
          sessionId: sessionId,
        },
        query: {
          userId: userId,
          userRole: userRole,
          sessionId: sessionId,
          connectionTime: connectionStartTime.current,
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          deviceType: /mobile|android|iphone|ipad/i.test(navigator.userAgent)
            ? 'mobile'
            : 'desktop',
        },
        // Allow polling as a fallback for better reliability
        transports: ['websocket', 'polling'],
        forceNew: true,
        reconnection: true,
      });

      // Set global instance
      globalSocketInstance = socketInstance;
      hasInitialized.current = true;
      setSocket(socketInstance);

      // Register all event handlers
      registerSocketEvents(socketInstance);

      // Set up ping/pong mechanism
      setupPingPong(socketInstance);

      // Set up connection quality monitoring
      setupConnectionQualityCheck(socketInstance);

      // Track room joins for reconnection
      const originalEmit = socketInstance.emit;
      socketInstance.emit = function (event, ...args) {
        if (event === 'join_conversation') {
          const roomId = args[0];
          if (roomId && !previousJoinedRooms.current.includes(roomId)) {
            previousJoinedRooms.current.push(roomId);
            console.log(`Tracking room join: ${roomId} for reconnection`);
          }
        } else if (event === 'leave_conversation') {
          const roomId = args[0];
          if (roomId) {
            previousJoinedRooms.current = previousJoinedRooms.current.filter(
              id => id !== roomId
            );
            console.log(`Removed room ${roomId} from tracking`);
          }
        }
        return originalEmit.apply(this, [event, ...args]);
      };

      return socketInstance;
    },
    [
      generateStableSessionId,
      registerSocketEvents,
      setupPingPong,
      setupConnectionQualityCheck,
    ]
  );

  // Initialize socket when user is available
  useEffect(() => {
    if (user?._id && user?.role) {
      initializeSocket(user._id as string, user.role as string);
    }

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket provider');

      // Clear ping intervals
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      // Clear quality check interval
      if (qualityCheckIntervalRef.current) {
        clearInterval(qualityCheckIntervalRef.current);
        qualityCheckIntervalRef.current = null;
      }

      // Clear reconnect timer
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }

      // Clear all ping timeouts
      pingTimeouts.current.forEach(timeout => {
        clearTimeout(timeout);
      });
      pingTimeouts.current.clear();

      // Don't disconnect the socket, but clean up listeners
      if (globalSocketInstance) {
        // Clear all registered event listeners
        socketEventListeners.current.forEach(event => {
          globalSocketInstance?.off(event);
        });
        socketEventListeners.current.clear();

        // We'll keep the socket connected for the app lifecycle
        // Don't disconnect here: globalSocketInstance.disconnect();
      }
    };
  }, [user?._id, user?.role, initializeSocket]);

  // Add network status event listeners
  useEffect(() => {
    const handleNetworkChange = () => {
      const isOnline = navigator.onLine;
      console.log(`Network status changed. Online: ${isOnline}`);

      if (!isOnline) {
        setConnectionState('disconnected');
        setConnectionQuality('poor');

        import('sonner').then(({ toast }) => {
          toast.error('Network connection lost', {
            id: 'network-offline',
          });
        });
      } else if (socket) {
        console.log('Network connection restored, checking socket status');

        if (socket.connected) {
          setConnectionState('connected');
          import('sonner').then(({ toast }) => {
            toast.success('Network connection restored', {
              id: 'network-online',
            });
          });
        } else {
          setConnectionState('reconnecting');
          socket.connect();
        }
      }
    };

    // Add window online/offline event listeners
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    return () => {
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, [socket]);

  // Function to check if a user is online
  const isUserOnline = useCallback(
    (userId: string) => {
      return onlineUsers.some(user => user.userId === userId);
    },
    [onlineUsers]
  );

  // Create context value
  const contextValue = {
    socket,
    isConnected,
    onlineUsers,
    connectionState,
    connectionQuality,
    forceReconnect,
    isUserOnline,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket context
export const useSocket = () => useContext(SocketContext);
