'use client';

import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  Calendar,
  ListTodo,
  CalendarIcon,
  Sun,
  Cloud,
  Sunset,
  Moon,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AppointmentCard } from '@/components/AppointmentCard';
import AppointmentDialog from '@/components/AppointmentDialog';
import CalendarStyles from '@/components/CalenderStyles';
import { getAppointmentCountByPeriod } from '@/utils/getAppointmentCountByPeriod';

const TIME_PERIODS = {
  MORNING: { start: '00:00:00', end: '11:59:59', icon: Sun, label: 'Morning' },
  AFTERNOON: {
    start: '12:00:00',
    end: '16:59:59',
    icon: Cloud,
    label: 'Afternoon',
  },
  EVENING: {
    start: '17:00:00',
    end: '20:59:59',
    icon: Sunset,
    label: 'Evening',
  },
  NIGHT: { start: '21:00:00', end: '23:59:59', icon: Moon, label: 'Night' },
};

const PsychologistAppointments = () => {
  interface Appointment {
    _id: string;
    patientName: string;
    dateTime: string;
    endTime: string;
    status: string;
    sessionFormat: string;
    duration: number;
  }

  interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    extendedProps: {
      type: string;
      status?: string;
      appointmentDetails?: any;
      isBooked?: boolean;
    };
  }

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [view, setView] = useState('calendar');
  const [selectedPeriod, setSelectedPeriod] = useState('MORNING');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [appointmentsRes, availabilityRes] = await Promise.all([
        fetch('/api/psychologist/appointments').then(res => res.json()),
        fetch('/api/availability').then(res => res.json()),
      ]);

      if (appointmentsRes.IsSuccess && availabilityRes.IsSuccess) {
        const appointmentsData = appointmentsRes.Result.appointments || [];
        setAppointments(appointmentsData);

        const processedEvents: CalendarEvent[] = [];

        if (Array.isArray(availabilityRes.Result.events)) {
          availabilityRes.Result.events.forEach(event => {
            const matchingAppointment = appointmentsData.find(
              apt =>
                new Date(apt.dateTime).toISOString() ===
                new Date(event.start).toISOString()
            );

            if (matchingAppointment) {
              processedEvents.push({
                id: matchingAppointment._id,
                title: matchingAppointment.patientName,
                start: matchingAppointment.dateTime,
                end: matchingAppointment.endTime,
                extendedProps: {
                  type: 'appointment',
                  status: matchingAppointment.status,
                  appointmentDetails: matchingAppointment,
                  isBooked: true,
                },
              });
            } else {
              processedEvents.push({
                ...event,
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                borderColor: 'rgb(16, 185, 129)',
                textColor: 'rgb(6, 95, 70)',
                extendedProps: {
                  type: 'availability',
                  isBooked: false,
                },
              });
            }
          });
        }

        setCalendarEvents(processedEvents);
      } else {
        toast.error('Error loading calendar data');
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast.error('Error loading calendar data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEventClick = info => {
    if (info.event.extendedProps.type === 'appointment') {
      setSelectedAppointment(info.event.extendedProps.appointmentDetails);
      setIsAppointmentModalOpen(true);
    }
  };

  const renderEventContent = useCallback(eventInfo => {
    const event = eventInfo.event;
    const startTime = format(event.start, 'h');
    const endTime = format(event.end, 'h');
    const period = format(event.end, 'a');
    const isBooked = event.extendedProps.type === 'appointment';

    return (
      <div
        className={cn(
          'px-2 py-1.5',
          isBooked
            ? 'bg-yellow-100 dark:bg-yellow-900/40'
            : 'bg-emerald-50 dark:bg-emerald-900/40'
        )}
      >
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              'w-1.5 h-1.5 rounded-full shrink-0',
              isBooked ? 'bg-yellow-500' : 'bg-emerald-500'
            )}
          />
          <span
            className={cn(
              'text-sm font-semibold',
              isBooked
                ? 'text-yellow-900 dark:text-yellow-100'
                : 'text-emerald-900 dark:text-emerald-100'
            )}
          >
            {isBooked ? event.title : 'Available'}
          </span>
        </div>
        <div className="flex items-center text-sm mt-0.5">
          <CalendarIcon
            className={cn(
              'h-2.5 w-2.5 mr-1',
              isBooked
                ? 'text-yellow-800 dark:text-yellow-200'
                : 'text-emerald-800 dark:text-emerald-200'
            )}
          />
          <span
            className={cn(
              isBooked
                ? 'text-yellow-800 dark:text-yellow-200'
                : 'text-emerald-800 dark:text-emerald-200'
            )}
          >
            {startTime} - {endTime} {period}
          </span>
        </div>
      </div>
    );
  }, []);

  return (
    <div className="min-h-screen bg-background mt-5">
      <Card>
        {CalendarStyles()}
        <CardContent className="p-4">
          <Tabs value={view} onValueChange={setView}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="calendar" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendar View
                </TabsTrigger>
                <TabsTrigger value="list" className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  <span>Upcoming Appointments</span>
                  {appointments.length > 0 && (
                    <Badge
                      variant="default"
                      className="bg-blue-500 hover:bg-blue-500/90 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-medium"
                    >
                      {appointments.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <Badge variant="outline" className="gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Available
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  Booked
                </Badge>
              </div>
            </div>

            <TabsContent value="calendar" className="mt-4">
              <div className="mb-4">
                <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <div className="mx-auto max-w-3xl">
                    <TabsList className="w-full grid grid-cols-4 bg-card/50 dark:bg-card/50 p-1 rounded-lg">
                      {Object.entries(TIME_PERIODS).map(
                        ([key, { label, icon: Icon }]) => {
                          const appointmentCount = getAppointmentCountByPeriod(
                            calendarEvents,
                            key
                          );
                          return (
                            <TabsTrigger
                              key={key}
                              value={key}
                              className={cn(
                                'flex items-center justify-center gap-2 py-2 relative',
                                'data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-input',
                                'rounded-md transition-all duration-200'
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{label}</span>
                              </div>
                              {appointmentCount > 0 && (
                                <Badge
                                  variant="default"
                                  className="bg-blue-500 hover:bg-blue-500/90 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-medium"
                                >
                                  {appointmentCount}
                                </Badge>
                              )}
                            </TabsTrigger>
                          );
                        }
                      )}
                    </TabsList>
                  </div>
                </Tabs>
              </div>

              <div className="h-[700px]">
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'timeGridWeek,timeGridDay',
                  }}
                  slotDuration="01:00:00"
                  slotMinTime={TIME_PERIODS[selectedPeriod].start}
                  slotMaxTime={TIME_PERIODS[selectedPeriod].end}
                  events={calendarEvents}
                  eventClick={handleEventClick}
                  allDaySlot={false}
                  nowIndicator
                  height="100%"
                  expandRows={true}
                  stickyHeaderDates={true}
                  slotLabelFormat={{
                    hour: 'numeric',
                    minute: '2-digit',
                    meridiem: 'short',
                  }}
                  eventContent={renderEventContent}
                  dayHeaderFormat={{
                    weekday: 'short',
                    month: 'numeric',
                    day: 'numeric',
                    omitCommas: true,
                  }}
                  eventClassNames="cursor-pointer hover:opacity-90 transition-opacity rounded-md overflow-hidden border"
                  slotLabelClassNames="text-sm font-medium text-gray-600 dark:text-gray-300"
                  dayHeaderClassNames="text-sm font-medium text-gray-700 dark:text-gray-200"
                />
              </div>
            </TabsContent>

            <TabsContent value="list" className="mt-4">
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center text-muted-foreground py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                    Loading appointments...
                  </div>
                ) : appointments.length > 0 ? (
                  appointments.map(appointment => (
                    <AppointmentCard
                      key={appointment._id}
                      appointment={appointment}
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setIsAppointmentModalOpen(true);
                      }}
                    />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No upcoming appointments</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AppointmentDialog
        appointment={selectedAppointment}
        isOpen={isAppointmentModalOpen}
        onClose={() => {
          setIsAppointmentModalOpen(false);
          setSelectedAppointment(null);
        }}
        onJoinSession={link => window.open(link, '_blank')}
      />
    </div>
  );
};

export default PsychologistAppointments;
