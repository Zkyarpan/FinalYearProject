'use client';

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar, ListTodo } from 'lucide-react';
import { toast } from 'sonner';
import { EventInput } from '@fullcalendar/core';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AppointmentCard } from '@/components/AppointmentCard';
import AppointmentDialog from '@/components/AppointmentDialog';
import { CalendarStyles } from '@/components/CalenderStyles';
import { Appointment } from '@/types/types';

function renderEventContent(eventInfo) {
  const event = eventInfo.event;
  const startTime = new Date(event.start).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const endTime = new Date(event.end).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="p-2 h-full">
      <div className="font-medium text-sm">
        {event.extendedProps.type === 'appointment' ? (
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${getStatusDotColor(
                event.extendedProps.status
              )}`}
            />
            {event.extendedProps.appointmentDetails.patientName}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Available
          </div>
        )}
      </div>
      <div className="text-xs mt-1">
        {startTime} - {endTime}
      </div>
    </div>
  );
}

function getStatusDotColor(status) {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return 'bg-emerald-500';
    case 'booked':
      return 'bg-blue-500';
    default:
      return 'bg-red-500';
  }
}

function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return {
        bg: 'rgba(16, 185, 129, 0.1)',
        border: 'rgb(16, 185, 129)',
        text: 'rgb(6, 95, 70)',
      };
    case 'booked':
      return {
        bg: 'rgba(59, 130, 246, 0.1)',
        border: 'rgb(59, 130, 246)',
        text: 'rgb(30, 64, 175)',
      };
    default:
      return {
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgb(239, 68, 68)',
        text: 'rgb(153, 27, 27)',
      };
  }
}

export default function PsychologistAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<EventInput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [view, setView] = useState('calendar');
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(new Date().setDate(new Date().getDate() + 7)),
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [appointmentsRes, availabilityRes] = await Promise.all([
        fetch('/api/psychologist/appointments').then(res => res.json()),
        fetch('/api/availability').then(res => res.json()),
      ]);

      if (appointmentsRes.IsSuccess && availabilityRes.IsSuccess) {
        const appointments = appointmentsRes.Result.appointments;
        setAppointments(appointments);

        // Combine availability slots and appointments
        const events = [
          ...(availabilityRes.Result.events || []).map(event => ({
            ...event,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: 'rgb(16, 185, 129)',
            textColor: 'rgb(6, 95, 70)',
            display: 'block',
          })),
          ...appointments.map(apt => {
            const colors = getStatusColor(apt.status);
            return {
              id: apt._id,
              title: apt.patientName,
              start: new Date(apt.startTime),
              end: new Date(apt.endTime),
              backgroundColor: colors.bg,
              borderColor: colors.border,
              textColor: colors.text,
              extendedProps: {
                type: 'appointment',
                status: apt.status,
                appointmentDetails: apt,
              },
            };
          }),
        ];

        setCalendarEvents(events);
      }
    } catch (error) {
      toast.error('Error loading calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventClick = info => {
    const eventType = info.event.extendedProps.type;
    if (eventType === 'appointment') {
      setSelectedAppointment(info.event.extendedProps.appointmentDetails);
      setIsAppointmentModalOpen(true);
    }
  };

  const handleDatesSet = arg => {
    setDateRange({
      start: arg.start,
      end: arg.end,
    });
  };

  return (
    <div className="min-h-screen bg-background mt-5">
      {CalendarStyles()}

      <Card>
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
                    <Badge variant="default">{appointments.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <Badge variant="outline" className="gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Available
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Booked
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Cancelled
                </Badge>
              </div>
            </div>

            <TabsContent value="calendar" className="mt-4">
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
                  slotMinTime="06:00:00"
                  slotMaxTime="21:00:00"
                  events={calendarEvents}
                  eventClick={handleEventClick}
                  datesSet={handleDatesSet}
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
                  eventClassNames="cursor-pointer hover:opacity-90 transition-opacity"
                  slotLabelClassNames="text-sm font-medium"
                  dayHeaderClassNames="text-sm font-medium"
                />
              </div>
            </TabsContent>

            <TabsContent value="list" className="mt-4">
              <div className="space-y-4">
                {appointments.map(appointment => (
                  <AppointmentCard
                    key={appointment._id}
                    appointment={appointment}
                    onClick={() => {
                      setSelectedAppointment(appointment);
                      setIsAppointmentModalOpen(true);
                    }}
                  />
                ))}
                {appointments.length === 0 && (
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
}
