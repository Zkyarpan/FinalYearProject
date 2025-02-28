'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  MessageCircle,
  Clock,
  Phone,
  Sun,
  Moon,
  Calendar,
  CalendarDays,
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { toast } from 'sonner';

// Component imports
import Location from '@/icons/Location';
import Videos from '@/icons/Video';
import Dollar from '@/icons/Dollar';
import Graduate from '@/icons/Graudate';
import Messages from '@/icons/Messages';
import { ProfileSkeleton } from '@/components/ProfileSkeleton';
import ExperienceEducationSection from '@/components/ExperienceEducationSection';
import LoginModal from '@/components/LoginModel';
import { BookingForm } from '@/components/BookingForm';
import { PsychologistDetails } from '@/components/PsychologistDetails';
import { PaymentForm } from '@/components/payment-form';

// UI Components
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Store and Types
import { useUserStore } from '@/store/userStore';
import { PsychologistProfile, Slot, BookingDetails } from '@/types/slug';
import { SelectedSlot } from '@/types/appointment';
import { checkAvailability } from '@/helpers/checkAvailability';
import { BookingSuccessDialog } from '@/components/BookingSuccessDialog';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

// Constants
const TIME_PERIODS = {
  MORNING: {
    icon: <Sun className="w-5 h-5 text-yellow-500" />,
    label: 'Morning',
    range: '6:00 AM - 11:59 AM',
  },
  AFTERNOON: {
    icon: <Sun className="w-5 h-5 text-orange-500" />,
    label: 'Afternoon',
    range: '12:00 PM - 4:59 PM',
  },
  EVENING: {
    icon: <Moon className="w-5 h-5 text-indigo-500" />,
    label: 'Evening',
    range: '5:00 PM - 8:59 PM',
  },
  NIGHT: {
    icon: <Moon className="w-5 h-5 text-blue-800" />,
    label: 'Night',
    range: '9:00 PM - 11:59 PM',
  },
};

const DAYS_OF_WEEK = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

const PsychologistProfileView = () => {
  // Core state
  const params = useParams();
  const router = useRouter();
  const [psychologist, setPsychologist] = useState<PsychologistProfile | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Calendar and time state
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [today] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<Slot | null>(null);
  const [userTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  // Dialog and booking state
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState('details');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [bookedAppointmentId, setBookedAppointmentId] = useState<string>('');

  // User state from store
  const { isAuthenticated, firstName, lastName, email } = useUserStore();

  // Booking details state
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

  // Initialize dates and fetch psychologist data
  useEffect(() => {
    const currentDate = new Date();
    const dates: Date[] = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }

    setWeekDates(dates);
    setSelectedDay(DAYS_OF_WEEK[currentDate.getDay()]);
  }, []);

  // Fetch psychologist data
  useEffect(() => {
    const fetchPsychologist = async () => {
      setLoading(true);
      try {
        if (!params?.slug) throw new Error('Psychologist not found');
        const response = await fetch(`/api/psychologist/${params.slug}`);
        const data = await response.json();

        if (!data.IsSuccess || !data.Result?.psychologist) {
          throw new Error(
            data.ErrorMessage?.[0]?.message || 'Psychologist not found'
          );
        }

        setPsychologist(data.Result.psychologist);

        if (selectedDay) {
          const daySlots =
            data.Result.psychologist.availability[selectedDay]?.slots || [];
          if (selectedTimeSlot) {
            // Check if the selected slot is still available
            const slotStillAvailable = daySlots.some(
              slot => slot.id === selectedTimeSlot.id && !slot.isBooked
            );
            if (!slotStillAvailable) {
              setSelectedTimeSlot(null);
              setSelectedSlot(null);
            }
          }
        }
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load psychologist data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPsychologist();
  }, [params?.slug]);

  // Reset booking details when dialog opens
  useEffect(() => {
    if (showBookingDialog && isAuthenticated) {
      const fullName = `${firstName} ${lastName}`.trim();
      setBookingDetails(prev => ({
        ...prev,
        patientName: fullName,
        email: email || '',
      }));
    }
  }, [showBookingDialog, firstName, lastName, email, isAuthenticated]);

  // Utility functions
  const formatLicenseType = (type: string): string => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getDayName = (index: number): string => {
    return DAYS_OF_WEEK[index];
  };

  const getFormattedDay = (date: Date): string => {
    return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  };

  const getAllSlotsForDay = (day: string): Slot[] => {
    const schedule = psychologist?.availability[day];
    if (!schedule?.available) return [];

    // If slots exist in the array, return them
    if (schedule.slots && schedule.slots.length > 0) {
      return schedule.slots;
    }

    // If no slots but we have startTime and endTime, create a slot
    if (schedule.startTime && schedule.endTime) {
      return [
        {
          id: `${day}-${schedule.startTime.replace(/\s/g, '')}`,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          date: new Date().toISOString().split('T')[0], // Current date
          duration: psychologist?.sessionDuration || 30,
          timePeriods: schedule.timePeriods || [],
          rawStartTime: schedule.startTime,
          originalStartTime: schedule.startTime,
          originalEndTime: schedule.endTime,
          rawEndTime: schedule.endTime,
        },
      ];
    }

    return [];
  };

  const getSlotsByPeriod = (period: string): Slot[] => {
    const allSlots = getAllSlotsForDay(selectedDay);
    return allSlots.filter(slot => {
      // If timePeriods is available in the slot, use it
      if (slot.timePeriods && slot.timePeriods.length > 0) {
        return slot.timePeriods.includes(period);
      }

      // Otherwise, determine the period based on the start time
      const [time, meridiem] = slot.startTime.split(' ');
      const [hours] = time.split(':').map(Number);
      let hour = hours;

      if (meridiem === 'PM' && hours !== 12) hour += 12;
      else if (meridiem === 'AM' && hours === 12) hour = 0;

      // Determine period based on hour
      if (hour >= 0 && hour < 12) return period === 'MORNING';
      if (hour >= 12 && hour < 17) return period === 'AFTERNOON';
      if (hour >= 17 && hour < 21) return period === 'EVENING';
      return period === 'NIGHT';
    });
  };

  const isTimeSlotPast = (startTime: string): boolean => {
    if (!startTime) return true;
    if (getDayName(today.getDay()) !== selectedDay) return false;

    try {
      const [time, period] = startTime.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let slotHours = hours;

      if (period === 'PM' && hours !== 12) slotHours += 12;
      else if (period === 'AM' && hours === 12) slotHours = 0;

      const currentDate = new Date();
      const slotDate = new Date();
      slotDate.setHours(slotHours, minutes, 0, 0);

      return slotDate <= currentDate;
    } catch (error) {
      console.error('Error processing time slot:', startTime, error);
      return true;
    }
  };

  const getSlotDateTime = (day: string, timeSlot: string): Date => {
    const today = new Date();
    const dayIndex = DAYS_OF_WEEK.indexOf(
      day.toLowerCase() as (typeof DAYS_OF_WEEK)[number]
    );
    const daysToAdd = (dayIndex + 7 - today.getDay()) % 7;

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);

    const [time, period] = timeSlot.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'PM' && hours !== 12) hours += 12;
    else if (period === 'AM' && hours === 12) hours = 0;

    targetDate.setHours(hours, minutes, 0, 0);
    return targetDate;
  };

  const refreshAvailability = async () => {
    try {
      const response = await fetch(`/api/psychologist/${params.slug}`);
      const data = await response.json();

      if (!data.IsSuccess || !data.Result?.psychologist) {
        throw new Error(
          data.ErrorMessage?.[0]?.message || 'Failed to refresh availability'
        );
      }

      setPsychologist(prev =>
        prev
          ? {
              ...prev,
              availability: data.Result.psychologist.availability,
            }
          : null
      );

      setSelectedTimeSlot(null);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Error refreshing availability:', error);
      toast.error('Failed to refresh availability');
    }
  };

  const handleSelectTimeSlot = (slot: Slot) => {
    setSelectedTimeSlot(slot);

    const formatted: SelectedSlot = {
      id: slot.id,
      psychologistId: psychologist?.id || '',
      psychologistName: `Dr. ${psychologist?.firstName} ${psychologist?.lastName}`,
      title: `Session with Dr. ${psychologist?.lastName}`,
      start: getSlotDateTime(selectedDay, slot.startTime).toISOString(),
      end: getSlotDateTime(selectedDay, slot.endTime).toISOString(),
      sessionFee: psychologist?.sessionFee || 0,
      sessionDuration: psychologist?.sessionDuration || 30,
      sessionFormats: psychologist?.sessionFormats || [],
      profilePhotoUrl: psychologist?.profilePhoto || '',
      psychologistPhoto: psychologist?.profilePhoto || '',
      timezone: userTimezone,
      date: slot.date,
      sessionFormat: bookingDetails.sessionFormat,
      rawStartTime: slot.rawStartTime,
      rawEndTime: slot.rawEndTime,
      originalStartTime: slot.originalStartTime,
      originalEndTime: slot.originalEndTime,
      about: psychologist?.about || '',
      licenseType: psychologist?.licenseType || '',
      yearsOfExperience: psychologist?.yearsOfExperience || 0,
      specializations: psychologist?.specializations || [],
      languages: psychologist?.languages || [],
      timePeriods: slot.timePeriods || [],
      status: 'available',
      isBooked: false,
      acceptsInsurance: psychologist?.acceptsInsurance || false,
    };
    setSelectedSlot(formatted);
  };

  const handleCloseDialog = () => {
    setShowBookingDialog(false);
    setPaymentStep('details');
    setClientSecret(null);
  };

  const handleBooking = () => {
    if (!isAuthenticated) {
      localStorage.setItem(
        'redirectAfterLogin',
        `/appointments/${psychologist?.id}`
      );
      setShowLoginModal(true);
      return;
    }
    setShowBookingDialog(true);
  };

  // Form validation
  const validateBookingDetails = (): boolean => {
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

  const handleSubmitBooking = async () => {
    if (!validateBookingDetails() || !selectedSlot) return;

    try {
      setIsLoading(true);

      const startDate = new Date(selectedSlot.start);
      const endDate = new Date(selectedSlot.end);

      const availabilityCheck = await checkAvailability(
        startDate,
        endDate,
        selectedSlot.psychologistId
      );

      if (!availabilityCheck.isValid) {
        toast.info(
          availabilityCheck.error ||
            'This time slot is currently unavailable. Please select another time slot.'
        );
        return;
      }

      const createIntentResponse = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psychologistId: selectedSlot.psychologistId,
          sessionFee: selectedSlot.sessionFee,
          appointmentDate: startDate.toISOString(),
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
      console.error('Booking error:', error);
      toast.error('Failed to process booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!selectedTimeSlot || !selectedSlot) return;

    try {
      const appointmentResponse = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psychologistId: selectedSlot.psychologistId,
          start: selectedSlot.start,
          end: selectedSlot.end,
          paymentIntentId,
          sessionFormat: bookingDetails.sessionFormat,
          patientName: bookingDetails.patientName.trim(),
          email: bookingDetails.email.trim(),
          phone: bookingDetails.phone.replace(/\D/g, ''),
          reasonForVisit: bookingDetails.reasonForVisit.trim(),
          notes: bookingDetails.notes?.trim() || '',
          insuranceProvider: bookingDetails.insuranceProvider?.trim() || '',
          timezone: userTimezone,
        }),
      });

      const appointmentData = await appointmentResponse.json();

      if (appointmentData.IsSuccess) {
        const appointmentId = appointmentData.Result.appointment._id;
        setBookedAppointmentId(appointmentId);

        handleCloseDialog();

        await refreshAvailability();

        setShowSuccessDialog(true);

        setSelectedTimeSlot(null);
        setSelectedSlot(null);

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
      } else {
        if (appointmentData.StatusCode === 409) {
          toast.error('This time slot is no longer available');
        } else {
          toast.error(
            appointmentData.ErrorMessage?.[0]?.message || 'Booking failed'
          );
        }
      }
    } catch (error) {
      console.error('Appointment creation error:', error);
      toast.error('Failed to create appointment');
    }
  };

  if (loading) return <ProfileSkeleton />;

  if (error || !psychologist) return 'Psychologist not found';

  return (
    <div className="flex flex-col gap-4 py-10 px-4 sm:px-6">
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      <BookingSuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        appointmentId={bookedAppointmentId}
      />

      <div className="flex flex-col gap-4 sm:items-center justify-center">
        <div className="sm:hidden flex justify-between">
          <div className="w-16 h-16 relative rounded-full overflow-hidden">
            <img
              className="w-full h-full object-cover hover:opacity-90 transition-opacity border border-gray-200 dark:border-gray-700"
              src={psychologist.profilePhoto}
              alt={`Dr. ${psychologist.firstName} ${psychologist.lastName}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-xl border dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Send Message"
              onClick={() => {
                if (!isAuthenticated) {
                  localStorage.setItem(
                    'redirectAfterLogin',
                    `/messages/${psychologist.id}`
                  );
                  setShowLoginModal(true);
                  return;
                }
                // Handle messaging logic
              }}
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button
              className={`px-4 py-2 rounded-xl ${
                psychologist.acceptingNewClients
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!psychologist.acceptingNewClients}
              onClick={() =>
                psychologist.acceptingNewClients && setActiveTab('availability')
              }
            >
              {psychologist.acceptingNewClients
                ? 'Book Session'
                : 'Not Available'}
            </button>
          </div>
        </div>

        {/* Desktop Profile Header */}
        <div className="hidden sm:block">
          <div className="w-20 h-20 relative mx-auto rounded-full overflow-hidden">
            <img
              className="w-full h-full object-cover hover:opacity-90 transition-opacity border border-gray-200 dark:border-gray-700"
              src={psychologist.profilePhoto}
              alt={`Dr. ${psychologist.firstName} ${psychologist.lastName}`}
            />
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex flex-col gap-2 sm:items-center justify-center">
          <h1 className="font-semibold text-lg">
            Dr. {psychologist.firstName} {psychologist.lastName}
          </h1>
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 sm:text-center">
            {formatLicenseType(psychologist.licenseType)}
          </h2>
        </div>

        {/* Profile Details */}
        <div className="flex flex-wrap sm:justify-center sm:gap-4 gap-2">
          <div className="flex gap-2 items-center">
            <Location />
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              {psychologist.city}, {psychologist.country}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <Graduate />
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              {psychologist.yearsOfExperience} years exp.
            </p>
          </div>
        </div>

        {/* Specializations */}
        <div className="w-full flex sm:flex-wrap sm:overflow-x-hidden overflow-x-auto items-center gap-2 hide-scrollbar sm:justify-center">
          {psychologist.specializations.map((spec, index) => (
            <div key={index} className="flex-shrink-0">
              <Badge variant="outline" className="capitalize">
                {spec}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-center border-b dark:border-[#333333]">
          <ul className="flex items-center text-sm gap-6 overflow-x-auto">
            {['overview', 'experience', 'availability'].map(tab => (
              <li key={tab} className="flex items-center">
                <button
                  onClick={() => setActiveTab(tab)}
                  className={`flex whitespace-nowrap text-center items-center py-2.5 text-xs font-medium border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'font-semibold text-blue-500 border-blue-500'
                      : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6 px-4 sm:px-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <section className="space-y-6">
            <div className="prose dark:prose-invert max-w-none">
              <p className="dark:text-muted-foreground text-sm text-justify">
                {psychologist.about}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {/* Session Info Card */}
              <div className="p-4 border dark:border-[#333333] rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Videos />
                  <span className="text-sm font-medium">Session Info</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Duration
                    </span>
                    <span>{psychologist.sessionDuration} minutes</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Fee
                    </span>
                    <span className="flex items-center gap-1">
                      <Dollar />
                      {psychologist.sessionFee} USD
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Formats
                    </span>
                    <div className="flex gap-2">
                      {psychologist.sessionFormats.map((format, index) => (
                        <span key={index} className="flex items-center gap-1">
                          {format === 'video' ? (
                            <Videos />
                          ) : (
                            <Phone className="w-3 h-3" />
                          )}
                          {format}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Languages Card */}
              <div className="p-4 border dark:border-[#333333] rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <Messages />
                  <span className="text-sm font-medium">Languages</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {psychologist.languages.map((lang, index) => (
                    <Badge key={index} variant="secondary">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Experience Tab */}
        {activeTab === 'experience' && (
          <section className="space-y-4">
            <ExperienceEducationSection psychologist={psychologist} />
          </section>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && (
          <section className="space-y-8">
            {/* Calendar Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Select Date</h3>
                <div className="flex items-center gap-2 px-3 py-1.5 border  rounded-full ">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500 ">
                    {userTimezone}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 overflow-x-auto">
                {weekDates.map((date, index) => {
                  const day = getDayName(date.getDay());
                  const schedule = psychologist.availability[day];
                  const isToday = date.toDateString() === today.toDateString();
                  const dayNum = date.getDate();
                  const isAvailable =
                    schedule?.available &&
                    Array.isArray(schedule.slots) &&
                    schedule.slots.length > 0;
                  const totalSlots = schedule?.slots?.length || 0;
                  const isSelected = selectedDay === day;

                  return (
                    <div
                      key={day}
                      onClick={() => isAvailable && setSelectedDay(day)}
                      className={`
             flex flex-col items-center justify-center p-4 rounded-xl
             w-[110px] h-[110px] cursor-pointer transition-all duration-200 dark:bg-[#1c1c1c] 
             ${isToday ? 'dark:bg-[#1c1c1c]  dark:border-gray-700' : ''}
             ${
               isSelected && isAvailable
                 ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-lg'
                 : isAvailable
                 ? 'bg-card dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 border dark:border-gray-700 shadow-sm'
                 : 'bg-muted/40 dark:bg-gray-800/50 text-muted-foreground dark:text-gray-400 cursor-not-allowed border dark:border-gray-700'
             }
           `}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {isToday && (
                          <Badge
                            variant="outline"
                            className="absolute -top-2 right-2 text-xs bg-background/80 dark:bg-gray-800/80 backdrop-blur-sm"
                          >
                            Today
                          </Badge>
                        )}
                        <span className={`text-sm font-medium`}>
                          {getFormattedDay(date)}
                        </span>
                        <span className={`text-2xl font-bold`}>{dayNum}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">
                            {totalSlots > 0
                              ? `${totalSlots} slot${
                                  totalSlots !== 1 ? 's' : ''
                                }`
                              : 'No slots'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Time Slots Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Available Time Slots</h3>
              </div>

              <div className="grid gap-6">
                {Object.entries(TIME_PERIODS).map(
                  ([period, { icon, label, range }]) => {
                    const slots = getSlotsByPeriod(period);
                    if (slots.length === 0) return null;

                    return (
                      <div key={period} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {icon}
                            <h4 className="text-base font-medium">{label}</h4>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {range}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {slots.map((slot, index) => {
                            const isPast = isTimeSlotPast(slot.startTime);
                            const isSelected = selectedTimeSlot?.id === slot.id;

                            return (
                              <button
                                key={slot.id || index}
                                disabled={isPast}
                                onClick={() =>
                                  !isPast && handleSelectTimeSlot(slot)
                                }
                                className={`
                     relative flex flex-col items-center justify-center p-4
                     rounded-xl border transition-all duration-200
                     ${
                       isPast
                         ? 'bg-muted/30 dark:bg-gray-800/30 text-muted-foreground dark:text-gray-400 cursor-not-allowed dark:border-gray-700'
                         : isSelected
                         ? 'bg-blue-500 dark:bg-blue-600 text-white border-blue-500 dark:border-blue-600 shadow-lg scale-105'
                         : 'hover:bg-blue-50 dark:hover:bg-blue-900/40 dark:bg-gray-800 dark:border-gray-700 hover:border-blue-500/50 dark:hover:border-blue-500/30'
                     }
                   `}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-sm font-medium">
                                    {slot.startTime}
                                  </span>
                                  <span className="text-xs opacity-80">to</span>
                                  <span className="text-sm font-medium">
                                    {slot.endTime}
                                  </span>
                                </div>
                                {isPast && (
                                  <Badge
                                    variant="outline"
                                    className="absolute -top-2 right-2 text-xs bg-background/80 dark:bg-gray-800/80 backdrop-blur-sm"
                                  >
                                    Past
                                  </Badge>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                )}

                {/* No slots message */}
                {getAllSlotsForDay(selectedDay).length === 0 && (
                  <div className="py-12 text-center bg-muted/30 dark:bg-gray-800/30 rounded-xl border border-dashed dark:border-gray-700">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">
                      No available slots for {selectedDay}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Please select another day or check back later
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Section */}
              <div className="flex flex-col sm:flex-row justify-between items-center pt-6 mt-6 border-t dark:border-gray-700 gap-4">
                <div className="flex items-start gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Consultation with
                      <span className="font-bold">
                        {' '}
                        Dr. {psychologist.firstName}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  className={`
         flex items-center justify-center gap-2 px-6 py-2.5
         font-medium rounded-xl transition-all duration-200
         ${
           selectedTimeSlot
             ? 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 shadow-lg'
             : 'bg-muted dark:bg-gray-800 text-muted-foreground cursor-not-allowed'
         }
       `}
                  disabled={!selectedTimeSlot}
                  onClick={handleBooking}
                >
                  <Clock className="w-4 h-4" />
                  Confirm Schedule
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Booking Dialog */}
        <Dialog open={showBookingDialog} onOpenChange={handleCloseDialog}>
          <DialogContent className="sm:max-w-2xl p-0">
            <DialogHeader className="p-6 border-b">
              <DialogTitle className="text-xl font-semibold">
                Book Appointment
              </DialogTitle>
            </DialogHeader>

            {selectedTimeSlot && (
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
                      {paymentStep === 'payment' &&
                      clientSecret &&
                      selectedSlot ? (
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
                          onSubmit={handleSubmitBooking}
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
    </div>
  );
};

export default PsychologistProfileView;
