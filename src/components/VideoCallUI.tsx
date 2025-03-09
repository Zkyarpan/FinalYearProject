'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useVideoCall, formatCallDuration } from '@/contexts/VideoCallContext';
import {
  PhoneOff,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// SPECIALIZED CHROME AUTOPLAY FIX
const VideoCallUI: React.FC = () => {
  const {
    currentCall,
    callStatus,
    localStream,
    remoteStream,
    callDuration,
    isMuted,
    isVideoOff,
    remoteIsMuted,
    remoteIsVideoOff,
    endCall,
    toggleMute,
    toggleVideo,
  } = useVideoCall();

  // Refs for videos and canvas fallback
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // State for canvas fallback mode
  const [useCanvasFallback, setUseCanvasFallback] = useState<boolean>(false);
  const [canvasActive, setCanvasActive] = useState<boolean>(false);

  // Create an animation frame ID ref for the canvas rendering
  const animationFrameId = useRef<number | null>(null);

  // Simple console logger
  const log = (msg: string) => console.log(`[VideoCall] ${msg}`);

  // Helper to check if running on Chrome/Edge
  const isChromium = () => {
    return !!(
      window.navigator.userAgent.match(/Chrome\//) ||
      window.navigator.userAgent.match(/Edge\//)
    );
  };

  // LOCAL VIDEO SETUP - simple direct approach
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      try {
        localVideoRef.current.srcObject = localStream;
        // Always mute local video to avoid echo
        localVideoRef.current.muted = true;
      } catch (error) {
        log(`Error setting local video: ${error}`);
      }
    }
  }, [localStream]);

  // CANVAS FALLBACK RENDERING FUNCTION
  const renderVideoToCanvas = () => {
    if (
      !canvasRef.current ||
      !remoteVideoRef.current ||
      !remoteStream ||
      !canvasActive
    ) {
      return;
    }

    try {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      const video = remoteVideoRef.current;

      // Only draw if video is actually playing and has dimensions
      if (video.videoWidth && video.videoHeight) {
        // Match canvas size to video
        canvasRef.current.width = video.videoWidth;
        canvasRef.current.height = video.videoHeight;

        // Draw video frame to canvas
        ctx.drawImage(
          video,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }

      // Continue animation loop
      animationFrameId.current = requestAnimationFrame(renderVideoToCanvas);
    } catch (error) {
      log(`Canvas rendering error: ${error}`);
    }
  };

  // Initialize canvas fallback for Chrome if needed
  useEffect(() => {
    if (
      useCanvasFallback &&
      remoteStream &&
      canvasRef.current &&
      remoteVideoRef.current
    ) {
      try {
        // Start canvas rendering loop
        setCanvasActive(true);
        renderVideoToCanvas();
      } catch (error) {
        log(`Error initializing canvas: ${error}`);
      }
    }

    // Clean up animation on unmount or when fallback disabled
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      setCanvasActive(false);
    };
  }, [useCanvasFallback, remoteStream]);

  // REMOTE VIDEO SETUP - Chrome-specific approach
  useEffect(() => {
    if (!remoteVideoRef.current || !remoteStream) return;

    // SPECIAL FIX FOR CHROME: Use global document variable to help with autoplay
    log('Setting up remote stream - Chrome-specific method');

    try {
      // CRITICAL: First completely disconnect
      remoteVideoRef.current.srcObject = null;

      // Short delay before reconnecting
      setTimeout(() => {
        if (!remoteVideoRef.current || !remoteStream) return;

        // IMPORTANT: First attempt muted playback (more likely to work)
        remoteVideoRef.current.muted = true;
        remoteVideoRef.current.srcObject = remoteStream;

        // APPROACH 1: Try direct play with specific attributes
        remoteVideoRef.current.setAttribute('autoplay', '');
        remoteVideoRef.current.setAttribute('playsinline', '');

        // Set volume to 0 initially
        remoteVideoRef.current.volume = 0;

        // Now try to play
        const playPromise = remoteVideoRef.current.play();

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              log('Remote video playing successfully (muted)');

              // If successfully playing, try to unmute after a delay
              setTimeout(() => {
                if (remoteVideoRef.current && !remoteIsMuted) {
                  // Gradually increase volume to avoid abrupt sound
                  remoteVideoRef.current.volume = 0.1;
                  setTimeout(() => {
                    if (remoteVideoRef.current) {
                      remoteVideoRef.current.volume = 0.5;
                      setTimeout(() => {
                        if (remoteVideoRef.current) {
                          remoteVideoRef.current.volume = 1.0;
                          remoteVideoRef.current.muted = false;
                        }
                      }, 500);
                    }
                  }, 500);
                }
              }, 1000);
            })
            .catch(error => {
              log(`Autoplay failed despite being muted: ${error.message}`);

              // If normal play fails even with muted, use canvas fallback
              if (isChromium()) {
                log('Switching to canvas fallback for Chrome');
                setUseCanvasFallback(true);
              }
            });
        }
      }, 100);
    } catch (error) {
      log(`Error in remote video setup: ${error}`);

      // Fallback to canvas if error occurs
      setUseCanvasFallback(true);
    }
  }, [remoteStream, remoteIsMuted]);

  // Function to manually start video playback
  const manualPlay = () => {
    log('Manual play attempt');

    try {
      if (remoteVideoRef.current && remoteStream) {
        // Create a brand new video element
        const newVideo = document.createElement('video');
        newVideo.autoplay = true;
        newVideo.playsInline = true;
        newVideo.muted = true;
        newVideo.style.width = '100%';
        newVideo.style.height = '100%';
        newVideo.style.objectFit = 'cover';

        // Set srcObject before adding to DOM
        newVideo.srcObject = remoteStream;

        // Replace existing video
        if (remoteVideoRef.current.parentNode) {
          remoteVideoRef.current.parentNode.replaceChild(
            newVideo,
            remoteVideoRef.current
          );
          remoteVideoRef.current = newVideo;

          // Play with user gesture
          const playPromise = newVideo.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                log('Manual play successful');

                // Try canvas fallback if in Chrome
                if (isChromium()) {
                  setUseCanvasFallback(true);
                }

                // Try to unmute after playing
                setTimeout(() => {
                  if (newVideo && !remoteIsMuted) {
                    // Gradually unmute
                    newVideo.volume = 0;
                    newVideo.muted = false;

                    setTimeout(() => {
                      newVideo.volume = 0.5;
                      setTimeout(() => {
                        newVideo.volume = 1.0;
                      }, 500);
                    }, 500);
                  }
                }, 1000);
              })
              .catch(e => {
                log(`Manual play also failed: ${e.message}`);
                toast.error('Browser blocked video - try refreshing');

                // Last resort - use canvas
                setUseCanvasFallback(true);
              });
          }
        }
      }
    } catch (error) {
      log(`Error in manual play: ${error}`);
      setUseCanvasFallback(true);
    }
  };

  // Don't render if no active call
  if (!currentCall) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Status bar */}
      <div className="bg-gray-900 p-2 flex justify-between items-center">
        <div className="text-white">
          {callStatus === 'connected' ? (
            <span className="text-green-400">
              Connected: {formatCallDuration(callDuration)}
            </span>
          ) : (
            <span className="text-yellow-400">{callStatus}...</span>
          )}
        </div>

        <Button
          onClick={() => setUseCanvasFallback(!useCanvasFallback)}
          variant="ghost"
          size="sm"
          className="bg-blue-700 text-white text-xs"
        >
          <RefreshCw size={12} className="mr-1" /> Refresh
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 relative bg-black">
        {/* Remote video */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Normal video element (hidden if using canvas fallback) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: useCanvasFallback ? 'none' : 'block',
            }}
          />

          {/* Canvas fallback (hidden unless activated) */}
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: useCanvasFallback ? 'block' : 'none',
            }}
          />

          {/* Overlay for video off or not connected */}
          {(remoteIsVideoOff || callStatus !== 'connected') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <VideoOff size={48} className="mb-4 text-gray-400" />
              <p className="text-xl text-gray-300">
                {callStatus !== 'connected'
                  ? 'Connecting...'
                  : 'Camera turned off'}
              </p>
            </div>
          )}

          {/* Manual play button */}
          {callStatus === 'connected' &&
            !remoteIsVideoOff &&
            !useCanvasFallback && (
              <button
                onClick={manualPlay}
                className="absolute py-3 px-6 bg-blue-600 text-white rounded-lg z-10 hover:bg-blue-700"
              >
                Click to Play Video
              </button>
            )}
        </div>

        {/* Local video */}
        <div className="absolute bottom-20 right-4 w-32 h-40 rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isVideoOff ? 'none' : 'block',
            }}
          />

          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center">
              <VideoOff size={20} className="text-gray-400" />
            </div>
          )}

          {isMuted && (
            <div className="absolute bottom-1 left-1 bg-red-500 rounded-full p-1">
              <MicOff size={12} className="text-white" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4 flex justify-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full h-12 w-12 ${
            isMuted ? 'bg-red-600 text-white' : 'bg-gray-700 text-white'
          }`}
          onClick={toggleMute}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </Button>

        <Button
          variant="destructive"
          size="icon"
          className="rounded-full h-14 w-14"
          onClick={() => {
            endCall();
            toast.info('Call ended');
          }}
        >
          <PhoneOff size={24} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={`rounded-full h-12 w-12 ${
            isVideoOff ? 'bg-red-600 text-white' : 'bg-gray-700 text-white'
          }`}
          onClick={toggleVideo}
        >
          {isVideoOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-12 w-12 bg-blue-700 text-white"
          onClick={() => {
            manualPlay();
            setUseCanvasFallback(!useCanvasFallback);
          }}
        >
          <RefreshCw size={20} />
        </Button>
      </div>
    </div>
  );
};

export default VideoCallUI;
