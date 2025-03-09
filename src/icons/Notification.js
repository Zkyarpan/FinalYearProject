'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useNotifications } from '@/contexts/NotificationContext';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';

/**
 * Standalone notification icon component that can be used anywhere in the app
 * Shows a notification badge with unread count
 */
const NotificationIcon = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const [unreadCount, setLocalUnreadCount] = useState(0);

  // Try to use context, but provide fallback if it fails
  const contextData = React.useMemo(() => {
    try {
      return useNotifications();
    } catch (error) {
      console.error('Error accessing notification context:', error);
      return null;
    }
  }, []);

  const {
    unreadCount: contextUnreadCount = 0,
    setIsOpen,
    fetchNotifications,
  } = contextData || {};

  // Sync local unread count with context
  useEffect(() => {
    if (contextUnreadCount !== undefined) {
      setLocalUnreadCount(contextUnreadCount);
    }
  }, [contextUnreadCount]);

  // Fallback to localStorage if context fails
  useEffect(() => {
    if (!contextData && user?._id) {
      try {
        const storedNotifications = localStorage.getItem(
          `notifications_${user._id}`
        );
        if (storedNotifications) {
          const parsed = JSON.parse(storedNotifications);
          const unreadNotifications = parsed.filter(n => !n.isRead);
          setLocalUnreadCount(unreadNotifications.length);
        }
      } catch (error) {
        console.error('Error parsing stored notifications:', error);
      }
    }
  }, [contextData, user?._id]);

  // Listen for notification updates
  useEffect(() => {
    const handleNotificationUpdate = () => {
      // Try to update from context first
      if (contextData) {
        setLocalUnreadCount(contextData.unreadCount || 0);
      }
      // Fallback to localStorage
      else if (user?._id) {
        try {
          const storedNotifications = localStorage.getItem(
            `notifications_${user._id}`
          );
          if (storedNotifications) {
            const parsed = JSON.parse(storedNotifications);
            const unreadNotifications = parsed.filter(n => !n.isRead);
            setLocalUnreadCount(unreadNotifications.length);
          }
        } catch (error) {
          console.error('Error parsing stored notifications:', error);
        }
      }
    };

    // Listen for custom event
    window.addEventListener('notifications-updated', handleNotificationUpdate);

    return () => {
      window.removeEventListener(
        'notifications-updated',
        handleNotificationUpdate
      );
    };
  }, [contextData, user?._id]);

  const handleNotificationClick = e => {
    e.preventDefault();

    // Try to refresh notifications on click
    if (fetchNotifications) {
      fetchNotifications();
    }

    // If on mobile or we have a context setter, open the dropdown
    if (window.innerWidth < 768 || setIsOpen) {
      // Only use dropdown if we're not already on the notifications page
      if (window.location.pathname !== '/notifications') {
        if (setIsOpen) {
          setIsOpen(true);
          return;
        }
      }
    }

    // Default: navigate to notifications page
    router.push('/notifications');
  };

  return (
    <div className="relative">
      <button
        onClick={handleNotificationClick}
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
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center 
          h-5 w-5 min-w-5 
          bg-red-500 
          text-white text-[10px] font-bold 
          rounded-full 
          shadow-sm
          animate-in fade-in duration-300"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );
};

export default NotificationIcon;
