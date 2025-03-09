'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  User,
  AlertCircle,
  Loader2,
  Search,
  History,
  CheckCircle2,
  X,
  Ban,
  Phone,
  Mail,
  Shield,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppointmentSkeleton } from './skeleton/AppointmentSkeleton';

interface AppointmentParticipant {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePhotoUrl?: string;
  phoneNumber?: string;
}

interface Psychologist extends AppointmentParticipant {
  sessionFee?: number;
  specialty?: string;
  languages?: string[];
  licenseType?: string;
  education?: Array<{
    degree: string;
    university: string;
    graduationYear: number;
  }>;
  about?: string;
}

interface User extends AppointmentParticipant {
  // Additional user-specific fields can be added here
}

interface ProfileInfo {
  profilePhotoUrl?: string;
  age?: number;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  therapyHistory?: string;
  preferredCommunication?: string;
  struggles?: string[];
  briefBio?: string;
}

interface Appointment {
  _id: string;
  startTime?: string;
  dateTime?: string; // Some API responses use dateTime instead of startTime
  endTime: string;
  duration: number;
  sessionFormat: 'video' | 'in-person';
  status: 'confirmed' | 'canceled' | 'completed' | 'ongoing' | 'missed';
  reasonForVisit?: string;
  notes?: string;
  cancelationReason?: string;
  canceledAt?: string;
  patientName?: string;
  email?: string;
  phone?: string;
  psychologist?: Psychologist;
  user?: User;
  userId?: {
    // For past appointments, the API might return userId instead of user
    _id?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    profilePhotoUrl?: string;
  };
  profile?: ProfileInfo;
  payment: {
    amount: number;
    currency: string;
    status: string;
  };
  isPast: boolean;
  isToday: boolean;
  canJoin: boolean;
}

const formatDate = (
  dateString: string | undefined,
  formatType: 'date' | 'time' | 'full'
) => {
  if (!dateString) return 'N/A';

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    switch (formatType) {
      case 'date':
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      case 'time':
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      case 'full':
        return `${formatDate(dateString, 'date')} ${formatDate(
          dateString,
          'time'
        )}`;
      default:
        return 'Invalid format';
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date error';
  }
};

const getStatusBadgeVariant = (
  status: string,
  isPast: boolean
): 'default' | 'destructive' | 'outline' | 'secondary' | 'custom' => {
  if (status === 'canceled') return 'destructive';
  if (status === 'completed') return 'secondary';
  if (status === 'ongoing') return 'custom';
  if (status === 'missed') return 'destructive';
  if (isPast) return 'outline';
  return 'default';
};

interface AppointmentManagerProps {
  role: 'user' | 'psychologist';
  profileImage?: string;
  firstName?: string;
  lastName?: string;
}

const AppointmentManager: React.FC<AppointmentManagerProps> = ({ role }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancellationNote, setCancellationNote] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);
  const userRole = role || 'user'; // Use the role from props, default to 'user'

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/appointments');
      const data = await response.json();

      if (data.IsSuccess) {
        const sortedAppointments = data.Result?.appointments || [];
        sortedAppointments.sort(
          (a: Appointment, b: Appointment) =>
            new Date(a.startTime || a.dateTime || 0).getTime() -
            new Date(b.startTime || b.dateTime || 0).getTime()
        );
        setAppointments(sortedAppointments);
      } else {
        toast.error('Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Error loading appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelAppointment = async (note: string) => {
    if (!selectedAppointment) return;

    if (!note.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    if (note.trim().length < 10) {
      toast.error('Please provide a more detailed reason for cancellation');
      return;
    }
    setIsCanceling(true);
    try {
      const response = await fetch(
        `/api/appointments/${selectedAppointment._id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cancellationNotes: note,
          }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.ErrorMessage?.[0]?.message || 'Failed to cancel appointment';
        toast.error(errorMessage);
        return;
      }

      if (data.IsSuccess) {
        await fetchAppointments();
        toast.success('Appointment cancelled successfully');
        setCancellationNote('');
        setCancelDialogOpen(false);
        setSelectedAppointment(null);
      } else {
        toast.error('Failed to cancel appointment');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Failed to cancel appointment');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleJoinSession = (appointment: Appointment) => {
    if (!appointment.canJoin) {
      toast.info(
        'Session is not available to join yet. Please wait until 5 minutes before the appointment.'
      );
      return;
    }

    // Logic to join the session based on user role
    if (userRole === 'psychologist') {
      window.location.href = `/sessions/host/${appointment._id}`;
    } else {
      window.location.href = `/sessions/join/${appointment._id}`;
    }

    toast.info('Joining video session...');
  };

  // Add a helper function to get role-appropriate search text
  const getSearchPlaceholder = () => {
    return userRole === 'psychologist'
      ? 'Search patients or visit reasons...'
      : 'Search psychologists or visit reasons...';
  };

  const filteredAppointments = appointments.filter(apt => {
    // Get the participant info based on user role
    const participantName =
      userRole === 'psychologist'
        ? `${apt.user?.firstName || ''} ${apt.user?.lastName || ''}`
        : `${apt.psychologist?.firstName || ''} ${
            apt.psychologist?.lastName || ''
          }`;

    const matchesSearch =
      searchQuery === '' ||
      participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.reasonForVisit?.toLowerCase() || '').includes(
        searchQuery.toLowerCase()
      );

    if (activeTab === 'upcoming') {
      return matchesSearch && !apt.isPast && apt.status !== 'canceled';
    } else if (activeTab === 'canceled') {
      return matchesSearch && apt.status === 'canceled';
    } else {
      // past
      return matchesSearch && apt.isPast && apt.status !== 'canceled';
    }
  });

  const renderAppointmentCard = (appointment: Appointment) => {
    // Determine which participant to show based on user role
    // For the psychologist role, we need to handle the API response format differently
    let participant;
    let displayName;
    let profileImage;
    let fallbackInitials = '';

    if (userRole === 'psychologist') {
      // Handle the data from the API which may have a different structure
      participant = appointment.user || {};

      // Check if we have user object data or if we need to use appointment data directly
      if (appointment.patientName) {
        // For past appointments, the API might provide only patientName, not structured user data
        displayName = appointment.patientName;

        // Create initials from patientName if available
        if (displayName) {
          const nameParts = displayName.split(' ');
          fallbackInitials = nameParts
            .map(part => part[0] || '')
            .join('')
            .toUpperCase();
        }
      } else if (participant && participant.firstName && participant.lastName) {
        // Normal case - we have structured user data
        displayName = `${participant.firstName} ${participant.lastName}`;
        fallbackInitials = `${participant.firstName[0] || ''}${
          participant.lastName[0] || ''
        }`;
      } else {
        // Fallback case
        displayName = appointment.email || 'Patient';
        fallbackInitials = 'PT';
      }

      // Determine profile image - check all possible sources
      if (appointment.profile && appointment.profile.profilePhotoUrl) {
        profileImage = appointment.profile.profilePhotoUrl;
      } else if (appointment.profile && appointment.profile.profilePhotoUrl) {
        // Use profilePhotoUrl from profile
        profileImage = appointment.profile.profilePhotoUrl;
      } else if (participant.profilePhotoUrl) {
        profileImage = participant.profilePhotoUrl;
      } else if (participant.image) {
        profileImage = participant.image;
      } else {
        profileImage = ''; // No image found
      }
    } else {
      // Regular user viewing psychologist
      participant = appointment.psychologist || {};
      displayName =
        participant.firstName && participant.lastName
          ? `${participant.firstName} ${participant.lastName}`
          : 'Psychologist';
      fallbackInitials =
        participant.firstName && participant.lastName
          ? `${participant.firstName[0] || ''}${participant.lastName[0] || ''}`
          : 'DR';

      // Ensure all possible image sources are checked
      profileImage = participant.profilePhotoUrl || participant.image || '';
    }

    const isCanceled = appointment.status === 'canceled';
    const isCompleted = appointment.status === 'completed';
    const isOngoing = appointment.status === 'ongoing';

    // Check if the image URL is valid - prevent broken images
    const imageUrlIsValid =
      profileImage &&
      (profileImage.startsWith('http') ||
        profileImage.startsWith('/') ||
        profileImage.startsWith('data:'));

    return (
      <Card
        key={appointment._id}
        className={`w-full p-4 ${
          isCanceled
            ? 'bg-muted/30 dark:bg-muted/10'
            : 'bg-white bg-[linear-gradient(204deg,rgba(209,213,218,0.70)0%,rgba(255,255,255,0.00)50.85%)] dark:bg-[#1c1c1c] dark:bg-[linear-gradient(204deg,rgba(40,40,45,0.8)0%,rgba(23,23,23,0.9)50.85%)]'
        }`}
      >
        <CardContent className="p-4 sm:p-6 flex flex-col min-h-[250px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Avatar
                className={`h-14 w-14 border-2 ${
                  isCanceled ? 'opacity-75' : ''
                }`}
              >
                {imageUrlIsValid ? (
                  <AvatarImage
                    src={profileImage}
                    alt={displayName}
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="text-xl font-medium bg-primary/10 text-primary">
                    {fallbackInitials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h4
                  className={`font-semibold text-lg ${
                    isCanceled ? 'text-muted-foreground' : ''
                  }`}
                >
                  {displayName}
                </h4>
                {userRole === 'user' && participant.licenseType && (
                  <p className="text-sm flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-input dark:text-blue-400 text-xs font-medium border capitalize">
                      {participant.licenseType || 'Clinical Psychologist'}
                    </span>
                  </p>
                )}
                {/* Display additional info for psychologists */}
                {userRole === 'psychologist' && appointment.email && (
                  <p className="text-sm flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {appointment.email}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <Badge
              variant={getStatusBadgeVariant(
                appointment.status,
                appointment.isPast
              )}
              className="font-medium"
            >
              {appointment.status.charAt(0).toUpperCase() +
                appointment.status.slice(1)}
            </Badge>
          </div>

          {/* Appointment details */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center space-x-3">
              <Calendar
                className={`h-5 w-5 ${
                  isCanceled
                    ? 'text-muted-foreground/70'
                    : 'text-muted-foreground'
                }`}
              />
              <span
                className={`font-medium text-sm ${
                  isCanceled ? 'text-muted-foreground/70' : ''
                }`}
              >
                {formatDate(
                  appointment.startTime || appointment.dateTime,
                  'date'
                )}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Clock
                className={`h-5 w-5 ${
                  isCanceled
                    ? 'text-muted-foreground/70'
                    : 'text-muted-foreground'
                }`}
              />
              <span
                className={`font-medium text-sm ${
                  isCanceled ? 'text-muted-foreground/70' : ''
                }`}
              >
                {formatDate(
                  appointment.startTime || appointment.dateTime,
                  'time'
                )}{' '}
                - {formatDate(appointment.endTime, 'time')}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              {appointment.sessionFormat === 'video' ? (
                <Video
                  className={`h-5 w-5 ${
                    isCanceled
                      ? 'text-muted-foreground/70'
                      : 'text-muted-foreground'
                  }`}
                />
              ) : (
                <MapPin
                  className={`h-5 w-5 ${
                    isCanceled
                      ? 'text-muted-foreground/70'
                      : 'text-muted-foreground'
                  }`}
                />
              )}
              <span
                className={`font-medium text-sm ${
                  isCanceled ? 'text-muted-foreground/70' : ''
                }`}
              >
                {appointment.sessionFormat === 'video'
                  ? 'Video Session'
                  : 'In-Person Session'}
              </span>
            </div>

            {/* Contact information for psychologists */}
            {userRole === 'psychologist' && (
              <>
                {appointment.email && (
                  <div className="flex items-center space-x-3">
                    <Mail
                      className={`h-5 w-5 ${
                        isCanceled
                          ? 'text-muted-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    />
                    <span
                      className={`font-medium text-sm ${
                        isCanceled ? 'text-muted-foreground/70' : ''
                      }`}
                    >
                      {appointment.email}
                    </span>
                  </div>
                )}

                {appointment.phone && (
                  <div className="flex items-center space-x-3">
                    <Phone
                      className={`h-5 w-5 ${
                        isCanceled
                          ? 'text-muted-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    />
                    <span
                      className={`font-medium text-sm ${
                        isCanceled ? 'text-muted-foreground/70' : ''
                      }`}
                    >
                      {appointment.phone}
                    </span>
                  </div>
                )}

                {/* Show additional profile info if available */}
                {appointment.profile && appointment.profile.age && (
                  <div className="flex items-center space-x-3">
                    <User
                      className={`h-5 w-5 ${
                        isCanceled
                          ? 'text-muted-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    />
                    <span
                      className={`font-medium text-sm ${
                        isCanceled ? 'text-muted-foreground/70' : ''
                      }`}
                    >
                      Age: {appointment.profile.age}, Gender:{' '}
                      {appointment.profile.gender || 'Not specified'}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Visit reason - for both roles */}
            {appointment.reasonForVisit && (
              <div className="flex items-start space-x-3 mt-2 pt-2 border-t border-border/50">
                <AlertCircle
                  className={`h-5 w-5 mt-0.5 ${
                    isCanceled
                      ? 'text-muted-foreground/70'
                      : 'text-muted-foreground'
                  }`}
                />
                <div>
                  <span
                    className={`font-medium text-sm block ${
                      isCanceled ? 'text-muted-foreground/70' : ''
                    }`}
                  >
                    Reason for Visit:
                  </span>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {appointment.reasonForVisit}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer section */}
          <div className="mt-auto">
            <div className="flex justify-between items-center">
              <Badge
                variant="outline"
                className={`text-sm font-medium ${
                  isCanceled ? 'opacity-75' : ''
                }`}
              >
                ${appointment.payment.amount}{' '}
                {appointment.payment.currency.toUpperCase()}
              </Badge>

              {isCanceled ? (
                <div className="flex items-center text-emerald-500">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  <span className="text-sm">
                    Refund processing • 3-5 business days
                  </span>
                </div>
              ) : isCompleted ? (
                <Badge variant="secondary" className="font-medium">
                  Session Complete
                </Badge>
              ) : isOngoing ? (
                <Badge variant="default" className="font-medium">
                  Session In Progress
                </Badge>
              ) : (
                !appointment.isPast && (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setDetailsDialogOpen(true);
                      }}
                    >
                      Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setCancelDialogOpen(true);
                      }}
                    >
                      Cancel
                    </Button>
                    {appointment.sessionFormat === 'video' && (
                      <Button
                        size="sm"
                        onClick={() => handleJoinSession(appointment)}
                        disabled={!appointment.canJoin}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {appointment.canJoin ? 'Join Session' : 'Join Soon'}
                      </Button>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Cancellation details */}
            {isCanceled && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center mb-1">
                    <History className="h-4 w-4 mr-2" />
                    <span>
                      Canceled on{' '}
                      {formatDate(appointment.canceledAt || '', 'full')}
                    </span>
                  </div>
                  {appointment.cancelationReason && (
                    <p className="ml-6 truncate">
                      Reason: {appointment.cancelationReason}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCancelDialog = () => {
    return (
      <Dialog
        open={cancelDialogOpen}
        onOpenChange={open => {
          if (!isCanceling) {
            // Only allow closing if not in loading state
            setCancelDialogOpen(open);
            if (!open) {
              setCancellationNote('');
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              {selectedAppointment && (
                <>
                  Are you sure you want to cancel your appointment
                  {userRole === 'psychologist'
                    ? ` with ${
                        selectedAppointment.user?.firstName ||
                        selectedAppointment.email ||
                        'the patient'
                      } ${selectedAppointment.user?.lastName || ''}`
                    : ` with ${
                        selectedAppointment.psychologist?.firstName ||
                        'your psychologist'
                      } ${
                        selectedAppointment.psychologist?.lastName || ''
                      }`}{' '}
                  on {formatDate(selectedAppointment.startTime, 'full')}?
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 bg-destructive/10 p-3 rounded-lg mb-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-destructive">
              Cancelling within 24 hours may incur a fee.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <label htmlFor="cancelNote" className="text-sm font-medium">
                Cancellation Note
              </label>
              <textarea
                id="cancelNote"
                className="block w-full h-20 rounded-md px-3 py-1.5 text-base text-[hsl(var(--foreground))] outline outline-1 -outline-offset-1 outline-[hsl(var(--border))] placeholder:text-[hsl(var(--muted-foreground))] outline-none focus-visible:ring-transparent sm:text-sm dark:bg-input"
                placeholder="Please provide a reason for cancellation..."
                value={cancellationNote}
                onChange={e => setCancellationNote(e.target.value)}
                disabled={isCanceling}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancellationNote('');
                setCancelDialogOpen(false);
              }}
              disabled={isCanceling}
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleCancelAppointment(cancellationNote)}
              disabled={isCanceling}
            >
              {isCanceling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Appointment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const renderDetailsDialog = () => {
    if (!selectedAppointment) return null;

    // Get all the display information needed for the dialog
    let displayName = '';
    let profileImage = '';
    let fallbackInitials = '';
    let licenseType = '';
    let email = '';
    let phone = '';
    let contactInfo = false;
    let participantInfo:
      | Psychologist
      | {
          _id?: string;
          email?: string;
          firstName?: string;
          lastName?: string;
          profilePhotoUrl?: string;
        }
      | null = null;

    if (userRole === 'psychologist') {
      // Handling patient info
      participantInfo =
        selectedAppointment.user || selectedAppointment.userId || {};

      // Determine display name
      if (selectedAppointment.patientName) {
        displayName = selectedAppointment.patientName;
      } else if (participantInfo.firstName && participantInfo.lastName) {
        displayName = `${participantInfo.firstName} ${participantInfo.lastName}`;
      } else {
        displayName = selectedAppointment.email || 'Patient';
      }

      // Get initials for avatar fallback
      if (participantInfo.firstName && participantInfo.lastName) {
        fallbackInitials = `${participantInfo.firstName[0] || ''}${
          participantInfo.lastName[0] || ''
        }`;
      } else if (displayName) {
        const parts = displayName.split(' ');
        fallbackInitials = parts
          .map(p => p[0] || '')
          .join('')
          .toUpperCase();
      } else {
        fallbackInitials = 'PT';
      }

      // Get profile image - prioritize the profile.profilePhotoUrl
      profileImage =
        (selectedAppointment.profile &&
          selectedAppointment.profile.profilePhotoUrl) ||
        participantInfo.profilePhotoUrl ||
        '';

      // Get contact information
      email =
        selectedAppointment.email ||
        (participantInfo && participantInfo.email) ||
        '';
      phone = selectedAppointment.phone || '';
      contactInfo = true;
    } else {
      // Handling psychologist info
      participantInfo = selectedAppointment.psychologist || {};

      // Determine display name
      if (participantInfo.firstName && participantInfo.lastName) {
        displayName = `${participantInfo.firstName} ${participantInfo.lastName}`;
      } else {
        displayName = 'Your Psychologist';
      }

      // Get initials for avatar fallback
      if (participantInfo.firstName && participantInfo.lastName) {
        fallbackInitials = `${participantInfo.firstName[0] || ''}${
          participantInfo.lastName[0] || ''
        }`;
      } else {
        fallbackInitials = 'DR';
      }

      // Get profile image
      profileImage = participantInfo.profilePhotoUrl || '';

      // Get license type
      licenseType =
        (participantInfo as Psychologist).licenseType ||
        'Clinical Psychologist';
    }

    // Get appointment date info
    const appointmentDate =
      selectedAppointment.startTime || selectedAppointment.dateTime || '';

    return (
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 border-2">
                {profileImage ? (
                  <AvatarImage
                    src={profileImage}
                    alt={displayName}
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback className="text-xl font-medium bg-primary/10 text-primary">
                    {fallbackInitials}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h4 className="font-semibold text-lg">{displayName}</h4>
                {userRole === 'user' && licenseType && (
                  <p className="text-sm">
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 dark:bg-input dark:text-blue-400 text-xs font-medium border capitalize">
                      {licenseType}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-sm">
                  {formatDate(appointmentDate, 'date')}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-sm">
                  {formatDate(appointmentDate, 'time')} -{' '}
                  {formatDate(selectedAppointment.endTime, 'time')}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                {selectedAppointment.sessionFormat === 'video' ? (
                  <Video className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="font-medium text-sm">
                  {selectedAppointment.sessionFormat === 'video'
                    ? 'Video Session'
                    : 'In-Person Session'}
                </span>
              </div>
            </div>

            {selectedAppointment.reasonForVisit && (
              <div className="pt-4 border-t">
                <h5 className="font-medium mb-2">Reason for Visit</h5>
                <p className="text-sm text-muted-foreground">
                  {selectedAppointment.reasonForVisit}
                </p>
              </div>
            )}

            {selectedAppointment.notes && (
              <div>
                <h5 className="font-medium mb-2">Notes</h5>
                <p className="text-sm text-muted-foreground">
                  {selectedAppointment.notes}
                </p>
              </div>
            )}

            {contactInfo && (
              <div className="space-y-2 pt-4 border-t">
                <h5 className="font-medium mb-2">Contact Information</h5>
                {email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{email}</span>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm">{phone}</span>
                  </div>
                )}
              </div>
            )}

            {/* Additional profile information for psychologists viewing patient data */}
            {userRole === 'psychologist' && selectedAppointment.profile && (
              <div className="space-y-3 pt-4 border-t">
                <h5 className="font-medium mb-2">Patient Information</h5>

                {selectedAppointment.profile.age && (
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="text-sm">
                        Age: {selectedAppointment.profile.age}
                        {selectedAppointment.profile.gender &&
                          `, Gender: ${selectedAppointment.profile.gender}`}
                      </span>
                    </div>
                  </div>
                )}

                {selectedAppointment.profile.emergencyContact && (
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">
                        Emergency Contact:
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {selectedAppointment.profile.emergencyContact}
                        {selectedAppointment.profile.emergencyPhone &&
                          ` - ${selectedAppointment.profile.emergencyPhone}`}
                      </p>
                    </div>
                  </div>
                )}

                {selectedAppointment.profile.therapyHistory && (
                  <div className="flex items-start space-x-3">
                    <History className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <span className="text-sm font-medium">
                        Therapy History:
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {selectedAppointment.profile.therapyHistory}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
            {selectedAppointment.sessionFormat === 'video' &&
              !selectedAppointment.isPast &&
              selectedAppointment.canJoin && (
                <Button
                  onClick={() => {
                    handleJoinSession(selectedAppointment);
                    setDetailsDialogOpen(false);
                  }}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Join Session
                </Button>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 dark:border-[#333333]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Appointments</h2>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <AppointmentSkeleton key={i} />
            ))}
          </div>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold tracking-tight">
            {userRole === 'psychologist'
              ? 'Patient Appointments'
              : 'My Appointments'}
          </h2>
        </div>

        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={getSearchPlaceholder()}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Tabs
        defaultValue="upcoming"
        className="w-full"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-[482px] grid-cols-3 mb-6">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Upcoming</span>

            <Badge variant="default" className="ml-2">
              {
                appointments.filter(
                  apt => !apt.isPast && apt.status !== 'canceled'
                ).length
              }
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="canceled" className="flex items-center gap-2">
            <Ban className="h-4 w-4" />
            <span>Canceled</span>

            <Badge variant="default" className="ml-2">
              {appointments.filter(apt => apt.status === 'canceled').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>Past</span>
            <Badge variant="default" className="ml-2">
              {
                appointments.filter(
                  apt => apt.isPast && apt.status !== 'canceled'
                ).length
              }
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {filteredAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppointments.map(renderAppointmentCard)}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/50 rounded-lg dark:border-[#333333] dark:bg-input border">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />

              <p className="text-muted-foreground">
                No upcoming appointments found
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {filteredAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppointments.map(renderAppointmentCard)}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/50 rounded-lg border dark:bg-input dark:border-[#333333]">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />

              <p className="text-muted-foreground">
                No past appointments found
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="canceled">
          {filteredAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAppointments.map(renderAppointmentCard)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-input rounded-xl border dark:border-[#333333]">
              <Ban className="h-12 w-12 text-muted-foreground" />
              <p className="text-base font-medium text-muted-foreground">
                No canceled appointments
              </p>
              <p className="text-sm text-muted-foreground">
                You don't have any canceled appointments
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {renderCancelDialog()}
      {renderDetailsDialog()}
    </div>
  );
};

export default AppointmentManager;
