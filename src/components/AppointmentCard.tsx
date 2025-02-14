'use client';

import React from 'react';
import { format } from 'date-fns';
import { Video, Clock, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Appointment } from '@/types/types';

interface AppointmentCardProps {
  appointment: Appointment;
  onClick: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onClick,
}) => {
  // Safely access profile data with optional chaining and fallbacks
  const firstName = appointment?.userId?.profile?.firstName || '';
  const lastName = appointment?.userId?.profile?.lastName || '';
  const profileImage = appointment?.userId?.profile?.image;
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`;

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            {profileImage ? (
              <AvatarImage
                src={profileImage}
                alt={`${firstName} ${lastName}`}
              />
            ) : null}
            <AvatarFallback className="bg-primary/10">
              {initials || <User className="h-6 w-6" />}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {firstName && lastName ? `${firstName} ${lastName}` : 'User'}
              </h3>
              <Badge
                variant={
                  appointment.status === 'confirmed' ? 'default' : 'secondary'
                }
              >
                {appointment.status}
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground mt-1">
              {format(new Date(appointment.dateTime), 'MMM d, h:mm a')}
            </div>

            <div className="flex gap-2 mt-2">
              {appointment.sessionFormat === 'video' && (
                <Badge variant="outline" className="text-primary">
                  <Video className="w-3 h-3 mr-1" />
                  Video Session
                </Badge>
              )}
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                {appointment.duration}min
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
