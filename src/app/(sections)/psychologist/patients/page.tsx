'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Clock, Video, Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Appointment {
  _id: string;
  dateTime: string;
  duration: number;
  status: 'confirmed' | 'booked';
  userId: {
    profile: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  sessionLink?: string;
}

const UpcomingPatients = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/psychologist/appointments');
      const data = await response.json();

      if (data.IsSuccess) {
        setAppointments(data.Result.appointments);
      } else {
        toast.error('Failed to fetch appointments');
      }
    } catch (error) {
      toast.error('Error loading appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinSession = (link: string) => {
    window.open(link, '_blank');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Patients
        </CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No upcoming appointments</p>
            <p className="text-sm mt-1">Your schedule is clear for now</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map(appointment => (
              <Card
                key={appointment._id}
                className="bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedAppointment(appointment);
                  setIsDetailsOpen(true);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage
                          src={appointment.userId.profile.avatar}
                          alt={`${appointment.userId.profile.firstName} ${appointment.userId.profile.lastName}`}
                        />
                        <AvatarFallback>
                          {appointment.userId.profile.firstName[0]}
                          {appointment.userId.profile.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {appointment.userId.profile.firstName}{' '}
                          {appointment.userId.profile.lastName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <Clock className="h-4 w-4" />
                          {format(
                            new Date(appointment.dateTime),
                            'MMM d, h:mm a'
                          )}
                          <span className="text-muted-foreground/50">•</span>
                          {appointment.duration} mins
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        appointment.status === 'confirmed'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {appointment.status === 'confirmed'
                        ? 'Confirmed'
                        : 'Booked'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={selectedAppointment.userId.profile.avatar}
                    alt={`${selectedAppointment.userId.profile.firstName} ${selectedAppointment.userId.profile.lastName}`}
                  />
                  <AvatarFallback className="text-lg">
                    {selectedAppointment.userId.profile.firstName[0]}
                    {selectedAppointment.userId.profile.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedAppointment.userId.profile.firstName}{' '}
                    {selectedAppointment.userId.profile.lastName}
                  </h2>
                  <p className="text-muted-foreground">
                    {format(
                      new Date(selectedAppointment.dateTime),
                      'EEEE, MMMM d, yyyy'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  {format(new Date(selectedAppointment.dateTime), 'h:mm a')} -{' '}
                  {format(
                    new Date(
                      new Date(selectedAppointment.dateTime).getTime() +
                        selectedAppointment.duration * 60000
                    ),
                    'h:mm a'
                  )}
                </span>
                <span className="text-muted-foreground/50 mx-2">•</span>
                <span>{selectedAppointment.duration} minutes</span>
              </div>

              {selectedAppointment.status === 'confirmed' &&
                selectedAppointment.sessionLink && (
                  <Button
                    className="w-full gap-2"
                    onClick={() =>
                      handleJoinSession(selectedAppointment.sessionLink!)
                    }
                  >
                    <Video className="h-4 w-4" />
                    Join Video Session
                  </Button>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UpcomingPatients;
