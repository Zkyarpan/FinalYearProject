'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';

// Define a global event name for notification count updates
const NOTIFICATION_COUNT_EVENT = 'notification-count-changed';

// Global function to update notification count across components
export const updateGlobalNotificationCount = count => {
  // Update localStorage for persistence
  if (typeof window !== 'undefined') {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?._id) {
      localStorage.setItem(`notification_count_${user._id}`, count.toString());
    }

    // Dispatch global event for real-time updates
    window.dispatchEvent(
      new CustomEvent(NOTIFICATION_COUNT_EVENT, { detail: { count } })
    );
  }
};

const NotificationIcon = () => {
  const router = useRouter();
  const userStore = useUserStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [animate, setAnimate] = useState(false);

  // Get notifications directly from context if available
  let notificationsContext;
  try {
    notificationsContext = useNotifications();
  } catch (e) {
    // Context not available, will fallback to other methods
  }

  // Safely access user data
  const user = userStore?.user;

  // Centralized function to update the unread count
  const updateUnreadCount = useCallback(
    count => {
      if (count !== unreadCount) {
        setUnreadCount(count);
        // Trigger animation when count increases
        if (count > unreadCount) {
          setAnimate(true);
          setTimeout(() => setAnimate(false), 1000);
        }
      }
    },
    [unreadCount]
  );

  // IMPORTANT: Use this effect to immediately sync with NotificationContext
  useEffect(() => {
    if (
      notificationsContext &&
      typeof notificationsContext.unreadCount === 'number'
    ) {
      updateUnreadCount(notificationsContext.unreadCount);
    }
  }, [notificationsContext?.unreadCount, updateUnreadCount]);

  // Load unread count from localStorage on mount if not available from context
  useEffect(() => {
    if (!user?._id) return;

    // If we already have count from context, don't override
    if (
      notificationsContext &&
      typeof notificationsContext.unreadCount === 'number'
    ) {
      return;
    }

    // Try localStorage as fallback
    const storedCount = localStorage.getItem(`notification_count_${user._id}`);
    if (storedCount) {
      const count = parseInt(storedCount, 10) || 0;
      updateUnreadCount(count);
    }

    // Also make a direct API call to get the most recent count
    fetch('/api/notifications/count')
      .then(res => res.json())
      .then(data => {
        if (data.IsSuccess && typeof data.Result.unreadCount === 'number') {
          updateUnreadCount(data.Result.unreadCount);
        }
      })
      .catch(err => console.error('Failed to fetch notification count:', err));
  }, [user?._id, updateUnreadCount, notificationsContext]);

  // Listen for global notification count updates
  useEffect(() => {
    const handleCountUpdate = event => {
      if (event.detail && typeof event.detail.count === 'number') {
        updateUnreadCount(event.detail.count);
      }
    };

    // Listen for our centralized count update event
    window.addEventListener(NOTIFICATION_COUNT_EVENT, handleCountUpdate);

    // Also keep backward compatibility with existing events
    window.addEventListener(
      'notification-count-updated',
      (event: CustomEvent) => {
        if (event.detail && event.detail.unreadCount !== undefined) {
          updateUnreadCount(event.detail.unreadCount);
        }
      }
    );

    // Also listen for general notifications updates
    window.addEventListener('notifications-updated', () => {
      // If context is available, sync with it
      if (
        notificationsContext &&
        typeof notificationsContext.unreadCount === 'number'
      ) {
        updateUnreadCount(notificationsContext.unreadCount);
      }
    });

    return () => {
      window.removeEventListener(NOTIFICATION_COUNT_EVENT, handleCountUpdate);
      window.removeEventListener(
        'notification-count-updated',
        handleCountUpdate
      );
      window.removeEventListener('notifications-updated', handleCountUpdate);
    };
  }, [updateUnreadCount, notificationsContext]);

  // Socket events handler - simplified for clarity
  useEffect(() => {
    let socket;
    try {
      const { useSocket } = require('@/contexts/SocketContext');
      const socketContext = useSocket();
      socket = socketContext?.socket;

      if (socket && socketContext?.isConnected) {
        // Immediate request for notification count when socket connects
        socket.emit(
          'get_notification_count',
          { userId: user?._id },
          response => {
            if (response?.success && typeof response.unreadCount === 'number') {
              updateUnreadCount(response.unreadCount);
            }
          }
        );

        // Listen for updates
        const handleNewNotification = data => {
          if (data?.notification && !data.notification.isRead) {
            setUnreadCount(prev => prev + 1);
            setAnimate(true);
            setTimeout(() => setAnimate(false), 1000);
          }
        };

        socket.on('new_notification', handleNewNotification);
        socket.on('notification_count_update', data => {
          if (data && typeof data.unreadCount === 'number') {
            updateUnreadCount(data.unreadCount);
          }
        });

        return () => {
          socket.off('new_notification', handleNewNotification);
          socket.off('notification_count_update');
        };
      }
    } catch (error) {
      // Socket not available
    }
  }, [user?._id, updateUnreadCount]);

  const handleNotificationClick = useCallback(
    e => {
      e.preventDefault();
      router.push('/notifications');
    },
    [router]
  );

  // For debugging - add this console.log
  useEffect(() => {
    console.log('Current unread count:', unreadCount);
  }, [unreadCount]);

  return (
    <div
      className="relative cursor-pointer"
      onClick={handleNotificationClick}
      aria-label="View notifications"
    >
      <button
        type="button"
        className="justify-center shrink-0 flex items-center font-semibold
          transition-all duration-200 ease-in-out select-none
          disabled:opacity-50 disabled:cursor-not-allowed
          gap-x-1 text-sm leading-5 rounded-xl
          h-8 w-8
          bg-gray-100 hover:bg-gray-200
          border border-[hsl(var(--border))]
          active:bg-gray-300 active:scale-95
          dark:bg-input hover:dark:bg-[#505050]
          dark:active:bg-gray-600
          shadow-sm hover:shadow-md
          active:shadow-inner
          text-gray-700 dark:text-gray-200
          motion"
        aria-label="View notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={22}
          height={22}
          className="text-black dark:text-white/50"
          fill="none"
        >
          <path
            d="M2.52992 14.394C2.31727 15.7471 3.268 16.6862 4.43205 17.1542C8.89481 18.9486 15.1052 18.9486 19.5679 17.1542C20.732 16.6862 21.6827 15.7471 21.4701 14.394C21.3394 13.5625 20.6932 12.8701 20.2144 12.194C19.5873 11.2975 19.525 10.3197 19.5249 9.27941C19.5249 5.2591 16.1559 2 12 2C7.84413 2 4.47513 5.2591 4.47513 9.27941C4.47503 10.3197 4.41272 11.2975 3.78561 12.194C3.30684 12.8701 2.66061 13.5625 2.52992 14.394Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 21C9.79613 21.6219 10.8475 22 12 22C13.1525 22 14.2039 21.6219 15 21"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {unreadCount > 0 && (
        <Badge
          variant="secondary"
          className={`absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 
          text-xs font-bold rounded-full border-2 dark:border-[#333333] 
          bg-red-500 text-white ${animate ? 'animate-pulse' : ''}`}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </div>
  );
};

export default NotificationIcon;
