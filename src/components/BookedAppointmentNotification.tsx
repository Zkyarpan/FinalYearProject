'use client';

import React from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  User,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export const BookedAppointmentNotification = ({ notification, onDelete }) => {
  const router = useRouter();
  const { meta } = notification;

  // Extract data from notification meta
  const appointmentId = meta?.appointmentId;
  const appointmentDetails = meta?.appointmentDetails;
  const psychologistInfo = meta?.psychologistInfo;
  const dateTime = meta?.dateTime ? new Date(meta.dateTime) : null;
  const endTime = meta?.endTime ? new Date(meta.endTime) : null;
  const sessionFormat = meta?.sessionFormat || 'video';

  // Format date and time for display
  const dateFormatted = dateTime
    ? format(dateTime, 'EEEE, MMMM d, yyyy')
    : 'Date not available';
  const timeFormatted = dateTime ? format(dateTime, 'h:mm a') : '';
  const endTimeFormatted = endTime ? format(endTime, 'h:mm a') : '';
  const timeAgo = notification.createdAt
    ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })
    : '';

  // Handle view appointment details
  const handleViewAppointment = () => {
    if (appointmentId) {
      router.push(`/appointments/${appointmentId}`);
    }
  };

  return (
    <Card className="mb-4 border-blue-200 dark:border-blue-800 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 border border-blue-100 dark:border-blue-800">
            <AvatarImage
              src={psychologistInfo?.profilePhoto || ''}
              alt={psychologistInfo?.name || 'Provider'}
            />
            <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
              {psychologistInfo?.name?.charAt(0) || 'P'}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg font-semibold text-blue-700 dark:text-blue-300">
              {notification.meta?.type === 'new_booking'
                ? 'New Appointment Booked'
                : 'Appointment Confirmed'}
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {timeAgo}
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
        >
          {notification.meta?.type === 'new_booking'
            ? 'New Booking'
            : 'Booking Confirmed'}
        </Badge>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3 mt-2">
          {/* Provider information */}
          {psychologistInfo && (
            <div className="flex items-start space-x-2 text-sm">
              <User className="h-4 w-4 mt-0.5 text-blue-500" />
              <div>
                <p className="font-medium">{psychologistInfo.name}</p>
                {psychologistInfo.specializations?.length > 0 && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {psychologistInfo.specializations.slice(0, 2).join(', ')}
                    {psychologistInfo.specializations.length > 2 && ' ...'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Date and time */}
          {dateTime && (
            <div className="flex items-start space-x-2 text-sm">
              <Calendar className="h-4 w-4 mt-0.5 text-blue-500" />
              <div>
                <p className="font-medium">{dateFormatted}</p>
                <p className="text-gray-600 dark:text-gray-400">
                  {timeFormatted} - {endTimeFormatted}
                </p>
              </div>
            </div>
          )}

          {/* Session format */}
          <div className="flex items-center space-x-2 text-sm">
            {sessionFormat === 'video' ? (
              <Video className="h-4 w-4 text-blue-500" />
            ) : (
              <Phone className="h-4 w-4 text-blue-500" />
            )}
            <span className="font-medium capitalize">
              {sessionFormat} Session
            </span>
          </div>

          {/* Fee information */}
          {psychologistInfo?.sessionFee && (
            <div className="flex items-center space-x-2 text-sm">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className="font-medium">
                ${psychologistInfo.sessionFee}
              </span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end space-x-2 mt-4">
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(notification._id)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Dismiss
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={handleViewAppointment}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            View Appointment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
