'use client';

import React, { useEffect, useState } from 'react';
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

interface VideoCallModalProps {
  open: boolean;
  onClose: () => void;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({ open, onClose }) => {
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
    toggleMinimized,
    isCallMinimized,
    sessionTimeRemaining,
  } = useVideoCall();

  const [controlsVisible, setControlsVisible] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  // Auto-hide controls after inactivity
  // Ensure video elements get the streams properly
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }

    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      setControlsVisible(true);

      timer = setTimeout(() => {
        if (callStatus === CallStatus.CONNECTED) {
          setControlsVisible(false);
        }
      }, 5000); // Hide after 5 seconds of inactivity
    };

    // Set up initial timer
    resetTimer();

    // Set up event listeners for mouse movement and touches
    const handleActivity = () => resetTimer();
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('touchstart', handleActivity);

    // Cleanup
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('touchstart', handleActivity);
    };
  }, [callStatus]);

  // Call duration timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    if (callStatus === CallStatus.CONNECTED) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

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
              endCall();
              onClose();
            }}
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Get participant details
  const getParticipantName = () => {
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
  };

  // Get participant profile image
  const getParticipantImage = () => {
    if (!currentCall) return '';

    const participant =
      callStatus === CallStatus.RINGING ||
      (currentCall.initiator.userId !== currentCall.receiver.userId &&
        currentCall.initiator.firstName)
        ? currentCall.receiver
        : currentCall.initiator;

    return participant.profileImage || '';
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    const name = getParticipantName();
    return (
      name
        .split(' ')
        .map(part => part[0] || '')
        .join('')
        .toUpperCase()
        .substring(0, 2) || 'US'
    );
  };

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
            <p className="text-white/70 mb-6">Calling...</p>
            <div className="flex space-x-4">
              <Button
                variant="destructive"
                onClick={() => {
                  endCall();
                  onClose();
                }}
              >
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
            <p className="text-white/70 mb-6">Incoming call...</p>
            <div className="flex space-x-4">
              <Button
                variant="destructive"
                onClick={() => {
                  endCall();
                  onClose();
                }}
              >
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
              <p className="text-white text-lg">Connecting...</p>
            </div>
          </div>
        );

      case CallStatus.RECONNECTING:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
            <p className="text-white text-lg">Reconnecting...</p>
          </div>
        );

      case CallStatus.ERROR:
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <div className="rounded-full bg-red-600 p-4 mb-4">
              <PhoneOff className="h-10 w-10 text-white" />
            </div>
            <p className="text-white text-lg mb-4">Call Failed</p>
            <Button
              variant="outline"
              onClick={() => {
                onClose();
              }}
            >
              Close
            </Button>
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

              {sessionTimeRemaining > 0 && (
                <Badge
                  variant="outline"
                  className="border-yellow-500 text-yellow-500"
                >
                  <Clock className="mr-1 h-3 w-3" />
                  <span>{sessionTimeRemaining} min remaining</span>
                </Badge>
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
              <Button
                variant="destructive"
                size="icon"
                className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700"
                onClick={() => {
                  endCall();
                  onClose();
                }}
              >
                <PhoneOff className="h-8 w-8" />
              </Button>
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
