'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  User,
  AlertCircle,
  Loader2,
  Search,
  History,
  CheckCircle2,
  X,
  Ban,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppointmentSkeleton } from './skeleton/AppointmentSkeleton';

interface Appointment {
  _id: string;
  dateTime: string;
  endTime: string;
  duration: number;
  sessionFormat: 'video' | 'in-person';
  status: 'confirmed' | 'canceled' | 'completed';
  reasonForVisit: string;
  notes?: string;
  cancelationReason?: string;
  canceledAt?: string;
  psychologist: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePhotoUrl?: string;
    sessionFee: number;
    specialty?: string;
    languages?: string[];
    licenseType?: string;
    education?: Array<{
      degree: string;
      university: string;
      graduationYear: number;
    }>;
    about?: string;
  };
  payment: {
    amount: number;
    currency: string;
    status: string;
  };
  isPast: boolean;
  isToday: boolean;
  canJoin: boolean;
}

const formatDate = (
  dateString: string,
  formatType: 'date' | 'time' | 'full'
) => {
  const date = new Date(dateString);

  switch (formatType) {
    case 'date':
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    case 'time':
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    case 'full':
      return `${formatDate(dateString, 'date')} ${formatDate(
        dateString,
        'time'
      )}`;
  }
};

const getStatusBadgeVariant = (status: string, isPast: boolean) => {
  if (status === 'canceled') return 'destructive';
  if (status === 'completed') return 'secondary';
  if (isPast) return 'outline';
  return 'default';
};

const AppointmentManager: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const upcomingAppointments = appointments.filter(apt => !apt.isPast);
  const pastAppointments = appointments.filter(apt => apt.isPast);
  const [cancellationNote, setCancellationNote] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/appointments');
      const data = await response.json();

      if (data.IsSuccess) {
        const sortedAppointments = data.Result?.appointments || [];
        sortedAppointments.sort(
          (a: Appointment, b: Appointment) =>
            new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
        );
        setAppointments(sortedAppointments);
      } else {
        toast.error('Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Error loading appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAppointment = async (note: string) => {
    if (!selectedAppointment) return;

    if (!note.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    if (note.trim().length < 10) {
      toast.error('Please provide a more detailed reason for cancellation');
      return;
    }
    setIsCanceling(true);
    try {
      const response = await fetch(
        `/api/appointments/${selectedAppointment._id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cancellationNotes: note,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.ErrorMessage?.[0]?.message || 'Failed to cancel appointment';
        toast.error(errorMessage);
        return;
      }

      if (data.IsSuccess) {
        await fetchAppointments();
        toast.success('Appointment cancelled successfully');
        setCancellationNote('');
        setCancelDialogOpen(false);
        setSelectedAppointment(null);
      } else {
        toast.error('Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleJoinSession = (appointment: Appointment) => {
    if (!appointment.canJoin) {
      toast.info(
        'Session is not available to join yet. Please wait until 5 minutes before the appointment.'
      );
      return;
    }
    toast.info('Joining video session...');
  };
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch =
      searchQuery === '' ||
      apt.psychologist.firstName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      apt.psychologist.lastName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      apt.reasonForVisit.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'upcoming') {
      return matchesSearch && !apt.isPast && apt.status !== 'canceled';
    } else if (activeTab === 'canceled') {
      return matchesSearch && apt.status === 'canceled';
    } else {
      // past
      return matchesSearch && apt.isPast && apt.status !== 'canceled';
    }
  });

  const renderAppointmentCard = (appointment: Appointment) => {
    const psychologist = appointment.psychologist;
    const isCanceled = appointment.status === 'canceled';
    const isCompleted = appointment.status === 'completed';

    return (
      <Card
        key={appointment._id}
        className={`w-full p-4 bg-white bg-[linear-gradient(204deg,rgba(209,213,218,0.70)0%,rgba(255,255,255,0.00)50.85%)] dark:bg-[#1c1c1c] dark:bg-[linear-gradient(204deg,rgba(40,40,45,0.8)0%,rgba(23,23,23,0.9)50.85%)] ${
          isCanceled
            ? 'bg-muted/30 dark:bg-muted/10'
            : 'bg-white bg-[linear-gradient(204deg,rgba(209,213,218,0.70)0%,rgba(255,255,255,0.00)50.85%)] dark:bg-[#1c1c1c] dark:bg-[linear-gradient(204deg,rgba(40,40,45,0.8)0%,rgba(23,23,23,0.9)50.85%)]'
        }`}
      >
        <CardContent className="p-4 sm:p-6 flex flex-col min-h-[250px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Avatar
                className={`h-14 w-14 border-2 ${
                  isCanceled ? 'opacity-75' : ''
                }`}
              >
                {psychologist.profilePhotoUrl ? (
                  <AvatarImage
                    src={psychologist.profilePhotoUrl}
                    alt={`${psychologist.firstName} ${psychologist.lastName}`}
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="text-xl font-medium bg-primary/10 text-primary">
                    {psychologist.firstName[0]}
                    {psychologist.lastName[0]}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h4
                  className={`font-semibold text-lg ${
                    isCanceled ? 'text-muted-foreground' : ''
                  }`}
                >
                  {psychologist.firstName} {psychologist.lastName}
                </h4>
                <p className="text-sm flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-input dark:text-blue-400 text-xs font-medium border capitalize">
                    {psychologist.licenseType || 'Clinical Psychologist'}
                  </span>
                </p>
              </div>
            </div>
            <Badge
              variant={getStatusBadgeVariant(
                appointment.status,
                appointment.isPast
              )}
              className="font-medium"
            >
              {appointment.status.charAt(0).toUpperCase() +
                appointment.status.slice(1)}
            </Badge>
          </div>

          {/* Appointment details */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center space-x-3">
              <Calendar
                className={`h-5 w-5 ${
                  isCanceled
                    ? 'text-muted-foreground/70'
                    : 'text-muted-foreground'
                }`}
              />
              <span
                className={`font-medium text-sm ${
                  isCanceled ? 'text-muted-foreground/70' : ''
                }`}
              >
                {formatDate(appointment.dateTime, 'date')}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Clock
                className={`h-5 w-5 ${
                  isCanceled
                    ? 'text-muted-foreground/70'
                    : 'text-muted-foreground'
                }`}
              />
              <span
                className={`font-medium text-sm ${
                  isCanceled ? 'text-muted-foreground/70' : ''
                }`}
              >
                {formatDate(appointment.dateTime, 'time')} -{' '}
                {formatDate(appointment.endTime, 'time')}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              {appointment.sessionFormat === 'video' ? (
                <Video
                  className={`h-5 w-5 ${
                    isCanceled
                      ? 'text-muted-foreground/70'
                      : 'text-muted-foreground'
                  }`}
                />
              ) : (
                <MapPin
                  className={`h-5 w-5 ${
                    isCanceled
                      ? 'text-muted-foreground/70'
                      : 'text-muted-foreground'
                  }`}
                />
              )}
              <span
                className={`font-medium text-sm ${
                  isCanceled ? 'text-muted-foreground/70' : ''
                }`}
              >
                {appointment.sessionFormat === 'video'
                  ? 'Video Session'
                  : 'In-Person Session'}
              </span>
            </div>
          </div>

          {/* Footer section */}
          <div className="mt-auto">
            <div className="flex justify-between items-center">
              <Badge
                variant="outline"
                className={`text-sm font-medium ${
                  isCanceled ? 'opacity-75' : ''
                }`}
              >
                ${appointment.payment.amount}{' '}
                {appointment.payment.currency.toUpperCase()}
              </Badge>

              {isCanceled ? (
                <div className="flex items-center text-emerald-500">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    Refund processing • 3-5 business days
                  </span>
                </div>
              ) : isCompleted ? (
                <Badge variant="secondary" className="font-medium">
                  Session Complete
                </Badge>
              ) : (
                !appointment.isPast && (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setCancelDialogOpen(true);
                      }}
                    >
                      Cancel
                    </Button>
                    {appointment.sessionFormat === 'video' && (
                      <Button
                        size="sm"
                        onClick={() => handleJoinSession(appointment)}
                        disabled={!appointment.canJoin}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {appointment.canJoin ? 'Join Session' : 'Join Soon'}
                      </Button>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Cancellation details */}
            {isCanceled && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center mb-1">
                    <History className="h-4 w-4 mr-2" />
                    <span>
                      Canceled on{' '}
                      {formatDate(appointment.canceledAt || '', 'full')}
                    </span>
                  </div>
                  {appointment.cancelationReason && (
                    <p className="ml-6 truncate">
                      Reason: {appointment.cancelationReason}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCancelDialog = () => {
    return (
      <Dialog
        open={cancelDialogOpen}
        onOpenChange={open => {
          if (!isCanceling) {
            // Only allow closing if not in loading state
            setCancelDialogOpen(open);
            if (!open) {
              setCancellationNote('');
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              {selectedAppointment && (
                <>
                  Are you sure you want to cancel your appointment with{' '}
                  {selectedAppointment.psychologist.firstName}{' '}
                  {selectedAppointment.psychologist.lastName} on{' '}
                  {formatDate(selectedAppointment.dateTime, 'full')}?
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 bg-destructive/10 p-3 rounded-lg mb-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              Cancelling within 24 hours may incur a fee.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <label htmlFor="cancelNote" className="text-sm font-medium">
                Cancellation Note
              </label>
              <textarea
                id="cancelNote"
                className="block w-full h-20 rounded-md px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
                placeholder="Please provide a reason for cancellation..."
                value={cancellationNote}
                onChange={e => setCancellationNote(e.target.value)}
                disabled={isCanceling}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancellationNote('');
                setCancelDialogOpen(false);
              }}
              disabled={isCanceling}
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleCancelAppointment(cancellationNote)}
              disabled={isCanceling}
            >
              {isCanceling ? (
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
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 dark:border-[#333333]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Appointments</h2>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <AppointmentSkeleton key={i} />
            ))}
          </div>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight">Appointments</h2>
      </div>

      <Tabs
        defaultValue="upcoming"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-[482px] grid-cols-3 mb-6">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Upcoming</span>

            <Badge variant="default" className="ml-2">
              {
                appointments.filter(
                  apt => !apt.isPast && apt.status !== 'canceled'
                ).length
              }
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="canceled" className="flex items-center gap-2">
            <Ban className="h-4 w-4" />
            <span>Canceled</span>

            <Badge variant="default" className="ml-2">
              {appointments.filter(apt => apt.status === 'canceled').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>Past</span>
            <Badge variant="default" className="ml-2">
              {
                appointments.filter(
                  apt => apt.isPast && apt.status !== 'canceled'
                ).length
              }
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {filteredAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppointments.map(renderAppointmentCard)}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/50 rounded-lg dark:border-[#333333] dark:bg-input border">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />

              <p className="text-muted-foreground">
                No upcoming appointments found
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {filteredAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppointments.map(renderAppointmentCard)}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/50 rounded-lg border dark:bg-input dark:border-[#333333]">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />

              <p className="text-muted-foreground">
                No past appointments found
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="canceled">
          {filteredAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppointments.map(renderAppointmentCard)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-input rounded-xl  border dark:border-[#333333]">
              <Ban className="h-12 w-12 text-muted-foreground" />
              <p className="text-base font-medium text-muted-foreground">
                No canceled appointments
              </p>
              <p className="text-sm text-muted-foreground">
                You don't have any canceled appointments
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {renderCancelDialog()}
    </div>
  );
};

export default AppointmentManager;
