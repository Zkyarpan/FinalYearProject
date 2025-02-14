'use client';

import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarView } from '@/components/CalendarView';
import { BookingForm } from '@/components/BookingForm';
import { PsychologistDetails } from '@/components/PsychologistDetails';
import { PaymentForm } from '@/components/payment-form';
import AppointmentManager from '@/components/AppointmentManager';
import { CalendarStyles } from '@/components/CalenderStyles';
import {
  AppointmentEvent,
  SelectedSlot,
  BookingDetails,
} from '@/types/appointment';
import { checkAvailability } from '@/helpers/checkAvailability';
import { CalendarEvent } from '@/types/calendar';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function AppointmentScheduler() {
  const [appointments, setAppointments] = useState<CalendarEvent[]>([]);
  const [availableSlots, setAvailableSlots] = useState<CalendarEvent[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState('details');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { firstName, lastName, email } = useUserStore();

  const [bookingDetails, setBookingDetails] = useState<BookingDetails>({
    title: '',
    notes: '',
    patientName: '',
    email: '',
    phone: '',
    sessionFormat: 'video',
    insuranceProvider: '',
    reasonForVisit: '',
  });

  useEffect(() => {
    fetchAppointments();
    fetchAvailability();
  }, []);

  useEffect(() => {
    if (showBookingDialog) {
      const fullName = `${firstName} ${lastName}`.trim();
      setBookingDetails(prev => ({
        ...prev,
        patientName: fullName,
        email: email || '',
      }));
    }
  }, [showBookingDialog, firstName, lastName, email]);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments');
      const data = await response.json();

      if (!data.IsSuccess) {
        toast.error(
          data.ErrorMessage?.[0]?.message || 'Failed to fetch appointments'
        );
        return;
      }

      if (data.Result?.appointments) {
        const formattedAppointments = data.Result.appointments.map(apt => ({
          title: `Booked: ${apt.patientName}`,
          start: new Date(apt.dateTime),
          end: new Date(apt.endTime),
          display: 'block',
          backgroundColor: '#ef4444',
          borderColor: '#ef4444',
          textColor: '#ffffff',
        }));
        setAppointments(formattedAppointments);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Failed to load appointments');
    }
  };

  const fetchAvailability = async () => {
    try {
      const response = await fetch('/api/availability');
      const data = await response.json();

      if (!data.IsSuccess) {
        toast.error(
          data.ErrorMessage?.[0]?.message || 'Failed to fetch availability'
        );
        return;
      }

      // Use events directly from the Result
      if (data.Result?.events) {
        const formattedEvents = data.Result.events.map(event => ({
          id: event.id,
          title: event.title,
          start: new Date(event.start),
          end: new Date(event.end),
          display: event.display,
          backgroundColor: event.backgroundColor,
          borderColor: event.borderColor,
          textColor: event.textColor,
          className: event.className,
          extendedProps: event.extendedProps,
        }));
        console.log('Formatted events:', formattedEvents); // Debug log
        setAvailableSlots(formattedEvents);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Failed to load available slots');
    }
  };

  const validateBookingDetails = () => {
    const requiredFields = [
      'patientName',
      'email',
      'phone',
      'sessionFormat',
      'reasonForVisit',
    ];

    for (const field of requiredFields) {
      if (!bookingDetails[field]?.trim()) {
        toast.error(
          `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`
        );
        return false;
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingDetails.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    const phoneRegex = /^\d{10}$/;
    const cleanPhone = bookingDetails.phone.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return false;
    }

    return true;
  };

  const handleBooking = async () => {
    if (!validateBookingDetails() || !selectedSlot) return;

    const availabilityCheck = await checkAvailability(
      selectedSlot.start,
      selectedSlot.end,
      selectedSlot.psychologistId
    );

    if (!availabilityCheck.isValid) {
      toast.info(
        availabilityCheck.error ||
          'This time slot is currently unavailable. Please select another time slot.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const createIntentResponse = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psychologistId: selectedSlot.psychologistId,
          sessionFee: selectedSlot.sessionFee,
          appointmentDate: selectedSlot.start,
        }),
      });

      const intentData = await createIntentResponse.json();

      if (intentData.IsSuccess) {
        setClientSecret(intentData.Result.clientSecret);
        setPaymentStep('payment');
      } else {
        toast.error(
          intentData.ErrorMessage?.[0]?.message || 'Failed to initiate payment'
        );
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error('Failed to initiate payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!selectedSlot) return;

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psychologistId: selectedSlot.psychologistId,
          start: selectedSlot.start.toISOString(),
          end: selectedSlot.end.toISOString(),
          paymentIntentId,
          sessionFormat: bookingDetails.sessionFormat,
          patientName: bookingDetails.patientName.trim(),
          email: bookingDetails.email.trim(),
          phone: bookingDetails.phone.replace(/\D/g, ''),
          reasonForVisit: bookingDetails.reasonForVisit.trim(),
          notes: bookingDetails.notes?.trim() || '',
          insuranceProvider: bookingDetails.insuranceProvider?.trim() || '',
        }),
      });

      const data = await response.json();

      if (data.IsSuccess) {
        toast.success('Appointment booked successfully');
        handleCloseDialog();
        fetchAppointments();
        fetchAvailability();
      } else {
        if (data.StatusCode === 409) {
          toast.error(
            'This time slot is no longer available. Please select another time.'
          );
        } else {
          toast.error(data.ErrorMessage?.[0]?.message || 'Booking failed');
        }
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to book appointment');
    }
  };

  const handleEventClick = info => {
    console.log('Event clicked:', info.event); // Debug log
    setSelectedSlot(info.event);
    setShowBookingDialog(true);
  };

  const handleCloseDialog = () => {
    setShowBookingDialog(false);
    setPaymentStep('details');
    setClientSecret(null);
  };

  const renderBookingContent = () => {
    if (paymentStep === 'payment' && clientSecret) {
      return (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: { theme: 'stripe' },
          }}
        >
          <PaymentForm
            amount={selectedSlot?.sessionFee || 0}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setPaymentStep('details')}
          />
        </Elements>
      );
    }
    return (
      <BookingForm
        bookingDetails={bookingDetails}
        selectedSlot={selectedSlot!}
        onUpdateBookingDetails={details =>
          setBookingDetails(prev => ({ ...prev, ...details }))
        }
        onSubmit={handleBooking}
        onCancel={handleCloseDialog}
        isLoading={isLoading}
      />
    );
  };

  return (
    <div className="mx-auto p-4 space-y-4 max-w-7xl">
      {CalendarStyles()}
      <AppointmentManager />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Schedule Appointment
        </h1>
        <p className="text-sm text-muted-foreground">
          Select an available time slot (highlighted in green) to schedule your
          appointment
        </p>
      </div>

      <CalendarView
        appointments={appointments as unknown as Event[]}
        availableSlots={availableSlots as unknown as Event[]}
        onEventClick={handleEventClick}
      />
      <Dialog open={showBookingDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-2xl p-0">
          <DialogHeader className="p-6 border-b">
            <DialogTitle className="text-xl font-semibold">
              Book Appointment
            </DialogTitle>
          </DialogHeader>

          {selectedSlot && (
            <div className="flex flex-col">
              <Tabs defaultValue="psychologist" className="w-full">
                <div className="px-6 py-2 border-b bg-background/95 sticky top-0 z-10 -mt-4">
                  <TabsList className="w-full grid grid-cols-2 gap-4">
                    <TabsTrigger
                      value="psychologist"
                      className="data-[state=active]:bg-primary data-[state=active]:text-white"
                    >
                      Provider Details
                    </TabsTrigger>
                    <TabsTrigger
                      value="booking"
                      className="data-[state=active]:bg-primary data-[state=active]:text-white"
                    >
                      Book Session
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent
                  value="psychologist"
                  className="focus-visible:outline-none"
                >
                  <PsychologistDetails selectedSlot={selectedSlot} />
                </TabsContent>

                <TabsContent
                  value="booking"
                  className="focus-visible:outline-none"
                >
                  <div className="p-6 max-h-[65vh] overflow-y-auto no-scrollbar">
                    {paymentStep === 'payment' && clientSecret ? (
                      <Elements
                        stripe={stripePromise}
                        options={{ clientSecret }}
                      >
                        <PaymentForm
                          amount={selectedSlot.sessionFee}
                          onSuccess={handlePaymentSuccess}
                          onCancel={() => setPaymentStep('details')}
                        />
                      </Elements>
                    ) : (
                      <BookingForm
                        bookingDetails={bookingDetails}
                        selectedSlot={selectedSlot}
                        onUpdateBookingDetails={details =>
                          setBookingDetails(prev => ({ ...prev, ...details }))
                        }
                        onSubmit={handleBooking}
                        onCancel={handleCloseDialog}
                        isLoading={isLoading}
                      />
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
