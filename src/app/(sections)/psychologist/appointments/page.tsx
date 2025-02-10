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

import { Appointment, Availability } from '@/types/types';
import AvailabilitySettingsSkeleton from '@/components/AvailabilitySettingsSkeleton';

export default function PsychologistAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [view, setView] = useState('calendar');
  const [availability, setAvailability] = useState<Availability>({
    daysOfWeek: [],
    timeSlots: [],
  });

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
        processAvailabilityData(data.Result.availability);
      }
    } catch (error) {
      toast.error('Error loading availability');
    }
  };

  const processAvailabilityData = (availabilityData: any) => {
    const days = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const daysOfWeek: number[] = [];
    const timeSlots: any[] = [];

    days.forEach((day, index) => {
      const dayData = availabilityData[day];
      if (dayData?.available) {
        daysOfWeek.push(index);

        const slots = Array.isArray(dayData.timeSlots)
          ? dayData.timeSlots
          : [{ startTime: dayData.startTime, endTime: dayData.endTime }];

        timeSlots.push({
          dayOfWeek: index,
          timeSlots: slots,
        });
      }
    });

    setAvailability({ daysOfWeek, timeSlots });
  };

  const formatCalendarEvents = () => {
    return appointments.map(apt => ({
      id: apt._id,
      title: `${apt.userId.profile.firstName} ${apt.userId.profile.lastName}`,
      start: apt.dateTime,
      end: new Date(
        new Date(apt.dateTime).getTime() + apt.duration * 60000
      ).toISOString(),
      backgroundColor:
        apt.status === 'confirmed' ? 'rgb(var(--primary))' : '#94a3b8',
      borderColor:
        apt.status === 'confirmed' ? 'rgb(var(--primary))' : '#94a3b8',
      textColor: '#ffffff',
      classNames: ['appointment-event'],
    }));
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

      <AvailabilitySettings onRefresh={fetchAppointments} />

      <Card>
        <CardContent className="p-4">
          <Tabs value={view} onValueChange={setView}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="calendar" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendar View
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <ListTodo className="h-4 w-4" />
                  List View
                </TabsTrigger>
              </TabsList>

              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                Confirmed Appointments
              </Badge>
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
                    const appointment = appointments.find(
                      apt => apt._id === info.event.id
                    );
                    if (appointment) handleAppointmentClick(appointment);
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
