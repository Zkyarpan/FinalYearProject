'use client';

import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  extendedProps: {
    type: string;
    psychologistId: string;
    psychologistName?: string;
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
    isBooked?: boolean;
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
  onEventClick: (info: any) => void;
}

export function CalendarView({
  appointments = [],
  availableSlots = [],
  onEventClick,
}: CalendarViewProps) {
  const [currentEvents, setCurrentEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate]);

  const fetchSlots = async (date: Date) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/availability');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch availability');
      }

      if (data.IsSuccess && data.Result.events) {
        const formattedEvents = data.Result.events.map((event: any) => {
          const psychologist = data.Result.availability.find(
            (a: any) =>
              a.psychologistId._id === event.extendedProps.psychologistId
          )?.psychologistId;

          return {
            ...event,
            start: new Date(event.start),
            end: new Date(event.end),
            extendedProps: {
              ...event.extendedProps,
              type: 'availability',
              psychologistName: event.extendedProps.psychologistName,
              firstName: psychologist?.firstName,
              lastName: psychologist?.lastName,
              about: event.extendedProps.about || psychologist?.about,
              languages:
                event.extendedProps.languages || psychologist?.languages,
              sessionDuration:
                event.extendedProps.sessionDuration ||
                psychologist?.sessionDuration,
              sessionFee:
                event.extendedProps.sessionFee || psychologist?.sessionFee,
              sessionFormats:
                event.extendedProps.sessionFormats ||
                psychologist?.sessionFormats,
              specializations:
                event.extendedProps.specializations ||
                psychologist?.specializations,
              acceptsInsurance:
                event.extendedProps.acceptsInsurance ||
                psychologist?.acceptsInsurance,
              insuranceProviders:
                event.extendedProps.insuranceProviders ||
                psychologist?.insuranceProviders,
              licenseType:
                event.extendedProps.licenseType || psychologist?.licenseType,
              yearsOfExperience:
                event.extendedProps.yearsOfExperience ||
                psychologist?.yearsOfExperience,
              profilePhotoUrl:
                event.extendedProps.profilePhotoUrl ||
                psychologist?.profilePhotoUrl,
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
  };

  const handleEventClick = (info: any) => {
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
  };

  const handleDatesSet = (arg: any) => {
    setSelectedDate(arg.start);
  };

  const renderEventContent = (eventInfo: any) => {
    const isBooked = eventInfo.event.extendedProps.isBooked;
    const startTime = format(eventInfo.event.start, 'h:mm a');
    const endTime = format(eventInfo.event.end, 'h:mm a');
    const doctorName = eventInfo.event.extendedProps.psychologistName;

    return (
      <div className="p-2 h-full">
        <div className="font-medium text-sm">
          {!isBooked ? (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-700"></div>
                Available
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              Booked
            </div>
          )}
        </div>
        <div className="text-xs mt-1 flex items-center gap-1">
          <CalendarIcon className="h-3 w-3" />
          {startTime} - {endTime}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#166534]"></div>
            Available
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
            Booked
          </span>
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-6">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'timeGridWeek,timeGridDay',
            }}
            slotDuration="01:00:00"
            slotMinTime="06:00:00"
            slotMaxTime="21:00:00"
            eventClick={handleEventClick}
            events={[...currentEvents, ...appointments]}
            allDaySlot={false}
            nowIndicator
            height="700px"
            expandRows={true}
            stickyHeaderDates={true}
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
            eventClassNames="cursor-pointer hover:opacity-90 transition-opacity"
            slotLabelClassNames="text-sm font-medium"
            dayHeaderClassNames="text-sm font-medium"
          />
        </CardContent>
      </Card>
    </div>
  );
}
