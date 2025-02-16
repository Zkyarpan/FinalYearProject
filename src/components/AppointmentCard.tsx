'use client';

import React from 'react';
import { format } from 'date-fns';
import {
  Video,
  Clock,
  User,
  DollarSign,
  CalendarDays,
  Mail,
  Phone,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface AppointmentCardProps {
  appointment: {
    status: 'confirmed' | string;
    dateTime: string | Date;
    endTime: string | Date;
    sessionFormat: 'video' | string;
    duration: number;
    patientName?: string;
    email?: string;
    phone?: string;
    payment?: {
      amount: number;
      currency: string;
      status: string;
    };
    userId?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      profilePhotoUrl?: string;
    };
    profile?: {
      profilePhotoUrl?: string;
      age?: number;
      gender?: string;
      struggles?: string[];
    };
  };
  onClick: () => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onClick,
}) => {
  const patientName =
    appointment.patientName ||
    `${appointment.userId?.firstName || ''} ${
      appointment.userId?.lastName || ''
    }`.trim() ||
    'Patient';

  const initials = patientName
    .split(' ')
    .map(n => n[0])
    .join('');

  const profileImage =
    appointment.profile?.profilePhotoUrl || appointment.userId?.profilePhotoUrl;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-emerald-500';
      case 'completed':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'refunded':
        return 'destructive';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="group relative transition-all hover:shadow-md dark:hover:shadow-zinc-800 hover:border-primary/20 bg-transparent border rounded-lg dark:border-zinc-800">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Left Column - Avatar */}
          <div className="flex-shrink-0">
            <Avatar className="h-12 w-12 ring-2 ring-offset-2 ring-offset-background ring-primary/10">
              <AvatarImage src={profileImage} alt={patientName} />
              <AvatarFallback className="bg-primary/10 font-medium">
                {initials || <User className="h-6 w-6" />}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Middle Column - Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-base font-semibold flex items-center gap-2">
                  {patientName}
                  {appointment.profile?.age && (
                    <span className="text-sm font-normal text-muted-foreground">
                      ({appointment.profile.age} years)
                    </span>
                  )}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1.5">
                  <div
                    className={`w-2 h-2 rounded-full ${getStatusColor(
                      appointment.status
                    )}`}
                  />
                  <span className="capitalize bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 px-2.5 py-0.5 rounded-md text-xs font-medium;">{appointment.status}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-primary/70" />
                <span>
                  {format(new Date(appointment.dateTime), 'EEEE, MMMM d')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-primary/70" />
                <span>
                  {format(new Date(appointment.dateTime), 'h:mm a')} -{' '}
                  {format(new Date(appointment.endTime), 'h:mm a')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Video className="h-4 w-4 text-primary/70" />
                <span className="capitalize">
                  {appointment.sessionFormat} Session
                </span>
              </div>
              {appointment.payment && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4 text-primary/70" />
                  <span>
                    ${appointment.payment.amount}{' '}
                    {appointment.payment.currency.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="flex gap-4 mt-3 pt-3 border-t dark:border-zinc-800">
              {appointment.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{appointment.email}</span>
                </div>
              )}
              {appointment.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{appointment.phone}</span>
                </div>
              )}
            </div>

            {/* Struggles/Focus Areas */}
            {appointment.profile?.struggles &&
              appointment.profile.struggles.length > 0 && (
                <div className="flex items-center gap-1.5 mt-3">
                  <span className="text-xs text-muted-foreground">
                    Focus Areas:
                  </span>
                  {appointment.profile.struggles.map((struggle, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {struggle}
                    </Badge>
                  ))}
                </div>
              )}
          </div>
        </div>

        {/* View Details Button */}
        <div className="mt-4 flex justify-end border-t pt-4 dark:border-zinc-800">
          <Button onClick={onClick} size="sm" className="text-xs gap-2">
            <Eye className="h-3.5 w-3.5" />
            View Details
          </Button>
        </div>
      </CardContent>
    </div>
  );
};
