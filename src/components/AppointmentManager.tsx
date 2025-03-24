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
import { useRouter } from 'next/navigation';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { useSocket } from '@/contexts/SocketContext';
import VideoCallModal from './VideoCallModal';
import { verifyAppointmentStatus } from '@/helpers/verifyAppointmentStatus';
import { Appointment, formatDate, Psychologist } from '@/types/manager';

// UPDATED: Improved getStatusBadgeVariant to consider isToday
const getStatusBadgeVariant = (
  status: string,
  isPast: boolean,
  isToday: boolean
): 'default' | 'destructive' | 'outline' | 'secondary' | 'custom' => {
  // Status-based variants take precedence
  if (status === 'canceled') return 'destructive';
  if (status === 'completed') return 'secondary';
  if (status === 'ongoing') return 'custom';
  if (status === 'missed') return 'destructive';

  // Timing-based variants
  if (isPast) return 'outline';
  if (isToday) return 'default'; // Highlight today's appointments

  // Default for future appointments
  return 'default';
};

interface AppointmentManagerProps {
  role: 'user' | 'psychologist';
  profileImage?: string;
  firstName?: string;
  lastName?: string;
}
const AppointmentManager: React.FC<AppointmentManagerProps> = ({ role }) => {
  const { socket, isConnected } = useSocket();
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
  const userRole = role || 'user';
  const [isVideoCallModalOpen, setIsVideoCallModalOpen] = useState(false);
  const { startCall, joinCall, callStatus } = useVideoCall();

  useEffect(() => {
    fetchAppointments();

    // ADDED: Refresh appointment statuses periodically
    const refreshInterval = setInterval(() => {
      setAppointments(prevAppointments =>
        prevAppointments.map(verifyAppointmentStatus)
      );
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, []);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/appointments');
      const data = await response.json();

      if (data.IsSuccess) {
        const sortedAppointments = data.Result?.appointments || [];
        // Sort by date (ascending)
        sortedAppointments.sort(
          (a: Appointment, b: Appointment) =>
            new Date(a.startTime || a.dateTime || 0).getTime() -
            new Date(b.startTime || b.dateTime || 0).getTime()
        );

        // ADDED: Verify appointment statuses for freshness
        const verifiedAppointments = sortedAppointments.map(
          verifyAppointmentStatus
        );
        setAppointments(verifiedAppointments);
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

  const handleJoinSession = async (appointment: Appointment) => {
    // Re-verify canJoin status in case page has been open a while
    const verifiedAppointment = verifyAppointmentStatus(appointment);

    if (!verifiedAppointment.canJoin) {
      const now = new Date();
      const appointmentDate = new Date(
        appointment.startTime || appointment.dateTime || ''
      );
      const minutesToStart = Math.round(
        (appointmentDate.getTime() - now.getTime()) / 60000
      );

      if (minutesToStart > 5) {
        toast.info(
          `Session is not available to join yet. You can join 5 minutes before the appointment (in about ${minutesToStart} minutes).`
        );
      } else if (minutesToStart < -15) {
        toast.error(
          'This session has ended. Please contact support if you need assistance.'
        );
      } else {
        toast.info(
          'Session is not available. Please refresh the page or contact support if the issue persists.'
        );
      }
      return;
    }

    // Set selected appointment for the video call
    setSelectedAppointment(verifiedAppointment);

    // Get the participant ID based on user role
    const participantId =
      userRole === 'psychologist'
        ? verifiedAppointment.user?._id ||
          verifiedAppointment.userId?._id ||
          (typeof verifiedAppointment.userId === 'string'
            ? verifiedAppointment.userId
            : '')
        : verifiedAppointment.psychologist?._id || '';

    // Check if we have a valid participant ID
    if (!participantId) {
      console.error('Appointment data:', verifiedAppointment);
      toast.error(
        'Could not determine session participant. Please contact support.'
      );
      return;
    }

    // Show connecting toast message
    toast.info('Preparing video session...', { id: 'connecting-call' });

    try {
      // Check if the other participant is online first
      if (socket && isConnected) {
        socket.emit('check_user_online', participantId, (isOnline: boolean) => {
          if (!isOnline) {
            toast.warning(
              'The other participant is currently offline. They will be notified when they return.',
              { id: 'connecting-call', duration: 5000 }
            );
            // Continue anyway as they might join later
          } else {
            toast.success('Participant is online. Connecting...', {
              id: 'connecting-call',
              duration: 3000,
            });
          }

          // Proceed with the connection process
          proceedWithCallSetup();
        });
      } else {
        // If socket isn't available, proceed anyway
        proceedWithCallSetup();
      }
    } catch (error) {
      console.error('Error checking participant status:', error);
      // Continue with call anyway as the socket check is just informational
      proceedWithCallSetup();
    }

    // Helper function to proceed with the actual call setup
    function proceedWithCallSetup() {
      // Perform direct time-based validation instead of using checkCallAvailability
      const now = new Date();
      const appointmentDate = new Date(
        verifiedAppointment.startTime || verifiedAppointment.dateTime || ''
      );
      const appointmentEndDate = new Date(verifiedAppointment.endTime);

      // Check if we're within the allowed window (5 minutes before to 15 minutes after)
      const millisBeforeStart = appointmentDate.getTime() - now.getTime();
      const millisAfterEnd = now.getTime() - appointmentEndDate.getTime();
      const minutesBeforeStart = Math.floor(millisBeforeStart / 60000);
      const minutesAfterEnd = Math.floor(millisAfterEnd / 60000);

      const isWithinTimeWindow =
        (minutesBeforeStart <= 5 && minutesBeforeStart >= -60) ||
        (minutesAfterEnd >= 0 && minutesAfterEnd <= 15);

      if (!isWithinTimeWindow) {
        if (minutesBeforeStart > 5) {
          toast.error(
            `Session starts in ${minutesBeforeStart} minutes. You can join 5 minutes before.`,
            {
              id: 'connecting-call',
            }
          );
        } else if (minutesAfterEnd > 15) {
          toast.error(
            'This session has ended. The joining window has closed.',
            {
              id: 'connecting-call',
            }
          );
        } else {
          toast.error('Cannot join session - outside of allowed time window.', {
            id: 'connecting-call',
          });
        }
        return;
      }

      // Open the video call modal
      setIsVideoCallModalOpen(true);

      // Add a small delay to ensure the modal is open before starting the call
      setTimeout(() => {
        // Start or join the call based on role
        if (userRole === 'psychologist') {
          // Psychologist initiates the call
          startCall(verifiedAppointment._id, participantId)
            .then(() => {
              console.log('Call started successfully');
              toast.success('Session started successfully', {
                id: 'connecting-call',
              });
            })
            .catch(error => {
              console.error('Failed to start call:', error);
              toast.error('Failed to start video session. Please try again.', {
                id: 'connecting-call',
              });
              setIsVideoCallModalOpen(false);
            });
        } else {
          // User joins the call
          joinCall(verifiedAppointment._id, participantId)
            .then(() => {
              console.log('Joined call successfully');
              toast.success('Joining session...', {
                id: 'connecting-call',
              });
            })
            .catch(error => {
              console.error('Failed to join call:', error);
              toast.error('Failed to join video session. Please try again.', {
                id: 'connecting-call',
              });
              setIsVideoCallModalOpen(false);
            });
        }
      }, 500);
    }
  };

  // Add a helper function to get role-appropriate search text
  const getSearchPlaceholder = () => {
    return userRole === 'psychologist'
      ? 'Search patients or visit reasons...'
      : 'Search psychologists or visit reasons...';
  };

  // UPDATED: Improved filteredAppointments logic
  const filteredAppointments = appointments.filter(apt => {
    // Re-verify appointment status in real-time
    const verifiedApt = verifyAppointmentStatus(apt);

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

    // Filter based on active tab
    if (activeTab === 'upcoming') {
      return (
        matchesSearch &&
        !verifiedApt.isPast &&
        verifiedApt.status !== 'canceled'
      );
    } else if (activeTab === 'canceled') {
      return matchesSearch && verifiedApt.status === 'canceled';
    } else {
      // past tab
      return (
        matchesSearch && verifiedApt.isPast && verifiedApt.status !== 'canceled'
      );
    }
  });

  const renderAppointmentCard = (appointment: Appointment) => {
    // Re-verify appointment status for freshness
    const verifiedAppointment = verifyAppointmentStatus(appointment);

    // Determine which participant to show based on user role
    // For the psychologist role, we need to handle the API response format differently
    let participant;
    let displayName;
    let profileImage;
    let fallbackInitials = '';

    if (userRole === 'psychologist') {
      // Handle the data from the API which may have a different structure
      participant = verifiedAppointment.user || {};

      // Check if we have user object data or if we need to use appointment data directly
      if (verifiedAppointment.patientName) {
        // For past appointments, the API might provide only patientName, not structured user data
        displayName = verifiedAppointment.patientName;

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
        displayName = verifiedAppointment.email || 'Patient';
        fallbackInitials = 'PT';
      }

      // Determine profile image - check all possible sources
      if (
        verifiedAppointment.profile &&
        verifiedAppointment.profile.profilePhotoUrl
      ) {
        profileImage = verifiedAppointment.profile.profilePhotoUrl;
      } else if (participant.profilePhotoUrl) {
        profileImage = participant.profilePhotoUrl;
      } else if (participant.image) {
        profileImage = participant.image;
      } else {
        profileImage = ''; // No image found
      }
    } else {
      // Regular user viewing psychologist
      participant = verifiedAppointment.psychologist || {};
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

    const isCanceled = verifiedAppointment.status === 'canceled';
    const isCompleted = verifiedAppointment.status === 'completed';
    const isOngoing = verifiedAppointment.status === 'ongoing';

    // Check if the image URL is valid - prevent broken images
    const imageUrlIsValid =
      profileImage &&
      (profileImage.startsWith('http') ||
        profileImage.startsWith('/') ||
        profileImage.startsWith('data:'));

    return (
      <Card
        key={verifiedAppointment._id}
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
                {userRole === 'psychologist' && verifiedAppointment.email && (
                  <p className="text-sm flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {verifiedAppointment.email}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* UPDATED: Include isToday in badge variant calculation */}
            <Badge
              variant={getStatusBadgeVariant(
                verifiedAppointment.status,
                verifiedAppointment.isPast,
                verifiedAppointment.isToday
              )}
              className="font-medium"
            >
              {verifiedAppointment.status.charAt(0).toUpperCase() +
                verifiedAppointment.status.slice(1)}
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
                  verifiedAppointment.startTime || verifiedAppointment.dateTime,
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
                  verifiedAppointment.startTime || verifiedAppointment.dateTime,
                  'time'
                )}{' '}
                - {formatDate(verifiedAppointment.endTime, 'time')}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              {verifiedAppointment.sessionFormat === 'video' ? (
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
                {verifiedAppointment.sessionFormat === 'video'
                  ? 'Video Session'
                  : 'In-Person Session'}
              </span>
            </div>

            {/* Contact information for psychologists */}
            {userRole === 'psychologist' && (
              <>
                {verifiedAppointment.email && (
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
                      {verifiedAppointment.email}
                    </span>
                  </div>
                )}

                {verifiedAppointment.phone && (
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
                      {verifiedAppointment.phone}
                    </span>
                  </div>
                )}

                {/* Show additional profile info if available */}
                {verifiedAppointment.profile &&
                  verifiedAppointment.profile.age && (
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
                        Age: {verifiedAppointment.profile.age}, Gender:{' '}
                        {verifiedAppointment.profile.gender || 'Not specified'}
                      </span>
                    </div>
                  )}
              </>
            )}

            {/* Visit reason - for both roles */}
            {verifiedAppointment.reasonForVisit && (
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
                    {verifiedAppointment.reasonForVisit}
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
                ${verifiedAppointment.payment.amount}{' '}
                {verifiedAppointment.payment.currency.toUpperCase()}
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
                // UPDATED: Only show action buttons for non-past appointments and show Join button when available
                !verifiedAppointment.isPast && (
                  <div className="flex space-x-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setSelectedAppointment(verifiedAppointment);
                        setDetailsDialogOpen(true);
                      }}
                    >
                      Details
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setSelectedAppointment(verifiedAppointment);
                        setCancelDialogOpen(true);
                      }}
                    >
                      Cancel
                    </Button>
                    {verifiedAppointment.sessionFormat === 'video' &&
                      renderJoinButton(verifiedAppointment)}
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
                      {formatDate(verifiedAppointment.canceledAt || '', 'full')}
                    </span>
                  </div>
                  {verifiedAppointment.cancelationReason && (
                    <p className="ml-6 truncate">
                      Reason: {verifiedAppointment.cancelationReason}
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
                  on{' '}
                  {formatDate(
                    selectedAppointment.startTime ||
                      selectedAppointment.dateTime,
                    'full'
                  )}
                  ?
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
              variant="default"
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

    // Re-verify the selected appointment status for freshness
    const verifiedSelectedAppointment =
      verifyAppointmentStatus(selectedAppointment);

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
        verifiedSelectedAppointment.user ||
        verifiedSelectedAppointment.userId ||
        {};

      // Determine display name
      if (verifiedSelectedAppointment.patientName) {
        displayName = verifiedSelectedAppointment.patientName;
      } else if (participantInfo.firstName && participantInfo.lastName) {
        displayName = `${participantInfo.firstName} ${participantInfo.lastName}`;
      } else {
        displayName = verifiedSelectedAppointment.email || 'Patient';
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
        (verifiedSelectedAppointment.profile &&
          verifiedSelectedAppointment.profile.profilePhotoUrl) ||
        participantInfo.profilePhotoUrl ||
        '';

      // Get contact information
      email =
        verifiedSelectedAppointment.email ||
        (participantInfo && participantInfo.email) ||
        '';
      phone = verifiedSelectedAppointment.phone || '';
      contactInfo = true;
    } else {
      // Handling psychologist info
      participantInfo = verifiedSelectedAppointment.psychologist || {};

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
      verifiedSelectedAppointment.startTime ||
      verifiedSelectedAppointment.dateTime ||
      '';

    return (
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="bg-[#222] border-[#333] text-white p-0 w-[450px] max-w-full max-h-[100vh] overflow-hidden">
          <div className="p-4 text-center relative">
            <DialogTitle className="text-lg font-semibold">
              Appointment Details
            </DialogTitle>
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
              onClick={() => setDetailsDialogOpen(false)}
            ></button>
          </div>

          <div className="flex flex-col items-center justify-center py-2">
            <Avatar className="h-16 w-16 mb-2">
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
            <h3 className="text-lg font-medium">{displayName}</h3>
            {userRole === 'user' && licenseType && (
              <span className="mt-1 text-xs text-gray-300">{licenseType}</span>
            )}
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid grid-cols-3 mx-6 mb-2 border">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="reason">Reason</TabsTrigger>
              <TabsTrigger value="info">
                {userRole === 'psychologist' ? 'Patient' : 'Contact'}
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent
              value="details"
              className="px-6 py-3 h-[200px] overflow-y-auto"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <span>Mar {formatDate(appointmentDate, 'date')}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <span>
                    {formatDate(appointmentDate, 'time')} -{' '}
                    {formatDate(verifiedSelectedAppointment.endTime, 'time')}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Video className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <span>Video Session</span>
                </div>

                {/* Notes Section */}
                {verifiedSelectedAppointment.notes && (
                  <div className="pt-3 border-t border-gray-700/50">
                    <h5 className="font-medium mb-2">Notes</h5>
                    <p className="text-sm text-gray-300">
                      {verifiedSelectedAppointment.notes}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Reason Tab */}
            <TabsContent
              value="reason"
              className="px-6 py-3 h-[200px] overflow-y-auto"
            >
              <h5 className="font-medium mb-2">Reason for Visit</h5>
              <p className="text-sm text-gray-300">
                {verifiedSelectedAppointment.reasonForVisit || 'Not specified'}
              </p>
            </TabsContent>

            {/* Patient/Contact Info Tab */}
            <TabsContent
              value="info"
              className="px-6 py-3 h-[200px] overflow-y-auto"
            >
              {contactInfo && (
                <div className="mb-4">
                  <h5 className="font-medium mb-2">Contact Information</h5>

                  <div className="space-y-2">
                    {email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm">{email}</span>
                      </div>
                    )}

                    {phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm">{phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Patient Information */}
              {userRole === 'psychologist' &&
                verifiedSelectedAppointment.profile && (
                  <div
                    className={
                      contactInfo ? 'pt-3 border-t border-gray-700/50' : ''
                    }
                  >
                    <h5 className="font-medium mb-2">Patient Information</h5>

                    <div className="space-y-3">
                      {verifiedSelectedAppointment.profile.age && (
                        <div className="flex items-center space-x-2">
                          <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                          <span className="text-sm">
                            Age: {verifiedSelectedAppointment.profile.age},
                            Gender:{' '}
                            {verifiedSelectedAppointment.profile.gender ||
                              'Not specified'}
                          </span>
                        </div>
                      )}

                      {verifiedSelectedAppointment.profile.emergencyContact && (
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-sm font-medium block">
                              Emergency Contact:
                            </span>
                            <span className="text-sm text-gray-300">
                              {
                                verifiedSelectedAppointment.profile
                                  .emergencyContact
                              }
                              {verifiedSelectedAppointment.profile
                                .emergencyPhone &&
                                ` - ${verifiedSelectedAppointment.profile.emergencyPhone}`}
                            </span>
                          </div>
                        </div>
                      )}

                      {verifiedSelectedAppointment.profile.therapyHistory && (
                        <div className="flex items-start space-x-2">
                          <History className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-sm font-medium block">
                              Therapy History:
                            </span>
                            <span className="text-sm text-gray-300">
                              {
                                verifiedSelectedAppointment.profile
                                  .therapyHistory
                              }
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </TabsContent>
          </Tabs>

          {/* Footer with Close button */}
          <div className="border-t border-gray-700/50 p-4 flex justify-end">
            <Button
              onClick={() => setDetailsDialogOpen(false)}
              variant="outline"
              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              Close
            </Button>

            {verifiedSelectedAppointment.sessionFormat === 'video' &&
              !verifiedSelectedAppointment.isPast &&
              verifiedSelectedAppointment.canJoin && (
                <Button
                  onClick={() => {
                    handleJoinSession(verifiedSelectedAppointment);
                    setDetailsDialogOpen(false);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white ml-2"
                >
                  Join Session
                </Button>
              )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const renderJoinButton = (appointment: Appointment) => {
    // Skip if not a video session
    if (appointment.sessionFormat !== 'video') {
      return null;
    }

    // Re-verify the appointment status
    const verifiedApt = verifyAppointmentStatus(appointment);

    // Check if this appointment is currently being connected to
    const isConnecting =
      selectedAppointment?._id === verifiedApt._id && isVideoCallModalOpen;

    // Get button appearance based on appointment status
    let buttonProps: {
      disabled: boolean;
      className: string;
      onClick?: () => void;
      children: React.ReactNode;
    };

    if (isConnecting) {
      // Currently connecting to this session
      buttonProps = {
        disabled: true,
        className: 'bg-blue-600 text-primary-foreground opacity-70',
        children: (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Connecting...
          </>
        ),
      };
    } else if (!verifiedApt.canJoin) {
      // Not yet joinable (either too early or too late)
      const now = new Date();
      const appointmentDate = new Date(
        verifiedApt.startTime || verifiedApt.dateTime || ''
      );
      const minutesToStart = Math.round(
        (appointmentDate.getTime() - now.getTime()) / 60000
      );

      buttonProps = {
        disabled: true,
        className:
          'dark:bg-blue-600 text-primary-foreground cursor-not-allowed',
        children: (
          <>
            <Clock className="h-4 w-4 mr-2" />
            {minutesToStart > 0 ? `Join in ${minutesToStart}m` : 'Join Soon'}
          </>
        ),
      };
    } else {
      // Ready to join
      buttonProps = {
        disabled: false,
        className: 'bg-green-600 hover:bg-green-700 text-primary-foreground',
        onClick: () => handleJoinSession(verifiedApt),
        children: (
          <>
            <Video className="h-4 w-4 mr-2" />
            Join Session
          </>
        ),
      };
    }

    return (
      <Button
        size="sm"
        className={buttonProps.className}
        disabled={buttonProps.disabled}
        onClick={buttonProps.onClick}
      >
        {buttonProps.children}
      </Button>
    );
  };
  const renderSessionStatusIndicator = (appointment: Appointment) => {
    const verifiedApt = verifyAppointmentStatus(appointment);

    // Only show for video sessions that are today and not canceled
    if (
      verifiedApt.sessionFormat !== 'video' ||
      !verifiedApt.isToday ||
      verifiedApt.isPast ||
      verifiedApt.status === 'canceled'
    ) {
      return null;
    }

    // Calculate time remaining
    const now = new Date();
    const aptDate = new Date(
      verifiedApt.startTime || verifiedApt.dateTime || ''
    );
    const minutesToStart = Math.round(
      (aptDate.getTime() - now.getTime()) / 60000
    );

    // Get appropriate status text
    let statusText = '';
    let isActive = false;

    if (verifiedApt.canJoin) {
      statusText = 'This session is available to join now';
      isActive = true;
    } else if (minutesToStart > 0) {
      statusText = `Session will be available in ${minutesToStart} minute${
        minutesToStart === 1 ? '' : 's'
      }`;
    } else {
      statusText = 'Session window has passed';
    }

    return (
      <div
        className={`mt-4 pt-4 border-t border-border/50 ${
          isActive ? 'bg-green-50/50 dark:bg-green-900/10 p-2 rounded-md' : ''
        }`}
      >
        <div className="flex items-center">
          <Video
            className={`h-4 w-4 mr-2 ${
              isActive
                ? 'text-green-600 dark:text-green-400'
                : 'text-muted-foreground'
            }`}
          />
          <span
            className={`text-sm ${
              isActive
                ? 'text-green-600 dark:text-green-400 font-medium'
                : 'text-muted-foreground'
            }`}
          >
            {statusText}
          </span>
        </div>
      </div>
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

  const verifiedAppointments = appointments.map(verifyAppointmentStatus);
  const upcomingCount = verifiedAppointments.filter(
    apt => !apt.isPast && apt.status !== 'canceled'
  ).length;
  const canceledCount = verifiedAppointments.filter(
    apt => apt.status === 'canceled'
  ).length;
  const pastCount = verifiedAppointments.filter(
    apt => apt.isPast && apt.status !== 'canceled'
  ).length;

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
              {upcomingCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="canceled" className="flex items-center gap-2">
            <Ban className="h-4 w-4" />
            <span>Canceled</span>

            <Badge variant="default" className="ml-2">
              {canceledCount}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>Past</span>
            <Badge variant="default" className="ml-2">
              {pastCount}
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
      {selectedAppointment && renderSessionStatusIndicator(selectedAppointment)}
      {isVideoCallModalOpen && selectedAppointment && (
        <VideoCallModal
          open={isVideoCallModalOpen}
          onClose={() => {
            setIsVideoCallModalOpen(false);
            setSelectedAppointment(null);
          }}
          conversationId={selectedAppointment._id}
        />
      )}
    </div>
  );
};

export default AppointmentManager;
