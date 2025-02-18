'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Sun, Cloud, Sunset, Moon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { getAppointmentCountByPeriod } from '@/utils/getAppointmentCountByPeriod';
import { CalendarEvent } from '@/types/calendar';

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
  const [selectedPeriod, setSelectedPeriod] = useState('MORNING');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

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

  // Update the mergeAndProcessEvents function
  const mergeAndProcessEvents = useCallback(
    (availabilityEvents, appointmentEvents) => {
      // Process availability events, using the isBooked status from the API
      const processedEvents = availabilityEvents.map(event => {
        // Check if the slot is booked directly from the API response
        const isBooked = event.extendedProps?.isBooked || false;

        return {
          ...event,
          ...(isBooked ? eventColors.booked : eventColors.available),
          extendedProps: {
            ...event.extendedProps,
            isBooked,
          },
        };
      });

      return processedEvents;
    },
    [eventColors]
  );

  // Update the fetchSlots function to handle the API response properly
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
      <Tabs
        defaultValue={selectedPeriod}
        onValueChange={setSelectedPeriod}
        className="w-full"
      >
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
      </Tabs>

      <Alert>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600" />
            Available
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            Booked
          </span>
        </div>
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
            slotMinTime={TIME_PERIODS[selectedPeriod].start}
            slotMaxTime={TIME_PERIODS[selectedPeriod].end}
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
