'use client';

import React, { useState, useEffect } from 'react';
import { format, isPast, isFuture, parseISO, isToday } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  Clock,
  Video,
  History,
  CalendarCheck,
  AlertCircle,
  Loader2,
  User,
  MapPin,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';
import AvailabilitySettingsSkeleton from './AvailabilitySettingsSkeleton';

interface PsychologistProfile {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  profilePhotoUrl?: string;
  sessionFee?: number;
}

interface Appointment {
  _id: string;
  dateTime: string;
  endTime: string;
  duration: number;
  psychologistId: PsychologistProfile;
  stripePaymentIntentId: string;
  sessionFormat: 'video' | 'in-person';
  patientName: string;
  email: string;
  phone: string;
  reasonForVisit: string;
  notes?: string;
  status: 'confirmed' | 'canceled' | 'completed';
  insuranceProvider?: string;
  isPast: boolean;
  isToday: boolean;
  canJoin: boolean;
}

const EmptyState = ({ type }: { type: 'upcoming' | 'past' }) => (
  <Card className="bg-muted/50 dark:bg-input">
    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-primary/10 p-3 mb-4 dark:bg-black">
        {type === 'upcoming' ? (
          <CalendarCheck className="h-6 w-6 text-primary dark:text-white" />
        ) : (
          <History className="h-6 w-6 text-primary" />
        )}
      </div>
      <h3 className="font-medium mb-2">No {type} appointments</h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {type === 'upcoming'
          ? "You don't have any upcoming appointments scheduled."
          : "You haven't had any appointments yet."}
      </p>
    </CardContent>
  </Card>
);

const AppointmentCard = ({
  appointment,
  onCancelAppointment,
}: {
  appointment: Appointment;
  onCancelAppointment: (appointment: Appointment) => Promise<void>;
}) => {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const startTime = parseISO(appointment.dateTime);
  const endTime = parseISO(appointment.endTime);

  const psychologistName =
    `${appointment.psychologistId?.firstName || ''} ${
      appointment.psychologistId?.lastName || ''
    }`.trim() || 'Healthcare Provider';

  const handleJoinClick = () => {
    if (!appointment.canJoin) {
      toast.info(
        'Session is not available to join yet. Please wait until 5 minutes before the appointment.'
      );
      return;
    }
    toast.info('Joining video session...');
  };

  const handleCancelClick = async () => {
    try {
      setIsCancelling(true);
      await onCancelAppointment(appointment);
      setShowCancelDialog(false);
      toast.success('Appointment cancelled successfully');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    } finally {
      setIsCancelling(false);
    }
  };

  const isWithin24Hours = () => {
    const appointmentTime = parseISO(appointment.dateTime);
    const now = new Date();
    const hoursDifference =
      (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDifference <= 24;
  };

  return (
    <>
      <Card className="group hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <Avatar className="h-14 w-14 border">
              {appointment.psychologistId?.profilePhotoUrl ? (
                <AvatarImage
                  src={appointment.psychologistId.profilePhotoUrl}
                  alt={psychologistName}
                  className="object-cover"
                />
              ) : (
                <AvatarFallback className="bg-primary/10">
                  <User className="h-6 w-6 text-muted-foreground" />
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-lg">{psychologistName}</h4>
                  <p className="text-sm text-muted-foreground">
                    {appointment.email}
                  </p>
                  {appointment.psychologistId?.sessionFee && (
                    <p className="text-sm text-muted-foreground">
                      Session Fee: ${appointment.psychologistId.sessionFee}
                    </p>
                  )}
                </div>

                {!appointment.isPast && appointment.status !== 'canceled' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setShowCancelDialog(true)}
                    >
                      Cancel
                    </Button>
                    {appointment.sessionFormat === 'video' && (
                      <Button
                        size="sm"
                        onClick={handleJoinClick}
                        disabled={!appointment.canJoin}
                        className="whitespace-nowrap"
                      >
                        {appointment.canJoin ? 'Join Session' : 'Join Soon'}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(startTime, 'EEE, MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                  </span>
                </div>
                <Badge variant="secondary" className="flex items-center gap-2">
                  {appointment.sessionFormat === 'video' ? (
                    <>
                      <Video className="h-3 w-3" />
                      <span>Video Session</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-3 w-3" />
                      <span>In-Person</span>
                    </>
                  )}
                </Badge>
                <Badge
                  variant={
                    appointment.status === 'confirmed' ? 'default' : 'secondary'
                  }
                  className={
                    appointment.status === 'canceled'
                      ? 'bg-destructive/10 text-destructive'
                      : ''
                  }
                >
                  {appointment.status.charAt(0).toUpperCase() +
                    appointment.status.slice(1)}
                </Badge>
              </div>

              {appointment.reasonForVisit && (
                <div className="text-sm text-muted-foreground">
                  <strong>Reason for Visit:</strong>{' '}
                  {appointment.reasonForVisit}
                </div>
              )}

              {appointment.notes && (
                <div className="text-sm text-muted-foreground">
                  <strong>Notes:</strong> {appointment.notes}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your appointment with{' '}
              {psychologistName} on {format(startTime, 'MMMM d, yyyy')} at{' '}
              {format(startTime, 'h:mm a')}?
            </DialogDescription>
          </DialogHeader>
          {isWithin24Hours() && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This appointment is within 24 hours. Cancellation may incur a
                fee.
              </AlertDescription>
            </Alert>
          )}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isCancelling}
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelClick}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Appointment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const AppointmentManager = () => {
  const { isAuthenticated, profileImage, firstName, lastName } = useUserStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/appointments');
      const data = await response.json();

      if (data.IsSuccess) {
        setAppointments(data.Result?.appointments || []);
      } else {
        toast.error('Failed to fetch appointments');
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Error loading appointments');
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    try {
      const response = await fetch(`/api/appointments/${appointment._id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.IsSuccess) {
        await fetchAppointments();
      } else {
        throw new Error(
          data.ErrorMessage?.[0]?.message || 'Failed to cancel appointment'
        );
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  };

  const upcomingAppointments = appointments
    .filter(apt => !apt.isPast)
    .sort(
      (a, b) => parseISO(a.dateTime).getTime() - parseISO(b.dateTime).getTime()
    );

  const pastAppointments = appointments
    .filter(apt => apt.isPast)
    .sort(
      (a, b) => parseISO(b.dateTime).getTime() - parseISO(a.dateTime).getTime()
    );

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              Please log in to view your appointments.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <AvailabilitySettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            {profileImage ? (
              <AvatarImage
                src={profileImage}
                alt={`${firstName} ${lastName}`}
              />
            ) : (
              <AvatarFallback>
                {firstName?.charAt(0)}
                {lastName?.charAt(0)}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {firstName ? `${firstName}'s Appointments` : 'My Appointments'}
            </h2>
            <p className="text-sm text-muted-foreground">
              View and manage your therapy sessions
            </p>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value: 'upcoming' | 'past') => setActiveTab(value)}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" />
            Upcoming
            {upcomingAppointments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {upcomingAppointments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Past
            {pastAppointments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pastAppointments.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-2">
          {upcomingAppointments.length > 0 ? (
            <div className="space-y-4">
              {upcomingAppointments.map(appointment => (
                <AppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                  onCancelAppointment={handleCancelAppointment}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="upcoming" />
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-2">
          {pastAppointments.length > 0 ? (
            <div className="space-y-4">
              {pastAppointments.map(appointment => (
                <AppointmentCard
                  key={appointment._id}
                  appointment={appointment}
                  onCancelAppointment={handleCancelAppointment}
                />
              ))}
            </div>
          ) : (
            <EmptyState type="past" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AppointmentManager;
