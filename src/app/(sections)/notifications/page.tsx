'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '@/context/SocketContext'; 

interface Notification {
  _id: string;
  type: 'message' | 'appointment' | 'system' | 'conversation';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    _id: string;
    firstName: string;
    lastName: string;
    image?: string;
    profilePhotoUrl?: string;
  };
  relatedId?: string;
  relatedModel?: string;
  meta?: any;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { socket } = useSocket();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(data.data.notifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
      setNotifications(
        notifications.map(notification =>
          notification._id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markAll: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      setNotifications(
        notifications.map(notification => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Update local state
      setNotifications(
        notifications.filter(
          notification => notification._id !== notificationId
        )
      );
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    await markAsRead(notification._id);

    // Navigate based on notification type
    if (notification.type === 'message' && notification.relatedId) {
      router.push(`/conversations/${notification.relatedId}`);
    } else if (
      notification.type === 'appointment' &&
      notification.meta?.appointmentId
    ) {
      router.push(`/appointments/${notification.meta.appointmentId}`);
    } else if (notification.type === 'conversation' && notification.relatedId) {
      router.push(`/conversations/${notification.relatedId}`);
    }
  };

  // Setup socket listeners for real-time notifications
  useEffect(() => {
    if (socket) {
      // Listen for new notifications
      socket.on('new_notification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
      });

      // Get initial notification count
      socket.emit('get_notification_count');
    }

    return () => {
      if (socket) {
        socket.off('new_notification');
      }
    };
  }, [socket]);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Helper function to get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return (
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-blue-600 dark:text-blue-400"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        );
      case 'appointment':
        return (
          <div className="rounded-full bg-green-100 dark:bg-green-900 p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-600 dark:text-green-400"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
        );
      case 'system':
        return (
          <div className="rounded-full bg-yellow-100 dark:bg-yellow-900 p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-yellow-600 dark:text-yellow-400"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        );
      case 'conversation':
        return (
          <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-purple-600 dark:text-purple-400"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-600 dark:text-gray-400"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
        );
    }
  };

  // Render empty state if no notifications
  if (notifications.length === 0 && !loading && !error) {
    return (
      <div className="flex items-center justify-center w-full h-[calc(100vh-4rem)]">
        <div className="w-full max-w-md flex items-center justify-center">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4 mb-4">
              <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="dark:opacity-75"
              >
                <circle
                  cx="40"
                  cy="40"
                  r="31.5"
                  className="fill-gray-100 dark:fill-gray-800"
                  stroke="currentColor"
                />
                <circle
                  cx="40"
                  cy="60"
                  r="7.5"
                  className="fill-gray-50 dark:fill-gray-700"
                  stroke="currentColor"
                />
                <rect
                  x="37"
                  y="12"
                  width="6"
                  height="9"
                  rx="3"
                  className="fill-gray-400 dark:fill-gray-500"
                />
                <g filter="url(#filter0_d_9580_31973)">
                  <path
                    d="M25.8581 28.4897C26.7468 21.3553 32.8104 16 40 16C47.1896 16 53.2532 21.3553 54.1419 28.4897L55.2209 37.1521C55.3722 38.367 55.626 39.567 55.9795 40.7392L56.9324 43.8989C58.7529 49.9352 62.3161 55.2992 67.1746 59.3174C67.4531 59.5477 67.2902 60 66.929 60H13.5382C13.0193 60 12.7855 59.3504 13.1853 59.0197C17.8091 55.1956 21.2001 50.0908 22.9327 44.3462L24.0205 40.7392C24.374 39.567 24.6278 38.367 24.7791 37.1521L25.8581 28.4897Z"
                    className="fill-gray-50 dark:fill-gray-800"
                  />
                  <path
                    d="M26.3543 28.5515C27.2117 21.6674 33.0627 16.5 40 16.5C46.9373 16.5 52.7883 21.6674 53.6457 28.5515L54.7247 37.2139C54.8795 38.4568 55.1391 39.6844 55.5008 40.8836L56.4537 44.0433C58.2722 50.073 61.8028 55.4421 66.6133 59.5H13.5382C13.5171 59.5 13.5098 59.4947 13.5068 59.4924C13.501 59.4882 13.493 59.4791 13.4877 59.4645C13.4825 59.4499 13.4829 59.4378 13.4846 59.4308C13.4855 59.4272 13.4877 59.4185 13.504 59.405C18.2037 55.5182 21.6504 50.3295 23.4114 44.4906L24.4992 40.8836C24.8609 39.6844 25.1205 38.4568 25.2753 37.2139L26.3543 28.5515Z"
                    stroke="currentColor"
                  />
                </g>
                <circle
                  cx="40"
                  cy="44"
                  r="1.5"
                  fill="#6FCF97"
                  stroke="#6FCF97"
                />
                <path
                  d="M37 33C37 34.6569 35.6569 36 34 36C32.3431 36 31 34.6569 31 33"
                  stroke="#6FCF97"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M49 33C49 34.6569 47.6569 36 46 36C44.3431 36 43 34.6569 43 33"
                  stroke="#6FCF97"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <defs>
                  <filter
                    id="filter0_d_9580_31973"
                    x="4.98438"
                    y="12"
                    width="70.332"
                    height="60"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                  >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset dy="4" />
                    <feGaussianBlur stdDeviation="4" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="BackgroundImageFix"
                      result="effect1_dropShadow_9580_31973"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect1_dropShadow_9580_31973"
                      result="shape"
                    />
                  </filter>
                </defs>
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 dark:text-gray-200">
              No-tifications
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              You don't have any notifications.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-[calc(100vh-4rem)]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchNotifications}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">Notifications</h1>
        <button
          onClick={markAllAsRead}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {notifications.map(notification => (
            <div
              key={notification._id}
              className={`flex p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="mr-4 flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div
                className="flex-1 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <div>
                    <h3 className="font-medium dark:text-white">
                      {notification.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                      {notification.content}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
              <button
                onClick={e => {
                  e.stopPropagation();
                  deleteNotification(notification._id);
                }}
                className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                aria-label="Delete notification"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
