'use client';

import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Calendar,
  Clock,
  RefreshCw,
  Trash2,
  CheckCircle,
  X,
  Filter,
  AlertTriangle,
  User,
  Video,
  Phone,
  DollarSign,
  Search,
  Inbox,
  ChevronRight,
  CalendarClock,
  Info,
  MoreHorizontal,
  CheckCheck,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import { format, formatDistanceToNow } from 'date-fns';
import { updateGlobalNotificationCount } from '@/components/notifications/NotificationIcon';

// Appointment notification with updated dark theme styling
const AppointmentNotification = ({ notification, onDelete, onClick }) => {
  const router = useRouter();
  const { user } = useUserStore() || {};

  // Extract data from notification meta
  const meta = notification?.meta || {};
  const appointmentId = meta.appointmentId || meta.relatedId;
  const appointmentDetails = meta.appointmentDetails || {};
  const psychologistInfo = meta.psychologistInfo || {};

  // Get date and time info
  const dateTime = meta.dateTime || appointmentDetails.dateTime;
  const endTime = meta.endTime || appointmentDetails.endTime;
  const sessionFormat =
    meta.sessionFormat || appointmentDetails.sessionFormat || 'video';

  // Format date and time
  const formattedDate = dateTime
    ? format(new Date(dateTime), 'EEEE, MMMM d, yyyy')
    : 'Date not available';
  const formattedStartTime = dateTime
    ? format(new Date(dateTime), 'h:mm a')
    : '';
  const formattedEndTime = endTime ? format(new Date(endTime), 'h:mm a') : '';

  // Handle view appointment
  const handleViewAppointment = e => {
    e.stopPropagation();
    const path = user?.role === 'psychologist' ? `/sessions` : `/sessions`;
    router.push(path);
  };

  // Determine the format icon
  const getFormatIcon = () => {
    return sessionFormat === 'video' ? (
      <Video className="h-4 w-4" />
    ) : (
      <Phone className="h-4 w-4" />
    );
  };

  return (
    <div
      className="mb-3 p-4 rounded-lg bg-card border dark:border-[#333333] cursor-pointer relative"
      onClick={() => onClick(notification)}
    >
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-700"
          onClick={e => {
            e.stopPropagation();
            onDelete(notification._id);
          }}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-900 text-indigo-300 flex-shrink-0">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center">
            <h3 className="font-medium text-slate-200">{notification.title}</h3>
            {!notification.isRead && (
              <Badge className="ml-2 text-xs bg-indigo-500 hover:bg-indigo-600">
                New
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-3 gap-x-4 my-2">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
            <AvatarFallback className="bg-indigo-900 text-indigo-200 text-sm">
              {psychologistInfo?.name?.charAt(0) || 'P'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Provider</p>
            <p className="text-sm font-medium text-slate-200 truncate">
              {psychologistInfo?.name || 'Your Provider'}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-900 text-indigo-300 mr-2 flex-shrink-0">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Date</p>
            <p className="text-sm font-medium text-slate-200 truncate">
              {formattedDate}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-900 text-indigo-300 mr-2 flex-shrink-0">
            <Clock className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Time</p>
            <p className="text-sm font-medium text-slate-200 truncate">
              {formattedStartTime} - {formattedEndTime}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-900 text-indigo-300 mr-2 flex-shrink-0">
            {getFormatIcon()}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-400">Format</p>
            <p className="text-sm font-medium text-slate-200 capitalize truncate">
              {sessionFormat} Session
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <Button
          variant="default"
          size="sm"
          onClick={handleViewAppointment}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          View Appointment
          <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      </div>

      {!notification.isRead && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
      )}
    </div>
  );
};

// Availability notification with updated dark theme styling
const AvailabilityNotification = ({ notification, onDelete, onClick }) => {
  const router = useRouter();
  const { user } = useUserStore() || {};

  const meta = notification?.meta || {};
  const psychologistName = meta.psychologistName || 'Your provider';
  const isSelfChange = meta.type === 'availability_self_change';

  // Handle book appointment
  const handleAction = e => {
    e.stopPropagation();
    const path = isSelfChange ? '/dashboard/availability' : '/appointments';
    router.push(path);
  };

  return (
    <div
      className="mb-3 p-4 rounded-lg bg-card cursor-pointer relative border dark:border-[#333333]"
      onClick={() => onClick(notification)}
    >
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-700"
          onClick={e => {
            e.stopPropagation();
            onDelete(notification._id);
          }}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-900 text-emerald-300 flex-shrink-0">
          <CalendarClock className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center">
            <h3 className="font-medium text-slate-200">{notification.title}</h3>
            {!notification.isRead && (
              <Badge className="ml-2 text-xs bg-emerald-500 hover:bg-emerald-600">
                New
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>

      <div className="pl-1 pr-8">
        <p className="text-sm text-slate-200">{notification.content}</p>
      </div>

      {!isSelfChange && (
        <div className="mt-3 flex justify-end">
          <Button
            variant="default"
            size="sm"
            onClick={handleAction}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Book Appointment
            <ChevronRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      )}

      {!notification.isRead && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
      )}
    </div>
  );
};

// System notification with updated dark theme styling
const SystemNotification = ({ notification, onDelete, onClick }) => {
  return (
    <div
      className="mb-3 p-4 rounded-lg bg-card border dark:border-[#333333] cursor-pointer relative "
      onClick={() => onClick(notification)}
    >
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-700"
          onClick={e => {
            e.stopPropagation();
            onDelete(notification._id);
          }}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-900 text-amber-300 flex-shrink-0">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center">
            <h3 className="font-medium text-slate-200">{notification.title}</h3>
            {!notification.isRead && (
              <Badge className="ml-2 text-xs bg-amber-500 hover:bg-amber-600">
                New
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>

      <div className="pl-1 pr-8">
        <p className="text-sm text-slate-200">{notification.content}</p>
      </div>

      {!notification.isRead && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
      )}
    </div>
  );
};

// Default notification with updated dark theme styling
const DefaultNotification = ({ notification, onDelete, onClick }) => {
  return (
    <div
      className="mb-3 p-4 rounded-lg bg-card border dark:border-[#333333] cursor-pointer relative"
      onClick={() => onClick(notification)}
    >
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-700"
          onClick={e => {
            e.stopPropagation();
            onDelete(notification._id);
          }}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>

      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-900 text-blue-300 flex-shrink-0">
          <Bell className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center">
            <h3 className="font-medium text-slate-200">{notification.title}</h3>
            {!notification.isRead && (
              <Badge className="ml-2 text-xs bg-blue-500 hover:bg-blue-600">
                New
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>

      <div className="pl-1 pr-8">
        <p className="text-sm text-slate-200">{notification.content}</p>
      </div>

      {!notification.isRead && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
      )}
    </div>
  );
};

const NotificationsPage = () => {
  const {
    notifications = [],
    unreadCount = 0,
    isLoading = false,
    pagination = { hasMore: false },
    fetchNotifications = async () => {},
    loadMore = async () => {},
    markAsRead = async () => {},
    markAllAsRead = async () => {},
    deleteNotification = async () => {},
    deleteAllRead = async () => {},
  } = useNotifications() || {};

  const { user } = useUserStore() || {};
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchNotifications(true);
      setLoading(false);
    };

    loadData();

    // Update global notification count
    if (typeof unreadCount === 'number') {
      updateGlobalNotificationCount(unreadCount);
    }
  }, [fetchNotifications, unreadCount]);

  // Get filtered notifications with stricter type checking
  const filteredNotifications = React.useMemo(() => {
    if (!notifications || !Array.isArray(notifications)) return [];

    let filtered = [...notifications];

    // Filter by tab
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (activeTab === 'appointments') {
      filtered = filtered.filter(n => {
        const type = n.meta?.type || n.type;
        return (
          type === 'appointment' ||
          type === 'new_booking' ||
          type === 'booking_confirmed' ||
          n.relatedModel === 'Appointment'
        );
      });
    } else if (activeTab === 'availability') {
      filtered = filtered.filter(n => {
        const type = n.meta?.type || n.type;
        return (
          type === 'availability_change' || type === 'availability_self_change'
        );
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        n =>
          (n.title && n.title.toLowerCase().includes(query)) ||
          (n.content && n.content.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [notifications, activeTab, searchQuery]);

  // Handle notification click
  const handleNotificationClick = notification => {
    if (!notification) return;

    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Determine where to navigate based on notification type
    const type = notification.meta?.type || notification.type;

    if (
      notification.relatedModel === 'Appointment' ||
      type === 'new_booking' ||
      type === 'booking_confirmed'
    ) {
      const appointmentId =
        notification.relatedId || notification.meta?.appointmentId;
      if (appointmentId) {
        const path =
          user?.role === 'psychologist'
            ? `/dashboard/appointments/${appointmentId}`
            : `/appointments/${appointmentId}`;
        router.push(path);
      }
    } else if (type === 'availability_change') {
      const path =
        user?.role === 'psychologist'
          ? '/dashboard/availability'
          : '/appointments/book';
      router.push(path);
    }
  };

  // Refresh notifications
  const handleRefresh = async () => {
    setLoading(true);
    await fetchNotifications(true);
    setLoading(false);
  };

  // Render a notification based on its type
  const renderNotification = notification => {
    const type = notification.meta?.type || notification.type;

    // Appointment notifications
    if (
      type === 'new_booking' ||
      type === 'booking_confirmed' ||
      type === 'appointment' ||
      notification.relatedModel === 'Appointment'
    ) {
      return (
        <AppointmentNotification
          key={notification._id}
          notification={notification}
          onDelete={deleteNotification}
          onClick={handleNotificationClick}
        />
      );
    }

    // Availability notifications
    if (type === 'availability_change' || type === 'availability_self_change') {
      return (
        <AvailabilityNotification
          key={notification._id}
          notification={notification}
          onDelete={deleteNotification}
          onClick={handleNotificationClick}
        />
      );
    }

    // System notifications
    if (type === 'system') {
      return (
        <SystemNotification
          key={notification._id}
          notification={notification}
          onDelete={deleteNotification}
          onClick={handleNotificationClick}
        />
      );
    }

    // Default notification
    return (
      <DefaultNotification
        key={notification._id}
        notification={notification}
        onDelete={deleteNotification}
        onClick={handleNotificationClick}
      />
    );
  };

  // Simplified EmptyState component
  const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center rounded-lg dark:bg-card border  dark:border-[#333333] p-8 mt-2">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 mb-4">
        <Bell className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-medium mb-2 text-center text-slate-200">
        No notifications
      </h3>
      <p className="text-sm text-slate-400 max-w-sm text-center">{message}</p>
    </div>
  );

  // Loading skeleton with dark theme
  const LoadingSkeleton = () => (
    <div className="space-y-3 mt-2">
      {[1, 2, 3].map(i => (
        <div
          key={i}
          className="p-4 bg-card border dark:border-[#333333] rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full " />
              <div>
                <Skeleton className="h-5 w-40 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <Skeleton className="h-24 w-full rounded-lg mt-3" />
          <div className="flex justify-end mt-3">
            <Skeleton className="h-8 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  // Count notifications by type for badges
  const appointmentCount = notifications.filter(n => {
    const type = n.meta?.type || n.type;
    return (
      type === 'appointment' ||
      type === 'new_booking' ||
      type === 'booking_confirmed' ||
      n.relatedModel === 'Appointment'
    );
  }).length;

  const availabilityCount = notifications.filter(n => {
    const type = n.meta?.type || n.type;
    return (
      type === 'availability_change' || type === 'availability_self_change'
    );
  }).length;

  return (
    <div className="h-screen flex flex-col">
      {/* Top header - Fixed */}
      <div className="p-4 pb-0">
        <div className="flex flex-row justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              <p className="text-sm">
                You have {unreadCount} unread notification
                {unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="default"
              size="sm"
              className="gap-1 text-slate-200 border-slate-700"
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </Button>

            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="default"
                size="sm"
                className="gap-1 text-slate-200 border-slate-700"
              >
                <CheckCheck className="h-4 w-4" />
                <span>Mark all read</span>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1 text-slate-200 border-slate-700"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span>More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48 bg-slate-900 border-slate-700"
              >
                <DropdownMenuItem
                  onClick={() => setIsFiltering(!isFiltering)}
                  className="gap-2 text-slate-200 focus:bg-slate-800"
                >
                  <Search className="h-4 w-4" />
                  {isFiltering ? 'Hide search' : 'Search'}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={deleteAllRead}
                  className="gap-2 text-slate-200 focus:bg-slate-800"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear read notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search input */}
        {isFiltering && (
          <div className="mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-slate-800 border-slate-700 text-slate-200"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-7 w-7 text-slate-400 hover:text-slate-200"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tab navigation - Fixed */}
        <div className="mt-4">
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="bg-slate-800 grid grid-cols-4 h-10 rounded-md w-full">
              <TabsTrigger value="all" className="">
                All
                <Badge
                  variant="secondary"
                  className="ml-1.5 text-xs bg-slate-700 text-slate-200"
                >
                  {notifications.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                <Badge
                  variant="secondary"
                  className="ml-1.5 text-xs bg-blue-900 text-blue-200"
                >
                  {unreadCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="appointments">
                Appointments
                <Badge
                  variant="secondary"
                  className="ml-1.5 text-xs bg-indigo-900 text-indigo-200"
                >
                  {appointmentCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="availability">
                Availability
                <Badge
                  variant="secondary"
                  className="ml-1.5 text-xs bg-emerald-900 text-emerald-200"
                >
                  {availabilityCount}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Notifications content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4 mt-2">
        {loading ? (
          <LoadingSkeleton />
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            message={
              searchQuery
                ? 'No results found. Try adjusting your search.'
                : activeTab === 'all'
                ? "You're all caught up! New notifications will appear here."
                : activeTab === 'unread'
                ? 'You have no unread notifications.'
                : activeTab === 'appointments'
                ? 'You have no appointment notifications.'
                : 'You have no availability notifications.'
            }
          />
        ) : (
          <div>
            {filteredNotifications.map(notification =>
              renderNotification(notification)
            )}

            {pagination.hasMore && (
              <div className="flex justify-center mt-4 mb-8">
                <Button
                  variant="default"
                  className="w-full max-w-md"
                  onClick={loadMore}
                >
                  Load more
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
