'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Video } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import { useSocket } from '@/contexts/SocketContext';
import { verifyAppointmentStatus } from '@/helpers/verifyAppointmentStatus';

/**
 * SessionNotificationService - Component that monitors upcoming appointments and sends notifications
 *
 * This component should be added to your layout or a global component that's always rendered
 */
const SessionNotificationService = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const { socket } = useSocket();

  // Track appointments that have already been notified
  const notifiedAppointments = useRef(new Set());

  // Check for upcoming appointments every minute
  useEffect(() => {
    // Skip if no user is logged in
    if (!user?._id) return;

    const checkUpcomingAppointments = async () => {
      try {
        // Fetch appointments
        const response = await fetch('/api/appointments?status=upcoming');
        const data = await response.json();

        if (!data.IsSuccess || !data.Result?.appointments) {
          console.error('Failed to fetch appointments for notification check');
          return;
        }

        const appointments = data.Result.appointments;
        const now = new Date();

        // Check each appointment
        appointments.forEach(appointment => {
          // Skip if not a video session
          if (appointment.sessionFormat !== 'video') return;

          // Skip if we've already notified for this appointment
          if (notifiedAppointments.current.has(appointment._id)) return;

          // Get the start time
          const startTime = new Date(
            appointment.startTime || appointment.dateTime
          );

          // Calculate minutes until start
          const minutesUntilStart = Math.round(
            (startTime.getTime() - now.getTime()) / 60000
          );

          // If between 4-6 minutes before start (to account for timing differences)
          if (minutesUntilStart >= 4 && minutesUntilStart <= 6) {
            // Create notification
            sendSessionNotification(appointment);

            // Mark this appointment as notified
            notifiedAppointments.current.add(appointment._id);
          }
        });
      } catch (error) {
        console.error('Error checking for upcoming appointments:', error);
      }
    };

    // Check immediately on mount
    checkUpcomingAppointments();

    // Then check every minute
    const interval = setInterval(checkUpcomingAppointments, 60000);

    return () => clearInterval(interval);
  }, [user]);

  // Also listen for socket notifications about sessions starting soon
  useEffect(() => {
    if (!socket || !user?._id) return;

    const handleSessionNotification = data => {
      if (data.type === 'session_starting_soon') {
        // Don't duplicate notifications for ones we already sent
        if (notifiedAppointments.current.has(data.appointmentId)) return;

        // Show toast
        toast.message(`Upcoming video session in 5 minutes`, {
          icon: <Video className="h-5 w-5" />,
          description: `Your session with ${
            data.providerName || 'your provider'
          } will begin soon.`,
          action: {
            label: 'Join Now',
            onClick: () =>
              router.push(`/appointments?selected=${data.appointmentId}`),
          },
          duration: 15000, // Longer duration for important notifications
        });

        // Mark as notified
        notifiedAppointments.current.add(data.appointmentId);
      }
    };

    socket.on('appointment_notification', handleSessionNotification);

    return () => {
      socket.off('appointment_notification', handleSessionNotification);
    };
  }, [socket, user, router]);

  // Function to send a notification
  const sendSessionNotification = appointment => {
    // Create a toast notification
    toast.message(`Upcoming video session in 5 minutes`, {
      icon: <Video className="h-5 w-5" />,
      description: `Your session with ${
        user?.role === 'psychologist'
          ? appointment.user?.firstName || 'your patient'
          : appointment.psychologist?.firstName || 'your provider'
      } will begin soon.`,
      action: {
        label: 'Join Now',
        onClick: () => router.push(`/appointments?selected=${appointment._id}`),
      },
      duration: 15000, // Longer duration for important notifications
    });

    // Create a database notification if you have an API for this
    createDatabaseNotification(appointment);

    // Also send a socket notification to the other participant if they're online
    sendSocketNotification(appointment);
  };

  // Function to create a database notification
  const createDatabaseNotification = async appointment => {
    try {
      // Skip if no API endpoint exists
      // You can implement this if you have an API endpoint for creating notifications
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'session_starting_soon',
          title: 'Upcoming Video Session',
          content: `Your video session will begin in 5 minutes.`,
          appointmentId: appointment._id,
          appointmentDetails: {
            startTime: appointment.startTime || appointment.dateTime,
            endTime: appointment.endTime,
            psychologistName: appointment.psychologist?.firstName
              ? `${appointment.psychologist.firstName} ${
                  appointment.psychologist.lastName || ''
                }`
              : 'Your Provider',
          },
        }),
      });

      // Process response if needed
    } catch (error) {
      console.error('Error creating database notification:', error);
    }
  };

  // Function to send socket notification to the other participant
  const sendSocketNotification = appointment => {
    if (!socket || !user?._id) return;

    // Determine the other participant based on user role
    const otherParticipantId =
      user.role === 'psychologist'
        ? appointment.user?._id ||
          (typeof appointment.userId === 'object'
            ? appointment.userId?._id
            : appointment.userId)
        : appointment.psychologist?._id || appointment.psychologistId;

    if (!otherParticipantId) return;

    // Send socket notification to the other participant
    socket.emit('appointment_notification', {
      type: 'session_starting_soon',
      from: user._id,
      to: otherParticipantId,
      appointmentId: appointment._id,
      providerName:
        user.role === 'psychologist'
          ? `${user.firstName || ''} ${user.lastName || ''}`
          : appointment.psychologist?.firstName
          ? `${appointment.psychologist.firstName} ${
              appointment.psychologist.lastName || ''
            }`
          : 'Your Provider',
      timestamp: new Date().toISOString(),
    });
  };

  // This component doesn't render anything
  return null;
};

export default SessionNotificationService;
