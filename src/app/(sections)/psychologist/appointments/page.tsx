'use client';

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar, ListTodo } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AppointmentCard } from '@/components/AppointmentCard';
import AppointmentDialog from '@/components/AppointmentDialog';
import AvailabilitySettings from '@/components/AvailabilitySettings';
import { CalendarStyles } from '@/components/CalenderStyles';

import { Appointment } from '@/types/types';
import AvailabilitySettingsSkeleton from '@/components/AvailabilitySettingsSkeleton';

interface AvailabilitySlot {
  id: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
}

export default function PsychologistAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availabilitySlots, setAvailabilitySlots] = useState<
    AvailabilitySlot[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [view, setView] = useState('calendar');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchAppointments(), fetchAvailability()]);
    } catch (error) {
      toast.error('Error loading initial data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/psychologist/appointments');
      const data = await response.json();

      if (data.IsSuccess) {
        setAppointments(data.Result.appointments);
      } else {
        toast.error('Failed to fetch appointments');
      }
    } catch (error) {
      toast.error('Error loading appointments');
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await fetch('/api/availability');
      const data = await response.json();

      if (data.IsSuccess) {
        setAvailabilitySlots(data.Result.availability);
      }
    } catch (error) {
      toast.error('Error loading availability');
    }
  };

  const formatCalendarEvents = () => {
    const events: Array<{
      id: string;
      title: string;
      start: string;
      end: string;
      backgroundColor: string;
      borderColor: string;
      textColor: string;
      classNames: string[];
      display?: string;
    }> = [];

    events.push(
      ...appointments.map(apt => ({
        id: apt._id,
        title: `${apt.userId.profile.firstName} ${apt.userId.profile.lastName}`,
        start: apt.dateTime,
        end: new Date(
          new Date(apt.dateTime).getTime() + apt.duration * 60000
        ).toISOString(),
        backgroundColor:
          apt.status === 'confirmed' ? 'rgb(5, 150, 105)' : 'rgb(37, 99, 235)',
        borderColor:
          apt.status === 'confirmed' ? 'rgb(5, 150, 105)' : 'rgb(37, 99, 235)',
        textColor: '#ffffff',
        classNames: [
          apt.status === 'confirmed' ? 'confirmed-event' : 'booked-event',
        ],
      }))
    );

    const currentDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    availabilitySlots.forEach(slot => {
      let date = new Date(currentDate);

      while (date <= endDate) {
        if (slot.daysOfWeek.includes(date.getDay())) {
          const [startHour, startMinute] = slot.startTime.split(':');
          const [endHour, endMinute] = slot.endTime.split(':');

          const hasAppointment = appointments.some(apt => {
            const aptDate = new Date(apt.dateTime);
            return (
              aptDate.getDate() === date.getDate() &&
              aptDate.getMonth() === date.getMonth() &&
              aptDate.getFullYear() === date.getFullYear() &&
              aptDate.getHours() >= parseInt(startHour) &&
              aptDate.getHours() < parseInt(endHour)
            );
          });

          if (!hasAppointment) {
            const start = new Date(date);
            start.setHours(parseInt(startHour), parseInt(startMinute), 0);

            const end = new Date(date);
            end.setHours(parseInt(endHour), parseInt(endMinute), 0);

            events.push({
              id: `availability-${slot.id}-${date.toISOString()}`,
              title: 'Available',
              start: start.toISOString(),
              end: end.toISOString(),
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              borderColor: 'rgb(239, 68, 68)',
              textColor: 'rgb(239, 68, 68)',
              classNames: ['availability-slot'],
              display: 'block',
            });
          }
        }
        date.setDate(date.getDate() + 1);
      }
    });

    return events;
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsAppointmentModalOpen(true);
  };

  if (isLoading) {
    return <AvailabilitySettingsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {CalendarStyles()}

      <AvailabilitySettings onRefresh={fetchInitialData} />

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
                  <span>Upcoming Patients</span>
                  {appointments.length > 0 && (
                    <Badge variant="default">{appointments.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              <div className="flex gap-2">
                <Badge variant="outline" className="gap-1">
                  <div className="w-2 h-2 rounded-full bg-[rgb(5,150,105)]" />
                  Confirmed
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <div className="w-2 h-2 rounded-full bg-[rgb(37,99,235)]" />
                  Booked
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <div className="w-2 h-2 rounded-full bg-[rgb(239,68,68)]" />
                  Available
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-8 mb-4">
              <div className="flex-1 dark:bg-red-950/30 border-l-4 border-red-500 p-3">
                <p className="text-red-500 text-sm font-medium">
                  Available slots in red
                </p>
              </div>

              <div className="flex-1 dark:bg-blue-950/30 border-l-4 border-blue-500 p-3">
                <p className="text-blue-500 text-sm font-medium">
                  Booked slots in blue
                </p>
              </div>

              <div className="flex-1 dark:bg-emerald-950/30 border-l-4 border-emerald-500 p-3">
                <p className="text-emerald-500 text-sm font-medium">
                  Confirmed slots in green
                </p>
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
                  events={formatCalendarEvents()}
                  eventClick={info => {
                    if (!info.event.id.startsWith('availability-')) {
                      const appointment = appointments.find(
                        apt => apt._id === info.event.id
                      );
                      if (appointment) handleAppointmentClick(appointment);
                    }
                  }}
                  allDaySlot={false}
                  nowIndicator
                  height="100%"
                />
              </div>
            </TabsContent>

            <TabsContent value="list" className="mt-4">
              <div className="space-y-4">
                {appointments.map(appointment => (
                  <AppointmentCard
                    key={appointment._id}
                    appointment={appointment}
                    onClick={() => handleAppointmentClick(appointment)}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AppointmentDialog
        appointment={selectedAppointment}
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        onJoinSession={link => window.open(link, '_blank')}
      />
    </div>
  );
}
