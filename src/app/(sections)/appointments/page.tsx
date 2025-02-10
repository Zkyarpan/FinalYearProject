'use client';

import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  CalendarIcon,
  Clock,
  Languages,
  Clock3,
  DollarSign,
  Stethoscope,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import { CalendarStyles } from '@/components/CalenderStyles';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useUserStore } from '@/store/userStore';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentForm } from '@/components/payment-form';
import AppointmentManager from '@/components/AppointmentManager';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function AppointmentScheduler() {
  const [appointments, setAppointments] = useState([]);
  type Event = {
    title: string;
    start: Date;
    end: Date;
    extendedProps: any;
    display: string;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    classNames: string[];
  };

  const [paymentStep, setPaymentStep] = useState('details');
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const [availableSlots, setAvailableSlots] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    start: Date;
    end: Date;
    psychologistId: string;
    psychologistName: string;
    about: string;
    languages: string[];
    sessionDuration: number;
    sessionFee: number;
    sessionFormats: string[];
    specializations: string[];
    acceptsInsurance: boolean;
    insuranceProviders: string[];
    licenseType: string;
    yearsOfExperience: number;
    profilePhotoUrl: string;
  } | null>(null);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    title: '',
    notes: '',
    patientName: '',
    email: '',
    phone: '',
    sessionFormat: 'video',
    insuranceProvider: '',
    reasonForVisit: '',
  });

  const { firstName, lastName, email } = useUserStore();

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments');
      const data = await response.json();
      if (data.IsSuccess) {
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
      toast.error('Failed to fetch appointments');
    }
  };

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

  const generateRecurringEvents = (availability: any[]): Event[] => {
    const events: Event[] = [];
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    availability.forEach(slot => {
      slot.daysOfWeek.forEach(day => {
        for (let week = 0; week < 4; week++) {
          const date = new Date(currentDate);
          date.setDate(
            currentDate.getDate() + (day - currentDate.getDay()) + week * 7
          );

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
            // title: `Available: ${slot.extendedProps.psychologistName}`,
            title: `Available`,
            start: startDateTime,
            end: endDateTime,
            extendedProps: {
              type: 'availability',
              ...slot.extendedProps,
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
      const response = await fetch('/api/availability');
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

  const handleEventClick = info => {
    if (info.event.extendedProps.type !== 'availability') return;

    setSelectedSlot({
      start: info.event.start,
      end: info.event.end,
      psychologistId: info.event.extendedProps.psychologistId,
      psychologistName: info.event.extendedProps.psychologistName,
      about: info.event.extendedProps.about,
      languages: info.event.extendedProps.languages,
      sessionDuration: info.event.extendedProps.sessionDuration,
      sessionFee: info.event.extendedProps.sessionFee,
      sessionFormats: info.event.extendedProps.sessionFormats,
      specializations: info.event.extendedProps.specializations,
      acceptsInsurance: info.event.extendedProps.acceptsInsurance,
      insuranceProviders: info.event.extendedProps.insuranceProviders,
      licenseType: info.event.extendedProps.licenseType,
      yearsOfExperience: info.event.extendedProps.yearsOfExperience,
      profilePhotoUrl: info.event.extendedProps.profilePhotoUrl,
    });
    setShowBookingDialog(true);
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
    if (!validateBookingDetails()) {
      return;
    }

    setIsLoading(true);
    try {
      const createIntentResponse = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psychologistId: selectedSlot?.psychologistId,
          sessionFee: selectedSlot?.sessionFee,
          appointmentDate: selectedSlot?.start,
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

  const handlePaymentSuccess = async paymentIntentId => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psychologistId: selectedSlot?.psychologistId,
          start: selectedSlot?.start.toISOString(),
          end: selectedSlot?.end.toISOString(),
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
        fetchAppointments(); // Refresh appointments list
        fetchAvailability(); // Refresh available slots
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

  const handleCloseDialog = () => {
    setShowBookingDialog(false);
    setPaymentStep('details');
    setClientSecret(null);
    resetBookingForm();
  };

  const resetBookingForm = () => {
    setBookingDetails({
      title: '',
      notes: '',
      patientName: '',
      email: '',
      phone: '',
      sessionFormat: 'video',
      insuranceProvider: '',
      reasonForVisit: '',
    });
  };

  const renderBookingContent = () => {
    if (paymentStep === 'payment' && clientSecret) {
      return (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'stripe',
            },
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
      <div className="space-y-4">
        <div className="bg-secondary/20 dark:bg-input border p-2 rounded-lg space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            <span>{format(selectedSlot!.start, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>
              {format(selectedSlot!.start, 'h:mm a')} -{' '}
              {format(selectedSlot!.end, 'h:mm a')}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="patientName" className="text-sm">
                Name *
              </Label>
              <input
                id="patientName"
                value={bookingDetails.patientName}
                onChange={e =>
                  setBookingDetails({
                    ...bookingDetails,
                    patientName: e.target.value,
                  })
                }
                className="block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm">
                Email *
              </Label>
              <input
                id="email"
                type="email"
                value={bookingDetails.email}
                onChange={e =>
                  setBookingDetails({
                    ...bookingDetails,
                    email: e.target.value,
                  })
                }
                className="block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="phone" className="text-sm">
                Phone *
              </Label>
              <input
                id="phone"
                value={bookingDetails.phone}
                onChange={e =>
                  setBookingDetails({
                    ...bookingDetails,
                    phone: e.target.value,
                  })
                }
                className="block w-full rounded-md  px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Format *</Label>
              <RadioGroup
                value={bookingDetails.sessionFormat}
                onValueChange={value =>
                  setBookingDetails({
                    ...bookingDetails,
                    sessionFormat: value,
                  })
                }
                className="flex gap-3"
              >
                {selectedSlot!.sessionFormats.map(format => (
                  <div key={format} className="flex items-center space-x-1">
                    <RadioGroupItem value={format} id={format} />
                    <Label htmlFor={format} className="text-sm">
                      {format}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* {selectedSlot!.acceptsInsurance && (
            <div className="space-y-1">
              <Label htmlFor="insurance" className="text-sm">
                Insurance (Optional)
              </Label>
              <select
                id="insurance"
                value={bookingDetails.insuranceProvider}
                onChange={e =>
                  setBookingDetails({
                    ...bookingDetails,
                    insuranceProvider: e.target.value,
                  })
                }
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="">Select provider</option>
                {selectedSlot!.insuranceProviders.map(provider => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </div>
          )} */}

          <div className="space-y-1">
            <Label htmlFor="reasonForVisit" className="text-sm">
              Reason *
            </Label>
            <textarea
              id="reasonForVisit"
              value={bookingDetails.reasonForVisit}
              onChange={e =>
                setBookingDetails({
                  ...bookingDetails,
                  reasonForVisit: e.target.value,
                })
              }
              className="block w-full rounded-md h-20 px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes" className="text-sm">
              Notes (Optional)
            </Label>
            <textarea
              id="notes"
              value={bookingDetails.notes}
              onChange={e =>
                setBookingDetails({
                  ...bookingDetails,
                  notes: e.target.value,
                })
              }
              className="block w-full rounded-md h-20 px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleCloseDialog} className="h-8">
            Cancel
          </Button>
          <Button onClick={handleBooking} disabled={isLoading} className="h-8">
            {isLoading
              ? 'Processing...'
              : `Proceed to Payment ($${selectedSlot?.sessionFee})`}
          </Button>
        </DialogFooter>
      </div>
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
                  <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto no-scrollbar">
                    {/* Provider Header */}
                    <Card className="p-4 bg-muted/30 dark:bg-input border">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-20 w-20 border-2 border-primary">
                          <AvatarImage
                            src={selectedSlot.profilePhotoUrl}
                            alt={selectedSlot.psychologistName}
                          />
                          <AvatarFallback className="text-lg bg-primary/10">
                            {selectedSlot.psychologistName
                              .split(' ')
                              .map(n => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <h3 className="text-xl font-semibold">
                            {selectedSlot.psychologistName}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Award className="h-4 w-4 text-white bg-primary p-0.5 rounded-full" />
                              <span>{selectedSlot.licenseType}</span>
                            </div>
                            <span className="text-primary">•</span>
                            <div className="flex items-center gap-1.5">
                              <Clock3 className="h-4 w-4 text-white bg-primary p-0.5 rounded-full" />
                              <span>{selectedSlot.yearsOfExperience}y exp</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* About Section */}
                    <div className="space-y-2">
                      <h4 className="text-lg font-medium">About</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed text-justify">
                        {selectedSlot.about}
                      </p>
                    </div>

                    {/* Languages & Specializations Grid */}
                    <div className="grid grid-cols-2 gap-6">
                      {/* Languages Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Languages className="h-4 w-4 text-white bg-primary p-0.5 rounded-full" />
                          <span className="font-medium">Languages</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedSlot.languages.map(lang => (
                            <span
                              key={lang}
                              className="rounded-full px-3 py-1 text-sm border dark:bg-input text-muted-foreground"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Specializations Section */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-white bg-primary p-0.5 rounded-full" />
                          <span className="font-medium">Specializations</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedSlot.specializations.map(spec => (
                            <span
                              key={spec}
                              className="rounded-full px-3 py-1 text-sm border dark:bg-input text-muted-foreground"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Session Details Card */}
                    <Card className="grid grid-cols-2 gap-6 p-4 border bg-muted/30 dark:bg-input">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4 text-white bg-primary p-0.5 rounded-full" />
                          <span className="font-medium">Session Duration</span>
                        </div>
                        <p className="text-2xl font-semibold main-font">
                          {selectedSlot.sessionDuration} min
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-white bg-primary p-0.5 rounded-full" />
                          <span className="font-medium">Session Fee</span>
                        </div>
                        <p className="text-2xl font-semibold main-font ">
                          ${selectedSlot.sessionFee}
                        </p>
                      </div>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent
                  value="booking"
                  className="focus-visible:outline-none"
                >
                  <div className="p-6 max-h-[65vh] overflow-y-auto no-scrollbar">
                    {renderBookingContent()}
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
