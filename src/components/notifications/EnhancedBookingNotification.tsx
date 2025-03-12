'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  PhoneCall,
  Trash2,
  User,
  Video,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import Phone from '@/icons/Phone';

const EnhancedBookingNotification = ({ notification, onDelete }) => {
  const router = useRouter();
  const { user } = useUserStore() || {};

  // Extract data from notification meta
  const meta = notification?.meta || {};
  const appointmentId = meta.appointmentId || meta.relatedId;
  const appointmentDetails = meta.appointmentDetails || {};
  const psychologistInfo = meta.psychologistInfo || {};

  // Get patient info (can be retrieved from the appointment or set from context)
  const patientInfo = meta.patientInfo || {}; // You'll need to add this to your notification data

  // Get date and time info
  const dateTime = meta.dateTime || appointmentDetails.dateTime;
  const endTime = meta.endTime || appointmentDetails.endTime;
  const sessionFormat =
    meta.sessionFormat || appointmentDetails.sessionFormat || 'video';
  const isUpcoming = dateTime ? new Date(dateTime) > new Date() : false;

  // Format date and time
  const formattedDate = dateTime
    ? format(new Date(dateTime), 'EEEE, MMMM d, yyyy')
    : 'Date not available';
  const formattedStartTime = dateTime
    ? format(new Date(dateTime), 'h:mm a')
    : '';
  const formattedEndTime = endTime ? format(new Date(endTime), 'h:mm a') : '';

  // Calculate time until appointment
  const timeUntil = dateTime
    ? formatDistanceToNow(new Date(dateTime), { addSuffix: true })
    : '';
  const isToday = dateTime
    ? format(new Date(dateTime), 'yyyy-MM-dd') ===
      format(new Date(), 'yyyy-MM-dd')
    : false;

  // Handle view appointment
  const handleViewAppointment = e => {
    e.stopPropagation();
    const path =
      user?.role === 'psychologist'
        ? `/dashboard/appointments/${appointmentId}`
        : `/appointments/${appointmentId}`;
    router.push(path);
  };

  // Handle start session (for upcoming appointments)
  const handleStartSession = e => {
    e.stopPropagation();
    const path = `/session/${appointmentId}`;
    router.push(path);
  };

  // Set notification border and background color based on type
  const getNotificationStyles = () => {
    if (!notification.isRead) {
      return 'border-l-4 border-blue-500 bg-blue-50/30 dark:bg-blue-900/10';
    }

    if (isUpcoming && isToday) {
      return 'border-l-4 border-green-500 bg-green-50/30 dark:bg-green-900/10';
    }

    return 'bg-slate-50/30 dark:bg-slate-900/10';
  };

  return (
    <Card
      className={`relative p-4 hover:bg-accent/5 transition-colors ${getNotificationStyles()}`}
    >
      <div className="flex">
        {/* Left side - Notification type indicator and time */}
        <div className="mr-4 flex flex-col items-center">
          <div
            className={`p-2 rounded-full ${
              isUpcoming && isToday
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {isUpcoming ? (
              <Calendar className="h-5 w-5" />
            ) : (
              <CheckCircle className="h-5 w-5" />
            )}
          </div>
          <div className="h-full w-px bg-gray-200 dark:bg-gray-700 my-2"></div>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-base flex items-center">
                {notification.title}
                {!notification.isRead && (
                  <Badge variant="default" className="ml-2 text-xs">
                    New
                  </Badge>
                )}
                {isUpcoming && isToday && (
                  <Badge
                    variant="outline"
                    className="ml-2 text-xs bg-green-100 text-green-700 border-green-200"
                  >
                    Today
                  </Badge>
                )}
              </h3>
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

          {/* Appointment card with profile images */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-3 mb-3">
            <div className="flex items-center gap-4 mb-4">
              {/* Participants - shows both provider and patient */}
              <div className="flex -space-x-2">
                {/* Provider image */}
                <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-800 ring-2 ring-blue-500">
                  <AvatarImage
                    src={psychologistInfo?.profilePhoto}
                    alt={psychologistInfo?.name || 'Provider'}
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {psychologistInfo?.name?.charAt(0) || 'P'}
                  </AvatarFallback>
                </Avatar>

                {/* Patient image (if available) */}
                <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-800">
                  <AvatarImage
                    src={patientInfo?.profilePhoto}
                    alt={patientInfo?.name || 'Patient'}
                  />
                  <AvatarFallback className="bg-gray-100 text-gray-700">
                    {patientInfo?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex-1">
                <h4 className="font-medium">
                  {isUpcoming ? 'Upcoming Session' : 'Past Session'}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {user?.role === 'psychologist'
                    ? `With ${patientInfo?.name || 'your patient'}`
                    : `With ${psychologistInfo?.name || 'your provider'}`}
                </p>
              </div>

              {/* Session countdown for upcoming sessions */}
              {isUpcoming && (
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {timeUntil}
                  </p>
                </div>
              )}
            </div>

            {/* Appointment details */}
            <div className="grid grid-cols-2 gap-3">
              {/* Provider info - hide if user is the provider */}
              {user?.role !== 'psychologist' && psychologistInfo?.name && (
                <div className="flex items-center text-sm gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  <div>
                    <span className="font-medium">{psychologistInfo.name}</span>
                    {psychologistInfo.specializations &&
                      psychologistInfo.specializations.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {psychologistInfo.specializations
                            .slice(0, 2)
                            .join(', ')}
                        </p>
                      )}
                  </div>
                </div>
              )}

              {/* Date */}
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
                ) : sessionFormat === 'phone' ? (
                  <PhoneCall className="h-4 w-4 text-blue-500" />
                ) : (
                  <MapPin className="h-4 w-4 text-blue-500" />
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
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleViewAppointment}>
              View Details
            </Button>

            {isUpcoming && isToday && dateTime && (
              <Button
                variant="default"
                size="sm"
                onClick={handleStartSession}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {new Date(dateTime).getTime() - new Date().getTime() <
                15 * 60 * 1000 ? (
                  <>
                    <Video className="h-4 w-4 mr-1" />
                    Join Session
                  </>
                ) : (
                  'Prepare for Session'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EnhancedBookingNotification;
