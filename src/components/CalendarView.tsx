'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  extendedProps: {
    type: string;
    psychologistId: string;
    psychologistName?: string;
    slotId?: string;
    isBooked?: boolean;
    firstName?: string;
    lastName?: string;
    about?: string;
    languages?: string[];
    sessionDuration?: number;
    sessionFee?: number;
    sessionFormats?: string[];
    specializations?: string[];
    acceptsInsurance?: boolean;
    insuranceProviders?: string[];
    licenseType?: string;
    yearsOfExperience?: number;
    profilePhotoUrl?: string;
  };
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  className?: string[];
  display?: string;
}

interface CalendarViewProps {
  appointments: Event[];
  availableSlots: Event[];
  onEventClick: (info: { event: Event }) => void;
  className?: string;
}

export function CalendarView({
  appointments = [],
  availableSlots = [],
  onEventClick,
  className,
}: CalendarViewProps) {
  const [currentEvents, setCurrentEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'timeGridWeek' | 'timeGridDay'>(
    'timeGridWeek'
  );

  // Memoize event colors
  const eventColors = useMemo(
    () => ({
      available: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderColor: 'rgba(34, 197, 94, 0.25)',
        textColor: '#166534',
      },
      booked: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.25)',
        textColor: '#dc2626',
      },
    }),
    []
  );

  const fetchSlots = useCallback(
    async (date: Date) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/availability');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch availability');
        }

        if (data.IsSuccess && data.Result.events) {
          const appointmentMap = new Map(
            appointments.map(apt => [
              `${new Date(apt.start).toISOString()}-${new Date(
                apt.end
              ).toISOString()}`,
              apt,
            ])
          );

          const formattedEvents = data.Result.events.map((event: any) => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            const timeKey = `${eventStart.toISOString()}-${eventEnd.toISOString()}`;
            const hasAppointment = appointmentMap.has(timeKey);

            const availabilitySlot = data.Result.availability
              .find((a: any) =>
                a.slots.some((s: any) => s._id === event.extendedProps.slotId)
              )
              ?.slots.find((s: any) => s._id === event.extendedProps.slotId);

            const isBooked =
              hasAppointment || (availabilitySlot?.isBooked ?? false);
            const colors = isBooked
              ? eventColors.booked
              : eventColors.available;

            return {
              ...event,
              start: eventStart,
              end: eventEnd,
              ...colors,
              extendedProps: {
                ...event.extendedProps,
                isBooked,
              },
            };
          });

          setCurrentEvents(formattedEvents);
        }
      } catch (err) {
        console.error('Error fetching slots:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch availability'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [appointments, eventColors]
  );

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate, fetchSlots]);

  const handleEventClick = useCallback(
    (info: any) => {
      if (
        info.event.extendedProps.type === 'availability' &&
        !info.event.extendedProps.isBooked
      ) {
        const clickedEvent = {
          start: info.event.start,
          end: info.event.end,
          ...info.event.extendedProps,
        };
        onEventClick({ event: clickedEvent });
      }
    },
    [onEventClick]
  );

  const handleDatesSet = useCallback((arg: any) => {
    setSelectedDate(arg.start);
  }, []);

  const renderEventContent = useCallback((eventInfo: any) => {
    const isBooked = eventInfo.event.extendedProps.isBooked;
    const startTime = format(eventInfo.event.start, 'h:mm a');
    const endTime = format(eventInfo.event.end, 'h:mm a');

    return (
      <div className="event-content p-2">
        <div className="event-status flex items-center gap-2 text-sm font-medium">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              isBooked ? 'bg-red-500' : 'bg-green-500'
            )}
          />
          {isBooked ? 'Booked' : 'Available'}
        </div>
        <div className="event-time flex items-center gap-1 text-sm mt-1">
          <CalendarIcon className="h-3 w-3" />
          <span>
            {startTime} - {endTime}
          </span>
        </div>
      </div>
    );
  }, []);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600" />
              Available
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              Booked
            </span>
          </AlertDescription>
        </Alert>

   
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-6 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={view}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
            }}
            slotDuration="01:00:00"
            slotMinTime="06:00:00"
            slotMaxTime="21:00:00"
            eventClick={handleEventClick}
            events={[...currentEvents, ...appointments]}
            allDaySlot={false}
            nowIndicator
            height="700px"
            expandRows
            stickyHeaderDates
            datesSet={handleDatesSet}
            slotLabelFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short',
            }}
            dayHeaderFormat={{
              weekday: 'short',
              month: 'numeric',
              day: 'numeric',
              omitCommas: true,
            }}
            eventContent={renderEventContent}
            eventClassNames={arg => [
              'cursor-pointer hover:opacity-90 transition-opacity rounded-md overflow-hidden border',
              arg.event.extendedProps.isBooked
                ? 'booked-slot'
                : 'available-slot',
            ]}
            slotLabelClassNames="text-sm font-medium"
            dayHeaderClassNames="text-sm font-medium"
          />
        </CardContent>
      </Card>
    </div>
  );
}
