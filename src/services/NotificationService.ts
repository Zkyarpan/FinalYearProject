'use client';

/**
 * NotificationService.ts
 * A service layer to handle communication with the notification API
 */
import { toast } from 'sonner';

/**
 * Handles fetching, marking as read, and deleting notifications
 * Provides a consistent interface for the notification context
 */
export class NotificationService {
  /**
   * Fetch notifications from the API
   * @param limit Maximum number of notifications to fetch
   * @param skip Number of notifications to skip (for pagination)
   * @param onlyUnread Whether to fetch only unread notifications
   */
  static async fetchNotifications(limit = 30, skip = 0, onlyUnread = false) {
    try {
      const response = await fetch(
        `/api/notifications?limit=${limit}&skip=${skip}${
          onlyUnread ? '&unread=true' : ''
        }`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.IsSuccess) {
        throw new Error(data.ErrorMessage || 'Failed to fetch notifications');
      }

      return {
        success: true,
        notifications: data.Result.notifications,
        unreadCount: data.Result.unreadCount,
        totalCount: data.Result.totalCount,
        pagination: data.Result.pagination,
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch notifications',
      };
    }
  }

  /**
   * Mark a notification as read
   * @param notificationId ID of the notification to mark as read
   */
  static async markAsRead(notificationId) {
    try {
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

      return {
        success: true,
        message: data.Result.message,
        notification: data.Result.notification,
      };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: error.message || 'Failed to mark notification as read',
      };
    }
  }

  /**
   * Mark all notifications as read
   * @param notificationIds Optional array of specific notification IDs to mark as read
   * (API doesn't support this directly, so we handle it client-side)
   */
  static async markAllAsRead(notificationIds: string[] | null = null) {
    // If specific IDs are provided, mark them individually
    if (notificationIds && notificationIds.length > 0) {
      let successCount = 0;
      let failCount = 0;

      for (const id of notificationIds) {
        const result = await this.markAsRead(id);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      return {
        success: true,
        message: `Marked ${successCount} notifications as read${
          failCount > 0 ? ` (${failCount} failed)` : ''
        }`,
        modifiedCount: successCount,
      };
    }

    // Otherwise mark all as read using the API
    try {
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

      if (!data.IsSuccess) {
        throw new Error(
          data.ErrorMessage || 'Failed to mark all notifications as read'
        );
      }

      return {
        success: true,
        message: data.Result.message,
        modifiedCount: data.Result.modifiedCount,
      };
    } catch (error) {
      console.error('Error marking all as read:', error);
      return {
        success: false,
        error: error.message || 'Failed to mark all notifications as read',
      };
    }
  }

  /**
   * Delete a notification
   * @param notificationId ID of the notification to delete
   */
  static async deleteNotification(notificationId) {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.IsSuccess) {
        throw new Error(data.ErrorMessage || 'Failed to delete notification');
      }

      return {
        success: true,
        message: data.Result.message,
      };
    } catch (error) {
      console.error('Error deleting notification:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete notification',
      };
    }
  }

  /**
   * Delete all notifications
   * @param readOnly Whether to delete only read notifications (not supported by API directly)
   */
  static async deleteAllNotifications(readOnly = false) {
    // Current API doesn't support deleting only read notifications
    // We'll need to handle this client-side
    if (readOnly) {
      return {
        success: false,
        error: 'Deleting only read notifications is not supported by the API',
      };
    }

    try {
      const response = await fetch('/api/notifications?all=true', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.IsSuccess) {
        throw new Error(
          data.ErrorMessage || 'Failed to delete all notifications'
        );
      }

      return {
        success: true,
        message: data.Result.message,
        deletedCount: data.Result.deletedCount,
      };
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete all notifications',
      };
    }
  }

  /**
   * Add roles to notification objects client-side
   * @param notifications Array of notification objects
   * @returns Notifications with role assignments based on notification type
   */
  static assignRolesToNotifications(notifications) {
    return notifications.map(notification => {
      // Clone the notification to avoid modifying the original
      const notificationWithRoles = { ...notification };

      // Assign roles based on notification type or meta
      const type = notification.meta?.type || notification.type;

      switch (type) {
        case 'new_booking':
        case 'booking_confirmed':
          // Assign to psychologists and the specific patient
          notificationWithRoles.roles = ['admin', 'psychologist'];
          break;

        case 'appointment_reminder':
          // Appointment reminders are for patients
          notificationWithRoles.roles = ['admin', 'patient'];
          break;

        case 'availability_change':
          // Availability changes are visible to patients
          notificationWithRoles.roles = ['admin', 'patient'];
          break;

        case 'status_change':
          // Status changes are visible to both parties
          notificationWithRoles.roles = ['admin', 'psychologist', 'patient'];
          break;

        case 'system':
          // System notifications for everyone
          notificationWithRoles.roles = ['admin', 'psychologist', 'patient'];
          break;

        case 'message':
        case 'conversation':
          // Messages visible to both sender and receiver
          notificationWithRoles.roles = ['admin', 'psychologist', 'patient'];
          break;

        default:
          // By default, show to everyone
          notificationWithRoles.roles = ['admin', 'psychologist', 'patient'];
      }

      return notificationWithRoles;
    });
  }
}
