'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Minimize2,
  Maximize2,
  ChevronUp,
  Clock,
  RefreshCw,
  AlertCircle,
  Phone,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  useVideoCall,
  CallStatus,
  MediaStatus,
} from '@/contexts/VideoCallContext';
import { toast } from 'sonner';

interface VideoCallModalProps {
  open: boolean;
  onClose: () => void;
  conversationId?: string; // Add conversationId prop
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({
  open,
  onClose,
  conversationId,
}) => {
  const {
    currentCall,
    callStatus,
    mediaStatus,
    localVideoRef,
    remoteVideoRef,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo,
    endCall,
    reconnectCall,
    toggleMinimized,
    isCallMinimized,
    callStats,
  } = useVideoCall();

  const [controlsVisible, setControlsVisible] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const endCallRequestedRef = useRef(false);
  const [toastShown, setToastShown] = useState(false);
  const ENDED_CALLS_KEY = 'mentality_ended_calls';
  const [isPageRefresh, setIsPageRefresh] = useState(true);
  const sessionInitializedRef = useRef(false);
  const [isPageLoad, setIsPageLoad] = useState(true);
  const LAST_PAGE_VISIT_KEY = 'mentality_last_page_visit';

  useEffect(() => {
    // Set a flag to indicate this is the initial page load/navigation
    setIsPageLoad(true);

    // Check if we recently visited this page (within the last 5 seconds)
    const lastVisit = localStorage.getItem(LAST_PAGE_VISIT_KEY);
    const isRecentNavigation =
      lastVisit && Date.now() - parseInt(lastVisit) < 5000;

    // Store current visit time
    localStorage.setItem(LAST_PAGE_VISIT_KEY, Date.now().toString());

    // After a short delay, set isPageLoad to false to allow normal toast behavior
    const timer = setTimeout(() => {
      setIsPageLoad(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // When call connects, reset toast state
    if (callStatus === CallStatus.CONNECTED) {
      setToastShown(false);
      endCallRequestedRef.current = false;
    }

    // Only show toast for newly ended calls and not for page loads or refreshes
    if (
      (callStatus === CallStatus.ENDED || callStatus === CallStatus.IDLE) &&
      !toastShown &&
      !endCallRequestedRef.current &&
      currentCall?.callId &&
      !isPageLoad // Skip toasts during initial page load/navigation
    ) {
      // Store this call as ended in localStorage
      try {
        const endedCallsStr = localStorage.getItem(ENDED_CALLS_KEY) || '[]';
        const endedCalls = JSON.parse(endedCallsStr);
        if (!endedCalls.includes(currentCall.callId)) {
          endedCalls.push(currentCall.callId);
          localStorage.setItem(ENDED_CALLS_KEY, JSON.stringify(endedCalls));

          // Show toast only for newly ended calls
          setToastShown(true);
          toast.info('Call ended by other participant');
        }
      } catch (err) {
        console.error('Error storing ended call:', err);

        // Don't show toast on error during page load
        if (!isPageLoad) {
          setToastShown(true);
          toast.info('Call ended by other participant');
        }
      }
    }
  }, [callStatus, currentCall?.callId, toastShown, isPageLoad]);

  useEffect(() => {
    if (!currentCall?.callId) return;

    // Check if this call was already ended
    try {
      const endedCallsStr = localStorage.getItem(ENDED_CALLS_KEY);
      if (endedCallsStr) {
        const endedCalls = JSON.parse(endedCallsStr);
        if (endedCalls.includes(currentCall.callId)) {
          setToastShown(true); // Prevent toast for already ended calls
        }
      }
    } catch (err) {
      console.error('Error checking ended calls:', err);
    }
  }, [currentCall?.callId]);

  useEffect(() => {
    // When call connects, reset toast state
    if (callStatus === CallStatus.CONNECTED) {
      setToastShown(false);
      endCallRequestedRef.current = false;
    }

    // Only show toast for newly ended calls and NOT for page refreshes
    if (
      (callStatus === CallStatus.ENDED || callStatus === CallStatus.IDLE) &&
      !toastShown &&
      !endCallRequestedRef.current &&
      currentCall?.callId &&
      !isPageRefresh // Important: Skip toast if this is a page refresh
    ) {
      // Store this call as ended in localStorage
      try {
        const endedCallsStr = localStorage.getItem(ENDED_CALLS_KEY) || '[]';
        const endedCalls = JSON.parse(endedCallsStr);
        if (!endedCalls.includes(currentCall.callId)) {
          endedCalls.push(currentCall.callId);
          localStorage.setItem(ENDED_CALLS_KEY, JSON.stringify(endedCalls));

          // Show toast only for newly ended calls
          setToastShown(true);
          toast.info('Call ended by other participant');
        }
      } catch (err) {
        console.error('Error storing ended call:', err);
        // Show toast anyway if localStorage fails
        setToastShown(true);
        toast.info('Call ended by other participant');
      }
    }
  }, [callStatus, currentCall?.callId, toastShown, isPageRefresh]);

  // Ensure video elements get the streams properly
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }

    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  // Prevent duplicate "call ended" messages
  useEffect(() => {
    // Reset toast state when call status changes to CONNECTED
    if (callStatus === CallStatus.CONNECTED) {
      setToastShown(false);
      endCallRequestedRef.current = false;
    }

    // Show call ended toast only once when transitioning to ENDED/IDLE
    if (
      (callStatus === CallStatus.ENDED || callStatus === CallStatus.IDLE) &&
      !toastShown &&
      !endCallRequestedRef.current
    ) {
      setToastShown(true);
      toast.info('Call ended by other participant');
    }
  }, [callStatus, toastShown]);

  // Call duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let startTime = Date.now(); // Record start time when connecting

    const updateDuration = () => {
      // Only increment when actually connected
      if (callStatus === CallStatus.CONNECTED) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setCallDuration(elapsed);
      }
    };

    if (callStatus === CallStatus.CONNECTED) {
      // When first connected, update the start time
      if (callDuration === 0) {
        startTime = Date.now();
      }

      // Start the timer to update every second
      timer = setInterval(updateDuration, 1000);
    } else if (callStatus === CallStatus.RECONNECTING) {
      // Keep the timer running during reconnection, but don't update duration
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        // Just keep the timer alive but don't update
      }, 1000);
    } else {
      // Reset duration for other states
      setCallDuration(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus, callDuration]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  // Get participant details
  const getParticipantName = useCallback(() => {
    if (!currentCall) return 'Connecting...';

    const participant =
      callStatus === CallStatus.RINGING ||
      (currentCall.initiator.userId !== currentCall.receiver.userId &&
        currentCall.initiator.firstName)
        ? currentCall.receiver
        : currentCall.initiator;

    return (
      `${participant.firstName || ''} ${participant.lastName || ''}`.trim() ||
      'Participant'
    );
  }, [currentCall, callStatus]);

  // Get participant profile image
  const getParticipantImage = useCallback(() => {
    if (!currentCall) return '';

    const participant =
      callStatus === CallStatus.RINGING ||
      (currentCall.initiator.userId !== currentCall.receiver.userId &&
        currentCall.initiator.firstName)
        ? currentCall.receiver
        : currentCall.initiator;

    return participant.profileImage || '';
  }, [currentCall, callStatus]);

  // Get initials for avatar fallback
  const getInitials = useCallback(() => {
    const name = getParticipantName();
    return (
      name
        .split(' ')
        .map(part => part[0] || '')
        .join('')
        .toUpperCase()
        .substring(0, 2) || 'US'
    );
  }, [getParticipantName]);

  const handleEndCall = useCallback(() => {
    // Set flag to prevent "other participant ended call" toast
    endCallRequestedRef.current = true;

    endCall('user_ended')
      .then(() => {
        setTimeout(onClose, 500);
      })
      .catch(err => {
        console.error('Error ending call:', err);
        onClose();
      });
  }, [endCall, onClose, conversationId]);

  useEffect(() => {
    // Check if this is a fresh page load or refresh
    if (!sessionInitializedRef.current) {
      sessionInitializedRef.current = true;
      // Set a session flag to indicate we're handling a page load
      sessionStorage.setItem('call_session_initialized', Date.now().toString());
      setIsPageRefresh(true);

      // Clear the flag after a short delay to allow the component to initialize
      setTimeout(() => {
        setIsPageRefresh(false);
      }, 1500);
    } else {
      setIsPageRefresh(false);
    }

    return () => {
      // On component unmount, don't immediately remove the session flag
      // This helps detect actual navigation vs. component unmounting
    };
  }, []);

  // If minimized mode is active
  if (isCallMinimized && callStatus === CallStatus.CONNECTED) {
    return (
      <div
        className="fixed bottom-4 right-4 bg-background border shadow-lg rounded-lg overflow-hidden w-60 z-50"
        onClick={() => toggleMinimized()}
      >
        <div className="p-3 flex items-center justify-between bg-primary">
          <div className="flex items-center space-x-2">
            <span className="animate-pulse text-white">●</span>
            <span className="text-primary-foreground font-medium">
              Call in progress
            </span>
          </div>
          <Maximize2 className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{formatDuration(callDuration)}</span>
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="h-8 w-8"
            onClick={e => {
              e.stopPropagation();
              handleEndCall();
            }}
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Handle call status message and UI
  const getCallStatusContent = () => {
    switch (callStatus) {
      case CallStatus.CHECKING:
      case CallStatus.OFFERING:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage
                src={getParticipantImage()}
                alt={getParticipantName()}
              />
              <AvatarFallback className="text-2xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-white text-xl font-medium mb-2">
              {getParticipantName()}
            </h3>
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2 mb-4">
                <div className="animate-pulse bg-primary/20 h-3 w-3 rounded-full"></div>
                <div className="animate-pulse bg-primary/40 h-3 w-3 rounded-full delay-150"></div>
                <div className="animate-pulse bg-primary/60 h-3 w-3 rounded-full delay-300"></div>
              </div>
              <p className="text-white/70 mb-6">Calling... Please wait</p>
            </div>
            <div className="flex space-x-4">
              <Button variant="destructive" onClick={handleEndCall}>
                Cancel
              </Button>
            </div>
          </div>
        );

      case CallStatus.RINGING:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage
                src={getParticipantImage()}
                alt={getParticipantName()}
              />
              <AvatarFallback className="text-2xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-white text-xl font-medium mb-2">
              {getParticipantName()}
            </h3>
            <div className="animate-bounce mb-6">
              <Phone className="h-10 w-10 text-primary" />
            </div>
            <p className="text-white/70 mb-6">Incoming call... Connecting</p>
            <div className="flex space-x-4">
              <Button variant="destructive" onClick={handleEndCall}>
                Decline
              </Button>
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Answer
              </Button>
            </div>
          </div>
        );

      case CallStatus.CONNECTING:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <div className="h-12 w-12 bg-primary/40 rounded-full flex items-center justify-center">
                  <div className="h-8 w-8 bg-primary rounded-full"></div>
                </div>
              </div>
              <div className="space-y-2 text-center">
                <p className="text-white text-lg">
                  Establishing secure connection...
                </p>
                <p className="text-white/60 text-sm">This may take a moment</p>
              </div>
            </div>
          </div>
        );

      case CallStatus.WAITING:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <div className="flex flex-col items-center mb-4">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage
                  src={getParticipantImage()}
                  alt={getParticipantName()}
                />
                <AvatarFallback className="text-2xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-white text-xl font-medium mb-2">
                {getParticipantName()}
              </h3>
            </div>
            <div className="p-4 bg-yellow-500/20 rounded-md max-w-md mb-6">
              <p className="text-white/90 mb-2 text-center">
                Participant left temporarily... waiting for them to rejoin
              </p>
              <div className="flex justify-center space-x-2">
                <div className="animate-bounce h-2 w-2 bg-yellow-500 rounded-full"></div>
                <div className="animate-bounce h-2 w-2 bg-yellow-500 rounded-full delay-150"></div>
                <div className="animate-bounce h-2 w-2 bg-yellow-500 rounded-full delay-300"></div>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button
                variant="destructive"
                onClick={() => {
                  endCall('user_ended');
                  onClose();
                }}
              >
                End Call
              </Button>
            </div>
          </div>
        );

      case CallStatus.RECONNECTING:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
            <p className="text-white text-lg mb-2">Reconnecting...</p>
            <p className="text-white/60 text-sm mb-6">
              Please wait, attempting to reestablish connection
            </p>
            <Button
              variant="destructive"
              onClick={() => {
                endCall('user_cancelled_reconnect');
                onClose();
              }}
            >
              Cancel
            </Button>
          </div>
        );

      case CallStatus.ERROR:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <div className="rounded-full bg-red-600 p-4 mb-4">
              <PhoneOff className="h-10 w-10 text-white" />
            </div>
            <p className="text-white text-lg mb-2">Call Failed</p>
            <p className="text-white/60 text-sm mb-4">
              There was a problem connecting to the session
            </p>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  onClose();
                }}
                className="bg-transparent text-white border-white/50 hover:bg-white/10"
              >
                Close
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  // Attempt to reconnect if call failed
                  if (currentCall) {
                    reconnectCall().catch(err =>
                      console.error('Error reconnecting call:', err)
                    );
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) {
          if (
            callStatus !== CallStatus.IDLE &&
            callStatus !== CallStatus.ENDED
          ) {
            toggleMinimized();
          } else {
            onClose();
          }
        }
      }}
    >
      <DialogContent className="sm:max-w-full max-w-full w-[90vw] h-[80vh] p-0 border-0 bg-black overflow-hidden">
        <DialogTitle className="sr-only">Video Call</DialogTitle>
        <div
          className="relative w-full h-full flex flex-col"
          onMouseMove={() => setControlsVisible(true)}
        >
          {/* Remote Video (Full Screen) */}
          <div className="absolute inset-0 bg-black">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${
                mediaStatus !== MediaStatus.ACTIVE ||
                callStatus !== CallStatus.CONNECTED
                  ? 'hidden'
                  : ''
              }`}
            />
          </div>

          {/* Status Overlays */}
          {getCallStatusContent()}

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-4 right-4 w-[160px] h-[90px] bg-black/40 rounded-lg overflow-hidden shadow-lg z-10">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                isVideoOff ? 'hidden' : ''
              }`}
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>YOU</AvatarFallback>
                </Avatar>
              </div>
            )}
          </div>

          {/* Call Information Bar */}
          <div
            className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300 z-10 ${
              controlsVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={getParticipantImage()}
                    alt={getParticipantName()}
                  />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-white font-medium">
                    {getParticipantName()}
                  </h3>
                  {callStatus === CallStatus.CONNECTED && (
                    <p className="text-white/70 text-sm">
                      {formatDuration(callDuration)}
                    </p>
                  )}
                </div>
              </div>

              {/* Connection quality indicator */}
              {callStatus === CallStatus.CONNECTED && (
                <div className="flex items-center ml-auto">
                  <div className="flex items-center space-x-1">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        (callStats?.bitrate ?? 0) > 500
                          ? 'bg-green-500'
                          : (callStats?.bitrate ?? 0) > 200
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <div
                      className={`h-2 w-2 rounded-full ${
                        (callStats?.packetLoss ?? 0) < 2
                          ? 'bg-green-500'
                          : (callStats?.packetLoss ?? 0) < 5
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <div
                      className={`h-2 w-2 rounded-full ${
                        (callStats?.jitter ?? 100) < 30
                          ? 'bg-green-500'
                          : (callStats?.jitter ?? 100) < 80
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    />
                  </div>
                  <span className="text-xs text-white/70 ml-2">
                    {(callStats?.bitrate ?? 0) > 500 &&
                    (callStats?.packetLoss ?? 100) < 2
                      ? 'Good'
                      : (callStats?.bitrate ?? 0) > 200 &&
                        (callStats?.packetLoss ?? 100) < 5
                      ? 'Fair'
                      : 'Poor'}{' '}
                    Connection
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Control Bar */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 transition-opacity duration-300 z-10 ${
              controlsVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center justify-center space-x-4">
              {/* Mute button */}
              <Button
                variant="outline"
                size="icon"
                className={`h-12 w-12 rounded-full border-2 ${
                  isMuted
                    ? 'bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700'
                    : 'bg-white/10 backdrop-blur-sm hover:bg-white/20'
                }`}
                onClick={toggleMute}
              >
                {isMuted ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>

              {/* Video toggle button */}
              <Button
                variant="outline"
                size="icon"
                className={`h-12 w-12 rounded-full border-2 ${
                  isVideoOff
                    ? 'bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700'
                    : 'bg-white/10 backdrop-blur-sm hover:bg-white/20'
                }`}
                onClick={toggleVideo}
              >
                {isVideoOff ? (
                  <VideoOff className="h-6 w-6" />
                ) : (
                  <Video className="h-6 w-6" />
                )}
              </Button>

              {/* Connection boost button - only show when needed */}
              {callStatus === CallStatus.CONNECTED &&
                ((callStats?.packetLoss ?? 0) > 5 ||
                  (callStats?.jitter ?? 0) > 80) && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full bg-yellow-600/80 hover:bg-yellow-600 border-2 border-yellow-500 text-white"
                    onClick={() => reconnectCall()}
                    title="Connection issues detected - click to attempt reconnection"
                  >
                    <RefreshCw className="h-6 w-6" />
                  </Button>
                )}

              {/* End call button */}
              <Button
                variant="destructive"
                size="icon"
                className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700"
                onClick={handleEndCall}
                title="End call"
              >
                <PhoneOff className="h-8 w-8" />
              </Button>

              {/* Minimize button */}
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 border-2"
                onClick={toggleMinimized}
              >
                <Minimize2 className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {/* Show controls button when hidden */}
          {!controlsVisible && (
            <button
              className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20 bg-black/50 rounded-full p-1"
              onClick={() => setControlsVisible(true)}
            >
              <ChevronUp className="h-6 w-6 text-white/70" />
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCallModal;
