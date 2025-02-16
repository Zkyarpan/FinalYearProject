import { EventInput } from '@fullcalendar/core';

export interface CalendarEvent extends EventInput {
  id?: string;
  title: string;
  start: Date | string;
  end: Date | string;
  display?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  className?: string;
  extendedProps?: {
    isBooked?: boolean;
    psychologistId?: string;
    sessionFee?: number;
    [key: string]: any;
  };
}

export interface CalendarViewProps {
  appointments: CalendarEvent[];
  availableSlots: CalendarEvent[];
  onEventClick: (info: { event: CalendarEvent }) => void;
  className?: string;
}
