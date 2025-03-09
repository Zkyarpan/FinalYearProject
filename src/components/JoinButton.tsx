'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';
import { toast } from 'sonner';

interface JoinButtonProps {
  appointment: {
    _id: string;
    canJoin: boolean;
    sessionFormat: 'video' | 'in-person';
  };
  variant?: 'default' | 'compact' | 'icon';
  className?: string;
}

const JoinButton: React.FC<JoinButtonProps> = ({
  appointment,
  variant = 'default',
  className = '',
}) => {
  if (!appointment || appointment.sessionFormat !== 'video') {
    return null;
  }

  const handleJoinSession = () => {
    if (!appointment.canJoin) {
      toast.info(
        'Session is not available to join yet. Please wait until 5 minutes before the appointment.'
      );
      return;
    }
    
    // You can replace this with actual join session logic
    toast.info('Joining video session...');
    // You might want to redirect to a video call page or open a modal
    // window.location.href = `/video-call/${appointment._id}`;
  };

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={`rounded-full h-8 w-8 ${appointment.canJoin ? 'text-green-500 hover:text-green-400 hover:bg-green-500/10' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'} ${className}`}
        onClick={handleJoinSession}
        disabled={!appointment.canJoin}
        aria-label="Join video session"
        title={appointment.canJoin ? "Join video session" : "Available 5 minutes before appointment"}
      >
        <Video className="h-4 w-4" />
      </Button>
    );
  }

  if (variant === 'compact') {
    return (
      <Button
        size="sm"
        className={`px-2 py-1 h-7 text-xs font-medium ${className}`}
        onClick={handleJoinSession}
        disabled={!appointment.canJoin}
      >
        <Video className="h-3 w-3 mr-1" />
        {appointment.canJoin ? 'Join' : 'Soon'}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      className={`bg-primary text-primary-foreground hover:bg-primary/90 ${className}`}
      onClick={handleJoinSession}
      disabled={!appointment.canJoin}
    >
      {appointment.canJoin ? 'Join Session' : 'Join Soon'}
    </Button>
  );
};

export default JoinButton;