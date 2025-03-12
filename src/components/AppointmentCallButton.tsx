import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Loader2, Shield } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { toast } from 'sonner';
import VideoCallModal from '@/components/VideoCallModal';
import { verifyAppointmentStatus } from '@/helpers/verifyAppointmentStatus';

type AppointmentCallButtonProps = {
  appointment: any;
  userRole: 'user' | 'psychologist';
};

const AppointmentCallButton: React.FC<AppointmentCallButtonProps> = ({
  appointment,
  userRole,
}) => {
  const [isVideoCallModalOpen, setIsVideoCallModalOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [participantOnline, setParticipantOnline] = useState(false);

  const { socket, isConnected, isUserOnline } = useSocket();
  // Remove checkCallAvailability since you don't have it
  const { startCall, joinCall, callStatus } = useVideoCall();

  // Get participant ID based on user role
  const participantId =
    userRole === 'psychologist'
      ? appointment.user?._id ||
        (typeof appointment.userId === 'object'
          ? appointment.userId?._id
          : appointment.userId)
      : appointment.psychologist?._id || appointment.psychologistId;

  // Check if the other participant is online
  useEffect(() => {
    if (!participantId || !socket || !isConnected) return;

    const checkOnlineStatus = () => {
      const isOnline = isUserOnline(participantId);
      setParticipantOnline(isOnline);
    };

    // Check immediately and then on a timer
    checkOnlineStatus();
    const interval = setInterval(checkOnlineStatus, 30000);

    // Listen for user connection events
    const handleUsersUpdate = () => checkOnlineStatus();
    socket.on('users_update', handleUsersUpdate);

    return () => {
      clearInterval(interval);
      socket.off('users_update', handleUsersUpdate);
    };
  }, [participantId, socket, isConnected, isUserOnline]);

  // Verify appointment can be joined (within time window)
  const verifiedAppointment = verifyAppointmentStatus(appointment);
  const { canJoin } = verifiedAppointment;

  // Get time until appointment
  const getTimeUntilJoinable = () => {
    if (canJoin) return '';

    const now = new Date();
    const appointmentDate = new Date(
      appointment.startTime || appointment.dateTime || ''
    );
    const joinWindowStart = new Date(appointmentDate);
    joinWindowStart.setMinutes(joinWindowStart.getMinutes() - 5);

    const diffMs = joinWindowStart.getTime() - now.getTime();
    if (diffMs <= 0) return ''; // Past the join window start

    const diffMins = Math.ceil(diffMs / 60000);
    if (diffMins > 60) {
      const hours = Math.floor(diffMins / 60);
      return `Available in ${hours}h ${diffMins % 60}m`;
    }
    return `Available in ${diffMins}m`;
  };

  // Updated handleJoinSession to not use checkCallAvailability
  const handleJoinSession = async () => {
    if (!participantId) {
      toast.error(
        'Could not identify the other participant. Please contact support.'
      );
      return;
    }

    setIsJoining(true);
    setIsCheckingAvailability(true);

    try {
      // Instead of using checkCallAvailability, verify directly here
      const now = new Date();
      const appointmentDate = new Date(
        appointment.startTime || appointment.dateTime || ''
      );
      const appointmentEndDate = new Date(appointment.endTime);

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
            `Session starts in ${minutesBeforeStart} minutes. You can join 5 minutes before.`
          );
        } else if (minutesAfterEnd > 15) {
          toast.error('This session has ended. The joining window has closed.');
        } else {
          toast.error('Cannot join session - outside of allowed time window.');
        }
        setIsJoining(false);
        setIsCheckingAvailability(false);
        return;
      }

      // Check if the other participant is online through socket
      if (!participantOnline) {
        toast.warning(
          'The other participant is currently offline. They will be notified when they return.'
        );
        // We could continue and allow them to join anyway, as the other person might join later
      }

      // Open video call modal first so user sees something happening
      setIsVideoCallModalOpen(true);

      // Wait a moment for modal to open
      setTimeout(() => {
        setIsCheckingAvailability(false);

        // Initiate or join call based on role
        if (userRole === 'psychologist') {
          // Psychologist initiates the call
          startCall(appointment._id, participantId)
            .then(() => {
              console.log('Call started successfully');
              toast.success(
                'Session started successfully. Waiting for the other participant to join.'
              );
            })
            .catch(error => {
              console.error('Failed to start call:', error);
              toast.error('Failed to start video session. Please try again.');
              setIsVideoCallModalOpen(false);
              setIsJoining(false);
            });
        } else {
          // User joins the call
          joinCall(appointment._id, participantId)
            .then(() => {
              console.log('Joined call successfully');
              toast.success('Joining session...');
            })
            .catch(error => {
              console.error('Failed to join call:', error);
              toast.error('Failed to join video session. Please try again.');
              setIsVideoCallModalOpen(false);
              setIsJoining(false);
            });
        }
      }, 500);
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('An error occurred while trying to join the session');
      setIsVideoCallModalOpen(false);
      setIsJoining(false);
      setIsCheckingAvailability(false);
    }
  };

  // Determine button state and appearance
  const getButtonProps = () => {
    if (isJoining) {
      return {
        disabled: true,
        children: (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isCheckingAvailability ? 'Checking...' : 'Joining...'}
          </>
        ),
      };
    }

    if (!canJoin) {
      const timeText = getTimeUntilJoinable();
      return {
        disabled: true,
        variant: 'outline' as const,
        children: (
          <>
            <Video className="mr-2 h-4 w-4" />
            {timeText || 'Join Soon'}
          </>
        ),
      };
    }

    return {
      onClick: handleJoinSession,
      children: (
        <>
          <Video className="mr-2 h-4 w-4" />
          {participantOnline
            ? 'Join Session'
            : 'Join Session (Participant Offline)'}
        </>
      ),
    };
  };

  // Only render for video appointments
  if (appointment.sessionFormat !== 'video') {
    return null;
  }

  const buttonProps = getButtonProps();

  return (
    <>
      <Button
        size="sm"
        className={`${
          canJoin && participantOnline ? 'bg-green-600 hover:bg-green-700' : ''
        } ${
          canJoin && !participantOnline ? 'bg-amber-600 hover:bg-amber-700' : ''
        }`}
        {...buttonProps}
      />

      <VideoCallModal
        open={isVideoCallModalOpen}
        onClose={() => {
          setIsVideoCallModalOpen(false);
          setIsJoining(false);
        }}
      />
    </>
  );
};

export default AppointmentCallButton;
