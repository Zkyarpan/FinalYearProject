'use client';

import React from 'react';
import { useUserStore } from '@/store/userStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCheck, Check } from 'lucide-react';

// Define comprehensive message type
interface MessageProps {
  message: {
    _id: string;
    senderId?: string;
    receiverId?: string;
    content: string;
    isRead: boolean;
    readAt?: string;
    createdAt: string;
    conversation?: string;
    sender?: {
      _id?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      profileImage?: string;
      profilePhotoUrl?: string;
      role?: string;
    };
    receiver?: {
      _id?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      profileImage?: string;
      profilePhotoUrl?: string;
      role?: string;
    };
  };
}

export default function ChatMessage({ message }: MessageProps) {
  const { user } = useUserStore();

  // Safely check if current user is the sender
  const isSender = user?._id === (message.senderId || message.sender?._id);

  // Format time safely (e.g., "2:30 PM")
  const formattedTime = formatMessageTime(message.createdAt);

  // Get avatar image with fallbacks
  const getAvatarImage = () => {
    if (isSender) {
      return user?.profileImage || '';
    } else {
      return (
        message.sender?.profilePhotoUrl || message.sender?.profileImage || ''
      );
    }
  };

  // Get name with fallbacks
  const getSenderName = () => {
    if (isSender) {
      return (
        `${user?.firstName || ''} ${user?.lastName || ''}`.trim() ||
        user?.email ||
        'You'
      );
    } else {
      return (
        `${message.sender?.firstName || ''} ${
          message.sender?.lastName || ''
        }`.trim() ||
        message.sender?.email ||
        'User'
      );
    }
  };

  // Get initials for avatar fallback
  const getInitials = () => {
    if (isSender) {
      if (user?.firstName && user?.lastName) {
        return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
      }
      if (user?.firstName) {
        return user.firstName[0].toUpperCase();
      }
      if (user?.email) {
        return user.email[0].toUpperCase();
      }
      return 'U';
    } else {
      if (message.sender?.firstName && message.sender?.lastName) {
        return `${message.sender.firstName[0]}${message.sender.lastName[0]}`.toUpperCase();
      }
      if (message.sender?.firstName) {
        return message.sender.firstName[0].toUpperCase();
      }
      if (message.sender?.email) {
        return message.sender.email[0].toUpperCase();
      }
      return 'U';
    }
  };

  // Generate unique key to help React with rendering
  const messageKey = `message-${message._id}-${formattedTime}`;

  return (
    <div
      className={`flex mb-4 ${isSender ? 'justify-end' : 'justify-start'}`}
      key={messageKey}
    >
      {/* Only show avatar for other person's messages */}
      {!isSender && (
        <div className="mr-2 flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getAvatarImage()} alt={getSenderName()} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </div>
      )}

      <div
        className={`flex flex-col max-w-[70%] ${
          isSender ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`rounded-lg px-4 py-2 ${
            isSender
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>

        <div className="flex items-center mt-1">
          <span className="text-xs text-muted-foreground">{formattedTime}</span>

          {isSender && (
            <span className="ml-1">
              {message.isRead ? (
                <CheckCheck className="h-3 w-3 text-primary" />
              ) : (
                <Check className="h-3 w-3 text-muted-foreground" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Only show avatar for current user's messages */}
      {isSender && (
        <div className="ml-2 flex-shrink-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getAvatarImage()} alt={getSenderName()} />
            <AvatarFallback>{getInitials()}</AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
}

// Helper function to safely format message time
function formatMessageTime(dateString: string): string {
  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting message time:', error);
    return '';
  }
}
