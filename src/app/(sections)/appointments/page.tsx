'use client';

import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, parseISO, addDays, startOfWeek } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { CalendarStyles } from '@/components/CalenderStyles';

export default function AppointmentScheduler() {
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
    psychologistId: string;
    psychologistName: string;
  } | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    title: '',
    notes: '',
    patientName: '',
  });

  useEffect(() => {
    fetchAvailability();
    fetchAppointments();
  }, []);

  interface Event {
    title: string;
    start: Date;
    end: Date;
    extendedProps: any;
    display: string;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    classNames: string[];
  }

  const generateRecurringEvents = (availability: any[]): Event[] => {
    const events: Event[] = [];
    const currentDate = startOfWeek(new Date());

    availability.forEach(slot => {
      slot.daysOfWeek.forEach(day => {
        // Generate events for the next 4 weeks
        for (let week = 0; week < 4; week++) {
          const date = addDays(currentDate, day + week * 7);
          const startDateTime = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            parseInt(slot.startTime.split(':')[0]),
            parseInt(slot.startTime.split(':')[1])
          );
          const endDateTime = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            parseInt(slot.endTime.split(':')[0]),
            parseInt(slot.endTime.split(':')[1])
          );

          events.push({
            title: `Available with ${slot.extendedProps.psychologistName}`,
            start: startDateTime,
            end: endDateTime,
            extendedProps: {
              ...slot.extendedProps,
              type: 'availability',
            },
            display: 'block',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: 'rgba(59, 130, 246, 0.25)',
            textColor: '#1e40af',
            classNames: ['available-slot'],
          });
        }
      });
    });

    return events;
  };

  const fetchAvailability = async () => {
    try {
      const response = await fetch('/api/availability', {
        credentials: 'include',
      });
      const data = await response.json();

      if (data.IsSuccess) {
        const recurringEvents = generateRecurringEvents(
          data.Result.availability
        );
        setAvailableSlots(recurringEvents);
      } else {
        toast.error('Failed to fetch availability');
      }
    } catch (error) {
      console.error('Availability fetch error:', error);
      toast.error('Failed to fetch available slots');
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments/my', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.IsSuccess) {
        const formattedAppointments = data.Result.appointments.map(apt => ({
          ...apt,
          start: new Date(apt.start),
          end: new Date(apt.end),
          backgroundColor: '#e2e8f0',
          borderColor: '#cbd5e1',
          textColor: '#1e293b',
          display: 'block',
        }));
        setAppointments(formattedAppointments);
      }
    } catch (error) {
      toast.error('Failed to fetch appointments');
    }
  };

  const handleEventClick = info => {
    if (info.event.extendedProps.type !== 'availability') return;

    setSelectedSlot({
      start: info.event.start,
      end: info.event.end,
      psychologistId: info.event.extendedProps.psychologistId,
      psychologistName: info.event.extendedProps.psychologistName,
    });
    setShowBookingDialog(true);
  };

  const handleBooking = async () => {
    if (!bookingDetails.title || !bookingDetails.patientName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psychologistId: selectedSlot?.psychologistId,
          ...bookingDetails,
          start: selectedSlot?.start.toISOString(),
          end: selectedSlot?.end.toISOString(),
        }),
      });

      const data = await response.json();
      if (data.IsSuccess) {
        toast.success('Appointment booked successfully');
        setShowBookingDialog(false);
        fetchAppointments();
        setBookingDetails({ title: '', notes: '', patientName: '' });
      } else {
        toast.error(data.ErrorMessage?.[0]?.message || 'Booking failed');
      }
    } catch (error) {
      toast.error('Failed to book appointment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto p-4 space-y-4">
      {CalendarStyles()}
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Schedule Appointment
        </h1>
        <p className="text-sm text-muted-foreground">
          Select an available time slot (highlighted in blue) to schedule your
          appointment
        </p>
      </div>

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
            events={[...appointments, ...availableSlots]}
            allDaySlot={false}
            nowIndicator
            height="600px"
            scrollTime="09:00:00"
          />
        </CardContent>
      </Card>

      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">Book Appointment</DialogTitle>
          </DialogHeader>

          {selectedSlot && (
            <div className="space-y-3">
              <div className="bg-secondary/20 p-2 rounded-sm space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  <span>{format(selectedSlot.start, 'EEE, MMM d')}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {format(selectedSlot.start, 'h:mm a')} -{' '}
                    {format(selectedSlot.end, 'h:mm a')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <User className="h-3.5 w-3.5" />
                  <span className="text-sm text-foreground">
                    {selectedSlot.psychologistName}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Appointment Type</Label>
                  <Input
                    id="title"
                    value={bookingDetails.title}
                    onChange={e =>
                      setBookingDetails({
                        ...bookingDetails,
                        title: e.target.value,
                      })
                    }
                    placeholder="e.g., Initial Consultation"
                    className="h-8 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Patient Name</Label>
                  <Input
                    id="name"
                    value={bookingDetails.patientName}
                    onChange={e =>
                      setBookingDetails({
                        ...bookingDetails,
                        patientName: e.target.value,
                      })
                    }
                    placeholder="Enter your full name"
                    className="h-8 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={bookingDetails.notes}
                    onChange={e =>
                      setBookingDetails({
                        ...bookingDetails,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Any specific concerns or requests?"
                    className="h-16 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowBookingDialog(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBooking}
              disabled={isLoading}
              className="h-8 text-xs"
            >
              {isLoading ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
