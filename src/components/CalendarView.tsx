'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Sun, Cloud, Sunset, Moon, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { NewAvailabilityAlert } from './AvailabilityNotificationBadge';
import { getAppointmentCountByPeriod } from '@/utils/getAppointmentCountByPeriod';
import { CalendarEvent } from '@/types/calendar';
import { EventApi } from '@fullcalendar/core';
import { toast } from 'sonner';

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
  appointments: CalendarEvent[];
  availableSlots: CalendarEvent[];
  onEventClick: (info: { event: any }) => void;
  className?: string;
  newAvailabilityData?: {
    psychologistId: string;
    timestamp: string;
    psychologistName?: string;
  } | null;
  highlightedSlots?: Set<string>;
  onDismissHighlight?: () => void;
}

export function CalendarView({
  appointments = [],
  availableSlots = [],
  onEventClick,
  className,
  newAvailabilityData = null,
  highlightedSlots = new Set(),
  onDismissHighlight = () => {},
}: CalendarViewProps) {
  const [currentEvents, setCurrentEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPeriod, setSelectedPeriod] = useState('MORNING');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState('timeGridWeek');

  // Count new slots by time period
  const newSlotsByPeriod = useMemo(() => {
    if (!newAvailabilityData || !availableSlots?.length) {
      return {
        MORNING: 0,
        AFTERNOON: 0,
        EVENING: 0,
        NIGHT: 0,
      };
    }

    const counts = {
      MORNING: 0,
      AFTERNOON: 0,
      EVENING: 0,
      NIGHT: 0,
    };

    availableSlots.forEach(slot => {
      // Skip booked slots and slots from other psychologists
      if (
        slot.extendedProps?.isBooked ||
        slot.extendedProps?.psychologistId !==
          newAvailabilityData.psychologistId
      ) {
        return;
      }

      const slotTime = slot.start ? new Date(slot.start).getHours() : 0;

      if (slotTime >= 0 && slotTime < 12) {
        counts.MORNING++;
      } else if (slotTime >= 12 && slotTime < 17) {
        counts.AFTERNOON++;
      } else if (slotTime >= 17 && slotTime < 21) {
        counts.EVENING++;
      } else {
        counts.NIGHT++;
      }
    });

    return counts;
  }, [newAvailabilityData, availableSlots]);

  // Update the mergeAndProcessEvents function
  const mergeAndProcessEvents = useCallback(
    (availabilityEvents, appointmentEvents) => {
      // Process availability events, using the isBooked status from the API
      const processedEvents = availabilityEvents.map(event => {
        // Check if the slot is booked directly from the API response
        const isBooked = event.extendedProps?.isBooked || false;

        // Determine if this is a newly added slot
        const isNewlyAdded = highlightedSlots.has(
          event.id || `${event.start}-${event.extendedProps?.psychologistId}`
        );

        return {
          ...event,
          backgroundColor: isBooked
            ? 'rgba(239, 68, 68, 0.1)'
            : 'rgba(34, 197, 94, 0.1)',
          borderColor: isBooked
            ? 'rgba(239, 68, 68, 0.25)'
            : isNewlyAdded
            ? 'rgb(59, 130, 246)'
            : 'rgba(34, 197, 94, 0.25)',
          textColor: isBooked ? '#dc2626' : '#166534',
          extendedProps: {
            ...event.extendedProps,
            isBooked,
            isNewlyAdded,
          },
        };
      });

      return processedEvents;
    },
    [highlightedSlots]
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
  }, [selectedDate, appointments, fetchSlots, highlightedSlots]);

  const handleEventClick = useCallback(
    info => {
      // Check if the event is in the past
      const now = new Date();
      const eventStart = new Date(info.event.start);
      const isPast = eventStart < now;

      // Only allow clicking on future events that aren't booked
      if (!isPast && !info.event.extendedProps.isBooked) {
        const clickedEvent = {
          start: info.event.start,
          end: info.event.end,
          ...info.event.extendedProps,
        };
        onEventClick({ event: clickedEvent });
      } else if (isPast) {
        // Optional: Show toast notification that past slots cannot be booked
        toast.info('Cannot book appointments in the past');
      }
    },
    [onEventClick]
  );

  const renderEventContent = useCallback(eventInfo => {
    const isBooked = eventInfo.event.extendedProps.isBooked;
    const isNewlyAdded = eventInfo.event.extendedProps.isNewlyAdded;
    const now = new Date();
    const isPast = new Date(eventInfo.event.start) < now;

    const startTime = format(eventInfo.event.start, 'h:mm');
    const endTime = format(eventInfo.event.end, 'h:mm');
    const period = format(eventInfo.event.end, 'a');

    return (
      <div
        className={`
          p-3 rounded-lg shadow-sm 
          ${
            isPast
              ? 'bg-gray-100 dark:bg-gray-800/20 border-l-2 border-gray-400 opacity-60'
              : isBooked
              ? 'bg-red-50 dark:bg-red-900/20 border-l-2 border-red-500'
              : 'bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500'
          } 
          ${
            isNewlyAdded && !isPast
              ? 'border-2 border-blue-500 pulse-animation'
              : ''
          }
          transition-all hover:shadow-md ${
            isPast ? 'cursor-not-allowed' : 'cursor-pointer'
          }
        `}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <div
              className={`
                w-3 h-3 rounded-full shrink-0
                ${
                  isPast
                    ? 'bg-gray-400'
                    : isBooked
                    ? 'bg-red-500'
                    : 'bg-green-500'
                }
              `}
            />
            {!isBooked && !isPast && (
              <span
                className={`absolute inset-0 rounded-full bg-green-400 opacity-75 ${
                  isNewlyAdded ? 'animate-ping' : ''
                }`}
              ></span>
            )}
          </div>
          <span
            className={`
              text-sm font-medium
              ${
                isPast
                  ? 'text-gray-500 dark:text-gray-400'
                  : isBooked
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-green-700 dark:text-green-300'
              }
            `}
          >
            {isPast
              ? 'Past'
              : isBooked
              ? 'Booked'
              : isNewlyAdded
              ? 'New!'
              : 'Available'}
          </span>
        </div>

        <div className="flex items-center text-sm mt-0.5">
          <span
            className={cn(
              isPast
                ? 'text-gray-600 dark:text-gray-400'
                : isBooked
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
    <div className={cn('space-y-4', className)}>
      <Tabs
        defaultValue={selectedPeriod}
        onValueChange={setSelectedPeriod}
        className="w-full"
      >
        <div className="flex w-full mb-4">
          <TabsList className="w-full grid grid-cols-4 p-1 h-12 dark:bg-input">
            {Object.entries(TIME_PERIODS).map(
              ([key, { label, icon: Icon }]) => {
                const hasNewSlots = newSlotsByPeriod[key] > 0;

                return (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className={cn(
                      'flex items-center justify-center gap-2 h-full',
                      'rounded-md transition-all duration-200',
                      hasNewSlots &&
                        'relative after:absolute after:top-1 after:right-1 after:w-2 after:h-2 after:bg-blue-500 after:rounded-full after:animate-pulse'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        className={cn(
                          'h-4 w-4',
                          hasNewSlots && 'text-blue-500'
                        )}
                      />
                      <span>{label}</span>
                    </div>

                    {hasNewSlots && (
                      <Badge
                        variant="default"
                        className="bg-blue-500 hover:bg-blue-500/90 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-medium"
                      >
                        {newSlotsByPeriod[key]}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              }
            )}
          </TabsList>
        </div>
      </Tabs>

      {/* New availability alert banner */}
      {highlightedSlots.size > 0 && newAvailabilityData && (
        <NewAvailabilityAlert
          newAvailabilityData={newAvailabilityData}
          onDismiss={onDismissHighlight}
        />
      )}

      <div className="py-3">
        <div className="flex items-center gap-4">
          <div className="flex-1 border dark:border-[#333333] rounded-lg overflow-hidden flex">
            <div className="w-2 bg-green-600" />
            <div className="px-4 py-2">
              <span className="text-sm">
                Available slots: Ready for new appointments
              </span>
            </div>
          </div>
          <div className="flex-1 border dark:border-[#333333] rounded-lg overflow-hidden flex">
            <div className="w-2 bg-red-500" />
            <div className="px-4 py-2">
              <span className="text-sm">
                Booked slots: Already scheduled appointments
              </span>
            </div>
          </div>
        </div>
      </div>

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
            slotDuration="00:15:00"
            slotLabelInterval="01:00:00"
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
              arg.event.extendedProps.isNewlyAdded
                ? 'new-availability pulse-border'
                : '',
              `duration-${arg.event.extendedProps.sessionDuration || 60}`,
            ]}
            slotLabelClassNames="text-sm font-medium"
            dayHeaderClassNames="text-sm font-medium"
          />
        </CardContent>
      </Card>
    </div>
  );
}
