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
  Search,
  X,
  Filter,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { updateGlobalNotificationCount } from '@/components/notifications/NotificationIcon';

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

  // Get filtered notifications
  const filteredNotifications = React.useMemo(() => {
    if (!notifications || !Array.isArray(notifications)) return [];

    let filtered = [...notifications];

    // Filter by tab
    if (activeTab === 'unread') {
      filtered = filtered.filter(n => !n.isRead);
    } else if (activeTab === 'appointments') {
      filtered = filtered.filter(
        n =>
          n.type === 'appointment' ||
          (n.meta?.type &&
            ['new_booking', 'booking_confirmed'].includes(n.meta.type))
      );
    } else if (activeTab === 'availability') {
      filtered = filtered.filter(n => n.meta?.type === 'availability_change');
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

  // Get notification icon
  const getIcon = notification => {
    if (!notification) return <Bell className="h-4 w-4" />;

    const type = notification.meta?.type || notification.type;

    switch (type) {
      case 'appointment':
      case 'new_booking':
      case 'booking_confirmed':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'availability_change':
        return <Clock className="h-4 w-4 text-emerald-500" />;
      case 'system':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format time
  const formatTime = dateString => {
    if (!dateString) return 'Just now';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return 'Recently';
    }
  };

  // Handle notification click
  const handleClick = notification => {
    if (!notification) return;

    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    if (notification.relatedModel === 'Appointment' && notification.relatedId) {
      const path =
        user?.role === 'psychologist'
          ? `/dashboard/appointments/${notification.relatedId}`
          : `/appointments/${notification.relatedId}`;
      router.push(path);
    } else if (notification.meta?.type === 'availability_change') {
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

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1 h-7 w-7 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs & Content */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">
            All
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <ScrollArea className="h-[calc(100vh-240px)] pr-4">
            {loading ? (
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
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                <h3 className="text-lg font-medium mb-1">No notifications</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {searchQuery
                    ? 'No results found. Try adjusting your search.'
                    : "You're all caught up! New notifications will appear here."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map(notification => (
                  <Card
                    key={notification._id}
                    className={`relative p-3 hover:bg-accent/5 transition-colors ${
                      !notification.isRead ? 'border-l-4 border-l-primary' : ''
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`p-2 rounded-full bg-accent/10 ${
                              !notification.isRead ? 'bg-primary/10' : ''
                            }`}
                          >
                            {getIcon(notification)}
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

                      <div
                        className="pl-12 pr-2"
                        onClick={() => handleClick(notification)}
                      >
                        <p className="text-sm mb-3">{notification.content}</p>

                        <div className="flex flex-wrap gap-2 items-center justify-between">
                          <div className="flex items-center gap-2">
                            {notification.meta?.type && (
                              <Badge
                                variant="outline"
                                className="text-xs capitalize"
                              >
                                {notification.meta.type.replace(/_/g, ' ')}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatTime(notification.createdAt)}
                            </span>
                          </div>

                          {(notification.relatedModel === 'Appointment' ||
                            notification.meta?.type ===
                              'availability_change') && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                handleClick(notification);
                              }}
                              className="text-xs h-8"
                            >
                              {notification.meta?.type === 'availability_change'
                                ? 'Book Appointment'
                                : 'View Appointment'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

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
