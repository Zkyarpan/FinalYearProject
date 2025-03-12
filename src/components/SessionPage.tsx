'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const SessionPage = () => {
  const { appointmentId } = useParams();
  const searchParams = useSearchParams();
  const callerId = searchParams.get('caller');

  const router = useRouter();
  const { user } = useUserStore();
  const {
    startCall,
    joinCall,
    endCall,
    localVideoRef,
    remoteVideoRef,
    callStatus,
    mediaStatus,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    localStream,
    remoteStream,
  } = useVideoCall();

  const [isLoading, setIsLoading] = useState(true);
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Get user role
  const userRole = user?.role || 'user';

  useEffect(() => {
    const fetchAppointmentAndJoin = async () => {
      try {
        // Validate inputs
        if (!appointmentId) {
          setError('Missing appointment ID');
          setIsLoading(false);
          return;
        }

        if (!user?._id) {
          setError('User not authenticated');
          setIsLoading(false);
          return;
        }

        // Fetch appointment details
        const response = await fetch(`/api/appointments/${appointmentId}`);

        if (!response.ok) {
          setError('Failed to fetch appointment details');
          setIsLoading(false);
          return;
        }

        const data = await response.json();

        if (!data.IsSuccess) {
          setError(data.ErrorMessage || 'Failed to fetch appointment');
          setIsLoading(false);
          return;
        }

        const appointment = data.Result;
        setAppointmentDetails(appointment);

        // Check if it's a video appointment
        if (appointment.sessionFormat !== 'video') {
          setError('This is not a video appointment');
          setIsLoading(false);
          return;
        }

        // Calculate if we can join
        const now = new Date();
        const startTime = new Date(
          appointment.startTime || appointment.dateTime
        );
        const endTime = new Date(appointment.endTime);

        // Can join 5 minutes before to 15 minutes after
        const joinWindowStart = new Date(startTime);
        joinWindowStart.setMinutes(joinWindowStart.getMinutes() - 5);

        const joinWindowEnd = new Date(endTime);
        joinWindowEnd.setMinutes(joinWindowEnd.getMinutes() + 15);

        if (now < joinWindowStart) {
          const minutesToStart = Math.round(
            (joinWindowStart.getTime() - now.getTime()) / 60000
          );
          setError(`Session will be available in ${minutesToStart} minutes`);
          setIsLoading(false);
          return;
        }

        if (now > joinWindowEnd) {
          setError('This session has ended');
          setIsLoading(false);
          return;
        }

        // Determine participant ID
        let participantId: string;

        if (userRole === 'psychologist') {
          // If we're the psychologist, we need the user ID
          participantId =
            appointment.userId?._id ||
            (typeof appointment.userId === 'string' ? appointment.userId : '');

          // If we have a caller ID from search params, use that instead
          if (callerId) {
            participantId = callerId;
          }
        } else {
          // If we're the user, we need the psychologist ID
          participantId =
            appointment.psychologistId?._id ||
            (typeof appointment.psychologistId === 'string'
              ? appointment.psychologistId
              : '');

          // If we have a caller ID from search params, use that instead
          if (callerId) {
            participantId = callerId;
          }
        }

        if (!participantId) {
          setError('Could not determine session participant');
          setIsLoading(false);
          return;
        }

        console.log(`Starting session with participant: ${participantId}`);

        // Initiate or join call based on role
        if (userRole === 'psychologist' && !callerId) {
          // Psychologist initiates the call
          await startCall(appointmentId as string, participantId);
        } else {
          // User joins the call, or psychologist joins if they have a caller ID
          await joinCall(appointmentId as string, participantId);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error setting up session:', error);
        setError('Failed to set up session');
        setIsLoading(false);
      }
    };

    fetchAppointmentAndJoin();

    // Clean up on unmount
    return () => {
      // End call if active
      endCall();
    };
  }, [appointmentId, callerId, user, userRole, startCall, joinCall, endCall]);

  // Handle UI states
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <h1 className="text-xl font-semibold mb-2">Setting up your session</h1>
        <p className="text-muted-foreground">
          Please wait while we connect you...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <div className="bg-destructive/10 p-4 rounded-lg mb-4">
          <p className="text-destructive font-medium">{error}</p>
        </div>
        <button
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          onClick={() => router.push('/appointments')}
        >
          Back to Appointments
        </button>
      </div>
    );
  }

  // Render video call UI
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Remote Video (Full Screen) */}
      <div className="absolute inset-0 bg-black">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {/* Local Video (Picture-in-Picture) */}
      <div className="absolute top-4 right-4 w-[160px] h-[90px] bg-black/40 rounded-lg overflow-hidden shadow-lg z-10">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
        />
        {isVideoOff && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="bg-primary text-primary-foreground rounded-full p-2">
              You
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-10">
        <div className="flex items-center justify-center space-x-4">
          <button
            className={`h-12 w-12 rounded-full border-2 flex items-center justify-center ${
              isMuted
                ? 'bg-red-600 border-red-600'
                : 'bg-white/10 border-white/20'
            }`}
            onClick={toggleMute}
          >
            {isMuted ? (
              <span className="text-white">🔇</span>
            ) : (
              <span className="text-white">🎤</span>
            )}
          </button>

          <button
            className={`h-12 w-12 rounded-full border-2 flex items-center justify-center ${
              isVideoOff
                ? 'bg-red-600 border-red-600'
                : 'bg-white/10 border-white/20'
            }`}
            onClick={toggleVideo}
          >
            {isVideoOff ? (
              <span className="text-white">🚫</span>
            ) : (
              <span className="text-white">📹</span>
            )}
          </button>

          <button
            className="h-16 w-16 rounded-full bg-red-600 flex items-center justify-center"
            onClick={() => {
              endCall();
              router.push('/appointments');
            }}
          >
            <span className="text-white">📞</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionPage;
