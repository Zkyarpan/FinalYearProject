'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { z } from 'zod';
import  {CalendarStyles}  from '@/components/CalenderStyles';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  CalendarDays,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

// Validation schemas
const availabilitySchema = z.object({
  daysOfWeek: z.array(z.number()),
  startTime: z.string(),
  endTime: z.string(),
});

interface Appointment {
  id: string;
  title: string;
  start: Date;
  end: Date;
  patientName: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'canceled';
  patientEmail?: string;
  requestDate?: Date;
}

interface Availability {
  id: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
}

const timeSlots = [
  { value: '06:00', label: '6:00 AM' },
  { value: '07:00', label: '7:00 AM' },
  { value: '08:00', label: '8:00 AM' },
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '19:00', label: '7:00 PM' },
  { value: '20:00', label: '8:00 PM' },
  { value: '21:00', label: '9:00 PM' },
];

function renderEventContent(eventInfo: any) {
  const statusColors = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-green-500',
    canceled: 'bg-red-500',
  };

  return (
    <div className="p-2 rounded-md bg-card">
      <div className="font-semibold mb-1">{eventInfo.event.title}</div>
      <div className="text-sm text-muted-foreground mb-1">
        Patient: {eventInfo.event.extendedProps.patientName}
      </div>
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className={`${statusColors[eventInfo.event.extendedProps.status]}`}
        >
          {eventInfo.event.extendedProps.status}
        </Badge>
      </div>
    </div>
  );
}

export default function PsychologistAppointmentPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingAvailability, setIsAddingAvailability] = useState(false);
  const [availability, setAvailability] = useState({
    daysOfWeek: [],
    startTime: '',
    endTime: '',
  });

  const daysOfWeekOptions = {
    weekdays: [1, 2, 3, 4, 5],
    weekends: [0, 6],
    all: [0, 1, 2, 3, 4, 5, 6],
  };

  const getDaysOfWeekKey = daysArray => {
    return Object.keys(daysOfWeekOptions).find(
      key =>
        daysOfWeekOptions[key].length === daysArray.length &&
        daysOfWeekOptions[key].every(day => daysArray.includes(day))
    );
  };

  const currentDaysOfWeekKey = getDaysOfWeekKey(availability.daysOfWeek);

  // Handler to update the daysOfWeek based on select input
  const handleDaysOfWeekChange = value => {
    setAvailability(prev => ({
      ...prev,
      daysOfWeek: daysOfWeekOptions[value],
    }));
  };

  useEffect(() => {
    fetchAppointments();
    fetchPendingRequests();
  }, []);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/psychologist/appointments', {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to fetch appointments');
        return;
      }

      setAppointments(data.appointments);
    } catch (error) {
      console.error('Fetch appointments error:', error);
      toast.error('Something went wrong while fetching appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch('/api/psychologist/appointments/pending', {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to fetch pending requests');
        return;
      }

      setPendingRequests(data.appointments);
    } catch (error) {
      console.error('Fetch pending requests error:', error);
      toast.error('Something went wrong while fetching pending requests');
    }
  };

  const handleAppointmentAction = async (
    appointmentId: string,
    action: 'confirm' | 'cancel'
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/psychologist/appointments/${appointmentId}/${action}`,
        {
          method: 'PUT',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || `Failed to ${action} appointment`);
        return;
      }

      toast.success(`Appointment ${action}ed successfully`);
      fetchAppointments();
      fetchPendingRequests();
    } catch (error) {
      console.error(`${action} appointment error:`, error);
      toast.error(`Something went wrong while ${action}ing the appointment`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetAvailability = async () => {
    setIsLoading(true);
    const availabilityData = {
      daysOfWeek: availability.daysOfWeek,
      startTime: availability.startTime,
      endTime: availability.endTime,
    };

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(availabilityData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.ErrorMessage?.[0]?.message || 'Failed to set availability';
        toast.error(errorMessage);
        return;
      }

      toast.success('Availability set successfully');
      setIsAddingAvailability(false);
    } catch (error) {
      console.error('Set availability error:', error);
      toast.error(
        error.message || 'Something went wrong while setting availability'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {CalendarStyles()}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Manage yout appointments
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your appointments, requests, and availability
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-yellow-500">
              {pendingRequests.length} Pending
            </Badge>
            <Badge variant="secondary" className="bg-green-500">
              {appointments.filter(a => a.status === 'confirmed').length}{' '}
              Confirmed
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="calendar" className="space-y-4">
          <TabsList className="grid w-full max-w-[600px] grid-cols-3">
            <TabsTrigger value="calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="requests">
              <User className="h-4 w-4 mr-2" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="availability">
              <Settings className="h-4 w-4 mr-2" />
              Availability
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appointments Calendar</CardTitle>
                <CardDescription>
                  View all your scheduled appointments
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[700px] p-6">
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'timeGridWeek,timeGridDay',
                    }}
                    slotDuration="00:30:00"
                    slotMinTime="06:00:00"
                    slotMaxTime="21:00:00"
                    dayMaxEvents={true}
                    weekends={true}
                    eventContent={renderEventContent}
                    height="100%"
                    allDaySlot={false}
                    nowIndicator={true}
                    events={appointments}
                    handleWindowResize={true}
                    stickyHeaderDates={true}
                    slotLaneClassNames="bg-background/50 dark:border-muted"
                    dayHeaderClassNames="bg-background/50"
                    viewClassNames="bg-background/50"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pending Requests</CardTitle>
                <CardDescription>
                  Review and manage appointment requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {pendingRequests.map(request => (
                      <Card key={request.id}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {request.patientName}
                              </h3>
                              <p className="text-muted-foreground">
                                {request.title}
                              </p>
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <CalendarDays className="w-4 h-4" />
                                  {format(
                                    new Date(request.start),
                                    'EEEE, MMMM d, yyyy'
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Clock className="w-4 h-4" />
                                  {format(
                                    new Date(request.start),
                                    'h:mm a'
                                  )} - {format(new Date(request.end), 'h:mm a')}
                                </div>
                              </div>
                              {request.notes && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                  Notes: {request.notes}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant="secondary"
                              className="bg-yellow-500"
                            >
                              Pending
                            </Badge>
                          </div>
                          <div className="mt-4 flex gap-2">
                            <Button
                              className="w-full"
                              onClick={() =>
                                handleAppointmentAction(request.id, 'confirm')
                              }
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Confirm
                            </Button>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() =>
                                handleAppointmentAction(request.id, 'cancel')
                              }
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Decline
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {pendingRequests.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No pending requests
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Availability Settings</CardTitle>
                <CardDescription>
                  Set your weekly availability for appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSetAvailability();
                  }}
                  className="space-y-4"
                >
                  <div className="grid gap-2">
                    <Label>Days Available</Label>
                    <Select
                      value={currentDaysOfWeekKey || ''}
                      onValueChange={handleDaysOfWeekChange}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select days" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekdays">
                          Weekdays (Mon-Fri)
                        </SelectItem>
                        <SelectItem value="weekends">
                          Weekends (Sat-Sun)
                        </SelectItem>
                        <SelectItem value="all">All Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Start Time</Label>
                      <Select
                        value={availability.startTime}
                        onValueChange={value =>
                          setAvailability({ ...availability, startTime: value })
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map(slot => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>End Time</Label>
                      <Select
                        value={availability.endTime}
                        onValueChange={value =>
                          setAvailability({ ...availability, endTime: value })
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="End time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map(slot => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Availability'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
