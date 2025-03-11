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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, formatDistanceToNow } from 'date-fns';
import { updateGlobalNotificationCount } from '@/components/notifications/NotificationIcon';

// BookedAppointmentNotification component to render rich appointment notifications
const BookedAppointmentNotification = ({ notification, onDelete, onClick }) => {
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
    const path =
      user?.role === 'psychologist'
        ? `/dashboard/appointments/${appointmentId}`
        : `/appointments/${appointmentId}`;
    router.push(path);
  };

  return (
    <Card
      className={`relative p-4 hover:bg-accent/5 transition-colors cursor-pointer
      ${!notification.isRead ? 'border-l-4 border-blue-500' : ''}
      bg-blue-50/30 dark:bg-blue-900/10
    `}
      onClick={() => onClick(notification)}
    >
      <div className="flex gap-4">
        <Avatar className="h-12 w-12 border border-blue-200 dark:border-blue-800">
          <AvatarImage
            src={psychologistInfo?.profilePhoto}
            alt={psychologistInfo?.name || 'Provider'}
          />
          <AvatarFallback className="bg-blue-100 text-blue-700">
            {psychologistInfo?.name?.charAt(0) || 'P'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold text-base">
                {notification.title}
                {!notification.isRead && (
                  <Badge variant="default" className="ml-2 text-xs">
                    New
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={e => {
                e.stopPropagation();
                onDelete(notification._id);
              }}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>

          <div className="mt-3 space-y-2">
            {/* Provider info */}
            {psychologistInfo?.name && (
              <div className="flex items-center text-sm gap-2">
                <User className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{psychologistInfo.name}</span>
              </div>
            )}

            {/* Date and time */}
            {dateTime && (
              <div className="flex items-center text-sm gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span>{formattedDate}</span>
              </div>
            )}

            {/* Time */}
            {dateTime && (
              <div className="flex items-center text-sm gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>
                  {formattedStartTime} - {formattedEndTime}
                </span>
              </div>
            )}

            {/* Session format */}
            <div className="flex items-center text-sm gap-2">
              {sessionFormat === 'video' ? (
                <Video className="h-4 w-4 text-blue-500" />
              ) : (
                <Phone className="h-4 w-4 text-blue-500" />
              )}
              <span className="capitalize">{sessionFormat} Session</span>
            </div>

            {/* Session fee */}
            {psychologistInfo?.sessionFee && (
              <div className="flex items-center text-sm gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <span>${psychologistInfo.sessionFee}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              variant="default"
              size="sm"
              onClick={handleViewAppointment}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              View Appointment
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// AvailabilityNotification component to render availability change notifications
const AvailabilityNotification = ({ notification, onDelete, onClick }) => {
  const router = useRouter();
  const { user } = useUserStore() || {};

  const meta = notification?.meta || {};
  const psychologistName = meta.psychologistName || 'Your provider';
  const isSelfChange = meta.type === 'availability_self_change';

  // Handle book appointment
  const handleAction = e => {
    e.stopPropagation();
    const path = isSelfChange
      ? '/dashboard/availability'
      : '/appointments/book';
    router.push(path);
  };

  return (
    <Card
      className={`relative p-3 hover:bg-accent/5 transition-colors cursor-pointer
      ${!notification.isRead ? 'border-l-4 border-l-emerald-500' : ''}
      bg-emerald-50/30 dark:bg-emerald-900/10
    `}
      onClick={() => onClick(notification)}
    >
      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-emerald-100">
              <Clock className="h-4 w-4 text-emerald-700" />
            </div>
            <div className="font-medium text-sm">
              {notification.title}
              {!notification.isRead && (
                <Badge
                  variant="default"
                  className="ml-2 text-xs bg-emerald-500"
                >
                  New
                </Badge>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-50 hover:opacity-100"
            onClick={e => {
              e.stopPropagation();
              onDelete(notification._id);
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>

        <div className="pl-12 pr-2">
          <p className="text-sm mb-3">{notification.content}</p>

          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            {!isSelfChange && (
              <Button
                variant="default"
                size="sm"
                onClick={handleAction}
                className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700"
              >
                Book Appointment
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// SystemNotification component for generic notifications
const SystemNotification = ({ notification, onDelete, onClick }) => {
  return (
    <Card
      className={`relative p-3 hover:bg-accent/5 transition-colors cursor-pointer
      ${!notification.isRead ? 'border-l-4 border-l-amber-500' : ''}
    `}
      onClick={() => onClick(notification)}
    >
      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-amber-100">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
            </div>
            <div className="font-medium text-sm">
              {notification.title}
              {!notification.isRead && (
                <Badge variant="default" className="ml-2 text-xs">
                  New
                </Badge>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-50 hover:opacity-100"
            onClick={e => {
              e.stopPropagation();
              onDelete(notification._id);
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>

        <div className="pl-12 pr-2">
          <p className="text-sm mb-3">{notification.content}</p>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </div>
    </Card>
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
        <BookedAppointmentNotification
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

    // Default notification for other types
    return (
      <Card
        key={notification._id}
        className={`relative p-3 hover:bg-accent/5 transition-colors cursor-pointer
          ${!notification.isRead ? 'border-l-4 border-l-primary' : ''}
        `}
        onClick={() => handleNotificationClick(notification)}
      >
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-gray-100">
                <Bell className="h-4 w-4 text-gray-700" />
              </div>
              <div className="font-medium text-sm">
                {notification.title}
                {!notification.isRead && (
                  <Badge variant="default" className="ml-2 text-xs">
                    New
                  </Badge>
                )}
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 opacity-50 hover:opacity-100"
              onClick={e => {
                e.stopPropagation();
                deleteNotification(notification._id);
              }}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>

          <div className="pl-12 pr-2">
            <p className="text-sm mb-3">{notification.content}</p>

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Empty state component
  const EmptyState = ({ message }) => (
    <div className="text-center py-10">
      <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
      <h3 className="text-lg font-medium mb-1">No notifications</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        {message}
      </p>
    </div>
  );

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <Card key={i} className="p-4">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </Card>
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
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl font-semibold">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${
                  unreadCount !== 1 ? 's' : ''
                }`
              : 'All caught up!'}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-9"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-9">
                <Filter className="h-4 w-4 mr-2" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {unreadCount > 0 && (
                <DropdownMenuItem onClick={markAllAsRead}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark all as read
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={deleteAllRead}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear read notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsFiltering(!isFiltering)}>
                <Search className="h-4 w-4 mr-2" />
                {isFiltering ? 'Hide search' : 'Search notifications'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search input */}
      {isFiltering && (
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSearchQuery('');
              setIsFiltering(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Tabs & Content */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4 max-w-[600px]">
          <TabsTrigger value="all">
            All
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="appointments">
            Appointments
            {appointmentCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5">
                {appointmentCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="availability">
            Availability
            {availabilityCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5">
                {availabilityCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <ScrollArea className="h-[calc(100vh-280px)] pr-4">
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
              <div className="space-y-3">
                {filteredNotifications.map(notification =>
                  renderNotification(notification)
                )}

                {pagination.hasMore && (
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={loadMore}
                  >
                    Load more
                  </Button>
                )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsPage;
