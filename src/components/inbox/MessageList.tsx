'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquare, Check, CheckCheck } from 'lucide-react';
import { formatTime } from '@/helpers/formatTime';
import { Message, Psychologist } from '@/app/(sections)/inbox/types';
import CallSummaryMessage from '@/components/CallSummary';

interface MessageListProps {
  messages: Message[];
  loadingMessages: boolean;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  user: any;
  selectedPsychologist: Psychologist | null;
  isPsychologist: boolean;
  loadMoreMessages: () => void;
  hasMoreMessages: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  loadingMessages,
  messagesContainerRef,
  messagesEndRef,
  user,
  selectedPsychologist,
  isPsychologist,
  loadMoreMessages,
  hasMoreMessages,
}) => {
  // Get initials for avatar fallback
  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName && !lastName) return '??';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`;
  };

  // Determine if we should show the avatar for this message
  function shouldShowAvatar(
    message: Message,
    index: number,
    messages: Message[]
  ) {
    // Always show avatar for the first message
    if (index === 0) return true;

    // Get the previous message
    const previousMessage = messages[index - 1];

    // Show avatar if sender changes
    if (previousMessage.senderId !== message.senderId) return true;

    // Show avatar if more than 5 minutes have passed since previous message
    const timeDiff =
      new Date(message.createdAt).getTime() -
      new Date(previousMessage.createdAt).getTime();
    if (timeDiff > 5 * 60 * 1000) return true;

    // Don't show avatar for consecutive messages from same sender within 5 minutes
    return false;
  }

  // Check if a message is a call summary
  const isCallSummary = (content: string): any => {
    try {
      const data = JSON.parse(content);
      if (data.type === 'call_summary' && data.callType && data.duration) {
        return data;
      }
      return null;
    } catch {
      return null;
    }
  };

  return (
    <div
      className="flex-1 overflow-y-auto scrollbar-hide p-4"
      ref={messagesContainerRef}
      onScroll={e => {
        const container = e.currentTarget;
        if (container.scrollTop < 50 && hasMoreMessages && !loadingMessages) {
          loadMoreMessages();
        }
      }}
    >
      {/* Date separator */}
      <div className="flex justify-center my-4">
        <div className="px-2 py-1 bg-[#1a1a1a] rounded-md text-xs text-gray-500">
          {new Date().toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      </div>

      {loadingMessages && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
        </div>
      )}

      {messages.length === 0 && !loadingMessages ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <MessageSquare className="h-10 w-10 text-gray-600 mb-3" />
          <h3 className="font-medium text-gray-300 mb-1">No messages yet</h3>
          <p className="text-sm text-gray-500">
            Send a message to start the conversation
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((message, index) => {
            const isCurrentUser = message.senderId === user?._id;
            const showAvatar = shouldShowAvatar(message, index, messages);

            // Check if this is a call summary message
            const callData = isCallSummary(message.content);

            // Render call summary differently
            if (callData) {
              return (
                <CallSummaryMessage
                  key={`${message._id}-${index}`}
                  callData={callData}
                  timestamp={message.createdAt}
                  isCurrentUser={callData.initiator === user?._id}
                  otherUserName={selectedPsychologist?.firstName || 'User'}
                />
              );
            }

            // Regular message
            return (
              <div
                key={`${message._id}-${index}`}
                className={`flex ${
                  isCurrentUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isCurrentUser && showAvatar && (
                  <Avatar className="h-8 w-8 mr-2 flex-shrink-0 self-end">
                    <AvatarImage
                      src={
                        selectedPsychologist?.image ||
                        selectedPsychologist?.profilePhotoUrl ||
                        ''
                      }
                      alt={`${selectedPsychologist?.firstName} ${selectedPsychologist?.lastName}`}
                    />
                    <AvatarFallback className="bg-[#1e293b] text-gray-300 text-xs">
                      {getInitials(
                        selectedPsychologist?.firstName,
                        selectedPsychologist?.lastName
                      )}
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-md flex flex-col ${
                    !showAvatar && !isCurrentUser ? 'ml-10' : ''
                  }`}
                >
                  <div
                    className={`px-3 py-1.5 rounded-md ${
                      isCurrentUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#2a2a2a] text-gray-300'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>

                  <div
                    className={`flex items-center mt-1 ${
                      isCurrentUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span className="text-xs text-gray-500">
                      {formatTime(message.createdAt)}
                    </span>
                    {isCurrentUser && (
                      <span className="ml-1">
                        {message.isRead ? (
                          <CheckCheck className="h-3 w-3 text-blue-500" />
                        ) : message._id.startsWith('temp-') ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3 text-gray-500" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {isCurrentUser && showAvatar && (
                  <Avatar className="h-8 w-8 ml-2 flex-shrink-0 self-end">
                    <AvatarImage
                      src={user.image || ''}
                      alt={`${user.firstName} ${user.lastName}`}
                    />
                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                      {getInitials(user.firstName, user.lastName)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default MessageList;
