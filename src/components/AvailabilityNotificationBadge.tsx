'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Bell } from 'lucide-react';
import { format } from 'date-fns';

// Component to display availability notification badges in the appointment section
export const AvailabilityNotificationBadge = () => {
  const { notifications, markAsRead } = useNotifications();
  const [newAvailability, setNewAvailability] = useState<{
    count: number;
    psychologists: { id: string; name: string }[];
    timestamp: string | undefined;
  }>({
    count: 0,
    psychologists: [],
    timestamp: undefined,
  });

  // Filter notifications to find availability update notifications
  useEffect(() => {
    const availabilityNotifications = notifications.filter(
      notification =>
        notification.meta?.type === 'availability_change' &&
        !notification.isRead
    );

    // Create unique list of psychologists who updated availability
    const psychologistMap = new Map();
    let latestTimestamp = '';

    availabilityNotifications.forEach(notification => {
      const psychId = notification.meta?.psychologistId;
      const psychName =
        notification.meta?.psychologistName ||
        notification.title?.split(' ')[0] ||
        'A provider';

      if (psychId && !psychologistMap.has(psychId)) {
        psychologistMap.set(psychId, psychName);
      }

      // Track the most recent timestamp
      const timestamp = notification.createdAt;
      if (
        !latestTimestamp ||
        (timestamp && new Date(timestamp) > new Date(latestTimestamp))
      ) {
        latestTimestamp = timestamp;
      }
    });

    const psychologists = Array.from(psychologistMap.entries()).map(
      ([id, name]) => ({ id, name })
    );

    setNewAvailability({
      count: availabilityNotifications.length,
      psychologists,
      timestamp: latestTimestamp,
    });
  }, [notifications]);

  // Format the timestamp to display how recently availability was updated
  const timeAgo = useMemo(() => {
    if (!newAvailability.timestamp) return '';

    try {
      const date = new Date(newAvailability.timestamp);

      // If less than 24 hours ago, show relative time
      const now = new Date();
      const diffHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      );

      if (diffHours < 1) {
        return 'just now';
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      } else {
        return format(date, 'MMM dd');
      }
    } catch (e) {
      return '';
    }
  }, [newAvailability.timestamp]);

  // Handle marking notifications as read
  const handleMarkRead = () => {
    // Find all availability notifications and mark them as read
    notifications
      .filter(
        notification =>
          notification.meta?.type === 'availability_change' &&
          !notification.isRead
      )
      .forEach(notification => {
        markAsRead(notification._id);
      });
  };

  if (newAvailability.count === 0) return null;

  return (
    <div
      className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-md cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors mb-4"
      onClick={handleMarkRead}
    >
      <div className="relative">
        <CalendarIcon className="h-5 w-5 text-blue-500" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </span>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
          New availability from{' '}
          {newAvailability.psychologists.map(p => p.name).join(', ')}
          {newAvailability.timestamp && (
            <span className="ml-2 text-xs text-blue-600 dark:text-blue-300">
              {timeAgo}
            </span>
          )}
        </p>
      </div>
      <Badge className="bg-blue-500 text-white">{newAvailability.count}</Badge>
    </div>
  );
};

// Enhanced badge component for time period tabs
export const TimePeriodBadge = ({
  periodKey,
  newAvailabilityData,
  availableSlots,
}: {
  periodKey: string;
  newAvailabilityData: any;
  availableSlots: any[];
}) => {
  // Count new slots in this time period
  const newSlotsCount = useMemo(() => {
    if (!newAvailabilityData || !availableSlots?.length) return 0;

    return availableSlots.filter(slot => {
      if (slot.extendedProps?.isBooked) return false;
      if (
        slot.extendedProps?.psychologistId !==
        newAvailabilityData.psychologistId
      )
        return false;

      // Check if the slot belongs to this time period
      const slotTime = new Date(slot.start).getHours();

      switch (periodKey) {
        case 'MORNING':
          return slotTime >= 0 && slotTime < 12;
        case 'AFTERNOON':
          return slotTime >= 12 && slotTime < 17;
        case 'EVENING':
          return slotTime >= 17 && slotTime < 21;
        case 'NIGHT':
          return slotTime >= 21;
        default:
          return false;
      }
    }).length;
  }, [newAvailabilityData, availableSlots, periodKey]);

  if (newSlotsCount === 0) return null;

  return (
    <Badge
      variant="default"
      className="bg-blue-500 hover:bg-blue-500/90 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-medium"
    >
      {newSlotsCount}
    </Badge>
  );
};

// Component to show alert when new availability is added
export const NewAvailabilityAlert = ({
  newAvailabilityData,
  onDismiss,
}: {
  newAvailabilityData: any;
  onDismiss: () => void;
}) => {
  if (!newAvailabilityData) return null;

  return (
    <div className="flex items-center justify-between mb-4 p-3 bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 rounded-md">
      <div className="flex items-center">
        <CalendarIcon className="h-5 w-5 text-green-500 mr-3" />
        <div>
          <p className="text-sm font-medium text-green-800 dark:text-green-200">
            <span className="font-semibold">New availability!</span>{' '}
            {newAvailabilityData.psychologistName || 'A provider'} recently
            updated their availability
          </p>
          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
            New slots are highlighted in the calendar
          </p>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
      >
        <span className="sr-only">Dismiss</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
};
