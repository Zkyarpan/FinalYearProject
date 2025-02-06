import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CalendarDays, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface BookingDialogProps {
  psychologist: {
    id: string;
    firstName: string;
    lastName: string;
    availability: Record<
      string,
      { available: boolean; startTime?: string; endTime?: string }
    >;
    sessionDuration: number;
    sessionFee: number;
  };
  onBookingComplete: () => void;
}

export function BookingDialog({
  psychologist,
  onBookingComplete,
}: BookingDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  const getAvailableTimeSlots = (date: Date) => {
    const dayName = format(date, 'EEEE').toLowerCase();
    const dayAvailability = psychologist.availability[dayName];

    if (!dayAvailability?.available) return [];

    const slots: string[] = [];
    const startTime = new Date(`2000-01-01T${dayAvailability.startTime}`);
    const endTime = new Date(`2000-01-01T${dayAvailability.endTime}`);

    let currentTime = startTime;
    while (currentTime < endTime) {
      slots.push(format(currentTime, 'HH:mm'));
      currentTime = new Date(
        currentTime.getTime() + psychologist.sessionDuration * 60000
      );
    }

    return slots;
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psychologistId: psychologist.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          startTime: selectedTime,
          duration: psychologist.sessionDuration,
          amount: psychologist.sessionFee,
        }),
      });

      if (!response.ok) throw new Error('Booking failed');

      onBookingComplete();
    } catch (error) {
      console.error('Booking error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">
          <CalendarDays className="mr-2 h-4 w-4" />
          Book Consultation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule a Consultation</DialogTitle>
          <DialogDescription>
            Choose an available time slot with Dr. {psychologist.firstName}{' '}
            {psychologist.lastName}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={date => {
              const dayName = format(date, 'EEEE').toLowerCase();
              return !psychologist.availability[dayName]?.available;
            }}
            className="rounded-md border"
          />

          {selectedDate && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {getAvailableTimeSlots(selectedDate).map(time => (
                <Button
                  key={time}
                  variant={selectedTime === time ? 'default' : 'outline'}
                  className="w-full"
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="default"
            className="w-full"
            disabled={!selectedDate || !selectedTime || isLoading}
            onClick={handleBooking}
          >
            {isLoading ? 'Booking...' : 'Confirm Booking'}
          </Button>
          <Button variant="outline" className="w-full">
            <Mail className="mr-2 h-4 w-4" />
            Request Custom Time
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
