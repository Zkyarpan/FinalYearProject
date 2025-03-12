'use client';

import React, { useState, useEffect } from 'react';
import {
  useNotifications,
  Notification as AppNotification,
} from '@/contexts/NotificationContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, X, Calendar, Clock } from 'lucide-react';
import { format, isToday, isTomorrow } from 'date-fns';

export const AvailabilitySelfNotification = () => {
  const { notifications } = useNotifications();
  const [showAlert, setShowAlert] = useState(false);
  const [latestUpdate, setLatestUpdate] = useState<AppNotification | null>(
    null
  );
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    // Find the most recent self-availability notification
    const selfNotification = notifications
      .filter(n => n.meta?.type === 'availability_self_change')
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];

    if (selfNotification) {
      // Show notification if it's less than 30 minutes old (more persistent)
      const timestamp = new Date(selfNotification.createdAt);
      const now = new Date();
      const isRecent = now.getTime() - timestamp.getTime() < 30 * 60 * 1000; // 30 minutes

      if (isRecent) {
        setLatestUpdate(selfNotification);
        setShowAlert(true);
        setShowSummary(true);

        // Auto-hide the alert after 15 seconds, but keep the summary badge
        const timer = setTimeout(() => {
          setShowAlert(false);
        }, 15000);

        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  // Format dates for display
  const formatDateForDisplay = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isToday(date)) {
        return 'Today';
      } else if (isTomorrow(date)) {
        return 'Tomorrow';
      }
      return format(date, 'EEE, MMM d');
    } catch (e) {
      return dateString;
    }
  };

  // Get formatted availability times from metadata if available
  const getAvailabilitySummary = () => {
    if (!latestUpdate || !latestUpdate.meta) return null;

    const { slots = [], dayRange = [] } = latestUpdate.meta;

    if (slots && slots.length > 0) {
      // Show first slot as an example
      const firstSlot = slots[0];
      return `${formatDateForDisplay(firstSlot.date)}: ${
        firstSlot.startTime
      } - ${firstSlot.endTime}${
        slots.length > 1 ? ` and ${slots.length - 1} more` : ''
      }`;
    } else if (dayRange && dayRange.length > 0) {
      return `${formatDateForDisplay(dayRange[0])} to ${formatDateForDisplay(
        dayRange[dayRange.length - 1]
      )}`;
    } else {
      return 'New availability added';
    }
  };

  return (
    <>
      {showAlert && latestUpdate && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 mb-4 p-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-2" />
            <div className="flex-1">
              <AlertTitle className="text-green-800 dark:text-green-300 text-lg mb-1">
                Availability Updated Successfully
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                <p className="mb-2">
                  Your availability schedule has been updated and is now visible
                  to clients.
                </p>
                {getAvailabilitySummary() && (
                  <div className="flex items-center gap-2 mt-2 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">
                      {getAvailabilitySummary()}
                    </span>
                  </div>
                )}
              </AlertDescription>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 ml-2"
              onClick={() => setShowAlert(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </Alert>
      )}

      {/* Persistent Badge - shows for 30 minutes after setting availability */}
      {showSummary && !showAlert && latestUpdate && (
        <div className="flex items-center mb-4">
          <Badge
            variant="outline"
            className="bg-green-50 border-green-200 text-green-700 hover:text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 px-3 py-1.5 gap-1.5 cursor-pointer"
            onClick={() => setShowAlert(true)}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Availability updated {formatDateForDisplay(latestUpdate.createdAt)}
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 ml-2 text-green-700 hover:text-green-900 dark:text-green-300"
              onClick={e => {
                e.stopPropagation();
                setShowSummary(false);
              }}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </Badge>
        </div>
      )}
    </>
  );
};
