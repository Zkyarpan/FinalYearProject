'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import { useUserStore } from '@/store/userStore';
import { useNotifications } from '@/contexts/NotificationContext';
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
import { CalendarStyles } from '@/components/CalenderStyles';
import { AvailabilityNotificationBadge } from '@/components/AvailabilityNotificationBadge';
import {
  AppointmentEvent,
  SelectedSlot,
  BookingDetails,
} from '@/types/appointment';
import { checkAvailability } from '@/helpers/checkAvailability';
import { CalendarEvent } from '@/types/calendar';
import { useSocket } from '@/contexts/SocketContext';

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
  const { notifications } = useNotifications();
  const { socket, isConnected } = useSocket();
  const userStore = useUserStore();

  const [newAvailabilityData, setNewAvailabilityData] = useState<{
    psychologistId: string;
    timestamp: string;
    psychologistName?: string;
  } | null>(null);

  const [highlightedSlots, setHighlightedSlots] = useState<Set<string>>(
    new Set()
  );

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

  // Function to process latest availability notification
  const processAvailabilityNotifications = useCallback(() => {
    // Look for the most recent availability change notification
    const availabilityNotification = notifications
      .filter(notification => notification.meta?.type === 'availability_change')
      .sort((a, b) => {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      })[0];

    if (availabilityNotification) {
      setNewAvailabilityData({
        psychologistId: availabilityNotification.meta?.psychologistId,
        timestamp: availabilityNotification.createdAt,
        psychologistName:
          availabilityNotification.meta?.psychologistName ||
          availabilityNotification.title?.split(' ')[0] ||
          'A provider',
      });
    }
  }, [notifications]);

  // Process notifications when component mounts or notifications change
  useEffect(() => {
    processAvailabilityNotifications();
  }, [processAvailabilityNotifications]);

  // Clear notification highlights after 10 minutes to avoid persistent UI clutter
  useEffect(() => {
    if (newAvailabilityData) {
      const clearHighlightTimer = setTimeout(
        () => {
          setNewAvailabilityData(null);
          setHighlightedSlots(new Set());
        },
        10 * 60 * 1000
      ); // 10 minutes

      return () => clearTimeout(clearHighlightTimer);
    }
  }, [newAvailabilityData]);

  // Update highlighted slots when availability data changes
  useEffect(() => {
    if (newAvailabilityData && availableSlots.length > 0) {
      // Find slots that belong to the psychologist who updated availability
      const newHighlightedSlots = new Set<string>();

      availableSlots.forEach(slot => {
        if (
          !slot.extendedProps?.isBooked &&
          slot.extendedProps?.psychologistId ===
            newAvailabilityData.psychologistId
        ) {
          // Create a unique ID for each slot
          const slotId = `${
            slot.id || `${slot.start}-${slot.extendedProps?.psychologistId}`
          }`;
          newHighlightedSlots.add(slotId);
        }
      });

      setHighlightedSlots(newHighlightedSlots);
    }
  }, [newAvailabilityData, availableSlots]);

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
        const now = new Date();
        const formattedEvents = data.Result.events.map(event => {
          const eventStart = new Date(event.start);
          const isPast = eventStart < now;

          return {
            id: event.id,
            title: event.title,
            start: eventStart,
            end: new Date(event.end),
            display: event.display,
            backgroundColor: isPast ? '#e5e7eb' : event.backgroundColor,
            borderColor: isPast ? '#9ca3af' : event.borderColor,
            textColor: isPast ? '#6b7280' : event.textColor,
            className: event.className + (isPast ? ' past-slot' : ''),
            extendedProps: {
              ...event.extendedProps,
              isPast,
            },
          };
        });

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
      new Date(selectedSlot.start),
      new Date(selectedSlot.end),
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
      const appointmentResponse = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psychologistId: selectedSlot.psychologistId,
          start: new Date(selectedSlot.start).toISOString(),
          end: new Date(selectedSlot.end).toISOString(),
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

      const appointmentData = await appointmentResponse.json();

      if (appointmentData.IsSuccess) {
        const appointmentId =
          appointmentData.Result?.appointment?._id ||
          appointmentData.Result?.appointment?.insertedId ||
          appointmentData.Result?.insertedId;

        if (!appointmentId) {
          toast.error('Error processing appointment');
          return;
        }

        const paymentResponse = await fetch('/api/payments/update-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId,
            status: 'completed',
            appointmentId: appointmentId.toString(),
          }),
        });

        const paymentData = await paymentResponse.json();

        // Emit socket event for real-time notifications
        // Use the socket that was initialized at the component level
        if (socket && isConnected) {
          console.log('Emitting appointment_booked event');

          // Get user ID from userStore that's already initialized
          const userId = firstName ? useUserStore.getState().user?._id : null;

          if (userId) {
            // Emit the appointment booking event
            socket.emit('appointment_booked', {
              appointmentId: appointmentId.toString(),
              psychologistId: selectedSlot.psychologistId,
              userId: userId,
              appointmentDetails: {
                dateTime: new Date(selectedSlot.start).toISOString(),
                endTime: new Date(selectedSlot.end).toISOString(),
                sessionFormat: bookingDetails.sessionFormat,
                patientName: bookingDetails.patientName.trim(),
                email: bookingDetails.email.trim(),
                phone: bookingDetails.phone.replace(/\D/g, ''),
                reasonForVisit: bookingDetails.reasonForVisit.trim(),
                notes: bookingDetails.notes?.trim() || '',
                insuranceProvider:
                  bookingDetails.insuranceProvider?.trim() || '',
                sessionFee: selectedSlot.sessionFee,
                psychologistName: selectedSlot.psychologistName || '',
              },
            });

            console.log('Appointment booking event emitted successfully');
          } else {
            console.warn('User ID not available, cannot send notification');
          }
        } else {
          console.warn(
            'Socket not connected, cannot send real-time notification'
          );
        }

        if (paymentData.IsSuccess) {
          toast.success('Appointment booked successfully');
          handleCloseDialog();
          await Promise.all([fetchAppointments(), fetchAvailability()]);
        } else {
          toast.warning(
            'Appointment booked, but payment status update delayed'
          );
          handleCloseDialog();
          await Promise.all([fetchAppointments(), fetchAvailability()]);
        }
      } else {
        if (appointmentData.StatusCode === 409) {
          toast.error(
            'This time slot is no longer available. Please select another time.'
          );
        } else {
          toast.error(
            appointmentData.ErrorMessage?.[0]?.message || 'Booking failed'
          );
        }
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Failed to book appointment');
    }
  };

  const handleEventClick = info => {
    setSelectedSlot(info.event);
    setShowBookingDialog(true);
  };

  const handleCloseDialog = () => {
    setShowBookingDialog(false);
    setPaymentStep('details');
    setClientSecret(null);
  };

  const dismissNewAvailabilityAlert = () => {
    setNewAvailabilityData(null);
    setHighlightedSlots(new Set());
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

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Schedule Appointment
        </h1>
        <p className="text-sm text-muted-foreground">
          Select an available time slot (highlighted in green) to schedule your
          appointment
        </p>
      </div>

      <AvailabilityNotificationBadge />

      <CalendarView
        appointments={appointments}
        availableSlots={availableSlots}
        onEventClick={handleEventClick}
        newAvailabilityData={newAvailabilityData}
        highlightedSlots={highlightedSlots}
        onDismissHighlight={dismissNewAvailabilityAlert}
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
