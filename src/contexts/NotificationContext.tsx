'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';

// Define the notification interface
export interface Notification {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePhotoUrl?: string;
  };
  type: 'message' | 'appointment' | 'system' | 'conversation';
  title: string;
  content: string;
  isRead: boolean;
  relatedId?: string;
  relatedModel?: 'Conversation' | 'Message' | 'Appointment';
  meta?: any;
  createdAt: string;
  updatedAt: string;
  roles?: string[]; // Client-side roles that should see this notification
}

interface PaginationInfo {
  limit: number;
  skip: number;
  hasMore: boolean;
}

// Define the context type
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  pagination: PaginationInfo;
  fetchNotifications: (resetPagination?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllRead: () => Promise<void>;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// Create the context
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// Function to filter notifications based on user role
const filterNotificationsByRole = (
  notifications: Notification[],
  userRole: string | null
) => {
  if (!userRole || !notifications) return [];

  return notifications.filter(notification => {
    // If no roles specified, show to everyone
    if (!notification.roles || notification.roles.length === 0) {
      return true;
    }
    // Otherwise, check if user's role is included
    return notification.roles.includes(userRole);
  });
};

// Assign roles to notifications based on their type or meta.type
const assignRolesToNotifications = (notifications: Notification[]) => {
  if (!notifications) return [];

  return notifications.map(notification => {
    // Clone the notification to avoid modifying the original
    const notificationWithRoles = { ...notification };

    // Assign roles based on notification type or meta
    const type = notification.meta?.type || notification.type;

    switch (type) {
      case 'new_booking':
      case 'booking_confirmed':
        // Booking notifications primarily for psychologists and admins
        notificationWithRoles.roles = ['admin', 'psychologist'];
        break;

      case 'appointment_reminder':
        // Appointment reminders for users and related psychologists
        notificationWithRoles.roles = ['admin', 'user', 'psychologist'];
        break;

      case 'availability_change':
        // Availability changes are visible to users
        notificationWithRoles.roles = ['admin', 'user'];
        break;

      case 'status_change':
        // Status changes are visible to all parties
        notificationWithRoles.roles = ['admin', 'user', 'psychologist'];
        break;

      case 'system':
        // System notifications for everyone
        notificationWithRoles.roles = ['admin', 'user', 'psychologist'];
        break;

      case 'message':
      case 'conversation':
        // Messages visible to conversation participants
        notificationWithRoles.roles = ['admin', 'user', 'psychologist'];
        break;

      default:
        // By default, show to everyone
        notificationWithRoles.roles = ['admin', 'user', 'psychologist'];
    }

    return notificationWithRoles;
  });
};

// Export the provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    limit: 20,
    skip: 0,
    hasMore: false,
  });
  const { socket, isConnected } = useSocket();
  const { user } = useUserStore();

  // Get role-filtered notifications
  const getRoleFilteredNotifications = useCallback(() => {
    return filterNotificationsByRole(notifications, user?.role ?? null);
  }, [notifications, user?.role]);

  // Calculate unread count based on filtered notifications
  const calculateUnreadCount = useCallback(() => {
    const filteredNotifications = getRoleFilteredNotifications();
    return filteredNotifications.filter(n => !n.isRead).length;
  }, [getRoleFilteredNotifications]);

  // Load more notifications (pagination)
  const loadMore = useCallback(async () => {
    if (!user?._id || !pagination.hasMore || isLoading) return;

    setIsLoading(true);
    const newSkip = pagination.skip + pagination.limit;

    try {
      console.log(`Loading more: limit=${pagination.limit}, skip=${newSkip}`);

      // First try REST API
      const response = await fetch(
        `/api/notifications?limit=${pagination.limit}&skip=${newSkip}`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.IsSuccess) {
        console.log(
          'Loaded additional notifications:',
          data.Result.notifications.length
        );

        // Assign roles to the new notifications
        const notificationsWithRoles = assignRolesToNotifications(
          data.Result.notifications
        );

        // Merge with existing notifications
        setNotifications(prev => [...prev, ...notificationsWithRoles]);
        setPagination({
          limit: pagination.limit,
          skip: newSkip,
          hasMore: data.Result.pagination.hasMore,
        });

        // Save to localStorage
        try {
          const allNotifications = [
            ...notifications,
            ...notificationsWithRoles,
          ];
          localStorage.setItem(
            `notifications_${user._id}`,
            JSON.stringify(allNotifications)
          );
        } catch (e) {
          console.error('Error saving to localStorage:', e);
        }
      } else {
        throw new Error(
          data.ErrorMessage || 'Failed to load more notifications'
        );
      }
    } catch (error) {
      console.error('Error loading more notifications:', error);
      toast.error('Failed to load more notifications');
    } finally {
      setIsLoading(false);
    }
  }, [pagination, isLoading, user?._id, notifications]);

  // Fetch notifications from the server
  const fetchNotifications = useCallback(
    async (resetPagination = true) => {
      if (!user?._id) return;

      // Don't set loading state if we already have notifications and are just refreshing
      const showLoadingState = resetPagination || notifications.length === 0;

      if (showLoadingState) {
        setIsLoading(true);
      }

      // Skip parameter based on pagination reset
      const skip = resetPagination ? 0 : pagination.skip;

      try {
        console.log(
          `Fetching notifications with limit=${pagination.limit}&skip=${skip}`
        );

        // First try to use the REST API
        const response = await fetch(
          `/api/notifications?limit=${pagination.limit}&skip=${skip}`
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        console.log('API response:', data);

        if (data.IsSuccess) {
          // Assign roles to the notifications client-side
          const notificationsWithRoles = assignRolesToNotifications(
            data.Result.notifications
          );

          if (resetPagination) {
            setNotifications(notificationsWithRoles);
          } else {
            setNotifications(prev => [...prev, ...notificationsWithRoles]);
          }

          // Set unread count from API
          setUnreadCount(data.Result.unreadCount);

          // Update pagination info
          setPagination({
            limit: data.Result.pagination.limit,
            skip: resetPagination ? 0 : skip + data.Result.pagination.limit,
            hasMore: data.Result.pagination.hasMore,
          });

          // Save to localStorage for offline access
          try {
            localStorage.setItem(
              `notifications_${user._id}`,
              JSON.stringify(notificationsWithRoles)
            );
          } catch (e) {
            console.error('Error saving to localStorage:', e);
          }
        } else {
          throw new Error(data.ErrorMessage || 'Failed to fetch notifications');
        }
      } catch (error) {
        console.error('Error fetching notifications via API:', error);

        // Try socket as fallback if API fails
        if (socket && isConnected) {
          try {
            await new Promise<void>((resolve, reject) => {
              socket.emit(
                'get_notifications',
                {
                  userId: user._id,
                  limit: pagination.limit,
                  skip: resetPagination ? 0 : pagination.skip,
                },
                response => {
                  if (response && response.success) {
                    // Assign roles to the notifications
                    const notificationsWithRoles = assignRolesToNotifications(
                      response.notifications
                    );

                    setNotifications(
                      resetPagination
                        ? notificationsWithRoles
                        : prev => [...prev, ...notificationsWithRoles]
                    );

                    // Set unread count
                    setUnreadCount(response.unreadCount || 0);

                    // Save to localStorage
                    if (response.notifications.length > 0) {
                      try {
                        localStorage.setItem(
                          `notifications_${user._id}`,
                          JSON.stringify(notificationsWithRoles)
                        );
                      } catch (e) {
                        console.error('Error saving to localStorage:', e);
                      }
                    }

                    // Update pagination
                    setPagination(prev => ({
                      ...prev,
                      skip: resetPagination
                        ? 0
                        : prev.skip + response.notifications.length,
                      hasMore:
                        response.notifications.length >= pagination.limit,
                    }));

                    resolve();
                  } else {
                    reject(new Error(response?.error || 'Socket error'));
                  }
                }
              );

              // Add timeout for socket response
              setTimeout(() => {
                reject(new Error('Socket timeout'));
              }, 5000);
            });
          } catch (socketError) {
            console.error('Socket fallback failed:', socketError);

            // Try localStorage if both API and socket fail
            try {
              const storedNotifications = localStorage.getItem(
                `notifications_${user._id}`
              );
              if (storedNotifications && resetPagination) {
                const parsed = JSON.parse(storedNotifications);
                setNotifications(parsed);

                // Calculate unread count
                const unreadNotifications = parsed.filter(n => !n.isRead);
                setUnreadCount(unreadNotifications.length);

                console.log('Using cached notifications from localStorage');
              }
            } catch (e) {
              console.error('Error loading cached notifications:', e);
            }
          }
        } else {
          // Try localStorage if socket is not available
          try {
            const storedNotifications = localStorage.getItem(
              `notifications_${user._id}`
            );
            if (storedNotifications && resetPagination) {
              const parsed = JSON.parse(storedNotifications);
              setNotifications(parsed);

              // Calculate unread count
              const unreadNotifications = parsed.filter(n => !n.isRead);
              setUnreadCount(unreadNotifications.length);

              console.log('Using cached notifications (no socket available)');
            }
          } catch (e) {
            console.error('Error loading cached notifications:', e);
          }
        }
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    },
    [
      pagination.limit,
      pagination.skip,
      user?._id,
      notifications.length,
      socket,
      isConnected,
    ]
  );

  // Mark a notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user?._id) return;

      // Update local state immediately for better UX
      setNotifications(prev =>
        prev.map(n => (n._id === notificationId ? { ...n, isRead: true } : n))
      );

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Update localStorage
      try {
        const storedNotifications = localStorage.getItem(
          `notifications_${user._id}`
        );
        if (storedNotifications) {
          const parsed = JSON.parse(storedNotifications);
          const updated = parsed.map(n =>
            n._id === notificationId ? { ...n, isRead: true } : n
          );
          localStorage.setItem(
            `notifications_${user._id}`,
            JSON.stringify(updated)
          );
        }
      } catch (e) {
        console.error('Error updating localStorage:', e);
      }

      try {
        // Call the API
        const response = await fetch('/api/notifications', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ notificationId }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.IsSuccess) {
          throw new Error(
            data.ErrorMessage || 'Failed to mark notification as read'
          );
        }
      } catch (error) {
        console.error('API mark as read error:', error);

        // Try socket as fallback
        if (socket && isConnected) {
          socket.emit(
            'mark_notification_read',
            {
              notificationId,
              userId: user._id,
            },
            response => {
              if (!response?.success) {
                console.error('Socket mark as read error:', response?.error);
              }
            }
          );
        }
      }

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    },
    [socket, isConnected, user?._id]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user?._id) return;

    // Get role-filtered notifications
    const roleFilteredNotifications = getRoleFilteredNotifications();
    const roleFilteredIds = roleFilteredNotifications
      .filter(n => !n.isRead)
      .map(n => n._id);

    if (roleFilteredIds.length === 0) {
      toast.info('No unread notifications');
      return;
    }

    // Update local state immediately for better UX
    setNotifications(prev =>
      prev.map(n =>
        roleFilteredIds.includes(n._id) ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount(0);

    // Update localStorage
    try {
      const storedNotifications = localStorage.getItem(
        `notifications_${user._id}`
      );
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        const updated = parsed.map(n =>
          roleFilteredIds.includes(n._id) ? { ...n, isRead: true } : n
        );
        localStorage.setItem(
          `notifications_${user._id}`,
          JSON.stringify(updated)
        );
      }
    } catch (e) {
      console.error('Error updating localStorage:', e);
    }

    try {
      // Call the API to mark all as read
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markAll: true }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.IsSuccess) {
        toast.success('All notifications marked as read');
      } else {
        throw new Error(data.ErrorMessage || 'Failed to mark all as read');
      }
    } catch (error) {
      console.error('API mark all as read error:', error);

      // Try socket as fallback
      if (socket && isConnected) {
        socket.emit(
          'mark_all_notifications_read',
          { userId: user._id },
          response => {
            if (response?.success) {
              toast.success('All notifications marked as read');
            } else {
              console.error('Socket mark all as read error:', response?.error);
              toast.error('Failed to mark all as read');
            }
          }
        );
      } else {
        toast.error('Failed to mark all as read');
      }
    }

    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('notifications-updated'));
  }, [getRoleFilteredNotifications, socket, isConnected, user?._id]);

  // Delete a notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      // Remove from local state immediately for better UX
      const wasUnread =
        notifications.find(n => n._id === notificationId)?.isRead === false;

      setNotifications(prev => prev.filter(n => n._id !== notificationId));

      if (wasUnread) {
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Update localStorage
      try {
        const storedNotifications = localStorage.getItem(
          `notifications_${user?._id}`
        );
        if (storedNotifications) {
          const parsed = JSON.parse(storedNotifications);
          const updated = parsed.filter(n => n._id !== notificationId);
          localStorage.setItem(
            `notifications_${user?._id}`,
            JSON.stringify(updated)
          );
        }
      } catch (e) {
        console.error('Error updating localStorage:', e);
      }

      try {
        // Call API to delete from database
        const response = await fetch(
          `/api/notifications?id=${notificationId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.IsSuccess) {
          throw new Error(data.ErrorMessage || 'Failed to delete notification');
        }
      } catch (error) {
        console.error('Error deleting notification:', error);
        toast.error('Failed to delete notification');
        // Revert local state if API call failed
        await fetchNotifications();
      }

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    },
    [notifications, fetchNotifications, user?._id]
  );

  // Delete all read notifications
  const deleteAllRead = useCallback(async () => {
    // Get all read notifications
    const readNotifications = notifications.filter(n => n.isRead);

    if (readNotifications.length === 0) {
      toast.info('No read notifications to delete');
      return;
    }

    // Remove from local state immediately for better UX
    setNotifications(prev => prev.filter(n => !n.isRead));

    // Update localStorage
    try {
      const storedNotifications = localStorage.getItem(
        `notifications_${user?._id}`
      );
      if (storedNotifications) {
        const parsed = JSON.parse(storedNotifications);
        const updated = parsed.filter(n => !n.isRead);
        localStorage.setItem(
          `notifications_${user?._id}`,
          JSON.stringify(updated)
        );
      }
    } catch (e) {
      console.error('Error updating localStorage:', e);
    }

    // Delete each read notification individually
    let successCount = 0;
    let failCount = 0;

    for (const notification of readNotifications) {
      try {
        const response = await fetch(
          `/api/notifications?id=${notification._id}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.IsSuccess) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        console.error('Error deleting notification:', error);
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(
        `Deleted ${successCount} read notifications${
          failCount > 0 ? ` (${failCount} failed)` : ''
        }`
      );
    } else if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} notifications`);
      // Refresh to get the current state
      await fetchNotifications();
    }

    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('notifications-updated'));
  }, [notifications, fetchNotifications, user?._id]);

  // Set up socket listeners for real-time updates
  useEffect(() => {
    if (!socket || !isConnected || !user?._id) return;

    const handleNewNotification = data => {
      console.log('New notification received:', data);

      // Add the new notification to the state
      if (data.notification) {
        // Assign roles to the notification
        const notificationWithRoles = assignRolesToNotifications([
          data.notification,
        ])[0];

        setNotifications(prev => {
          // Check if notification already exists to prevent duplicates
          const exists = prev.some(n => n._id === notificationWithRoles._id);
          if (exists) return prev;
          return [notificationWithRoles, ...prev]; // Add at the beginning
        });

        // Update localStorage
        try {
          const storedNotifications = localStorage.getItem(
            `notifications_${user._id}`
          );
          let parsed: Notification[] = [];
          if (storedNotifications) {
            parsed = JSON.parse(storedNotifications) as Notification[];
          }
          const exists = parsed.some(n => n._id === notificationWithRoles._id);
          if (!exists) {
            const updated = [notificationWithRoles, ...parsed];
            localStorage.setItem(
              `notifications_${user._id}`,
              JSON.stringify(updated)
            );
          }
        } catch (e) {
          console.error('Error updating localStorage:', e);
        }

        // Only update unread count if notification is for this user's role
        const isForUserRole =
          filterNotificationsByRole([notificationWithRoles], user.role).length >
          0;
        if (isForUserRole && !notificationWithRoles.isRead) {
          setUnreadCount(prev => prev + 1);
        }
      } else {
        // If just count update, recalculate
        if (data.unreadCount !== undefined) {
          // Update unread count
          setUnreadCount(data.unreadCount);
        } else {
          // Full refresh to ensure correct counts
          fetchNotifications();
        }
      }

      // Show toast notification if not viewing notifications and it's for this user's role
      const notification = data.notification;
      if (notification) {
        const notificationWithRoles = assignRolesToNotifications([
          notification,
        ])[0];
        const isForUserRole =
          filterNotificationsByRole([notificationWithRoles], user.role).length >
          0;

        if (isForUserRole && !isOpen) {
          toast(notificationWithRoles.title || 'New notification', {
            description: notificationWithRoles.content || '',
            action: {
              label: 'View',
              onClick: () => setIsOpen(true),
            },
          });
        }
      }
    };

    const handleAppointmentNotification = data => {
      console.log('Appointment notification received:', data);

      // Check if this notification type is relevant for this user role
      const isRelevantForRole =
        user.role === 'psychologist' ||
        user.role === 'user' ||
        user.role === 'admin';

      if (isRelevantForRole) {
        // Refresh notifications list
        fetchNotifications();

        // Show toast notification
        toast(data.message || 'Appointment update', {
          description: `Appointment notification: ${data.type || ''}`,
          action: {
            label: 'View',
            onClick: () => setIsOpen(true),
          },
        });
      }
    };

    const handleAvailabilityUpdated = data => {
      console.log('Availability update received:', data);

      // Check if this notification type is relevant for this user role
      const isRelevantForRole = user.role === 'user' || user.role === 'admin';

      if (isRelevantForRole) {
        // Fetch fresh notifications
        fetchNotifications();

        // Show toast notification with psychologist name if available
        toast('Availability Updated', {
          description: `${
            data.psychologistName || 'A provider'
          } has updated their availability`,
          action: {
            label: 'View',
            onClick: () => setIsOpen(true),
          },
        });
      }
    };

    const handleNotificationCountUpdate = data => {
      if (data.unreadCount !== undefined) {
        // Update unread count
        setUnreadCount(data.unreadCount);
      }
    };

    // Register socket listeners
    socket.on('new_notification', handleNewNotification);
    socket.on('appointment_notification', handleAppointmentNotification);
    socket.on('availability_updated', handleAvailabilityUpdated);
    socket.on('notification_count_update', handleNotificationCountUpdate);

    // Request notification count on connect
    socket.emit(
      'get_notification_count',
      {
        userId: user._id,
        role: user.role,
      },
      response => {
        if (response?.success) {
          setUnreadCount(response.unreadCount || 0);
        }
      }
    );

    // Clean up listeners
    return () => {
      socket.off('new_notification', handleNewNotification);
      socket.off('appointment_notification', handleAppointmentNotification);
      socket.off('availability_updated', handleAvailabilityUpdated);
      socket.off('notification_count_update', handleNotificationCountUpdate);
    };
  }, [socket, isConnected, user, fetchNotifications, isOpen]);

  // Load notifications when component mounts or user changes
  useEffect(() => {
    if (!isInitialized && user?._id) {
      console.log('Initial fetch of notifications');
      fetchNotifications(true);

      // Try to load from localStorage while fetching
      try {
        const storedNotifications = localStorage.getItem(
          `notifications_${user._id}`
        );
        if (storedNotifications) {
          const parsed = JSON.parse(storedNotifications);
          setNotifications(parsed);

          // Calculate unread count
          const unreadNotifications = parsed.filter(n => !n.isRead);
          setUnreadCount(unreadNotifications.length);

          console.log(
            'Loaded notifications from localStorage while waiting for API'
          );
        }
      } catch (e) {
        console.error('Error loading cached notifications:', e);
      }
    }
  }, [user?._id, isInitialized, fetchNotifications]);

  // Fetch fresh notifications when notification panel opens
  useEffect(() => {
    if (isOpen && user?._id && isInitialized) {
      console.log('Refreshing notifications when panel opens');
      fetchNotifications(true);
    }
  }, [isOpen, fetchNotifications, user?._id, isInitialized]);

  // Create the context value
  const contextValue: NotificationContextType = {
    // Only expose role-filtered notifications to components
    notifications: getRoleFilteredNotifications(),
    unreadCount,
    isLoading,
    pagination,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    isOpen,
    setIsOpen,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Export the hook for using the context
// FIXED: This is the proper way to define the hook to avoid React Hooks errors
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
};
