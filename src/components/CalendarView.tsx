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
  const [currentEvents, setCurrentEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState('timeGridWeek');

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

  const mergeAndProcessEvents = useCallback(
    (availabilityEvents, appointmentEvents) => {
      // Create a map of appointments by time slot
      const appointmentMap = new Map();
      appointmentEvents.forEach(apt => {
        const key = `${new Date(apt.start).toISOString()}-${new Date(
          apt.end
        ).toISOString()}`;
        appointmentMap.set(key, apt);
      });

      // Process availability events, marking them as booked if there's a matching appointment
      const processedEvents = availabilityEvents.map(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        const timeKey = `${eventStart.toISOString()}-${eventEnd.toISOString()}`;
        const hasAppointment = appointmentMap.has(timeKey);

        // If there's an appointment for this slot, use appointment data
        if (hasAppointment) {
          const appointment = appointmentMap.get(timeKey);
          return {
            ...event,
            title: appointment.title,
            ...eventColors.booked,
            extendedProps: {
              ...event.extendedProps,
              isBooked: true,
            },
          };
        }

        // Otherwise, keep it as an available slot
        return {
          ...event,
          ...eventColors.available,
          extendedProps: {
            ...event.extendedProps,
            isBooked: false,
          },
        };
      });

      return processedEvents;
    },
    [eventColors]
  );

  const fetchSlots = useCallback(
    async date => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/availability');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch availability');
        }

        if (data.IsSuccess && data.Result.events) {
          const processedEvents = mergeAndProcessEvents(
            data.Result.events,
            appointments
          );
          setCurrentEvents(processedEvents);
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
    [appointments, mergeAndProcessEvents]
  );

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate, appointments, fetchSlots]);

  const handleEventClick = useCallback(
    info => {
      if (!info.event.extendedProps.isBooked) {
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

  const renderEventContent = useCallback(eventInfo => {
    const isBooked = eventInfo.event.extendedProps.isBooked;
    const startTime = format(eventInfo.event.start, 'h');
    const endTime = format(eventInfo.event.end, 'h');
    const period = format(eventInfo.event.end, 'a');

    return (
      <div className="px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              'w-1.5 h-1.5 rounded-full shrink-0',
              isBooked ? 'bg-red-500' : 'bg-green-500'
            )}
          />
          <span className="text-sm font-semibold main-font">
            {isBooked ? 'Booked' : 'Available'}
          </span>
        </div>
        <div className="flex items-center text-sm mt-0.5 text-black dark:text-white main-font">
          <CalendarIcon className="h-2.5 w-2.5 mr-1 text-black dark:text-white" />
          <span>
            {startTime} - {endTime} {period}
          </span>
        </div>
      </div>
    );
  }, []);
  return (
    <div className={cn('space-y-4', className)}>
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

      <Card>
        <CardContent className="p-6 relative">
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
            events={currentEvents}
            allDaySlot={false}
            nowIndicator
            height="700px"
            expandRows
            stickyHeaderDates
            datesSet={arg => setSelectedDate(arg.start)}
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

