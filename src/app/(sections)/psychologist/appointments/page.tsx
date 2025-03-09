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
            // Validate event start date
            const eventStart = event.start ? new Date(event.start) : null;
            if (!eventStart || isNaN(eventStart.getTime())) {
              console.warn('Invalid event start date:', event.start);
              return; // Skip this event if date is invalid
            }

            // Find matching appointment with proper validation
            const matchingAppointment = appointmentsData.find(apt => {
              // Validate appointment date
              if (!apt.dateTime) return false;

              try {
                const aptDate = new Date(apt.dateTime);
                return (
                  aptDate &&
                  !isNaN(aptDate.getTime()) &&
                  aptDate.toISOString() === eventStart.toISOString()
                );
              } catch (error) {
                console.warn('Error comparing dates:', error);
                return false;
              }
            });

            if (matchingAppointment) {
              // Ensure endTime is valid
              const endTime = matchingAppointment.endTime
                ? new Date(matchingAppointment.endTime)
                : new Date(
                    new Date(matchingAppointment.dateTime).getTime() +
                      60 * 60 * 1000
                  );

              processedEvents.push({
                id: matchingAppointment._id,
                title: matchingAppointment.patientName,
                start: matchingAppointment.dateTime,
                end: endTime.toISOString(),
                extendedProps: {
                  type: 'appointment',
                  status: matchingAppointment.status,
                  appointmentDetails: matchingAppointment,
                  isBooked: true,
                },
              });
            } else {
              // Ensure event.end is valid
              const endTime = event.end
                ? new Date(event.end)
                : new Date(eventStart.getTime() + 60 * 60 * 1000);

              processedEvents.push({
                ...event,
                start: eventStart.toISOString(),
                end: endTime.toISOString(),
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
    const startTime = format(event.start, 'h:mm');
    const endTime = format(event.end, 'h:mm');
    const period = format(event.end, 'a');
    const isBooked = event.extendedProps.type === 'appointment';
    const isNewOrChanged = event.extendedProps.isNewOrChanged;

    // Calculate duration for display
    const durationMs = event.end.getTime() - event.start.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));

    let durationText;
    if (durationMinutes === 30) {
      durationText = '30 min';
    } else if (durationMinutes === 45) {
      durationText = '45 min';
    } else if (durationMinutes === 60) {
      durationText = '1 hr';
    } else if (durationMinutes === 90) {
      durationText = '1.5 hrs';
    } else if (durationMinutes === 120) {
      durationText = '2 hrs';
    } else {
      durationText = `${durationMinutes} min`;
    }

    return (
      <div
        className={`
              p-3 rounded-lg shadow-sm 
              ${
                isBooked
                  ? 'bg-red-50 dark:bg-red-900/20 border-l-2 border-red-500'
                  : 'bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500'
              } 
              transition-all hover:shadow-md
            `}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <div
              className={`
                    w-3 h-3 rounded-full shrink-0
                    ${isBooked ? 'bg-red-500' : 'bg-green-500'}
                  `}
            />
            {!isBooked && (
              <span className="absolute inset-0 rounded-full bg-green-400 opacity-75 animate-ping"></span>
            )}
          </div>
          <span
            className={`
                  text-sm font-medium
                  ${
                    isBooked
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-green-700 dark:text-green-300'
                  }
                `}
          >
            {isBooked ? 'Booked' : 'Available'}
          </span>
        </div>

        <div className="flex items-center text-sm mt-0.5">
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
                  <div className="max-w-3xl">
                    <TabsList className="w-full grid grid-cols-4 p-1 h-12 dark:bg-input">
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
                                'flex items-center justify-center gap-2 h-full',
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
                  slotDuration="00:15:00"
                  slotLabelInterval="01:00:00"
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
                  eventClassNames={info => [
                    'cursor-pointer hover:opacity-90 transition-opacity rounded-md overflow-hidden border',
                    info.event.extendedProps.duration
                      ? `duration-${info.event.extendedProps.duration}`
                      : '',
                  ]}
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
