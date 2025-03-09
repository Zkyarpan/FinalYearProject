'use client';

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';

// Define call state type
export type CallStatus =
  | 'idle'
  | 'pre-offer'
  | 'calling'
  | 'receiving'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'ended';

// Call data type definition
export type CallData = {
  callId: string;
  conversationId?: string;
  remoteUserId: string;
  callType: 'audio' | 'video';
  status: CallStatus;
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  peerConnection?: RTCPeerConnection | null;
  startTime?: Date;
  endTime?: Date;
  isMuted: boolean;
  isVideoOff: boolean;
  remoteIsMuted: boolean;
  remoteIsVideoOff: boolean;
  connectionQuality: 'unknown' | 'good' | 'fair' | 'poor';
};

// Interface for the context
interface VideoCallContextType {
  currentCall: CallData | null;
  incomingCall: CallData | null;
  callStatus: CallStatus;
  callStats: any;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isCallInProgress: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  remoteIsMuted: boolean;
  remoteIsVideoOff: boolean;
  connectionQuality: 'unknown' | 'good' | 'fair' | 'poor';
  callDuration: number;

  // Exposed properties for compatibility with existing code
  callId: string | null;
  callType: 'audio' | 'video' | null;
  conversationId: string | null;

  // Call functions
  startCall: (
    userId: string,
    conversationId: string,
    callType: 'audio' | 'video'
  ) => Promise<boolean>;
  answerCall: () => Promise<boolean>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
}

// WebRTC configuration with STUN/TURN servers
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    {
      urls: 'turn:numb.viagenie.ca',
      username: 'webrtc@live.com',
      credential: 'muazkh',
    },
    // Add your own TURN server for production
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all' as RTCIceTransportPolicy,
  bundlePolicy: 'balanced' as RTCBundlePolicy,
  rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy,
};

// Create the context with default values
const VideoCallContext = createContext<VideoCallContextType>({
  currentCall: null,
  incomingCall: null,
  callStatus: 'idle',
  callStats: null,
  localStream: null,
  remoteStream: null,
  isCallInProgress: false,
  isMuted: false,
  isVideoOff: false,
  remoteIsMuted: false,
  remoteIsVideoOff: false,
  connectionQuality: 'unknown',
  callDuration: 0,

  // Additional fields for existing code compatibility
  callId: null,
  callType: null,
  conversationId: null,

  startCall: async () => false,
  answerCall: async () => false,
  rejectCall: () => {},
  endCall: () => {},
  toggleMute: () => {},
  toggleVideo: () => {},
});

declare global {
  interface Window {
    __incomingCallData?: CallData;
  }
}

// This function initially would have been in the component but moving it to avoid block scope errors
export function formatCallDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  } else if (minutes < 60) {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

export const VideoCallProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Get socket connection and user data
  const { socket } = useSocket();
  const { user } = useUserStore();

  // Call state
  const [currentCall, setCurrentCall] = useState<CallData | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callStats, setCallStats] = useState<any>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [remoteIsMuted, setRemoteIsMuted] = useState<boolean>(false);
  const [remoteIsVideoOff, setRemoteIsVideoOff] = useState<boolean>(false);
  const [connectionQuality, setConnectionQuality] = useState<
    'unknown' | 'good' | 'fair' | 'poor'
  >('unknown');

  // Exposed properties for compatibility
  const callId = currentCall?.callId || null;
  const callType = currentCall?.callType || null;
  const conversationId = currentCall?.conversationId || null;

  // Reference values for WebRTC
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const iceCandidateQueue = useRef<RTCIceCandidate[]>([]);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callDurationRef = useRef<number>(0);
  const statsInterval = useRef<NodeJS.Timeout | null>(null);
  const isCallInProgressRef = useRef<boolean>(false);
  const reconnectionAttempts = useRef<number>(0);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create function refs to avoid circular dependencies - this fixes the block scope errors
  const endCallRef = useRef<(providedConversationId?: string) => void>(
    () => {}
  );
  const createAndSendOfferRef = useRef<
    (
      pc: RTCPeerConnection,
      callId: string,
      remoteUserId: string,
      conversationId: string
    ) => Promise<void>
  >(async () => {});
  const setupPeerConnectionRef = useRef<(callId: string) => RTCPeerConnection>(
    () => new RTCPeerConnection()
  );
  const handleConnectionFailureRef = useRef<() => void>(() => {});

  // Generate a unique call ID
  const generateCallId = useCallback(() => {
    return `call-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }, []);

  // Clean up WebRTC resources
  const cleanupWebRTC = useCallback(() => {
    console.log('Cleaning up WebRTC resources');

    // Stop stats collection
    if (statsInterval.current) {
      clearInterval(statsInterval.current);
      statsInterval.current = null;
    }

    // Stop call timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    // Stop any timeouts
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    // Stop ringtone if playing
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current = null;
    }

    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Stop and release local media streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Clear remote stream
    remoteStreamRef.current = null;

    // Reset reconnection attempts
    reconnectionAttempts.current = 0;

    // Reset call state
    isCallInProgressRef.current = false;
    callDurationRef.current = 0;
    iceCandidateQueue.current = [];

    // Reset state
    setCallStats(null);
    setCallStatus('idle');
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
    setRemoteIsMuted(false);
    setRemoteIsVideoOff(false);
    setConnectionQuality('unknown');
  }, []);

  // Function to collect and process WebRTC stats
  const startStatsCollection = useCallback(() => {
    if (statsInterval.current) {
      clearInterval(statsInterval.current);
    }

    // Collect stats every 2 seconds
    statsInterval.current = setInterval(async () => {
      if (!peerConnection.current || !currentCall) return;

      try {
        const stats = await peerConnection.current.getStats();
        const statsOutput = processRTCStats(stats);

        // Update state with processed stats
        setCallStats(statsOutput);

        // Monitor for quality issues
        checkConnectionQuality(statsOutput);

        // Send stats to server if significant changes
        if (socket && statsOutput.qualityScore !== callStats?.qualityScore) {
          socket.emit('call_metrics', {
            callId: currentCall.callId,
            from: user?._id,
            metrics: statsOutput,
          });
        }
      } catch (error) {
        console.error('Error collecting WebRTC stats:', error);
      }
    }, 2000);
  }, [currentCall, socket, user?._id]);

  // Process WebRTC stats
  const processRTCStats = useCallback((stats: RTCStatsReport) => {
    const output: any = {
      audio: { inbound: {}, outbound: {} },
      video: { inbound: {}, outbound: {} },
      connection: {},
      qualityScore: 0,
    };

    stats.forEach(stat => {
      if (stat.type === 'inbound-rtp' && stat.kind === 'audio') {
        output.audio.inbound = {
          packetsReceived: stat.packetsReceived,
          packetsLost: stat.packetsLost,
          jitter: stat.jitter,
          bytesReceived: stat.bytesReceived,
        };
      } else if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
        output.video.inbound = {
          packetsReceived: stat.packetsReceived,
          packetsLost: stat.packetsLost,
          jitter: stat.jitter,
          framesDecoded: stat.framesDecoded,
          framesDropped: stat.framesDropped,
          frameWidth: stat.frameWidth,
          frameHeight: stat.frameHeight,
          bytesReceived: stat.bytesReceived,
        };
      } else if (stat.type === 'outbound-rtp' && stat.kind === 'audio') {
        output.audio.outbound = {
          packetsSent: stat.packetsSent,
          bytesSent: stat.bytesSent,
        };
      } else if (stat.type === 'outbound-rtp' && stat.kind === 'video') {
        output.video.outbound = {
          packetsSent: stat.packetsSent,
          bytesSent: stat.bytesSent,
          framesEncoded: stat.framesEncoded,
          frameWidth: stat.frameWidth,
          frameHeight: stat.frameHeight,
        };
      } else if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
        output.connection = {
          currentRoundTripTime: stat.currentRoundTripTime,
          availableOutgoingBitrate: stat.availableOutgoingBitrate,
          bytesReceived: stat.bytesReceived,
          bytesSent: stat.bytesSent,
        };
      }
    });

    // Calculate a simple quality score (0-10)
    let qualityScore = 10;

    // Factor in packet loss
    if (output.video.inbound.packetsLost) {
      const videoLossRate =
        output.video.inbound.packetsLost /
        (output.video.inbound.packetsReceived +
          output.video.inbound.packetsLost);
      if (videoLossRate > 0.05) qualityScore -= 3;
      else if (videoLossRate > 0.01) qualityScore -= 1;
    }

    // Factor in jitter
    if (output.video.inbound.jitter && output.video.inbound.jitter > 0.05) {
      qualityScore -= 2;
    }

    // Factor in round trip time
    if (
      output.connection.currentRoundTripTime &&
      output.connection.currentRoundTripTime > 0.3
    ) {
      qualityScore -= 2;
    }

    output.qualityScore = Math.max(0, Math.min(10, qualityScore));

    return output;
  }, []);

  // Check connection quality based on stats
  const checkConnectionQuality = useCallback(
    (stats: any) => {
      if (!stats) return;

      let quality: 'unknown' | 'good' | 'fair' | 'poor' = 'unknown';

      if (stats.qualityScore >= 8) {
        quality = 'good';
      } else if (stats.qualityScore >= 5) {
        quality = 'fair';
      } else {
        quality = 'poor';
      }

      // Update call connection quality
      setConnectionQuality(quality);
      setCurrentCall(prev => {
        if (!prev) return null;
        if (prev.connectionQuality !== quality) {
          return { ...prev, connectionQuality: quality };
        }
        return prev;
      });

      // Notify about poor quality
      if (quality === 'poor' && connectionQuality !== 'poor') {
        toast.warning(
          'Poor connection quality. Try turning off video to improve.',
          {
            id: 'poor-call-quality',
            duration: 5000,
          }
        );
      }
    },
    [connectionQuality]
  );

  const setupPeerConnection = useCallback(
    (callId: string) => {
      // Close any existing peer connection
      if (peerConnection.current) {
        peerConnection.current.close();
      }

      console.log('Setting up new peer connection for call:', callId);

      // Create new peer connection with ICE servers
      const pc = new RTCPeerConnection(rtcConfig);
      peerConnection.current = pc;

      // Create a new remote stream - this is critical
      const newRemoteStream = new MediaStream();
      remoteStreamRef.current = newRemoteStream;

      // Immediately update the UI state with this empty stream
      // This helps ensure the video element is properly connected
      setCurrentCall(prev => {
        if (!prev) return null;
        return { ...prev, remoteStream: newRemoteStream };
      });

      // Handle ICE candidate events with improved logging
      pc.onicecandidate = event => {
        if (!event.candidate) return;

        console.log(
          'Generated ICE candidate:',
          event.candidate.type,
          event.candidate.candidate
        );

        if (socket && currentCall) {
          // Send the ICE candidate to the other peer
          socket.emit('webrtc_signal', {
            type: 'ice-candidate',
            callId,
            from: user?._id,
            to: currentCall.remoteUserId,
            signal: event.candidate,
          });
        }
      };

      // Enhanced ICE connection state monitoring
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state changed to:', pc.iceConnectionState);

        if (pc.iceConnectionState === 'failed') {
          console.warn('ICE connection failed, restarting ICE');
          pc.restartIce();
        } else if (
          pc.iceConnectionState === 'disconnected' ||
          pc.iceConnectionState === 'closed'
        ) {
          console.warn('ICE connection disconnected or closed');
        } else if (
          pc.iceConnectionState === 'connected' ||
          pc.iceConnectionState === 'completed'
        ) {
          console.log('ICE connection established successfully');

          if (callStatus === 'connecting') {
            setCallStatus('connected');
            setCurrentCall(prev => {
              if (!prev) return null;
              return { ...prev, status: 'connected' };
            });
          }
        }
      };

      // Enhanced connection state change monitoring
      pc.onconnectionstatechange = () => {
        console.log('Connection state changed to:', pc.connectionState);

        // Handle disconnection and reconnection
        if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed'
        ) {
          handleConnectionFailureRef.current();
        }

        // When connection is established
        if (pc.connectionState === 'connected') {
          // Reset reconnection attempts
          reconnectionAttempts.current = 0;

          // Start collecting stats
          startStatsCollection();

          // Notify server of successful connection
          if (socket && currentCall) {
            socket.emit('webrtc_signal', {
              type: 'call-state-update',
              callId,
              from: user?._id,
              to: currentCall.remoteUserId,
              connectionState: 'connected',
              mediaState: 'tracks-added',
            });
          }
        }
      };

      // Enhanced track event handler - this is critical to fix
      pc.ontrack = event => {
        try {
          console.log(
            'Got remote track:',
            event.track.kind,
            event.track.id,
            'enabled:',
            event.track.enabled
          );
          console.log('Track ready state:', event.track.readyState);

          // CRITICAL FIX: Always use the original stream from the event
          // This is more reliable than creating our own MediaStream
          if (event.streams && event.streams[0]) {
            const originalStream = event.streams[0];
            console.log(
              'Using original stream from track event:',
              originalStream.id
            );

            // Store the original stream (replacing any previous reference)
            remoteStreamRef.current = originalStream;

            // Force immediate UI update with the complete stream
            setCurrentCall(prev => {
              if (!prev) return null;
              return {
                ...prev,
                remoteStream: originalStream,
                // Don't force remoteIsVideoOff to false here - respect actual track state
              };
            });

            // Log all tracks in the stream for debugging
            const videoTracks = originalStream.getVideoTracks();
            const audioTracks = originalStream.getAudioTracks();

            console.log(
              `Original stream has ${videoTracks.length} video tracks and ${audioTracks.length} audio tracks:`
            );
            console.log(
              originalStream
                .getTracks()
                .map(t => `${t.kind}:${t.id}:${t.enabled}:${t.readyState}`)
                .join(', ')
            );

            // Check if the remote user has video turned off (no video tracks or all tracks disabled)
            const hasActiveVideo =
              videoTracks.length > 0 &&
              videoTracks.some(track => track.enabled);
            setRemoteIsVideoOff(!hasActiveVideo);
          } else {
            console.warn('No stream found in track event');

            // Fallback approach if no stream is present (rare, but possible)
            if (!remoteStreamRef.current) {
              console.log('Creating new remote MediaStream as fallback');
              remoteStreamRef.current = new MediaStream();
            }

            // Add the individual track
            remoteStreamRef.current.addTrack(event.track);

            // Update state
            setCurrentCall(prev => {
              if (!prev) return null;
              return { ...prev, remoteStream: remoteStreamRef.current };
            });
          }

          // Set up track-specific event handlers to properly track mute/unmute state
          if (event.track.kind === 'video') {
            // Update remote video state based on initial track state
            setRemoteIsVideoOff(!event.track.enabled);

            // Listen for track-specific events
            event.track.onmute = () => {
              console.log('Remote video track muted');
              setRemoteIsVideoOff(true);
            };

            event.track.onunmute = () => {
              console.log('Remote video track unmuted');
              setRemoteIsVideoOff(false);
            };

            // Also listen for enabled/disabled changes
            // This requires a polling approach since there's no direct event
            const videoTrackEnabledMonitor = setInterval(() => {
              if (
                event.track.readyState === 'ended' ||
                !remoteStreamRef.current
              ) {
                clearInterval(videoTrackEnabledMonitor);
                return;
              }

              // Check if enabled state has changed
              if (event.track.enabled !== !remoteIsVideoOff) {
                console.log(
                  `Remote video track enabled changed to: ${event.track.enabled}`
                );
                setRemoteIsVideoOff(!event.track.enabled);
              }
            }, 1000);

            // Clean up monitor when track ends
            event.track.onended = () => {
              console.log('Remote video track ended');
              clearInterval(videoTrackEnabledMonitor);
              setRemoteIsVideoOff(true);
            };
          }

          // Similar handlers for audio tracks
          if (event.track.kind === 'audio') {
            setRemoteIsMuted(!event.track.enabled);

            event.track.onmute = () => {
              console.log('Remote audio track muted');
              setRemoteIsMuted(true);
            };

            event.track.onunmute = () => {
              console.log('Remote audio track unmuted');
              setRemoteIsMuted(false);
            };

            event.track.onended = () => {
              console.log('Remote audio track ended');
              setRemoteIsMuted(true);
            };
          }
        } catch (error) {
          console.error('Error in ontrack handler:', error);
        }
      };

      // Add local tracks to peer connection with improved error handling
      if (localStreamRef.current) {
        const tracks = localStreamRef.current.getTracks();
        console.log(`Adding ${tracks.length} local tracks to connection`);

        tracks.forEach(track => {
          try {
            if (pc.connectionState !== 'closed') {
              pc.addTrack(track, localStreamRef.current!);
              console.log(`Added local ${track.kind} track to peer connection`);
            }
          } catch (error) {
            console.error(
              `Error adding ${track.kind} track to peer connection:`,
              error
            );
          }
        });
      } else {
        console.warn(
          'No local stream available when setting up peer connection'
        );
      }

      return pc;
    },
    [currentCall, socket, user?._id, callStatus, startStatsCollection]
  );

  // Store the function in the ref
  useEffect(() => {
    setupPeerConnectionRef.current = setupPeerConnection;
  }, [setupPeerConnection]);

  // Function to handle connection failures and attempt reconnection
  const handleConnectionFailure = useCallback(() => {
    if (!currentCall || !peerConnection.current) return;

    console.warn('WebRTC connection failure, attempting to reconnect...');

    // Update call status
    setCallStatus('reconnecting');
    setCurrentCall(prev => {
      if (!prev) return null;
      return { ...prev, status: 'reconnecting' };
    });

    const maxReconnectAttempts = 3;
    if (reconnectionAttempts.current < maxReconnectAttempts) {
      reconnectionAttempts.current++;

      // Wait a moment before attempting reconnection
      setTimeout(() => {
        if (!currentCall || !socket) return;

        console.log(
          `Attempting reconnection (${reconnectionAttempts.current}/${maxReconnectAttempts})`
        );

        // Notify other peer about reconnection attempt
        socket.emit('webrtc_signal', {
          type: 'call-reconnect',
          callId: currentCall.callId,
          from: user?._id,
          to: currentCall.remoteUserId,
          attempt: reconnectionAttempts.current,
        });

        // Close and recreate peer connection
        peerConnection.current?.close();
        const newPc = setupPeerConnectionRef.current(currentCall.callId);

        // Create and send a new offer - using the ref to avoid circular dependencies
        createAndSendOfferRef.current(
          newPc,
          currentCall.callId,
          currentCall.remoteUserId,
          currentCall.conversationId || ''
        );
      }, 2000 * reconnectionAttempts.current); // Increasing backoff
    } else {
      console.error('Max reconnection attempts reached, ending call');
      endCallRef.current();
    }
  }, [currentCall, socket, user?._id]);

  // Store the function in the ref
  useEffect(() => {
    handleConnectionFailureRef.current = handleConnectionFailure;
  }, [handleConnectionFailure]);

  // Function to create and send offer
  const createAndSendOffer = useCallback(
    async (
      pc: RTCPeerConnection,
      callId: string,
      remoteUserId: string,
      conversationId: string
    ) => {
      try {
        console.log(
          'Creating offer for call:',
          callId,
          'in conversation:',
          conversationId
        );

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
          iceRestart: reconnectionAttempts.current > 0,
        });

        await pc.setLocalDescription(offer);

        if (!socket) {
          throw new Error('Socket not connected when trying to send offer');
        }

        // Send the offer to remote peer
        socket.emit('webrtc_signal', {
          type: 'offer',
          callId,
          from: user?._id,
          to: remoteUserId,
          signal: offer,
          callType: currentCall?.callType || 'video',
          conversationId: conversationId,
        });

        console.log('Offer sent to remote peer');
      } catch (error) {
        console.error('Error creating or sending offer:', error);

        // Show error notification
        toast.error('Failed to start call. Please try again.');
      }
    },
    [currentCall, socket, user?._id]
  );

  // Store the function in the ref
  useEffect(() => {
    createAndSendOfferRef.current = createAndSendOffer;
  }, [createAndSendOffer]);

  // END CALL FUNCTION
  const endCall = useCallback(
    (providedConversationId?: string) => {
      try {
        if (!socket || !currentCall || !user?._id) {
          cleanupWebRTC();
          setCurrentCall(null);
          setCallStatus('idle');
          return;
        }

        console.log('Ending call:', currentCall.callId);

        // Get conversationId from current call or provided parameter
        const conversationId =
          currentCall.conversationId || providedConversationId;

        // Send end call signal with conversationId
        socket.emit('webrtc_signal', {
          type: 'call-ended',
          callId: currentCall.callId,
          from: user._id,
          to: currentCall.remoteUserId,
          duration: callDurationRef.current,
          conversationId: conversationId,
        });

        // Save call history with conversationId
        socket.emit('call_summary', {
          callId: currentCall.callId,
          from: user._id,
          to: currentCall.remoteUserId,
          callType: currentCall.callType,
          duration: callDurationRef.current,
          status: 'ended',
          endedAt: new Date().toISOString(),
          conversationId: conversationId,
        });

        // Clean up WebRTC resources
        cleanupWebRTC();

        // Reset state
        setCurrentCall(null);
        setCallStatus('idle');
      } catch (error) {
        console.error('Error ending call:', error);
        cleanupWebRTC();
        setCurrentCall(null);
        setCallStatus('idle');
      }
    },
    [cleanupWebRTC, currentCall, socket, user]
  );

  // Store the function in the ref
  useEffect(() => {
    endCallRef.current = endCall;
  }, [endCall]);

  // TOGGLE MUTE FUNCTION
  const toggleMute = useCallback(() => {
    if (!currentCall || !localStreamRef.current) {
      console.warn('Cannot toggle mute: no active call or local stream');
      return;
    }

    const audioTracks = localStreamRef.current.getAudioTracks();
    if (audioTracks.length === 0) {
      console.warn('No audio tracks found in local stream');
      return;
    }

    const newMuteState = !isMuted;
    console.log(`Toggling audio to ${newMuteState ? 'muted' : 'unmuted'}`);

    // Toggle mute state of all audio tracks with improved logging
    audioTracks.forEach((track, index) => {
      console.log(
        `Setting audio track ${index} (${track.id}) enabled: ${!newMuteState}`
      );
      track.enabled = !newMuteState;
    });

    // Update state
    setIsMuted(newMuteState);
    setCurrentCall(prev => {
      if (!prev) return null;
      return { ...prev, isMuted: newMuteState };
    });

    // Notify remote peer about mute status change with retry mechanism
    if (socket && currentCall) {
      const signalData = {
        type: 'media-toggle',
        callId: currentCall.callId,
        from: user?._id,
        to: currentCall.remoteUserId,
        mediaType: 'audio',
        enabled: !newMuteState,
      };

      // Send the signal
      socket.emit('webrtc_signal', signalData);

      // Retry once after a short delay to ensure delivery
      setTimeout(() => {
        if (socket && currentCall) {
          // Check again in case things changed
          socket.emit('webrtc_signal', {
            ...signalData,
            retried: true,
          });
        }
      }, 500);

      console.log(
        `Notified remote peer that microphone is now ${
          newMuteState ? 'muted' : 'unmuted'
        }`
      );
    }
  }, [currentCall, isMuted, socket, user?._id]);

  // TOGGLE VIDEO FUNCTION
  const toggleVideo = useCallback(() => {
    if (!currentCall || !localStreamRef.current) {
      console.warn('Cannot toggle video: no active call or local stream');
      return;
    }

    const videoTracks = localStreamRef.current.getVideoTracks();
    if (videoTracks.length === 0) {
      console.warn('No video tracks found in local stream');
      return;
    }

    const newVideoState = !isVideoOff;
    console.log(`Toggling video to ${newVideoState ? 'off' : 'on'}`);

    // Toggle video state of all video tracks with improved logging
    videoTracks.forEach((track, index) => {
      console.log(
        `Setting video track ${index} (${track.id}) enabled: ${!newVideoState}`
      );
      track.enabled = !newVideoState;
    });

    // Update state
    setIsVideoOff(newVideoState);
    setCurrentCall(prev => {
      if (!prev) return null;
      return { ...prev, isVideoOff: newVideoState };
    });

    // Notify remote peer about video status change with retry mechanism
    if (socket && currentCall) {
      const signalData = {
        type: 'media-toggle',
        callId: currentCall.callId,
        from: user?._id,
        to: currentCall.remoteUserId,
        mediaType: 'video',
        enabled: !newVideoState,
      };

      // Send the signal
      socket.emit('webrtc_signal', signalData);

      // Retry once after a short delay to ensure delivery
      setTimeout(() => {
        if (socket && currentCall) {
          // Check again in case things changed
          socket.emit('webrtc_signal', {
            ...signalData,
            retried: true,
          });
        }
      }, 500);

      console.log(
        `Notified remote peer that video is now ${newVideoState ? 'off' : 'on'}`
      );
    }
  }, [currentCall, isVideoOff, socket, user?._id]);

  // REJECT CALL FUNCTION
  const rejectCall = useCallback(() => {
    try {
      if (!socket || !incomingCall || !user?._id) {
        return;
      }

      console.log('Rejecting call:', incomingCall.callId);

      // Send rejection signal
      socket.emit('webrtc_signal', {
        type: 'call-rejected',
        callId: incomingCall.callId,
        from: user._id,
        to: incomingCall.remoteUserId,
      });

      // Stop ringtone if playing
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }

      // Dismiss call notification
      toast.dismiss('incoming-call');

      // Clear incoming call
      setIncomingCall(null);
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  }, [incomingCall, socket, user]);

  // ANSWER CALL FUNCTION
  const answerCall = useCallback(async () => {
    try {
      // Store the incoming call data in a local variable to prevent it from being lost
      const callToAnswer = incomingCall;

      // Add more detailed logging to help identify issues
      console.log('Attempting to answer call with data:', callToAnswer);
      console.log('Socket connected:', !!socket);
      console.log('User ID:', user?._id);

      if (!socket) {
        throw new Error('Socket is not connected.');
      }

      if (!callToAnswer) {
        throw new Error('No incoming call to answer.');
      }

      if (!user?._id) {
        throw new Error('User ID not available.');
      }

      console.log('Answering call:', callToAnswer.callId);
      isCallInProgressRef.current = true;

      // Get local media
      const constraints =
        callToAnswer.callType === 'audio'
          ? { audio: true, video: false }
          : {
              audio: true,
              video: {
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
                frameRate: { ideal: 24, max: 30 },
              },
            };

      try {
        // Get media stream with clear error handling
        console.log('Requesting media with constraints:', constraints);
        localStreamRef.current = await navigator.mediaDevices.getUserMedia(
          constraints
        );
        console.log(
          'Local stream obtained successfully:',
          localStreamRef.current?.id
        );
      } catch (mediaError) {
        console.error('Failed to get local media stream:', mediaError);
        toast.error(
          `Could not access camera/microphone: ${mediaError.message}`
        );
        throw mediaError;
      }

      // Set up peer connection
      console.log('Setting up peer connection');
      const pc = setupPeerConnectionRef.current(callToAnswer.callId);

      // Create call data from incoming call
      const callData: CallData = {
        ...callToAnswer,
        status: 'connecting' as CallStatus,
        localStream: localStreamRef.current,
        peerConnection: pc,
        isMuted: false,
        isVideoOff: callToAnswer.callType === 'audio',
        remoteIsMuted: false,
        remoteIsVideoOff: callToAnswer.callType === 'audio',
      };

      // Update states - do this before trying to answer to ensure UI feedback
      console.log('Updating call state to connecting');
      setCurrentCall(callData);
      setCallStatus('connecting');
      setIsVideoOff(callToAnswer.callType === 'audio');

      // Stop ringtone if playing
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }

      // Clear the incoming call AFTER we've captured the necessary data
      // This prevents the race condition where incomingCall is null when we try to use it
      setIncomingCall(null);

      // Set remote description from offer
      if (callToAnswer.remoteStream && pc) {
        try {
          console.log('Setting remote description from offer');
          await pc.setRemoteDescription(
            new RTCSessionDescription(callToAnswer.remoteStream as any)
          );

          // Create answer
          console.log('Creating answer');
          const answer = await pc.createAnswer();
          console.log('Setting local description');
          await pc.setLocalDescription(answer);

          // Send answer to caller
          console.log('Sending answer to caller:', callToAnswer.remoteUserId);
          socket.emit('webrtc_signal', {
            type: 'answer',
            callId: callToAnswer.callId,
            from: user._id,
            to: callToAnswer.remoteUserId,
            signal: answer,
          });

          console.log('Call answer sent');

          // Process any queued ICE candidates
          console.log(
            `Processing ${iceCandidateQueue.current.length} queued ICE candidates`
          );
          iceCandidateQueue.current.forEach(candidate => {
            pc.addIceCandidate(candidate).catch(e =>
              console.error('Error adding queued ICE candidate:', e)
            );
          });
          iceCandidateQueue.current = [];

          // Start call timer
          callDurationRef.current = 0;
          if (callTimerRef.current) {
            clearInterval(callTimerRef.current);
          }
          callTimerRef.current = setInterval(() => {
            callDurationRef.current += 1;
            setCallDuration(callDurationRef.current);
          }, 1000);

          return true;
        } catch (error) {
          console.error('Error in WebRTC connection setup:', error);
          toast.error('Failed to establish call connection');
          endCallRef.current();
          return false;
        }
      } else {
        console.error('Missing remote description in incoming call');
        toast.error('Call connection error - missing offer data');
        endCallRef.current();
        return false;
      }
    } catch (error) {
      console.error('Error answering call:', error);
      toast.error(`Could not answer call: ${(error as Error).message}`);

      cleanupWebRTC();
      isCallInProgressRef.current = false;
      return false;
    }
  }, [cleanupWebRTC, incomingCall, socket, user]);

  // START CALL FUNCTION
  const startCall = useCallback(
    async (
      userId: string,
      conversationId: string,
      callType: 'audio' | 'video'
    ) => {
      try {
        if (!socket || !user?._id || isCallInProgressRef.current) {
          throw new Error(
            'Cannot start call. Either socket not connected or call already in progress.'
          );
        }

        // IMPORTANT: Store the conversationId in a ref to ensure it's available later
        const currentConversationId = conversationId;
        console.log(
          `Starting ${callType} call to user ${userId} in conversation ${currentConversationId}`
        );
        isCallInProgressRef.current = true;

        // Check if user is available first
        return new Promise<boolean>((resolve, reject) => {
          socket.emit(
            'check_call_availability',
            userId,
            async (response: { available: boolean; reason?: string }) => {
              if (!response.available) {
                console.log(
                  `User ${userId} is not available. Reason: ${response.reason}`
                );

                if (response.reason === 'offline') {
                  toast.error('User is offline.');
                } else if (response.reason === 'busy') {
                  toast.error('User is on another call.');
                } else {
                  toast.error('Cannot reach user. Try again later.');
                }

                isCallInProgressRef.current = false;
                resolve(false);
                return;
              }

              try {
                // First check if browser supports getUserMedia
                if (
                  !navigator.mediaDevices ||
                  !navigator.mediaDevices.getUserMedia
                ) {
                  throw new Error('Your browser does not support video calls');
                }

                // Prepare media constraints based on call type with fallbacks
                const constraints = {
                  audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                  },
                  video:
                    callType === 'video'
                      ? {
                          width: { ideal: 1280, max: 1920 },
                          height: { ideal: 720, max: 1080 },
                          frameRate: { ideal: 24, max: 30 },
                        }
                      : false,
                };

                // Get local media stream with enhanced error handling
                try {
                  localStreamRef.current =
                    await navigator.mediaDevices.getUserMedia(constraints);
                  console.log(
                    'Local stream obtained successfully:',
                    localStreamRef.current
                      .getTracks()
                      .map(t => `${t.kind}:${t.enabled}`)
                      .join(', ')
                  );
                } catch (mediaError: any) {
                  console.error(
                    'Failed to get local media stream:',
                    mediaError
                  );

                  // Try fallback constraints if the initial request fails
                  try {
                    console.log('Trying fallback media constraints');
                    const fallbackConstraints = {
                      audio: true,
                      video:
                        callType === 'video' ? { facingMode: 'user' } : false,
                    };

                    localStreamRef.current =
                      await navigator.mediaDevices.getUserMedia(
                        fallbackConstraints
                      );
                    console.log(
                      'Local stream obtained with fallback constraints'
                    );
                  } catch (fallbackError) {
                    console.error(
                      'Fallback media request also failed:',
                      fallbackError
                    );
                    toast.error(
                      `Could not access camera/microphone: ${mediaError.message}. Please check your permissions.`
                    );
                    isCallInProgressRef.current = false;
                    resolve(false);
                    return;
                  }
                }

                // Generate call ID
                const callId = generateCallId();

                // Create call data - IMPORTANT: Store the conversationId here
                const callData: CallData = {
                  callId,
                  remoteUserId: userId,
                  callType,
                  status: 'calling',
                  localStream: localStreamRef.current,
                  isMuted: false,
                  isVideoOff: callType === 'audio',
                  remoteIsMuted: false,
                  remoteIsVideoOff: callType === 'audio',
                  connectionQuality: 'unknown',
                  conversationId: currentConversationId, // Store the conversationId here
                };

                // Store conversationId in a session storage as backup
                try {
                  sessionStorage.setItem(
                    `call_${callId}_conversation`,
                    currentConversationId
                  );
                } catch (e) {
                  console.warn(
                    'Could not store conversationId in session storage:',
                    e
                  );
                }

                // Set up peer connection
                const pc = setupPeerConnectionRef.current(callId);
                callData.peerConnection = pc;

                // Update state
                setCurrentCall(callData);
                setCallStatus('calling');
                setIsVideoOff(callType === 'audio');

                // Send pre-offer to check if recipient can accept calls
                // IMPORTANT: Include conversationId in all signals
                socket.emit('webrtc_signal', {
                  type: 'pre-offer',
                  callId,
                  from: user._id,
                  to: userId,
                  callType,
                  conversationId: currentConversationId,
                });

                // Listen for pre-offer answer with timeout
                const preOfferTimeout = setTimeout(() => {
                  console.warn('Pre-offer timeout');
                  cleanupWebRTC();
                  setCurrentCall(null);
                  setCallStatus('idle');
                  isCallInProgressRef.current = false;
                  toast.error('Call request timed out.');
                  resolve(false);
                }, 15000); // 15 seconds timeout

                // One-time event listener for pre-offer answer
                socket.once('webrtc_signal', async data => {
                  clearTimeout(preOfferTimeout);

                  if (
                    data.type === 'pre-offer-answer' &&
                    data.callId === callId
                  ) {
                    if (data.response === 'accepted') {
                      // Create and send offer - IMPORTANT: Include conversationId
                      await createAndSendOfferRef.current(
                        pc,
                        callId,
                        userId,
                        currentConversationId
                      );
                      resolve(true);
                    } else {
                      // Handle rejection or busy
                      console.log(`Call pre-offer rejected: ${data.response}`);

                      if (data.response === 'rejected') {
                        toast.error('Call was rejected.');
                      } else if (data.response === 'busy') {
                        toast.error('User is busy on another call.');
                      } else {
                        toast.error('Call failed to connect.');
                      }

                      cleanupWebRTC();
                      setCurrentCall(null);
                      setCallStatus('idle');
                      isCallInProgressRef.current = false;
                      resolve(false);
                    }
                  }
                });

                // Start a timer to automatically end the call if not answered
                callTimeoutRef.current = setTimeout(() => {
                  if (callStatus === 'calling') {
                    toast.error('Call not answered');
                    endCallRef.current(currentConversationId); // Pass conversationId explicitly
                    resolve(false);
                  }
                }, 60000); // 60 seconds timeout
              } catch (error) {
                console.error('Error starting call:', error);

                toast.error(
                  `Could not access camera/microphone: ${error.message}`
                );

                cleanupWebRTC();
                isCallInProgressRef.current = false;
                resolve(false);
              }
            }
          );
        });
      } catch (error) {
        console.error('Error in startCall:', error);

        toast.error(`Call failed: ${(error as Error).message}`);

        cleanupWebRTC();
        isCallInProgressRef.current = false;
        return false;
      }
    },
    [cleanupWebRTC, generateCallId, socket, user, callStatus]
  );

  const handleManualAnswerCall = async (callToAnswer: CallData) => {
    try {
      console.log('Manually answering call with stored data:', callToAnswer);

      if (!socket) {
        throw new Error('Socket is not connected.');
      }

      if (!user?._id) {
        throw new Error('User ID not available.');
      }

      isCallInProgressRef.current = true;

      // Get local media
      const constraints =
        callToAnswer.callType === 'audio'
          ? { audio: true, video: false }
          : {
              audio: true,
              video: {
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
                frameRate: { ideal: 24, max: 30 },
              },
            };

      try {
        // Get media stream with clear error handling
        console.log('Requesting media with constraints:', constraints);
        localStreamRef.current = await navigator.mediaDevices.getUserMedia(
          constraints
        );
        console.log(
          'Local stream obtained successfully:',
          localStreamRef.current?.id
        );
      } catch (mediaError) {
        console.error('Failed to get local media stream:', mediaError);
        toast.error(
          `Could not access camera/microphone: ${mediaError.message}`
        );
        throw mediaError;
      }

      // Set up peer connection
      console.log('Setting up peer connection');
      const pc = setupPeerConnectionRef.current(callToAnswer.callId);

      // Create call data from incoming call
      const callData: CallData = {
        ...callToAnswer,
        status: 'connecting' as CallStatus,
        localStream: localStreamRef.current,
        peerConnection: pc,
        isMuted: false,
        isVideoOff: callToAnswer.callType === 'audio',
        remoteIsMuted: false,
        remoteIsVideoOff: callToAnswer.callType === 'audio',
      };

      // Update states - do this before trying to answer to ensure UI feedback
      console.log('Updating call state to connecting');
      setCurrentCall(callData);
      setCallStatus('connecting');
      setIsVideoOff(callToAnswer.callType === 'audio');

      // Stop ringtone if playing
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }

      // Clear the incoming call state
      setIncomingCall(null);

      // Also clear the stored global call data
      window.__incomingCallData = undefined;

      // Set remote description from offer
      if (callToAnswer.remoteStream && pc) {
        try {
          console.log('Setting remote description from offer');
          await pc.setRemoteDescription(
            new RTCSessionDescription(callToAnswer.remoteStream as any)
          );

          // Create answer
          console.log('Creating answer');
          const answer = await pc.createAnswer();
          console.log('Setting local description');
          await pc.setLocalDescription(answer);

          // Send answer to caller
          console.log('Sending answer to caller:', callToAnswer.remoteUserId);
          socket.emit('webrtc_signal', {
            type: 'answer',
            callId: callToAnswer.callId,
            from: user._id,
            to: callToAnswer.remoteUserId,
            signal: answer,
          });

          console.log('Call answer sent');

          // Process any queued ICE candidates
          console.log(
            `Processing ${iceCandidateQueue.current.length} queued ICE candidates`
          );
          iceCandidateQueue.current.forEach(candidate => {
            pc.addIceCandidate(candidate).catch(e =>
              console.error('Error adding queued ICE candidate:', e)
            );
          });
          iceCandidateQueue.current = [];

          // Start call timer
          callDurationRef.current = 0;
          if (callTimerRef.current) {
            clearInterval(callTimerRef.current);
          }
          callTimerRef.current = setInterval(() => {
            callDurationRef.current += 1;
            setCallDuration(callDurationRef.current);
          }, 1000);

          return true;
        } catch (error) {
          console.error('Error in WebRTC connection setup:', error);
          toast.error('Failed to establish call connection');
          endCallRef.current();
          return false;
        }
      } else {
        console.error('Missing remote description in incoming call');
        toast.error('Call connection error - missing offer data');
        endCallRef.current();
        return false;
      }
    } catch (error) {
      console.error('Error answering call:', error);
      toast.error(`Could not answer call: ${(error as Error).message}`);

      cleanupWebRTC();
      isCallInProgressRef.current = false;
      return false;
    }
  };

  // REGISTER WEBRTC SIGNAL HANDLERS
  useEffect(() => {
    if (!socket) return;

    // Function to handle incoming WebRTC signals
    const handleWebRTCSignal = async (data: any) => {
      console.log(`Received WebRTC signal: ${data.type} from ${data.from}`);

      try {
        const { type, from, callId, signal, callType, conversationId } = data;

        // Handle different signal types
        if (type === 'pre-offer') {
          // Enhanced logging
          console.log(
            `Received pre-offer for call type: ${
              callType || 'video'
            } from ${from}`
          );

          // For pre-offer checks, send 'accepted' if not in a call
          if (callStatus !== 'idle') {
            // Busy response with improved logging
            console.log(
              `Rejecting pre-offer as already in call with status: ${callStatus}`
            );
            socket.emit('webrtc_signal', {
              type: 'pre-offer-answer',
              callId,
              from: user?._id,
              to: from,
              response: 'busy',
            });
            return;
          }

          // Send accepted response
          console.log('Accepting pre-offer and awaiting offer');
          socket.emit('webrtc_signal', {
            type: 'pre-offer-answer',
            callId,
            from: user?._id,
            to: from,
            response: 'accepted',
          });

          console.log('Pre-offer accepted, waiting for offer');
        } else if (type === 'offer') {
          // Enhanced logging for incoming call
          console.log(
            `Incoming ${
              callType || 'video'
            } call from ${from}, callId: ${callId}`
          );

          // Check if already in a call
          if (callStatus !== 'idle') {
            console.log(
              `Already in a call with status ${callStatus}, rejecting offer`
            );

            // Reject the call
            socket.emit('webrtc_signal', {
              type: 'call-rejected',
              callId,
              from: user?._id,
              to: from,
              conversationId, // Include conversationId to prevent history errors
            });
            return;
          }

          // Create incoming call data with enhanced validation
          const incomingCallData: CallData = {
            callId,
            remoteUserId: from,
            callType: callType || 'video',
            status: 'receiving',
            remoteStream: signal, // Store offer in remoteStream temporarily
            isMuted: false,
            isVideoOff: callType === 'audio',
            remoteIsMuted: false,
            remoteIsVideoOff: callType === 'audio',
            connectionQuality: 'unknown',
            conversationId, // Make sure we capture this
          };

          // More detailed logging
          console.log(
            'Setting incoming call data:',
            JSON.stringify({
              callId: incomingCallData.callId,
              from: incomingCallData.remoteUserId,
              type: incomingCallData.callType,
              conversationId: incomingCallData.conversationId,
            })
          );

          // Set incoming call state
          setIncomingCall(incomingCallData);
          setCallStatus('receiving');

          // Also store in a global variable to prevent race conditions
          window.__incomingCallData = incomingCallData;

          // Play ringtone with better error handling
          try {
            const ringtone = new Audio('/sounds/incoming-call.mp3');
            ringtone.loop = true;
            ringtone.play().catch(e => {
              console.log('Could not play ringtone:', e);
              // Try alternate approach if autoplay was blocked
              document.addEventListener('click', function playOnClick() {
                ringtone
                  .play()
                  .catch(err =>
                    console.log('Still cannot play ringtone:', err)
                  );
                document.removeEventListener('click', playOnClick);
              });
            });
            ringtoneRef.current = ringtone;

            // Auto-reject call after 30 seconds if not answered
            console.log(
              `Setting auto-reject timeout of 30 seconds for call ${callId}`
            );
            callTimeoutRef.current = setTimeout(() => {
              if (incomingCall && incomingCall.callId === callId) {
                console.log('Auto-rejecting call after timeout');
                rejectCall();
                if (ringtoneRef.current) {
                  ringtoneRef.current.pause();
                }
              }
            }, 30000);
          } catch (error) {
            console.error('Error playing ringtone:', error);
          }

          // Show incoming call notification
          toast.custom(
            () => (
              <div className="p-4 bg-[#1a1a1a] rounded-lg shadow-lg flex flex-col gap-3 border border-[#333333]">
                <h3 className="font-bold text-white">
                  Incoming {callType || 'Video'} Call
                </h3>
                <p className="text-gray-300">From: {from}</p>
                <div className="flex gap-2 justify-end mt-2">
                  <button
                    onClick={() => {
                      rejectCall();
                      toast.dismiss('incoming-call');
                    }}
                    className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => {
                      // Use the stored call data instead of relying on state
                      const storedCallData = window.__incomingCallData;
                      if (storedCallData) {
                        console.log(
                          'Manually answering call using stored data:',
                          storedCallData.callId
                        );
                        handleManualAnswerCall(storedCallData);
                      } else {
                        console.error('No stored incoming call data found');
                        toast.error(
                          'Failed to answer call: No call data found'
                        );
                      }
                      toast.dismiss('incoming-call');
                    }}
                    className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Answer
                  </button>
                </div>
              </div>
            ),
            {
              id: 'incoming-call',
              duration: 30000,
            }
          );
        } else if (type === 'answer') {
          // Enhanced logging for answer handling
          console.log(`Call ${callId} was answered by ${from}`);

          // Improved validation with detailed logging
          if (!currentCall) {
            console.warn(
              `No current call found when receiving answer for call ${callId}`
            );
            return;
          }

          if (currentCall.callId !== callId) {
            console.warn(
              `Answer received for call ${callId}, but current call is ${currentCall.callId}`
            );
            return;
          }

          if (!peerConnection.current) {
            console.warn('No peer connection available when receiving answer');
            return;
          }

          try {
            // Set remote description from answer with enhanced logging
            console.log('Setting remote description from answer');
            const answerDesc = new RTCSessionDescription(signal);
            await peerConnection.current.setRemoteDescription(answerDesc);

            // Update call status
            console.log(
              'Remote description set successfully, updating call status to connected'
            );
            setCallStatus('connected');
            setCurrentCall(prev => {
              if (!prev) return null;
              return { ...prev, status: 'connected', startTime: new Date() };
            });

            // Start call timer
            callDurationRef.current = 0;
            if (callTimerRef.current) {
              clearInterval(callTimerRef.current);
            }
            callTimerRef.current = setInterval(() => {
              callDurationRef.current += 1;
              setCallDuration(callDurationRef.current);
            }, 1000);

            // Clear any call timeouts
            if (callTimeoutRef.current) {
              clearTimeout(callTimeoutRef.current);
              callTimeoutRef.current = null;
            }

            // Notify user call was connected
            toast.success('Call connected');

            // Add stats logging to monitor call quality after connection
            // Fix type error by properly defining the array type
            setTimeout(() => {
              if (
                peerConnection.current &&
                currentCall &&
                currentCall.callId === callId
              ) {
                peerConnection.current
                  .getStats()
                  .then(stats => {
                    // Define a proper type for trackInfo array
                    let trackInfo: Array<{
                      type: any;
                      kind: any;
                      trackId: any;
                    }> = [];

                    stats.forEach(stat => {
                      if (
                        stat.type === 'track' ||
                        stat.type === 'inbound-rtp' ||
                        stat.type === 'outbound-rtp'
                      ) {
                        trackInfo.push({
                          type: stat.type,
                          kind: stat.kind || 'unknown',
                          trackId: stat.trackId || stat.id,
                        });
                      }
                    });
                    console.log('Connection stats after answer:', trackInfo);
                  })
                  .catch(e => console.error('Could not get call stats:', e));
              }
            }, 2000);
          } catch (error) {
            console.error(
              'Error setting remote description from answer:',
              error
            );

            // End call on error with more detail
            console.log('Ending call due to error in answer handling');
            endCallRef.current();
            toast.error('Failed to establish call connection');
          }
        } else if (type === 'ice-candidate') {
          // Enhanced ICE candidate handling with more logging
          const isIncomingCallMatching =
            incomingCall && incomingCall.callId === callId;
          const isCurrentCallMatching =
            currentCall && currentCall.callId === callId;

          if (!isIncomingCallMatching && !isCurrentCallMatching) {
            console.warn(
              `No matching call found for ICE candidate for call ${callId}`
            );
            return;
          }

          try {
            // For incoming calls that haven't been answered yet, queue the candidates
            if (isIncomingCallMatching && !peerConnection.current) {
              // Queue the candidate for later processing
              const candidate = new RTCIceCandidate(signal);
              iceCandidateQueue.current.push(candidate);
              console.log(
                `Queued ICE candidate (type: ${
                  candidate.type || 'unknown'
                }) for later processing`
              );
              return;
            }

            // For active calls, add the candidate immediately
            if (peerConnection.current) {
              const candidate = new RTCIceCandidate(signal);
              await peerConnection.current.addIceCandidate(candidate);
              console.log(
                `Added ICE candidate successfully (type: ${
                  candidate.type || 'unknown'
                })`
              );

              // Log ICE connection state after adding candidate
              console.log(
                `ICE connection state after adding candidate: ${peerConnection.current.iceConnectionState}`
              );
            }
          } catch (error) {
            console.error('Error adding ICE candidate:', error);

            // Try to log more details about the error and candidate
            console.error('Candidate that failed:', JSON.stringify(signal));
            console.error(
              'Current ICE gathering state:',
              peerConnection.current?.iceGatheringState
            );
            console.error(
              'Current ICE connection state:',
              peerConnection.current?.iceConnectionState
            );
          }
        } else if (type === 'call-ended') {
          // Enhanced call-ended handling
          console.log(`Call ${callId} ended by ${from}`);

          // Check if this matches current call
          if (currentCall && currentCall.callId === callId) {
            // Show notification
            toast.info('Call ended by other participant');

            // Log call duration if it was active
            if (callDurationRef.current > 0) {
              console.log(`Call lasted for ${callDurationRef.current} seconds`);
            }

            // Clean up resources
            cleanupWebRTC();
            setCurrentCall(null);
            setCallStatus('idle');
          }

          // Check if this matches incoming call
          if (incomingCall && incomingCall.callId === callId) {
            console.log('Ending incoming call that was not answered');

            // Stop ringtone if playing
            if (ringtoneRef.current) {
              ringtoneRef.current.pause();
              ringtoneRef.current = null;
            }

            // Clear any timeouts
            if (callTimeoutRef.current) {
              clearTimeout(callTimeoutRef.current);
              callTimeoutRef.current = null;
            }

            // Dismiss call notification
            toast.dismiss('incoming-call');

            setIncomingCall(null);
            setCallStatus('idle');
          }
        } else if (type === 'call-rejected') {
          // Handle call rejected with improved logging
          console.log(`Call ${callId} rejected by ${from}`);

          // Check if this matches current call
          if (currentCall && currentCall.callId === callId) {
            // Show notification
            toast.error('Call rejected');

            // Clean up resources
            cleanupWebRTC();
            setCurrentCall(null);
            setCallStatus('idle');
          }
        } else if (type === 'user-unavailable') {
          // Handle user unavailable with improved logging
          console.log(`User ${from} unavailable for call ${callId}`);

          // Check if this matches current call
          if (currentCall && currentCall.callId === callId) {
            // Show notification
            toast.error('User is unavailable or offline');

            // Clean up resources
            cleanupWebRTC();
            setCurrentCall(null);
            setCallStatus('idle');
          }
        } else if (type === 'call-missed') {
          // Handle call missed with improved logging
          console.log(`Call ${callId} was missed by ${from}`);

          // Check if this matches current call
          if (currentCall && currentCall.callId === callId) {
            // Show notification
            toast.error('Call was not answered');

            // Clean up resources
            cleanupWebRTC();
            setCurrentCall(null);
            setCallStatus('idle');
          }
        } else if (type === 'media-toggle') {
          // Enhanced media toggle handling
          const { mediaType, enabled } = data;

          console.log(
            `Remote ${mediaType} ${
              enabled ? 'enabled' : 'disabled'
            } for call ${callId}`
          );

          // Verify this is for the current call with better validation
          if (currentCall && currentCall.callId === callId) {
            // Update call state based on media type with improved logging
            if (mediaType === 'audio') {
              console.log(
                `Setting remote audio to ${enabled ? 'unmuted' : 'muted'}`
              );
              setRemoteIsMuted(!enabled);
              setCurrentCall(prev => {
                if (!prev) return null;
                return { ...prev, remoteIsMuted: !enabled };
              });
            } else if (mediaType === 'video') {
              console.log(`Setting remote video to ${enabled ? 'on' : 'off'}`);
              setRemoteIsVideoOff(!enabled);
              setCurrentCall(prev => {
                if (!prev) return null;
                return { ...prev, remoteIsVideoOff: !enabled };
              });

              // If video was just enabled, force refresh the remote stream references
              if (enabled && remoteStreamRef.current) {
                console.log(
                  'Remote video enabled, refreshing stream references'
                );

                // Update state to trigger UI refresh
                setCurrentCall(prev => {
                  if (!prev) return null;
                  // Temporarily set to null to force React to detect the change
                  return {
                    ...prev,
                    remoteStream: null,
                  };
                });

                // Then set it back with a slight delay to ensure React detects the change
                setTimeout(() => {
                  if (currentCall && currentCall.callId === callId) {
                    // Check again to be safe
                    setCurrentCall(prev => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        remoteStream: remoteStreamRef.current,
                      };
                    });

                    // Also check and log if remote video track is enabled
                    if (remoteStreamRef.current) {
                      const videoTracks =
                        remoteStreamRef.current.getVideoTracks();
                      if (videoTracks.length > 0) {
                        console.log(
                          `Remote video tracks: ${videoTracks.length}, enabled: ${videoTracks[0].enabled}`
                        );
                      } else {
                        console.warn(
                          'No remote video tracks found after toggle'
                        );
                      }
                    }
                  }
                }, 50);
              }
            }
          } else {
            console.warn(`Received media-toggle for unknown call: ${callId}`);
          }
        } else if (type === 'call-reconnect') {
          // Enhanced call reconnect handling
          console.log(
            `Received reconnection attempt for call ${callId} from ${from}`
          );

          // Check if this matches current call
          if (currentCall && currentCall.callId === callId) {
            // Update call status
            console.log('Setting call status to reconnecting');
            setCallStatus('reconnecting');
            setCurrentCall(prev => {
              if (!prev) return null;
              return { ...prev, status: 'reconnecting' };
            });

            // Show notification
            toast.info('Reconnecting call...', {
              id: 'call-reconnecting',
            });

            // Add additional handling to help with reconnection
            if (peerConnection.current) {
              console.log(
                'Current connection state:',
                peerConnection.current.connectionState
              );
              console.log(
                'Current ICE connection state:',
                peerConnection.current.iceConnectionState
              );

              // If connection is failed, try restarting ICE
              if (peerConnection.current.iceConnectionState === 'failed') {
                console.log('Attempting to restart ICE connection');
                peerConnection.current.restartIce();
              }
            }
          }
        } else if (type === 'call-state-update') {
          // Enhanced call state update handling
          const { connectionState, mediaState } = data;

          console.log(
            `Call ${callId} state update: connection=${connectionState}, media=${mediaState}`
          );

          // Update UI with remote peer's connection state
          if (currentCall && currentCall.callId === callId) {
            if (
              connectionState === 'connected' &&
              callStatus === 'connecting'
            ) {
              console.log(
                'Updating call status to connected based on remote update'
              );
              setCallStatus('connected');
              setCurrentCall(prev => {
                if (!prev) return null;
                return { ...prev, status: 'connected' };
              });
            }

            // Handle media state updates
            if (mediaState === 'tracks-added') {
              console.log('Remote peer has added media tracks');

              // If we have a peer connection, check if we have all expected tracks
              if (peerConnection.current && remoteStreamRef.current) {
                const audioTracks = remoteStreamRef.current.getAudioTracks();
                const videoTracks = remoteStreamRef.current.getVideoTracks();

                console.log(
                  `Current remote stream has ${audioTracks.length} audio and ${videoTracks.length} video tracks`
                );

                // If we're expecting video but don't have it, try to refresh the UI
                if (
                  currentCall.callType === 'video' &&
                  videoTracks.length === 0
                ) {
                  console.log(
                    'Missing expected video track, will attempt to refresh UI'
                  );

                  // This will force the video element to check for new tracks
                  setCurrentCall(prev => {
                    if (!prev) return null;
                    return { ...prev, remoteStream: null };
                  });

                  setTimeout(() => {
                    setCurrentCall(prev => {
                      if (!prev) return null;
                      return { ...prev, remoteStream: remoteStreamRef.current };
                    });
                  }, 50);
                }
              }
            }
          }
        } else if (type === 'resend-candidates') {
          // Handle request to resend ICE candidates (new handler)
          console.log(
            `Received request to resend ICE candidates for call ${callId}`
          );

          if (
            currentCall &&
            currentCall.callId === callId &&
            peerConnection.current
          ) {
            // Force gathering new candidates
            try {
              console.log('Restarting ICE to generate new candidates');
              peerConnection.current.restartIce();

              // Notify the remote peer
              if (socket) {
                socket.emit('webrtc_signal', {
                  type: 'call-state-update',
                  callId,
                  from: user?._id,
                  to: from,
                  connectionState: 'reconnecting',
                  mediaState: 'resending-candidates',
                });
              }
            } catch (error) {
              console.error('Error restarting ICE:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error handling WebRTC signal:', error);

        // More detailed error logging
        if (error instanceof DOMException) {
          console.error(`DOMException: ${error.name} - ${error.message}`);
        } else if (error instanceof Error) {
          console.error(`Error: ${error.name} - ${error.message}`);
          console.error('Error stack:', error.stack);
        }
      }
    };

    // Register event handlers
    socket.on('webrtc_signal', handleWebRTCSignal);

    // Handle direct ICE candidate
    socket.on('direct_ice', data => {
      console.log('Received direct ICE');

      try {
        if (!data.candidate || !data.callId) return;

        // Process as normal ICE candidate
        handleWebRTCSignal({
          type: 'ice-candidate',
          from: data.from,
          callId: data.callId,
          signal: data.candidate,
        });
      } catch (error) {
        console.error('Error handling direct ICE:', error);
      }
    });

    // Handle ICE candidate
    socket.on('ice_candidate', data => {
      console.log('Received ICE candidate');

      try {
        // Process as normal ICE candidate
        handleWebRTCSignal({
          type: 'ice-candidate',
          from: data.from,
          to: data.to,
          callId: data.callId,
          signal: data.candidate,
        });
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });

    // Clean up event listeners on unmount
    return () => {
      socket.off('webrtc_signal', handleWebRTCSignal);
      socket.off('direct_ice');
      socket.off('ice_candidate');
    };
  }, [
    socket,
    user,
    incomingCall,
    currentCall,
    callStatus,
    cleanupWebRTC,
    answerCall,
    rejectCall,
    handleManualAnswerCall,
  ]);

  // Update call duration timer
  useEffect(() => {
    if (callStatus === 'connected' && !callTimerRef.current) {
      callDurationRef.current = 0;
      callTimerRef.current = setInterval(() => {
        callDurationRef.current += 1;
        setCallDuration(callDurationRef.current);
      }, 1000);
    } else if (callStatus !== 'connected' && callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [callStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupWebRTC();
    };
  }, [cleanupWebRTC]);

  // Create context value
  const contextValue: VideoCallContextType = {
    currentCall,
    incomingCall,
    callStatus,
    callStats,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
    isCallInProgress: isCallInProgressRef.current,
    isMuted,
    isVideoOff,
    remoteIsMuted,
    remoteIsVideoOff,
    connectionQuality,
    callDuration,

    // Additional properties for compatibility
    callId,
    callType,
    conversationId,

    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  };

  return (
    <VideoCallContext.Provider value={contextValue}>
      {children}
    </VideoCallContext.Provider>
  );
};

// Custom hook to use the video call context
export const useVideoCall = () => useContext(VideoCallContext);
