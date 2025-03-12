'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useSocket } from './SocketContext';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Define call status types
export enum CallStatus {
  IDLE = 'idle',
  CHECKING = 'checking',
  OFFERING = 'offering',
  RINGING = 'ringing',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  WAITING = 'waiting', // When other participant left temporarily
  ENDED = 'ended',
  ERROR = 'error',
}

// Define media statuses
export enum MediaStatus {
  LOADING = 'loading',
  ACTIVE = 'active',
  ERROR = 'error',
}

// Define call participant interface
export interface CallParticipant {
  userId: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  role?: string;
}

// Define call type
export interface Call {
  callId: string;
  appointmentId?: string;
  callType: 'video' | 'audio';
  status: CallStatus;
  initiator: CallParticipant;
  receiver: CallParticipant;
  startTime?: Date;
  endTime?: Date;
  duration: number;
  reconnectionAttempts: number;
  error?: string;
}

// Define call stats
export interface CallStats {
  bitrate?: number;
  packetLoss?: number;
  jitter?: number;
  latency?: number;
  resolution?: string;
  audioLevel?: number;
}

// Define WebRTC signal data type
interface WebRTCSignalData {
  type: string;
  from: string;
  to: string;
  callId: string;
  signal?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
  appointmentId?: string;
  conversationId?: string;
  response?: string;
  reason?: string;
}

// Define ICE candidate data type
interface ICECandidateData {
  candidate: RTCIceCandidateInit;
  from: string;
  to: string;
  callId: string;
}

// Define context type
interface VideoCallContextType {
  // Current call state
  currentCall: Call | null;
  callStatus: CallStatus;
  mediaStatus: MediaStatus;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  callStats: CallStats;
  isCallMinimized: boolean;

  // DOM references
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;

  // Call control methods
  startCall: (appointmentId: string, receiverId: string) => Promise<void>;
  joinCall: (appointmentId: string, callerId: string) => Promise<void>;
  endCall: (reason?: string) => Promise<void>;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleMinimized: () => void;
  rejectCall: (reason?: string) => Promise<void>;
  reconnectCall: () => Promise<void>;
  leaveCallTemporarily: () => Promise<void>;
  rejoinCall: (appointmentId: string) => Promise<void>;
}

// Create context
const VideoCallContext = createContext<VideoCallContextType | undefined>(
  undefined
);

// ICE server configuration
const getIceServers = () => {
  // STUN servers for NAT traversal
  const defaultStunServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ];

  // Default return with STUN servers only
  return {
    iceServers: [
      ...defaultStunServers,
      // Add TURN servers for your production environment
      // {
      //   urls: 'turn:your-turn-server.com:3478',
      //   username: 'username',
      //   credential: 'password'
      // }
    ],
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all' as RTCIceTransportPolicy,
    bundlePolicy: 'max-bundle' as RTCBundlePolicy,
    rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy,
  };
};

// Generate a unique call ID
const generateCallId = () => {
  return `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Provider component
export const VideoCallProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // External hooks
  const { socket, isConnected } = useSocket();
  const { user } = useUserStore();
  const router = useRouter();

  // Refs
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const eventListenersAddedRef = useRef<boolean>(false);
  const lastQualityAlertTime = useRef<number | null>(null);
  const hasReducedQuality = useRef<boolean>(false);
  const connectionHealthIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.IDLE);
  const [mediaStatus, setMediaStatus] = useState<MediaStatus>(
    MediaStatus.LOADING
  );
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isVideoOff, setIsVideoOff] = useState<boolean>(false);
  const [callStats, setCallStats] = useState<CallStats>({});
  const [isCallMinimized, setIsCallMinimized] = useState<boolean>(false);

  // Debug function with timestamp
  const logDebug = useCallback((message: string, ...args: any[]) => {
    console.log(
      `[VideoCall] [${new Date().toISOString()}] ${message}`,
      ...args
    );
  }, []);

  // Clean up resources
  const cleanupCall = useCallback(() => {
    logDebug('Cleaning up call resources');

    // Stop all tracks in the local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Clean up remote stream
    if (remoteStreamRef.current) {
      remoteStreamRef.current = null;
      setRemoteStream(null);
    }

    // Close data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Clear all timeouts
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }

    if (connectionHealthIntervalRef.current) {
      clearInterval(connectionHealthIntervalRef.current);
      connectionHealthIntervalRef.current = null;
    }

    // Reset pending ICE candidates
    pendingIceCandidatesRef.current = [];

    // Reset state
    setMediaStatus(MediaStatus.LOADING);

    logDebug('Call cleanup complete');
  }, [logDebug]);

  // Send buffered ICE candidates
  const sendBufferedIceCandidates = useCallback(() => {
    if (!socket || !isConnected || !currentCall || !user?._id) {
      return;
    }

    const receiverId =
      currentCall.initiator.userId === user._id
        ? currentCall.receiver.userId
        : currentCall.initiator.userId;

    if (pendingIceCandidatesRef.current.length > 0) {
      logDebug(
        `Sending ${pendingIceCandidatesRef.current.length} buffered ICE candidates`
      );

      // Send each candidate
      pendingIceCandidatesRef.current.forEach(candidate => {
        socket.emit('ice_candidate', {
          candidate,
          from: user._id,
          to: receiverId,
          callId: currentCall.callId,
        });
      });

      // Clear buffer
      pendingIceCandidatesRef.current = [];
    }
  }, [socket, isConnected, currentCall, user?._id, logDebug]);

  // Start collecting and reporting call statistics
  const startStatsReporting = useCallback(() => {
    if (!peerConnection.current || statsIntervalRef.current) {
      return;
    }

    logDebug('Starting stats reporting');

    statsIntervalRef.current = setInterval(async () => {
      if (!peerConnection.current) {
        return;
      }

      try {
        const stats = await peerConnection.current.getStats();
        let videoInputLevel = 0;
        let audioInputLevel = 0;
        let bitrate = 0;
        let packetLoss = 0;
        let jitter = 0;
        let roundTripTime = 0;
        let videoWidth = 0;
        let videoHeight = 0;
        let lastResult: any = {};

        stats.forEach(report => {
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            packetLoss = report.packetsLost || 0;
            jitter = report.jitter || 0;

            if (report.frameWidth && report.frameHeight) {
              videoWidth = report.frameWidth;
              videoHeight = report.frameHeight;
            }

            // Calculate bitrate
            if (report.bytesReceived && report.timestamp) {
              // Implementation of bitrate calculation would go here
            }
          }

          if (report.type === 'inbound-rtp' && report.kind === 'audio') {
            // Audio levels would be gathered here
          }

          if (report.type === 'remote-candidate') {
            roundTripTime = report.roundTripTime || 0;
          }
        });

        // Update stats state
        setCallStats({
          bitrate: Math.round(bitrate / 1000), // kbps
          packetLoss,
          jitter: Math.round(jitter * 1000), // ms
          latency: Math.round(roundTripTime * 1000), // ms
          resolution:
            videoWidth && videoHeight
              ? `${videoWidth}x${videoHeight}`
              : undefined,
          audioLevel: audioInputLevel,
        });

        // Report stats to socket for monitoring (if needed)
        if (socket && isConnected && currentCall && user?._id) {
          socket.emit('call_metrics', {
            callId: currentCall.callId,
            from: user._id,
            metrics: {
              bitrate: Math.round(bitrate / 1000),
              packetLoss,
              jitter: Math.round(jitter * 1000),
              latency: Math.round(roundTripTime * 1000),
              resolution:
                videoWidth && videoHeight
                  ? `${videoWidth}x${videoHeight}`
                  : 'unknown',
            },
          });
        }
      } catch (error) {
        logDebug('Error getting call stats:', error);
      }
    }, 5000); // Every 5 seconds
  }, [socket, isConnected, currentCall, user?._id, logDebug]);

  // End call
  const endCall = useCallback(
    async (reason?: string): Promise<void> => {
      if (!currentCall || !user?._id) {
        logDebug('Cannot end call - prerequisites not met');
        cleanupCall();
        setCurrentCall(null);
        setCallStatus(CallStatus.IDLE);
        return;
      }

      logDebug('Ending call', reason);

      // Send call-ended signal
      if (socket && isConnected) {
        socket.emit('webrtc_signal', {
          type: 'call-ended',
          from: user._id,
          to:
            currentCall.initiator.userId === user._id
              ? currentCall.receiver.userId
              : currentCall.initiator.userId,
          callId: currentCall.callId,
          reason: reason || 'ended',
          appointmentId: currentCall.appointmentId,
        });
      }

      // Clean up
      cleanupCall();

      // Reset call state with a slight delay to allow animations
      setTimeout(() => {
        setCurrentCall(null);
        setCallStatus(CallStatus.IDLE);
      }, 500);

      logDebug('Call ended');
    },
    [socket, isConnected, currentCall, user?._id, cleanupCall, logDebug]
  );

  // Initialize WebRTC
  const initializeWebRTC = useCallback(async (): Promise<boolean> => {
    try {
      // Clean up any existing connection
      cleanupCall();

      logDebug('Initializing WebRTC...');

      // Create peer connection with enhanced options for better connectivity
      peerConnection.current = new RTCPeerConnection(getIceServers());

      // Add connection state logging for better debugging
      peerConnection.current.addEventListener('connectionstatechange', () => {
        if (!peerConnection.current) return;
        logDebug(
          'Connection state changed:',
          peerConnection.current.connectionState
        );
      });

      peerConnection.current.addEventListener('signalingstatechange', () => {
        if (!peerConnection.current) return;
        logDebug(
          'Signaling state changed:',
          peerConnection.current.signalingState
        );
      });

      // Create data channel with retry mechanism
      try {
        dataChannelRef.current = peerConnection.current.createDataChannel(
          'metadata',
          {
            ordered: true,
            maxRetransmits: 3, // Retry up to 3 times
          }
        );

        dataChannelRef.current.onopen = () => {
          logDebug('Data channel opened');

          // Send initial status update once channel is open
          if (
            dataChannelRef.current &&
            dataChannelRef.current.readyState === 'open'
          ) {
            try {
              dataChannelRef.current.send(
                JSON.stringify({
                  type: 'status-update',
                  isMuted,
                  isVideoOff,
                })
              );
            } catch (err) {
              logDebug('Error sending initial status update:', err);
            }
          }
        };

        dataChannelRef.current.onclose = () => {
          logDebug('Data channel closed');
        };

        dataChannelRef.current.onerror = error => {
          logDebug('Data channel error:', error);
        };

        dataChannelRef.current.onmessage = event => {
          try {
            const data = JSON.parse(event.data);
            logDebug('Data channel message:', data);

            // Handle different message types
            if (data.type === 'mute-status') {
              // Handle remote mute status
            } else if (data.type === 'video-status') {
              // Handle remote video status
            } else if (data.type === 'ping') {
              // Respond to ping with pong
              if (
                dataChannelRef.current &&
                dataChannelRef.current.readyState === 'open'
              ) {
                dataChannelRef.current.send(
                  JSON.stringify({
                    type: 'pong',
                    timestamp: Date.now(),
                  })
                );
              }
            }
          } catch (error) {
            logDebug('Error parsing data channel message:', error);
          }
        };
      } catch (err) {
        logDebug(
          'Error creating data channel, will rely on ondatachannel event:',
          err
        );
      }

      // Handle incoming data channels
      peerConnection.current.ondatachannel = event => {
        const channel = event.channel;
        logDebug('Received data channel:', channel.label);

        if (channel.label === 'metadata') {
          dataChannelRef.current = channel;

          channel.onopen = () => {
            logDebug('Remote data channel opened');
          };

          channel.onclose = () => {
            logDebug('Remote data channel closed');
          };

          channel.onerror = error => {
            logDebug('Remote data channel error:', error);
          };

          channel.onmessage = event => {
            try {
              const data = JSON.parse(event.data);
              logDebug('Remote data channel message:', data);

              // Handle message types
              // Implementation similar to above
            } catch (error) {
              logDebug('Error parsing remote data channel message:', error);
            }
          };
        }
      };

      // Get local media stream with more specific constraints for better compatibility
      try {
        const constraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            aspectRatio: { ideal: 1.7777777778 },
            facingMode: 'user',
            // Lower framerate for better performance on slow connections
            frameRate: { max: 30, min: 15 },
          },
        };

        logDebug('Requesting media with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Add tracks to peer connection
        stream.getTracks().forEach(track => {
          if (peerConnection.current) {
            logDebug(`Adding ${track.kind} track to peer connection`);
            peerConnection.current.addTrack(track, stream);
          }
        });
      } catch (err) {
        // Fallback to audio-only if video fails
        if (
          err.name === 'NotFoundError' ||
          err.name === 'DevicesNotFoundError'
        ) {
          logDebug('Camera not found, trying audio only');
          toast.warning('Camera not found. Connecting with audio only.');

          const audioConstraints = {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          };

          const audioStream = await navigator.mediaDevices.getUserMedia(
            audioConstraints
          );
          localStreamRef.current = audioStream;
          setLocalStream(audioStream);
          setIsVideoOff(true);

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = audioStream;
          }

          // Add audio track to peer connection
          audioStream.getTracks().forEach(track => {
            if (peerConnection.current) {
              logDebug(`Adding ${track.kind} track to peer connection`);
              peerConnection.current.addTrack(track, audioStream);
            }
          });
        } else {
          throw err; // Re-throw other errors
        }
      }

      // Set up remote stream
      const remoteStream = new MediaStream();
      remoteStreamRef.current = remoteStream;
      setRemoteStream(remoteStream);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }

      // Handle ICE candidate events
      peerConnection.current.onicecandidate = event => {
        if (!event.candidate) {
          logDebug('ICE gathering complete');
          return;
        }

        logDebug(
          `Generated ICE candidate for ${event.candidate.sdpMid}:${event.candidate.sdpMLineIndex}`
        );

        if (socket && isConnected && currentCall && user?._id) {
          logDebug('Sending ICE candidate');

          // Send ICE candidate
          socket.emit('ice_candidate', {
            candidate: event.candidate,
            from: user._id,
            to:
              currentCall.initiator.userId === user._id
                ? currentCall.receiver.userId
                : currentCall.initiator.userId,
            callId: currentCall.callId,
          });
        } else {
          // Buffer candidates if not ready to send
          pendingIceCandidatesRef.current.push(event.candidate);
          logDebug(
            'Buffering ICE candidate, total:',
            pendingIceCandidatesRef.current.length
          );
        }
      };

      // Handle ICE connection state change
      peerConnection.current.oniceconnectionstatechange = () => {
        if (!peerConnection.current) return;

        logDebug(
          'ICE connection state:',
          peerConnection.current.iceConnectionState
        );

        switch (peerConnection.current.iceConnectionState) {
          case 'failed':
            logDebug('ICE connection failed, attempting to restart');
            // Attempt to restart ICE
            if (peerConnection.current && currentCall) {
              peerConnection.current.restartIce();

              // Set timeout for reconnection
              if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
              }

              reconnectTimeoutRef.current = setTimeout(() => {
                if (callStatus !== CallStatus.CONNECTED) {
                  setCallStatus(CallStatus.ERROR);
                  toast.error('Call connection failed');
                  endCall('connection_failed').catch(err =>
                    logDebug('Error ending call:', err)
                  );
                }
              }, 10000); // 10 seconds timeout
            }
            break;

          case 'disconnected':
            logDebug('ICE connection disconnected, waiting for reconnection');
            setCallStatus(CallStatus.RECONNECTING);
            toast.warning('Call connection lost, attempting to reconnect...');

            // Set timeout for reconnection
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }

            reconnectTimeoutRef.current = setTimeout(() => {
              if (callStatus === CallStatus.RECONNECTING) {
                setCallStatus(CallStatus.ERROR);
                toast.error('Failed to reconnect call');
                endCall('reconnection_failed').catch(err =>
                  logDebug('Error ending call:', err)
                );
              }
            }, 15000); // 15 seconds timeout for reconnection
            break;

          case 'connected':
            logDebug('ICE connection connected');
            setCallStatus(CallStatus.CONNECTED);

            // Clear any reconnection timeout
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }

            // Start stats reporting
            startStatsReporting();
            break;

          case 'completed':
            logDebug('ICE connection completed');
            setCallStatus(CallStatus.CONNECTED);
            break;
        }
      };

      // Handle connection state change
      peerConnection.current.onconnectionstatechange = () => {
        if (!peerConnection.current) return;

        logDebug('Connection state:', peerConnection.current.connectionState);

        switch (peerConnection.current.connectionState) {
          case 'failed':
            logDebug('Connection failed');
            setCallStatus(CallStatus.ERROR);
            toast.error('Call connection failed');
            endCall('connection_failed').catch(err =>
              logDebug('Error ending call:', err)
            );
            break;

          case 'disconnected':
            logDebug('Connection disconnected');
            setCallStatus(CallStatus.RECONNECTING);
            break;

          case 'connected':
            logDebug('Connection established');
            setCallStatus(CallStatus.CONNECTED);

            // If we have a current call, update the start time
            if (currentCall) {
              setCurrentCall(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  startTime: new Date(),
                  status: CallStatus.CONNECTED,
                };
              });
            }
            break;
        }
      };

      // Handle track events
      peerConnection.current.ontrack = event => {
        logDebug('Received remote track', event.track.kind);

        // Add the track to the remote stream
        if (remoteStreamRef.current && event.track) {
          remoteStreamRef.current.addTrack(event.track);

          // Update state
          setRemoteStream(prevStream => {
            // Create a new MediaStream to trigger re-render
            const newStream = new MediaStream();

            // Add all tracks from previous stream
            if (prevStream) {
              prevStream.getTracks().forEach(track => {
                newStream.addTrack(track);
              });
            }

            // Add the new track if it's not already in the stream
            const trackExists = prevStream
              ?.getTracks()
              .some(t => t.id === event.track.id);

            if (!trackExists) {
              newStream.addTrack(event.track);
            }

            return newStream;
          });

          // Update media status
          setMediaStatus(MediaStatus.ACTIVE);
        }
      };

      // Set up media status
      setMediaStatus(MediaStatus.ACTIVE);

      return true;
    } catch (error) {
      logDebug('Error initializing WebRTC:', error);
      setMediaStatus(MediaStatus.ERROR);

      toast.error(
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Camera and microphone access denied. Please allow access to use video calling.'
          : 'Failed to initialize video call. Please check your camera and microphone.'
      );

      return false;
    }
  }, [
    cleanupCall,
    socket,
    isConnected,
    currentCall,
    user?._id,
    callStatus,
    isMuted,
    isVideoOff,
    endCall,
    startStatsReporting,
    logDebug,
  ]);

  // Helper to wait for ICE gathering - waits up to 3 seconds
  const waitForIceGathering = (pc: RTCPeerConnection): Promise<void> => {
    return new Promise(resolve => {
      if (!pc) {
        resolve();
        return;
      }

      if (pc.iceGatheringState === 'complete') {
        resolve();
        return;
      }

      // Wait for gathering to complete with timeout
      const checkState = () => {
        if (pc.iceGatheringState === 'complete') {
          pc.removeEventListener('icegatheringstatechange', checkState);
          resolve();
        }
      };

      pc.addEventListener('icegatheringstatechange', checkState);

      // Set a timeout in case gathering takes too long
      setTimeout(() => {
        pc.removeEventListener('icegatheringstatechange', checkState);
        logDebug('ICE gathering timed out, but proceeding anyway');
        resolve();
      }, 3000); // 3 second timeout
    });
  };

  // Leave call temporarily
  const leaveCallTemporarily = useCallback(async (): Promise<void> => {
    if (!socket || !isConnected || !currentCall || !user?._id) {
      logDebug('Cannot leave call temporarily - prerequisites not met');
      return;
    }

    logDebug('Leaving call temporarily');

    // Send participant-left signal instead of call-ended
    socket.emit('webrtc_signal', {
      type: 'participant-left',
      from: user._id,
      to:
        currentCall.initiator.userId === user._id
          ? currentCall.receiver.userId
          : currentCall.initiator.userId,
      callId: currentCall.callId,
      reason: 'left_temporarily',
      appointmentId: currentCall.appointmentId,
    });

    // Clean up local resources but don't reset call state completely
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      localStreamRef.current = null;
      setLocalStream(null);
    }

    // Close data channel
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    // Close peer connection but keep call state
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Clear timeouts and intervals
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }

    // Reset pending ICE candidates
    pendingIceCandidatesRef.current = [];

    // Update call status but don't nullify the call object
    setCallStatus(CallStatus.IDLE);
    setMediaStatus(MediaStatus.LOADING);

    logDebug('Call left temporarily, can rejoin later');
  }, [socket, isConnected, currentCall, user?._id, logDebug]);

  // Create and send offer
  const createAndSendOffer = useCallback(async () => {
    if (
      !peerConnection.current ||
      !socket ||
      !isConnected ||
      !currentCall ||
      !user?._id
    ) {
      logDebug('Cannot create offer - prerequisites not met');
      return;
    }

    try {
      logDebug('Creating offer');

      // Create offer
      const offer = await peerConnection.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      // Set local description
      await peerConnection.current.setLocalDescription(offer);

      // Send offer
      socket.emit('webrtc_signal', {
        type: 'offer',
        from: user._id,
        to:
          currentCall.initiator.userId === user._id
            ? currentCall.receiver.userId
            : currentCall.initiator.userId,
        callId: currentCall.callId,
        signal: offer,
        appointmentId: currentCall.appointmentId,
      });

      logDebug('Offer sent');
      setCallStatus(CallStatus.RINGING);

      // Send any buffered ICE candidates
      setTimeout(() => {
        sendBufferedIceCandidates();
      }, 1000);
    } catch (error) {
      logDebug('Error creating offer:', error);
      toast.error('Failed to connect call');
      endCall('offer_failed').catch(err => logDebug('Error ending call:', err));
    }
  }, [
    peerConnection,
    socket,
    isConnected,
    currentCall,
    user?._id,
    sendBufferedIceCandidates,
    endCall,
    logDebug,
  ]);

  // Handle pre-offer-answer
  const handlePreOfferAnswer = useCallback(
    (data: WebRTCSignalData) => {
      if (!currentCall || !user?._id) {
        logDebug('Cannot handle pre-offer answer - no active call');
        return;
      }

      logDebug('Handling pre-offer answer:', data.response);

      if (data.response === 'accepted') {
        // Recipient is ready to receive call, send the offer
        createAndSendOffer();
      } else if (data.response === 'busy') {
        logDebug('Recipient is busy');
        toast.error('Recipient is busy in another call');
        endCall('recipient_busy').catch(err =>
          logDebug('Error ending call:', err)
        );
      } else if (data.response === 'rejected') {
        logDebug('Call rejected by recipient');
        toast.error('Call was declined');
        endCall('call_rejected').catch(err =>
          logDebug('Error ending call:', err)
        );
      }
    },
    [currentCall, user?._id, createAndSendOffer, endCall, logDebug]
  );

  // Process incoming offer
  const handleIncomingOffer = useCallback(
    async (data: WebRTCSignalData) => {
      if (!peerConnection.current || !socket || !isConnected || !user?._id) {
        logDebug('Cannot handle offer - prerequisites not met');
        return;
      }

      try {
        logDebug('Handling incoming offer', data);

        // Update call ID and status
        setCurrentCall(prev => {
          if (!prev) return null;
          return {
            ...prev,
            callId: data.callId || prev.callId,
            status: CallStatus.CONNECTING,
          };
        });

        // Set remote description
        if (data.signal) {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(data.signal)
          );
        } else {
          throw new Error('No signal in offer');
        }

        // Create answer
        const answer = await peerConnection.current.createAnswer();

        // Set local description
        await peerConnection.current.setLocalDescription(answer);

        // Send answer
        socket.emit('webrtc_signal', {
          type: 'answer',
          from: user._id,
          to: data.from,
          callId: data.callId,
          signal: answer,
          appointmentId: data.appointmentId,
        });

        logDebug('Answer sent');
        setCallStatus(CallStatus.CONNECTING);

        // Clear call timeout
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }

        // Send any buffered ICE candidates after a short delay
        setTimeout(() => {
          sendBufferedIceCandidates();
        }, 1000);
      } catch (error) {
        logDebug('Error handling offer:', error);
        toast.error('Failed to connect call');
        endCall('answer_failed').catch(err =>
          logDebug('Error ending call:', err)
        );
      }
    },
    [
      peerConnection,
      socket,
      isConnected,
      user?._id,
      sendBufferedIceCandidates,
      endCall,
      logDebug,
    ]
  );

  // Process incoming answer
  const handleIncomingAnswer = useCallback(
    async (data: WebRTCSignalData) => {
      if (!peerConnection.current || !currentCall) {
        logDebug('Cannot handle answer - prerequisites not met');
        return;
      }

      try {
        logDebug('Handling incoming answer');

        // Set remote description
        if (data.signal) {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(data.signal)
          );
        } else {
          throw new Error('No signal in answer');
        }

        // Update call status
        setCallStatus(CallStatus.CONNECTING);

        // Clear call timeout
        if (callTimeoutRef.current) {
          clearTimeout(callTimeoutRef.current);
          callTimeoutRef.current = null;
        }

        logDebug('Answer processed successfully');
      } catch (error) {
        logDebug('Error handling answer:', error);
        toast.error('Failed to establish call connection');
        endCall('process_answer_failed').catch(err =>
          logDebug('Error ending call:', err)
        );
      }
    },
    [peerConnection, currentCall, endCall, logDebug]
  );

  // Process incoming ICE candidate
  const handleIncomingIceCandidate = useCallback(
    (data: ICECandidateData) => {
      if (!peerConnection.current) {
        logDebug(
          'Cannot handle ICE candidate - peer connection not established'
        );
        return;
      }

      try {
        logDebug('Handling incoming ICE candidate');

        // Add ICE candidate
        if (data.candidate) {
          peerConnection.current
            .addIceCandidate(new RTCIceCandidate(data.candidate))
            .catch(err => {
              logDebug('Error adding ICE candidate:', err);
            });
        }
      } catch (error) {
        logDebug('Error processing ICE candidate:', error);
      }
    },
    [peerConnection, logDebug]
  );

  // Handle call reconnection
  const reconnectCall = useCallback(async (): Promise<void> => {
    if (!peerConnection.current || !currentCall || !user?._id) {
      logDebug('Cannot reconnect call - prerequisites not met');
      return;
    }

    // Increment reconnection attempts
    setCurrentCall(prev => {
      if (!prev) return null;
      return {
        ...prev,
        reconnectionAttempts: prev.reconnectionAttempts + 1,
        status: CallStatus.RECONNECTING,
      };
    });

    // If too many reconnection attempts, end the call
    if (currentCall.reconnectionAttempts >= 3) {
      logDebug('Too many reconnection attempts, ending call');
      toast.error('Could not reconnect after multiple attempts');
      endCall('reconnection_failed').catch(err =>
        logDebug('Error ending call:', err)
      );
      return;
    }

    logDebug('Attempting to reconnect call');
    setCallStatus(CallStatus.RECONNECTING);

    // Try to restart ICE
    try {
      if (peerConnection.current.connectionState !== 'failed') {
        // Try to restart ICE
        peerConnection.current.restartIce();

        // Notify the other party
        if (socket && isConnected) {
          socket.emit('webrtc_signal', {
            type: 'call-reconnect',
            from: user._id,
            to:
              currentCall.initiator.userId === user._id
                ? currentCall.receiver.userId
                : currentCall.initiator.userId,
            callId: currentCall.callId,
          });
        }

        toast.info('Attempting to reconnect call...');
      } else {
        // Connection has failed completely, need to recreate the peer connection
        logDebug('Connection failed, recreating peer connection');

        // Clean up existing connection
        cleanupCall();

        // Wait a moment before trying to recreate
        setTimeout(async () => {
          // Initialize WebRTC again
          const initialized = await initializeWebRTC();

          if (!initialized) {
            toast.error('Failed to reconnect call');
            endCall('reconnection_failed').catch(err =>
              logDebug('Error ending call:', err)
            );
            return;
          }

          // Create and send a new offer
          createAndSendOffer();
        }, 1000);
      }
    } catch (error) {
      logDebug('Error reconnecting call:', error);
      toast.error('Failed to reconnect call');
      endCall('reconnection_error').catch(err =>
        logDebug('Error ending call:', err)
      );
    }
  }, [
    peerConnection,
    currentCall,
    user?._id,
    socket,
    isConnected,
    cleanupCall,
    initializeWebRTC,
    createAndSendOffer,
    endCall,
    logDebug,
  ]);

  // Reject call
  const rejectCall = useCallback(
    async (reason?: string): Promise<void> => {
      if (!socket || !isConnected || !currentCall || !user?._id) {
        logDebug('Cannot reject call - prerequisites not met');
        return;
      }

      logDebug('Rejecting call', reason);

      // Send rejection
      socket.emit('webrtc_signal', {
        type: 'call-rejected',
        from: user._id,
        to:
          currentCall.initiator.userId === user._id
            ? currentCall.receiver.userId
            : currentCall.initiator.userId,
        callId: currentCall.callId,
        reason: reason || 'rejected',
      });

      // Clean up
      cleanupCall();

      // Reset call state
      setCurrentCall(null);
      setCallStatus(CallStatus.IDLE);

      logDebug('Call rejected');
    },
    [socket, isConnected, currentCall, user?._id, cleanupCall, logDebug]
  );

  // Start a call (caller)
  const startCall = useCallback(
    async (appointmentId: string, receiverId: string): Promise<void> => {
      try {
        logDebug(
          `Starting call for appointment ${appointmentId} to receiver ${receiverId}`
        );

        // Check if socket is connected
        if (!socket || !isConnected || !user?._id) {
          logDebug('Socket not connected or user not authenticated');
          toast.error('Cannot start call - connection issue');
          return;
        }

        // Check if already in a call
        if (
          currentCall &&
          callStatus !== CallStatus.IDLE &&
          callStatus !== CallStatus.ENDED
        ) {
          logDebug('Already in a call, cannot start another');
          toast.error('You are already in a call');
          return;
        }

        // Set call status to checking
        setCallStatus(CallStatus.CHECKING);

        // Generate call ID
        const callId = generateCallId();

        // Set call state
        setCurrentCall({
          callId,
          appointmentId,
          callType: 'video',
          status: CallStatus.OFFERING,
          initiator: {
            userId: user._id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            role: user.role || '',
          },
          receiver: {
            userId: receiverId,
            // We don't have receiver details yet, will be populated later
          },
          duration: 0,
          reconnectionAttempts: 0,
        });

        // Update call status
        setCallStatus(CallStatus.OFFERING);

        // Initialize WebRTC
        const initialized = await initializeWebRTC();

        if (!initialized) {
          setCallStatus(CallStatus.ERROR);
          setCurrentCall(null);
          return;
        }

        // Check if the recipient is online
        socket.emit('check_user_online', receiverId, (isOnline: boolean) => {
          if (!isOnline) {
            logDebug('Recipient is offline');
            toast.error('Recipient is offline. Please try again later.');
            setCallStatus(CallStatus.ENDED);
            cleanupCall();
            setCurrentCall(null);
            return;
          }

          // Proceed with pre-offer check
          socket.emit('webrtc_signal', {
            type: 'pre-offer',
            from: user._id,
            to: receiverId,
            callId,
            callType: 'video',
            appointmentId,
          });
        });

        // Set timeout for call offer
        callTimeoutRef.current = setTimeout(() => {
          if (
            callStatus === CallStatus.OFFERING ||
            callStatus === CallStatus.CHECKING
          ) {
            logDebug('Call offer timed out');
            toast.error('Call timed out. Please try again.');
            endCall('timeout').catch(err =>
              logDebug('Error ending call:', err)
            );
          }
        }, 30000); // 30 seconds timeout
      } catch (error) {
        logDebug('Error starting call:', error);
        toast.error('Failed to start call');
        setCallStatus(CallStatus.ERROR);
        cleanupCall();
        setCurrentCall(null);
      }
    },
    [
      socket,
      isConnected,
      user,
      currentCall,
      callStatus,
      initializeWebRTC,
      cleanupCall,
      endCall,
      logDebug,
    ]
  );

  // Rejoin a call after leaving temporarily
  const rejoinCall = useCallback(
    async (appointmentId: string): Promise<void> => {
      try {
        logDebug(`Rejoining call for appointment ${appointmentId}`);

        // Check if we still have call state
        if (!currentCall) {
          logDebug('No active call to rejoin, starting fresh');
          // Fall back to regular join logic
          return;
        }

        // If we have current call state, use it to rejoin
        setCallStatus(CallStatus.CONNECTING);

        // Initialize WebRTC
        const initialized = await initializeWebRTC();

        if (!initialized) {
          toast.error('Failed to initialize video call');
          return;
        }

        // Get the other participant
        const otherParticipantId =
          currentCall.initiator.userId === user?._id
            ? currentCall.receiver.userId
            : currentCall.initiator.userId;

        // Send rejoin signal
        socket?.emit('webrtc_signal', {
          type: 'rejoin-call',
          from: user?._id,
          to: otherParticipantId,
          callId: currentCall.callId,
          appointmentId: appointmentId,
        });

        // Create and send offer
        await createAndSendOffer();

        logDebug('Rejoining call - sent new offer');
      } catch (error) {
        logDebug('Error rejoining call:', error);
        toast.error('Failed to rejoin call');
      }
    },
    [
      currentCall,
      user?._id,
      socket,
      initializeWebRTC,
      createAndSendOffer,
      logDebug,
    ]
  );

  // Join an incoming call (receiver)
  const joinCall = useCallback(
    async (appointmentId: string, callerId: string): Promise<void> => {
      try {
        logDebug(
          `Joining call for appointment ${appointmentId} from caller ${callerId}`
        );

        // Check if socket is connected
        if (!socket || !isConnected || !user?._id) {
          logDebug('Socket not connected or user not authenticated');
          toast.error('Cannot join call - connection issue');
          return;
        }

        // Check if already in a call
        if (
          currentCall &&
          callStatus !== CallStatus.IDLE &&
          callStatus !== CallStatus.ENDED
        ) {
          logDebug('Already in a call, cannot join another');
          toast.error('You are already in a call');
          return;
        }

        // Set call status to checking
        setCallStatus(CallStatus.CHECKING);

        // Generate call ID (will be replaced by the actual one from the incoming offer)
        const tempCallId = generateCallId();

        // Set initial call state
        setCurrentCall({
          callId: tempCallId,
          appointmentId,
          callType: 'video',
          status: CallStatus.CONNECTING,
          initiator: {
            userId: callerId,
            // We don't have initiator details yet, will be populated later
          },
          receiver: {
            userId: user._id,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            role: user.role || '',
          },
          duration: 0,
          reconnectionAttempts: 0,
        });

        // Update call status
        setCallStatus(CallStatus.CONNECTING);

        // Initialize WebRTC
        const initialized = await initializeWebRTC();

        if (!initialized) {
          setCallStatus(CallStatus.ERROR);
          setCurrentCall(null);
          return;
        }

        // Notify that we're ready to receive call
        socket.emit('webrtc_signal', {
          type: 'pre-offer-answer',
          from: user._id,
          to: callerId,
          callId: tempCallId,
          response: 'accepted',
          appointmentId,
        });

        logDebug('Ready to receive call');

        // Set timeout for waiting for call offer
        callTimeoutRef.current = setTimeout(() => {
          if (
            callStatus === CallStatus.CONNECTING ||
            callStatus === CallStatus.CHECKING
          ) {
            logDebug('Waiting for call offer timed out');
            toast.error('Call connection timed out. Please try again.');
            endCall('timeout').catch(err =>
              logDebug('Error ending call:', err)
            );
          }
        }, 30000); // 30 seconds timeout
      } catch (error) {
        logDebug('Error joining call:', error);
        toast.error('Failed to join call');
        setCallStatus(CallStatus.ERROR);
        cleanupCall();
        setCurrentCall(null);
      }
    },
    [
      socket,
      isConnected,
      user,
      currentCall,
      callStatus,
      initializeWebRTC,
      cleanupCall,
      endCall,
      logDebug,
    ]
  );

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;

    const audioTracks = localStreamRef.current.getAudioTracks();

    if (audioTracks.length > 0) {
      const newMuteState = !isMuted;

      audioTracks.forEach(track => {
        track.enabled = !newMuteState;
      });

      setIsMuted(newMuteState);

      // Send mute status via data channel
      if (
        dataChannelRef.current &&
        dataChannelRef.current.readyState === 'open'
      ) {
        dataChannelRef.current.send(
          JSON.stringify({
            type: 'mute-status',
            isMuted: newMuteState,
          })
        );
      }

      logDebug(`Microphone ${newMuteState ? 'muted' : 'unmuted'}`);
    }
  }, [isMuted, logDebug]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;

    const videoTracks = localStreamRef.current.getVideoTracks();

    if (videoTracks.length > 0) {
      const newVideoState = !isVideoOff;

      videoTracks.forEach(track => {
        track.enabled = !newVideoState;
      });

      setIsVideoOff(newVideoState);

      // Send video status via data channel
      if (
        dataChannelRef.current &&
        dataChannelRef.current.readyState === 'open'
      ) {
        dataChannelRef.current.send(
          JSON.stringify({
            type: 'video-status',
            isVideoOff: newVideoState,
          })
        );
      }

      logDebug(`Camera ${newVideoState ? 'turned off' : 'turned on'}`);
    }
  }, [isVideoOff, logDebug]);

  // Toggle minimized state
  const toggleMinimized = useCallback(() => {
    setIsCallMinimized(prev => !prev);
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    if (
      !socket ||
      !isConnected ||
      !user?._id ||
      eventListenersAddedRef.current
    ) {
      return;
    }

    logDebug('Setting up socket event listeners');

    // Handle WebRTC signaling
    const handleWebRTCSignal = (data: WebRTCSignalData) => {
      if (data.to !== user._id) {
        return; // Not for us
      }

      logDebug(`Received ${data.type} signal`);

      switch (data.type) {
        case 'pre-offer':
          // This is handled in startCall function
          break;

        case 'pre-offer-answer':
          handlePreOfferAnswer(data);
          break;

        case 'offer':
          handleIncomingOffer(data);
          break;

        case 'answer':
          handleIncomingAnswer(data);
          break;

        case 'call-ended':
          if (currentCall && data.callId === currentCall.callId) {
            logDebug('Call ended by other participant');
            toast.info('Call ended by other participant');
            endCall('remote_ended').catch(err =>
              logDebug('Error ending call:', err)
            );
          }
          break;

        case 'call-rejected':
          if (currentCall && data.callId === currentCall.callId) {
            logDebug('Call rejected by recipient');
            toast.error('Call was declined');
            endCall('rejected').catch(err =>
              logDebug('Error ending call:', err)
            );
          }
          break;

        case 'user-unavailable':
          logDebug('User is unavailable');
          toast.error('User is unavailable. Please try again later.');
          endCall('user_unavailable').catch(err =>
            logDebug('Error ending call:', err)
          );
          break;

        case 'call-reconnect':
          logDebug('Received reconnect request from peer');
          if (peerConnection.current) {
            peerConnection.current.restartIce();
          }
          break;

        case 'participant-left':
          if (currentCall && data.callId === currentCall.callId) {
            logDebug('Other participant left temporarily');
            toast.info(
              'Other participant left the call. They may rejoin shortly.'
            );

            // Update call status but don't end the call completely
            setCallStatus(CallStatus.WAITING);
          }
          break;

        case 'rejoin-call':
          logDebug('Participant is rejoining the call');
          toast.info('The other participant is rejoining the call');
          // Update call status
          if (callStatus === CallStatus.WAITING) {
            setCallStatus(CallStatus.CONNECTING);
          }
          break;
      }
    };

    // Handle ICE candidates
    const handleIceCandidate = (data: ICECandidateData) => {
      if (
        data.to !== user._id ||
        !currentCall ||
        data.callId !== currentCall.callId
      ) {
        return; // Not for this call
      }

      handleIncomingIceCandidate(data);
    };

    // Add event listeners
    socket.on('webrtc_signal', handleWebRTCSignal);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('direct_ice', handleIceCandidate);

    eventListenersAddedRef.current = true;

    // Clean up event listeners on unmount
    return () => {
      socket.off('webrtc_signal', handleWebRTCSignal);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('direct_ice', handleIceCandidate);

      eventListenersAddedRef.current = false;
    };
  }, [
    socket,
    isConnected,
    user?._id,
    currentCall,
    callStatus,
    peerConnection,
    handlePreOfferAnswer,
    handleIncomingOffer,
    handleIncomingAnswer,
    handleIncomingIceCandidate,
    endCall,
    logDebug,
  ]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clean up all resources
      cleanupCall();
    };
  }, [cleanupCall]);

  // Sync local references with state
  useEffect(() => {
    localStreamRef.current = localStream;
    remoteStreamRef.current = remoteStream;
  }, [localStream, remoteStream]);

  // Create context value
  const contextValue: VideoCallContextType = {
    currentCall,
    callStatus,
    mediaStatus,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    callStats,
    isCallMinimized,

    localVideoRef,
    remoteVideoRef,

    startCall,
    joinCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleMinimized,
    rejectCall,
    reconnectCall,
    leaveCallTemporarily,
    rejoinCall,
  };

  return (
    <VideoCallContext.Provider value={contextValue}>
      {children}
    </VideoCallContext.Provider>
  );
};

// Custom hook to use the context
export const useVideoCall = () => {
  const context = useContext(VideoCallContext);

  if (context === undefined) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }

  return context;
};
